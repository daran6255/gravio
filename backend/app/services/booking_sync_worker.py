"""Background task that retries Google Calendar sync for meetings that couldn't be
synced inline (host just connected Google after booking, transient API failure, etc).

Wired into the FastAPI lifespan in app/main.py alongside memory_monitor_task and
reminder_check_task, following the same asyncio.create_task fixed-interval loop
pattern as app/services/reminder_scheduler.py — no new scheduler dependency.
"""

import asyncio
from datetime import datetime, timezone

from loguru import logger

from app.core.config import settings
from app.core.context import superuser_context, tenant_context
from app.core.database import AsyncSessionLocal
from app.models.booking import BookingLocationType, CalendarSyncStatus, GoogleConnectionStatus
from app.models.notification import NotificationType
from app.models.user import User
from app.repositories.booking import GoogleOAuthConnectionRepository, ScheduledMeetingRepository
from app.services import google_calendar
from app.services.notification import NotificationService


async def _process_one_meeting(meeting_id: int) -> None:
    """Claims and processes a single meeting's sync retry in its own session/
    transaction — same isolation rationale as reminder_scheduler's
    _process_one_reminder: the row lock must be held exactly until this meeting's
    outcome is committed, not released early by another meeting's commit in the batch."""
    async with AsyncSessionLocal() as db:
        su_token = superuser_context.set(True)
        try:
            meeting = await ScheduledMeetingRepository.claim_for_sync(db, meeting_id)
            if meeting is None:
                return  # already claimed by another worker/replica, or no longer pending

            tenant_token = tenant_context.set(meeting.organization_id)
            try:
                page = meeting.booking_page
                host: User | None = page.user if page else None
                if page is None or host is None or page.location_type != BookingLocationType.GOOGLE_MEET:
                    meeting.calendar_sync_status = CalendarSyncStatus.NOT_APPLICABLE
                    await db.commit()
                    return

                connection = await GoogleOAuthConnectionRepository.get_by_user_id(db, host.id)
                if connection is None or connection.status != GoogleConnectionStatus.CONNECTED:
                    # Nothing to retry against right now; leave as-is (PENDING) so a future
                    # connect + this same worker cycle can pick it up again later.
                    await db.commit()
                    return

                sync_fn = google_calendar.patch_event if meeting.google_event_id else google_calendar.create_event
                result = await sync_fn(db, connection, meeting, page)
                meeting.calendar_sync_attempts += 1

                if result.ok:
                    meeting.calendar_sync_status = CalendarSyncStatus.SYNCED
                    meeting.google_event_id = result.google_event_id or meeting.google_event_id
                    meeting.google_meet_link = result.google_meet_link or meeting.google_meet_link
                    meeting.calendar_sync_last_error = None
                else:
                    meeting.calendar_sync_last_error = (result.error or "")[:500]
                    if meeting.calendar_sync_attempts >= settings.BOOKING_SYNC_MAX_ATTEMPTS:
                        meeting.calendar_sync_status = CalendarSyncStatus.FAILED
                        await NotificationService.notify(
                            db,
                            user_id=host.id,
                            type=NotificationType.REMINDER_DUE,
                            title="Calendar sync failed for a booked meeting",
                            message=(
                                f"We couldn't add your meeting with {meeting.client_name} to Google Calendar "
                                f"after {meeting.calendar_sync_attempts} attempts. The booking is still confirmed "
                                "(the client received a calendar invite by email) — please check your Google "
                                "Calendar connection in Settings and share the meeting link manually if needed."
                            ),
                            entity_type="scheduled_meeting",
                            entity_id=meeting.id,
                            organization_id=meeting.organization_id,
                        )
                    else:
                        meeting.calendar_sync_status = CalendarSyncStatus.PENDING

                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception(f"Failed to process calendar sync for meeting id={meeting_id}")
            finally:
                tenant_context.reset(tenant_token)
        finally:
            superuser_context.reset(su_token)


async def _process_due_syncs() -> None:
    async with AsyncSessionLocal() as db:
        su_token = superuser_context.set(True)
        try:
            due_ids = await ScheduledMeetingRepository.list_pending_sync(db, max_attempts=settings.BOOKING_SYNC_MAX_ATTEMPTS)
        finally:
            superuser_context.reset(su_token)

    for meeting_id in due_ids:
        await _process_one_meeting(meeting_id)


async def booking_sync_check_task(interval_seconds: int | None = None) -> None:
    """Long-running loop: retries pending/failed Google Calendar syncs every
    `interval_seconds` (default settings.BOOKING_SYNC_RETRY_INTERVAL_SECONDS)."""
    interval = interval_seconds or settings.BOOKING_SYNC_RETRY_INTERVAL_SECONDS
    logger.info("Starting booking calendar-sync background task...")
    while True:
        try:
            await asyncio.sleep(interval)
            await _process_due_syncs()
        except asyncio.CancelledError:
            logger.info("Booking calendar-sync task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in booking calendar-sync task: {e}")
