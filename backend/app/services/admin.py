"""Super Admin service — provision organizations (Flow B) and list them"""

import asyncio
import secrets

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
