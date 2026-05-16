"""DSR Leave Application Repository"""

from datetime import date
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dsr_leave_application import DSRLeaveApplication, DSRLeaveStatus
from app.models.user import User
from app.repositories.base import BaseRepository


class DSRLeaveApplicationRepository(BaseRepository[DSRLeaveApplication]):

    def __init__(self, db: AsyncSession):
        super().__init__(DSRLeaveApplication, db)

    async def get_by_public_id(self, public_id: UUID) -> Optional[DSRLeaveApplication]:
        result = await self.db.execute(
            select(DSRLeaveApplication)
            .where(DSRLeaveApplication.public_id == public_id)
            .where(DSRLeaveApplication.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
        status: Optional[DSRLeaveStatus] = None,
    ) -> Tuple[List[DSRLeaveApplication], int]:
        base = and_(DSRLeaveApplication.user_id == user_id, DSRLeaveApplication.is_deleted == False)
        if status:
            base = and_(base, DSRLeaveApplication.status == status)
            
        count_query = select(func.count()).select_from(DSRLeaveApplication).where(base)
        query = select(DSRLeaveApplication).where(base).order_by(DSRLeaveApplication.start_date.desc()).offset(skip).limit(limit)
        
        total = (await self.db.execute(count_query)).scalar_one()
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_all_requests(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[DSRLeaveStatus] = None,
        user_id: Optional[int] = None,
    ) -> Tuple[List[DSRLeaveApplication], int]:
        base = DSRLeaveApplication.is_deleted == False
        if status:
            base = and_(base, DSRLeaveApplication.status == status)
        if user_id:
            base = and_(base, DSRLeaveApplication.user_id == user_id)
            
        count_query = select(func.count()).select_from(DSRLeaveApplication).where(base)
        query = (
            select(DSRLeaveApplication)
            .options(joinedload(DSRLeaveApplication.user))
            .where(base)
            .order_by(DSRLeaveApplication.start_date.desc())
            .offset(skip)
            .limit(limit)
        )
        
        total = (await self.db.execute(count_query)).scalar_one()
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_overlapping_leaves(self, user_id: int, start_date: date, end_date: date) -> List[DSRLeaveApplication]:
        """Check for any approved or pending leaves that overlap with the given date range"""
        query = select(DSRLeaveApplication).where(
            and_(
                DSRLeaveApplication.user_id == user_id,
                DSRLeaveApplication.is_deleted == False,
                DSRLeaveApplication.status.in_([DSRLeaveStatus.PENDING, DSRLeaveStatus.APPROVED]),
                or_(
                    and_(DSRLeaveApplication.start_date <= start_date, DSRLeaveApplication.end_date >= start_date),
                    and_(DSRLeaveApplication.start_date <= end_date, DSRLeaveApplication.end_date >= end_date),
                    and_(DSRLeaveApplication.start_date >= start_date, DSRLeaveApplication.end_date <= end_date)
                )
            )
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_leaves_for_calendar(self, user_id: int, start_date: date, end_date: date) -> List[DSRLeaveApplication]:
        """Get all approved leaves for a user within a specific date range for calendar display"""
        query = select(DSRLeaveApplication).where(
            and_(
                DSRLeaveApplication.user_id == user_id,
                DSRLeaveApplication.is_deleted == False,
                DSRLeaveApplication.status.in_([DSRLeaveStatus.APPROVED, DSRLeaveStatus.PENDING]),
                DSRLeaveApplication.start_date <= end_date,
                DSRLeaveApplication.end_date >= start_date
            )
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_stats(self, user_id: int) -> dict:
        """Get aggregate counts of leave applications and total days by status for a specific user"""
        # Note: end_date - start_date returns an interval, we need to extract days or use Julian Day for sum
        # In PostgreSQL/SQLAlchemy, (end_date - start_date) + 1 gives the inclusive duration
        query = (
            select(
                DSRLeaveApplication.status, 
                func.count().label("apps"),
                func.sum(DSRLeaveApplication.end_date - DSRLeaveApplication.start_date + 1).label("days")
            )
            .where(DSRLeaveApplication.user_id == user_id)
            .where(DSRLeaveApplication.is_deleted == False)
            .group_by(DSRLeaveApplication.status)
        )
        result = await self.db.execute(query)
        
        stats = {
            "total_apps": 0,
            "total_days": 0,
            "pending_apps": 0,
            "pending_days": 0,
            "approved_apps": 0,
            "approved_days": 0,
            "rejected_apps": 0,
            "rejected_days": 0
        }
        
        for row in result.all():
            status_val, apps, days = row
            # days might be returned as a timedelta or duration in some DB drivers, 
            # but usually SQLAlchemy handles basic subtraction if the DB supports it.
            # Convert timedelta to int if necessary
            days_count = int(days.days) if hasattr(days, 'days') else int(days) if days is not None else 0
            
            stats["total_apps"] += apps
            stats["total_days"] += days_count
            
            if status_val == DSRLeaveStatus.PENDING:
                stats["pending_apps"] = apps
                stats["pending_days"] = days_count
            elif status_val == DSRLeaveStatus.APPROVED:
                stats["approved_apps"] = apps
                stats["approved_days"] = days_count
            elif status_val == DSRLeaveStatus.REJECTED:
                stats["rejected_apps"] = apps
                stats["rejected_days"] = days_count
        
        return stats
