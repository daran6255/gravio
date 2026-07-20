"""CRM tools — search/summarize leads, log activities, create follow-up tasks.

The most repetitive, most-skipped part of a sales rep's day is logging what happened and
remembering to follow up (see the AI feature roadmap). These tools target exactly that,
reusing CRMService for writes so audit logging / notifications stay identical to the normal
UI-driven path — the tools are just another caller of the same service layer.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from datetime import date as date_type
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.middleware.exceptions import BadRequestError, NotFoundError
from app.models.crm import ActivityType, CRMActivity, CRMLead
from app.schemas.crm import CRMActivityCreate, CRMLeadTaskCreate
from app.services.crm import CRMService

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User


async def _resolve_lead(db: "AsyncSession", organization_id: int, identifier: str) -> Optional[CRMLead]:
    """Looks a lead up by public_id if `identifier` is a UUID, otherwise by a fuzzy title
    match — chat users refer to leads by name, not by the UUID the rest of the app uses."""
    identifier = identifier.strip()

    try:
        public_id = uuid.UUID(identifier)
    except ValueError:
        public_id = None

    if public_id is not None:
        result = await db.execute(
            select(CRMLead)
            .options(selectinload(CRMLead.owner))
            .where(
                CRMLead.public_id == public_id,
                CRMLead.organization_id == organization_id,
                CRMLead.is_deleted.is_(False),
            )
        )
        lead = result.scalars().first()
        if lead:
            return lead

    result = await db.execute(
        select(CRMLead)
        .options(selectinload(CRMLead.owner))
        .where(
            CRMLead.organization_id == organization_id,
            CRMLead.is_deleted.is_(False),
            CRMLead.title.ilike(f"%{identifier}%"),
        )
        .order_by(CRMLead.last_activity_at.desc().nulls_last())
        .limit(1)
    )
    return result.scalars().first()


class SearchCrmLeadsTool(BaseTool):
    """Search/list leads, optionally filtered to stale ones — powers both "find this lead"
    and "which leads need a follow-up" style questions."""

    definition = ToolDefinition(
        name="search_crm_leads",
        description=(
            "Searches CRM leads by title, or lists leads that haven't had any activity logged "
            "in a while (stale leads needing follow-up). Use this to find a lead before acting "
            "on it, or to answer 'which leads need attention' style questions."
        ),
        category="crm",
        is_read_only=True,
        requires_approval=False,
        parameters={
            "query": ToolParameterSchema(
                type="string",
                description="Text to search for in the lead title. Omit to list leads instead of searching.",
            ),
            "stale_days": ToolParameterSchema(
                type="integer",
                description="If set, only return leads with no activity in at least this many days (or never contacted).",
            ),
            "limit": ToolParameterSchema(
                type="integer",
                description="Maximum number of leads to return (default 10, max 25).",
                default=10,
            ),
        },
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        limit = min(int(params.get("limit") or 10), 25)
        query = (params.get("query") or "").strip()
        stale_days = params.get("stale_days")

        conditions = [
            CRMLead.organization_id == user.organization_id,
            CRMLead.is_deleted.is_(False),
        ]
        if query:
            conditions.append(CRMLead.title.ilike(f"%{query}%"))
        if stale_days is not None:
            cutoff = datetime.now(timezone.utc) - timedelta(days=int(stale_days))
            conditions.append(or_(CRMLead.last_activity_at.is_(None), CRMLead.last_activity_at < cutoff))

        result = await db.execute(
            select(CRMLead)
            .options(selectinload(CRMLead.owner))
            .where(*conditions)
            .order_by(CRMLead.last_activity_at.asc().nulls_first())
            .limit(limit)
        )
        leads = list(result.scalars().all())

        if not leads:
            return ToolResult(success=True, message="No matching leads found.", data={"leads": []})

        now = datetime.now(timezone.utc)
        lead_summaries = [
            {
                "public_id": str(lead.public_id),
                "title": lead.title,
                "status": lead.status.value,
                "priority": lead.priority.value,
                "owner": lead.owner.full_name if lead.owner else None,
                "last_activity_at": lead.last_activity_at.isoformat() if lead.last_activity_at else None,
                "days_since_activity": (now - lead.last_activity_at).days if lead.last_activity_at else None,
            }
            for lead in leads
        ]
        # The Synthesizer relays this message verbatim (it's a fast deterministic formatter,
        # not a second LLM call) — so a "which leads need attention" question needs the actual
        # lead names/ages spelled out here, not just a count.
        lines = [
            f"- {s['title']} ({s['status']}, owner: {s['owner'] or 'unassigned'}"
            + (f", {s['days_since_activity']}d since last activity" if s['days_since_activity'] is not None else ", no activity yet")
            + ")"
            for s in lead_summaries
        ]
        message = f"Found {len(leads)} lead(s):\n" + "\n".join(lines)

        return ToolResult(
            success=True,
            message=message,
            data={"leads": lead_summaries},
        )


class GetCrmLeadDetailsTool(BaseTool):
    """Fetches a single lead plus its recent activity history — the read that powers
    "summarize this lead / what's the status" style questions."""

    definition = ToolDefinition(
        name="get_crm_lead_details",
        description=(
            "Fetches full details for one CRM lead — status, priority, owner, estimated value — "
            "plus its most recent activity history. Use this to summarize a lead or answer "
            "questions about what's happened on it recently."
        ),
        category="crm",
        is_read_only=True,
        requires_approval=False,
        parameters={
            "lead": ToolParameterSchema(
                type="string",
                description="The lead's title (or exact public ID if already known).",
            ),
        },
        required_parameters=["lead"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        lead = await _resolve_lead(db, user.organization_id, str(params["lead"]))
        if lead is None:
            return ToolResult(success=False, message=f"No lead matching '{params['lead']}' was found.", error="not_found")

        activity_result = await db.execute(
            select(CRMActivity)
            .where(
                CRMActivity.organization_id == user.organization_id,
                CRMActivity.entity_type == "lead",
                CRMActivity.entity_id == lead.id,
                CRMActivity.is_deleted.is_(False),
            )
            .order_by(CRMActivity.created_at.desc())
            .limit(5)
        )
        activities = list(activity_result.scalars().all())

        # The Synthesizer relays this message verbatim to the user rather than re-summarizing
        # `data` itself (it's a fast deterministic formatter, not a second LLM call) — so the
        # tool has to do the summarizing here, not just confirm a fetch happened.
        summary_parts = [
            f"'{lead.title}' — {lead.status.value}, {lead.priority.value} priority, "
            f"owned by {lead.owner.full_name if lead.owner else 'no one yet'}."
        ]
        if lead.estimated_value:
            summary_parts.append(f"Estimated value: {lead.currency} {lead.estimated_value:,.2f}.")
        if activities:
            latest = activities[0]
            summary_parts.append(f"Most recent activity: {latest.type.value} — \"{latest.subject}\".")
            if latest.description:
                summary_parts.append(latest.description)
        else:
            summary_parts.append("No activity has been logged on this lead yet.")

        return ToolResult(
            success=True,
            message=" ".join(summary_parts),
            data={
                "public_id": str(lead.public_id),
                "title": lead.title,
                "status": lead.status.value,
                "priority": lead.priority.value,
                "source": lead.source.value if lead.source else None,
                "owner": lead.owner.full_name if lead.owner else None,
                "estimated_value": float(lead.estimated_value) if lead.estimated_value else None,
                "currency": lead.currency,
                "description": lead.description,
                "last_activity_at": lead.last_activity_at.isoformat() if lead.last_activity_at else None,
                "recent_activities": [
                    {
                        "type": a.type.value,
                        "subject": a.subject,
                        "description": a.description,
                        "is_completed": a.is_completed,
                        "created_at": a.created_at.isoformat(),
                    }
                    for a in activities
                ],
            },
        )


class LogCrmActivityTool(BaseTool):
    """Logs an activity (note/call/email/meeting) against a lead — the write that removes
    the friction of "I did the call but forgot to log it"."""

    definition = ToolDefinition(
        name="log_crm_activity",
        description=(
            "Logs an activity (a note, call, email, or meeting) against a CRM lead. Use this "
            "when the user explicitly says they did something with a lead and wants it recorded "
            "— e.g. 'log that I called Acme Corp, no answer'."
        ),
        category="crm",
        is_read_only=False,
        requires_approval=False,
        parameters={
            "lead": ToolParameterSchema(type="string", description="The lead's title (or public ID)."),
            "activity_type": ToolParameterSchema(
                type="string",
                description="Type of activity.",
                enum=[t.value for t in ActivityType],
                default="note",
            ),
            "subject": ToolParameterSchema(type="string", description="Short subject line for the activity."),
            "description": ToolParameterSchema(type="string", description="Longer free-text detail, if any."),
        },
        required_parameters=["lead", "subject"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        lead = await _resolve_lead(db, user.organization_id, str(params["lead"]))
        if lead is None:
            return ToolResult(success=False, message=f"No lead matching '{params['lead']}' was found.", error="not_found")

        try:
            activity_type = ActivityType(params.get("activity_type") or "note")
        except ValueError:
            activity_type = ActivityType.NOTE

        payload = CRMActivityCreate(
            type=activity_type,
            subject=str(params["subject"]),
            description=params.get("description"),
            entity_type="lead",
            entity_id=lead.id,
            is_completed=True,
        )
        try:
            activity = await CRMService.create_activity(db, payload, user.id)
        except (NotFoundError, BadRequestError) as e:
            return ToolResult(success=False, message=e.message, error=e.message)

        return ToolResult(
            success=True,
            message=f"Logged a {activity_type.value} on lead '{lead.title}'.",
            data={"activity_id": activity.id, "lead_public_id": str(lead.public_id)},
            records_affected=1,
        )


class CreateCrmLeadTaskTool(BaseTool):
    """Creates a follow-up task on a lead — the write that stops "remember to follow up"
    from living only in someone's head."""

    definition = ToolDefinition(
        name="create_crm_lead_task",
        description=(
            "Creates a follow-up task on a CRM lead. Use this when the user asks to be reminded "
            "to do something with a lead — e.g. 'remind me to follow up with Acme Corp next Tuesday'."
        ),
        category="crm",
        is_read_only=False,
        requires_approval=False,
        parameters={
            "lead": ToolParameterSchema(type="string", description="The lead's title (or public ID)."),
            "title": ToolParameterSchema(type="string", description="Short title for the task."),
            "due_date": ToolParameterSchema(type="string", description="Due date in YYYY-MM-DD format, if any."),
            "notes": ToolParameterSchema(type="string", description="Additional notes for the task, if any."),
        },
        required_parameters=["lead", "title"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        lead = await _resolve_lead(db, user.organization_id, str(params["lead"]))
        if lead is None:
            return ToolResult(success=False, message=f"No lead matching '{params['lead']}' was found.", error="not_found")

        due_date = None
        if params.get("due_date"):
            try:
                due_date = date_type.fromisoformat(str(params["due_date"]))
            except ValueError:
                return ToolResult(success=False, message="due_date must be in YYYY-MM-DD format.", error="invalid_date")

        payload = CRMLeadTaskCreate(title=str(params["title"]), due_date=due_date, notes=params.get("notes"))
        try:
            task = await CRMService.create_lead_task(db, lead.public_id, payload, user.id)
        except (NotFoundError, BadRequestError) as e:
            return ToolResult(success=False, message=e.message, error=e.message)

        return ToolResult(
            success=True,
            message=f"Created follow-up task '{task.title}' on lead '{lead.title}'.",
            data={"task_id": task.id, "lead_public_id": str(lead.public_id)},
            records_affected=1,
        )


registry.register(SearchCrmLeadsTool())
registry.register(GetCrmLeadDetailsTool())
registry.register(LogCrmActivityTool())
registry.register(CreateCrmLeadTaskTool())
