"""Timesheet week-lock business logic.

A week locks automatically the moment it ends without being submitted -- the
employee can no longer add/edit/delete DRAFT entries in it, or submit it, until
their manager grants an unlock request for that exact week. REJECTED entries are
exempt (the manager already re-opened the conversation by rejecting), and the
current week is never locked.
"""

from datetime import date, datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.timesheet import TimesheetWeekUnlockRequest, WeekUnlockStatus
from app.repositories.timesheet import TimesheetWeekUnlockRequestRepository, ProjectTimeLogRepository


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
