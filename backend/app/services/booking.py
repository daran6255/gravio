"""Core business logic for the Calendar & Appointment Booking Scheduler.

Every mutating flow here (create/cancel/reschedule) re-derives slot validity from
the database inside a lock on the parent BookingPage row, rather than trusting a
client-submitted time — see create_booking for the full rationale. Google Calendar
sync is always attempted best-effort and never blocks a booking from succeeding;
app/services/booking_sync_worker.py retries it in the background, and every booking
always gets a working .ics email invite regardless of Google's state (see
app/utils/ics.py).
"""

from __future__ import annotations

from datetime import date as date_type, datetime, time as time_type, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.context import tenant_context
from app.middleware.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models.booking import (
    BookingLocationType,
    BookingPage,
    CalendarSyncStatus,
    CancelledBy,
    GoogleConnectionStatus,
    MeetingStatus,
    ScheduledMeeting,
)
from app.models.crm import ActivityType, CRMContact, CRMLead, LeadSource, LeadStatus
from app.models.user import User
from app.repositories.booking import (
    BookingAvailabilityExceptionRepository,
    BookingPageRepository,
    GoogleOAuthConnectionRepository,
    ScheduledMeetingRepository,
)
from app.repositories.crm import CRMActivityRepository
from app.repositories.reminder import CRMReminderRepository
from app.schemas.booking import ScheduleMeetingRequest
from app.services import google_calendar
from app.utils.email import send_booking_cancelled_email, send_booking_confirmation_email, spawn_email_task
from app.utils.ics import build_meeting_ics

_DAY_KEYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
MEETING_REMINDER_LEAD_MINUTES = 15


# ── Availability / slot computation ─────────────────────────────────────────────

async def _day_availability_ranges(db: AsyncSession, page: BookingPage, host_date: date_type) -> Optional[list[list[str]]]:
    """Returns the effective [start,end] ranges for a host-local date, or None if
    the whole day is blocked (holiday/PTO exception)."""
    exception = await BookingAvailabilityExceptionRepository.get_for_page_and_date(
        db, booking_page_id=page.id, date=host_date
    )
    if exception and exception.is_blocked:
        return None
    if exception and exception.custom_slots is not None:
        return exception.custom_slots
    return page.availability.get(_DAY_KEYS[host_date.weekday()], [])


async def _is_within_open_hours(db: AsyncSession, page: BookingPage, start_utc: datetime, end_utc: datetime) -> bool:
    host_tz = ZoneInfo(page.timezone)
    start_local = start_utc.astimezone(host_tz)
    end_local = end_utc.astimezone(host_tz)
    if start_local.date() != end_local.date():
        return False  # meetings crossing host-local midnight aren't supported by the day-range model
    ranges = await _day_availability_ranges(db, page, start_local.date())
    if not ranges:
        return False
    start_t, end_t = start_local.time(), end_local.time()
    for r in ranges:
        range_start = time_type.fromisoformat(r[0])
        range_end = time_type.fromisoformat(r[1])
        if range_start <= start_t and end_t <= range_end:
            return True
    return False


async def _has_conflict(
    db: AsyncSession, page: BookingPage, start_utc: datetime, end_utc: datetime, *, exclude_meeting_id: Optional[int] = None
) -> bool:
    window_start = start_utc - timedelta(minutes=page.buffer_before_minutes)
    window_end = end_utc + timedelta(minutes=page.buffer_after_minutes)
    overlapping = await ScheduledMeetingRepository.list_overlapping(
        db, booking_page_id=page.id, start_time=window_start, end_time=window_end, exclude_meeting_id=exclude_meeting_id
    )
    return len(overlapping) > 0


async def _day_cap_exceeded(
    db: AsyncSession, page: BookingPage, start_utc: datetime, *, exclude_meeting_id: Optional[int] = None
) -> bool:
    if page.max_bookings_per_day is None:
        return False
    host_tz = ZoneInfo(page.timezone)
    host_date = start_utc.astimezone(host_tz).date()
    day_start_local = datetime.combine(host_date, time_type.min, tzinfo=host_tz)
    day_end_local = day_start_local + timedelta(days=1)
    count = await ScheduledMeetingRepository.count_for_page_on_date(
        db, booking_page_id=page.id,
        day_start=day_start_local.astimezone(timezone.utc), day_end=day_end_local.astimezone(timezone.utc),
        exclude_meeting_id=exclude_meeting_id,
    )
    return count >= page.max_bookings_per_day


