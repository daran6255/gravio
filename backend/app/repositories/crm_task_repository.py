"""CRM Task Repository"""

from typing import Optional, List, Any
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.crm_task import CRMTask, CRMTaskStatus, CRMTaskPriority, CRMRelatedToType
from app.repositories.base import BaseRepository


class CRMTaskRepository(BaseRepository[CRMTask]):
    """Repository for CRMTask model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(CRMTask, db)
    
    async def get_by_public_id(self, public_id: UUID) -> Optional[CRMTask]:
        """Get task by public_id (UUID)"""
        result = await self.db.execute(
            select(CRMTask)
            .where(CRMTask.public_id == public_id)
            .options(joinedload(CRMTask.assigned_user))
        )
        return result.scalars().first()
    
    async def create(self, obj_in: dict[str, Any]) -> CRMTask:
        """Create a new task and return with eager loaded relationships"""
        task = await super().create(obj_in)
        # Fetch with details to avoid lazy loading issues in FastAPI response serialization
        return await self.get_by_public_id(task.public_id)

    async def update(self, id: int, obj_in: dict[str, Any]) -> Optional[CRMTask]:
        """Update a task and return with eager loaded relationships"""
        task = await super().update(id, obj_in)
        if task:
            return await self.get_by_public_id(task.public_id)
        return None
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        search: Optional[str] = None,
        status: Optional[CRMTaskStatus] = None,
        priority: Optional[CRMTaskPriority] = None,
        assigned_to: Optional[int] = None,
        related_to_type: Optional[CRMRelatedToType] = None,
        related_to_id: Optional[int] = None,
        overdue_only: bool = False,
        due_soon_only: bool = False,
        sort_by: Optional[str] = None,
        sort_order: str = "asc"
    ):
        """Get multiple tasks with filtering and pagination"""
        stmt = (
            select(CRMTask)
            .options(
                joinedload(CRMTask.assigned_user),
                joinedload(CRMTask.creator)
            )
        )
        
        if not include_deleted:
            stmt = stmt.where(CRMTask.is_deleted == False)
        
        # Search filter
        if search:
            search_filter = or_(
                CRMTask.title.ilike(f"%{search}%"),
                CRMTask.description.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
        
        # Status/Priority/Assigned filters
        if status:
            stmt = stmt.where(CRMTask.status == status)
        if priority:
            stmt = stmt.where(CRMTask.priority == priority)
        if assigned_to:
            stmt = stmt.where(CRMTask.assigned_to == assigned_to)
            
        # Polymorphic filters
        if related_to_type:
            stmt = stmt.where(CRMTask.related_to_type == related_to_type)
        if related_to_id:
            stmt = stmt.where(CRMTask.related_to_id == related_to_id)
            
        # Time-based filters
        now = datetime.utcnow()
        if overdue_only:
            stmt = stmt.where(
                and_(
                    CRMTask.due_date < now,
                    CRMTask.status.notin_([CRMTaskStatus.COMPLETED, CRMTaskStatus.CANCELLED])
                )
            )
        elif due_soon_only:
            # Within next 24 hours
            tomorrow = now + timedelta(days=1)
            stmt = stmt.where(
                and_(
                    CRMTask.due_date >= now,
                    CRMTask.due_date <= tomorrow,
                    CRMTask.status.notin_([CRMTaskStatus.COMPLETED, CRMTaskStatus.CANCELLED])
                )
            )
        
        # Count query
        # (Re-executing filters is best for accurate count in pagination)
        # For brevity in this task, I'll assume standard pagination logic or a helper
        
        # Sorting
        if sort_by and hasattr(CRMTask, sort_by):
            column = getattr(CRMTask, sort_by)
            if sort_order.lower() == "asc":
                stmt = stmt.order_by(column.asc())
            else:
                stmt = stmt.order_by(column.desc())
        else:
            stmt = stmt.order_by(CRMTask.due_date.asc())
        
        # Pagination and execution
        total_stmt = select(func.count()).select_from(stmt.subquery())
        total_res = await self.db.execute(total_stmt)
        total = total_res.scalar() or 0
        
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return result.scalars().unique().all(), total

    async def get_tasks_for_entity(
        self,
        entity_type: CRMRelatedToType,
        entity_id: int,
        include_completed: bool = False
    ) -> List[CRMTask]:
        """Get all tasks related to a specific entity"""
        stmt = (
            select(CRMTask)
            .where(CRMTask.related_to_type == entity_type)
            .where(CRMTask.related_to_id == entity_id)
            .where(CRMTask.is_deleted == False)
        )
        
        if not include_completed:
            stmt = stmt.where(CRMTask.status != CRMTaskStatus.COMPLETED)
            
        stmt = stmt.order_by(CRMTask.due_date.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
