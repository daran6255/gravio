"""Project Management endpoints — Projects, Tasks, and configurable Task Statuses.

A Project is typically created by converting a Won CRMDeal (see the
POST /crm/deals/{public_id}/convert-to-project endpoint in crm.py). Tasks and
sub-tasks share one flat "project-tasks" resource; a sub-task is just a task
with parent_task_id set.
"""

import os
import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import require_roles
from app.models.project import ProjectTask
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
    ProjectTaskFileResponse,
    TaskCommentCreate,
    IrisMessageRequest,
    IrisPreviewResponse,
    IrisPlannedStep,
    TaskInsightResponse,
    TaskEstimateResponse,
)
from app.schemas.crm import AuditLogResponse
from app.utils.file_validation import validate_upload
from app.middleware.exceptions import NotFoundError, BadRequestError, ServiceUnavailableError
from app.services.currency import CurrencyConversionService

router = APIRouter(prefix="/projects", tags=["Project Management"])

# Every route here also depends on require_pm_module (plan-gated on Module.PROJECT_MANAGEMENT).
require_project_access = require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER])
require_project_admin = require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.PROJECT_COORDINATOR])
require_pm_module = require_module(Module.PROJECT_MANAGEMENT)

# "project-tasks" is its own top-level resource (not nested under /projects) since
# an individual task/sub-task is addressed directly by its own public_id.
router_tasks = APIRouter(prefix="/project-tasks", tags=["Project Management"])


# --- Task Statuses (project-configurable, nested under the owning project) ---
@router.get(
    "/{public_id}/task-statuses",
    response_model=list[ProjectTaskStatusResponse],
    summary="List a project's configurable task statuses",
)
async def list_project_task_statuses_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectTaskStatusResponse]:
    from app.repositories.project import ProjectTaskStatusRepository
    project = await ProjectService.get_project(db, public_id)
    statuses = await ProjectTaskStatusRepository.list_by_project(db, project_id=project.id)
    # Projects created before this project's board was seeded (edge case / data
    # repair) would otherwise show an empty board with no columns to drop tasks
    # into -- lazily seed the same defaults a new project gets.
    if not statuses:
        statuses = await ProjectService.seed_project_task_statuses(db, project, project.template_key)
    return [ProjectTaskStatusResponse.model_validate(s) for s in statuses]


@router.patch(
    "/{public_id}/task-statuses",
    response_model=list[ProjectTaskStatusResponse],
    summary="Create, update, reorder, and delete this project's task statuses",
)
async def update_project_task_statuses_endpoint(
    public_id: uuid.UUID,
    payload: ProjectTaskStatusesUpdateRequest,
    current_user: User = Depends(require_project_admin),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectTaskStatusResponse]:
    project = await ProjectService.get_project(db, public_id)
    statuses = await ProjectService.update_task_statuses(db, project.id, payload.statuses)
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
    project = await ProjectService.create_project(db, payload, current_user)
    await CurrencyConversionService.attach_display_value(
        db, project, value_field="budget", currency_field="currency", user_currency=current_user.currency,
    )
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
    page_size: int = Query(20, ge=1, le=500),
    search: Optional[str] = Query(None),
    assigned_to_me: bool = Query(False, description="Only projects the current user owns or has a task assigned in"),
    exclude_completed: bool = Query(False, description="Exclude projects in a terminal status (completed/approved/invoiced/canceled)"),
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ProjectResponse]:
    items, total = await ProjectService.list_projects(
        db,
        status=status_filter,
        owner_id=owner_id,
        company_id=company_id,
        page=page,
        page_size=page_size,
        search=search,
        assigned_to_me_user_id=current_user.id if assigned_to_me else None,
        exclude_completed=exclude_completed,
    )
    await CurrencyConversionService.attach_display_values(
        db, items, value_field="budget", currency_field="currency", user_currency=current_user.currency,
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
    user_currency = current_user.currency
    display_total_budget = None
    if user_currency:
        from datetime import date
        total_in_user_currency = 0.0
        has_conversion = False
        for item in stats.get("budget_by_currency", []):
            rate = await CurrencyConversionService.get_rate(
                db, from_currency=item["currency"], to_currency=user_currency, on_date=date.today()
            )
            if rate is not None:
                total_in_user_currency += item["total"] * float(rate)
                has_conversion = True
        if has_conversion:
            display_total_budget = round(total_in_user_currency, 2)
    stats["display_total_budget"] = display_total_budget
    stats["display_currency"] = user_currency
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
    await CurrencyConversionService.attach_display_values(
        db, projects, value_field="budget", currency_field="currency", user_currency=current_user.currency,
    )
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
    await CurrencyConversionService.attach_display_value(
        db, project, value_field="budget", currency_field="currency", user_currency=current_user.currency,
    )
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
    await CurrencyConversionService.attach_display_value(
        db, project, value_field="budget", currency_field="currency", user_currency=current_user.currency,
    )
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
    assigned_to_me: bool = Query(False, description="Only tasks assigned to the current user"),
    exclude_done: bool = Query(False, description="Exclude tasks in a done-status column"),
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectTaskResponse]:
    tasks = await ProjectService.list_project_tasks(
        db,
        public_id,
        assignee_id=current_user.id if assigned_to_me else None,
        exclude_done=exclude_done,
    )
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
    task = await ProjectService.create_task(db, public_id, payload, current_user)
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
    task = await ProjectService.create_subtask(db, task_public_id, payload, current_user)
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
    task = await ProjectService.update_task(db, task_public_id, payload, current_user)
    return ProjectTaskResponse.model_validate(task)