async def _validate_slot(
    db: AsyncSession, page: BookingPage, start_utc: datetime, end_utc: datetime, *, exclude_meeting_id: Optional[int] = None
) -> None:
    """Re-derives that a candidate slot is genuinely bookable right now. Raises
    BadRequestError/ConflictError rather than trusting whatever a client submitted —
    the client-submitted start_time from a public form is never authoritative on
    its own, since the availability grid may have changed or another booking may
    have landed first."""
    now = datetime.now(timezone.utc)
    if start_utc < now + timedelta(minutes=page.min_notice_minutes):
        raise BadRequestError("This time no longer meets the minimum notice period. Please pick another slot.")
    if start_utc > now + timedelta(days=page.max_advance_days):
        raise BadRequestError("This time is too far in advance to book.")
    if not await _is_within_open_hours(db, page, start_utc, end_utc):
        raise BadRequestError("This time is outside the host's available hours.")
    if await _has_conflict(db, page, start_utc, end_utc, exclude_meeting_id=exclude_meeting_id):
        raise ConflictError("This slot was just booked by someone else. Please choose another time.")
    if await _day_cap_exceeded(db, page, start_utc, exclude_meeting_id=exclude_meeting_id):
        raise ConflictError("This day is fully booked. Please choose another day.")


async def compute_available_slots(
    db: AsyncSession, page: BookingPage, target_date: date_type, viewer_timezone: str
) -> list[tuple[datetime, datetime]]:
    """Returns bookable (start_utc, end_utc) slots that fall on `target_date` in the
    viewer's own timezone. Candidates are generated from a +/-1 host-local-day window
    around target_date (wide enough to cover any real-world UTC offset difference,
    including the viewer being on the other side of the date line from the host),
    then filtered back down to exactly the viewer's requested local day."""
    viewer_tz = ZoneInfo(viewer_timezone)
    host_tz = ZoneInfo(page.timezone)
    duration = timedelta(minutes=page.duration_minutes)
    now = datetime.now(timezone.utc)
    min_start = now + timedelta(minutes=page.min_notice_minutes)
    max_start = now + timedelta(days=page.max_advance_days)

    candidates: set[tuple[datetime, datetime]] = set()
    for delta_days in (-1, 0, 1):
        host_date = target_date + timedelta(days=delta_days)
        ranges = await _day_availability_ranges(db, page, host_date)
        if not ranges:
            continue
        for r in ranges:
            range_start_t = time_type.fromisoformat(r[0])
            range_end_t = time_type.fromisoformat(r[1])
            cursor = datetime.combine(host_date, range_start_t, tzinfo=host_tz)
            range_end = datetime.combine(host_date, range_end_t, tzinfo=host_tz)
            while cursor + duration <= range_end:
                start_utc = cursor.astimezone(timezone.utc)
                candidates.add((start_utc, start_utc + duration))
                cursor += duration

    results: list[tuple[datetime, datetime]] = []
    for start_utc, end_utc in sorted(candidates):
        if start_utc.astimezone(viewer_tz).date() != target_date:
            continue
        if start_utc < min_start or start_utc > max_start:
            continue
        if await _has_conflict(db, page, start_utc, end_utc):
            continue
        if await _day_cap_exceeded(db, page, start_utc):
            continue
        results.append((start_utc, end_utc))
    return results


# ── CRM linkage ──────────────────────────────────────────────────────────────────

