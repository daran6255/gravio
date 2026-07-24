"""Project/task tools — find a task, break it into subtasks, summarize its comment thread.

`create_subtasks` is the one designed to be triggered from an `@IRIS` mention right inside a
task's description or comments (see the roadmap) as much as from the general chat drawer —
either way it lands here, since both paths go through the same AIEngine.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult, ToolRiskTier
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.middleware.exceptions import BadRequestError, NotFoundError
from app.models.audit import AuditLog
from app.models.crm import LeadPriority
from app.models.project import BillingType, ProjectTask, ProjectTaskStatus
from app.models.user import User
from app.schemas.crm import CRMReminderCreate
from app.schemas.project import ProjectTaskCreate, ProjectTaskTag, ProjectTaskUpdate
from app.services.project import ProjectService
from app.services.reminder import ReminderService

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


async def _resolve_task(db: "AsyncSession", organization_id: int, identifier: str) -> Optional[ProjectTask]:
    """Looks a task up by public_id if `identifier` is a UUID, otherwise by a fuzzy title
    match — same pattern as CRM lead resolution, for the same reason: chat users name things,
    they don't know internal IDs."""
    identifier = identifier.strip()

    try:
        public_id = uuid.UUID(identifier)
    except ValueError:
        public_id = None

    if public_id is not None:
        result = await db.execute(
            select(ProjectTask)
            .options(selectinload(ProjectTask.project), selectinload(ProjectTask.status))
            .where(
                ProjectTask.public_id == public_id,
                ProjectTask.organization_id == organization_id,
                ProjectTask.is_deleted.is_(False),
            )
        )
        task = result.scalars().first()
        if task:
            return task

    result = await db.execute(
        select(ProjectTask)
        .options(selectinload(ProjectTask.project), selectinload(ProjectTask.status))
        .where(
            ProjectTask.organization_id == organization_id,
            ProjectTask.is_deleted.is_(False),
            ProjectTask.title.ilike(f"%{identifier}%"),
        )
        .order_by(ProjectTask.created_at.desc())
        .limit(1)
    )
    return result.scalars().first()


