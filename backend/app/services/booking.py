"""Core business logic for Meetings — a host schedules a meeting directly with a
client at whatever date/time/location they choose. No public booking page, no
availability windows: the only guardrail is not double-booking the host's own
calendar. Every meeting still gets a working .ics email invite (see
app/utils/ics.py) regardless of location type.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

from dateutil.relativedelta import relativedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.context import tenant_context
from app.middleware.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models.booking import (
    CancelledBy,
    HostAvailabilityRule,
    HostAvailabilitySettings,
    MeetingLocationType,
    MeetingStatus,
    RecurrenceRule,
    ScheduledMeeting,
)
from app.models.crm import ActivityType, CRMContact, CRMLead, LeadSource, LeadStatus
from app.models.notification import NotificationType
from app.models.reminder import ReminderStatus
from app.models.user import User
from app.repositories.booking import HostAvailabilityRepository, ScheduledMeetingRepository
from app.repositories.crm import CRMActivityRepository
from app.repositories.reminder import CRMReminderRepository
from app.schemas.booking import (
    MAX_RECURRING_OCCURRENCES,
    AvailabilityRuleItem,
    HostAvailabilitySettingsUpdate,
    MeetingJoinInfo,
    PublicBookingRequest,
    ScheduleMeetingRequest,
)
from app.services.crm import CRMService
from app.services.notification import NotificationService
from app.utils.email import (
    create_meeting_join_token,
    create_meeting_manage_token,
    decode_meeting_join_token,
    decode_meeting_manage_token,
    send_booking_cancelled_email,
    send_booking_confirmation_email,
    spawn_email_task,
)
from app.utils.ics import build_meeting_ics

MEETING_REMINDER_LEAD_MINUTES = 15
# Host-facing "you have a meeting today" reminder, sent once each meeting day at
# this local hour (see _schedule_dayof_reminder) — distinct from the 15-minute
# just-before reminder above, which is too easy to miss if the host isn't at their
# desk right that moment.
MEETING_DAYOF_REMINDER_HOUR = 8
# The video-call join gate (see get_meeting_join_info): a meeting's link only ever
# resolves to a live, embeddable call within this window around its scheduled time —
# outside it, the same link just explains why (not started yet / already ended /
# cancelled), regardless of who's holding it.
MEETING_JOIN_LEAD_MINUTES = 15
MEETING_JOIN_GRACE_MINUTES_AFTER = 15
_RECURRENCE_STEP = {
    RecurrenceRule.DAILY: relativedelta(days=1),
    RecurrenceRule.WEEKLY: relativedelta(weeks=1),
    RecurrenceRule.BIWEEKLY: relativedelta(weeks=2),
    RecurrenceRule.MONTHLY: relativedelta(months=1),
}


async def list_org_members(db: AsyncSession, *, organization_id: Optional[int], exclude_user_id: int) -> list[User]:
    """Active users in the host's organization, for the 'invite a teammate' picker on
    the New Meeting form — excludes the requesting host themselves. Empty for a solo
    user with no organization, so the frontend just falls back to guest-only invites."""
    if organization_id is None:
        return []
    members = await CRMService.list_assignable_owners(db, organization_id)
    return [m for m in members if m.id != exclude_user_id]


# ── Conflict checking ────────────────────────────────────────────────────────────

async def _has_conflict(
    db: AsyncSession, *, host_user_id: int, start_utc: datetime, end_utc: datetime,
    exclude_meeting_id: Optional[int] = None,
) -> bool:
    overlapping = await ScheduledMeetingRepository.list_overlapping(
        db, host_user_id=host_user_id, start_time=start_utc, end_time=end_utc, exclude_meeting_id=exclude_meeting_id
    )
    return len(overlapping) > 0


async def _participant_conflict_name(
    db: AsyncSession, *, participant_user_ids: list[int], start_utc: datetime, end_utc: datetime,
    exclude_meeting_id: Optional[int] = None,
) -> Optional[str]:
    """Display name of the first invited teammate who's already busy during this
    slot — either hosting or merely attending another meeting that overlaps it —
    or None if everyone invited is free. Inviting a colleague to a meeting
    shouldn't silently double-book their calendar the way it would if only the
    requesting host's own availability were ever checked."""
    if not participant_user_ids:
        return None

    candidates = set(participant_user_ids)
    overlapping = await ScheduledMeetingRepository.list_overlapping_any_host(
        db, start_time=start_utc, end_time=end_utc, exclude_meeting_id=exclude_meeting_id
    )
    busy_user_id: Optional[int] = None
    for meeting in overlapping:
        if meeting.host_user_id in candidates:
            busy_user_id = meeting.host_user_id
            break
        attending = candidates.intersection(meeting.participant_user_ids or [])
        if attending:
            busy_user_id = next(iter(attending))
            break

    if busy_user_id is None:
        return None
    user = await db.get(User, busy_user_id)
    return (user.full_name or user.email) if user else "One of your invited teammates"