async def _find_or_create_lead(
    db: AsyncSession, *, organization_id: int, host_user_id: int, page: BookingPage,
    client_name: str, client_email: str,
) -> CRMLead:
    """Finds an existing open lead tied to this contact's email, or creates one —
    keeps repeat bookers from accumulating a fresh lead every time they rebook."""
    contact_result = await db.execute(
        select(CRMContact).where(
            CRMContact.organization_id == organization_id,
            CRMContact.email == client_email,
            CRMContact.is_deleted.is_(False),
        )
    )
    contact = contact_result.scalars().first()
    if contact is None:
        contact = CRMContact(
            organization_id=organization_id,
            first_name=client_name.split(" ", 1)[0],
            last_name=client_name.split(" ", 1)[1] if " " in client_name else None,
            email=client_email,
            owner_id=host_user_id,
        )
        db.add(contact)
        await db.flush()

    lead_result = await db.execute(
        select(CRMLead).where(
            CRMLead.organization_id == organization_id,
            CRMLead.contact_id == contact.id,
            CRMLead.status != LeadStatus.CONVERTED,
            CRMLead.is_deleted.is_(False),
        ).order_by(CRMLead.created_at.desc())
    )
    lead = lead_result.scalars().first()
    if lead is None:
        lead = CRMLead(
            organization_id=organization_id,
            title=f"{page.title} — {client_name}",
            contact_id=contact.id,
            source=LeadSource.BOOKING_PAGE,
            owner_id=host_user_id,
        )
        db.add(lead)
        await db.flush()
    return lead


# ── Google sync (best-effort inline attempt; retried later by the sync worker) ──

async def _attempt_google_sync(
    db: AsyncSession, *, host: User, page: BookingPage, meeting: ScheduledMeeting, is_reschedule: bool,
) -> None:
    if page.location_type != BookingLocationType.GOOGLE_MEET:
        meeting.calendar_sync_status = CalendarSyncStatus.NOT_APPLICABLE
        return

    connection = await GoogleOAuthConnectionRepository.get_by_user_id(db, host.id)
    if connection is None or connection.status != GoogleConnectionStatus.CONNECTED:
        meeting.calendar_sync_status = CalendarSyncStatus.NOT_APPLICABLE if connection is None else CalendarSyncStatus.PENDING
        return

    meeting.calendar_sync_status = CalendarSyncStatus.PENDING
    result = await (google_calendar.patch_event if is_reschedule else google_calendar.create_event)(
        db, connection, meeting, page
    )
    meeting.calendar_sync_attempts += 1
    if result.ok:
        meeting.calendar_sync_status = CalendarSyncStatus.SYNCED
        meeting.google_event_id = result.google_event_id or meeting.google_event_id
        meeting.google_meet_link = result.google_meet_link or meeting.google_meet_link
        meeting.calendar_sync_last_error = None
    else:
        meeting.calendar_sync_last_error = (result.error or "")[:500]
        # Left as PENDING (not FAILED) after just one inline attempt — the background
        # sync worker (app/services/booking_sync_worker.py) owns the FAILED transition
        # once BOOKING_SYNC_MAX_ATTEMPTS is actually exhausted.


# ── Email / ICS helpers ──────────────────────────────────────────────────────────

def _offline_maps_url(page: BookingPage) -> Optional[str]:
    if page.location_type == BookingLocationType.OFFLINE and page.offline_address:
        return "https://www.google.com/maps/search/?api=1&query=" + page.offline_address.replace(" ", "+")
    return None


def _manage_url(meeting: ScheduledMeeting) -> str:
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    return f"{base_url}/book/manage/{meeting.manage_token}"


async def _send_confirmation(db: AsyncSession, *, host: User, page: BookingPage, meeting: ScheduledMeeting, heading: str) -> None:
    ics_bytes = build_meeting_ics(
        meeting, page, organizer_email=host.email, organizer_name=host.full_name or host.email, method="REQUEST"
    )
    display_tz = ZoneInfo(meeting.attendee_timezone)
    # Fire-and-forget: the SMTP round trip to an external relay can take seconds to
    # tens of seconds, and awaiting it here would hold the whole create/reschedule
    # request (and the frontend UI waiting on its response) hostage until it finishes.
    spawn_email_task(
        send_booking_confirmation_email(
            to_email=meeting.client_email,
            client_name=meeting.client_name,
            meeting_title=page.title,
            heading=heading,
            start_time_display=meeting.start_time.astimezone(display_tz).strftime("%A, %B %d, %Y at %I:%M %p"),
            attendee_timezone=meeting.attendee_timezone,
            meet_link=meeting.google_meet_link,
            location_text=page.offline_address if page.location_type == BookingLocationType.OFFLINE else None,
            maps_url=_offline_maps_url(page),
            fallback_note=page.fallback_meeting_note if not meeting.google_meet_link else None,
            manage_url=_manage_url(meeting),
            ics_bytes=ics_bytes,
            ics_method="REQUEST",
        )
    )


