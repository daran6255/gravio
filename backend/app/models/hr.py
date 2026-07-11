"""HR Module — SQLAlchemy ORM models (Phase 1: Foundation)

Tables:
  hr_departments       — org departments with optional parent hierarchy
  hr_designations      — job designations/titles within a department
  hr_employee_profiles — extended employee profile linked to users.id
"""

from __future__ import annotations

from datetime import date, datetime
import enum
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String, Integer, ForeignKey, Uuid, JSON, Date, DateTime, Enum, Text, Boolean
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TenantAwareMixin

if TYPE_CHECKING:
    from app.models.user import User


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class EmploymentType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERN = "intern"
    CONSULTANT = "consultant"


class WorkLocation(str, enum.Enum):
    ONSITE = "onsite"
    REMOTE = "remote"
    HYBRID = "hybrid"


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_NOTICE = "on_notice"
    PROBATION = "probation"
    RESIGNED = "resigned"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"


# ---------------------------------------------------------------------------
# Department
# ---------------------------------------------------------------------------

class HRDepartment(BaseModel, TenantAwareMixin):
    """Organizational department (supports hierarchy via parent_id)"""
    __tablename__ = "hr_departments"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Self-referencing hierarchy: e.g. "Engineering" → "Frontend Team"
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("hr_departments.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Head of Department — links to users.id
    head_user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Extensible metadata
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    parent: Mapped[Optional["HRDepartment"]] = relationship(
        "HRDepartment", remote_side="HRDepartment.id", back_populates="children"
    )
    children: Mapped[list["HRDepartment"]] = relationship(
        "HRDepartment", back_populates="parent", cascade="all, delete-orphan"
    )
    head: Mapped[Optional["User"]] = relationship("User", foreign_keys=[head_user_id])
    designations: Mapped[list["HRDesignation"]] = relationship(
        "HRDesignation", back_populates="department", cascade="all, delete-orphan"
    )
    employee_profiles: Mapped[list["HREmployeeProfile"]] = relationship(
        "HREmployeeProfile", back_populates="department"
    )

    def __repr__(self) -> str:
        return f"<HRDepartment(id={self.id}, name={self.name!r})>"


# ---------------------------------------------------------------------------
# Designation
# ---------------------------------------------------------------------------

class HRDesignation(BaseModel, TenantAwareMixin):
    """Job designation/title within a department (e.g. Senior Developer)"""
    __tablename__ = "hr_designations"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    department_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("hr_departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Grade/level for ordering (e.g. L1, L2, L3)
    grade: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Extensible metadata
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    department: Mapped[Optional["HRDepartment"]] = relationship(
        "HRDepartment", back_populates="designations"
    )
    employee_profiles: Mapped[list["HREmployeeProfile"]] = relationship(
        "HREmployeeProfile", back_populates="designation"
    )

    def __repr__(self) -> str:
        return f"<HRDesignation(id={self.id}, name={self.name!r})>"


# ---------------------------------------------------------------------------
# Employee Profile
# ---------------------------------------------------------------------------

class HREmployeeProfile(BaseModel, TenantAwareMixin):
    """Extended HR profile for a user — holds all employment-specific metadata.
    
    Always linked 1-to-1 with a `users` record via user_id.
    The `user` record holds login credentials, name, email, and role;
    this model holds all HR-lifecycle data.
    """
    __tablename__ = "hr_employee_profiles"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )

    # Link to the user account
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    # HR-assigned employee code (auto-generated or manually set)
    employee_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    # Org structure
    department_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("hr_departments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    designation_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("hr_designations.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Employment details
    employment_type: Mapped[EmploymentType] = mapped_column(
        Enum(EmploymentType, values_callable=lambda x: [e.value for e in x]),
        default=EmploymentType.FULL_TIME, nullable=False
    )
    work_location: Mapped[WorkLocation] = mapped_column(
        Enum(WorkLocation, values_callable=lambda x: [e.value for e in x]),
        default=WorkLocation.ONSITE, nullable=False
    )
    employee_status: Mapped[EmployeeStatus] = mapped_column(
        Enum(EmployeeStatus, values_callable=lambda x: [e.value for e in x]),
        default=EmployeeStatus.ACTIVE, nullable=False, index=True
    )

    # Key dates
    date_of_joining: Mapped[Optional[str]] = mapped_column(Date, nullable=True)
    date_of_leaving: Mapped[Optional[str]] = mapped_column(Date, nullable=True)
    probation_end_date: Mapped[Optional[str]] = mapped_column(Date, nullable=True)

    # Payroll identifiers (Indian statutory)
    pan_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    aadhaar_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_account_number: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    bank_ifsc: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Emergency contact (stored as JSON: {name, relation, phone})
    emergency_contact: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Extensible metadata
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    department: Mapped[Optional["HRDepartment"]] = relationship(
        "HRDepartment", back_populates="employee_profiles"
    )
    designation: Mapped[Optional["HRDesignation"]] = relationship(
        "HRDesignation", back_populates="employee_profiles"
    )

    def __repr__(self) -> str:
        return f"<HREmployeeProfile(id={self.id}, user_id={self.user_id}, employee_id={self.employee_id!r})>"


# ---------------------------------------------------------------------------
# Leave Management
# ---------------------------------------------------------------------------

class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class HRLeaveType(BaseModel, TenantAwareMixin):
    """Leave type configuration per organization (e.g. Sick Leave, Casual Leave)"""
    __tablename__ = "hr_leave_types"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False, index=True) # e.g. SL, CL, EL
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Default yearly allocation (days)
    default_allocation: Mapped[float] = mapped_column(default=0.0, nullable=False)
    
    # Policies
    is_carry_forward: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    max_carry_forward: Mapped[float] = mapped_column(default=0.0, nullable=False)
    is_lop: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False) # Loss of Pay flag
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    balances: Mapped[list["HRLeaveBalance"]] = relationship(
        "HRLeaveBalance", back_populates="leave_type", cascade="all, delete-orphan"
    )
    requests: Mapped[list["HRLeaveRequest"]] = relationship(
        "HRLeaveRequest", back_populates="leave_type", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<HRLeaveType(id={self.id}, code={self.code!r}, name={self.name!r})>"


class HRLeaveBalance(BaseModel, TenantAwareMixin):
    """Yearly leave balance tracker per employee, per leave type"""
    __tablename__ = "hr_leave_balances"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hr_leave_types.id", ondelete="CASCADE"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True) # e.g. 2026

    # Days tracking
    allocated: Mapped[float] = mapped_column(default=0.0, nullable=False)
    used: Mapped[float] = mapped_column(default=0.0, nullable=False)
    pending: Mapped[float] = mapped_column(default=0.0, nullable=False) # Applied but pending approval

    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    leave_type: Mapped["HRLeaveType"] = relationship("HRLeaveType", back_populates="balances")

    def __repr__(self) -> str:
        return f"<HRLeaveBalance(id={self.id}, user_id={self.user_id}, leave_type_id={self.leave_type_id}, year={self.year})>"


class HRLeaveRequest(BaseModel, TenantAwareMixin):
    """Leave requests submitted by employees"""
    __tablename__ = "hr_leave_requests"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    leave_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hr_leave_types.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    # Dates
    from_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    to_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    
    # Custom options
    is_half_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    half_day_session: Mapped[Optional[str]] = mapped_column(String(10), nullable=True) # "forenoon" or "afternoon"
    
    # Total computed days
    total_days: Mapped[float] = mapped_column(nullable=False)
    
    status: Mapped[LeaveStatus] = mapped_column(
        Enum(LeaveStatus, values_callable=lambda x: [e.value for e in x]),
        default=LeaveStatus.PENDING, nullable=False, index=True
    )
    
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Approver details
    approved_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    manager_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    leave_type: Mapped["HRLeaveType"] = relationship("HRLeaveType", back_populates="requests")
    approved_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by_id])

    def __repr__(self) -> str:
        return f"<HRLeaveRequest(id={self.id}, user_id={self.user_id}, status={self.status.value})>"

