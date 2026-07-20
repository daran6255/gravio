"""Timesheet week-lock business logic.

A week locks automatically the moment it ends without being submitted -- the
employee can no longer add/edit/delete DRAFT entries in it, or submit it, until
their manager grants an unlock request for that exact week. REJECTED entries are
exempt (the manager already re-opened the conversation by rejecting), and the
current week is never locked.
"""

from datetime import date, datetime, timedelta
from typing import Optional, TYPE_CHECKING
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project, ProjectTask
from app.models.timesheet import ProjectTimeLog, TimesheetWeekUnlockRequest, WeekUnlockStatus
from app.repositories.timesheet import (
    OrgHolidayRepository,
    ProjectTimeLogRepository,
    TimesheetUserSettingsRepository,
    TimesheetWeekUnlockRequestRepository,
)
from app.middleware.exceptions import BadRequestError, NotFoundError

if TYPE_CHECKING:
    from app.models.user import User
    from app.schemas.timesheet import ProjectTimeLogCreate


def get_week_bounds(d: date) -> tuple[date, date]:
    """Monday..Sunday for the week containing `d`."""
    monday = d - timedelta(days=d.weekday())
    return monday, monday + timedelta(days=6)


def is_weekly_off(d: date) -> bool:
    """Sunday is always treated as a holiday, independent of the org's configured
    holiday calendar -- no OrgHoliday row needs to exist for it."""
    return d.weekday() == 6


class TimesheetLockService:
    @staticmethod
    async def check_week_access(
        db: AsyncSession, organization_id: int, user_id: int, week_start: date
    ) -> tuple[bool, Optional[TimesheetWeekUnlockRequest]]:
        """Returns (locked, active_grant). `locked=True` means the caller must block
        the action. `active_grant` is set when a past week was unlocked, so the
        caller (submit_week) can consume it once the submission actually succeeds."""
        today_monday, _ = get_week_bounds(date.today())
        if week_start >= today_monday:
            return False, None

        _, week_end = get_week_bounds(week_start)
        if await ProjectTimeLogRepository.week_has_rejected_entry(db, organization_id, user_id, week_start, week_end):
            return False, None

        if await ProjectTimeLogRepository.week_has_submitted_or_approved_entry(db, organization_id, user_id, week_start, week_end):
            return False, None

        grant = await TimesheetWeekUnlockRequestRepository.get_active_grant(
            db, organization_id, user_id, week_start
        )
        return grant is None, grant

    @staticmethod
    async def auto_grant_for_revoke(
        db: AsyncSession, *, organization_id: int, user_id: int,
        week_start: date, week_end: date, resolved_by_id: int,
    ) -> None:
        """Called when a manager revokes a wrongly-submitted/approved past week --
        creates an already-approved, unconsumed grant so resetting the entries to
        DRAFT doesn't just re-lock them behind the same wall the revoke is meant to
        clear. No-op for the current week, since that's never locked anyway."""
        today_monday, _ = get_week_bounds(date.today())
        if week_start >= today_monday:
            return

        await TimesheetWeekUnlockRequestRepository.create(
            db,
            organization_id=organization_id,
            user_id=user_id,
            week_start_date=week_start,
            week_end_date=week_end,
            reason="Auto-granted: manager revoked this week's submission",
            status=WeekUnlockStatus.APPROVED,
            resolved_by_id=resolved_by_id,
            resolved_at=datetime.utcnow(),
            resolution_note="Auto-granted alongside the revoke action",
        )


