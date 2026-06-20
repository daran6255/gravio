"""Org Admin user management endpoints (Flow C) — invite, list, deactivate/reactivate"""

import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.user_management import InviteUserRequest, UserListItem
from app.services.user_management import invite_user, list_org_users, set_user_active, delete_org_user, resend_user_invite

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
    summary="Delete / cancel invite for an unverified user in your organization",
)
async def delete_user_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListItem:
    user = await delete_org_user(db, current_user=current_user, target_public_id=public_id)
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

