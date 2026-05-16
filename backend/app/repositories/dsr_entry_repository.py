"""DSR Entry Repository"""

from datetime import date
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dsr_entry import DSREntry, DSRStatus
from app.repositories.base import BaseRepository


class DSREntryRepository(BaseRepository[DSREntry]):

    def __init__(self, db: AsyncSession):
        super().__init__(DSREntry, db)

    async def get_by_public_id(self, public_id: UUID) -> Optional[DSREntry]:
        result = await self.db.execute(
            select(DSREntry)
            .where(DSREntry.public_id == public_id)
            .where(DSREntry.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_user_and_date(self, user_id: int, report_date: date) -> Optional[DSREntry]:
        """Get any (non-deleted) DSR entry for a specific user + date"""
        result = await self.db.execute(
            select(DSREntry)
            .where(DSREntry.user_id == user_id)
            .where(DSREntry.report_date == report_date)
            .where(DSREntry.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_entries_by_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 50,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[DSRStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[DSREntry], int]:
        base = and_(DSREntry.user_id == user_id, DSREntry.is_deleted == False)
        query = select(DSREntry).where(base)
        count_query = select(func.count()).select_from(DSREntry).where(base)

        if date_from:
            query = query.where(DSREntry.report_date >= date_from)
            count_query = count_query.where(DSREntry.report_date >= date_from)
        if date_to:
            query = query.where(DSREntry.report_date <= date_to)
            count_query = count_query.where(DSREntry.report_date <= date_to)
        if status:
            query = query.where(DSREntry.status == status)
            count_query = count_query.where(DSREntry.status == status)
        
        if search:
            # Cast JSONB to text to allow case-insensitive search across project names and descriptions
            search_filter = DSREntry.items.cast(String).ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total = (await self.db.execute(count_query)).scalar_one()
        query = query.order_by(DSREntry.report_date.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_all_entries(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[DSRStatus] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[DSREntry], int]:
        """Admin view — all entries across all users with filters and search"""
        from app.models.user import User
        
        base = DSREntry.is_deleted == False
        query = select(DSREntry).join(User, DSREntry.user_id == User.id).where(base)
        count_query = select(func.count()).select_from(DSREntry).join(User, DSREntry.user_id == User.id).where(base)

        if user_id:
            query = query.where(DSREntry.user_id == user_id)
            count_query = count_query.where(DSREntry.user_id == user_id)
        if date_from:
            query = query.where(DSREntry.report_date >= date_from)
            count_query = count_query.where(DSREntry.report_date >= date_from)
        if date_to:
            query = query.where(DSREntry.report_date <= date_to)
            count_query = count_query.where(DSREntry.report_date <= date_to)
        if status:
            query = query.where(DSREntry.status == status)
            count_query = count_query.where(DSREntry.status == status)
        
        if search:
            search_filter = and_(
                base,
                (User.full_name.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%"))
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total = (await self.db.execute(count_query)).scalar_one()
        query = query.order_by(DSREntry.report_date.desc(), DSREntry.user_id).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_submitted_user_ids_for_date(self, report_date: date) -> List[int]:
        """Returns user_ids that have a SUBMITTED (or APPROVED) DSR for the given date"""
        result = await self.db.execute(
            select(DSREntry.user_id)
            .where(DSREntry.report_date == report_date)
            .where(DSREntry.status.in_([DSRStatus.SUBMITTED, DSRStatus.APPROVED]))
            .where(DSREntry.is_deleted == False)
        )
        return list(result.scalars().all())

    async def get_entries_by_status(
        self,
        status: DSRStatus,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[DSREntry], int]:
        """Get all entries across all users matching a given status, ordered oldest first."""
        base = and_(DSREntry.status == status, DSREntry.is_deleted == False)
        count_query = select(func.count()).select_from(DSREntry).where(base)
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            select(DSREntry)
            .where(base)
            .order_by(DSREntry.submitted_at.asc().nullsfirst())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def count_by_status_for_user(self, user_id: int) -> dict:
        """Return counts per status for a single user — used for the user dashboard cards."""
        from sqlalchemy import case
        result = await self.db.execute(
            select(
                func.count(DSREntry.id).filter(DSREntry.status == DSRStatus.SUBMITTED).label("pending_approval"),
                func.count(DSREntry.id).filter(
                    and_(DSREntry.status == DSRStatus.DRAFT, DSREntry.admin_notes.isnot(None))
                ).label("action_required"),
                func.count(DSREntry.id).filter(DSREntry.status == DSRStatus.APPROVED).label("approved"),
            )
            .where(DSREntry.user_id == user_id)
            .where(DSREntry.is_deleted == False)
        )
        row = result.first()
        return {
            "pending_approval": row.pending_approval if row else 0,
            "action_required": row.action_required if row else 0,
            "approved": row.approved if row else 0,
        }

    async def count_references(
        self, project_public_id: Optional[UUID] = None, activity_public_id: Optional[UUID] = None
    ) -> int:
        """
        Count DSR entries that reference a specific project or activity in their items JSON.
        Uses PostgreSQL JSONB containment or text search for efficiency if needed.
        """
        query = select(func.count(DSREntry.id)).where(DSREntry.is_deleted == False)
        
        # items is a list of dicts. We need to check if any dict has the given public_id.
        # Format in DB: [{"project_public_id": "...", "activity_public_id": "...", ...}, ...]
        
        if project_public_id:
            # Check if project_public_id exists in ANY of the JSON items
            # Using cast to string for safety if needed, though UUID is stored as string in JSON
            target = f'[{{"project_public_id": "{str(project_public_id)}"}} ]'
            # Note: SQLAlchemy's contains operator for JSONB works well
            query = query.where(DSREntry.items.contains([{"project_public_id": str(project_public_id)}]))
            
        if activity_public_id:
            query = query.where(DSREntry.items.contains([{"activity_public_id": str(activity_public_id)}]))

        result = await self.db.execute(query)
        return result.scalar_one()
    async def get_user_stats_summary(self, user_id: int) -> dict:
        """Calculate summary metrics for the user dashboard header"""
        from datetime import date, timedelta
        from sqlalchemy import text
        
        today = date.today()
        first_of_month = today.replace(day=1)
        
        # 1. Total hours all-time (approved)
        # We use a raw SQL fragment for JSONB aggregation efficiency
        all_time_query = await self.db.execute(text(
            "SELECT SUM((item->>'hours')::float) "
            "FROM dsr_entries, jsonb_array_elements(items) AS item "
            "WHERE user_id = :uid AND status = 'approved' AND is_deleted = false"
        ), {"uid": user_id})
        total_hours_all_time = all_time_query.scalar() or 0.0
        
        # 2. Total hours current month (approved)
        month_query = await self.db.execute(text(
            "SELECT SUM((item->>'hours')::float) "
            "FROM dsr_entries, jsonb_array_elements(items) AS item "
            "WHERE user_id = :uid AND status = 'approved' AND is_deleted = false "
            "AND report_date >= :start_date"
        ), {"uid": user_id, "start_date": first_of_month})
        total_hours_month = month_query.scalar() or 0.0
        
        # 3. Total leaves entirely (approved)
        leaves_query = await self.db.execute(
            select(func.count(DSREntry.id))
            .where(DSREntry.user_id == user_id)
            .where(DSREntry.is_leave == True)
            .where(DSREntry.status == DSRStatus.APPROVED)
            .where(DSREntry.is_deleted == False)
        )
        total_leaves = leaves_query.scalar() or 0
        
        # 4. Not worked days (Current Month)
        # We find weekdays in current month (Mon-Fri) that don't have an entry
        # First, get all distinct report dates for this user this month
        dates_query = await self.db.execute(
            select(DSREntry.report_date)
            .where(DSREntry.user_id == user_id)
            .where(DSREntry.report_date >= first_of_month)
            .where(DSREntry.is_deleted == False)
            .distinct()
        )
        submitted_dates = {r[0] for r in dates_query.all()}
        
        not_worked_count = 0
        curr = first_of_month
        while curr <= today:
            # Weekday check (0=Mon, 4=Fri) and not in submitted dates
            if curr.weekday() < 5 and curr not in submitted_dates:
                not_worked_count += 1
            curr += timedelta(days=1)
            
        return {
            "total_hours_month": round(total_hours_month, 2),
            "total_hours_all_time": round(total_hours_all_time, 2),
            "total_leaves": total_leaves,
            "not_worked_days": not_worked_count
        }
