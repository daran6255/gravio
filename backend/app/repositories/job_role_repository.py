"""Job Role Repository"""

from typing import List, Optional, Any
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.job_role import JobRole, JobRoleStatus


class JobRoleRepository(BaseRepository[JobRole]):
    """Job Role repository for DB operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(JobRole, db)
    
    async def get_multi_with_filters(
        self,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[JobRoleStatus] = None,
        company_id: Optional[int] = None,
        contact_id: Optional[int] = None,
        include_deleted: bool = False,
    ) -> List[JobRole]:
        """Get multiple job roles with advanced filters"""
        query = select(self.model)
        
        # Load relationships
        query = query.options(
            selectinload(self.model.company),
            selectinload(self.model.contact),
            selectinload(self.model.creator)
        )
        
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
            
        if status:
            from datetime import date
            if status == JobRoleStatus.ACTIVE:
                # Active roles must have active status AND not be expired
                query = query.where(
                    (self.model.status == JobRoleStatus.ACTIVE) & 
                    (or_(self.model.close_date == None, self.model.close_date >= date.today()))
                )
            elif status == JobRoleStatus.CLOSED:
                # Closed roles are either explicitly closed OR expired active roles
                query = query.where(or_(
                    self.model.status == JobRoleStatus.CLOSED,
                    (self.model.status == JobRoleStatus.ACTIVE) & (self.model.close_date < date.today())
                ))
            else:
                query = query.where(self.model.status == status)
            
        if company_id:
            query = query.where(self.model.company_id == company_id)
            
        if contact_id:
            query = query.where(self.model.contact_id == contact_id)
            
        if search:
            search_filter = or_(
                self.model.title.ilike(f"%{search}%"),
                self.model.description.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            
        query = query.order_by(self.model.created_at.desc())
        query = query.offset(skip).limit(limit)
        
        result = await self.db.execute(query)
        job_roles = list(result.scalars().all())
        
        # Populate mapping counts
        if job_roles:
            from app.models.placement_mapping import PlacementMapping
            role_ids = [jr.id for jr in job_roles]
            count_query = (
                select(PlacementMapping.job_role_id, func.count(PlacementMapping.id).label("count"))
                .where(PlacementMapping.job_role_id.in_(role_ids))
                .group_by(PlacementMapping.job_role_id)
            )
            count_result = await self.db.execute(count_query)
            counts = {row.job_role_id: row.count for row in count_result}
            
            for jr in job_roles:
                jr.mappings_count = counts.get(jr.id, 0)
                
        return job_roles

    async def count_with_filters(
        self,
        search: Optional[str] = None,
        status: Optional[JobRoleStatus] = None,
        company_id: Optional[int] = None,
        contact_id: Optional[int] = None,
        include_deleted: bool = False,
    ) -> int:
        """Count job roles with filters"""
        query = select(func.count()).select_from(self.model)
        
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
            
        if status:
            from datetime import date
            if status == JobRoleStatus.ACTIVE:
                query = query.where(
                    (self.model.status == JobRoleStatus.ACTIVE) & 
                    (or_(self.model.close_date == None, self.model.close_date >= date.today()))
                )
            elif status == JobRoleStatus.CLOSED:
                query = query.where(or_(
                    self.model.status == JobRoleStatus.CLOSED,
                    (self.model.status == JobRoleStatus.ACTIVE) & (self.model.close_date < date.today())
                ))
            else:
                query = query.where(self.model.status == status)
            
        if company_id:
            query = query.where(self.model.company_id == company_id)
            
        if contact_id:
            query = query.where(self.model.contact_id == contact_id)
            
        if search:
            search_filter = or_(
                self.model.title.ilike(f"%{search}%"),
                self.model.description.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            
        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_by_public_id(self, public_id: Any, include_deleted: bool = False) -> Optional[JobRole]:
        """Get job role by public UUID"""
        query = select(self.model).where(self.model.public_id == public_id)
        
        # Load relationships
        query = query.options(
            selectinload(self.model.company),
            selectinload(self.model.contact),
            selectinload(self.model.creator)
        )
        
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
            
        result = await self.db.execute(query)
        job_role = result.scalar_one_or_none()
        
        if job_role:
            from app.models.placement_mapping import PlacementMapping
            count_query = (
                select(func.count(PlacementMapping.id))
                .where(PlacementMapping.job_role_id == job_role.id)
            )
            count_result = await self.db.execute(count_query)
            job_role.mappings_count = count_result.scalar_one()
            
        return job_role
