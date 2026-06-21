"""Super Admin service — provision organizations (Flow B) and list them"""

import asyncio
import secrets
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.organization import Organization
from app.models.user import User, UserRole
from app.repositories.organization import OrganizationRepository
from app.repositories.user import UserRepository
from app.repositories.trial_registry import TrialRegistryRepository
from app.core.security import get_password_hash
from app.middleware.exceptions import ConflictError
from app.schemas.admin import CreateOrganizationRequest
from app.utils.email import send_invite_email


async def create_organization(
    db: AsyncSession,
    payload: CreateOrganizationRequest,
) -> tuple[Organization, User]:
    """Provision a new organization + its first (invite-based) admin user.

    Same shape as services/onboarding.py:onboard_organization, except:
      - the admin is invited (no password collected here — they set one via
        POST /auth/accept-invite), and
      - the trial-abuse registry is NOT a gate here (a Super Admin is acting
        intentionally) but a record is still written if one doesn't already
        exist, so a future self-service signup for that email stays blocked.

    Raises:
        ConflictError: Org name / email / username already exists.
    """
    if await OrganizationRepository.get_by_name(db, payload.organization.name):
        raise ConflictError(f"An organization named '{payload.organization.name}' already exists.")

    if await UserRepository.get_by_email(db, payload.admin.email):
        raise ConflictError(f"The email address '{payload.admin.email}' is already registered.")

    if await UserRepository.get_by_username(db, payload.admin.username):
        raise ConflictError(f"The username '{payload.admin.username}' is already taken.")

    org = await OrganizationRepository.create(
        db,
        name=payload.organization.name,
        location=payload.organization.location,
        others=payload.organization.metadata or {},
    )

    placeholder_hash = get_password_hash(secrets.token_urlsafe(32))
    admin_user = await UserRepository.create(
        db,
        email=payload.admin.email,
        username=payload.admin.username,
        full_name=payload.admin.full_name,
        hashed_password=placeholder_hash,
        organization_id=org.id,
        role=UserRole.ADMIN,
        is_superuser=False,
    )

    # Bypass the trial-abuse gate, but still record it if not already present.
    if not await TrialRegistryRepository.exists_by_email(db, payload.admin.email):
        await TrialRegistryRepository.create(
            db,
            email=payload.admin.email,
            organization_name=org.name,
        )

    await db.commit()
    await db.refresh(org)
    await db.refresh(admin_user)

    logger.info(
        f"Super Admin provisioned org='{org.name}' (id={org.id}) with admin='{admin_user.username}'."
    )

    asyncio.create_task(
        send_invite_email(
            to_email=admin_user.email,
            full_name=admin_user.full_name or admin_user.username,
            org_name=org.name,
            role=admin_user.role.value,
            user_id=admin_user.id,
        )
    )

    return org, admin_user


async def list_organizations(
    db: AsyncSession,
    *,
    page: int,
    page_size: int,
    search: str | None = None,
) -> tuple[list[Organization], int]:
    """List organizations for the Super Admin console, paginated and optionally searched."""
    return await OrganizationRepository.list_all(db, page=page, page_size=page_size, search=search)


async def get_admin_stats(db: AsyncSession) -> dict:
    """Calculate platform-wide statistics for the Super Admin dashboard."""
    from sqlalchemy import func, select
    from datetime import datetime, timezone
    from app.models.user import User
    from app.models.organization import Organization

    # 1. Total Organizations
    total_orgs_query = select(func.count(Organization.id))
    total_orgs_res = await db.execute(total_orgs_query)
    total_organizations = total_orgs_res.scalar_one()

    # 2. Active Trials
    now = datetime.now(timezone.utc)
    active_trials_query = select(func.count(Organization.id)).where(
        Organization.subscription_status == "trial",
        Organization.trial_expires_at > now
    )
    active_trials_res = await db.execute(active_trials_query)
    active_trials = active_trials_res.scalar_one()

    # 3. Total Users across all organizations
    total_users_query = select(func.count(User.id)).where(
        User.organization_id.isnot(None)
    )
    total_users_res = await db.execute(total_users_query)
    total_users = total_users_res.scalar_one()

    # 4. Average Seat Density
    if total_organizations > 0:
        avg_users_per_org = round(total_users / total_organizations, 1)
    else:
        avg_users_per_org = 0.0

    # 5. Inactive Organizations
    inactive_orgs_query = select(func.count(Organization.id)).where(
        Organization.is_active == False
    )
    inactive_orgs_res = await db.execute(inactive_orgs_query)
    inactive_organizations = inactive_orgs_res.scalar_one()

    # 6. Expired Trials
    expired_trials_query = select(func.count(Organization.id)).where(
        (Organization.subscription_status == "expired") | 
        ((Organization.subscription_status == "trial") & (Organization.trial_expires_at <= now))
    )
    expired_trials_res = await db.execute(expired_trials_query)
    expired_trials = expired_trials_res.scalar_one()

    # 7. Paid Organizations
    paid_orgs_query = select(func.count(Organization.id)).where(
        Organization.plan_id.isnot(None),
        Organization.subscription_status.notin_(["trial", "expired"])
    )
    paid_orgs_res = await db.execute(paid_orgs_query)
    paid_organizations = paid_orgs_res.scalar_one()

    # 8. Paid User Count (Users inside paid organizations)
    paid_users_query = select(func.count(User.id)).join(Organization).where(
        Organization.plan_id.isnot(None),
        Organization.subscription_status.notin_(["trial", "expired"])
    )
    paid_users_res = await db.execute(paid_users_query)
    paid_users = paid_users_res.scalar_one()

    return {
        "total_organizations": total_organizations,
        "active_trials": active_trials,
        "total_users": total_users,
        "avg_users_per_org": avg_users_per_org,
        "inactive_organizations": inactive_organizations,
        "expired_trials": expired_trials,
        "paid_organizations": paid_organizations,
        "paid_users": paid_users,
    }


async def delete_organization(
    db: AsyncSession,
    *,
    public_id: uuid.UUID,
) -> Organization:
    """Permanently delete an organization and all its related records.

    This deletes:
      1. Refresh tokens of all users in the organization
      2. AI usage counters of the organization
      3. All user accounts in the organization
      4. The organization itself
    """
    from sqlalchemy import select, delete
    from app.models.refresh_token import RefreshToken
    from app.models.ai_usage import AIUsageCounter
    from app.models.user import User
    from app.repositories.organization import OrganizationRepository
    from app.middleware.exceptions import NotFoundError

    org = await OrganizationRepository.get_by_public_id(db, public_id)
    if not org:
        raise NotFoundError(f"Organization with ID '{public_id}' not found.")

    # 1. Fetch user IDs belonging to this organization
    result = await db.execute(
        select(User.id).where(User.organization_id == org.id)
    )
    user_ids = [row[0] for row in result.all()]

    # 2. Delete refresh tokens for those users
    if user_ids:
        await db.execute(
            delete(RefreshToken).where(RefreshToken.user_id.in_(user_ids))
        )

    # 3. Delete AI usage counters for the organization
    await db.execute(
        delete(AIUsageCounter).where(AIUsageCounter.organization_id == org.id)
    )

    # 4. Delete all users belonging to this organization
    await db.execute(
        delete(User).where(User.organization_id == org.id)
    )

    # 5. Delete the organization
    await db.delete(org)
    await db.commit()

    logger.info(f"Super Admin permanently deleted organization '{org.name}' (id={org.id}) and all associated records.")
    return org

