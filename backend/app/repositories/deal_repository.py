"""Deal Repository"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.deal import Deal, DealStage, DealType
from app.repositories.base import BaseRepository


class DealRepository(BaseRepository[Deal]):
    """Repository for Deal model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Deal, db)
    
    async def get_by_public_id(self, public_id: UUID) -> Optional[Deal]:
        """Get deal by public_id (UUID)"""
        result = await self.db.execute(
            select(Deal).where(Deal.public_id == public_id)
        )
        return result.scalars().first()
    
    async def create(self, obj_in: dict[str, Any]) -> Deal:
        """Create a new deal and return with eager loaded relationships"""
        deal = await super().create(obj_in)
        # Fetch with details to avoid lazy loading issues in FastAPI response serialization
        return await self.get_by_public_id_with_details(deal.public_id)

    async def update(self, id: int, obj_in: dict[str, Any]) -> Optional[Deal]:
        """Update a deal and return with eager loaded relationships"""
        deal = await super().update(id, obj_in)
        if deal:
            return await self.get_by_public_id_with_details(deal.public_id)
        return None
    
    async def get_by_public_id_with_details(self, public_id: UUID) -> Optional[Deal]:
        """Get deal by public_id with all related data"""
        result = await self.db.execute(
            select(Deal)
            .where(Deal.public_id == public_id)
            .options(
                joinedload(Deal.company),
                joinedload(Deal.contact),
                joinedload(Deal.original_lead),
                joinedload(Deal.assigned_user)
            )
        )
        return result.scalars().first()
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        search: Optional[str] = None,
        stage: Optional[DealStage] = None,
        deal_type: Optional[DealType] = None,
        assigned_to: Optional[int] = None,
        company_id: Optional[int] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ):
        """Get multiple deals with filtering and pagination"""
        stmt = (
            select(Deal)
            .options(
                joinedload(Deal.company),
                joinedload(Deal.contact),
                joinedload(Deal.assigned_user)
            )
        )
        
        if not include_deleted:
            stmt = stmt.where(Deal.is_deleted == False)
        
        # Search filter
        if search:
            search_filter = or_(
                Deal.title.ilike(f"%{search}%"),
                Deal.description.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
        
        # Stage filter
        if stage:
            stmt = stmt.where(Deal.deal_stage == stage)
        
        # Deal Type filter
        if deal_type:
            stmt = stmt.where(Deal.deal_type == deal_type)
        
        # Assigned to filter
        if assigned_to:
            stmt = stmt.where(Deal.assigned_to == assigned_to)
        
        # Company filter
        if company_id:
            stmt = stmt.where(Deal.company_id == company_id)
        
        # Count query
        count_stmt = select(func.count(Deal.id)).select_from(Deal)
        if not include_deleted:
            count_stmt = count_stmt.where(Deal.is_deleted == False)
        if search:
            count_stmt = count_stmt.where(search_filter)
        if stage:
            count_stmt = count_stmt.where(Deal.deal_stage == stage)
        if deal_type:
            count_stmt = count_stmt.where(Deal.deal_type == deal_type)
        if assigned_to:
            count_stmt = count_stmt.where(Deal.assigned_to == assigned_to)
        if company_id:
            count_stmt = count_stmt.where(Deal.company_id == company_id)
        
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Sorting
        if sort_by and hasattr(Deal, sort_by):
            column = getattr(Deal, sort_by)
            if sort_order.lower() == "asc":
                stmt = stmt.order_by(column.asc())
            else:
                stmt = stmt.order_by(column.desc())
        else:
            stmt = stmt.order_by(Deal.created_at.desc())
        
        # Pagination
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().unique().all(), total
    
    async def get_pipeline_summary(self, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Get deal pipeline summary by stage"""
        stmt = (
            select(Deal.deal_stage, func.count(Deal.id), func.sum(Deal.deal_value))
            .where(Deal.is_deleted == False)
        )
        
        if user_id:
            stmt = stmt.where(Deal.assigned_to == user_id)
            
        stmt = stmt.group_by(Deal.deal_stage)
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        summary = {stage.value: {"count": 0, "total_value": 0} for stage in DealStage}
        total_value = 0
        total_count = 0
        
        for stage, count, val in rows:
            summary[stage.value] = {
                "count": count,
                "total_value": float(val or 0)
            }
            total_value += float(val or 0)
            total_count += count
            
        return {
            "stages": summary,
            "total_value": total_value,
            "total_count": total_count
        }
