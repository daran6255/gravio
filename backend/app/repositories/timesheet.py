import uuid
from datetime import date, datetime
from typing import Optional, Sequence
from sqlalchemy import select, and_, or_, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.timesheet import (
    ProjectTimeLog, OrgHoliday, UserTimesheetCategory, TimesheetUserSettings,
    TimesheetStatus, TimesheetBillingType, HolidayType,
    TimesheetWeekUnlockRequest, WeekUnlockStatus,
)
from app.models.user import User

class TimesheetCategoryRepository:
    # Seeded once per organization (onboarding, or lazily on first fetch for orgs
    # created before this existed) so "General" logging always has something to
    # pick from out of the box, mirroring ProjectService.seed_default_task_statuses.
    DEFAULT_CATEGORIES = [
        {"name": "Meetings", "color": "#3B82F6"},
        {"name": "Training", "color": "#8B7CF6"},
        {"name": "Administrative", "color": "#F59E0B"},
        {"name": "Leave", "color": "#10B981"},
        {"name": "Other", "color": "#6B7280"},
    ]

    @staticmethod
    async def get_by_id(db: AsyncSession, id: int) -> Optional[UserTimesheetCategory]:
        result = await db.execute(select(UserTimesheetCategory).where(UserTimesheetCategory.id == id, UserTimesheetCategory.is_deleted.is_(False)))
        return result.scalars().first()

    @staticmethod
    async def list_for_user(db: AsyncSession, organization_id: int, user_id: int) -> Sequence[UserTimesheetCategory]:
        # Return categories that are either org-wide defaults OR owned by this specific user
        stmt = (
            select(UserTimesheetCategory)
            .where(
                UserTimesheetCategory.organization_id == organization_id,
                UserTimesheetCategory.is_deleted.is_(False),
                or_(
                    UserTimesheetCategory.user_id == user_id,
                    UserTimesheetCategory.is_org_default.is_(True)
                )
            )
            .order_index(UserTimesheetCategory.id) if hasattr(UserTimesheetCategory, 'order_index') else select(UserTimesheetCategory).where(
                UserTimesheetCategory.organization_id == organization_id,
                UserTimesheetCategory.is_deleted.is_(False),
                or_(
                    UserTimesheetCategory.user_id == user_id,
                    UserTimesheetCategory.is_org_default.is_(True)
                )
            ).order_by(UserTimesheetCategory.id.asc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def create(db: AsyncSession, *, organization_id: int, user_id: Optional[int], name: str, color: Optional[str] = None, is_org_default: bool = False) -> UserTimesheetCategory:
        category = UserTimesheetCategory(
            organization_id=organization_id,
            user_id=user_id,
            name=name,
            color=color,
            is_org_default=is_org_default
        )
        db.add(category)
        await db.flush()
        return category

    @staticmethod
    async def seed_defaults(db: AsyncSession, organization_id: int) -> Sequence[UserTimesheetCategory]:
        """Create the org-default category set if none exist yet for this org. Idempotent --
        safe to call from onboarding and again later as a lazy-seed fallback."""
        existing = await TimesheetCategoryRepository.list_for_user(db, organization_id=organization_id, user_id=0)
        org_defaults = [c for c in existing if c.is_org_default]
        if org_defaults:
            return org_defaults

        created = []
        for cat in TimesheetCategoryRepository.DEFAULT_CATEGORIES:
            created.append(
                await TimesheetCategoryRepository.create(
                    db,
                    organization_id=organization_id,
                    user_id=None,
                    name=cat["name"],
                    color=cat["color"],
                    is_org_default=True,
                )
            )
        return created

    @staticmethod
    async def update(db: AsyncSession, category: UserTimesheetCategory, **kwargs) -> UserTimesheetCategory:
        for key, val in kwargs.items():
            if val is not None:
                setattr(category, key, val)
        await db.flush()
        return category

    @staticmethod
    async def delete(db: AsyncSession, category: UserTimesheetCategory) -> None:
        category.is_deleted = True
        category.deleted_at = datetime.utcnow()
        await db.flush()


class OrgHolidayRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, id: int) -> Optional[OrgHoliday]:
        result = await db.execute(select(OrgHoliday).where(OrgHoliday.id == id, OrgHoliday.is_deleted.is_(False)))
        return result.scalars().first()

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[OrgHoliday]:
        result = await db.execute(select(OrgHoliday).where(OrgHoliday.public_id == public_id, OrgHoliday.is_deleted.is_(False)))
        return result.scalars().first()

    @staticmethod
    async def list_all(db: AsyncSession, organization_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> Sequence[OrgHoliday]:
        conditions = [OrgHoliday.organization_id == organization_id, OrgHoliday.is_deleted.is_(False)]
        if start_date:
            conditions.append(OrgHoliday.holiday_date >= start_date)
        if end_date:
            conditions.append(OrgHoliday.holiday_date <= end_date)
        
        result = await db.execute(select(OrgHoliday).where(*conditions).order_by(OrgHoliday.holiday_date.asc()))
        return result.scalars().all()

    @staticmethod
    async def check_date(db: AsyncSession, organization_id: int, check_date: date) -> Optional[OrgHoliday]:
        result = await db.execute(
            select(OrgHoliday).where(
                OrgHoliday.organization_id == organization_id,
                OrgHoliday.holiday_date == check_date,
                OrgHoliday.is_deleted.is_(False)
            )
        )
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, organization_id: int, name: str, holiday_date: date, type: HolidayType = HolidayType.PUBLIC, country_code: Optional[str] = None) -> OrgHoliday:
        holiday = OrgHoliday(
            organization_id=organization_id,
            name=name,
            holiday_date=holiday_date,
            type=type,
            country_code=country_code
        )
        db.add(holiday)
        await db.flush()
        return holiday

    @staticmethod
    async def update(db: AsyncSession, holiday: OrgHoliday, **kwargs) -> OrgHoliday:
        for key, val in kwargs.items():
            if val is not None:
                setattr(holiday, key, val)
        await db.flush()
        return holiday

    @staticmethod
    async def delete(db: AsyncSession, holiday: OrgHoliday) -> None:
        holiday.is_deleted = True
        holiday.deleted_at = datetime.utcnow()
        await db.flush()


class TimesheetUserSettingsRepository:
    @staticmethod
    async def get_by_user(db: AsyncSession, organization_id: int, user_id: int) -> TimesheetUserSettings:
        result = await db.execute(
            select(TimesheetUserSettings).where(
                TimesheetUserSettings.organization_id == organization_id,
                TimesheetUserSettings.user_id == user_id
            )
        )
        settings = result.scalars().first()
        if not settings:
            settings = TimesheetUserSettings(
                organization_id=organization_id,
                user_id=user_id,
                can_log_on_holidays=False
            )
            db.add(settings)
            await db.flush()
        return settings

    @staticmethod
    async def update(db: AsyncSession, settings: TimesheetUserSettings, **kwargs) -> TimesheetUserSettings:
        for key, val in kwargs.items():
            if val is not None:
                setattr(settings, key, val)
        await db.flush()
        return settings


class ProjectTimeLogRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, id: int) -> Optional[ProjectTimeLog]:
        result = await db.execute(select(ProjectTimeLog).where(ProjectTimeLog.id == id, ProjectTimeLog.is_deleted.is_(False)))
        return result.scalars().first()

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[ProjectTimeLog]:
        result = await db.execute(select(ProjectTimeLog).where(ProjectTimeLog.public_id == public_id, ProjectTimeLog.is_deleted.is_(False)))
        return result.scalars().first()

    @staticmethod
    async def week_has_rejected_entry(db: AsyncSession, organization_id: int, user_id: int, week_start: date, week_end: date) -> bool:
        """Whether any (non-deleted) entry in this week is REJECTED -- if so the whole
        week is exempt from the past-week lock, since the manager already re-opened it
        by rejecting and the user needs to be able to fix/add entries across the week."""
        result = await db.execute(
            select(ProjectTimeLog.id).where(
                ProjectTimeLog.organization_id == organization_id,
                ProjectTimeLog.user_id == user_id,
                ProjectTimeLog.log_date >= week_start,
                ProjectTimeLog.log_date <= week_end,
                ProjectTimeLog.status == TimesheetStatus.REJECTED,
                ProjectTimeLog.is_deleted.is_(False)
            ).limit(1)
        )
        return result.scalars().first() is not None

    @staticmethod
    async def week_has_submitted_or_approved_entry(db: AsyncSession, organization_id: int, user_id: int, week_start: date, week_end: date) -> bool:
        """Whether any (non-deleted) entry in this week is SUBMITTED or APPROVED."""
        result = await db.execute(
            select(ProjectTimeLog.id).where(
                ProjectTimeLog.organization_id == organization_id,
                ProjectTimeLog.user_id == user_id,
                ProjectTimeLog.log_date >= week_start,
                ProjectTimeLog.log_date <= week_end,
                ProjectTimeLog.status.in_([TimesheetStatus.SUBMITTED, TimesheetStatus.APPROVED]),
                ProjectTimeLog.is_deleted.is_(False)
            ).limit(1)
        )
        return result.scalars().first() is not None

    @staticmethod
    async def list_for_user(db: AsyncSession, organization_id: int, user_id: int, start_date: date, end_date: date) -> Sequence[ProjectTimeLog]:
        result = await db.execute(
            select(ProjectTimeLog)
            .where(
                ProjectTimeLog.organization_id == organization_id,
                ProjectTimeLog.user_id == user_id,
                ProjectTimeLog.log_date >= start_date,
                ProjectTimeLog.log_date <= end_date,
                ProjectTimeLog.is_deleted.is_(False)
            )
            .order_by(ProjectTimeLog.log_date.asc())
        )
        return result.scalars().all()

    @staticmethod
    async def find_existing_entry(
        db: AsyncSession,
        organization_id: int,
        user_id: int,
        log_date: date,
        project_id: Optional[int],
        task_id: Optional[int],
        category_id: Optional[int],
        billing_type: TimesheetBillingType,
        exclude_log_id: Optional[int] = None
    ) -> Optional[ProjectTimeLog]:
        """Whether this user already has a (non-deleted) entry for this exact
        project/task (or category, for general time) + billing type on this date --
        used to block duplicate entries instead of silently allowing the same task to
        be logged twice on the same day. Billing type is part of the identity (not
        just hours/notes) since the weekly grid itself groups rows by it, so
        splitting one task's hours into a billable row and a non-billable row on the
        same day is a legitimate, distinct pair of entries. Callers should PATCH the
        existing entry instead of creating a true duplicate."""
        conditions = [
            ProjectTimeLog.organization_id == organization_id,
            ProjectTimeLog.user_id == user_id,
            ProjectTimeLog.log_date == log_date,
            ProjectTimeLog.billing_type == billing_type,
            ProjectTimeLog.is_deleted.is_(False),
            ProjectTimeLog.project_id == project_id if project_id is not None else ProjectTimeLog.project_id.is_(None),
            ProjectTimeLog.task_id == task_id if task_id is not None else ProjectTimeLog.task_id.is_(None),
            ProjectTimeLog.category_id == category_id if category_id is not None else ProjectTimeLog.category_id.is_(None),
        ]
        if exclude_log_id is not None:
            conditions.append(ProjectTimeLog.id != exclude_log_id)
        result = await db.execute(select(ProjectTimeLog).where(*conditions).limit(1))
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, organization_id: int, user_id: int, project_id: Optional[int] = None, task_id: Optional[int] = None, category_id: Optional[int] = None, log_date: date, hours: float, notes: Optional[str] = None, billing_type: TimesheetBillingType = TimesheetBillingType.BILLABLE, is_holiday_override: bool = False) -> ProjectTimeLog:
        log = ProjectTimeLog(
            organization_id=organization_id,
            user_id=user_id,
            project_id=project_id,
            task_id=task_id,
            category_id=category_id,
            log_date=log_date,
            hours=hours,
            notes=notes,
            billing_type=billing_type,
            status=TimesheetStatus.DRAFT,
            is_holiday_override=is_holiday_override
        )
        db.add(log)
        await db.flush()
        return log

    @staticmethod
    async def update(db: AsyncSession, log: ProjectTimeLog, **kwargs) -> ProjectTimeLog:
        for key, val in kwargs.items():
            if val is not None or key in ["project_id", "task_id", "category_id", "notes"]:
                setattr(log, key, val)
        await db.flush()
        return log

    @staticmethod
    async def delete(db: AsyncSession, log: ProjectTimeLog) -> None:
        log.is_deleted = True
        log.deleted_at = datetime.utcnow()
        await db.flush()

    @staticmethod
    async def submit_week(db: AsyncSession, organization_id: int, user_id: int, start_date: date, end_date: date) -> int:
        stmt = (
            update(ProjectTimeLog)
            .where(
                ProjectTimeLog.organization_id == organization_id,
                ProjectTimeLog.user_id == user_id,
                ProjectTimeLog.log_date >= start_date,
                ProjectTimeLog.log_date <= end_date,
                ProjectTimeLog.status.in_([TimesheetStatus.DRAFT, TimesheetStatus.REJECTED]),
                ProjectTimeLog.is_deleted.is_(False)
            )
            .values(status=TimesheetStatus.SUBMITTED)
        )
        result = await db.execute(stmt)
        await db.flush()
        return result.rowcount

    @staticmethod
    async def approve_reject_week(db: AsyncSession, organization_id: int, user_id: int, start_date: date, end_date: date, status: TimesheetStatus, approved_by_id: int, rejection_note: Optional[str] = None) -> int:
        values = {
            "status": status,
            "approved_by_id": approved_by_id if status == TimesheetStatus.APPROVED else None,
            "approved_at": datetime.utcnow() if status == TimesheetStatus.APPROVED else None,
            "rejection_note": rejection_note if status == TimesheetStatus.REJECTED else None
        }
        stmt = (
            update(ProjectTimeLog)
            .where(
                ProjectTimeLog.organization_id == organization_id,
                ProjectTimeLog.user_id == user_id,
                ProjectTimeLog.log_date >= start_date,
                ProjectTimeLog.log_date <= end_date,
                ProjectTimeLog.status == TimesheetStatus.SUBMITTED,
                ProjectTimeLog.is_deleted.is_(False)
            )
            .values(**values)
        )
        result = await db.execute(stmt)
        await db.flush()
        return result.rowcount

    @staticmethod
    async def unapprove_week(
        db: AsyncSession, organization_id: int, user_id: int, start_date: date, end_date: date,
        from_statuses: Optional[list[TimesheetStatus]] = None,
    ) -> int:
        """Resets a week's entries back to DRAFT. Defaults to APPROVED-only (the original
        admin "un-approve" action); the manager-facing "revoke" action passes both
        SUBMITTED and APPROVED so a wrongly-submitted week can be pulled back too."""
        stmt = (
            update(ProjectTimeLog)
            .where(
                ProjectTimeLog.organization_id == organization_id,
                ProjectTimeLog.user_id == user_id,
                ProjectTimeLog.log_date >= start_date,
                ProjectTimeLog.log_date <= end_date,
                ProjectTimeLog.status.in_(from_statuses or [TimesheetStatus.APPROVED]),
                ProjectTimeLog.is_deleted.is_(False)
            )
            .values(status=TimesheetStatus.DRAFT, approved_by_id=None, approved_at=None)
        )
        result = await db.execute(stmt)
        await db.flush()
        return result.rowcount

    @staticmethod
    async def get_day_total_hours(db: AsyncSession, organization_id: int, user_id: int, log_date: date, exclude_log_id: Optional[int] = None) -> float:
        conditions = [
            ProjectTimeLog.organization_id == organization_id,
            ProjectTimeLog.user_id == user_id,
            ProjectTimeLog.log_date == log_date,
            ProjectTimeLog.is_deleted.is_(False)
        ]
        if exclude_log_id:
            conditions.append(ProjectTimeLog.id != exclude_log_id)
        
        stmt = select(func.sum(ProjectTimeLog.hours)).where(*conditions)
        result = await db.execute(stmt)
        return float(result.scalar() or 0.0)


class TimesheetWeekUnlockRequestRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, id: int) -> Optional[TimesheetWeekUnlockRequest]:
        result = await db.execute(
            select(TimesheetWeekUnlockRequest).where(
                TimesheetWeekUnlockRequest.id == id, TimesheetWeekUnlockRequest.is_deleted.is_(False)
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_pending_for_week(
        db: AsyncSession, organization_id: int, user_id: int, week_start_date: date
    ) -> Optional[TimesheetWeekUnlockRequest]:
        result = await db.execute(
            select(TimesheetWeekUnlockRequest).where(
                TimesheetWeekUnlockRequest.organization_id == organization_id,
                TimesheetWeekUnlockRequest.user_id == user_id,
                TimesheetWeekUnlockRequest.week_start_date == week_start_date,
                TimesheetWeekUnlockRequest.status == WeekUnlockStatus.PENDING,
                TimesheetWeekUnlockRequest.is_deleted.is_(False)
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_active_grant(
        db: AsyncSession, organization_id: int, user_id: int, week_start_date: date
    ) -> Optional[TimesheetWeekUnlockRequest]:
        """An APPROVED, not-yet-consumed request -- the one thing that lets a past
        week be edited/submitted again."""
        result = await db.execute(
            select(TimesheetWeekUnlockRequest).where(
                TimesheetWeekUnlockRequest.organization_id == organization_id,
                TimesheetWeekUnlockRequest.user_id == user_id,
                TimesheetWeekUnlockRequest.week_start_date == week_start_date,
                TimesheetWeekUnlockRequest.status == WeekUnlockStatus.APPROVED,
                TimesheetWeekUnlockRequest.consumed_at.is_(None),
                TimesheetWeekUnlockRequest.is_deleted.is_(False)
            )
        )
        return result.scalars().first()

    @staticmethod
    async def list_for_user(db: AsyncSession, organization_id: int, user_id: int) -> Sequence[TimesheetWeekUnlockRequest]:
        result = await db.execute(
            select(TimesheetWeekUnlockRequest)
            .where(
                TimesheetWeekUnlockRequest.organization_id == organization_id,
                TimesheetWeekUnlockRequest.user_id == user_id,
                TimesheetWeekUnlockRequest.is_deleted.is_(False)
            )
            .order_by(TimesheetWeekUnlockRequest.week_start_date.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def list_for_manager(
        db: AsyncSession, organization_id: int, manager_id: int
    ) -> Sequence[TimesheetWeekUnlockRequest]:
        """Only requests from this manager's own direct reports -- admin does not grant
        a blanket bypass here, matching the reporting_manager_id rule enforced everywhere
        else (approve/reject/revoke)."""
        conditions = [
            TimesheetWeekUnlockRequest.organization_id == organization_id,
            TimesheetWeekUnlockRequest.is_deleted.is_(False),
            User.reporting_manager_id == manager_id,
        ]
        stmt = (
            select(TimesheetWeekUnlockRequest)
            .options(selectinload(TimesheetWeekUnlockRequest.user))
            .join(User, User.id == TimesheetWeekUnlockRequest.user_id)
            .where(*conditions)
            .order_by(TimesheetWeekUnlockRequest.status.asc(), TimesheetWeekUnlockRequest.week_start_date.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def create(
        db: AsyncSession, *, organization_id: int, user_id: int,
        week_start_date: date, week_end_date: date, reason: Optional[str] = None,
        status: WeekUnlockStatus = WeekUnlockStatus.PENDING,
        resolved_by_id: Optional[int] = None, resolved_at: Optional[datetime] = None,
        resolution_note: Optional[str] = None,
    ) -> TimesheetWeekUnlockRequest:
        req = TimesheetWeekUnlockRequest(
            organization_id=organization_id,
            user_id=user_id,
            week_start_date=week_start_date,
            week_end_date=week_end_date,
            reason=reason,
            status=status,
            resolved_by_id=resolved_by_id,
            resolved_at=resolved_at,
            resolution_note=resolution_note,
        )
        db.add(req)
        await db.flush()
        await db.refresh(req)
        return req

    @staticmethod
    async def resolve(
        db: AsyncSession, req: TimesheetWeekUnlockRequest, *,
        status: WeekUnlockStatus, resolved_by_id: int, resolution_note: Optional[str] = None,
    ) -> TimesheetWeekUnlockRequest:
        req.status = status
        req.resolved_by_id = resolved_by_id
        req.resolved_at = datetime.utcnow()
        req.resolution_note = resolution_note
        await db.flush()
        return req

    @staticmethod
    async def consume(db: AsyncSession, req: TimesheetWeekUnlockRequest) -> None:
        req.consumed_at = datetime.utcnow()
        await db.flush()
