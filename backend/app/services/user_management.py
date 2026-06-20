"""Org Admin user management service (Flow C) — invite, list, deactivate/reactivate"""

import secrets

from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.user import User
from app.repositories.user import UserRepository
from app.repositories.organization import OrganizationRepository
from app.core.security import get_password_hash
from app.middleware.exceptions import ConflictError, NotFoundError, BadRequestError
from app.schemas.user_management import InviteUserRequest


async def invite_user(
    db: AsyncSession,
    *,
    current_user: User,
    payload: InviteUserRequest,
) -> User:
    """Invite a teammate into the current user's organization.

    The invitee gets a normal user row with an unusable random password hash
    and is_verified=False (set by UserRepository.create) until they accept the
    invite via POST /auth/accept-invite.

    Raises:
        ConflictError: Email or username already taken.
    """
    if await UserRepository.get_by_email(db, payload.email):
        raise ConflictError(f"The email address '{payload.email}' is already registered.")

    if await UserRepository.get_by_username(db, payload.username):
        raise ConflictError(f"The username '{payload.username}' is already taken.")

    placeholder_hash = get_password_hash(secrets.token_urlsafe(32))

    user = await UserRepository.create(
        db,
        email=payload.email,
        username=payload.username,
        full_name=payload.full_name,
        hashed_password=placeholder_hash,
        organization_id=current_user.organization_id,
        role=payload.role,
        is_superuser=False,
    )

    org = await OrganizationRepository.get_by_id(db, current_user.organization_id)
    await db.commit()
    await db.refresh(user)

    logger.info(
        f"User '{current_user.username}' invited '{user.email}' (role={user.role.value}) "
        f"into org_id={current_user.organization_id}."
    )

    import asyncio
    from app.utils.email import send_invite_email

    asyncio.create_task(
        send_invite_email(
            to_email=user.email,
            full_name=user.full_name or user.username,
            org_name=org.name if org else "your organization",
            role=user.role.value,
            user_id=user.id,
        )
    )

    return user


async def list_org_users(
    db: AsyncSession,
    *,
    current_user: User,
    page: int,
    page_size: int,
) -> tuple[list[User], int]:
    """List users in the current user's organization, paginated."""
    return await UserRepository.list_by_organization(
        db,
        current_user.organization_id,
        page=page,
        page_size=page_size,
    )


async def set_user_active(
    db: AsyncSession,
    *,
    current_user: User,
    target_public_id,
    active: bool,
) -> User:
    """Deactivate or reactivate a user in the current admin's organization.

    Raises:
        NotFoundError: Target user doesn't exist or belongs to a different org
            (deliberately the same error in both cases — don't leak cross-tenant
            existence).
        BadRequestError: Admin tried to deactivate their own account.
    """
    target = await UserRepository.get_by_public_id(db, target_public_id)
    if not target or target.organization_id != current_user.organization_id:
        raise NotFoundError("User not found.")

    if not active and target.id == current_user.id:
        raise BadRequestError("You cannot deactivate your own account.")

    updated = await UserRepository.set_active(db, target.id, active=active)
    await db.commit()
    await db.refresh(updated)
    return updated
