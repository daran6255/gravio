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


# ===========================================================================
# Payroll Management Models
# ===========================================================================

class SalaryComponentType(str, enum.Enum):
    EARNING = "earning"
    DEDUCTION = "deduction"


class SalaryCalculationType(str, enum.Enum):
    FLAT = "flat"
    FORMULA = "formula"


class PayrollRunStatus(str, enum.Enum):
    DRAFT = "draft"
    PROCESSING = "processing"
    FINALIZED = "finalized"


class HRSalaryComponent(BaseModel, TenantAwareMixin):
    """Salary component configuration, e.g. Basic, HRA, PF, etc."""
    __tablename__ = "hr_salary_components"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    component_type: Mapped[SalaryComponentType] = mapped_column(
        Enum(SalaryComponentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    is_statutory: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_taxable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<HRSalaryComponent(id={self.id}, code={self.code!r}, type={self.component_type.value})>"


class HRSalaryStructure(BaseModel, TenantAwareMixin):
    """Salary structure templates defining how earnings/deductions are calculated."""
    __tablename__ = "hr_salary_structures"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    items: Mapped[list["HRSalaryStructureItem"]] = relationship(
        "HRSalaryStructureItem", back_populates="structure", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<HRSalaryStructure(id={self.id}, name={self.name!r})>"


class HRSalaryStructureItem(BaseModel):
    """Link table between structures and components, with calculation rules."""
    __tablename__ = "hr_salary_structure_items"

    structure_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hr_salary_structures.id", ondelete="CASCADE"), nullable=False, index=True
    )
    salary_component_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hr_salary_components.id", ondelete="CASCADE"), nullable=False, index=True
    )
    calculation_type: Mapped[SalaryCalculationType] = mapped_column(
        Enum(SalaryCalculationType, values_callable=lambda x: [e.value for e in x]),
        default=SalaryCalculationType.FLAT, nullable=False,
    )
    value_expr: Mapped[str] = mapped_column(String(255), nullable=False)  # flat amount (e.g. "1800") or expression ("0.5 * CTC")
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    structure: Mapped["HRSalaryStructure"] = relationship("HRSalaryStructure", back_populates="items")
    component: Mapped["HRSalaryComponent"] = relationship("HRSalaryComponent")

    def __repr__(self) -> str:
        return f"<HRSalaryStructureItem(structure_id={self.structure_id}, component_id={self.salary_component_id})>"


class HREmployeeSalary(BaseModel, TenantAwareMixin):
    """Maps employee user to a salary structure and sets annual CTC."""
    __tablename__ = "hr_employee_salaries"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    structure_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hr_salary_structures.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    ctc: Mapped[float] = mapped_column(nullable=False)  # Annual CTC
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    structure: Mapped["HRSalaryStructure"] = relationship("HRSalaryStructure")

    def __repr__(self) -> str:
        return f"<HREmployeeSalary(id={self.id}, user_id={self.user_id}, ctc={self.ctc})>"


class HRPayrollRun(BaseModel, TenantAwareMixin):
    """Monthly payroll processing cycles."""
    __tablename__ = "hr_payroll_runs"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    month: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    status: Mapped[PayrollRunStatus] = mapped_column(
        Enum(PayrollRunStatus, values_callable=lambda x: [e.value for e in x]),
        default=PayrollRunStatus.DRAFT, nullable=False, index=True
    )
    processed_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    processed_by: Mapped[Optional["User"]] = relationship("User")
    payslips: Mapped[list["HRPayslip"]] = relationship("HRPayslip", back_populates="payroll_run", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<HRPayrollRun(id={self.id}, month={self.month}, year={self.year}, status={self.status.value})>"


class HRVariablePayEntry(BaseModel, TenantAwareMixin):
    """Custom overrides (incentives, bonuses, TDS manual overrides) per run, per employee."""
    __tablename__ = "hr_variable_pay_entries"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    payroll_run_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hr_payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    component_code: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "BONUS", "INCENTIVE", "TDS_OVERRIDE"
    amount: Mapped[float] = mapped_column(nullable=False)
    entry_type: Mapped[SalaryComponentType] = mapped_column(
        Enum(SalaryComponentType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    payroll_run: Mapped["HRPayrollRun"] = relationship("HRPayrollRun")

    def __repr__(self) -> str:
        return f"<HRVariablePayEntry(id={self.id}, user_id={self.user_id}, amount={self.amount})>"


class HRPayslip(BaseModel, TenantAwareMixin):
    """Processed payslip records for an employee."""
    __tablename__ = "hr_payslips"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    payroll_run_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hr_payroll_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    # Store dynamic details as JSON
    earnings_breakdown: Mapped[dict] = mapped_column(JSON, nullable=False)
    deductions_breakdown: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    gross_earnings: Mapped[float] = mapped_column(nullable=False)
    total_deductions: Mapped[float] = mapped_column(nullable=False)
    net_pay: Mapped[float] = mapped_column(nullable=False)
    lop_days: Mapped[float] = mapped_column(default=0.0, nullable=False)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    payroll_run: Mapped["HRPayrollRun"] = relationship("HRPayrollRun", back_populates="payslips")

    def __repr__(self) -> str:
        return f"<HRPayslip(id={self.id}, user_id={self.user_id}, net_pay={self.net_pay})>"


# ===========================================================================
# Checklists & Documents Models (Phase 4: Advanced)
# ===========================================================================

class ChecklistType(str, enum.Enum):
    ONBOARDING = "onboarding"
    OFFBOARDING = "offboarding"


class ChecklistStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class HRChecklistTemplate(BaseModel, TenantAwareMixin):
    """Lifecycle checklist template definitions for onboarding/offboarding."""
    __tablename__ = "hr_checklist_templates"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    checklist_type: Mapped[ChecklistType] = mapped_column(
        Enum(ChecklistType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True
    )
    tasks: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    def __repr__(self) -> str:
        return f"<HRChecklistTemplate(id={self.id}, name={self.name!r}, type={self.checklist_type})>"


class HRChecklistInstance(BaseModel, TenantAwareMixin):
    """Lifecycle checklist execution tracker instances for specific employees."""
    __tablename__ = "hr_checklist_instances"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    template_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("hr_checklist_templates.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[ChecklistStatus] = mapped_column(
        Enum(ChecklistStatus, values_callable=lambda x: [e.value for e in x]),
        default=ChecklistStatus.PENDING,
        nullable=False,
        index=True
    )
    task_statuses: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    template: Mapped["HRChecklistTemplate"] = relationship("HRChecklistTemplate")

    def __repr__(self) -> str:
        return f"<HRChecklistInstance(id={self.id}, user_id={self.user_id}, status={self.status})>"


class HREmployeeDocument(BaseModel, TenantAwareMixin):
    """Secure document attachments for employee verification."""
    __tablename__ = "hr_employee_documents"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_url: Mapped[str] = mapped_column(String(255), nullable=False)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    others: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    verified_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by_id])

    def __repr__(self) -> str:
        return f"<HREmployeeDocument(id={self.id}, user_id={self.user_id}, type={self.document_type!r})>"



