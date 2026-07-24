"""HR Module — Pydantic schemas (Phase 1: Foundation)"""

import enum
import uuid
from datetime import date, datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field, EmailStr, model_validator

from app.models.hr import (
    EmploymentType, WorkLocation, EmployeeStatus,
    SalaryComponentType, SalaryCalculationType, PayrollRunStatus,
    ChecklistType, ChecklistStatus
)
from app.models.user import UserRole


# ---------------------------------------------------------------------------
# Department Schemas
# ---------------------------------------------------------------------------

class DepartmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    head_user_id: Optional[int] = None
    others: Optional[dict] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    parent_id: Optional[int] = None
    head_user_id: Optional[int] = None
    is_active: Optional[bool] = None
    others: Optional[dict] = None


class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    head_user_id: Optional[int]
    is_active: bool
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime
    # Nested: head user display name (populated by service layer)
    head_user_name: Optional[str] = None
    designation_count: Optional[int] = None
    employee_count: Optional[int] = None


class DepartmentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    head_user_id: Optional[int]
    head_user_name: Optional[str] = None
    is_active: bool
    designation_count: Optional[int] = None
    employee_count: Optional[int] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Designation Schemas
# ---------------------------------------------------------------------------

class DesignationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    department_id: Optional[int] = None
    grade: Optional[str] = Field(None, max_length=30)
    description: Optional[str] = None
    others: Optional[dict] = None


class DesignationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    department_id: Optional[int] = None
    grade: Optional[str] = Field(None, max_length=30)
    description: Optional[str] = None
    is_active: Optional[bool] = None
    others: Optional[dict] = None


class DesignationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    name: str
    department_id: Optional[int]
    department_name: Optional[str] = None
    grade: Optional[str]
    description: Optional[str]
    is_active: bool
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


class DesignationListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    name: str
    department_id: Optional[int]
    department_name: Optional[str] = None
    grade: Optional[str]
    description: Optional[str] = None
    is_active: bool
    employee_count: int = 0
    created_at: datetime


# ---------------------------------------------------------------------------
# Emergency Contact (embedded schema)
# ---------------------------------------------------------------------------

class EmergencyContact(BaseModel):
    name: str
    relation: str
    phone: str


# ---------------------------------------------------------------------------
# Employee Profile Schemas
# ---------------------------------------------------------------------------

class EmployeeProfileCreate(BaseModel):
    """Create an HR profile — either linked to an existing user, or as a
    pre-invite record with just full_name+email (no login yet)."""
    user_id: Optional[int] = None
    full_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    employee_id: Optional[str] = Field(None, max_length=50)
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    work_location: WorkLocation = WorkLocation.ONSITE
    employee_status: EmployeeStatus = EmployeeStatus.ACTIVE
    date_of_joining: Optional[date] = None
    date_of_leaving: Optional[date] = None
    probation_end_date: Optional[date] = None
    pan_number: Optional[str] = Field(None, max_length=20)
    aadhaar_number: Optional[str] = Field(None, max_length=20)
    bank_account_number: Optional[str] = Field(None, max_length=40)
    bank_ifsc: Optional[str] = Field(None, max_length=20)
    bank_name: Optional[str] = Field(None, max_length=100)
    emergency_contact: Optional[EmergencyContact] = None
    others: Optional[dict] = None

    @model_validator(mode="after")
    def _require_user_or_identity(self) -> "EmployeeProfileCreate":
        if self.user_id is not None:
            return self
        if self.full_name and self.email:
            return self
        raise ValueError(
            "Provide either user_id (to link an existing team member) or both "
            "full_name and email (to create a pre-invite employee record)."
        )


class EmployeeProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    employee_id: Optional[str] = Field(None, max_length=50)
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    employment_type: Optional[EmploymentType] = None
    work_location: Optional[WorkLocation] = None
    employee_status: Optional[EmployeeStatus] = None
    date_of_joining: Optional[date] = None
    date_of_leaving: Optional[date] = None
    probation_end_date: Optional[date] = None
    pan_number: Optional[str] = Field(None, max_length=20)
    aadhaar_number: Optional[str] = Field(None, max_length=20)
    bank_account_number: Optional[str] = Field(None, max_length=40)
    bank_ifsc: Optional[str] = Field(None, max_length=20)
    bank_name: Optional[str] = Field(None, max_length=100)
    emergency_contact: Optional[EmergencyContact] = None
    others: Optional[dict] = None


class EmployeeInviteRequest(BaseModel):
    """HR picks a username + role to send a pre-invite employee their Gravit login."""
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        pattern=r"^[a-z0-9_]+$",
        description="Lowercase alphanumeric username (underscores allowed)",
    )
    role: UserRole = Field(..., description="System role to assign to the new login")


class EmployeeResponse(BaseModel):
    """Full employee record combining user + HR profile."""
    model_config = ConfigDict(from_attributes=True)

    # From HR profile
    id: int
    public_id: uuid.UUID
    employee_id: Optional[str]
    employment_type: EmploymentType
    work_location: WorkLocation
    employee_status: EmployeeStatus
    date_of_joining: Optional[date]
    date_of_leaving: Optional[date]
    probation_end_date: Optional[date]
    pan_number: Optional[str]
    aadhaar_number: Optional[str]
    bank_account_number: Optional[str]
    bank_ifsc: Optional[str]
    bank_name: Optional[str]
    emergency_contact: Optional[dict]
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime

    # From user (denormalized by service layer), or from this profile's own
    # pre-invite columns when there's no linked user yet
    user_id: Optional[int] = None
    is_invited: bool = False
    user_public_id: Optional[uuid.UUID] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    avatar: Optional[str] = None
    job_title: Optional[str] = None
    phone: Optional[str] = None

    # From department/designation (denormalized by service layer)
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    designation_id: Optional[int] = None
    designation_name: Optional[str] = None
    reporting_manager_id: Optional[int] = None
    reporting_manager_name: Optional[str] = None


