"""In-app notification business logic"""

import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import NotificationType
from app.repositories.notification import NotificationRepository
from app.middleware.exceptions import NotFoundError, ForbiddenError


class NotificationService:
    @staticmethod
    async def notify(
        db: AsyncSession,
        *,
        user_id: int,
        type: NotificationType,
        title: str,
        message: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
    ):
        return await NotificationRepository.create(
            db,
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
        )

    @staticmethod
    async def list_notifications(
        db: AsyncSession, *, user_id: int, page: int, page_size: int, unread_only: bool = False
    ):
        return await NotificationRepository.list_for_user(
            db, user_id=user_id, page=page, page_size=page_size, unread_only=unread_only
        )

    @staticmethod
    async def count_unread(db: AsyncSession, *, user_id: int) -> int:
        return await NotificationRepository.count_unread(db, user_id=user_id)

    @staticmethod
    async def mark_read(db: AsyncSession, *, public_id: uuid.UUID, user_id: int):
        notification = await NotificationRepository.get_by_public_id(db, public_id)
        if not notification or notification.is_deleted:
            raise NotFoundError("Notification not found")
        if notification.user_id != user_id:
            raise ForbiddenError("You cannot modify another user's notification")
        return await NotificationRepository.mark_read(db, notification)

    @staticmethod
    async def mark_all_read(db: AsyncSession, *, user_id: int) -> int:
        return await NotificationRepository.mark_all_read(db, user_id=user_id)
