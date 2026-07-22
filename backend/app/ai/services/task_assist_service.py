"""
AI Engine — Task Assist Service
================================

Direct, single-purpose LLM calls for the Project Management "IRIS" task panel: description
writing/typo-fixing, task health insights, and hour estimation. These are one-shot text/JSON
transforms, not multi-step agentic work, so they bypass the Planner/tool-call machinery
entirely and follow the same direct provider.complete() pattern as JobRoleExtractionService
(see app/ai/services/extraction_service.py).
"""

from __future__ import annotations

import json
import logging
import re
from datetime import date
from typing import Any, TYPE_CHECKING

from app.ai.prompts.loader import loader
from app.ai.providers import get_llm_provider
from app.models.project import ProjectTask
from app.repositories.project import ProjectTaskRepository

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User

logger = logging.getLogger(__name__)


def _extract_json_object(raw: str) -> dict[str, Any]:
    """Same tolerant JSON extraction as Planner._parse_response -- the LLM sometimes wraps its
    JSON in a markdown fence or adds stray text around it despite instructions not to."""
    raw_strip = raw.strip()
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw_strip, re.DOTALL)
    if match:
        cleaned = match.group(1)
    else:
        first, last = raw_strip.find("{"), raw_strip.rfind("}")
        cleaned = raw_strip[first:last + 1] if first != -1 and last != -1 else raw_strip
    return json.loads(cleaned)


class TaskAssistService:
    def __init__(self, db: "AsyncSession", user: "User"):
        self._db = db
        self._user = user

    async def enhance_description(self, text: str, mode: str = "improve") -> str:
        """Fixes typos/grammar, tightens wording, or expands a short hint into a fuller
        description -- returns plain markdown text, not JSON, since this is a direct
        text-in/text-out transform with nothing structured to parse out of it."""
        system_prompt = loader.render("system/iris_description_enhance.md", {"mode": mode})
        provider = await get_llm_provider(
            self._db, org_id=self._user.organization_id, user_id=self._user.id,
            action_type="description_enhance",
        )
        response = await provider.complete(
            system_prompt=system_prompt,
            user_message=text or "(empty -- write a short, generic task description placeholder the user can edit)",
            temperature=0.3,
        )
        # Strip an accidental wrapping code fence -- description is rendered as markdown, not code.
        content = response.content.strip()
        content = re.sub(r"^```(?:markdown)?\s*|\s*```$", "", content)
        return content.strip()

    async def get_task_insights(self, task: ProjectTask) -> dict[str, Any]:
        subtasks = task.subtasks or []
        done_subtasks = sum(1 for s in subtasks if s.completed_at is not None)
        days_until_due = None
        if task.due_date:
            days_until_due = (task.due_date - date.today()).days

        context = {
            "title": task.title,
            "description": task.description or "",
            "status": task.status.name if task.status else None,
            "priority": task.priority.value if task.priority else None,
            "estimated_hours": float(task.estimated_hours) if task.estimated_hours is not None else None,
            "actual_hours": float(task.actual_hours) if task.actual_hours is not None else None,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "days_until_due": days_until_due,
            "is_completed": task.completed_at is not None,
            "subtasks_total": len(subtasks),
            "subtasks_done": done_subtasks,
            "subtasks": [
                {"title": s.title, "done": s.completed_at is not None}
                for s in subtasks
            ],
        }

        system_prompt = loader.render("system/iris_task_insight.md", {})
        provider = await get_llm_provider(
            self._db, org_id=self._user.organization_id, user_id=self._user.id,
            action_type="task_insight",
        )
        response = await provider.complete(
            system_prompt=system_prompt,
            user_message=f"Analyze this task:\n```json\n{json.dumps(context, indent=2)}\n```",
            temperature=0.1,
        )
        try:
            data = _extract_json_object(response.content)
        except (json.JSONDecodeError, ValueError):
            logger.warning("Task insight response was not valid JSON: %s", response.content[:200])
            return {"health": "on_track", "risk_reasons": [], "suggestions": []}

        return {
            "health": data.get("health", "on_track"),
            "risk_reasons": data.get("risk_reasons", []),
            "suggestions": data.get("suggestions", []),
        }

    async def estimate_hours(self, task: ProjectTask) -> dict[str, Any]:
        history = await ProjectTaskRepository.list_recent_completed_with_hours(
            self._db, project_id=task.project_id, limit=10, exclude_task_id=task.id,
        )
        historical_examples = [
            {
                "title": t.title,
                "estimated_hours": float(t.estimated_hours) if t.estimated_hours is not None else None,
                "actual_hours": float(t.actual_hours) if t.actual_hours is not None else None,
            }
            for t in history
        ]

        context = {
            "title": task.title,
            "description": task.description or "",
            "subtasks": [s.title for s in (task.subtasks or [])],
            "similar_past_tasks": historical_examples,
        }

        system_prompt = loader.render("system/iris_task_estimate.md", {})
        provider = await get_llm_provider(
            self._db, org_id=self._user.organization_id, user_id=self._user.id,
            action_type="task_estimate",
        )
        response = await provider.complete(
            system_prompt=system_prompt,
            user_message=f"Estimate the effort for this task:\n```json\n{json.dumps(context, indent=2)}\n```",
            temperature=0.1,
        )
        try:
            data = _extract_json_object(response.content)
            return {
                "estimated_hours": float(data["estimated_hours"]),
                "rationale": str(data.get("rationale", "")),
            }
        except (json.JSONDecodeError, ValueError, KeyError, TypeError):
            logger.warning("Task estimate response was not valid JSON: %s", response.content[:200])
            return {"estimated_hours": None, "rationale": "IRIS couldn't produce an estimate for this task."}
