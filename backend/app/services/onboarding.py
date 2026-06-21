"""Onboarding service — orchestrates atomic organization + admin user creation"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.repositories.organization import OrganizationRepository
from app.repositories.user import UserRepository
from app.repositories.trial_registry import TrialRegistryRepository
from app.models.user import UserRole
from app.core.security import get_password_hash
from app.middleware.exceptions import ConflictError
from app.schemas.onboarding import (
    OnboardRequest,
    OnboardResponse,
    OnboardData,
    OrgPublic,
    UserPublic,
)
from app.utils.password import validate_password_strength
from app.utils.email import send_verification_email


async def onboard_organization(
    db: AsyncSession,
    payload: OnboardRequest,
) -> OnboardResponse:
    """Atomically create a new tenant organization and its first admin user.

    Flow:
    1. Validate password strength
    2. Check uniqueness of org name, email, and username, and trial registry
    3. Insert Organization (flush only, no commit yet)
    4. Hash password
    5. Insert User linked to the org (flush only)
    6. Record email in the trial email registry (flush only)
    7. Commit the full transaction
    8. Dispatch verification email in the background (non-blocking)

    Raises:
        BadRequestError:  Password does not meet strength requirements.
        ConflictError:    Org name / email / username already exists, or email already used a trial.
    """

    # ── 1. Password strength ──────────────────────────────────────────────────
    validate_password_strength(payload.admin_user.password)

    # ── 2. Uniqueness checks ──────────────────────────────────────────────────
    if await TrialRegistryRepository.exists_by_email(db, payload.admin_user.email):
        raise ConflictError(
            f"The email address '{payload.admin_user.email}' has already consumed its free trial and cannot be registered again."
        )

    if await OrganizationRepository.get_by_name(db, payload.organization.name):
        raise ConflictError(
            f"An organization named '{payload.organization.name}' already exists."
        )

    if await UserRepository.get_by_email(db, payload.admin_user.email):
        raise ConflictError(
            f"The email address '{payload.admin_user.email}' is already registered."
        )

    if await UserRepository.get_by_username(db, payload.admin_user.username):
        raise ConflictError(
            f"The username '{payload.admin_user.username}' is already taken."
        )

    # ── 3. Create Organization ────────────────────────────────────────────────
    org = await OrganizationRepository.create(
        db,
        name=payload.organization.name,
        location=payload.organization.location,
        others=payload.organization.metadata or {},
    )

    from app.repositories.plan import PlanRepository
    from app.models.plan import PlanTier
    free_plan = await PlanRepository.get_by_tier(db, PlanTier.FREE)
    if free_plan:
        org.plan_id = free_plan.id

    # ── 4. Hash password ──────────────────────────────────────────────────────
    hashed_pw = get_password_hash(payload.admin_user.password)

    # ── 5. Create Admin User ──────────────────────────────────────────────────
    user = await UserRepository.create(
        db,
        email=payload.admin_user.email,
        username=payload.admin_user.username,
        full_name=payload.admin_user.full_name,
        hashed_password=hashed_pw,
        organization_id=org.id,
        role=UserRole.ADMIN,
        is_superuser=False,
        others=payload.admin_user.metadata or {},
    )

    # ── 5.5 Record trial registration ─────────────────────────────────────────
    await TrialRegistryRepository.create(
        db,
        email=payload.admin_user.email,
        organization_name=payload.organization.name,
    )

    # ── 6. Commit transaction ─────────────────────────────────────────────────
    await db.commit()
    
    from sqlalchemy.future import select
    from sqlalchemy.orm import selectinload
    from app.models.organization import Organization
    
    # Reload organization with plan & users relationship loaded to avoid lazy loading errors
    stmt = (
        select(Organization)
        .options(selectinload(Organization.plan), selectinload(Organization.users))
        .where(Organization.id == org.id)
    )
    res = await db.execute(stmt)
    org = res.scalar_one()
    
    await db.refresh(user)

    logger.info(
        f"Onboarding complete — org='{org.name}' (id={org.id}), "
        f"admin='{user.username}' (id={user.id})"
    )

    # ── 7. Verification email (fire-and-forget, never blocks the response) ───
    asyncio.create_task(
        send_verification_email(
            to_email=user.email,
            full_name=user.full_name or user.username,
            user_id=user.id,
        )
    )

    return OnboardResponse(
        success=True,
        message=(
            f"Organization '{org.name}' has been created. "
            "Please check your email to verify your account before logging in."
        ),
        data=OnboardData(
            organization=OrgPublic.model_validate(org),
            admin_user=UserPublic.model_validate(user),
        ),
    )
