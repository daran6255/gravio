"""Booking scheduler tools — find slots, schedule/cancel/reschedule meetings, list
upcoming meetings, all through natural language ("find me a slot tomorrow and book a
call with this lead").

Reuses app/services/booking.py directly for every mutation, so an AI-initiated booking
goes through the exact same conflict-safe, Google-sync-with-fallback path a public
booking page visitor would — no separate/looser logic for the AI-driven case.
"""

from __future__ import annotations

import uuid
from datetime import date as date_type, datetime, timezone
from typing import TYPE_CHECKING, Any, Optional

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.middleware.exceptions import BadRequestError, NotFoundError
from app.models.booking import BookingPage, CancelledBy, MeetingStatus
from app.repositories.booking import BookingPageRepository, ScheduledMeetingRepository
from app.schemas.booking import ScheduleMeetingRequest
from app.services import booking as booking_service

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User


async def _resolve_own_booking_page(db: "AsyncSession", user: "User", slug: Optional[str]) -> BookingPage:
    """Resolves which of the user's own booking pages a tool call refers to — the
    slug if given, otherwise their only/first active page. Chat users book on their
    own page, never someone else's, so no cross-user lookup is exposed here."""
    if slug:
        page = await BookingPageRepository.get_by_slug(db, slug.strip())
        if page is None or page.user_id != user.id:
            raise NotFoundError(f"No booking page with link '{slug}' owned by you was found.")
        return page

    pages = await BookingPageRepository.list_for_user(db, user_id=user.id)
    active_pages = [p for p in pages if p.is_active]
    if not active_pages:
        raise NotFoundError(
            "You don't have an active booking page yet. Create one in Settings > Booking before scheduling meetings."
        )
    return active_pages[0]


