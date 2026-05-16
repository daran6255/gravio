"""CRM Activity Log Service"""

from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.crm_activity_log import CRMActivityLog, CRMEntityType, CRMActivityType
from app.repositories.crm_activity_log_repository import CRMActivityLogRepository


class CRMActivityLogService:
    """Service for CRM activity log business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CRMActivityLogRepository(db)

    async def get_activity_log(self, public_id: UUID) -> CRMActivityLog:
        """Get log entry by public_id"""
        log = await self.repository.get_by_public_id(public_id)
        if not log:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Activity log entry not found")
        return log

    async def get_for_entity(
        self,
        entity_type: CRMEntityType,
        entity_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[CRMActivityLog], int]:
        """Get history of activities for a specific entity"""
        return await self.repository.get_for_entity(
            entity_type=entity_type,
            entity_id=entity_id,
            skip=skip,
            limit=limit
        )

    async def get_recent_activities(self, limit: int = 20) -> List[CRMActivityLog]:
        """Get global recent activities for dashboard"""
        return await self.repository.get_recent_activities(limit=limit)

    async def create_activity(
        self,
        entity_type: CRMEntityType,
        entity_id: int,
        activity_type: CRMActivityType,
        performed_by: int,
        summary: str,
        details: Optional[dict] = None,
        extra_data: Optional[dict] = None
    ) -> CRMActivityLog:
        """Manually create an activity log entry"""
        return await self.repository.create({
            "entity_type": entity_type,
            "entity_id": entity_id,
            "activity_type": activity_type,
            "performed_by": performed_by,
            "summary": summary,
            "details": details,
            "extra_data": extra_data
        })