# ── CRM linkage ──────────────────────────────────────────────────────────────────

async def _find_or_create_lead(
    db: AsyncSession, *, organization_id: int, host_user_id: int, meeting_title: Optional[str],
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
            title=f"{meeting_title or 'Meeting'} — {client_name}",
            contact_id=contact.id,
            source=LeadSource.BOOKING_PAGE,
            owner_id=host_user_id,
        )
        db.add(lead)
        await db.flush()
    return lead


# ── Email / ICS helpers ──────────────────────────────────────────────────────────

def _location_text(meeting: ScheduledMeeting) -> Optional[str]:
    if meeting.location_type == MeetingLocationType.OFFLINE:
        return meeting.location_detail
    if meeting.location_type == MeetingLocationType.PHONE and meeting.location_detail:
        return f"Phone: {meeting.location_detail}"
    return None


def _maps_url(meeting: ScheduledMeeting) -> Optional[str]:
    if meeting.location_type == MeetingLocationType.OFFLINE and meeting.location_detail:
        return "https://www.google.com/maps/search/?api=1&query=" + meeting.location_detail.replace(" ", "+")
    return None


def _manage_link(meeting: ScheduledMeeting) -> str:
    from app.core.config import settings

    token = create_meeting_manage_token(meeting.public_id)
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    return f"{base_url}/meetings/manage?token={token}"


def _join_link(meeting: ScheduledMeeting) -> str:
    """The gate every 'Join Meeting' surface should point to instead of the raw
    Jitsi URL — see get_meeting_join_info for what actually happens when it's
    opened. Safe to hand out to the client, invited teammates, and guests alike:
    the join token carries no reschedule/cancel privilege."""
    from app.core.config import settings

    token = create_meeting_join_token(meeting.public_id)
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    return f"{base_url}/meetings/join?token={token}"


def _parse_jitsi_room(location_detail: str) -> Optional[tuple[str, str]]:
    """(domain, room) if location_detail looks like a URL we can safely hand to the
    Jitsi IFrame External API — None for a host-pasted non-URL value or a link to
    something else entirely, which the join page has no business trying to embed."""
    try:
        parsed = urlparse(location_detail)
    except ValueError:
        return None
    room = parsed.path.strip("/")
    if not parsed.netloc or not room:
        return None
    return parsed.netloc, room


def get_meeting_join_info(meeting: ScheduledMeeting, *, host_name: Optional[str] = None) -> MeetingJoinInfo:
    """Resolves whether a meeting's video call can be joined *right now* — the single
    source of truth both the public join-token endpoint and the host's own
    join-link endpoint go through, so the rule can never drift between them."""
    now = datetime.now(timezone.utc)
    reason: Optional[str] = None

    if meeting.status == MeetingStatus.CANCELLED:
        reason = "cancelled"
    elif meeting.status == MeetingStatus.COMPLETED:
        reason = "ended"
    elif now < meeting.start_time - timedelta(minutes=MEETING_JOIN_LEAD_MINUTES):
        reason = "not_started"
    elif now > meeting.end_time + timedelta(minutes=MEETING_JOIN_GRACE_MINUTES_AFTER):
        reason = "ended"
    elif meeting.location_type != MeetingLocationType.GOOGLE_MEET or not meeting.location_detail:
        reason = "no_video_link"

    jitsi_domain, jitsi_room = (None, None)
    if reason is None:
        parsed = _parse_jitsi_room(meeting.location_detail)
        if parsed is None:
            reason = "no_video_link"
        else:
            jitsi_domain, jitsi_room = parsed

    return MeetingJoinInfo(
        joinable=reason is None,
        reason=reason,
        meeting_title=meeting.meeting_title,
        host_name=host_name,
        start_time=meeting.start_time,
        end_time=meeting.end_time,
        jitsi_domain=jitsi_domain,
        jitsi_room=jitsi_room,
    )


