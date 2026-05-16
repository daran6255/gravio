"""User repository with custom queries"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        query = select(User).where(
            User.email == email,
            User.is_deleted == False
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        query = select(User).where(
            User.username == username,
            User.is_deleted == False
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        role: Optional[str] = None,
        search: Optional[str] = None
    ) -> list[User]:
        """Get multiple users with optional role and search filter"""
        stmt = select(User)
        if not include_deleted:
            stmt = stmt.where(User.is_deleted == False)
        
        if role:
            stmt = stmt.where(User.role == role)
            
        if search:
            search_filter = (
                User.full_name.ilike(f"%{search}%") |
                User.email.ilike(f"%{search}%") |
                User.username.ilike(f"%{search}%") |
                User.mobile.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def search_users(self, query: str = None, role: str = None, limit: int = 10) -> list[User]:
        """Search users by name, email or username with optional role filter"""
        stmt = select(User).where(User.is_deleted == False)
        
        if role:
            stmt = stmt.where(User.role == role)
            
        if query:
            search_filter = (
                User.full_name.ilike(f"%{query}%") |
                User.email.ilike(f"%{query}%") |
                User.username.ilike(f"%{query}%") |
                User.mobile.ilike(f"%{query}%")
            )
            stmt = stmt.where(search_filter)
            
        result = await self.db.execute(stmt.limit(limit))
        return list(result.scalars().all())