class FindAvailableMeetingSlotsTool(BaseTool):
    """Finds open meeting slots on the user's own booking page for a given day."""

    definition = ToolDefinition(
        name="find_available_meeting_slots",
        description=(
            "Finds available meeting slots on the current user's own booking page for a specific "
            "date. Use this before scheduling a meeting, or to answer 'when am I free' questions."
        ),
        category="booking",
        is_read_only=True,
        requires_approval=False,
        parameters={
            "date": ToolParameterSchema(type="string", description="Date to check, format YYYY-MM-DD."),
            "timezone": ToolParameterSchema(
                type="string", description="IANA timezone to interpret the date/times in (defaults to the booking page's own timezone).",
            ),
            "booking_page_slug": ToolParameterSchema(
                type="string", description="Which booking page to check, if the user has more than one. Omit to use their only/primary page.",
            ),
        },
        required_parameters=["date"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        page = await _resolve_own_booking_page(db, user, params.get("booking_page_slug"))
        try:
            target_date = date_type.fromisoformat(params["date"])
        except ValueError:
            raise BadRequestError("date must be in YYYY-MM-DD format")
        viewer_tz = (params.get("timezone") or page.timezone).strip()

        slots = await booking_service.compute_available_slots(db, page, target_date, viewer_tz)
        slot_list = [{"start_time": s.isoformat(), "end_time": e.isoformat()} for s, e in slots]

        return ToolResult(
            success=True,
            message=(
                f"Found {len(slot_list)} available {page.duration_minutes}-minute slot(s) on {target_date.isoformat()} "
                f"({viewer_tz}) for '{page.title}'." if slot_list else
                f"No available slots on {target_date.isoformat()} ({viewer_tz}) for '{page.title}'."
            ),
            data={"booking_page_slug": page.slug, "duration_minutes": page.duration_minutes, "slots": slot_list},
        )


class ScheduleMeetingTool(BaseTool):
    """Books a meeting on the user's own booking page."""

    definition = ToolDefinition(
        name="schedule_meeting",
        description=(
            "Books a meeting with someone on the current user's own booking page. The exact start_time "
            "should come from find_available_meeting_slots to guarantee it's actually open — an arbitrary "
            "time may be rejected if it conflicts with an existing meeting or falls outside working hours."
        ),
        category="booking",
        is_read_only=False,
        requires_approval=False,
        parameters={
            "client_name": ToolParameterSchema(type="string", description="Full name of the person meeting with the user."),
            "client_email": ToolParameterSchema(type="string", description="Email address of the person meeting with the user."),
            "start_time": ToolParameterSchema(type="string", description="ISO 8601 datetime with timezone offset, e.g. '2026-07-22T15:00:00+05:30'."),
            "attendee_timezone": ToolParameterSchema(type="string", description="IANA timezone of the person being invited, e.g. 'Asia/Kolkata'. Defaults to UTC."),
            "meeting_notes": ToolParameterSchema(type="string", description="Optional agenda/notes for the meeting."),
            "booking_page_slug": ToolParameterSchema(type="string", description="Which booking page to book on, if the user has more than one."),
        },
        required_parameters=["client_name", "client_email", "start_time"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        page = await _resolve_own_booking_page(db, user, params.get("booking_page_slug"))

        try:
            start_time = datetime.fromisoformat(params["start_time"])
        except ValueError:
            raise BadRequestError("start_time must be a valid ISO 8601 datetime")
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        payload = ScheduleMeetingRequest(
            start_time=start_time,
            client_name=params["client_name"],
            client_email=params["client_email"],
            attendee_timezone=params.get("attendee_timezone") or "UTC",
            meeting_notes=params.get("meeting_notes"),
            # AI-initiated bookings generate their own idempotency key — there's no
            # client-side double-submit risk here since the LLM calls this tool once per plan step.
            idempotency_key=f"ai-{uuid.uuid4()}",
        )
        meeting = await booking_service.create_booking(db, page=page, payload=payload)

        link_info = meeting.google_meet_link or "no video link yet (will be added once Google Calendar syncs, or check the fallback note on the booking page)"
        return ToolResult(
            success=True,
            message=(
                f"Booked '{page.title}' with {meeting.client_name} at {meeting.start_time.isoformat()} UTC. "
                f"Meeting link: {link_info}"
            ),
            data={
                "meeting_public_id": str(meeting.public_id),
                "start_time": meeting.start_time.isoformat(),
                "end_time": meeting.end_time.isoformat(),
                "google_meet_link": meeting.google_meet_link,
                "calendar_sync_status": meeting.calendar_sync_status.value,
            },
            records_affected=1,
        )


class ListMyMeetingsTool(BaseTool):
    """Lists the user's own upcoming (or all) scheduled meetings."""

    definition = ToolDefinition(
        name="list_my_meetings",
        description="Lists the current user's scheduled meetings booked through their booking page(s).",
        category="booking",
        is_read_only=True,
        requires_approval=False,
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
                "google_meet_link": m.google_meet_link,
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
        requires_approval=False,
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
        if meeting is None:
            raise NotFoundError("Meeting not found")
        page = await BookingPageRepository.get_by_id(db, meeting.booking_page_id)
        if page is None or page.user_id != user.id:
            raise NotFoundError("Meeting not found")

        meeting = await booking_service.cancel_booking(db, meeting=meeting, cancelled_by=CancelledBy.HOST, reason=params.get("reason"))
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
            "Reschedules a scheduled meeting owned by the current user to a new start time. Use "
            "find_available_meeting_slots first to make sure the new time is actually open."
        ),
        category="booking",
        is_read_only=False,
        requires_approval=False,
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
        if meeting is None:
            raise NotFoundError("Meeting not found")
        page = await BookingPageRepository.get_by_id(db, meeting.booking_page_id)
        if page is None or page.user_id != user.id:
            raise NotFoundError("Meeting not found")

        meeting = await booking_service.reschedule_booking(db, meeting=meeting, new_start_time=new_start)
        return ToolResult(
            success=True,
            message=f"Rescheduled the meeting with {meeting.client_name} to {meeting.start_time.isoformat()} UTC.",
            data={"meeting_public_id": str(meeting.public_id), "start_time": meeting.start_time.isoformat()},
            records_affected=1,
        )


registry.register(FindAvailableMeetingSlotsTool())
registry.register(ScheduleMeetingTool())
registry.register(ListMyMeetingsTool())
registry.register(CancelMeetingTool())
registry.register(RescheduleMeetingTool())
