"""FastAPI endpoint router for in-app notifications"""

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.notification import NotificationService
from app.schemas.common import PaginatedResponse
from app.schemas.notification import NotificationResponse, UnreadCountResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=PaginatedResponse[NotificationResponse],
    summary="List the current user's notifications",
)
async def list_notifications_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[NotificationResponse]:
    items, total = await NotificationService.list_notifications(
        db, user_id=current_user.id, page=page, page_size=page_size, unread_only=unread_only
    )
    return PaginatedResponse[NotificationResponse](
        items=[NotificationResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get the current user's unread notification count",
)
async def unread_count_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UnreadCountResponse:
    count = await NotificationService.count_unread(db, user_id=current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.patch(
    "/{public_id}/read",
    response_model=NotificationResponse,
    summary="Mark a single notification as read",
)
async def mark_read_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationResponse:
    notification = await NotificationService.mark_read(db, public_id=public_id, user_id=current_user.id)
    return NotificationResponse.model_validate(notification)


@router.patch(
    "/mark-all-read",
    summary="Mark all of the current user's notifications as read",
)
async def mark_all_read_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    count = await NotificationService.mark_all_read(db, user_id=current_user.id)
    return {"marked_read": count}
