"""Org Admin user management endpoints (Flow C) — invite, list, deactivate/reactivate"""

import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.user_management import InviteUserRequest, UserListItem, UpdateUserRequest, BulkDeleteUsersRequest
from app.services.user_management import invite_user, list_org_users, set_user_active, delete_org_user, resend_user_invite, update_org_user, bulk_delete_org_users, send_user_password_reset

router = APIRouter(prefix="/users", tags=["User Management"])

# Every route here is Org-Admin-only and implicitly scoped to that admin's own
# organization_id — never a client-supplied org id.
require_org_admin = require_roles([UserRole.ADMIN])


@router.post(
    "/invite",
    response_model=UserListItem,
    status_code=status.HTTP_201_CREATED,
    summary="Invite a teammate into your organization",
    description=(
        "Creates the user record and emails an invite link. The invitee sets "
        "their own password via POST /auth/accept-invite — no password is set here."
    ),
)
async def invite_user_endpoint(
    payload: InviteUserRequest,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListItem:
    user = await invite_user(db, current_user=current_user, payload=payload)
    return UserListItem.model_validate(user)


@router.get(
    "",
    response_model=PaginatedResponse[UserListItem],
    summary="List users in your organization",
)
async def list_users_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[UserListItem]:
    items, total = await list_org_users(db, current_user=current_user, page=page, page_size=page_size)
    return PaginatedResponse[UserListItem](
        items=[UserListItem.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/{public_id}/deactivate",
    response_model=UserListItem,
    summary="Deactivate a user in your organization",
)
async def deactivate_user_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListItem:
    user = await set_user_active(db, current_user=current_user, target_public_id=public_id, active=False)
    return UserListItem.model_validate(user)


@router.post(
    "/{public_id}/reactivate",
    response_model=UserListItem,
    summary="Reactivate a previously deactivated user in your organization",
)
async def reactivate_user_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListItem:
    user = await set_user_active(db, current_user=current_user, target_public_id=public_id, active=True)
    return UserListItem.model_validate(user)


@router.delete(
    "/{public_id}",
    response_model=UserListItem,
    summary="Delete user / cancel invite",
)
async def delete_user_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListItem:
    user = await delete_org_user(db, current_user=current_user, target_public_id=public_id)
    return UserListItem.model_validate(user)


@router.put(
    "/{public_id}",
    response_model=UserListItem,
    summary="Update user details",
)
async def update_user_endpoint(
    public_id: uuid.UUID,
    payload: UpdateUserRequest,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListItem:
    user = await update_org_user(db, current_user=current_user, target_public_id=public_id, payload=payload)
    return UserListItem.model_validate(user)


@router.post(
    "/{public_id}/resend-invite",
    response_model=UserListItem,
    summary="Resend invite email to an unverified user",
)
async def resend_invite_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListItem:
    user = await resend_user_invite(db, current_user=current_user, target_public_id=public_id)
    return UserListItem.model_validate(user)


@router.post(
    "/{public_id}/reset-password",
    response_model=UserListItem,
    summary="Trigger password reset email for a user (Admin/Super-Admin)",
)
async def reset_password_invite_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListItem:
    user = await send_user_password_reset(db, current_user=current_user, target_public_id=public_id)
    return UserListItem.model_validate(user)


@router.post(
    "/bulk-delete",
    status_code=status.HTTP_200_OK,
    summary="Bulk delete users in your organization",
)
async def bulk_delete_users_endpoint(
    payload: BulkDeleteUsersRequest,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    deleted_count = await bulk_delete_org_users(
        db,
        current_user=current_user,
        public_ids=payload.public_ids,
    )
    return {"message": f"Successfully deleted {deleted_count} users.", "deleted_count": deleted_count}


@router.put(
    "/organization/plan",
    summary="Update organization subscription plan (Org Admin)",
)
async def update_organization_plan_endpoint(
    plan_tier: str,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    from app.models.plan import PlanTier
    from app.repositories.plan import PlanRepository
    from app.repositories.organization import OrganizationRepository
    from app.repositories.user import UserRepository
    from app.middleware.exceptions import BadRequestError, NotFoundError

    try:
        tier_enum = PlanTier(plan_tier)
    except ValueError:
        raise BadRequestError(f"Invalid plan tier '{plan_tier}'. Available tiers: {[e.value for e in PlanTier]}")

    plan = await PlanRepository.get_by_tier(db, tier_enum)
    if not plan:
        raise NotFoundError(f"Plan tier '{plan_tier}' not found.")

    org = await OrganizationRepository.get_by_id(db, current_user.organization_id)
    if not org:
        raise NotFoundError("Organization not found.")

    # Validation: enforce seat limits on downgrade
    if plan.user_limit is not None:
        current_users = await UserRepository.count_by_organization(db, current_user.organization_id)
        if current_users > plan.user_limit:
            raise BadRequestError(f"Cannot change plan to '{plan.name}'. Your organization currently has {current_users} users, which exceeds the new limit of {plan.user_limit} seats.")

    org.plan_id = plan.id
    org.subscription_status = "active"  # mark subscription status active when they choose a plan
    await db.commit()
    await db.refresh(org)

    return {
        "success": True,
        "message": f"Organization plan updated to {plan.name}.",
        "plan_id": org.plan_id,
        "plan_name": plan.name,
        "subscription_status": org.subscription_status
    }