async def get_meeting_by_join_token(db: AsyncSession, token: str) -> ScheduledMeeting:
    """Resolves a join token to its meeting — same anti-enumeration shape as
    get_meeting_by_manage_token (a malformed/expired token and a since-deleted
    meeting look identical to the caller)."""
    public_id_str = decode_meeting_join_token(token)
    if public_id_str is None:
        raise NotFoundError("This meeting link is invalid or has expired.")
    try:
        public_id = uuid.UUID(public_id_str)
    except ValueError:
        raise NotFoundError("This meeting link is invalid or has expired.")
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("This meeting link is invalid or has expired.")
    return meeting


async def _invitee_contacts(db: AsyncSession, meeting: ScheduledMeeting) -> list[tuple[str, str]]:
    """(email, display_name) for every invited teammate and extra guest — everyone
    besides the client who should get a copy of the meeting details/join link."""
    contacts: list[tuple[str, str]] = []
    if meeting.participant_user_ids:
        result = await db.execute(select(User).where(User.id.in_(meeting.participant_user_ids)))
        for user in result.scalars().all():
            contacts.append((user.email, user.full_name or user.email))
    for guest_email in meeting.guest_emails or []:
        contacts.append((guest_email, guest_email.split("@", 1)[0]))
    return contacts


async def _send_confirmation(db: AsyncSession, *, host: User, meeting: ScheduledMeeting, heading: str) -> None:
    # meet_link always points at our own join gate, never the raw Jitsi URL — the
    # gate is what actually enforces "only active for this meeting, and only while
    # it's happening" (see get_meeting_join_info), and it's also what strips the
    # Jitsi branding by embedding the call itself rather than opening meet.jit.si.
    meet_link = _join_link(meeting) if meeting.location_type == MeetingLocationType.GOOGLE_MEET else None
    ics_bytes = build_meeting_ics(
        meeting, organizer_email=host.email, organizer_name=host.full_name or host.email, method="REQUEST",
        join_link_override=meet_link,
    )
    display_tz = ZoneInfo(meeting.attendee_timezone)
    meeting_title = meeting.meeting_title or f"Meeting with {host.full_name or host.email}"
    start_time_display = meeting.start_time.astimezone(display_tz).strftime("%A, %B %d, %Y at %I:%M %p")
    location_text = _location_text(meeting)
    maps_url = _maps_url(meeting)

    # Fire-and-forget: the SMTP round trip to an external relay can take seconds to
    # tens of seconds, and awaiting it here would hold the whole create/reschedule
    # request (and the frontend UI waiting on its response) hostage until it finishes.
    spawn_email_task(
        send_booking_confirmation_email(
            to_email=meeting.client_email,
            client_name=meeting.client_name,
            meeting_title=meeting_title,
            heading=heading,
            start_time_display=start_time_display,
            attendee_timezone=meeting.attendee_timezone,
            meet_link=meet_link,
            location_text=location_text,
            maps_url=maps_url,
            ics_bytes=ics_bytes,
            ics_method="REQUEST",
            manage_link=_manage_link(meeting),
        )
    )

    # Invited teammates and guests get the same time/location/join-link details, but
    # no client-only manage link — they shouldn't be able to reschedule or cancel
    # someone else's meeting.
    for invitee_email, invitee_name in await _invitee_contacts(db, meeting):
        spawn_email_task(
            send_booking_confirmation_email(
                to_email=invitee_email,
                client_name=invitee_name,
                meeting_title=meeting_title,
                heading=heading,
                start_time_display=start_time_display,
                attendee_timezone=meeting.attendee_timezone,
                meet_link=meet_link,
                location_text=location_text,
                maps_url=maps_url,
                ics_bytes=ics_bytes,
                ics_method="REQUEST",
                manage_link=None,
            )
        )


