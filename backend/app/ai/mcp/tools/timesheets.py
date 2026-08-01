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
from app.middleware.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models.project import Project, ProjectTask
from app.models.timesheet import ProjectTimeLog, UserTimesheetCategory
from app.repositories.timesheet import ProjectTimeLogRepository
from app.schemas.timesheet import ProjectTimeLogCreate, ProjectTimeLogUpdate
from app.services.timesheet import TimesheetService, get_week_bounds

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


async def _resolve_time_log_candidates(
    db: "AsyncSession", user: "User", log_date: date_type,
    project: Optional[str], task: Optional[str], category: Optional[str],
) -> tuple[Optional[list[ProjectTimeLog]], Optional[ToolResult]]:
    """Finds the time log(s) on `log_date` matching the given project/task/category name
    hints. Returns (candidates, None) on success, or (None, error_result) if a named
    project/task/category couldn't be resolved at all. An empty or multi-item candidate
    list is left for the caller to turn into a not_found/ambiguous ToolResult -- callers
    that locate-then-act (update/delete) need slightly different wording for each case."""
    project_id = None
    task_id = None
    if project:
        proj = await _resolve_project(db, user.organization_id, project)
        if proj is None:
            return None, ToolResult(success=False, message=f"No project matching '{project}' was found.", error="not_found")
        project_id = proj.id
        if task:
            tsk = await _resolve_task(db, project_id, task)
            if tsk is None:
                return None, ToolResult(success=False, message=f"No task matching '{task}' was found in '{proj.name}'.", error="not_found")
            task_id = tsk.id

    category_id = None
    if category:
        cat = await _resolve_category(db, user.organization_id, user.id, category)
        if cat is None:
            return None, ToolResult(success=False, message=f"No timesheet category matching '{category}' was found.", error="not_found")
        category_id = cat.id

    entries = await ProjectTimeLogRepository.list_for_user(db, user.organization_id, user.id, log_date, log_date)
    if project:
        entries = [e for e in entries if e.project_id == project_id]
    if task:
        entries = [e for e in entries if e.task_id == task_id]
    if category:
        entries = [e for e in entries if e.category_id == category_id]
    return list(entries), None


def _describe_log(log: ProjectTimeLog) -> str:
    """Short, name-free description for disambiguation prompts -- list_for_user doesn't
    eager-load project/task/category relationships, so this sticks to columns already
    loaded on the row rather than triggering a lazy-load in an async context."""
    detail = f"{log.hours}h"
    if log.notes:
        detail += f" ({log.notes})"
    return detail


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


