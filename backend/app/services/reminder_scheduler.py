"""Background task that polls for due reminders and delivers them.

Wired into the FastAPI lifespan in app/main.py alongside the existing
memory_monitor_task, following the same asyncio.create_task loop pattern —
no new scheduler dependency needed for a single fixed-interval poll.
"""

import asyncio
from datetime import datetime, timezone

from loguru import logger

from app.core.context import tenant_context, superuser_context
from app.core.database import AsyncSessionLocal
from app.models.notification import NotificationType
from app.repositories.reminder import CRMReminderRepository
from app.services.notification import NotificationService
from app.utils.email import send_reminder_email


def _build_reminder_message(reminder) -> tuple[str, str]:
    """Builds a human-readable (subject, body) pair for a due reminder.

    Intentionally entity-detail-free (no extra lookups of the deal/lead/etc.)
    to keep the scheduler's hot path cheap; the reminder's own optional
    message note plus its entity reference is enough context to act on.
    """
    entity_label = reminder.entity_type.replace("_", " ")
    subject = f"Reminder: {entity_label} #{reminder.entity_id}"
    body = reminder.message or f"You asked to be reminded about this {entity_label}."
    return subject, body


async def _process_one_reminder(reminder_id: int, *, now: datetime) -> None:
    """Claims and fully processes a single reminder in its own session/transaction,
    so its FOR UPDATE lock is held exactly until this reminder is committed —
    never released early by another reminder's commit in the same batch."""
    async with AsyncSessionLocal() as db:
        su_token = superuser_context.set(True)
        try:
            reminder = await CRMReminderRepository.claim_one(db, reminder_id)
            if reminder is None:
                return  # already claimed/processed by another worker, or no longer pending

            tenant_token = tenant_context.set(reminder.organization_id)
            try:
                subject, body = _build_reminder_message(reminder)
                await NotificationService.notify(
                    db,
                    user_id=reminder.user_id,
                    type=NotificationType.REMINDER_DUE,
                    title=subject,
                    message=body,
                    entity_type=reminder.entity_type,
                    entity_id=reminder.entity_id,
                )
                if reminder.user and reminder.user.email:
                    await send_reminder_email(
                        reminder.user.email,
                        reminder.user.full_name or reminder.user.email,
                        subject,
                        body,
                    )
                await CRMReminderRepository.mark_sent(db, reminder, sent_at=now)
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception(f"Failed to process reminder id={reminder_id}")
            finally:
                tenant_context.reset(tenant_token)
        finally:
            superuser_context.reset(su_token)


async def _process_due_reminders() -> None:
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as db:
        # No request context exists here, so tenant_context is unset — this
        # lock-free id scan naturally sees all orgs.
        su_token = superuser_context.set(True)
        try:
            due_ids = await CRMReminderRepository.list_due_ids(db, now=now)
        finally:
            superuser_context.reset(su_token)

    for reminder_id in due_ids:
        await _process_one_reminder(reminder_id, now=now)


async def reminder_check_task(interval_seconds: int = 60) -> None:
    """Long-running loop: checks for due reminders every `interval_seconds`."""
    logger.info("Starting reminder scheduler background task...")
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await _process_due_reminders()
        except asyncio.CancelledError:
            logger.info("Reminder scheduler task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in reminder scheduler task: {e}")