class SearchProjectTasksTool(BaseTool):
    """Finds a task by title across every project in the org — the lookup step before
    summarizing a thread or breaking a task into subtasks."""

    definition = ToolDefinition(
        name="search_project_tasks",
        description=(
            "Searches project tasks by title across all projects. Use this to find a task's "
            "identity before summarizing it or creating subtasks under it."
        ),
        category="productivity",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={
            "query": ToolParameterSchema(type="string", description="Text to search for in the task title."),
            "limit": ToolParameterSchema(type="integer", description="Maximum results (default 10, max 25).", default=10),
        },
        required_parameters=["query"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        limit = min(int(params.get("limit") or 10), 25)
        result = await db.execute(
            select(ProjectTask)
            .options(selectinload(ProjectTask.project), selectinload(ProjectTask.status), selectinload(ProjectTask.assignee))
            .where(
                ProjectTask.organization_id == user.organization_id,
                ProjectTask.is_deleted.is_(False),
                ProjectTask.title.ilike(f"%{params['query']}%"),
            )
            .order_by(ProjectTask.created_at.desc())
            .limit(limit)
        )
        tasks = list(result.scalars().all())

        if not tasks:
            return ToolResult(success=True, message="No matching tasks found.", data={"tasks": []})

        task_summaries = [
            {
                "public_id": str(t.public_id),
                "title": t.title,
                "project": t.project.name,
                "status": t.status.name,
                "assignee": t.assignee.full_name if t.assignee else None,
            }
            for t in tasks
        ]
        # The Synthesizer relays this message verbatim (it's a fast deterministic formatter,
        # not a second LLM call) — spell out the matches here for standalone "what tasks are
        # there for X" questions, not just when this is a lookup step before another tool call.
        lines = [f"- {s['title']} ({s['project']}, {s['status']})" for s in task_summaries]
        message = f"Found {len(tasks)} task(s):\n" + "\n".join(lines)

        return ToolResult(success=True, message=message, data={"tasks": task_summaries})


class CreateSubtasksTool(BaseTool):
    """Breaks a task into subtasks — the write behind "break this down for me"."""

    definition = ToolDefinition(
        name="create_subtasks",
        description=(
            "Creates one or more subtasks under an existing project task. Use this when the "
            "user asks to break a task down into smaller steps."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "task": ToolParameterSchema(type="string", description="The parent task's title (or public ID)."),
            "subtasks": ToolParameterSchema(
                type="array",
                description="List of subtask titles to create under the parent task.",
            ),
        },
        required_parameters=["task", "subtasks"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        parent = await _resolve_task(db, user.organization_id, str(params["task"]))
        if parent is None:
            return ToolResult(success=False, message=f"No task matching '{params['task']}' was found.", error="not_found")

        titles = [str(t).strip() for t in (params.get("subtasks") or []) if str(t).strip()]
        if not titles:
            return ToolResult(success=False, message="No subtask titles were provided.", error="invalid_params")

        created = []
        for title in titles:
            try:
                subtask = await ProjectService.create_subtask(
                    db, parent.public_id, ProjectTaskCreate(title=title), current_user=user,
                )
                created.append(subtask.title)
            except (NotFoundError, BadRequestError) as e:
                return ToolResult(
                    success=len(created) > 0,
                    message=f"Created {len(created)} subtask(s) before hitting an error: {e.message}",
                    data={"created": created},
                    records_affected=len(created),
                    error=e.message,
                )

        return ToolResult(
            success=True,
            message=f"Created {len(created)} subtask(s) under '{parent.title}': {', '.join(created)}.",
            data={"parent_public_id": str(parent.public_id), "created": created},
            records_affected=len(created),
        )


async def _resolve_status(db: "AsyncSession", project_id: int, name: str) -> Optional[ProjectTaskStatus]:
    result = await db.execute(
        select(ProjectTaskStatus)
        .where(
            ProjectTaskStatus.project_id == project_id,
            ProjectTaskStatus.is_deleted.is_(False),
            ProjectTaskStatus.name.ilike(name.strip()),
        )
        .limit(1)
    )
    return result.scalars().first()


async def _resolve_assignee(db: "AsyncSession", organization_id: int, identifier: str) -> Optional[User]:
    """Matches by exact email first (unambiguous), then falls back to a fuzzy name match --
    same two-tier resolution style as `_resolve_task` above, for the same reason: the LLM is
    handed whatever the user typed (an email or a first/full name), not an internal user ID."""
    identifier = identifier.strip()
    result = await db.execute(
        select(User)
        .where(User.organization_id == organization_id, User.is_deleted.is_(False), User.email.ilike(identifier))
        .limit(1)
    )
    user = result.scalars().first()
    if user:
        return user

    result = await db.execute(
        select(User)
        .where(User.organization_id == organization_id, User.is_deleted.is_(False), User.full_name.ilike(f"%{identifier}%"))
        .limit(1)
    )
    return result.scalars().first()


class UpdateProjectTaskTool(BaseTool):
    """Edits an existing task or subtask's fields -- title, description, status, priority,
    estimated hours, assignee, due date. This is the write behind IRIS's task-panel "propose an
    edit" flow: the app layer previews this tool's plan and asks the user to confirm before this
    ever executes; the general chat/one-shot paths still get the engine's own risk-tier gate
    (this tool is REVERSIBLE-tier, so that gate stays frictionless unless a plan's estimated
    record impact crosses the approval threshold)."""

    definition = ToolDefinition(
        name="update_project_task",
        description=(
            "Updates fields on an existing project task or subtask: title, description, status, "
            "priority, estimated_hours, actual_hours, assignee, due_date, start_date, billing_type, "
            "tags, task_type, or milestone. Only the fields provided are changed -- omit anything "
            "that shouldn't move. Use search_project_tasks first if you don't already have the "
            "task's exact title or public ID."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "task": ToolParameterSchema(type="string", description="The task's title (or public ID) to update."),
            "title": ToolParameterSchema(type="string", description="New title for the task."),
            "description": ToolParameterSchema(type="string", description="New description (markdown allowed)."),
            "status": ToolParameterSchema(type="string", description="New status name, e.g. 'In Progress', 'Done'."),
            "priority": ToolParameterSchema(type="string", description="New priority.", enum=["low", "medium", "high", "urgent"]),
            "estimated_hours": ToolParameterSchema(type="number", description="New estimated effort in hours."),
            "actual_hours": ToolParameterSchema(type="number", description="New logged/actual hours spent on the task."),
            "assignee": ToolParameterSchema(type="string", description="Email or full name of the person to assign."),
            "due_date": ToolParameterSchema(type="string", description="New due date, ISO format (YYYY-MM-DD)."),
            "start_date": ToolParameterSchema(type="string", description="New start date, ISO format (YYYY-MM-DD)."),
            "billing_type": ToolParameterSchema(type="string", description="Whether this task's time is billable.", enum=["billable", "non_billable"]),
            "tags": ToolParameterSchema(
                type="array",
                description="Full replacement list of label names for this task (e.g. ['frontend', 'urgent']). Replaces all existing tags, not additive.",
            ),
            "task_type": ToolParameterSchema(type="string", description="New task type, e.g. 'Bug', 'Feature', 'Story', or a custom type name."),
            "milestone": ToolParameterSchema(type="string", description="Name of the milestone to attach this task to."),
        },
        required_parameters=["task"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        task = await _resolve_task(db, user.organization_id, str(params["task"]))
        if task is None:
            return ToolResult(success=False, message=f"No task matching '{params['task']}' was found.", error="not_found")

        update_fields: dict[str, Any] = {}
        changed_labels: list[str] = []

        if params.get("title"):
            update_fields["title"] = str(params["title"]).strip()
            changed_labels.append(f"title to '{update_fields['title']}'")

        if params.get("description") is not None:
            update_fields["description"] = str(params["description"])
            changed_labels.append("description")

        if params.get("status"):
            status = await _resolve_status(db, task.project_id, str(params["status"]))
            if status is None:
                return ToolResult(success=False, message=f"No status matching '{params['status']}' was found on this project.", error="not_found")
            update_fields["status_id"] = status.id
            changed_labels.append(f"status to '{status.name}'")

        if params.get("priority"):
            try:
                priority = LeadPriority(str(params["priority"]).strip().lower())
            except ValueError:
                return ToolResult(success=False, message=f"'{params['priority']}' is not a valid priority.", error="invalid_params")
            update_fields["priority"] = priority
            changed_labels.append(f"priority to '{priority.value}'")

        if params.get("estimated_hours") is not None:
            update_fields["estimated_hours"] = float(params["estimated_hours"])
            changed_labels.append(f"estimate to {update_fields['estimated_hours']}h")

        if params.get("assignee"):
            assignee = await _resolve_assignee(db, user.organization_id, str(params["assignee"]))
            if assignee is None:
                return ToolResult(success=False, message=f"No user matching '{params['assignee']}' was found.", error="not_found")
            update_fields["assignee_id"] = assignee.id
            changed_labels.append(f"assignee to {assignee.full_name}")

        if params.get("due_date"):
            try:
                update_fields["due_date"] = date.fromisoformat(str(params["due_date"]))
            except ValueError:
                return ToolResult(success=False, message=f"'{params['due_date']}' is not a valid date (expected YYYY-MM-DD).", error="invalid_params")
            changed_labels.append(f"due date to {update_fields['due_date'].isoformat()}")

        if params.get("start_date"):
            try:
                update_fields["start_date"] = date.fromisoformat(str(params["start_date"]))
            except ValueError:
                return ToolResult(success=False, message=f"'{params['start_date']}' is not a valid date (expected YYYY-MM-DD).", error="invalid_params")
            changed_labels.append(f"start date to {update_fields['start_date'].isoformat()}")

        if params.get("actual_hours") is not None:
            update_fields["actual_hours"] = float(params["actual_hours"])
            changed_labels.append(f"logged hours to {update_fields['actual_hours']}h")

        if params.get("billing_type"):
            try:
                update_fields["billing_type"] = BillingType(str(params["billing_type"]).strip().lower())
            except ValueError:
                return ToolResult(success=False, message=f"'{params['billing_type']}' is not a valid billing type.", error="invalid_params")
            changed_labels.append(f"billing type to '{update_fields['billing_type'].value}'")

        if params.get("tags") is not None:
            names = [str(t).strip() for t in (params.get("tags") or []) if str(t).strip()]
            # Colors aren't user-facing in chat -- reuse each existing tag's color if the name
            # already exists on the task, otherwise fall back to a neutral default.
            existing_colors = {t["name"]: t["color"] for t in (task.tags or [])}
            update_fields["tags"] = [
                ProjectTaskTag(name=name, color=existing_colors.get(name, "#6B7280")) for name in names
            ]
            changed_labels.append(f"tags to [{', '.join(names)}]" if names else "tags cleared")

        if params.get("task_type") or params.get("milestone"):
            custom_fields = dict(task.custom_fields or {})
            if params.get("task_type"):
                custom_fields["task_type"] = str(params["task_type"]).strip()
                changed_labels.append(f"task type to '{custom_fields['task_type']}'")
            if params.get("milestone"):
                custom_fields["milestone"] = str(params["milestone"]).strip()
                changed_labels.append(f"milestone to '{custom_fields['milestone']}'")
            update_fields["custom_fields"] = custom_fields

        if not update_fields:
            return ToolResult(success=False, message="No recognized fields were provided to update.", error="invalid_params")

        try:
            await ProjectService.update_task(db, task.public_id, ProjectTaskUpdate(**update_fields), current_user=user)
        except (NotFoundError, BadRequestError) as e:
            return ToolResult(success=False, message=f"Could not update '{task.title}': {e.message}", error=e.message)

        return ToolResult(
            success=True,
            message=f"Updated '{task.title}': set {', '.join(changed_labels)}.",
            data={"task_public_id": str(task.public_id)},
            records_affected=1,
        )


class SummarizeTaskCommentsTool(BaseTool):
    """Summarizes a task's comment thread — comments are audit-log rows (action='comment'),
    not a dedicated table, so this reads AuditLog directly rather than going through the
    general task-history endpoint (which returns every field-change event, not just comments)."""

    definition = ToolDefinition(
        name="summarize_task_comments",
        description=(
            "Fetches the comment thread on a project task, most recent first. Use this to "
            "summarize what's been discussed on a task or catch the user up on it."
        ),
        category="productivity",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={
            "task": ToolParameterSchema(type="string", description="The task's title (or public ID)."),
            "limit": ToolParameterSchema(type="integer", description="Maximum comments to return (default 15, max 30).", default=15),
        },
        required_parameters=["task"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        task = await _resolve_task(db, user.organization_id, str(params["task"]))
        if task is None:
            return ToolResult(success=False, message=f"No task matching '{params['task']}' was found.", error="not_found")

        limit = min(int(params.get("limit") or 15), 30)
        result = await db.execute(
            select(AuditLog)
            .options(selectinload(AuditLog.changed_by))
            .where(
                AuditLog.organization_id == user.organization_id,
                AuditLog.entity_type == "project_task",
                AuditLog.entity_id == task.id,
                AuditLog.action == "comment",
            )
            .order_by(AuditLog.changed_at.desc())
            .limit(limit)
        )
        comments = list(result.scalars().all())

        if not comments:
            return ToolResult(success=True, message=f"No comments yet on '{task.title}'.", data={"comments": []})

        # The Synthesizer relays this message verbatim (it's a fast deterministic formatter,
        # not a second LLM call) — so the actual comment content has to be in the message
        # itself, not left in `data` for something downstream to summarize later.
        ordered = list(reversed(comments))  # oldest first reads like a thread
        lines = [
            f"- {c.changed_by.full_name if c.changed_by else 'Someone'}: {c.new_value}"
            for c in ordered
        ]
        message = f"{len(comments)} comment(s) on '{task.title}', oldest first:\n" + "\n".join(lines)

        return ToolResult(
            success=True,
            message=message,
            data={
                "task": task.title,
                "comments": [
                    {
                        "author": c.changed_by.full_name if c.changed_by else None,
                        "content": c.new_value,
                        "created_at": c.changed_at.isoformat(),
                    }
                    for c in comments
                ],
            },
        )


class SetTaskReminderTool(BaseTool):
    """Sets a personal reminder on a project task or subtask -- the same reminder feature the
    task side drawer's "Set Reminder" dialog uses (ReminderService, CRMReminder model), just
    reachable from chat. Reminders are delivered later by the backend scheduler; this tool only
    schedules one, it doesn't notify anyone immediately."""

    definition = ToolDefinition(
        name="set_task_reminder",
        description=(
            "Schedules a reminder for the current user about a project task or subtask, to be "
            "delivered at a future date/time. Use this when the user asks to be reminded about a "
            "task -- e.g. 'remind me about this tomorrow' or 'set a reminder for Friday at 9am'."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "task": ToolParameterSchema(type="string", description="The task's title (or public ID) to set a reminder on."),
            "remind_at": ToolParameterSchema(
                type="string",
                description=(
                    "When to send the reminder, ISO 8601 (e.g. '2026-07-25T09:00:00'). If the user "
                    "only gave a date ('tomorrow', 'Friday'), default the time to 09:00."
                ),
            ),
            "message": ToolParameterSchema(type="string", description="Optional note to include with the reminder."),
        },
        required_parameters=["task", "remind_at"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        task = await _resolve_task(db, user.organization_id, str(params["task"]))
        if task is None:
            return ToolResult(success=False, message=f"No task matching '{params['task']}' was found.", error="not_found")

        try:
            remind_at = datetime.fromisoformat(str(params["remind_at"]))
        except ValueError:
            return ToolResult(
                success=False,
                message=f"'{params['remind_at']}' is not a valid date/time (expected ISO 8601, e.g. '2026-07-25T09:00:00').",
                error="invalid_params",
            )
        if remind_at.tzinfo is None:
            remind_at = remind_at.replace(tzinfo=timezone.utc)

        try:
            reminder = await ReminderService.create_reminder(
                db,
                CRMReminderCreate(
                    entity_type="project_task",
                    entity_id=task.id,
                    remind_at=remind_at,
                    message=params.get("message"),
                ),
                created_by_user_id=user.id,
            )
        except (NotFoundError, BadRequestError) as e:
            return ToolResult(success=False, message=f"Could not set reminder on '{task.title}': {e.message}", error=e.message)

        return ToolResult(
            success=True,
            message=f"Reminder set on '{task.title}' for {remind_at.isoformat()}.",
            data={"task_public_id": str(task.public_id), "reminder_public_id": str(reminder.public_id)},
            records_affected=1,
        )


class DeleteProjectTaskTool(BaseTool):
    """Deletes a project task (and its subtasks). DESTRUCTIVE-tier -- always gates for human
    approval before this ever runs, same as CancelMeetingTool."""

    definition = ToolDefinition(
        name="delete_project_task",
        description=(
            "Permanently deletes a project task or subtask, along with any of its own subtasks. "
            "Use search_project_tasks first if you don't already have the task's exact title or "
            "public ID -- this cannot be undone from chat."
        ),
        category="productivity",
        is_read_only=False,
        risk_tier=ToolRiskTier.DESTRUCTIVE,
        parameters={
            "task": ToolParameterSchema(type="string", description="The task's title (or public ID) to delete."),
        },
        required_parameters=["task"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        task = await _resolve_task(db, user.organization_id, str(params["task"]))
        if task is None:
            return ToolResult(success=False, message=f"No task matching '{params['task']}' was found.", error="not_found")

        title = task.title
        try:
            await ProjectService.delete_task(db, task.public_id, current_user=user)
        except (NotFoundError, BadRequestError) as e:
            return ToolResult(success=False, message=f"Could not delete '{title}': {e.message}", error=e.message)

        return ToolResult(
            success=True,
            message=f"Deleted task '{title}'.",
            data={},
            records_affected=1,
        )


registry.register(SearchProjectTasksTool())
registry.register(CreateSubtasksTool())
registry.register(UpdateProjectTaskTool())
registry.register(SummarizeTaskCommentsTool())
registry.register(SetTaskReminderTool())
registry.register(DeleteProjectTaskTool())