class ListMyTimeLogsTool(BaseTool):
    """Lists the current user's own logged time entries over a date range."""

    definition = ToolDefinition(
        name="list_my_time_logs",
        description=(
            "Lists the current user's own time log entries between two dates (inclusive). "
            "Use this for questions like 'how many hours did I log this week' or 'show what I "
            "logged yesterday'. Resolve relative ranges ('this week', 'yesterday') to concrete "
            "YYYY-MM-DD dates using the current date given in context."
        ),
        category="productivity",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={
            "start_date": ToolParameterSchema(type="string", description="Range start, inclusive, YYYY-MM-DD."),
            "end_date": ToolParameterSchema(type="string", description="Range end, inclusive, YYYY-MM-DD."),
        },
        required_parameters=["start_date", "end_date"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            start_date = date_type.fromisoformat(str(params["start_date"]))
            end_date = date_type.fromisoformat(str(params["end_date"]))
        except ValueError:
            return ToolResult(success=False, message="start_date/end_date must be in YYYY-MM-DD format.", error="invalid_date")

        entries = await ProjectTimeLogRepository.list_for_user(db, user.organization_id, user.id, start_date, end_date)
        total_hours = sum(e.hours for e in entries)
        items = [
            {
                "time_log_id": e.id,
                "log_date": e.log_date.isoformat(),
                "hours": e.hours,
                "status": e.status.value,
                "notes": e.notes,
                "project_id": e.project_id,
                "task_id": e.task_id,
                "category_id": e.category_id,
            }
            for e in entries
        ]
        return ToolResult(
            success=True,
            message=f"Logged {total_hours}h across {len(items)} entr{'y' if len(items) == 1 else 'ies'} from {start_date.isoformat()} to {end_date.isoformat()}.",
            data={"entries": items, "total_hours": total_hours},
        )


class UpdateTimeLogTool(BaseTool):
    """Edits an existing draft/rejected time entry, located by date plus an optional
    project/task/category hint."""

    definition = ToolDefinition(
        name="update_time_log",
        description=(
            "Updates an existing draft or rejected time entry (e.g. 'change yesterday's Project X "
            "entry to 3 hours'). Locate the entry with log_date plus, if there's more than one entry "
            "that day, a project/task/category hint. If more than one entry still matches, this "
            "returns an 'ambiguous' error listing the candidates -- ask the user which one they mean "
            "rather than guessing. Only new_hours/new_notes are supported for changing the entry's "
            "values; the target can't be moved to a different project/task/category through this tool."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "log_date": ToolParameterSchema(type="string", description="Date the entry to edit was logged on, YYYY-MM-DD."),
            "project": ToolParameterSchema(type="string", description="Project name hint to locate the entry, if there's more than one that day."),
            "task": ToolParameterSchema(type="string", description="Task title hint, if applicable."),
            "category": ToolParameterSchema(type="string", description="General category name hint, if applicable."),
            "new_hours": ToolParameterSchema(type="number", description="New number of hours for the entry."),
            "new_notes": ToolParameterSchema(type="string", description="New notes for the entry."),
        },
        required_parameters=["log_date"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            log_date = date_type.fromisoformat(str(params["log_date"]))
        except ValueError:
            return ToolResult(success=False, message="log_date must be in YYYY-MM-DD format.", error="invalid_date")

        if params.get("new_hours") is None and not params.get("new_notes"):
            return ToolResult(success=False, message="Specify new_hours and/or new_notes to change.", error="missing_target")

        candidates, error = await _resolve_time_log_candidates(
            db, user, log_date, params.get("project"), params.get("task"), params.get("category")
        )
        if error is not None:
            return error
        if not candidates:
            return ToolResult(success=False, message=f"No time entry found on {log_date.isoformat()} matching that description.", error="not_found")
        if len(candidates) > 1:
            options = "; ".join(f"#{c.id}: {_describe_log(c)}" for c in candidates)
            return ToolResult(
                success=False,
                message=f"Found {len(candidates)} entries on {log_date.isoformat()} — which one did you mean? {options}",
                error="ambiguous",
                data={"candidates": [c.id for c in candidates]},
            )

        payload = ProjectTimeLogUpdate(
            hours=float(params["new_hours"]) if params.get("new_hours") is not None else None,
            notes=params.get("new_notes"),
        )
        try:
            log = await TimesheetService.update_time_log(db, user, candidates[0].id, payload)
        except (BadRequestError, NotFoundError, ForbiddenError) as e:
            return ToolResult(success=False, message=e.message, error=e.message)

        return ToolResult(
            success=True,
            message=f"Updated the {log.log_date.isoformat()} entry to {log.hours}h.",
            data={"time_log_id": log.id, "hours": log.hours, "log_date": log.log_date.isoformat()},
            records_affected=1,
        )


class DeleteTimeLogTool(BaseTool):
    """Deletes an existing draft/rejected time entry, located the same way as
    update_time_log."""

    definition = ToolDefinition(
        name="delete_time_log",
        description=(
            "Deletes a draft or rejected time entry. Locate it with log_date plus, if needed, a "
            "project/task/category hint. If more than one entry matches, this returns an "
            "'ambiguous' error listing the candidates -- ask the user which one they mean rather "
            "than guessing; never delete when the target isn't unambiguous."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.DESTRUCTIVE,
        parameters={
            "log_date": ToolParameterSchema(type="string", description="Date the entry to delete was logged on, YYYY-MM-DD."),
            "project": ToolParameterSchema(type="string", description="Project name hint to locate the entry, if there's more than one that day."),
            "task": ToolParameterSchema(type="string", description="Task title hint, if applicable."),
            "category": ToolParameterSchema(type="string", description="General category name hint, if applicable."),
        },
        required_parameters=["log_date"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            log_date = date_type.fromisoformat(str(params["log_date"]))
        except ValueError:
            return ToolResult(success=False, message="log_date must be in YYYY-MM-DD format.", error="invalid_date")

        candidates, error = await _resolve_time_log_candidates(
            db, user, log_date, params.get("project"), params.get("task"), params.get("category")
        )
        if error is not None:
            return error
        if not candidates:
            return ToolResult(success=False, message=f"No time entry found on {log_date.isoformat()} matching that description.", error="not_found")
        if len(candidates) > 1:
            options = "; ".join(f"#{c.id}: {_describe_log(c)}" for c in candidates)
            return ToolResult(
                success=False,
                message=f"Found {len(candidates)} entries on {log_date.isoformat()} — which one did you mean? {options}",
                error="ambiguous",
                data={"candidates": [c.id for c in candidates]},
            )

        target = candidates[0]
        try:
            await TimesheetService.delete_time_log(db, user, target.id)
        except (BadRequestError, NotFoundError, ForbiddenError) as e:
            return ToolResult(success=False, message=e.message, error=e.message)

        return ToolResult(
            success=True,
            message=f"Deleted the {target.hours}h entry logged on {log_date.isoformat()}.",
            data={"time_log_id": target.id},
            records_affected=1,
        )


class SubmitWeeklyTimesheetTool(BaseTool):
    """Submits a week's draft/rejected entries to the user's reporting manager."""

    definition = ToolDefinition(
        name="submit_weekly_timesheet",
        description=(
            "Submits the current user's draft/rejected time entries for a given week to their "
            "reporting manager for approval. Use for requests like 'submit this week's timesheet'. "
            "week_start_date must be the Monday of the target week -- resolve 'this week'/'last "
            "week' to that Monday's date using the current date given in context."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "week_start_date": ToolParameterSchema(type="string", description="Monday of the week to submit, YYYY-MM-DD."),
        },
        required_parameters=["week_start_date"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            week_start_date = date_type.fromisoformat(str(params["week_start_date"]))
        except ValueError:
            return ToolResult(success=False, message="week_start_date must be in YYYY-MM-DD format.", error="invalid_date")

        week_start, week_end = get_week_bounds(week_start_date)
        try:
            submitted_count = await TimesheetService.submit_weekly_timesheet(db, user, week_start, week_end)
        except (BadRequestError, NotFoundError, ForbiddenError) as e:
            return ToolResult(success=False, message=e.message, error=e.message)

        return ToolResult(
            success=True,
            message=f"Submitted {submitted_count} time log(s) for the week of {week_start.isoformat()} to your reporting manager.",
            data={"week_start_date": week_start.isoformat(), "submitted_count": submitted_count},
            records_affected=submitted_count,
        )


class RequestWeekUnlockTool(BaseTool):
    """Asks the user's reporting manager to re-open a past, locked week."""

    definition = ToolDefinition(
        name="request_week_unlock",
        description=(
            "Requests that the current user's reporting manager unlock a past week so it can be "
            "edited/submitted again (e.g. 'ask to reopen last week's timesheet, I forgot to log "
            "Tuesday'). week_start_date must be the Monday of that (past, already-ended) week -- "
            "resolve relative phrases like 'last week' to that Monday's date using the current date "
            "given in context. Only past weeks can be unlocked; the current week is never locked."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "week_start_date": ToolParameterSchema(type="string", description="Monday of the past week to unlock, YYYY-MM-DD."),
            "reason": ToolParameterSchema(type="string", description="Why the unlock is needed, shared with the manager."),
        },
        required_parameters=["week_start_date"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            week_start_date = date_type.fromisoformat(str(params["week_start_date"]))
        except ValueError:
            return ToolResult(success=False, message="week_start_date must be in YYYY-MM-DD format.", error="invalid_date")

        week_start, week_end = get_week_bounds(week_start_date)
        try:
            req = await TimesheetService.request_week_unlock(db, user, week_start, week_end, params.get("reason"))
        except (BadRequestError, NotFoundError, ForbiddenError) as e:
            return ToolResult(success=False, message=e.message, error=e.message)

        return ToolResult(
            success=True,
            message=f"Requested an unlock for the week of {week_start.isoformat()} from your reporting manager.",
            data={"request_id": req.id, "week_start_date": week_start.isoformat()},
            records_affected=1,
        )


registry.register(LogTimeTool())
registry.register(ListMyTimeLogsTool())
registry.register(UpdateTimeLogTool())
registry.register(DeleteTimeLogTool())
registry.register(SubmitWeeklyTimesheetTool())
registry.register(RequestWeekUnlockTool())
