"""CRM Task Endpoints"""

from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User, UserRole
from app.models.crm_task import CRMTaskStatus, CRMTaskPriority, CRMRelatedToType
from app.schemas.crm_task import CRMTaskCreate, CRMTaskUpdate, CRMTaskRead, CRMTaskListResponse
from app.services.crm_task_service import CRMTaskService

router = APIRouter()


@router.get("/", response_model=CRMTaskListResponse)
async def get_tasks(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[CRMTaskStatus] = None,
    priority: Optional[CRMTaskPriority] = None,
    assigned_to: Optional[int] = None,
    related_to_type: Optional[CRMRelatedToType] = None,
    related_to_id: Optional[int] = None,
    overdue_only: bool = Query(False),
    due_soon_only: bool = Query(False),
    sort_by: Optional[str] = "due_date",
    sort_order: str = "asc"
) -> Any:
    """Get all tasks with pagination and filters"""
    service = CRMTaskService(db)
    items, total = await service.get_tasks(
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
    return {"items": items, "total": total}


@router.post("/", response_model=CRMTaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: CRMTaskCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles([UserRole.MANAGER, UserRole.ADMIN, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER]))
) -> Any:
    """Create a new task"""
    service = CRMTaskService(db)
    return await service.create_task(task_in, current_user.id)


@router.get("/{public_id}", response_model=CRMTaskRead)
async def get_task(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get task by public_id"""
    service = CRMTaskService(db)
    return await service.get_task(public_id)


@router.put("/{public_id}", response_model=CRMTaskRead)
async def update_task(
    public_id: UUID,
    task_in: CRMTaskUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Update task info"""
    service = CRMTaskService(db)
    return await service.update_task(public_id, task_in, current_user.id)


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[CRMTaskRead])
async def get_tasks_for_entity(
    entity_type: CRMRelatedToType,
    entity_id: int,
    include_completed: bool = Query(False),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get all tasks for a specific entity"""
    service = CRMTaskService(db)
    return await service.get_tasks_for_entity(entity_type, entity_id, include_completed)


@router.delete("/{public_id}")
async def delete_task(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles([UserRole.ADMIN]))
) -> Any:
    """Delete task"""
    service = CRMTaskService(db)
    await service.delete_task(public_id, current_user.id)
    return {"message": "Task deleted successfully"}