async def _send_cancellation(db: AsyncSession, *, host: User, page: BookingPage, meeting: ScheduledMeeting) -> None:
    ics_bytes = build_meeting_ics(
        meeting, page, organizer_email=host.email, organizer_name=host.full_name or host.email, method="CANCEL"
    )
    display_tz = ZoneInfo(meeting.attendee_timezone)
    spawn_email_task(
        send_booking_cancelled_email(
            to_email=meeting.client_email,
            client_name=meeting.client_name,
            meeting_title=page.title,
            start_time_display=meeting.start_time.astimezone(display_tz).strftime("%A, %B %d, %Y at %I:%M %p"),
            attendee_timezone=meeting.attendee_timezone,
            reason=meeting.cancellation_reason,
            ics_bytes=ics_bytes,
        )
    )


async def _schedule_reminder(db: AsyncSession, *, host_user_id: int, meeting: ScheduledMeeting) -> None:
    remind_at = meeting.start_time - timedelta(minutes=MEETING_REMINDER_LEAD_MINUTES)
    if remind_at <= datetime.now(timezone.utc):
        return  # meeting is already inside the reminder window — nothing useful to schedule
    await CRMReminderRepository.create(
        db,
        entity_type="scheduled_meeting",
        entity_id=meeting.id,
        user_id=host_user_id,
        remind_at=remind_at,
        message=f"Meeting with {meeting.client_name} starts in {MEETING_REMINDER_LEAD_MINUTES} minutes.",
        organization_id=meeting.organization_id,
    )


# ── Public flows ─────────────────────────────────────────────────────────────────

async def create_booking(db: AsyncSession, *, page: BookingPage, payload: ScheduleMeetingRequest) -> ScheduledMeeting:
    """Creates a confirmed booking, or returns the existing one if `idempotency_key`
    was already used (double-submit/retry safe). Concurrency-safe against other
    simultaneous bookings on the same page via a row lock (see
    BookingPageRepository.lock_by_id_for_update)."""
    existing = await ScheduledMeetingRepository.get_by_idempotency_key(db, payload.idempotency_key)
    if existing is not None:
        return existing

    token = tenant_context.set(page.organization_id)
    try:
        locked_page = await BookingPageRepository.lock_by_id_for_update(db, page.id)
        if locked_page is None or not locked_page.is_active:
            raise NotFoundError("This booking page is no longer available.")

        start_utc = payload.start_time.astimezone(timezone.utc)
        end_utc = start_utc + timedelta(minutes=locked_page.duration_minutes)
        await _validate_slot(db, locked_page, start_utc, end_utc)

        host = await db.get(User, locked_page.user_id)
        if host is None:
            raise NotFoundError("Booking page host not found.")

        lead = await _find_or_create_lead(
            db, organization_id=locked_page.organization_id, host_user_id=host.id, page=locked_page,
            client_name=payload.client_name, client_email=payload.client_email,
        )
        await CRMActivityRepository.create(
            db, type=ActivityType.MEETING, subject=f"Scheduled: {locked_page.title}",
            entity_type="lead", entity_id=lead.id, owner_id=host.id,
            description=payload.meeting_notes, due_date=start_utc,
            organization_id=locked_page.organization_id,
        )

        meeting = ScheduledMeeting(
            booking_page_id=locked_page.id,
            organization_id=locked_page.organization_id,
            lead_id=lead.id,
            client_name=payload.client_name,
            client_email=payload.client_email,
            meeting_notes=payload.meeting_notes,
            start_time=start_utc,
            end_time=end_utc,
            host_timezone=locked_page.timezone,
            attendee_timezone=payload.attendee_timezone,
            idempotency_key=payload.idempotency_key,
        )
        db.add(meeting)
        await db.flush()

        await _attempt_google_sync(db, host=host, page=locked_page, meeting=meeting, is_reschedule=False)
        await db.flush()

        await _send_confirmation(db, host=host, page=locked_page, meeting=meeting, heading="Meeting Confirmed")
        await _schedule_reminder(db, host_user_id=host.id, meeting=meeting)

        await db.refresh(meeting)
        return meeting
    finally:
        tenant_context.reset(token)


