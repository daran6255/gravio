"""Lead Repository"""

from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.lead import Lead, LeadStatus, LeadSource
from app.models.user import User
from app.repositories.base import BaseRepository


class LeadRepository(BaseRepository[Lead]):
    """Repository for Lead model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Lead, db)
    
    async def get_by_public_id(self, public_id: UUID) -> Optional[Lead]:
        """Get lead by public_id (UUID)"""
        result = await self.db.execute(
            select(Lead).where(Lead.public_id == public_id)
        )
        return result.scalars().first()
    
    async def create(self, obj_in: dict[str, Any]) -> Lead:
        """Create a new lead and return with eager loaded relationships"""
        lead = await super().create(obj_in)
        # Fetch with details to avoid lazy loading issues in FastAPI response serialization
        return await self.get_by_public_id_with_details(lead.public_id)

    async def update(self, id: int, obj_in: dict[str, Any]) -> Optional[Lead]:
        """Update a lead and return with eager loaded relationships"""
        lead = await super().update(id, obj_in)
        if lead:
            return await self.get_by_public_id_with_details(lead.public_id)
        return None
    
    async def get_by_public_id_with_details(self, public_id: UUID) -> Optional[Lead]:
        """Get lead by public_id with all related data"""
        result = await self.db.execute(
            select(Lead)
            .where(Lead.public_id == public_id)
            .options(
                joinedload(Lead.company),
                joinedload(Lead.contact),
                joinedload(Lead.assigned_user),
                joinedload(Lead.converted_deal)
            )
        )
        return result.scalars().first()
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        search: Optional[str] = None,
        status: Optional[LeadStatus] = None,
        source: Optional[LeadSource] = None,
        assigned_to: Optional[int] = None,
        min_score: Optional[int] = None,
        max_score: Optional[int] = None,
        company_id: Optional[int] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ):
        """Get multiple leads with filtering and pagination"""
        stmt = (
            select(Lead)
            .options(
                joinedload(Lead.company),
                joinedload(Lead.contact),
                joinedload(Lead.assigned_user)
            )
        )
        
        if not include_deleted:
            stmt = stmt.where(Lead.is_deleted == False)
        
        # Search filter
        if search:
            search_filter = or_(
                Lead.title.ilike(f"%{search}%"),
                Lead.description.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
        
        # Status filter
        if status:
            stmt = stmt.where(Lead.lead_status == status)
        
        # Source filter
        if source:
            stmt = stmt.where(Lead.lead_source == source)
        
        # Assigned to filter
        if assigned_to:
            stmt = stmt.where(Lead.assigned_to == assigned_to)
        
        # Company filter
        if company_id:
            stmt = stmt.where(Lead.company_id == company_id)
        
        # Score filter
        if min_score is not None:
            stmt = stmt.where(Lead.lead_score >= min_score)
        if max_score is not None:
            stmt = stmt.where(Lead.lead_score <= max_score)
        
        # Count query
        count_stmt = select(func.count(Lead.id)).select_from(Lead)
        if not include_deleted:
            count_stmt = count_stmt.where(Lead.is_deleted == False)
        if search:
            count_stmt = count_stmt.where(search_filter)
        if status:
            count_stmt = count_stmt.where(Lead.lead_status == status)
        if source:
            count_stmt = count_stmt.where(Lead.lead_source == source)
        if assigned_to:
            count_stmt = count_stmt.where(Lead.assigned_to == assigned_to)
        if company_id:
            count_stmt = count_stmt.where(Lead.company_id == company_id)
        if min_score is not None:
            count_stmt = count_stmt.where(Lead.lead_score >= min_score)
        if max_score is not None:
            count_stmt = count_stmt.where(Lead.lead_score <= max_score)
        
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Sorting
        if sort_by and hasattr(Lead, sort_by):
            column = getattr(Lead, sort_by)
            if sort_order.lower() == "asc":
                stmt = stmt.order_by(column.asc())
            else:
                stmt = stmt.order_by(column.desc())
        else:
            # Default: Sort by lead score desc, then created_at desc
            stmt = stmt.order_by(Lead.lead_score.desc(), Lead.created_at.desc())
        
        # Pagination
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().unique().all(), total
    
    async def get_my_leads(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[LeadStatus] = None
    ):
        """Get leads assigned to a specific user"""
        return await self.get_multi(
            skip=skip,
            limit=limit,
            assigned_to=user_id,
            status=status
        )
    
    async def get_qualified_leads(
        self,
        skip: int = 0,
        limit: int = 100
    ):
        """Get all qualified leads ready for conversion"""
        return await self.get_multi(
            skip=skip,
            limit=limit,
            status=LeadStatus.QUALIFIED
        )
    
    async def convert_to_deal(self, lead_id: int, deal_id: int) -> Optional[Lead]:
        """Mark a lead as converted to a deal"""
        from sqlalchemy import update
        result = await self.db.execute(
            update(Lead)
            .where(Lead.id == lead_id)
            .values(
                converted_to_deal_id=deal_id,
                conversion_date=datetime.utcnow(),
                lead_status=LeadStatus.QUALIFIED
            )
            .returning(Lead)
        )
        await self.db.flush()
        lead = result.scalar_one_or_none()
        if lead:
            return await self.get_by_public_id_with_details(lead.public_id)
        return None
    
    async def update_score(self, lead_id: int, score: int) -> Optional[Lead]:
        """Update lead score"""
        from sqlalchemy import update
        # Ensure score is between 0 and 100
        score = max(0, min(100, score))
        
        result = await self.db.execute(
            update(Lead)
            .where(Lead.id == lead_id)
            .values(lead_score=score)
            .returning(Lead)
        )
        await self.db.flush()
        lead = result.scalar_one_or_none()
        if lead:
            return await self.get_by_public_id_with_details(lead.public_id)
        return None
    
    async def get_stats(self, user_id: Optional[int] = None) -> dict:
        """Get lead statistics, optionally filtered by user"""
        from datetime import date, timedelta
        
        # Base query for counting
        base_stmt = select(func.count(Lead.id)).where(Lead.is_deleted == False)
        if user_id:
            base_stmt = base_stmt.where(Lead.assigned_to == user_id)
        
        total_result = await self.db.execute(base_stmt)
        total = total_result.scalar() or 0
        
        # Count by status
        status_stmt = (
            select(Lead.lead_status, func.count(Lead.id))
            .where(Lead.is_deleted == False)
        )
        if user_id:
            status_stmt = status_stmt.where(Lead.assigned_to == user_id)
        status_stmt = status_stmt.group_by(Lead.lead_status)
        
        status_result = await self.db.execute(status_stmt)
        status_distribution = {status.value: count for status, count in status_result.all()}
        
        # Count by source
        source_stmt = (
            select(Lead.lead_source, func.count(Lead.id))
            .where(Lead.is_deleted == False)
        )
        if user_id:
            source_stmt = source_stmt.where(Lead.assigned_to == user_id)
        source_stmt = source_stmt.group_by(Lead.lead_source)
        
        source_result = await self.db.execute(source_stmt)
        source_distribution = {source.value: count for source, count in source_result.all()}
        
        # Average lead score
        avg_score_stmt = select(func.avg(Lead.lead_score)).where(Lead.is_deleted == False)
        if user_id:
            avg_score_stmt = avg_score_stmt.where(Lead.assigned_to == user_id)
        
        avg_result = await self.db.execute(avg_score_stmt)
        avg_score = avg_result.scalar() or 0
        
        # Conversion rate (qualified / total)
        qualified_count = status_distribution.get(LeadStatus.QUALIFIED.value, 0)
        conversion_rate = (qualified_count / total * 100) if total > 0 else 0
        
        # Leads created this week
        week_ago = datetime.now() - timedelta(days=7)
        week_stmt = base_stmt.where(Lead.created_at >= week_ago)
        week_result = await self.db.execute(week_stmt)
        this_week = week_result.scalar() or 0
        
        return {
            "total": total,
            "by_status": status_distribution,
            "by_source": source_distribution,
            "average_score": round(float(avg_score), 2),
            "conversion_rate": round(conversion_rate, 2),
            "this_week": this_week,
        }
