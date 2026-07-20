"""Productivity tools — cross-module, useful to any user regardless of which module they work in.

This is the first real tool registered with the engine (Phase 0 of the AI feature roadmap):
it exists to prove the full chain works end to end (planner picks it, engine executes it,
result gets synthesized into a reply) before module-specific tools (CRM, Timesheets, HR) are
built on top of the same pattern.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.models.project import ProjectTask, ProjectTaskStatus

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User


class ListMyOpenTasksTool(BaseTool):
    """Lists the current user's open (not-done) project tasks across every project they're
    assigned to, so ARIA can answer "what's on my plate?" without the user opening the app."""

    definition = ToolDefinition(
        name="list_my_open_tasks",
        description=(
            "Lists the current user's open (not completed) project tasks across all projects, "
            "sorted by due date. Use this when the user asks what they need to work on, what's "
            "due, or wants a summary of their open tasks."
        ),
        category="productivity",
        is_read_only=True,
        requires_approval=False,
        parameters={
            "limit": ToolParameterSchema(
                type="integer",
                description="Maximum number of tasks to return (default 10, max 25).",
                default=10,
            ),
        },
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        limit = min(int(params.get("limit") or 10), 25)

        result = await db.execute(
            select(ProjectTask)
            .join(ProjectTaskStatus, ProjectTaskStatus.id == ProjectTask.status_id)
            .where(
                ProjectTask.organization_id == user.organization_id,
                ProjectTask.assignee_id == user.id,
                ProjectTask.is_deleted.is_(False),
                ProjectTaskStatus.is_done_status.is_(False),
            )
            .options(selectinload(ProjectTask.project), selectinload(ProjectTask.status))
            .order_by(ProjectTask.due_date.asc().nulls_last())
            .limit(limit)
        )
        tasks = list(result.scalars().all())

        if not tasks:
            return ToolResult(success=True, message="No open tasks assigned to you.", data={"tasks": []})

        task_summaries = [
            {
                "title": t.title,
                "project": t.project.name,
                "status": t.status.name,
                "priority": t.priority.value,
                "due_date": t.due_date.isoformat() if t.due_date else None,
            }
            for t in tasks
        ]
        # The Synthesizer relays this message verbatim (it's a fast deterministic formatter,
        # not a second LLM call) — so the task list has to be spelled out here.
        lines = [
            f"- {t.title} ({t.project.name}, {t.status.name}"
            + (f", due {t.due_date.isoformat()}" if t.due_date else "")
            + ")"
            for t in tasks
        ]
        message = f"You have {len(tasks)} open task(s):\n" + "\n".join(lines)

        return ToolResult(
            success=True,
            message=message,
            data={"tasks": task_summaries},
        )


registry.register(ListMyOpenTasksTool())
