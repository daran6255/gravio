"""Activity Log repository for database operations"""

from typing import Optional, List
from datetime import datetime
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity_log import ActivityLog, ActionType
from app.repositories.base import BaseRepository


class ActivityLogRepository(BaseRepository[ActivityLog]):
    """Repository for activity log database operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(ActivityLog, db)
    
    async def create_log(
        self,
        *,
        user_id: Optional[int] = None,
        action_type: ActionType,
        endpoint: str,
        method: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        changes: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status_code: Optional[int] = None,
    ) -> ActivityLog:
        """Create a new activity log entry"""
        log_entry = ActivityLog(
            user_id=user_id,
            action_type=action_type,
            endpoint=endpoint,
            method=method,
            resource_type=resource_type,
            resource_id=resource_id,
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent,
            status_code=status_code,
        )
        self.db.add(log_entry)
        await self.db.commit()
        await self.db.refresh(log_entry)
        return log_entry
    
    async def get_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[ActivityLog]:
        """Get activity logs for a specific user"""
        query = (
            select(ActivityLog)
            .where(ActivityLog.user_id == user_id)
            .where(ActivityLog.is_deleted == False)
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_by_resource(
        self,
        resource_type: str,
        resource_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[ActivityLog]:
        """Get activity logs for a specific resource"""
        query = (
            select(ActivityLog)
            .where(
                and_(
                    ActivityLog.resource_type == resource_type,
                    ActivityLog.resource_id == resource_id,
                    ActivityLog.is_deleted == False
                )
            )
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def get_filtered(
        self,
        *,
        user_id: Optional[int] = None,
        action_type: Optional[ActionType] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        method: Optional[str] = None,
        status_code: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[ActivityLog], int]:
        """
        Get filtered activity logs with pagination
        
        Returns:
            Tuple of (logs, total_count)
        """
        conditions = [ActivityLog.is_deleted == False]
        
        if user_id is not None:
            conditions.append(ActivityLog.user_id == user_id)
        if action_type is not None:
            conditions.append(ActivityLog.action_type == action_type)
        if resource_type is not None:
            conditions.append(ActivityLog.resource_type == resource_type)
        if resource_id is not None:
            conditions.append(ActivityLog.resource_id == resource_id)
        if method is not None:
            conditions.append(ActivityLog.method == method)
        if status_code is not None:
            conditions.append(ActivityLog.status_code == status_code)
        if start_date is not None:
            conditions.append(ActivityLog.created_at >= start_date)
        if end_date is not None:
            conditions.append(ActivityLog.created_at <= end_date)
        
        # Count query
        count_query = select(func.count()).select_from(ActivityLog).where(and_(*conditions))
        count_result = await self.db.execute(count_query)
        total = count_result.scalar()
        
        # Data query
        query = (
            select(ActivityLog)
            .where(and_(*conditions))
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        logs = list(result.scalars().all())
        
        return logs, total or 0