class EmployeeListItem(BaseModel):
    """Compact employee row for the directory list."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    user_id: Optional[int] = None
    is_invited: bool = False
    employee_id: Optional[str]
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    employee_status: EmployeeStatus
    employment_type: EmploymentType
    work_location: WorkLocation
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    designation_id: Optional[int] = None
    designation_name: Optional[str] = None
    date_of_joining: Optional[date] = None
    is_active: Optional[bool] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Leave Types Schemas
# ---------------------------------------------------------------------------

class LeaveTypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=20)
    description: Optional[str] = None
    default_allocation: float = Field(0.0, ge=0.0)
    is_carry_forward: bool = False
    max_carry_forward: float = Field(0.0, ge=0.0)
    is_lop: bool = False
    others: Optional[dict] = None


class LeaveTypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=20)
    description: Optional[str] = None
    default_allocation: Optional[float] = Field(None, ge=0.0)
    is_carry_forward: Optional[bool] = None
    max_carry_forward: Optional[float] = Field(None, ge=0.0)
    is_lop: Optional[bool] = None
    is_active: Optional[bool] = None
    others: Optional[dict] = None


class LeaveTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    name: str
    code: str
    description: Optional[str]
    default_allocation: float
    is_carry_forward: bool
    max_carry_forward: float
    is_lop: bool
    is_active: bool
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Leave Balance Schemas
# ---------------------------------------------------------------------------

class LeaveBalanceUpdate(BaseModel):
    allocated: Optional[float] = Field(None, ge=0.0)
    used: Optional[float] = Field(None, ge=0.0)
    pending: Optional[float] = Field(None, ge=0.0)
    others: Optional[dict] = None


class LeaveBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    user_id: int
    leave_type_id: int
    leave_type_name: Optional[str] = None
    leave_type_code: Optional[str] = None
    is_lop: Optional[bool] = None
    year: int
    allocated: float
    used: float
    pending: float
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Leave Request Schemas
# ---------------------------------------------------------------------------

class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    from_date: date
    to_date: date
    is_half_day: bool = False
    half_day_session: Optional[str] = None # "forenoon" or "afternoon"
    reason: Optional[str] = None
    others: Optional[dict] = None


class LeaveRequestUpdate(BaseModel):
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    is_half_day: Optional[bool] = None
    half_day_session: Optional[str] = None
    reason: Optional[str] = None
    others: Optional[dict] = None


class LeaveApprovalRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|rejected)$")
    manager_notes: Optional[str] = None


class LeaveBulkApprovalRequest(BaseModel):
    public_ids: list[uuid.UUID] = Field(..., min_length=1)
    status: str = Field(..., pattern="^(approved|rejected)$")
    manager_notes: Optional[str] = None


class LeaveBulkApprovalResult(BaseModel):
    resolved_ids: list[uuid.UUID]
    skipped_ids: list[uuid.UUID]
    total_resolved_count: int


class LeaveRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    user_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    leave_type_id: int
    leave_type_name: Optional[str] = None
    leave_type_code: Optional[str] = None
    from_date: date
    to_date: date
    is_half_day: bool
    half_day_session: Optional[str]
    total_days: float
    status: str
    reason: Optional[str]
    approved_by_id: Optional[int]
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime]
    manager_notes: Optional[str]
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


# ===========================================================================
# Payroll Management Schemas
# ===========================================================================

# --- Salary Components ---

class SalaryComponentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=50)
    component_type: SalaryComponentType
    is_statutory: bool = False
    is_taxable: bool = True
    others: Optional[dict] = None


class SalaryComponentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    component_type: Optional[SalaryComponentType] = None
    is_statutory: Optional[bool] = None
    is_taxable: Optional[bool] = None
    others: Optional[dict] = None


class SalaryComponentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    name: str
    code: str
    component_type: SalaryComponentType
    is_statutory: bool
    is_taxable: bool
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


# --- Salary Structure Items ---

class SalaryStructureItemCreate(BaseModel):
    salary_component_id: int
    calculation_type: SalaryCalculationType = SalaryCalculationType.FLAT
    value_expr: str = Field(..., min_length=1, max_length=255)
    others: Optional[dict] = None


class SalaryStructureItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    structure_id: int
    salary_component_id: int
    calculation_type: SalaryCalculationType
    value_expr: str
    others: Optional[dict]
    created_at: datetime
    updated_at: datetime
    component: Optional[SalaryComponentResponse] = None


# --- Salary Structures ---

class SalaryStructureCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    items: list[SalaryStructureItemCreate] = []
    others: Optional[dict] = None


class SalaryStructureUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    items: Optional[list[SalaryStructureItemCreate]] = None
    others: Optional[dict] = None


class SalaryStructureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    name: str
    description: Optional[str]
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime
    items: list[SalaryStructureItemResponse] = []


# --- Employee Salary Assignment ---

class EmployeeSalaryCreate(BaseModel):
    user_id: int
    structure_id: int
    ctc: float = Field(..., ge=0.0)
    effective_from: date
    is_active: bool = True
    others: Optional[dict] = None


class EmployeeSalaryUpdate(BaseModel):
    structure_id: Optional[int] = None
    ctc: Optional[float] = Field(None, ge=0.0)
    effective_from: Optional[date] = None
    is_active: Optional[bool] = None
    others: Optional[dict] = None


class EmployeeSalaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    user_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    structure_id: int
    structure_name: Optional[str] = None
    ctc: float
    effective_from: date
    is_active: bool
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


# --- Payroll Run ---

class PayrollRunCreate(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020)
    others: Optional[dict] = None


class PayrollRunUpdate(BaseModel):
    status: PayrollRunStatus
    others: Optional[dict] = None


class PayrollRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    month: int
    year: int
    status: PayrollRunStatus
    processed_by_id: Optional[int]
    processed_by_name: Optional[str] = None
    processed_at: Optional[datetime]
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


# --- Variable Pay ---

class VariablePayEntryCreate(BaseModel):
    user_id: int
    component_code: str = Field(..., min_length=1, max_length=50)
    amount: float
    entry_type: SalaryComponentType
    reason: Optional[str] = None
    others: Optional[dict] = None


class VariablePayEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    user_id: int
    employee_name: Optional[str] = None
    payroll_run_id: int
    component_code: str
    amount: float
    entry_type: SalaryComponentType
    reason: Optional[str]
    others: Optional[dict]
    organization_id: int
    created_at: datetime


# --- Payslip ---

class PayslipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    user_id: int
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    department_name: Optional[str] = None
    designation_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None
    pan_number: Optional[str] = None
    payroll_run_id: int
    month: Optional[int] = None
    year: Optional[int] = None
    earnings_breakdown: dict[str, float]
    deductions_breakdown: dict[str, float]
    gross_earnings: float
    total_deductions: float
    net_pay: float
    lop_days: float
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


# ===========================================================================
# Checklists & Documents Schemas (Phase 4: Advanced)
# ===========================================================================

# --- Checklist Templates ---

class ChecklistTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    checklist_type: ChecklistType
    tasks: list[dict] = []
    is_active: bool = True
    others: Optional[dict] = None


class ChecklistTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    checklist_type: Optional[ChecklistType] = None
    tasks: Optional[list[dict]] = None
    is_active: Optional[bool] = None
    others: Optional[dict] = None


class ChecklistTemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    name: str
    checklist_type: ChecklistType
    tasks: list[dict]
    is_active: bool
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


# --- Checklist Instances ---

class ChecklistInstanceCreate(BaseModel):
    user_id: int
    template_id: int
    others: Optional[dict] = None


class ChecklistInstanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    user_id: int
    employee_name: Optional[str] = None
    template_id: int
    template_name: Optional[str] = None
    checklist_type: Optional[ChecklistType] = None
    status: ChecklistStatus
    task_statuses: dict
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


class ChecklistTaskToggle(BaseModel):
    completed: bool


# --- Employee Documents ---

class DocumentType(str, enum.Enum):
    PAN_CARD = "PAN Card"
    AADHAAR_CARD = "Aadhaar Card"
    NDA_SIGNOFF = "NDA Signoff"
    OFFER_LETTER = "Offer Letter"
    DEGREE_CERTIFICATE = "Degree Certificate"
    PASSPORT_VISA = "Passport/Visa"
    RESUME = "Resume"
    OTHER = "Other Identity Proof"


class EmployeeDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    user_id: int
    employee_name: Optional[str] = None
    document_type: str
    file_url: str
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    expiry_date: Optional[date] = None
    is_verified: bool
    verified_by_id: Optional[int] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[datetime] = None
    uploaded_by_id: Optional[int] = None
    uploaded_by_name: Optional[str] = None
    others: Optional[dict]
    organization_id: int
    created_at: datetime
    updated_at: datetime


class DocumentVerifyRequest(BaseModel):
    is_verified: bool


# --- Analytics Reports ---

class HeadcountReportResponse(BaseModel):
    department_distribution: dict[str, int]
    designation_distribution: dict[str, int]
    employment_type_distribution: dict[str, int]
    total_count: int
    invited_count: int = 0


class AttritionReportResponse(BaseModel):
    timeline: list[dict[str, Any]] # [{"month_year": "July 2026", "joiners": 2, "leavers": 0}]
    annual_attrition_rate: float


class LeaveSummaryReportResponse(BaseModel):
    leave_type_balances: list[dict[str, Any]] # [{"type": "Sick Leave", "allocated": 12.0, "used": 2.5, "remaining": 9.5}]
    total_approved_requests: int
    average_leave_days: float


class PayrollCostReportResponse(BaseModel):
    monthly_trend: list[dict[str, Any]] # [{"month_year": "July 2026", "gross_total": 450000.0, "net_total": 410000.0}]
    current_month_cost: float