@router_tasks.get(
    "/{task_public_id}/history",
    response_model=PaginatedResponse[AuditLogResponse],
    summary="Get a task's field-level change history",
)
async def get_task_history_endpoint(
    task_public_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AuditLogResponse]:
    items, total = await ProjectService.get_task_history(db, task_public_id, page, page_size)
    return PaginatedResponse[AuditLogResponse](
        items=[AuditLogResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# Matches the plain "@iris " text CommentsSection.tsx inserts when a user picks IRIS from the
# same mention-suggestion list used for @user (see RichTextEditor.tsx / CommentsSection.tsx --
# mentions there are just styled substrings, not structured nodes, so detecting one server-side
# is a plain text match).
IRIS_MENTION_RE = re.compile(r"@iris\b", re.IGNORECASE)


@router_tasks.post(
    "/{task_public_id}/comments",
    response_model=AuditLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to a task",
)
async def create_task_comment_endpoint(
    task_public_id: uuid.UUID,
    payload: TaskCommentCreate,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> AuditLogResponse:
    from app.services.audit import AuditService
    task = await ProjectService.get_task(db, task_public_id)
    comment_log = await AuditService.record(
        db,
        entity_type="project_task",
        entity_id=task.id,
        action="comment",
        changed_by_user_id=current_user.id,
        new_value=payload.content,
    )
    await db.commit()
    await db.refresh(comment_log)

    # If IRIS was @mentioned, run the rest of the comment text as an agentic instruction
    # scoped to this task and post the reply as a follow-up comment (changed_by_user_id=None
    # marks it as system/AI-authored). Runs synchronously -- same tradeoff as the existing
    # /ai/chat and /ai/tasks/run endpoints, which also block on the LLM call.
    if IRIS_MENTION_RE.search(payload.content):
        from app.ai.brain.engine import AIEngine
        from app.ai.schemas.requests import AITaskRunRequest

        instruction = IRIS_MENTION_RE.sub("", payload.content).strip()
        engine = AIEngine(db, current_user)
        result = await engine.run(AITaskRunRequest(
            trigger_type="manual",
            task_hint=instruction or f"Help with the task '{task.title}'.",
            input_data={"entity_type": "project_task", "entity_id": task.id, "task_title": task.title},
        ))
        reply_text = result.summary or (f"⚠️ {result.error}" if result.error else None)
        if reply_text:
            await AuditService.record(
                db,
                entity_type="project_task",
                entity_id=task.id,
                action="comment",
                changed_by_user_id=None,
                new_value=reply_text,
            )
            await db.commit()

    return comment_log


# --- IRIS task assist (propose-then-confirm) ---
# Powers the "Ask IRIS" panel in the task drawer: /preview plans without touching the DB so the
# UI can show the user what's about to happen; /execute is only called after the user confirms.

async def _get_task_with_subtasks(db: AsyncSession, task_public_id: uuid.UUID) -> ProjectTask:
    result = await db.execute(
        select(ProjectTask)
        .options(selectinload(ProjectTask.subtasks).selectinload(ProjectTask.status))
        .where(ProjectTask.public_id == task_public_id, ProjectTask.is_deleted.is_(False))
    )
    task = result.scalars().first()
    if task is None:
        raise NotFoundError("Task not found")
    return task


async def _build_iris_input_data(db: AsyncSession, task: ProjectTask) -> dict:
    """Gives the planner each subtask's exact public_id, and this project's real configured
    status names, up front.

    Without the subtask IDs, an instruction like "mark all subtasks as completed" leaves the
    LLM knowing only the parent task -- it has to fall back to search_project_tasks' fuzzy,
    organization-wide title match to find each subtask, which risks resolving to (and silently
    editing) an unrelated same-titled task in a different project.

    Without the real status list, the LLM guesses a plausible-sounding status name (e.g. "Done"
    or "Complete") for update_project_task's `status` param -- statuses are per-project and
    tenant-configurable (a board might call its done column "Handover", "Closed", "Shipped",
    anything), so a guessed name almost never matches and the tool call fails outright. That
    failure is also wasted: the planning call itself already succeeded and was charged, so a
    plan that's doomed to fail from a bad guess burns credits for nothing (see refund_last_charge
    in the engine for the case where every step in a plan still ends up failing anyway).
    """
    from app.repositories.project import ProjectTaskStatusRepository

    statuses = await ProjectTaskStatusRepository.list_by_project(db, project_id=task.project_id)

    return {
        "task_public_id": str(task.public_id),
        "task_title": task.title,
        "available_statuses": [s.name for s in statuses],
        "subtasks": [
            {
                "public_id": str(s.public_id),
                "title": s.title,
                "status": s.status.name if s.status else None,
                "is_done": s.completed_at is not None,
            }
            for s in (task.subtasks or [])
            if not s.is_deleted
        ],
    }


@router_tasks.post(
    "/{task_public_id}/iris/preview",
    response_model=IrisPreviewResponse,
    summary="Ask IRIS what it would do for this task, without executing anything",
)
async def preview_iris_action(
    task_public_id: uuid.UUID,
    payload: IrisMessageRequest,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> IrisPreviewResponse:
    from app.ai.brain.engine import AIEngine
    from app.ai.brain.exceptions import LLMProviderError, LLMResponseParseError, NoPlanGeneratedError, PlanningError
    from app.ai.schemas.requests import AITaskRunRequest

    task = await _get_task_with_subtasks(db, task_public_id)

    engine = AIEngine(db, current_user)
    try:
        plan = await engine.preview(AITaskRunRequest(
            trigger_type="manual",
            task_hint=payload.message,
            input_data=await _build_iris_input_data(db, task),
        ))
    except NoPlanGeneratedError:
        raise BadRequestError("IRIS couldn't work out a plan for that -- try rephrasing.")
    except LLMResponseParseError:
        raise BadRequestError(
            "IRIS's plan came back malformed -- this can happen when a request needs a lot of "
            "steps at once. Try a more specific or smaller request."
        )
    except PlanningError as e:
        raise BadRequestError(e.message)
    except LLMProviderError as e:
        raise ServiceUnavailableError(e.message)

    return IrisPreviewResponse(
        task_name=plan.task_name,
        response_to_user=plan.response_to_user,
        reasoning=plan.reasoning,
        estimated_record_impact=plan.estimated_record_impact,
        steps=[IrisPlannedStep(tool_name=s.tool_name, parameters=s.parameters, reasoning=s.reasoning) for s in plan.steps],
    )


@router_tasks.post(
    "/{task_public_id}/iris/execute",
    response_model=AuditLogResponse,
    summary="Confirm and run an IRIS action for this task, posting the result as a comment",
)
async def execute_iris_action(
    task_public_id: uuid.UUID,
    payload: IrisMessageRequest,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> AuditLogResponse:
    from app.ai.brain.engine import AIEngine
    from app.ai.schemas.requests import AITaskRunRequest
    from app.services.audit import AuditService

    task = await _get_task_with_subtasks(db, task_public_id)

    engine = AIEngine(db, current_user)
    result = await engine.run(AITaskRunRequest(
        trigger_type="manual",
        task_hint=payload.message,
        input_data=await _build_iris_input_data(db, task),
        # This is the confirm step of IrisTaskPanel's own preview-then-confirm UX (see
        # preview_iris_action above) -- the user already saw and accepted the plan, so skip
        # the engine's own approval gate for this run.
        confirmed=True,
    ))
    reply_text = result.summary or (f"⚠️ {result.error}" if result.error else "IRIS didn't return a result.")
    comment_log = await AuditService.record(
        db,
        entity_type="project_task",
        entity_id=task.id,
        action="comment",
        changed_by_user_id=None,
        new_value=reply_text,
    )
    await db.commit()
    await db.refresh(comment_log)
    return comment_log


@router_tasks.get(
    "/{task_public_id}/iris/insights",
    response_model=TaskInsightResponse,
    summary="Get IRIS's health/risk read on a task",
)
async def get_iris_task_insights(
    task_public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> TaskInsightResponse:
    from app.ai.services.task_assist_service import TaskAssistService

    result = await db.execute(
        select(ProjectTask)
        .options(selectinload(ProjectTask.status), selectinload(ProjectTask.subtasks))
        .where(ProjectTask.public_id == task_public_id, ProjectTask.is_deleted.is_(False))
    )
    task = result.scalars().first()
    if task is None:
        raise NotFoundError("Task not found")

    insights = await TaskAssistService(db, current_user).get_task_insights(task)
    return TaskInsightResponse(**insights)


@router_tasks.post(
    "/{task_public_id}/iris/estimate",
    response_model=TaskEstimateResponse,
    summary="Get an IRIS-suggested hour estimate for a task, grounded in similar past tasks",
)
async def estimate_iris_task_hours(
    task_public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> TaskEstimateResponse:
    from app.ai.services.task_assist_service import TaskAssistService

    result = await db.execute(
        select(ProjectTask)
        .options(selectinload(ProjectTask.subtasks))
        .where(ProjectTask.public_id == task_public_id, ProjectTask.is_deleted.is_(False))
    )
    task = result.scalars().first()
    if task is None:
        raise NotFoundError("Task not found")

    estimate = await TaskAssistService(db, current_user).estimate_hours(task)
    return TaskEstimateResponse(**estimate)


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
    await ProjectService.delete_task(db, task_public_id, current_user)


# --- Task File Attachments ---
@router_tasks.post(
    "/{task_public_id}/files",
    response_model=ProjectTaskFileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a file attachment to a task",
)
async def upload_task_file_endpoint(
    task_public_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> ProjectTaskFileResponse:
    # 404s early (before touching disk) if the task doesn't exist / isn't in this org
    task = await ProjectService.get_task(db, task_public_id)

    org_id = current_user.organization_id
    upload_dir = os.path.join("uploads", f"org_{org_id}", "project_tasks", str(task.id))
    os.makedirs(upload_dir, exist_ok=True)

    file_uuid = uuid.uuid4()
    safe_filename = f"{file_uuid}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    content = await file.read()
    mime_type = validate_upload(file, content)

    with open(file_path, "wb") as f:
        f.write(content)

    try:
        task_file = await ProjectService.create_task_file(
            db,
            task_public_id,
            file_name=file.filename,
            file_path=file_path,
            file_size=len(content),
            mime_type=mime_type,
            owner_id=current_user.id,
        )
        return ProjectTaskFileResponse.model_validate(task_file)
    except Exception:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise


@router_tasks.get(
    "/{task_public_id}/files",
    response_model=list[ProjectTaskFileResponse],
    summary="List files attached to a task",
)
async def list_task_files_endpoint(
    task_public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectTaskFileResponse]:
    files = await ProjectService.list_task_files(db, task_public_id)
    return [ProjectTaskFileResponse.model_validate(f) for f in files]


@router_tasks.get(
    "/{task_public_id}/files/{file_public_id}/download",
    summary="Download a task file attachment",
)
async def download_task_file_endpoint(
    task_public_id: uuid.UUID,
    file_public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
):
    task_file = await ProjectService.get_task_file(db, task_public_id, file_public_id)

    if not os.path.exists(task_file.file_path):
        raise NotFoundError("Physical file not found on server storage")

    return FileResponse(
        path=task_file.file_path,
        filename=task_file.file_name,
        media_type=task_file.mime_type,
    )


@router_tasks.delete(
    "/{task_public_id}/files/{file_public_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task file attachment",
)
async def delete_task_file_endpoint(
    task_public_id: uuid.UUID,
    file_public_id: uuid.UUID,
    current_user: User = Depends(require_project_access),
    _pm: User = Depends(require_pm_module),
    db: AsyncSession = Depends(get_db),
):
    await ProjectService.delete_task_file(db, task_public_id, file_public_id, current_user)
