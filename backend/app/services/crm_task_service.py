"""CRM Task Service"""

from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.crm_task import CRMTask, CRMTaskStatus, CRMTaskPriority, CRMRelatedToType, CRMTaskType
from app.schemas.crm_task import CRMTaskCreate, CRMTaskUpdate
from app.repositories.crm_task_repository import CRMTaskRepository
from app.models.crm_activity_log import CRMEntityType, CRMActivityType
from app.repositories.crm_activity_log_repository import CRMActivityLogRepository


class CRMTaskService:
    """Service for CRM task business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = CRMTaskRepository(db)
        self.activity_log = CRMActivityLogRepository(db)

    async def create_task(self, task_in: CRMTaskCreate, creator_id: int) -> CRMTask:
        """Create a new task and log activity"""
        task_data = task_in.model_dump()
        task_data["created_by"] = creator_id
        
        task = await self.repository.create(task_data)
        
        # Log activity on the related entity if exists
        if task.related_to_type and task.related_to_id:
            await self.activity_log.create({
                "entity_type": CRMEntityType(task.related_to_type.value),
                "entity_id": task.related_to_id,
                "activity_type": CRMActivityType.NOTE_ADDED,
                "performed_by": creator_id,
                "summary": f"Task created: {task.title} (Type: {task.task_type.value})"
            })
            
        return task

    async def get_task(self, public_id: UUID) -> CRMTask:
        """Get task by public_id"""
        task = await self.repository.get_by_public_id(public_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task

    async def get_tasks(
        self,
        skip: int = 0,
        limit: int = 100,
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
    ) -> Tuple[List[CRMTask], int]:
        """Get paginated tasks"""
        return await self.repository.get_multi(
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            priority=priority,
            assigned_to=assigned_to,
            related_to_type=related_to_type,
            related_to_id=related_to_id,
            overdue_only=overdue_only,
            due_soon_only=due_soon_only,
            sort_by=sort_by,
            sort_order=sort_order
        )

    async def update_task(self, public_id: UUID, task_in: CRMTaskUpdate, user_id: int) -> CRMTask:
        """Update task and log activity"""
        task = await self.get_task(public_id)
        
        update_data = task_in.model_dump(exclude_unset=True)
        
        # If completing task
        if update_data.get("status") == CRMTaskStatus.COMPLETED and task.status != CRMTaskStatus.COMPLETED:
            if "completed_date" not in update_data:
                update_data["completed_date"] = datetime.utcnow()
                
        updated_task = await self.repository.update(task.id, update_data)
        
        # Log activity on the related entity if exists
        if task.related_to_type and task.related_to_id and update_data.get("status") == CRMTaskStatus.COMPLETED:
            await self.activity_log.create({
                "entity_type": CRMEntityType(task.related_to_type.value),
                "entity_id": task.related_to_id,
                "activity_type": CRMActivityType.UPDATED,
                "performed_by": user_id,
                "summary": f"Task completed: {task.title}"
            })
            
        # Re-fetch with details to avoid session errors during serialization
        return await self.get_task(public_id)

    async def delete_task(self, public_id: UUID, user_id: int) -> bool:
        """Delete task (soft delete)"""
        task = await self.get_task(public_id)
        return await self.repository.delete(task.id)

    async def get_tasks_for_entity(
        self,
        entity_type: CRMRelatedToType,
        entity_id: int,
        include_completed: bool = False
    ) -> List[CRMTask]:
        """Get all tasks for an entity"""
        return await self.repository.get_tasks_for_entity(entity_type, entity_id, include_completed)
