"""HR Module — Pydantic schemas (Phase 1: Foundation)"""

import uuid
from datetime import date, datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

from app.models.hr import EmploymentType, WorkLocation, EmployeeStatus


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
    is_active: bool
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
    """Create an HR profile for an existing user."""
    user_id: int
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


class EmployeeProfileUpdate(BaseModel):
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

    # From user (denormalized by service layer)
    user_id: int
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
    user_id: int
    employee_id: Optional[str]
    full_name: Optional[str] = None
    email: Optional[str] = None
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