async def _send_cancellation(db: AsyncSession, *, host: User, meeting: ScheduledMeeting) -> None:
    ics_bytes = build_meeting_ics(
        meeting, organizer_email=host.email, organizer_name=host.full_name or host.email, method="CANCEL"
    )
    display_tz = ZoneInfo(meeting.attendee_timezone)
    spawn_email_task(
        send_booking_cancelled_email(
            to_email=meeting.client_email,
            client_name=meeting.client_name,
            meeting_title=meeting.meeting_title or f"Meeting with {host.full_name or host.email}",
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


async def _schedule_dayof_reminder(db: AsyncSession, *, host_user_id: int, meeting: ScheduledMeeting) -> None:
    """A second, earlier reminder — fires once at MEETING_DAYOF_REMINDER_HOUR on the
    host's own local calendar day for the meeting, so 'you have a meeting today'
    lands well before the 15-minute just-before one, which is easy to miss if the
    host isn't at their desk right then."""
    local_tz = ZoneInfo(meeting.host_timezone)
    local_start = meeting.start_time.astimezone(local_tz)
    remind_at = local_start.replace(hour=MEETING_DAYOF_REMINDER_HOUR, minute=0, second=0, microsecond=0)
    now = datetime.now(timezone.utc)
    if remind_at <= now or remind_at >= meeting.start_time:
        return  # meeting is today before the reminder hour, or already past it — the 15-min reminder covers it
    await CRMReminderRepository.create(
        db,
        entity_type="scheduled_meeting",
        entity_id=meeting.id,
        user_id=host_user_id,
        remind_at=remind_at,
        message=f"You have a meeting with {meeting.client_name} today at {local_start.strftime('%I:%M %p')}.",
        organization_id=meeting.organization_id,
    )


async def _cancel_pending_reminders(db: AsyncSession, *, meeting_id: int) -> None:
    """Cancels any not-yet-sent reminders tied to this meeting — used whenever a
    meeting is cancelled or rescheduled, so a host never gets a stale 'meeting
    today'/'starts in 15 minutes' nudge for a time that no longer applies."""
    reminders = await CRMReminderRepository.list_for_entity(db, entity_type="scheduled_meeting", entity_id=meeting_id)
    for reminder in reminders:
        if reminder.status == ReminderStatus.PENDING:
            await CRMReminderRepository.cancel(db, reminder)


# ── Recurrence ───────────────────────────────────────────────────────────────────

def _generate_occurrence_starts(first_start: datetime, rule: RecurrenceRule, end_date: date) -> list[datetime]:
    """Every occurrence's start time (in the host's originally-submitted offset, not
    yet converted to UTC — so 'every Monday at 3pm' stays correct across a DST
    transition instead of drifting by an hour). Capped at MAX_RECURRING_OCCURRENCES
    to bound worst-case row creation from a single request."""
    step = _RECURRENCE_STEP[rule]
    starts = [first_start]
    current = first_start
    while len(starts) < MAX_RECURRING_OCCURRENCES:
        current = current + step
        if current.date() > end_date:
            break
        starts.append(current)
    return starts


async def _create_occurrence(
    db: AsyncSession, *, host: User, payload: ScheduleMeetingRequest, start: datetime, end: datetime,
    idempotency_key: str, recurrence_group_id: Optional[uuid.UUID], raise_on_conflict: bool,
) -> Optional[ScheduledMeeting]:
    """Creates one meeting row (a standalone meeting, or one occurrence of a
    recurring series). Returns None only when raise_on_conflict is False and this
    slot conflicts with the host's existing calendar — used to skip a busy slot in a
    series without failing the whole batch."""
    start_utc = start.astimezone(timezone.utc)
    end_utc = end.astimezone(timezone.utc)
    if await _has_conflict(db, host_user_id=host.id, start_utc=start_utc, end_utc=end_utc):
        if not raise_on_conflict:
            return None
        raise ConflictError("You already have a meeting scheduled during this time.")

    busy_name = await _participant_conflict_name(
        db, participant_user_ids=payload.participant_user_ids or [], start_utc=start_utc, end_utc=end_utc,
    )
    if busy_name is not None:
        if not raise_on_conflict:
            return None
        raise ConflictError(f"{busy_name} already has a meeting during this time — pick another time or remove them from the invite.")

    lead = await _find_or_create_lead(
        db, organization_id=host.organization_id, host_user_id=host.id, meeting_title=payload.meeting_title,
        client_name=payload.client_name, client_email=payload.client_email,
    )
    await CRMActivityRepository.create(
        db, type=ActivityType.MEETING, subject=f"Scheduled: {payload.meeting_title or payload.client_name}",
        entity_type="lead", entity_id=lead.id, owner_id=host.id,
        description=payload.meeting_notes, due_date=start_utc,
        organization_id=host.organization_id,
    )

    meeting = ScheduledMeeting(
        host_user_id=host.id,
        organization_id=host.organization_id,
        lead_id=lead.id,
        client_name=payload.client_name,
        client_email=payload.client_email,
        meeting_title=payload.meeting_title,
        meeting_notes=payload.meeting_notes,
        location_type=payload.location_type,
        location_detail=payload.location_detail,
        start_time=start_utc,
        end_time=end_utc,
        host_timezone=payload.host_timezone,
        attendee_timezone=payload.attendee_timezone,
        idempotency_key=idempotency_key,
        participant_user_ids=list(payload.participant_user_ids or []),
        guest_emails=[str(email) for email in (payload.guest_emails or [])],
        recurrence_rule=payload.recurrence_rule,
        recurrence_end_date=payload.recurrence_end_date,
        recurrence_group_id=recurrence_group_id,
    )
    db.add(meeting)
    await db.flush()

    await _send_confirmation(db, host=host, meeting=meeting, heading="Meeting Confirmed")
    await _schedule_reminder(db, host_user_id=host.id, meeting=meeting)
    await _schedule_dayof_reminder(db, host_user_id=host.id, meeting=meeting)

    await db.refresh(meeting)
    return meeting


# ── Mutating flows ───────────────────────────────────────────────────────────────

async def create_meeting(
    db: AsyncSession, *, host: User, payload: ScheduleMeetingRequest,
) -> tuple[ScheduledMeeting, int]:
    """Creates a confirmed meeting (or, if recurrence_rule is set, a whole series of
    occurrences sharing one recurrence_group_id), or returns the existing first
    meeting if `idempotency_key` was already used (double-submit/retry safe).
    Returns (first_meeting, occurrences_created) — occurrences_created is always 1
    for a non-recurring meeting."""
    existing = await ScheduledMeetingRepository.get_by_idempotency_key(db, payload.idempotency_key)
    if existing is not None:
        return existing, 1

    token = tenant_context.set(host.organization_id)
    try:
        if payload.recurrence_rule is None:
            meeting = await _create_occurrence(
                db, host=host, payload=payload, start=payload.start_time, end=payload.end_time,
                idempotency_key=payload.idempotency_key, recurrence_group_id=None, raise_on_conflict=True,
            )
            return meeting, 1

        duration = payload.end_time - payload.start_time
        occurrence_starts = _generate_occurrence_starts(
            payload.start_time, payload.recurrence_rule, payload.recurrence_end_date
        )

        first = await _create_occurrence(
            db, host=host, payload=payload, start=occurrence_starts[0], end=occurrence_starts[0] + duration,
            idempotency_key=payload.idempotency_key, recurrence_group_id=None, raise_on_conflict=True,
        )
        # The series is identified by its first occurrence's own public_id.
        first.recurrence_group_id = first.public_id
        await db.flush()
        created = 1

        for i, start in enumerate(occurrence_starts[1:], start=1):
            occurrence = await _create_occurrence(
                db, host=host, payload=payload, start=start, end=start + duration,
                idempotency_key=f"{payload.idempotency_key}:{i}", recurrence_group_id=first.public_id,
                raise_on_conflict=False,
            )
            if occurrence is not None:
                created += 1

        await db.refresh(first)
        return first, created
    finally:
        tenant_context.reset(token)


async def cancel_meeting(
    db: AsyncSession, *, meeting: ScheduledMeeting, cancelled_by: CancelledBy, reason: Optional[str] = None,
) -> ScheduledMeeting:
    if meeting.status == MeetingStatus.CANCELLED:
        return meeting  # already cancelled — idempotent no-op, e.g. a re-clicked cancel action

    token = tenant_context.set(meeting.organization_id)
    try:
        host = await db.get(User, meeting.host_user_id)

        meeting.status = MeetingStatus.CANCELLED
        meeting.cancelled_by = cancelled_by
        meeting.cancellation_reason = reason
        meeting.sequence += 1
        await db.flush()

        await _cancel_pending_reminders(db, meeting_id=meeting.id)

        if host:
            await _send_cancellation(db, host=host, meeting=meeting)

        await db.refresh(meeting)
        return meeting
    finally:
        tenant_context.reset(token)


async def reschedule_meeting(db: AsyncSession, *, meeting: ScheduledMeeting, new_start_time: datetime) -> ScheduledMeeting:
    if meeting.status != MeetingStatus.SCHEDULED:
        raise BadRequestError("Only a scheduled (not cancelled/completed) meeting can be rescheduled.")

    token = tenant_context.set(meeting.organization_id)
    try:
        duration = meeting.end_time - meeting.start_time
        start_utc = new_start_time.astimezone(timezone.utc)
        end_utc = start_utc + duration
        if await _has_conflict(db, host_user_id=meeting.host_user_id, start_utc=start_utc, end_utc=end_utc, exclude_meeting_id=meeting.id):
            raise ConflictError("You already have another meeting scheduled during this time.")

        busy_name = await _participant_conflict_name(
            db, participant_user_ids=meeting.participant_user_ids or [], start_utc=start_utc, end_utc=end_utc,
            exclude_meeting_id=meeting.id,
        )
        if busy_name is not None:
            raise ConflictError(f"{busy_name} already has a meeting during this new time — pick another time.")

        host = await db.get(User, meeting.host_user_id)
        if host is None:
            raise NotFoundError("Meeting host not found.")

        meeting.start_time = start_utc
        meeting.end_time = end_utc
        meeting.sequence += 1
        await db.flush()

        # The old reminders were computed against the previous start_time and would
        # otherwise fire at the wrong moment (or not at all, for the new time).
        await _cancel_pending_reminders(db, meeting_id=meeting.id)
        await _schedule_reminder(db, host_user_id=meeting.host_user_id, meeting=meeting)
        await _schedule_dayof_reminder(db, host_user_id=meeting.host_user_id, meeting=meeting)

        await _send_confirmation(db, host=host, meeting=meeting, heading="Meeting Rescheduled")

        await db.refresh(meeting)
        return meeting
    finally:
        tenant_context.reset(token)


def assert_host_owns_meeting(meeting: ScheduledMeeting, user: User) -> None:
    if meeting.host_user_id != user.id and not user.is_superuser:
        raise ForbiddenError("You do not own this meeting.")


async def cancel_series(
    db: AsyncSession, *, meeting: ScheduledMeeting, cancelled_by: CancelledBy, reason: Optional[str] = None,
) -> ScheduledMeeting:
    """Cancels `meeting` and every still-scheduled occurrence at or after it in the
    same recurring series ('this and all following'). A meeting with no
    recurrence_group_id is just cancelled on its own."""
    if meeting.recurrence_group_id is None:
        return await cancel_meeting(db, meeting=meeting, cancelled_by=cancelled_by, reason=reason)

    siblings = await ScheduledMeetingRepository.list_active_series(
        db, recurrence_group_id=meeting.recurrence_group_id, from_start_time=meeting.start_time
    )
    result = meeting
    for occurrence in siblings:
        cancelled = await cancel_meeting(db, meeting=occurrence, cancelled_by=cancelled_by, reason=reason)
        if occurrence.id == meeting.id:
            result = cancelled
    return result


async def complete_meeting(
    db: AsyncSession, *, meeting: ScheduledMeeting, outcome_notes: Optional[str] = None,
) -> ScheduledMeeting:
    """Lets a host manually close out a meeting (e.g. it ran early/short) with
    optional notes. The maintenance poller (app/services/meeting_scheduler.py)
    auto-completes anything a host doesn't get to, without notes."""
    if meeting.status == MeetingStatus.CANCELLED:
        raise BadRequestError("A cancelled meeting cannot be marked completed.")

    token = tenant_context.set(meeting.organization_id)
    try:
        meeting.status = MeetingStatus.COMPLETED
        if outcome_notes is not None:
            meeting.outcome_notes = outcome_notes
        await db.flush()
        await _cancel_pending_reminders(db, meeting_id=meeting.id)
        await db.refresh(meeting)
        return meeting
    finally:
        tenant_context.reset(token)


# ── Public (client, no-login) manage flows ────────────────────────────────────────

async def get_meeting_by_manage_token(db: AsyncSession, token: str) -> ScheduledMeeting:
    """Resolves a client's manage-link token to its meeting. Raises the same generic
    NotFoundError whether the token is malformed/expired or the meeting no longer
    exists, so a public caller can't distinguish the two (anti-enumeration, same
    principle as forgot_password's constant response)."""
    public_id_str = decode_meeting_manage_token(token)
    if public_id_str is None:
        raise NotFoundError("This meeting link is invalid or has expired.")
    try:
        public_id = uuid.UUID(public_id_str)
    except ValueError:
        raise NotFoundError("This meeting link is invalid or has expired.")
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("This meeting link is invalid or has expired.")
    return meeting


async def client_reschedule_meeting(db: AsyncSession, *, meeting: ScheduledMeeting, new_start_time: datetime) -> ScheduledMeeting:
    updated = await reschedule_meeting(db, meeting=meeting, new_start_time=new_start_time)
    await NotificationService.notify(
        db, user_id=updated.host_user_id, type=NotificationType.MEETING_RESCHEDULED_BY_CLIENT,
        title="Meeting rescheduled by client",
        message=f"{updated.client_name} moved \"{updated.meeting_title or 'their meeting'}\" to a new time.",
        entity_type="scheduled_meeting", entity_id=updated.id, organization_id=updated.organization_id,
    )
    return updated


async def client_cancel_meeting(db: AsyncSession, *, meeting: ScheduledMeeting, reason: Optional[str] = None) -> ScheduledMeeting:
    updated = await cancel_meeting(db, meeting=meeting, cancelled_by=CancelledBy.CLIENT, reason=reason)
    await NotificationService.notify(
        db, user_id=updated.host_user_id, type=NotificationType.MEETING_CANCELLED_BY_CLIENT,
        title="Meeting cancelled by client",
        message=f"{updated.client_name} cancelled \"{updated.meeting_title or 'their meeting'}\".",
        entity_type="scheduled_meeting", entity_id=updated.id, organization_id=updated.organization_id,
    )
    return updated


# ── Public self-service booking ("book a slot with me") ────────────────────────
#
# A host publishes a weekly availability schedule behind a revocable share link;
# a client picks an open slot themselves instead of the host creating every
# meeting by hand. Deliberately leaner than the BookingPage/Google-Calendar-sync
# concept an earlier migration removed (see 4c0b01681feb): just weekly recurring
# rules and a share link, reusing create_meeting for the actual booking.

async def get_or_create_availability_settings(db: AsyncSession, user: User) -> HostAvailabilitySettings:
    settings = await HostAvailabilityRepository.get_settings_by_user(db, user.id)
    if settings is not None:
        return settings
    return await HostAvailabilityRepository.create_settings(
        db, user_id=user.id, organization_id=user.organization_id, timezone=user.timezone or "UTC",
    )


async def update_availability_settings(
    db: AsyncSession, user: User, payload: HostAvailabilitySettingsUpdate,
) -> HostAvailabilitySettings:
    settings = await get_or_create_availability_settings(db, user)
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    updated = await HostAvailabilityRepository.update_settings(db, settings, **data)
    await db.commit()
    await db.refresh(updated, attribute_names=["rules"])
    return updated


async def replace_availability_rules(
    db: AsyncSession, user: User, rules: list[AvailabilityRuleItem],
) -> list[HostAvailabilityRule]:
    settings = await get_or_create_availability_settings(db, user)
    rule_dicts = [{"weekday": r.weekday, "start_time": r.start_time, "end_time": r.end_time} for r in rules]
    created = await HostAvailabilityRepository.replace_rules(
        db, settings=settings, user_id=user.id, organization_id=user.organization_id, rules=rule_dicts,
    )
    await db.commit()
    return created


async def enable_booking_link(db: AsyncSession, user: User) -> HostAvailabilitySettings:
    """Idempotent: turns the booking page on, minting a share token only if this
    host has never published one before (re-enabling after a disable reuses the
    same link)."""
    settings = await get_or_create_availability_settings(db, user)
    updates: dict = {"is_enabled": True}
    if settings.share_token is None:
        updates["share_token"] = uuid.uuid4()
    updated = await HostAvailabilityRepository.update_settings(db, settings, **updates)
    await db.commit()
    return updated


async def regenerate_booking_link(db: AsyncSession, user: User) -> HostAvailabilitySettings:
    """Rotates the share token -- how a previously-published link is revoked
    without turning the booking page off altogether."""
    settings = await get_or_create_availability_settings(db, user)
    updated = await HostAvailabilityRepository.update_settings(db, settings, share_token=uuid.uuid4(), is_enabled=True)
    await db.commit()
    return updated


async def disable_booking_link(db: AsyncSession, user: User) -> HostAvailabilitySettings:
    settings = await get_or_create_availability_settings(db, user)
    updated = await HostAvailabilityRepository.update_settings(db, settings, is_enabled=False)
    await db.commit()
    return updated


async def get_public_availability_view(db: AsyncSession, token: uuid.UUID) -> tuple[HostAvailabilitySettings, User]:
    settings = await HostAvailabilityRepository.get_settings_by_share_token(db, token)
    if settings is None or not settings.is_enabled:
        raise NotFoundError("This booking link is invalid or is no longer active.")
    host = await db.get(User, settings.user_id)
    if host is None:
        raise NotFoundError("This booking link is invalid or is no longer active.")
    return settings, host


async def _compute_available_slots(
    db: AsyncSession, *, settings: HostAvailabilitySettings, target_date: date,
) -> list[tuple[datetime, datetime]]:
    """Candidate slots for one host-local calendar day, minus anything already on
    the host's calendar. Days/times are interpreted in settings.timezone (the
    weekly rules' own timezone) -- the frontend converts each returned UTC start
    into the visitor's own timezone for display, but which *day* a slot belongs to
    is always the host's local day, not the visitor's."""
    host_tz = ZoneInfo(settings.timezone)
    weekday = target_date.weekday()
    rules = [r for r in settings.rules if r.weekday == weekday and not r.is_deleted]
    if not rules:
        return []

    duration = timedelta(minutes=settings.duration_minutes)
    step = timedelta(minutes=settings.duration_minutes + settings.buffer_minutes)
    earliest_utc = datetime.now(timezone.utc) + timedelta(hours=settings.min_notice_hours)

    candidates: list[tuple[datetime, datetime]] = []
    for rule in rules:
        window_start = datetime.combine(target_date, rule.start_time, tzinfo=host_tz)
        window_end = datetime.combine(target_date, rule.end_time, tzinfo=host_tz)
        slot_start = window_start
        while slot_start + duration <= window_end:
            slot_end = slot_start + duration
            start_utc = slot_start.astimezone(timezone.utc)
            end_utc = slot_end.astimezone(timezone.utc)
            if start_utc >= earliest_utc:
                candidates.append((start_utc, end_utc))
            slot_start += step

    if not candidates:
        return []

    day_start_utc = min(c[0] for c in candidates)
    day_end_utc = max(c[1] for c in candidates)
    busy = await ScheduledMeetingRepository.list_overlapping(
        db, host_user_id=settings.user_id, start_time=day_start_utc, end_time=day_end_utc,
    )

    def is_free(start_utc: datetime, end_utc: datetime) -> bool:
        return all(not (m.start_time < end_utc and m.end_time > start_utc) for m in busy)

    return [c for c in candidates if is_free(*c)]


async def get_available_slots(
    db: AsyncSession, *, settings: HostAvailabilitySettings, target_date: date,
) -> list[datetime]:
    """Public-facing wrapper: enforces the booking window (nothing before today or
    beyond booking_window_days, both in the host's own local calendar) before
    computing candidates -- a date outside that range simply has no slots, rather
    than being an error."""
    host_tz = ZoneInfo(settings.timezone)
    today_local = datetime.now(host_tz).date()
    if target_date < today_local or target_date > today_local + timedelta(days=settings.booking_window_days):
        return []

    token = tenant_context.set(settings.organization_id)
    try:
        pairs = await _compute_available_slots(db, settings=settings, target_date=target_date)
    finally:
        tenant_context.reset(token)
    return [start for start, _ in pairs]


def _resolve_booking_location(settings: HostAvailabilitySettings) -> tuple[MeetingLocationType, Optional[str]]:
    """For offline/phone, the host's fixed address/number is reused as-is on every
    booking. For google_meet with no fixed link set, a fresh unique Jitsi room is
    generated per booking so simultaneous bookings never collide in the same room
    -- a host who *did* set a fixed link (e.g. a personal Zoom room) gets that
    reused instead, same as offline/phone."""
    if settings.location_type == MeetingLocationType.GOOGLE_MEET and not settings.location_detail:
        room = f"gravit-{uuid.uuid4().hex[:12]}"
        return MeetingLocationType.GOOGLE_MEET, f"https://meet.jit.si/{room}"
    return settings.location_type, settings.location_detail


async def public_book_slot(
    db: AsyncSession, *, token: uuid.UUID, payload: PublicBookingRequest,
) -> tuple[ScheduledMeeting, str]:
    """Books an open slot on a host's public availability page. Re-validates the
    slot is still genuinely open (within the booking window/notice period, on an
    actually-configured availability rule, and not raced by another visitor)
    rather than trusting whatever the client last fetched, which could already be
    stale. Returns (meeting, manage_link)."""
    settings, host = await get_public_availability_view(db, token)

    tenant_token = tenant_context.set(settings.organization_id)
    try:
        start_utc = payload.start_time.astimezone(timezone.utc)
        end_utc = start_utc + timedelta(minutes=settings.duration_minutes)
        host_tz = ZoneInfo(settings.timezone)
        target_date = start_utc.astimezone(host_tz).date()

        available = await get_available_slots(db, settings=settings, target_date=target_date)
        if start_utc not in available:
            raise ConflictError("This slot is no longer available -- please pick another time.")

        location_type, location_detail = _resolve_booking_location(settings)
        schedule_payload = ScheduleMeetingRequest(
            start_time=start_utc,
            end_time=end_utc,
            client_name=payload.client_name,
            client_email=payload.client_email,
            host_timezone=settings.timezone,
            attendee_timezone=payload.attendee_timezone,
            meeting_title=f"{settings.meeting_type_name} with {payload.client_name}",
            meeting_notes=payload.notes,
            location_type=location_type,
            location_detail=location_detail,
            idempotency_key=payload.idempotency_key,
        )
        meeting, _ = await create_meeting(db, host=host, payload=schedule_payload)
        return meeting, _manage_link(meeting)
    finally:
        tenant_context.reset(tenant_token)
