from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/my", response_model=NotificationListResponse)
async def get_my_notifications(
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user's notifications.
    """
    service = NotificationService(db)
    items, unread_count = await service.get_my_notifications(
        current_user.id, limit=limit, unread_only=unread_only
    )
    return NotificationListResponse(items=items, unread_count=unread_count)

@router.put("/{public_id}/read", response_model=dict)
async def mark_notification_as_read(
    public_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a specific notification as read.
    """
    service = NotificationService(db)
    success = await service.mark_as_read(public_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return {"status": "success"}

@router.put("/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all unread notifications as read.
    """
    service = NotificationService(db)
    count = await service.mark_all_as_read(current_user.id)
    return {"status": "success", "marked_count": count}
