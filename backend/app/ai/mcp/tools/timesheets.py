"""Timesheet tools — natural-language time logging.

Goes through TimesheetService.create_time_log (the same validation path the manual UI form
uses — holiday/lock/retroactive/duplicate/24h-cap checks) rather than inserting rows directly,
so an AI-logged entry can never bypass a rule a human typing into the form would have to obey.
"""

from __future__ import annotations

from datetime import date as date_type
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import or_, select

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult, ToolRiskTier
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.middleware.exceptions import BadRequestError, NotFoundError
from app.models.project import Project, ProjectTask
from app.models.timesheet import UserTimesheetCategory
from app.schemas.timesheet import ProjectTimeLogCreate
from app.services.timesheet import TimesheetService

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User


async def _resolve_project(db: "AsyncSession", organization_id: int, name: str) -> Optional[Project]:
    result = await db.execute(
        select(Project)
        .where(Project.organization_id == organization_id, Project.name.ilike(f"%{name}%"))
        .limit(1)
    )
    return result.scalars().first()


async def _resolve_task(db: "AsyncSession", project_id: int, name: str) -> Optional[ProjectTask]:
    result = await db.execute(
        select(ProjectTask)
        .where(ProjectTask.project_id == project_id, ProjectTask.is_deleted.is_(False), ProjectTask.title.ilike(f"%{name}%"))
        .limit(1)
    )
    return result.scalars().first()


async def _resolve_category(db: "AsyncSession", organization_id: int, user_id: int, name: str) -> Optional[UserTimesheetCategory]:
    result = await db.execute(
        select(UserTimesheetCategory)
        .where(
            UserTimesheetCategory.organization_id == organization_id,
            or_(UserTimesheetCategory.user_id == user_id, UserTimesheetCategory.is_org_default.is_(True)),
            UserTimesheetCategory.name.ilike(f"%{name}%"),
        )
        .limit(1)
    )
    return result.scalars().first()


class LogTimeTool(BaseTool):
    """Logs a time entry from a natural-language instruction — removes the "which form do
    I fill" friction for anyone who'd rather type a sentence than open the multi-step dialog."""

    definition = ToolDefinition(
        name="log_time",
        description=(
            "Logs a time entry for the current user, against either a project (optionally a "
            "specific task) or a general category. Use this when the user explicitly asks to "
            "log/record hours worked, e.g. 'log 3 hours on Project X for yesterday' or "
            "'log 1.5h under Meetings today'. Resolve relative dates ('today', 'yesterday') "
            "using the current date given in context."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "project": ToolParameterSchema(type="string", description="Project name, if this time is against a project."),
            "task": ToolParameterSchema(type="string", description="Task title within the project, if applicable."),
            "category": ToolParameterSchema(
                type="string",
                description="General timesheet category name (e.g. 'Meetings', 'Admin'), if this isn't project time.",
            ),
            "log_date": ToolParameterSchema(type="string", description="Date in YYYY-MM-DD format."),
            "hours": ToolParameterSchema(type="number", description="Number of hours, in quarter-hour increments (e.g. 1.5)."),
            "notes": ToolParameterSchema(type="string", description="Optional notes for the entry."),
        },
        required_parameters=["log_date", "hours"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            log_date = date_type.fromisoformat(str(params["log_date"]))
        except ValueError:
            return ToolResult(success=False, message="log_date must be in YYYY-MM-DD format.", error="invalid_date")

        try:
            hours = float(params["hours"])
        except (TypeError, ValueError):
            return ToolResult(success=False, message="hours must be a number.", error="invalid_hours")

        project_id = None
        task_id = None
        if params.get("project"):
            project = await _resolve_project(db, user.organization_id, str(params["project"]))
            if project is None:
                return ToolResult(success=False, message=f"No project matching '{params['project']}' was found.", error="not_found")
            project_id = project.id
            if params.get("task"):
                task = await _resolve_task(db, project_id, str(params["task"]))
                if task is None:
                    return ToolResult(success=False, message=f"No task matching '{params['task']}' was found in '{project.name}'.", error="not_found")
                task_id = task.id

        category_id = None
        if params.get("category"):
            category = await _resolve_category(db, user.organization_id, user.id, str(params["category"]))
            if category is None:
                return ToolResult(success=False, message=f"No timesheet category matching '{params['category']}' was found.", error="not_found")
            category_id = category.id

        if project_id is None and category_id is None:
            return ToolResult(
                success=False,
                message="Specify either a project (optionally with a task) or a general category to log time against.",
                error="missing_target",
            )

        payload = ProjectTimeLogCreate(
            project_id=project_id,
            task_id=task_id,
            category_id=category_id,
            log_date=log_date,
            hours=hours,
            notes=params.get("notes"),
        )
        try:
            log = await TimesheetService.create_time_log(db, user, payload)
        except (BadRequestError, NotFoundError) as e:
            return ToolResult(success=False, message=e.message, error=e.message)

        target = log.task.title if log.task else log.project.name if log.project else log.category.name if log.category else "general time"
        return ToolResult(
            success=True,
            message=f"Logged {log.hours}h on {target} for {log.log_date.isoformat()}.",
            data={"time_log_id": log.id, "target": target, "hours": log.hours, "log_date": log.log_date.isoformat()},
            records_affected=1,
        )


registry.register(LogTimeTool())
