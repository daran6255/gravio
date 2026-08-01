"""Meeting tools — schedule/cancel/reschedule meetings and list upcoming ones, all
through natural language ("book a call with this lead tomorrow at 3pm").

Reuses app/services/booking.py directly for every mutation, so an AI-initiated
meeting goes through the exact same conflict-checked path the New Meeting form does
— no separate/looser logic for the AI-driven case.
"""

from __future__ import annotations

import uuid
from datetime import date as date_type, datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any
from zoneinfo import ZoneInfo

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult, ToolRiskTier
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.middleware.exceptions import BadRequestError, ConflictError, NotFoundError
from app.models.booking import CancelledBy, MeetingLocationType, MeetingStatus
from app.repositories.booking import ScheduledMeetingRepository
from app.schemas.booking import ScheduleMeetingRequest
from app.services import booking as booking_service

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User


async def _suggest_slots(db: "AsyncSession", user: "User", around: datetime, limit: int = 3) -> list[dict]:
    """Up to `limit` open slots on the same host-local calendar day as `around`, so a
    scheduling conflict can offer alternatives in the same turn instead of a dead end."""
    settings = await booking_service.get_or_create_availability_settings(db, user)
    host_tz = ZoneInfo(settings.timezone)
    target_date = around.astimezone(host_tz).date()
    starts = await booking_service.get_available_slots(db, settings=settings, target_date=target_date)
    duration = timedelta(minutes=settings.duration_minutes)
    return [{"start_time": s.isoformat(), "end_time": (s + duration).isoformat()} for s in starts[:limit]]


