"""Background task that sends client-facing meeting reminders (24h and 1h before
start) and auto-completes meetings whose end_time has passed.

Wired into the FastAPI lifespan in app/main.py alongside reminder_check_task,
following the same asyncio.create_task loop pattern.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from loguru import logger
from sqlalchemy import update

from app.core.context import superuser_context, tenant_context
from app.core.database import AsyncSessionLocal
from app.models.booking import MeetingLocationType, MeetingStatus, ScheduledMeeting
from app.models.user import User
from app.repositories.booking import ScheduledMeetingRepository
from app.utils.email import create_meeting_manage_token, send_meeting_reminder_email, spawn_email_task

_REMINDER_WINDOWS: list[tuple[str, timedelta, str]] = [
    ("client_reminder_24h_sent_at", timedelta(hours=24), "tomorrow"),
    ("client_reminder_1h_sent_at", timedelta(hours=1), "in 1 hour"),
]


def _location_text(meeting: ScheduledMeeting) -> tuple[str | None, str | None]:
    """Returns (meet_link, location_text) the same way app/services/booking.py does."""
    meet_link = meeting.location_detail if meeting.location_type == MeetingLocationType.GOOGLE_MEET else None
    location_text = None
    if meeting.location_type == MeetingLocationType.OFFLINE:
        location_text = meeting.location_detail
    elif meeting.location_type == MeetingLocationType.PHONE and meeting.location_detail:
        location_text = f"Phone: {meeting.location_detail}"
    return meet_link, location_text


async def _send_one_client_reminder(meeting_id: int, *, column_name: str, lead_time_label: str, now: datetime) -> None:
    async with AsyncSessionLocal() as db:
        su_token = superuser_context.set(True)
        try:
            meeting = await ScheduledMeetingRepository.get_by_id(db, meeting_id)
            if meeting is None or meeting.status != MeetingStatus.SCHEDULED:
                return

            tenant_token = tenant_context.set(meeting.organization_id)
            try:
                claimed = await ScheduledMeetingRepository.claim_client_reminder(
                    db, meeting_id=meeting.id, column_name=column_name, now=now
                )
                if not claimed:
                    return  # another worker already claimed/sent this one

                await db.commit()

                host = await db.get(User, meeting.host_user_id)
                display_tz = ZoneInfo(meeting.attendee_timezone)
                meet_link, location_text = _location_text(meeting)
                manage_token = create_meeting_manage_token(meeting.public_id)
                from app.core.config import settings

                base_url = settings.FRONTEND_URL or "http://localhost:5173"
                spawn_email_task(
                    send_meeting_reminder_email(
                        to_email=meeting.client_email,
                        client_name=meeting.client_name,
                        meeting_title=meeting.meeting_title or f"Meeting with {host.full_name or host.email if host else 'your host'}",
                        lead_time_label=lead_time_label,
                        start_time_display=meeting.start_time.astimezone(display_tz).strftime("%A, %B %d, %Y at %I:%M %p"),
                        attendee_timezone=meeting.attendee_timezone,
                        meet_link=meet_link,
                        location_text=location_text,
                        manage_link=f"{base_url}/meetings/manage?token={manage_token}",
                    )
                )
            except Exception:
                await db.rollback()
                logger.exception(f"Failed to send client reminder for meeting id={meeting_id}")
            finally:
                tenant_context.reset(tenant_token)
        finally:
            superuser_context.reset(su_token)


async def _auto_complete_one(meeting_id: int) -> None:
    async with AsyncSessionLocal() as db:
        su_token = superuser_context.set(True)
        try:
            meeting = await ScheduledMeetingRepository.get_by_id(db, meeting_id)
            if meeting is None:
                return
            tenant_token = tenant_context.set(meeting.organization_id)
            try:
                # Conditional UPDATE — only transitions if still SCHEDULED, so a
                # host who manually completed/cancelled it in the meantime wins.
                result = await db.execute(
                    update(ScheduledMeeting)
                    .where(ScheduledMeeting.id == meeting_id, ScheduledMeeting.status == MeetingStatus.SCHEDULED)
                    .values(status=MeetingStatus.COMPLETED)
                )
                await db.commit()
                if result.rowcount == 0:
                    return
            except Exception:
                await db.rollback()
                logger.exception(f"Failed to auto-complete meeting id={meeting_id}")
            finally:
                tenant_context.reset(tenant_token)
        finally:
            superuser_context.reset(su_token)


async def _process_meeting_maintenance() -> None:
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        su_token = superuser_context.set(True)
        try:
            for column_name, lead_time, label in _REMINDER_WINDOWS:
                due_ids = await ScheduledMeetingRepository.list_due_for_client_reminder(
                    db, column_name=column_name, before=now + lead_time
                )
                for meeting_id in due_ids:
                    await _send_one_client_reminder(meeting_id, column_name=column_name, lead_time_label=label, now=now)

            complete_ids = await ScheduledMeetingRepository.list_due_for_auto_complete(db, now=now)
        finally:
            superuser_context.reset(su_token)

    for meeting_id in complete_ids:
        await _auto_complete_one(meeting_id)


async def meeting_maintenance_task(interval_seconds: int = 300) -> None:
    """Long-running loop: sends client reminders and auto-completes past meetings
    every `interval_seconds`."""
    logger.info("Starting meeting maintenance background task...")
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await _process_meeting_maintenance()
        except asyncio.CancelledError:
            logger.info("Meeting maintenance task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in meeting maintenance task: {e}")
