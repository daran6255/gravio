"""CRM Activity Log Repository"""

from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.crm_activity_log import CRMActivityLog, CRMEntityType, CRMActivityType
from app.repositories.base import BaseRepository


class CRMActivityLogRepository(BaseRepository[CRMActivityLog]):
    """Repository for CRMActivityLog model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(CRMActivityLog, db)
    
    async def get_by_public_id(self, public_id: UUID) -> Optional[CRMActivityLog]:
        """Get log by public_id (UUID)"""
        result = await self.db.execute(
            select(CRMActivityLog).where(CRMActivityLog.public_id == public_id)
        )
        return result.scalars().first()
    
    async def get_for_entity(
        self,
        entity_type: CRMEntityType,
        entity_id: int,
        skip: int = 0,
        limit: int = 50
    ):
        """Get history of activities for a specific entity"""
        stmt = (
            select(CRMActivityLog)
            .where(CRMActivityLog.entity_type == entity_type)
            .where(CRMActivityLog.entity_id == entity_id)
            .where(CRMActivityLog.is_deleted == False)
            .order_by(CRMActivityLog.created_at.desc())
            .options(joinedload(CRMActivityLog.performer))
            .offset(skip)
            .limit(limit)
        )
        
        # Count total for this entity
        count_stmt = (
            select(func.count(CRMActivityLog.id))
            .where(CRMActivityLog.entity_type == entity_type)
            .where(CRMActivityLog.entity_id == entity_id)
            .where(CRMActivityLog.is_deleted == False)
        )
        
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        result = await self.db.execute(stmt)
        return result.scalars().unique().all(), total

    async def get_recent_activities(self, limit: int = 20) -> List[CRMActivityLog]:
        """Get global recent activities for dashboard"""
        stmt = (
            select(CRMActivityLog)
            .where(CRMActivityLog.is_deleted == False)
            .order_by(CRMActivityLog.created_at.desc())
            .options(joinedload(CRMActivityLog.performer))
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_activities_by_date(self, start_date: datetime, end_date: datetime) -> List[CRMActivityLog]:
        """Get CRM activities within a date range"""
        from datetime import datetime
        stmt = (
            select(CRMActivityLog)
            .where(CRMActivityLog.created_at >= start_date)
            .where(CRMActivityLog.created_at <= end_date)
            .where(CRMActivityLog.is_deleted == False)
            .options(joinedload(CRMActivityLog.performer))
            .order_by(CRMActivityLog.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())