class TimesheetService:
    @staticmethod
    async def create_time_log(
        db: AsyncSession, current_user: "User", payload: "ProjectTimeLogCreate"
    ) -> ProjectTimeLog:
        """Logs a new time entry, enforcing every validation the manual UI form enforces
        (holiday/lock/retroactive/duplicate/24h-cap checks) -- extracted out of the
        POST /timesheets/ endpoint so the AI natural-language logging tool goes through
        the exact same rules instead of a second, drift-prone copy of them."""
        today = date.today()

        # Validation 1: Future logging prevention
        if payload.log_date > today:
            raise BadRequestError("Future time logging is blocked by default configuration")

        # Validation 1.5: Past-week lock -- a week that already ended without being
        # submitted is locked until the reporting manager grants an unlock request.
        week_start, week_end = get_week_bounds(payload.log_date)
        locked, _ = await TimesheetLockService.check_week_access(
            db, current_user.organization_id, current_user.id, week_start
        )
        if locked:
            raise BadRequestError(
                f"The week of {week_start.isoformat()} has already ended and is locked. "
                "Request access from your manager to add entries for that week."
            )

        # Validation 1.6: Submitted/Approved week block -- once a week is submitted or
        # approved, no new entries can be added to it until the manager rejects or revokes it.
        has_submitted_or_approved = await ProjectTimeLogRepository.week_has_submitted_or_approved_entry(
            db, current_user.organization_id, current_user.id, week_start, week_end
        )
        if has_submitted_or_approved:
            raise BadRequestError(
                "This week is already submitted or approved. You cannot log additional time "
                "until your manager rejects or revokes it."
            )

        # Validation 2: Retroactive limit check
        user_settings = await TimesheetUserSettingsRepository.get_by_user(db, current_user.organization_id, current_user.id)
        max_days = user_settings.max_retroactive_days if user_settings.max_retroactive_days is not None else 30
        if (today - payload.log_date).days > max_days:
            raise BadRequestError(f"Cannot log time older than {max_days} days retroactively")

        # Validation 3: Holiday blocking -- Sunday is always a holiday, in addition to
        # whatever the org's holiday calendar has configured.
        holiday = await OrgHolidayRepository.check_date(db, current_user.organization_id, payload.log_date)
        is_holiday_override = False
        if holiday or is_weekly_off(payload.log_date):
            if not user_settings.can_log_on_holidays:
                reason = holiday.name if holiday else "Sunday"
                raise BadRequestError(f"Logging time on holidays is blocked ({reason}). Contact your manager for override access.")
            is_holiday_override = True

        # Validation 4: 24 Hours cap verification
        current_day_total = await ProjectTimeLogRepository.get_day_total_hours(
            db, current_user.organization_id, current_user.id, payload.log_date
        )
        if current_day_total + payload.hours > 24.0:
            raise BadRequestError(f"Logging {payload.hours}h would exceed the maximum limit of 24 hours per day (already logged {current_day_total}h)")

        # Validation 5: Project & Task availability
        if payload.project_id:
            proj = await db.get(Project, payload.project_id)
            if not proj or proj.organization_id != current_user.organization_id:
                raise NotFoundError("Project not found")
            if payload.task_id:
                tsk = await db.get(ProjectTask, payload.task_id)
                if not tsk or tsk.project_id != payload.project_id:
                    raise NotFoundError("Task not found under the selected project")

        # Validation 6: Duplicate entry prevention -- one entry per project/task (or
        # category, for general time) per user per day. Edit the existing entry
        # instead of logging a separate one for the same target.
        existing = await ProjectTimeLogRepository.find_existing_entry(
            db, current_user.organization_id, current_user.id, payload.log_date,
            payload.project_id, payload.task_id, payload.category_id, payload.billing_type
        )
        if existing:
            target_desc = "this task" if payload.task_id else "this project" if payload.project_id else "this category"
            raise BadRequestError(
                f"You already have a time entry for {target_desc} on {payload.log_date.isoformat()}. "
                "Edit the existing entry instead of adding a new one."
            )

        log = await ProjectTimeLogRepository.create(
            db,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            project_id=payload.project_id,
            task_id=payload.task_id,
            category_id=payload.category_id,
            log_date=payload.log_date,
            hours=payload.hours,
            notes=payload.notes,
            billing_type=payload.billing_type,
            is_holiday_override=is_holiday_override,
        )
        await db.commit()

        result = await db.execute(
            select(ProjectTimeLog)
            .options(
                selectinload(ProjectTimeLog.project),
                selectinload(ProjectTimeLog.task),
                selectinload(ProjectTimeLog.category),
                selectinload(ProjectTimeLog.user),
            )
            .where(ProjectTimeLog.id == log.id)
        )
        return result.scalar_one()
