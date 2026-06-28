"""Data access layer for Notification"""

from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.notification import Notification


class NotificationRepository:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> Notification:
        notification = Notification(**kwargs)
        db.add(notification)
        await db.flush()
        return notification

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id) -> Optional[Notification]:
        result = await db.execute(select(Notification).where(Notification.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def list_for_user(
        db: AsyncSession,
        *,
        user_id: int,
        page: int = 1,
        page_size: int = 20,
        unread_only: bool = False,
    ) -> tuple[list[Notification], int]:
        conditions = [Notification.user_id == user_id, Notification.is_deleted.is_(False)]
        if unread_only:
            conditions.append(Notification.is_read.is_(False))

        count_result = await db.execute(
            select(func.count()).select_from(Notification).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(Notification)
            .where(*conditions)
            .order_by(Notification.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def count_unread(db: AsyncSession, *, user_id: int) -> int:
        result = await db.execute(
            select(func.count()).select_from(Notification).where(
                Notification.user_id == user_id,
                Notification.is_deleted.is_(False),
                Notification.is_read.is_(False),
            )
        )
        return result.scalar_one()

    @staticmethod
    async def mark_read(db: AsyncSession, notification: Notification) -> Notification:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        await db.flush()
        return notification

    @staticmethod
    async def mark_all_read(db: AsyncSession, *, user_id: int) -> int:
        result = await db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_deleted.is_(False),
                Notification.is_read.is_(False),
            )
        )
        notifications = list(result.scalars().all())
        now = datetime.now(timezone.utc)
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
        await db.flush()
        return len(notifications)
