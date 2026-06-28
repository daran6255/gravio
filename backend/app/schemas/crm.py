"""Pydantic validation schemas for Gravit CRM module"""

import uuid
from datetime import datetime, date
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from sqlalchemy import inspect as sa_inspect

from app.core.currencies import is_valid_currency
from app.models.crm import (
    CompanySize,
    CompanyStatus,
    LeadSource,
    LeadStatus,
    LeadPriority,
    DealStatus,
    DealTaskStatus,
    DealTaskType,
    ActivityType,
)


# --- Tag Schemas ---
class CRMTagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field("#808080", max_length=20)


class CRMTagCreate(CRMTagBase):
    pass


class CRMTagResponse(CRMTagBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# --- Pipeline & Stage Schemas ---
class CRMPipelineStageBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    order: int = Field(0, ge=0)
    probability: int = Field(10, ge=0, le=100)
    color: str = Field("#808080", max_length=20)
    is_won_stage: bool = False
    is_lost_stage: bool = False
    custom_fields: Optional[dict[str, Any]] = None


class CRMPipelineStageCreate(CRMPipelineStageBase):
    pass


class CRMPipelineStageResponse(CRMPipelineStageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    pipeline_id: int


class CRMPipelineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    is_default: bool = False
    custom_fields: Optional[dict[str, Any]] = None


class CRMPipelineCreate(CRMPipelineBase):
    stages: list[CRMPipelineStageCreate] = []


class CRMPipelineResponse(CRMPipelineBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    stages: list[CRMPipelineStageResponse] = []


class CRMPipelineStageUpsert(CRMPipelineStageBase):
    """A stage in a bulk stage-update request. Omit `id` to create a new stage;
    any existing stage whose id is not present in the request is deleted."""
    id: Optional[int] = None


class CRMPipelineStagesUpdateRequest(BaseModel):
    stages: list[CRMPipelineStageUpsert]


# --- Company Schemas ---
class CRMCompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    address: Optional[dict[str, Any]] = None  # e.g., {street, city, state, country, zip}
    size: Optional[CompanySize] = None
    status: CompanyStatus = CompanyStatus.PROSPECT
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMCompanyCreate(CRMCompanyBase):
    owner_id: Optional[int] = None


class CRMCompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    address: Optional[dict[str, Any]] = None
    size: Optional[CompanySize] = None
    status: Optional[CompanyStatus] = None
    owner_id: Optional[int] = None
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMCompanyResponse(CRMCompanyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# --- Contact Schemas ---
class CRMContactBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    mobile: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    company_id: Optional[int] = None
    is_primary: bool = False
    tags: Optional[list[str]] = None
    social_links: Optional[dict[str, Any]] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMContactCreate(CRMContactBase):
    owner_id: Optional[int] = None


class CRMContactUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    mobile: Optional[str] = Field(None, max_length=50)
    job_title: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    company_id: Optional[int] = None
    owner_id: Optional[int] = None
    is_primary: Optional[bool] = None
    tags: Optional[list[str]] = None
    social_links: Optional[dict[str, Any]] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMContactResponse(CRMContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class _LeadCurrencyValidatorMixin(BaseModel):
    """Validates currency on write paths only (Create/Update) - NOT on Response, since
    relaxing/expanding the ISO list later shouldn't break serialization of older rows."""
    currency: Optional[str] = Field(None, max_length=10)

    @field_validator("currency")
    @classmethod
    def _validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not is_valid_currency(v):
            raise ValueError("currency code is not a recognized ISO 4217 code")
        return v.upper()


# --- Lead Schemas ---
class CRMLeadBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    source: Optional[LeadSource] = None
    status: LeadStatus = LeadStatus.NEW
    priority: LeadPriority = LeadPriority.MEDIUM
    estimated_value: Optional[float] = Field(None, ge=0)
    # None means "use the organization's default currency, falling back to USD" - resolved in the service layer.
    currency: Optional[str] = Field(None, max_length=10)
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMLeadCreate(CRMLeadBase, _LeadCurrencyValidatorMixin):
    owner_id: Optional[int] = None


class CRMLeadUpdate(_LeadCurrencyValidatorMixin):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    owner_id: Optional[int] = None
    estimated_value: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, Any]] = None
    version: Optional[int] = Field(None, description="Client's last-seen version, for optimistic locking")


class CRMLeadResponse(CRMLeadBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    owner_id: Optional[int] = None
    converted_at: Optional[datetime] = None
    deal_id: Optional[int] = None
    version: int = 1
    last_activity_at: Optional[datetime] = None
    is_anonymized: bool = False
    created_at: datetime
    updated_at: datetime


class CRMLeadCreateResponse(CRMLeadResponse):
    """Response for POST /leads - adds a non-blocking duplicate warning, if any."""
    duplicate_warning: Optional[str] = None


class CRMLeadConvertRequest(BaseModel):
    pipeline_id: int
    stage_id: int
    deal_title: Optional[str] = None  # defaults to Lead title if not provided
    value: Optional[float] = None     # defaults to Lead estimated_value if not provided
    close_date: Optional[date] = None


# --- Deal Schemas ---
class CRMDealBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    pipeline_id: int
    stage_id: int
    value: Optional[float] = Field(None, ge=0)
    currency: str = Field("USD", max_length=10)
    close_date: Optional[date] = None
    probability: int = Field(10, ge=0, le=100)
    status: DealStatus = DealStatus.OPEN
    lost_reason: Optional[str] = None
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMDealCreate(CRMDealBase):
    owner_id: Optional[int] = None
    lead_id: Optional[int] = None


class CRMDealUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    pipeline_id: Optional[int] = None
    stage_id: Optional[int] = None
    owner_id: Optional[int] = None
    value: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    close_date: Optional[date] = None
    probability: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[DealStatus] = None
    lost_reason: Optional[str] = None
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMDealResponse(CRMDealBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    owner_id: Optional[int] = None
    lead_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    completed_task_count: int = 0
    in_progress_task_count: int = 0

    @model_validator(mode="before")
    @classmethod
    def _attach_task_counts(cls, data: Any) -> Any:
        # Only computed when `.tasks` was eagerly loaded (e.g. selectinload in list_all);
        # touching the relationship otherwise would trigger a lazy load and crash async sessions.
        if isinstance(data, dict) or "tasks" in sa_inspect(data).unloaded:
            return data
        tasks = data.tasks
        data.task_count = len(tasks)
        data.completed_task_count = sum(1 for t in tasks if t.status == DealTaskStatus.COMPLETED)
        data.in_progress_task_count = sum(1 for t in tasks if t.status == DealTaskStatus.IN_PROGRESS)
        return data


# --- Deal Task Schemas ---
class CRMDealTaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    task_type: DealTaskType = DealTaskType.OTHER
    due_date: Optional[date] = None
    notes: Optional[str] = None
    assignee_id: Optional[int] = None
    order: int = 0


class CRMDealTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    task_type: Optional[DealTaskType] = None
    status: Optional[DealTaskStatus] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    assignee_id: Optional[int] = None
    order: Optional[int] = None


class CRMDealTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    deal_id: int
    title: str
    task_type: DealTaskType
    status: DealTaskStatus
    due_date: Optional[date] = None
    notes: Optional[str] = None
    assignee_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    order: int
    created_at: datetime
    updated_at: datetime


# --- Activity Schemas ---
class CRMActivityBase(BaseModel):
    type: ActivityType
    subject: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    entity_type: str = Field(..., description="Target type: lead | deal | company | contact")
    entity_id: int
    due_date: Optional[datetime] = None
    is_completed: bool = False
    outcome: Optional[str] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMActivityCreate(CRMActivityBase):
    owner_id: Optional[int] = None


class CRMActivityUpdate(BaseModel):
    type: Optional[ActivityType] = None
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    is_completed: Optional[bool] = None
    outcome: Optional[str] = None
    owner_id: Optional[int] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMActivityResponse(CRMActivityBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    owner_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# --- Dashboard Stats Schemas ---
class StageStats(BaseModel):
    stage_id: int
    stage_name: str
    count: int
    total_value: float


class SourceStats(BaseModel):
    source: str
    count: int


class CRMStatsResponse(BaseModel):
    total_active_leads: int
    total_deal_value: float
    deal_value_by_stage: list[StageStats]
    leads_by_source: list[SourceStats]
    overdue_tasks_count: int
    conversion_rate: float
    my_tasks: list[CRMActivityResponse]


class CRMLeadStatsResponse(BaseModel):
    total_leads: int
    new_count: int
    contacted_count: int
    qualified_count: int
    unqualified_count: int
    converted_count: int
    conversion_rate: float


# --- Owner Option Schema (for owner-reassignment pickers) ---
class CRMOwnerOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: Optional[str] = None
    email: str


# --- Bulk Update Schemas ---
class CRMBulkLeadUpdateRequest(BaseModel):
    public_ids: list[uuid.UUID] = Field(..., min_length=1)
    owner_id: Optional[int] = None
    status: Optional[LeadStatus] = None


class CRMBulkLeadDeleteRequest(BaseModel):
    public_ids: list[uuid.UUID] = Field(..., min_length=1)


# --- CSV Import Schemas ---
class CRMLeadImportRowResult(BaseModel):
    row_number: int
    success: bool
    lead_public_id: Optional[str] = None
    error: Optional[str] = None
    duplicate_warning: Optional[str] = None


class CRMLeadImportResponse(BaseModel):
    total_rows: int
    success_count: int
    failure_count: int
    results: list[CRMLeadImportRowResult]


# --- Audit Log Schema ---
class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action: str
    field_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by_user_id: Optional[int] = None
    changed_at: datetime


# --- Cross-Entity Search Schema ---
class CRMSearchResponse(BaseModel):
    companies: list[CRMCompanyResponse]
    contacts: list[CRMContactResponse]
    leads: list[CRMLeadResponse]
    deals: list[CRMDealResponse]


# --- File/Attachment Schemas ---
class CRMFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    file_name: str
    file_size: int
    mime_type: str
    entity_type: str
    entity_id: int
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
