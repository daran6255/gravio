"""Company Repository"""

from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company import Company, CompanyStatus
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.crm_task import CRMTask
from app.models.crm_activity_log import CRMActivityLog
from app.repositories.base import BaseRepository


class CompanyRepository(BaseRepository[Company]):
    """Repository for Company model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Company, db)
    
    async def get_by_public_id(self, public_id: UUID) -> Optional[Company]:
        """Get company by public_id (UUID)"""
        result = await self.db.execute(
            select(Company).where(Company.public_id == public_id)
        )
        return result.scalars().first()
    
    async def get_by_public_id_with_details(self, public_id: UUID) -> Optional[Company]:
        """Get company by public_id with all related data"""
        stmt = (
            select(Company)
            .where(Company.public_id == public_id)
            .options(
                selectinload(Company.contacts),
                selectinload(Company.leads).selectinload(Lead.assigned_user),
                selectinload(Company.deals).selectinload(Deal.assigned_user),
                selectinload(Company.tasks).selectinload(CRMTask.assigned_user),
                selectinload(Company.crm_activities).selectinload(CRMActivityLog.performer),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().unique().first()
    
    async def get_by_email(self, email: str) -> Optional[Company]:
        """Get company by email"""
        result = await self.db.execute(
            select(Company).where(Company.email == email)
        )
        return result.scalars().first()
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        search: Optional[str] = None,
        status: Optional[CompanyStatus] = None,
        industry: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: str = "desc"
    ):
        """Get multiple companies with filtering and pagination"""
        stmt = select(Company)
        
        if not include_deleted:
            stmt = stmt.where(Company.is_deleted == False)
        
        # Search filter
        if search:
            search_filter = or_(
                Company.name.ilike(f"%{search}%"),
                Company.email.ilike(f"%{search}%"),
                Company.website.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
        
        # Status filter
        if status:
            stmt = stmt.where(Company.status == status)
        
        # Industry filter
        if industry:
            stmt = stmt.where(Company.industry == industry)
        
        # Count query
        count_stmt = select(func.count(Company.id)).select_from(Company)
        if not include_deleted:
            count_stmt = count_stmt.where(Company.is_deleted == False)
        if search:
            count_stmt = count_stmt.where(search_filter)
        if status:
            count_stmt = count_stmt.where(Company.status == status)
        if industry:
            count_stmt = count_stmt.where(Company.industry == industry)
        
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0
        
        # Sorting
        if sort_by and hasattr(Company, sort_by):
            column = getattr(Company, sort_by)
            if sort_order.lower() == "asc":
                stmt = stmt.order_by(column.asc())
            else:
                stmt = stmt.order_by(column.desc())
        else:
            stmt = stmt.order_by(Company.created_at.desc())
        
        # Pagination
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().all(), total
    
    async def get_stats(self) -> dict:
        """Get company statistics"""
        total = await self.count()
        
        # Count by status
        status_stmt = (
            select(Company.status, func.count(Company.id))
            .where(Company.is_deleted == False)
            .group_by(Company.status)
        )
        status_result = await self.db.execute(status_stmt)
        status_distribution = dict(status_result.all())
        
        # Count by industry
        industry_stmt = (
            select(Company.industry, func.count(Company.id))
            .where(Company.is_deleted == False)
            .where(Company.industry.isnot(None))
            .group_by(Company.industry)
            .order_by(func.count(Company.id).desc())
            .limit(10)
        )
        industry_result = await self.db.execute(industry_stmt)
        top_industries = [{"industry": ind, "count": cnt} for ind, cnt in industry_result.all()]
        
        return {
            "total": total,
            "by_status": status_distribution,
            "top_industries": top_industries,
        }
