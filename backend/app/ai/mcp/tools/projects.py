"""Project/task tools — find a task, break it into subtasks, summarize its comment thread.

`create_subtasks` is the one designed to be triggered from an `@ARIA` mention right inside a
task's description or comments (see the roadmap) as much as from the general chat drawer —
either way it lands here, since both paths go through the same AIEngine.
"""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.middleware.exceptions import BadRequestError, NotFoundError
from app.models.audit import AuditLog
from app.models.project import ProjectTask
from app.schemas.project import ProjectTaskCreate
from app.services.project import ProjectService

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User


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
        requires_approval=False,
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
        requires_approval=False,
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
        requires_approval=False,
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


registry.register(SearchProjectTasksTool())
registry.register(CreateSubtasksTool())
registry.register(SummarizeTaskCommentsTool())
