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
from zoneinfo import ZoneInfo

from dateutil.relativedelta import relativedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.context import tenant_context
from app.middleware.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models.booking import CancelledBy, MeetingLocationType, MeetingStatus, RecurrenceRule, ScheduledMeeting
from app.models.crm import ActivityType, CRMContact, CRMLead, LeadSource, LeadStatus
from app.models.notification import NotificationType
from app.models.user import User
from app.repositories.booking import ScheduledMeetingRepository
from app.repositories.crm import CRMActivityRepository
from app.repositories.reminder import CRMReminderRepository
from app.schemas.booking import MAX_RECURRING_OCCURRENCES, ScheduleMeetingRequest
from app.services.crm import CRMService
from app.services.notification import NotificationService
from app.utils.email import (
    create_meeting_manage_token,
    decode_meeting_manage_token,
    send_booking_cancelled_email,
    send_booking_confirmation_email,
    spawn_email_task,
)
from app.utils.ics import build_meeting_ics

MEETING_REMINDER_LEAD_MINUTES = 15
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


async def _send_confirmation(db: AsyncSession, *, host: User, meeting: ScheduledMeeting, heading: str) -> None:
    ics_bytes = build_meeting_ics(
        meeting, organizer_email=host.email, organizer_name=host.full_name or host.email, method="REQUEST"
    )
    display_tz = ZoneInfo(meeting.attendee_timezone)
    # Fire-and-forget: the SMTP round trip to an external relay can take seconds to
    # tens of seconds, and awaiting it here would hold the whole create/reschedule
    # request (and the frontend UI waiting on its response) hostage until it finishes.
    spawn_email_task(
        send_booking_confirmation_email(
            to_email=meeting.client_email,
            client_name=meeting.client_name,
            meeting_title=meeting.meeting_title or f"Meeting with {host.full_name or host.email}",
            heading=heading,
            start_time_display=meeting.start_time.astimezone(display_tz).strftime("%A, %B %d, %Y at %I:%M %p"),
            attendee_timezone=meeting.attendee_timezone,
            meet_link=meeting.location_detail if meeting.location_type == MeetingLocationType.GOOGLE_MEET else None,
            location_text=_location_text(meeting),
            maps_url=_maps_url(meeting),
            ics_bytes=ics_bytes,
            ics_method="REQUEST",
            manage_link=_manage_link(meeting),
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

        host = await db.get(User, meeting.host_user_id)
        if host is None:
            raise NotFoundError("Meeting host not found.")

        meeting.start_time = start_utc
        meeting.end_time = end_utc
        meeting.sequence += 1
        await db.flush()

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
