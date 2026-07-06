import uuid
from datetime import date, datetime
from typing import Optional, Sequence
from sqlalchemy import select, and_, or_, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.timesheet import ProjectTimeLog, OrgHoliday, UserTimesheetCategory, TimesheetUserSettings, TimesheetStatus, TimesheetBillingType, HolidayType

class TimesheetCategoryRepository:
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
    async def unapprove_week(db: AsyncSession, organization_id: int, user_id: int, start_date: date, end_date: date) -> int:
        stmt = (
            update(ProjectTimeLog)
            .where(
                ProjectTimeLog.organization_id == organization_id,
                ProjectTimeLog.user_id == user_id,
                ProjectTimeLog.log_date >= start_date,
                ProjectTimeLog.log_date <= end_date,
                ProjectTimeLog.status == TimesheetStatus.APPROVED,
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
