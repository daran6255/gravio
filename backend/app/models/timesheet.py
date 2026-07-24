import enum
import uuid
from datetime import datetime, date
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey, Uuid, JSON, DateTime, Date, Numeric, Boolean, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel, TenantAwareMixin

if TYPE_CHECKING:
    from app.models.project import Project, ProjectTask
    from app.models.user import User

class TimesheetBillingType(str, enum.Enum):
    BILLABLE = "billable"
    NON_BILLABLE = "non_billable"

class TimesheetStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"

class HolidayType(str, enum.Enum):
    PUBLIC = "public"
    ORG = "org"
    CUSTOM = "custom"

class WeekUnlockStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"

class UserTimesheetCategory(BaseModel, TenantAwareMixin):
    """Personal or org-wide category for logging non-project time (e.g. Meeting, Support)"""
    __tablename__ = "user_timesheet_categories"

    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_org_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[user_id])
    time_logs: Mapped[list["ProjectTimeLog"]] = relationship("ProjectTimeLog", back_populates="category")

class OrgHoliday(BaseModel, TenantAwareMixin):
    """Calendar holiday configured for the organization to block or validate logging"""
    __tablename__ = "org_holidays"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    holiday_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    type: Mapped[HolidayType] = mapped_column(
        Enum(HolidayType, values_callable=lambda x: [e.value for e in x]),
        default=HolidayType.PUBLIC,
        nullable=False
    )
    country_code: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)

class TimesheetUserSettings(BaseModel, TenantAwareMixin):
    """User-specific timesheet configuration overrides (e.g., manager granted holiday overrides)"""
    __tablename__ = "timesheet_user_settings"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    can_log_on_holidays: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    max_retroactive_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Null means "use the default" (40h) -- see TimesheetService.DEFAULT_WEEKLY_HOURS_TARGET.
    # Kept per-user (not org-wide) since part-time/contract staff commonly need a different one.
    weekly_hours_target: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

class ProjectTimeLog(BaseModel, TenantAwareMixin):
    """A single daily time entry logged by a user against a project/task or general category"""
    __tablename__ = "project_time_logs"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    project_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    task_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("project_tasks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("user_timesheet_categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    hours: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    billing_type: Mapped[TimesheetBillingType] = mapped_column(
        Enum(TimesheetBillingType, values_callable=lambda x: [e.value for e in x]),
        default=TimesheetBillingType.BILLABLE,
        nullable=False
    )
    status: Mapped[TimesheetStatus] = mapped_column(
        Enum(TimesheetStatus, values_callable=lambda x: [e.value for e in x]),
        default=TimesheetStatus.DRAFT,
        nullable=False,
        index=True
    )
    rejection_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_holiday_override: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    project: Mapped[Optional["Project"]] = relationship("Project")
    task: Mapped[Optional["ProjectTask"]] = relationship("ProjectTask")
    category: Mapped[Optional[UserTimesheetCategory]] = relationship("UserTimesheetCategory", back_populates="time_logs")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    approved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by_id])


class TimesheetWeekUnlockRequest(BaseModel, TenantAwareMixin):
    """An employee's request to re-open a past (already-ended) week for editing and
    submission. Weeks lock automatically once they end without being submitted --
    the direct reporting manager (or an admin) must explicitly grant one of these
    before the employee can add/edit/submit entries in that week again.

    A row with status=APPROVED and consumed_at=NULL is an "active grant" -- it's
    consumed (one-shot) the next time the employee successfully submits that week.
    Revoking a wrongly-submitted/approved week (see ProjectTimeLogRepository.revoke_week)
    auto-creates an already-APPROVED grant here so the fix-and-resubmit loop isn't
    itself blocked by the same lock.
    """
    __tablename__ = "timesheet_week_unlock_requests"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    week_start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    week_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[WeekUnlockStatus] = mapped_column(
        Enum(WeekUnlockStatus, values_callable=lambda x: [e.value for e in x]),
        default=WeekUnlockStatus.PENDING,
        nullable=False,
        index=True
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    consumed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    resolved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[resolved_by_id])
