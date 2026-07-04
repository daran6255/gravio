"""In-app notification business logic"""

import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import NotificationType
from app.repositories.notification import NotificationRepository
from app.middleware.exceptions import NotFoundError, ForbiddenError
from app.core.context import tenant_context


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
        # Notification.organization_id is NOT NULL; defaults to the caller's own
        # tenant (the requesting user's org) since that's correct for the vast
        # majority of call sites. Pass this explicitly when notifying a user in
        # a *different* org (e.g. a Super Admin about a tenant's request).
        organization_id: Optional[int] = None,
    ):
        org_id = organization_id if organization_id is not None else tenant_context.get()
        if org_id is None:
            raise ValueError("organization_id must be provided when tenant_context has no active organization")

        return await NotificationRepository.create(
            db,
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            entity_type=entity_type,
            entity_id=entity_id,
            organization_id=org_id,
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
