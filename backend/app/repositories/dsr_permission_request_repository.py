"""DSR Permission Request Repository"""

from datetime import date
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload, contains_eager
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dsr_permission_request import DSRPermissionRequest, DSRPermissionStatus
from app.repositories.base import BaseRepository

class DSRPermissionRequestRepository(BaseRepository[DSRPermissionRequest]):

    def __init__(self, db: AsyncSession):
        super().__init__(DSRPermissionRequest, db)

    async def get_by_public_id(self, public_id: UUID) -> Optional[DSRPermissionRequest]:
        result = await self.db.execute(
            select(DSRPermissionRequest)
            .options(joinedload(DSRPermissionRequest.user))
            .where(DSRPermissionRequest.public_id == public_id)
            .where(DSRPermissionRequest.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_user_and_date(self, user_id: int, report_date: date) -> Optional[DSRPermissionRequest]:
        """Get any (non-deleted) request for a specific user + date"""
        result = await self.db.execute(
            select(DSRPermissionRequest)
            .where(DSRPermissionRequest.user_id == user_id)
            .where(DSRPermissionRequest.report_date == report_date)
            .where(DSRPermissionRequest.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_requests(
        self,
        user_id: Optional[int] = None,
        status: Optional[DSRPermissionStatus] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[DSRPermissionRequest], int]:
        from app.models.user import User
        base = DSRPermissionRequest.is_deleted == False
        if user_id:
            base = and_(base, DSRPermissionRequest.user_id == user_id)
        if status:
            base = and_(base, DSRPermissionRequest.status == status)
        
        if search:
            search_filter = func.lower(User.full_name).contains(search.lower()) | \
                            func.lower(User.username).contains(search.lower()) | \
                            func.lower(DSRPermissionRequest.reason).contains(search.lower())
            base = and_(base, search_filter)

        query = select(DSRPermissionRequest).join(User, DSRPermissionRequest.user_id == User.id).where(base).options(contains_eager(DSRPermissionRequest.user))
        count_query = select(func.count()).select_from(DSRPermissionRequest).join(User, DSRPermissionRequest.user_id == User.id).where(base)

        total = (await self.db.execute(count_query)).scalar_one()
        query = query.order_by(DSRPermissionRequest.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total
    
    async def get_granted_permission(self, user_id: int, report_date: date) -> Optional[DSRPermissionRequest]:
        """Check if user has GRANTED permission for a specific date"""
        result = await self.db.execute(
            select(DSRPermissionRequest)
            .where(DSRPermissionRequest.user_id == user_id)
            .where(DSRPermissionRequest.report_date == report_date)
            .where(DSRPermissionRequest.status == DSRPermissionStatus.GRANTED)
            .where(DSRPermissionRequest.is_deleted == False)
        )
        return result.scalar_one_or_none()
