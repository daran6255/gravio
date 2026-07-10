import uuid
from datetime import datetime, date
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.timesheet import TimesheetBillingType, TimesheetStatus, HolidayType, WeekUnlockStatus
from app.schemas.project import ProjectResponse, ProjectTaskResponse

# --- Category Schemas ---
class TimesheetCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = Field(None, max_length=20)

class TimesheetCategoryCreate(TimesheetCategoryBase):
    pass

class TimesheetCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, max_length=20)

class TimesheetCategoryResponse(TimesheetCategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    is_org_default: bool
    created_at: datetime
    updated_at: datetime


# --- Holiday Schemas ---
class OrgHolidayBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    holiday_date: date
    type: HolidayType = HolidayType.PUBLIC
    country_code: Optional[str] = Field(None, max_length=5)

class OrgHolidayCreate(OrgHolidayBase):
    pass

class OrgHolidayUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    holiday_date: Optional[date] = None
    type: Optional[HolidayType] = None
    country_code: Optional[str] = Field(None, max_length=5)

class OrgHolidayResponse(OrgHolidayBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# --- User Settings Schemas ---
class TimesheetUserSettingsBase(BaseModel):
    can_log_on_holidays: bool = False
    max_retroactive_days: Optional[int] = None

class TimesheetUserSettingsUpdate(BaseModel):
    can_log_on_holidays: Optional[bool] = None
    max_retroactive_days: Optional[int] = None

class TimesheetUserSettingsResponse(TimesheetUserSettingsBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime


# --- Time Log Schemas ---
class ProjectTimeLogBase(BaseModel):
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    category_id: Optional[int] = None
    log_date: date
    hours: float = Field(..., gt=0, le=24.0)
    notes: Optional[str] = None
    billing_type: TimesheetBillingType = TimesheetBillingType.BILLABLE

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: float) -> float:
        # Validate that hours is a multiple of 0.25 (15 mins) or standard decimal
        if v <= 0 or v > 24:
            raise ValueError("hours must be between 0.1 and 24.0")
        return round(v, 2)

class ProjectTimeLogCreate(ProjectTimeLogBase):
    pass

class ProjectTimeLogUpdate(BaseModel):
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    category_id: Optional[int] = None
    log_date: Optional[date] = None
    hours: Optional[float] = Field(None, gt=0, le=24.0)
    notes: Optional[str] = None
    billing_type: Optional[TimesheetBillingType] = None

class TimesheetUserEmbedded(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: Optional[str] = None
    email: str
    role: str
    reporting_manager_id: Optional[int] = None


class ProjectTimeLogResponse(ProjectTimeLogBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    user_id: int
    status: TimesheetStatus
    rejection_note: Optional[str] = None
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    is_holiday_override: bool
    created_at: datetime
    updated_at: datetime
    
    # Embedded helper entities if queried
    project: Optional[ProjectResponse] = None
    task: Optional[ProjectTaskResponse] = None
    category: Optional[TimesheetCategoryResponse] = None
    user: Optional[TimesheetUserEmbedded] = None


# --- Week Unlock Request Schemas ---
class TimesheetWeekUnlockRequestCreate(BaseModel):
    week_start_date: date  # Monday of the locked week
    week_end_date: date    # Sunday of the locked week
    reason: Optional[str] = Field(None, max_length=1000)

class TimesheetWeekUnlockResolve(BaseModel):
    resolution_note: Optional[str] = Field(None, max_length=1000)

class TimesheetWeekUnlockRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    user_id: int
    week_start_date: date
    week_end_date: date
    status: WeekUnlockStatus
    reason: Optional[str] = None
    resolved_by_id: Optional[int] = None
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    consumed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    user: Optional[TimesheetUserEmbedded] = None


# --- Bulk Actions & Reports ---
class TimesheetSubmitWeekRequest(BaseModel):
    start_date: date  # Monday of the week
    end_date: date    # Sunday of the week

class TimesheetApproveRejectRequest(BaseModel):
    rejection_note: Optional[str] = None

class TimesheetReportFilter(BaseModel):
    start_date: date
    end_date: date
    project_id: Optional[int] = None
    user_id: Optional[int] = None
    billing_type: Optional[TimesheetBillingType] = None

class TimesheetReportRow(BaseModel):
    user_id: int
    user_name: str
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    task_id: Optional[int] = None
    task_title: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    billing_type: TimesheetBillingType
    total_hours: float