async def get_meeting_by_manage_token(db: AsyncSession, manage_token: str) -> ScheduledMeeting:
    meeting = await ScheduledMeetingRepository.get_by_manage_token(db, manage_token)
    if meeting is None:
        raise NotFoundError("Booking not found. This link may be invalid or expired.")
    return meeting


async def cancel_booking(
    db: AsyncSession, *, meeting: ScheduledMeeting, cancelled_by: CancelledBy, reason: Optional[str] = None,
) -> ScheduledMeeting:
    if meeting.status == MeetingStatus.CANCELLED:
        return meeting  # already cancelled — idempotent no-op, e.g. a re-clicked cancel link

    token = tenant_context.set(meeting.organization_id)
    try:
        page = await BookingPageRepository.get_by_id(db, meeting.booking_page_id)
        host = await db.get(User, page.user_id) if page else None

        meeting.status = MeetingStatus.CANCELLED
        meeting.cancelled_by = cancelled_by
        meeting.cancellation_reason = reason
        meeting.sequence += 1
        await db.flush()

        if page and host and meeting.google_event_id:
            connection = await GoogleOAuthConnectionRepository.get_by_user_id(db, host.id)
            if connection and connection.status == GoogleConnectionStatus.CONNECTED:
                await google_calendar.cancel_event(db, connection, meeting)

        if page and host:
            await _send_cancellation(db, host=host, page=page, meeting=meeting)

        await db.refresh(meeting)
        return meeting
    finally:
        tenant_context.reset(token)


async def reschedule_booking(db: AsyncSession, *, meeting: ScheduledMeeting, new_start_time: datetime) -> ScheduledMeeting:
    if meeting.status != MeetingStatus.SCHEDULED:
        raise BadRequestError("Only a scheduled (not cancelled/completed) meeting can be rescheduled.")

    token = tenant_context.set(meeting.organization_id)
    try:
        page = await BookingPageRepository.lock_by_id_for_update(db, meeting.booking_page_id)
        if page is None or not page.is_active:
            raise NotFoundError("This booking page is no longer available.")

        start_utc = new_start_time.astimezone(timezone.utc)
        end_utc = start_utc + timedelta(minutes=page.duration_minutes)
        await _validate_slot(db, page, start_utc, end_utc, exclude_meeting_id=meeting.id)

        host = await db.get(User, page.user_id)
        if host is None:
            raise NotFoundError("Booking page host not found.")

        meeting.start_time = start_utc
        meeting.end_time = end_utc
        meeting.sequence += 1
        await db.flush()

        if page.location_type == BookingLocationType.GOOGLE_MEET and meeting.calendar_sync_status != CalendarSyncStatus.NOT_APPLICABLE:
            connection = await GoogleOAuthConnectionRepository.get_by_user_id(db, host.id)
            if connection and connection.status == GoogleConnectionStatus.CONNECTED:
                await _attempt_google_sync(db, host=host, page=page, meeting=meeting, is_reschedule=bool(meeting.google_event_id))
                await db.flush()

        await _send_confirmation(db, host=host, page=page, meeting=meeting, heading="Meeting Rescheduled")

        await db.refresh(meeting)
        return meeting
    finally:
        tenant_context.reset(token)


def assert_host_owns_page(page: BookingPage, user: User) -> None:
    if page.user_id != user.id and not user.is_superuser:
        raise ForbiddenError("You do not own this booking page.")
