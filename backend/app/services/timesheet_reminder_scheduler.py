"""Background task that nudges employees about unsubmitted weekly timesheets, and
nudges managers/admins about timesheets waiting on their approval -- closing the
"discovery is entirely passive" gap (nobody hears about a week going unsubmitted
until they happen to open the page).

Wired into the FastAPI lifespan in app/main.py, following the same
asyncio.create_task loop pattern as reminder_scheduler.py / meeting_scheduler.py.
"""

import asyncio
from datetime import date, timedelta

from loguru import logger

from app.core.context import superuser_context, tenant_context
from app.core.database import AsyncSessionLocal
from app.models.notification import NotificationType
from app.models.user import User, UserRole
from app.repositories.notification import NotificationRepository
from app.repositories.timesheet import ProjectTimeLogRepository
from app.repositories.user import UserRepository
from app.services.notification import NotificationService
from app.services.timesheet import get_week_bounds


async def _remind_unsubmitted_week(db, user: User, week_start: date, week_end: date) -> None:
    """Nudges one user about last week if they never submitted/approved anything in
    it -- covers both "forgot entirely" (zero entries) and "started but never hit
    submit" (draft-only) cases, since either way nothing reached their manager."""
    has_submitted = await ProjectTimeLogRepository.week_has_submitted_or_approved_entry(
        db, user.organization_id, user.id, week_start, week_end
    )
    if has_submitted:
        return

    entity_id = week_start.toordinal()
    already_sent = await NotificationRepository.exists_for_entity(
        db, user_id=user.id, type=NotificationType.TIMESHEET_WEEK_UNSUBMITTED,
        entity_type="timesheet_week", entity_id=entity_id,
    )
    if already_sent:
        return

    await NotificationService.notify(
        db,
        user_id=user.id,
        type=NotificationType.TIMESHEET_WEEK_UNSUBMITTED,
        title="Timesheet not submitted",
        message=f"Your timesheet for the week of {week_start.isoformat()} hasn't been submitted yet.",
        entity_type="timesheet_week",
        entity_id=entity_id,
        organization_id=user.organization_id,
    )


async def _remind_pending_approvals(db, approver: User, pending_count: int) -> None:
    """Nudges one manager/admin, at most once a day, about submitted entries waiting
    on them -- deduped by day rather than by exact entries, since the underlying set
    of pending logs shifts constantly as people submit/get approved."""
    entity_id = date.today().toordinal()
    already_sent = await NotificationRepository.exists_for_entity(
        db, user_id=approver.id, type=NotificationType.TIMESHEET_PENDING_APPROVALS,
        entity_type="timesheet_pending_approvals", entity_id=entity_id,
    )
    if already_sent:
        return

    await NotificationService.notify(
        db,
        user_id=approver.id,
        type=NotificationType.TIMESHEET_PENDING_APPROVALS,
        title="Timesheets awaiting your approval",
        message=f"You have {pending_count} team member(s) with timesheets submitted and waiting on your approval.",
        entity_type="timesheet_pending_approvals",
        entity_id=entity_id,
        organization_id=approver.organization_id,
    )


async def _process_one_org(organization_id: int, *, week_start: date, week_end: date) -> None:
    async with AsyncSessionLocal() as db:
        su_token = superuser_context.set(True)
        tenant_token = tenant_context.set(organization_id)
        try:
            users = await UserRepository.list_active_for_org(db, organization_id)
            users_by_id = {u.id: u for u in users}

            for user in users:
                try:
                    await _remind_unsubmitted_week(db, user, week_start, week_end)
                except Exception:
                    logger.exception(f"Failed timesheet-unsubmitted reminder for user id={user.id}")

            pending_user_ids = await ProjectTimeLogRepository.list_users_with_pending_approvals(db, organization_id)
            if pending_user_ids:
                # Fan out: for each employee with something pending, notify their
                # manager, plus every admin org-wide -- the same escalation tier
                # that can act on approve/reject/revoke (see can_manage_timesheet_for).
                pending_by_approver: dict[int, int] = {}
                admins = [u for u in users if u.role == UserRole.ADMIN]
                for uid in pending_user_ids:
                    target = users_by_id.get(uid)
                    manager_id = target.reporting_manager_id if target else None
                    if manager_id and manager_id in users_by_id:
                        pending_by_approver[manager_id] = pending_by_approver.get(manager_id, 0) + 1
                    for admin in admins:
                        pending_by_approver[admin.id] = pending_by_approver.get(admin.id, 0) + 1

                for approver_id, count in pending_by_approver.items():
                    approver = users_by_id.get(approver_id)
                    if not approver:
                        continue
                    try:
                        await _remind_pending_approvals(db, approver, count)
                    except Exception:
                        logger.exception(f"Failed pending-approvals reminder for user id={approver_id}")

            await db.commit()
        except Exception:
            await db.rollback()
            logger.exception(f"Failed timesheet reminder scan for organization_id={organization_id}")
        finally:
            tenant_context.reset(tenant_token)
            superuser_context.reset(su_token)


async def _process_timesheet_reminders() -> None:
    today = date.today()
    week_start, week_end = get_week_bounds(today - timedelta(weeks=1))

    async with AsyncSessionLocal() as db:
        su_token = superuser_context.set(True)
        try:
            org_ids = await UserRepository.list_active_organization_ids(db)
        finally:
            superuser_context.reset(su_token)

    for org_id in org_ids:
        await _process_one_org(org_id, week_start=week_start, week_end=week_end)


async def timesheet_reminder_task(interval_seconds: int = 21600) -> None:
    """Long-running loop: nudges employees about unsubmitted weeks and managers/admins
    about pending approvals every `interval_seconds` (default 6h) -- infrequent since
    every notification here is deduped by day/week, so a shorter interval would just
    re-check the same already-decided answer more often for no benefit."""
    logger.info("Starting timesheet reminder background task...")
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await _process_timesheet_reminders()
        except asyncio.CancelledError:
            logger.info("Timesheet reminder task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in timesheet reminder task: {e}")
