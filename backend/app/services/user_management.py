"""Org Admin user management service (Flow C) — invite, list, deactivate/reactivate"""

import secrets
import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.user import User
from app.repositories.user import UserRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.plan import PlanRepository
from app.models.plan import PlanTier
from app.core.security import get_password_hash
from app.middleware.exceptions import ConflictError, NotFoundError, BadRequestError
from app.schemas.user_management import InviteUserRequest, UpdateUserRequest, BulkDeleteUsersRequest


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
    # ── Enforce Plan User Limit ──────────────────────────────────────────────
    org = await OrganizationRepository.get_by_id(db, current_user.organization_id)
    user_limit = 10  # default fallback
    if org:
        if org.plan_id:
            plan = await PlanRepository.get_by_id(db, org.plan_id)
            if plan:
                user_limit = plan.user_limit
        else:
            free_plan = await PlanRepository.get_by_tier(db, PlanTier.FREE)
            if free_plan:
                user_limit = free_plan.user_limit

    if user_limit is not None:
        current_users = await UserRepository.count_by_organization(db, current_user.organization_id)
        if current_users >= user_limit:
            raise BadRequestError(f"Seat limit of {user_limit} reached for your current plan. Please upgrade to invite more users.")

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
    """List users in the organization (or all users if superuser), paginated."""
    if current_user.is_superuser:
        from sqlalchemy import func
        from sqlalchemy.future import select

        count_result = await db.execute(select(func.count()).select_from(User))
        total = count_result.scalar_one()

        result = await db.execute(
            select(User)
            .order_by(User.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total
    else:
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
    """Deactivate or reactivate a user.

    Raises:
        NotFoundError: Target user doesn't exist or belongs to a different org.
        BadRequestError: Admin tried to deactivate their own account.
    """
    target = await UserRepository.get_by_public_id(db, target_public_id)
    if not target:
        raise NotFoundError("User not found.")
    if not current_user.is_superuser and target.organization_id != current_user.organization_id:
        raise NotFoundError("User not found.")

    if not active and target.id == current_user.id:
        raise BadRequestError("You cannot deactivate your own account.")

    updated = await UserRepository.set_active(db, target.id, active=active)
    await db.commit()
    await db.refresh(updated)
    return updated


async def delete_org_user(
    db: AsyncSession,
    *,
    current_user: User,
    target_public_id: uuid.UUID,
) -> User:
    """Delete a user.

    Raises:
        NotFoundError: Target user doesn't exist or belongs to a different org.
        BadRequestError: Admin tried to delete their own account.
    """
    target = await UserRepository.get_by_public_id(db, target_public_id)
    if not target:
        raise NotFoundError("User not found.")
    if not current_user.is_superuser and target.organization_id != current_user.organization_id:
        raise NotFoundError("User not found.")

    if target.id == current_user.id:
        raise BadRequestError("You cannot delete your own account.")

    # Delete related refresh tokens first to prevent foreign key issues
    from app.models.refresh_token import RefreshToken
    from sqlalchemy import delete
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == target.id))

    await UserRepository.delete(db, target)
    await db.commit()
    return target


async def update_org_user(
    db: AsyncSession,
    *,
    current_user: User,
    target_public_id: uuid.UUID,
    payload: UpdateUserRequest,
) -> User:
    """Update a user's details (username, email, full_name, role).

    If current_user is not a superuser, the target user must belong to their organization.
    """
    target = await UserRepository.get_by_public_id(db, target_public_id)
    if not target:
        raise NotFoundError("User not found.")

    if not current_user.is_superuser and target.organization_id != current_user.organization_id:
        raise NotFoundError("User not found.")

    if payload.email and payload.email != target.email:
        existing = await UserRepository.get_by_email(db, payload.email)
        if existing:
            raise ConflictError(f"The email address '{payload.email}' is already registered.")

    if payload.username and payload.username != target.username:
        existing = await UserRepository.get_by_username(db, payload.username)
        if existing:
            raise ConflictError(f"The username '{payload.username}' is already taken.")

    if payload.email is not None:
        target.email = payload.email
    if payload.username is not None:
        target.username = payload.username
    if payload.full_name is not None:
        target.full_name = payload.full_name
    if payload.role is not None:
        target.role = payload.role

    await db.commit()
    await db.refresh(target)

    logger.info(f"User '{current_user.username}' updated user '{target.email}' (id={target.id}).")
    return target


async def resend_user_invite(
    db: AsyncSession,
    *,
    current_user: User,
    target_public_id: uuid.UUID,
) -> User:
    """Resend the invite email to an unverified user.

    Raises:
        NotFoundError: Target user doesn't exist or belongs to a different org.
        BadRequestError: User is already verified/accepted, or is inactive.
    """
    target = await UserRepository.get_by_public_id(db, target_public_id)
    if not target:
        raise NotFoundError("User not found.")
    if not current_user.is_superuser and target.organization_id != current_user.organization_id:
        raise NotFoundError("User not found.")

    if target.is_verified:
        raise BadRequestError("This user has already accepted the invite.")

    if not target.is_active:
        raise BadRequestError("Cannot resend invite to a deactivated user.")

    org = await OrganizationRepository.get_by_id(db, target.organization_id or current_user.organization_id)

    import asyncio
    from app.utils.email import send_invite_email

    asyncio.create_task(
        send_invite_email(
            to_email=target.email,
            full_name=target.full_name or target.username,
            org_name=org.name if org else "your organization",
            role=target.role.value,
            user_id=target.id,
        )
    )

    return target


async def bulk_delete_org_users(
    db: AsyncSession,
    *,
    current_user: User,
    public_ids: list[uuid.UUID],
) -> int:
    """Delete multiple users in the organization.

    Checks tenant boundary for each user unless current_user is superuser.
    Prevents self-deletion.
    Returns the count of successfully deleted users.
    """
    from app.models.refresh_token import RefreshToken
    from sqlalchemy import delete
    from sqlalchemy.future import select

    # Fetch users matching the public IDs
    result = await db.execute(
        select(User).where(User.public_id.in_(public_ids))
    )
    users_to_delete = list(result.scalars().all())

    deleted_count = 0
    for user in users_to_delete:
        # Check tenant boundary unless current_user is superuser
        if not current_user.is_superuser and user.organization_id != current_user.organization_id:
            continue  # Silently skip cross-tenant deletions

        # Prevent self deletion
        if user.id == current_user.id:
            continue

        # Delete related refresh tokens first
        await db.execute(delete(RefreshToken).where(RefreshToken.user_id == user.id))

        # Delete user
        await UserRepository.delete(db, user)
        deleted_count += 1

    await db.commit()
    logger.info(f"User '{current_user.username}' bulk deleted {deleted_count} users.")
    return deleted_count

