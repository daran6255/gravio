"""HR Module — SQLAlchemy ORM models (Phase 1: Foundation)

Tables:
  hr_departments       — org departments with optional parent hierarchy
  hr_designations      — job designations/titles within a department
  hr_employee_profiles — extended employee profile linked to users.id
"""

from __future__ import annotations

import enum
import uuid
from typing import Optional, TYPE_CHECKING
from sqlalchemy import (
    String, Integer, ForeignKey, Uuid, JSON, Date, Enum, Text, Boolean
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
