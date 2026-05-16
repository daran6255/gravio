from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_email_configuration import UserEmailConfiguration
from app.repositories.base import BaseRepository


class UserEmailConfigurationRepository(BaseRepository[UserEmailConfiguration]):
    """Repository for user email configuration operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(UserEmailConfiguration, db)

    async def get_by_user_id(self, user_id: int) -> Optional[UserEmailConfiguration]:
        """Get email configuration for a specific user"""
        query = select(self.model).where(
            self.model.user_id == user_id,
            self.model.is_deleted == False
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
