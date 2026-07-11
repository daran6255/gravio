"""Org Admin user management service (Flow C) — invite, list, deactivate/reactivate"""

import secrets
import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from typing import Optional

from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.plan import PlanRepository
from app.repositories.crm import CRMLeadRepository
from app.models.plan import PlanTier
from app.models.notification import NotificationType
from app.core.security import get_password_hash
from app.middleware.exceptions import ConflictError, NotFoundError, BadRequestError
from app.schemas.user_management import InviteUserRequest, UpdateUserRequest, BulkDeleteUsersRequest


async def _reassign_or_block_owned_leads(
    db: AsyncSession,
    *,
    current_user: User,
    target: User,
    reassign_to_user_id: Optional[int],
) -> None:
    """Prevent a deactivated/deleted user's leads from being silently orphaned.

    If the target owns any active leads, the caller must supply reassign_to_user_id;
    otherwise this raises ConflictError so the admin can pick a new owner explicitly.
    """
    from app.services.audit import AuditService
    from app.services.notification import NotificationService

    owned_leads, total_owned = await CRMLeadRepository.list_all(
        db, owner_id=target.id, page=1, page_size=1000
    )
    if not total_owned:
        return

    if reassign_to_user_id is None:
        raise ConflictError(
            f"This user owns {total_owned} active lead(s). Provide reassign_to_user_id to proceed."
        )

    new_owner = await UserRepository.get_by_id(db, reassign_to_user_id)
    if not new_owner or ((not current_user.is_superuser or current_user.organization_id is not None) and new_owner.organization_id != current_user.organization_id):
        raise NotFoundError("reassign_to_user_id does not refer to a valid user in your organization.")

    lead_ids = [lead.id for lead in owned_leads]
    await CRMLeadRepository.bulk_update(db, lead_ids, owner_id=new_owner.id)
    for lead in owned_leads:
        await AuditService.record(
            db, entity_type="lead", entity_id=lead.id, action="reassign",
            changed_by_user_id=current_user.id, field_name="owner_id",
            old_value=target.id, new_value=new_owner.id,
        )
    if new_owner.id != current_user.id:
        await NotificationService.notify(
            db, user_id=new_owner.id, type=NotificationType.LEAD_ASSIGNED,
            title="Leads reassigned to you",
            message=f"{total_owned} lead(s) previously owned by {target.full_name or target.email} were reassigned to you.",
        )


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
    if current_user.is_superuser and current_user.organization_id is None:
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
    reassign_to_user_id: Optional[int] = None,
) -> User:
    """Deactivate or reactivate a user.

    Raises:
        NotFoundError: Target user doesn't exist or belongs to a different org.
        BadRequestError: Admin tried to deactivate their own account.
        ConflictError: Deactivating would orphan leads the user owns and no
            reassign_to_user_id was supplied.
    """
    target = await UserRepository.get_by_public_id(db, target_public_id)
    if not target:
        raise NotFoundError("User not found.")
    if (not current_user.is_superuser or current_user.organization_id is not None) and target.organization_id != current_user.organization_id:
        raise NotFoundError("User not found.")

    if not active and target.id == current_user.id:
        raise BadRequestError("You cannot deactivate your own account.")

    if not active:
        await _reassign_or_block_owned_leads(
            db, current_user=current_user, target=target, reassign_to_user_id=reassign_to_user_id
        )

    updated = await UserRepository.set_active(db, target.id, active=active)
    await db.commit()
    await db.refresh(updated)
    return updated


async def delete_org_user(
    db: AsyncSession,
    *,
    current_user: User,
    target_public_id: uuid.UUID,
    reassign_to_user_id: Optional[int] = None,
) -> User:
    """Delete a user.

    Raises:
        NotFoundError: Target user doesn't exist or belongs to a different org.
        BadRequestError: Admin tried to delete their own account.
        ConflictError: Deleting would orphan leads the user owns and no
            reassign_to_user_id was supplied.
    """
    target = await UserRepository.get_by_public_id(db, target_public_id)
    if not target:
        raise NotFoundError("User not found.")
    if (not current_user.is_superuser or current_user.organization_id is not None) and target.organization_id != current_user.organization_id:
        raise NotFoundError("User not found.")

    if target.id == current_user.id:
        raise BadRequestError("You cannot delete your own account.")

    await _reassign_or_block_owned_leads(
        db, current_user=current_user, target=target, reassign_to_user_id=reassign_to_user_id
    )

    # Delete related refresh tokens first to prevent foreign key issues
    from app.models.refresh_token import RefreshToken
    from sqlalchemy import delete
    await db.execute(delete(RefreshToken).where(RefreshToken.user_id == target.id))

    await UserRepository.delete(db, target)
    await db.commit()
    return target


