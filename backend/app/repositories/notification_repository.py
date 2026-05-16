from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.repositories.base import BaseRepository

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_by_public_id(self, public_id: UUID) -> Optional[Notification]:
        result = await self.db.execute(
            select(Notification).where(Notification.public_id == public_id)
        )
        return result.scalar_one_or_none()

    async def get_unread_count(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
        )
        return result.scalar_one()

    async def get_user_notifications(
        self, 
        user_id: int, 
        limit: int = 50, 
        unread_only: bool = False
    ) -> List[Notification]:
        query = select(Notification).where(Notification.user_id == user_id)
        
        if unread_only:
            query = query.where(Notification.is_read == False)
            
        query = query.order_by(Notification.created_at.desc()).limit(limit)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def mark_as_read(self, public_id: UUID, user_id: int) -> bool:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.public_id == public_id, Notification.user_id == user_id)
            .values(is_read=True)
        )
        return result.rowcount > 0

    async def mark_all_as_read(self, user_id: int) -> int:
        result = await self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True)
        )
        return result.rowcount
