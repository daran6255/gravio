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
from app.models.timesheet import ProjectTimeLog, TimesheetStatus, TimesheetWeekUnlockRequest, WeekUnlockStatus
from app.repositories.timesheet import (
    OrgHolidayRepository,
    ProjectTimeLogRepository,
    TimesheetUserSettingsRepository,
    TimesheetWeekUnlockRequestRepository,
)
from app.middleware.exceptions import BadRequestError, ForbiddenError, NotFoundError

if TYPE_CHECKING:
    from app.models.user import User
    from app.schemas.timesheet import ProjectTimeLogCreate, ProjectTimeLogUpdate


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


def can_manage_timesheet_for(current_user: "User", target_user: "User") -> bool:
    """Two-tier approval authorization: a user's direct reporting manager is always
    authorized, and an org ADMIN is authorized for every user org-wide as a fallback/
    escalation tier -- covering the case where the direct manager is unavailable, or
    where a user (e.g. a manager themselves) has no reporting_manager_id set at all.
    Managers still only ever see/act on their own direct reports."""
    from app.models.user import UserRole
    return target_user.reporting_manager_id == current_user.id or current_user.role == UserRole.ADMIN


class TimesheetService:
    # Applied when a user has no weekly_hours_target override set (TimesheetUserSettings).
    DEFAULT_WEEKLY_HOURS_TARGET = 40.0

    @staticmethod
    async def bulk_approve_week(
        db: AsyncSession, current_user: "User", user_ids: list[int], start_date: date, end_date: date,
    ) -> dict:
        """Approves the given week for every listed user this approver is authorized
        for (their direct reports, or -- for an admin -- anyone org-wide); anyone else
        in the list is silently skipped rather than failing the whole batch, so one
        stray id (e.g. a stale row from a slow-refreshing UI) doesn't block the rest."""
        from app.repositories.user import UserRepository

        approved_user_ids: list[int] = []
        skipped_user_ids: list[int] = []
        total_approved_count = 0

        for user_id in user_ids:
            target_user = await UserRepository.get_by_id(db, user_id)
            if not target_user or not can_manage_timesheet_for(current_user, target_user):
                skipped_user_ids.append(user_id)
                continue

            count = await ProjectTimeLogRepository.approve_reject_week(
                db, organization_id=current_user.organization_id, user_id=user_id,
                start_date=start_date, end_date=end_date,
                status=TimesheetStatus.APPROVED, approved_by_id=current_user.id,
            )
            if count == 0:
                skipped_user_ids.append(user_id)
                continue

            approved_user_ids.append(user_id)
            total_approved_count += count

        return {
            "approved_user_ids": approved_user_ids,
            "skipped_user_ids": skipped_user_ids,
            "total_approved_count": total_approved_count,
        }

    @staticmethod
    async def get_team_settings(db: AsyncSession, current_user: "User") -> list[dict]:
        """Per-person weekly_hours_target (and other settings) for everyone the
        current user can manage -- their direct reports, or org-wide for an admin --
        so the team-approvals UI can flag overtime without an N+1 settings fetch."""
        from app.models.user import User, UserRole

        if current_user.role == UserRole.ADMIN:
            result = await db.execute(
                select(User).where(User.organization_id == current_user.organization_id, User.is_deleted.is_(False))
            )
        else:
            result = await db.execute(
                select(User).where(
                    User.reporting_manager_id == current_user.id, User.is_deleted.is_(False),
                )
            )
        team = list(result.scalars().all())
        if not team:
            return []

        settings_rows = await TimesheetUserSettingsRepository.list_for_users(
            db, current_user.organization_id, [u.id for u in team]
        )
        settings_by_user = {s.user_id: s for s in settings_rows}

        return [
            {
                "id": settings_by_user[u.id].id if u.id in settings_by_user else 0,
                "user_id": u.id,
                "user_name": u.full_name or u.email,
                "can_log_on_holidays": settings_by_user[u.id].can_log_on_holidays if u.id in settings_by_user else False,
                "max_retroactive_days": settings_by_user[u.id].max_retroactive_days if u.id in settings_by_user else None,
                "weekly_hours_target": float(settings_by_user[u.id].weekly_hours_target) if u.id in settings_by_user and settings_by_user[u.id].weekly_hours_target is not None else None,
                "created_at": settings_by_user[u.id].created_at if u.id in settings_by_user else u.created_at,
                "updated_at": settings_by_user[u.id].updated_at if u.id in settings_by_user else u.updated_at,
            }
            for u in team
        ]

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

    @staticmethod
    async def update_time_log(
        db: AsyncSession, current_user: "User", log_id: int, payload: "ProjectTimeLogUpdate"
    ) -> ProjectTimeLog:
        """Updates a draft or rejected time entry -- extracted out of PATCH /timesheets/{log_id}
        so the AI update tool goes through the exact same ownership/lock/cap/duplicate checks
        the manual edit form enforces."""
        log = await ProjectTimeLogRepository.get_by_id(db, log_id)
        if not log or log.organization_id != current_user.organization_id:
            raise NotFoundError("Time log entry not found")

        if log.user_id != current_user.id:
            raise ForbiddenError("You cannot modify other users' time logs")

        if log.status not in [TimesheetStatus.DRAFT, TimesheetStatus.REJECTED]:
            raise BadRequestError("You can only modify draft or rejected timesheet entries")

        # Past-week lock -- only applies to DRAFT entries. A REJECTED entry is exempt:
        # the manager already re-opened it by rejecting, so the user must be able to fix
        # and resubmit it regardless of how long ago that week ended.
        if log.status == TimesheetStatus.DRAFT:
            target_date = payload.log_date if payload.log_date is not None else log.log_date
            week_start, _ = get_week_bounds(target_date)
            locked, _ = await TimesheetLockService.check_week_access(
                db, current_user.organization_id, current_user.id, week_start
            )
            if locked:
                raise BadRequestError(
                    f"The week of {week_start.isoformat()} has already ended and is locked. "
                    "Request access from your manager to edit entries for that week."
                )

        # Validate 24 Hours cap on update
        if payload.hours is not None:
            current_day_total = await ProjectTimeLogRepository.get_day_total_hours(
                db, current_user.organization_id, current_user.id, log.log_date, exclude_log_id=log.id
            )
            if current_day_total + payload.hours > 24.0:
                raise BadRequestError(f"Logging {payload.hours}h would exceed the maximum limit of 24 hours per day (already logged {current_day_total}h)")

        # Duplicate entry prevention -- same rule as create, applied to whatever the
        # entry's project/task/category/date will be *after* this update (fields not
        # included in the payload keep their current stored value).
        fields_set = payload.model_fields_set
        target_project_id = payload.project_id if "project_id" in fields_set else log.project_id
        target_task_id = payload.task_id if "task_id" in fields_set else log.task_id
        target_category_id = payload.category_id if "category_id" in fields_set else log.category_id
        target_log_date = payload.log_date if "log_date" in fields_set else log.log_date
        target_billing_type = payload.billing_type if "billing_type" in fields_set else log.billing_type
        existing = await ProjectTimeLogRepository.find_existing_entry(
            db, current_user.organization_id, current_user.id, target_log_date,
            target_project_id, target_task_id, target_category_id, target_billing_type, exclude_log_id=log.id
        )
        if existing:
            target_desc = "this task" if target_task_id else "this project" if target_project_id else "this category"
            raise BadRequestError(
                f"You already have a time entry for {target_desc} on {target_log_date.isoformat()}. "
                "Edit that entry instead of creating a duplicate."
            )

        updated = await ProjectTimeLogRepository.update(db, log, **payload.model_dump(exclude_unset=True))
        await db.commit()
        result = await db.execute(
            select(ProjectTimeLog)
            .options(
                selectinload(ProjectTimeLog.project),
                selectinload(ProjectTimeLog.task),
                selectinload(ProjectTimeLog.category),
                selectinload(ProjectTimeLog.user),
            )
            .where(ProjectTimeLog.id == updated.id)
        )
        return result.scalar_one()

    @staticmethod
    async def delete_time_log(db: AsyncSession, current_user: "User", log_id: int) -> None:
        """Soft-deletes a draft or rejected time entry -- extracted out of
        DELETE /timesheets/{log_id}, same ownership/status/lock checks as the manual UI."""
        log = await ProjectTimeLogRepository.get_by_id(db, log_id)
        if not log or log.organization_id != current_user.organization_id:
            raise NotFoundError("Time log entry not found")

        if log.user_id != current_user.id:
            raise ForbiddenError("You cannot delete other users' time logs")

        if log.status not in [TimesheetStatus.DRAFT, TimesheetStatus.REJECTED]:
            raise BadRequestError("You can only delete draft or rejected timesheet entries")

        # Same past-week lock exemption as update: only DRAFT entries are affected.
        if log.status == TimesheetStatus.DRAFT:
            week_start, _ = get_week_bounds(log.log_date)
            locked, _ = await TimesheetLockService.check_week_access(
                db, current_user.organization_id, current_user.id, week_start
            )
            if locked:
                raise BadRequestError(
                    f"The week of {week_start.isoformat()} has already ended and is locked. "
                    "Request access from your manager to delete entries for that week."
                )

        await ProjectTimeLogRepository.delete(db, log)
        await db.commit()

    @staticmethod
    async def submit_weekly_timesheet(
        db: AsyncSession, current_user: "User", start_date: date, end_date: date
    ) -> int:
        """Submits draft/rejected time entries in a week to the reporting manager --
        extracted out of POST /timesheets/submit-week. Returns the submitted count."""
        if current_user.reporting_manager_id is None:
            raise BadRequestError("You cannot submit timesheets without an assigned Reporting Manager. Set one in your Profile Settings.")

        # Past-week lock -- once a week has ended, it can only be submitted if the
        # manager granted an unlock request for it.
        locked, grant = await TimesheetLockService.check_week_access(
            db, current_user.organization_id, current_user.id, start_date
        )
        if locked:
            raise BadRequestError(
                f"The week of {start_date.isoformat()} has already ended and is locked for "
                "submission. Request access from your manager to submit it."
            )

        rowcount = await ProjectTimeLogRepository.submit_week(
            db, organization_id=current_user.organization_id, user_id=current_user.id,
            start_date=start_date, end_date=end_date
        )
        if rowcount == 0:
            raise BadRequestError("No draft or rejected time entries found to submit for the selected week")

        # The unlock grant that got us past the lock check above is one-shot -- consume
        # it now that the submission actually went through.
        if grant is not None:
            await TimesheetWeekUnlockRequestRepository.consume(db, grant)

        await db.commit()
        return rowcount

    @staticmethod
    async def request_week_unlock(
        db: AsyncSession, current_user: "User", week_start_date: date, week_end_date: date, reason: Optional[str] = None,
    ) -> TimesheetWeekUnlockRequest:
        """Asks the reporting manager to re-open a past week that ended without being
        submitted -- extracted out of POST /timesheets/week-unlock-requests."""
        if current_user.reporting_manager_id is None:
            raise BadRequestError("You cannot request a week unlock without an assigned Reporting Manager. Set one in your Profile Settings.")

        week_start, week_end = get_week_bounds(week_start_date)
        if week_end != week_end_date:
            raise BadRequestError("week_start_date and week_end_date must be the Monday and Sunday of the same week")

        today_monday, _ = get_week_bounds(date.today())
        if week_start >= today_monday:
            raise BadRequestError("Only past weeks can be requested for unlock -- the current week is never locked")

        existing = await TimesheetWeekUnlockRequestRepository.get_pending_for_week(
            db, current_user.organization_id, current_user.id, week_start
        )
        if existing:
            raise BadRequestError("You already have a pending unlock request for this week")

        active_grant = await TimesheetWeekUnlockRequestRepository.get_active_grant(
            db, current_user.organization_id, current_user.id, week_start
        )
        if active_grant:
            raise BadRequestError("This week is already unlocked -- you can edit and submit it now")

        req = await TimesheetWeekUnlockRequestRepository.create(
            db,
            organization_id=current_user.organization_id,
            user_id=current_user.id,
            week_start_date=week_start,
            week_end_date=week_end,
            reason=reason,
        )
        await db.commit()
        return req
