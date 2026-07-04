"""Project Management endpoints — Projects, Tasks, and configurable Task Statuses.

A Project is typically created by converting a Won CRMDeal (see the
POST /crm/deals/{public_id}/convert-to-project endpoint in crm.py). Tasks and
sub-tasks share one flat "project-tasks" resource; a sub-task is just a task
with parent_task_id set.
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.models.plan import Module
from app.services.plan_access import require_module
from app.services.project import ProjectService
from app.schemas.common import PaginatedResponse
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectBulkUpdateRequest,
    ProjectStatsResponse,
    ProjectTaskCreate,
    ProjectTaskUpdate,
    ProjectTaskResponse,
    ProjectTaskStatusResponse,
    ProjectTaskStatusesUpdateRequest,
)

router = APIRouter(prefix="/projects", tags=["Project Management"])

# Every route here also depends on require_pm_module (plan-gated on Module.PROJECT_MANAGEMENT).
require_project_access = require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER])
require_project_admin = require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_COORDINATOR])
require_pm_module = require_module(Module.PROJECT_MANAGEMENT)

# Separate routers (not nested under /projects) since "project-task-statuses" and
# an individual task/sub-task are each their own top-level resource.
router_statuses = APIRouter(prefix="/project-task-statuses", tags=["Project Management"])
router_tasks = APIRouter(prefix="/project-tasks", tags=["Project Management"])


# --- Task Statuses (tenant-configurable) ---
@router_statuses.get(
    "",
    response_model=list[ProjectTaskStatusResponse],
    summary="List this organization's configurable task statuses",
)
async def list_project_task_statuses_endpoint(
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectTaskStatusResponse]:
    from app.repositories.project import ProjectTaskStatusRepository
    statuses = await ProjectTaskStatusRepository.list_all(db)
    return [ProjectTaskStatusResponse.model_validate(s) for s in statuses]


@router_statuses.patch(
    "",
    response_model=list[ProjectTaskStatusResponse],
    summary="Create, update, reorder, and delete this organization's task statuses",
)
async def update_project_task_statuses_endpoint(
    payload: ProjectTaskStatusesUpdateRequest,
    current_user: User = Depends(require_project_admin),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectTaskStatusResponse]:
    statuses = await ProjectService.update_task_statuses(db, payload.statuses)
    return [ProjectTaskStatusResponse.model_validate(s) for s in statuses]


# --- Projects ---
@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a project",
)
async def create_project_endpoint(
    payload: ProjectCreate,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await ProjectService.create_project(db, payload)
    return ProjectResponse.model_validate(project)


@router.get(
    "",
    response_model=PaginatedResponse[ProjectResponse],
    summary="List projects",
)
async def list_projects_endpoint(
    status_filter: Optional[str] = Query(None, alias="status"),
    owner_id: Optional[int] = Query(None),
    company_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ProjectResponse]:
    items, total = await ProjectService.list_projects(
        db, status=status_filter, owner_id=owner_id, company_id=company_id, page=page, page_size=page_size, search=search
    )
    return PaginatedResponse[ProjectResponse](
        items=[ProjectResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/stats",
    response_model=ProjectStatsResponse,
    summary="Get aggregate project stats for the stats panel",
)
async def get_project_stats_endpoint(
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> ProjectStatsResponse:
    stats = await ProjectService.get_stats(db)
    return ProjectStatsResponse(**stats)


@router.patch(
    "/bulk",
    response_model=list[ProjectResponse],
    summary="Bulk reassign owner and/or change status on multiple projects",
)
async def bulk_update_projects_endpoint(
    payload: ProjectBulkUpdateRequest,
    current_user: User = Depends(require_project_admin),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectResponse]:
    projects = await ProjectService.bulk_update_projects(db, payload.public_ids, payload.owner_id, payload.status)
    return [ProjectResponse.model_validate(p) for p in projects]


@router.get(
    "/{public_id}",
    response_model=ProjectResponse,
    summary="Get a project",
)
async def get_project_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await ProjectService.get_project(db, public_id)
    return ProjectResponse.model_validate(project)


@router.patch(
    "/{public_id}",
    response_model=ProjectResponse,
    summary="Update a project",
)
async def update_project_endpoint(
    public_id: uuid.UUID,
    payload: ProjectUpdate,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await ProjectService.update_project(db, public_id, payload)
    return ProjectResponse.model_validate(project)


@router.delete(
    "/{public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project (and every task/sub-task under it)",
)
async def delete_project_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_project_admin),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
):
    await ProjectService.delete_project(db, public_id)


# --- Project Tasks (and sub-tasks) ---
@router.get(
    "/{public_id}/tasks",
    response_model=list[ProjectTaskResponse],
    summary="List every task and sub-task in a project (flat list, all depths)",
)
async def list_project_tasks_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectTaskResponse]:
    tasks = await ProjectService.list_project_tasks(db, public_id)
    return [ProjectTaskResponse.model_validate(t) for t in tasks]


@router.post(
    "/{public_id}/tasks",
    response_model=ProjectTaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a top-level task in a project",
)
async def create_project_task_endpoint(
    public_id: uuid.UUID,
    payload: ProjectTaskCreate,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> ProjectTaskResponse:
    task = await ProjectService.create_task(db, public_id, payload)
    return ProjectTaskResponse.model_validate(task)


@router_tasks.post(
    "/{task_public_id}/subtasks",
    response_model=ProjectTaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a sub-task under an existing task",
)
async def create_subtask_endpoint(
    task_public_id: uuid.UUID,
    payload: ProjectTaskCreate,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> ProjectTaskResponse:
    task = await ProjectService.create_subtask(db, task_public_id, payload)
    return ProjectTaskResponse.model_validate(task)


@router_tasks.patch(
    "/{task_public_id}",
    response_model=ProjectTaskResponse,
    summary="Update a task or sub-task",
)
async def update_project_task_endpoint(
    task_public_id: uuid.UUID,
    payload: ProjectTaskUpdate,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> ProjectTaskResponse:
    task = await ProjectService.update_task(db, task_public_id, payload)
    return ProjectTaskResponse.model_validate(task)


@router_tasks.delete(
    "/{task_public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task (and every sub-task under it)",
)
async def delete_project_task_endpoint(
    task_public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
):
    await ProjectService.delete_task(db, task_public_id)