async def _has_assignable_other_manager(db: AsyncSession, target: User) -> bool:
    """Whether at least one OTHER admin/manager in the org could actually be assigned
    as target's reporting manager without creating a circular chain (e.g. someone who
    already reports to target, directly or transitively, doesn't count -- assigning
    them back would just create a loop, so they're not a real alternative)."""
    candidates_result = await db.execute(
        select(User).where(
            User.organization_id == target.organization_id,
            User.id != target.id,
            User.role.in_([UserRole.ADMIN, UserRole.MANAGER]),
            User.is_active.is_(True),
        )
    )
    for candidate in candidates_result.scalars().all():
        visited: set[int] = set()
        current_id: Optional[int] = candidate.id
        is_circular = False
        while current_id is not None:
            if current_id == target.id:
                is_circular = True
                break
            if current_id in visited:
                # Hit an unrelated repeat (e.g. someone else's self-managed chain) --
                # not a cycle back to target, just stop walking this candidate.
                break
            visited.add(current_id)
            chain_user = await UserRepository.get_by_id(db, current_id)
            if not chain_user:
                break
            current_id = chain_user.reporting_manager_id
        if not is_circular:
            return True
    return False


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

    if (not current_user.is_superuser or current_user.organization_id is not None) and target.organization_id != current_user.organization_id:
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
    if "reporting_manager_id" in payload.model_dump(exclude_unset=True):
        new_manager_id = payload.reporting_manager_id if payload.reporting_manager_id and payload.reporting_manager_id > 0 else None
        if new_manager_id is not None:
            if new_manager_id == target.id:
                # Self-reporting is normally invalid -- but if nobody else in the org
                # could actually be assigned (either there's no other admin/manager, or
                # the only ones there already report to target and assigning them back
                # would just be circular), there's genuinely no alternative. Blocking
                # self-assignment in that case would permanently lock this person out
                # of ever submitting a timesheet.
                if await _has_assignable_other_manager(db, target):
                    raise BadRequestError(
                        "A user cannot be their own reporting manager while another assignable admin/manager exists in the organization."
                    )

            # Detect circular reporting structure -- skipped entirely for the direct
            # self-assignment case above (target.id being its own "manager" is the
            # intended outcome there, not a cycle to reject). For everyone else, walk
            # the candidate's own chain and raise only if it leads back to target --
            # an unrelated repeat (e.g. someone else's self-managed terminal node
            # appearing further up the chain) is just a dead end, not a cycle for
            # *this* assignment, so it stops the walk without raising.
            if new_manager_id != target.id:
                visited: set[int] = set()
                current_id = new_manager_id
                while current_id is not None:
                    if current_id == target.id:
                        raise BadRequestError("Circular reporting structure detected. This assignment is invalid.")
                    if current_id in visited:
                        break
                    visited.add(current_id)

                    manager_user = await UserRepository.get_by_id(db, current_id)
                    if not manager_user:
                        break
                    current_id = manager_user.reporting_manager_id

        target.reporting_manager_id = new_manager_id

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
    if (not current_user.is_superuser or current_user.organization_id is not None) and target.organization_id != current_user.organization_id:
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
        if (not current_user.is_superuser or current_user.organization_id is not None) and user.organization_id != current_user.organization_id:
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


async def send_user_password_reset(
    db: AsyncSession,
    *,
    current_user: User,
    target_public_id: uuid.UUID,
) -> User:
    """Send a password reset email to a user in the administrator's tenant.

    Raises:
        NotFoundError: User not found or belongs to a different organization.
        BadRequestError: User is deactivated.
    """
    from app.middleware.exceptions import NotFoundError, BadRequestError
    from app.repositories.user import UserRepository

    target = await UserRepository.get_by_public_id(db, target_public_id)
    if not target:
        raise NotFoundError("User not found.")
    if (not current_user.is_superuser or current_user.organization_id is not None) and target.organization_id != current_user.organization_id:
        raise NotFoundError("User not found.")

    if not target.is_active:
        raise BadRequestError("Cannot send password reset to a deactivated user.")

    import asyncio
    from app.utils.email import send_password_reset_email

    asyncio.create_task(
        send_password_reset_email(
            to_email=target.email,
            full_name=target.full_name or target.username,
            user_id=target.id,
        )
    )

    return target