class ScheduleMeetingTool(BaseTool):
    """Books a meeting directly on the user's own calendar."""

    definition = ToolDefinition(
        name="schedule_meeting",
        description=(
            "Schedules a meeting with someone on the current user's own calendar, at an exact "
            "start and end time. Fails with a conflict if the user already has another meeting "
            "overlapping that time — use list_my_meetings first to check their existing schedule."
        ),
        category="booking",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "client_name": ToolParameterSchema(type="string", description="Full name of the person meeting with the user."),
            "client_email": ToolParameterSchema(type="string", description="Email address of the person meeting with the user."),
            "start_time": ToolParameterSchema(type="string", description="ISO 8601 datetime with timezone offset, e.g. '2026-07-22T15:00:00+05:30'."),
            "end_time": ToolParameterSchema(type="string", description="ISO 8601 datetime with timezone offset for when the meeting ends."),
            "meeting_title": ToolParameterSchema(type="string", description="Optional title for the meeting."),
            "meeting_notes": ToolParameterSchema(type="string", description="Optional agenda/notes for the meeting."),
            "attendee_timezone": ToolParameterSchema(type="string", description="IANA timezone of the person being invited, e.g. 'Asia/Kolkata'. Defaults to UTC."),
            "location_type": ToolParameterSchema(type="string", description="One of 'google_meet', 'offline', or 'phone'. Defaults to 'google_meet'."),
            "location_detail": ToolParameterSchema(type="string", description="The meeting link, address, or phone number, matching location_type."),
        },
        required_parameters=["client_name", "client_email", "start_time", "end_time"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            start_time = datetime.fromisoformat(params["start_time"])
        except ValueError:
            raise BadRequestError("start_time must be a valid ISO 8601 datetime")
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        try:
            end_time = datetime.fromisoformat(params["end_time"])
        except ValueError:
            raise BadRequestError("end_time must be a valid ISO 8601 datetime")
        if end_time.tzinfo is None:
            end_time = end_time.replace(tzinfo=timezone.utc)

        attendee_tz = params.get("attendee_timezone") or "UTC"
        try:
            location_type = MeetingLocationType(params.get("location_type") or "google_meet")
        except ValueError:
            raise BadRequestError("location_type must be one of 'google_meet', 'offline', or 'phone'")

        payload = ScheduleMeetingRequest(
            start_time=start_time,
            end_time=end_time,
            client_name=params["client_name"],
            client_email=params["client_email"],
            host_timezone=attendee_tz,
            attendee_timezone=attendee_tz,
            meeting_title=params.get("meeting_title"),
            meeting_notes=params.get("meeting_notes"),
            location_type=location_type,
            location_detail=params.get("location_detail"),
            # AI-initiated meetings generate their own idempotency key — there's no
            # client-side double-submit risk here since the LLM calls this tool once per plan step.
            idempotency_key=f"ai-{uuid.uuid4()}",
        )
        try:
            meeting, _occurrences_created = await booking_service.create_meeting(db, host=user, payload=payload)
        except ConflictError as e:
            suggestions = await _suggest_slots(db, user, start_time)
            message = e.message
            if suggestions:
                times = ", ".join(s["start_time"] for s in suggestions)
                message += f" Open times that day: {times}."
            return ToolResult(success=False, message=message, error="conflict", data={"suggested_slots": suggestions})

        return ToolResult(
            success=True,
            message=(
                f"Scheduled '{meeting.meeting_title or meeting.client_name}' with {meeting.client_name} "
                f"at {meeting.start_time.isoformat()} UTC."
            ),
            data={
                "meeting_public_id": str(meeting.public_id),
                "start_time": meeting.start_time.isoformat(),
                "end_time": meeting.end_time.isoformat(),
                "location_type": meeting.location_type.value,
                "location_detail": meeting.location_detail,
            },
            records_affected=1,
        )


class FindAvailableSlotsTool(BaseTool):
    """Reports the current user's own open meeting slots on a given day, per their
    configured availability rules and existing calendar."""

    definition = ToolDefinition(
        name="find_available_slots",
        description=(
            "Finds the current user's own open meeting slots on a given day, based on their "
            "configured availability rules and duration/buffer settings, minus anything already "
            "on their calendar. Use for 'when am I free tomorrow' or before scheduling, to avoid "
            "a conflict. Resolve relative dates ('tomorrow', 'this week') to a concrete YYYY-MM-DD "
            "date using the current date given in context -- for a multi-day range, call this "
            "once per day."
        ),
        category="booking",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={
            "target_date": ToolParameterSchema(type="string", description="Day to check, YYYY-MM-DD."),
        },
        required_parameters=["target_date"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            target_date = date_type.fromisoformat(str(params["target_date"]))
        except ValueError:
            return ToolResult(success=False, message="target_date must be in YYYY-MM-DD format.", error="invalid_date")

        settings = await booking_service.get_or_create_availability_settings(db, user)
        starts = await booking_service.get_available_slots(db, settings=settings, target_date=target_date)
        duration = timedelta(minutes=settings.duration_minutes)
        slots = [{"start_time": s.isoformat(), "end_time": (s + duration).isoformat()} for s in starts]

        if not slots:
            return ToolResult(success=True, message=f"No open slots on {target_date.isoformat()}.", data={"slots": []})

        times = ", ".join(s["start_time"] for s in slots)
        return ToolResult(success=True, message=f"Open slots on {target_date.isoformat()}: {times}", data={"slots": slots})


class ListMyMeetingsTool(BaseTool):
    """Lists the user's own upcoming (or all) scheduled meetings."""

    definition = ToolDefinition(
        name="list_my_meetings",
        description="Lists the current user's scheduled meetings.",
        category="booking",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={
            "upcoming_only": ToolParameterSchema(type="boolean", description="If true (default), only future meetings.", default=True),
            "limit": ToolParameterSchema(type="integer", description="Maximum number to return (default 10, max 25).", default=10),
        },
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        limit = min(int(params.get("limit") or 10), 25)
        upcoming_only = params.get("upcoming_only", True)
        start_after = datetime.now(timezone.utc) if upcoming_only else None

        meetings, total = await ScheduledMeetingRepository.list_for_user(
            db, user_id=user.id, status=MeetingStatus.SCHEDULED, start_after=start_after, page=1, page_size=limit,
        )
        items = [
            {
                "meeting_public_id": str(m.public_id),
                "client_name": m.client_name,
                "client_email": m.client_email,
                "start_time": m.start_time.isoformat(),
                "end_time": m.end_time.isoformat(),
                "location_type": m.location_type.value,
                "location_detail": m.location_detail,
            }
            for m in meetings
        ]
        return ToolResult(
            success=True,
            message=f"Found {total} scheduled meeting(s){' upcoming' if upcoming_only else ''}, showing {len(items)}.",
            data={"meetings": items, "total": total},
        )


class CancelMeetingTool(BaseTool):
    """Cancels one of the user's scheduled meetings."""

    definition = ToolDefinition(
        name="cancel_meeting",
        description=(
            "Cancels a scheduled meeting owned by the current user. Use list_my_meetings first to get "
            "the meeting_public_id if you don't already have it."
        ),
        category="booking",
        is_read_only=False,
        risk_tier=ToolRiskTier.DESTRUCTIVE,
        parameters={
            "meeting_public_id": ToolParameterSchema(type="string", description="The meeting's public_id, from list_my_meetings."),
            "reason": ToolParameterSchema(type="string", description="Optional cancellation reason shared with the attendee."),
        },
        required_parameters=["meeting_public_id"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            public_id = uuid.UUID(params["meeting_public_id"])
        except ValueError:
            raise BadRequestError("meeting_public_id must be a valid UUID")

        meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
        if meeting is None or meeting.host_user_id != user.id:
            raise NotFoundError("Meeting not found")

        meeting = await booking_service.cancel_meeting(db, meeting=meeting, cancelled_by=CancelledBy.HOST, reason=params.get("reason"))
        return ToolResult(
            success=True,
            message=f"Cancelled the meeting with {meeting.client_name} that was scheduled for {meeting.start_time.isoformat()} UTC.",
            data={"meeting_public_id": str(meeting.public_id)},
            records_affected=1,
        )


class RescheduleMeetingTool(BaseTool):
    """Reschedules one of the user's scheduled meetings to a new time."""

    definition = ToolDefinition(
        name="reschedule_meeting",
        description=(
            "Reschedules a scheduled meeting owned by the current user to a new start time (its "
            "original duration is kept). Fails with a conflict if the new time overlaps another meeting."
        ),
        category="booking",
        is_read_only=False,
        risk_tier=ToolRiskTier.DESTRUCTIVE,
        parameters={
            "meeting_public_id": ToolParameterSchema(type="string", description="The meeting's public_id, from list_my_meetings."),
            "new_start_time": ToolParameterSchema(type="string", description="New ISO 8601 datetime with timezone offset."),
        },
        required_parameters=["meeting_public_id", "new_start_time"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            public_id = uuid.UUID(params["meeting_public_id"])
        except ValueError:
            raise BadRequestError("meeting_public_id must be a valid UUID")
        try:
            new_start = datetime.fromisoformat(params["new_start_time"])
        except ValueError:
            raise BadRequestError("new_start_time must be a valid ISO 8601 datetime")
        if new_start.tzinfo is None:
            new_start = new_start.replace(tzinfo=timezone.utc)

        meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
        if meeting is None or meeting.host_user_id != user.id:
            raise NotFoundError("Meeting not found")

        meeting = await booking_service.reschedule_meeting(db, meeting=meeting, new_start_time=new_start)
        return ToolResult(
            success=True,
            message=f"Rescheduled the meeting with {meeting.client_name} to {meeting.start_time.isoformat()} UTC.",
            data={"meeting_public_id": str(meeting.public_id), "start_time": meeting.start_time.isoformat()},
            records_affected=1,
        )


registry.register(ScheduleMeetingTool())
registry.register(FindAvailableSlotsTool())
registry.register(ListMyMeetingsTool())
registry.register(CancelMeetingTool())
registry.register(RescheduleMeetingTool())
