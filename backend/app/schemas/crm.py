"""Pydantic validation schemas for Gravit CRM module"""

import uuid
from datetime import datetime, date
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.crm import (
    CompanySize,
    CompanyStatus,
    LeadSource,
    LeadStatus,
    LeadPriority,
    DealStatus,
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


# --- Lead Schemas ---
class CRMLeadBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    source: Optional[LeadSource] = None
    status: LeadStatus = LeadStatus.NEW
    priority: LeadPriority = LeadPriority.MEDIUM
    estimated_value: Optional[float] = Field(None, ge=0)
    currency: str = Field("USD", max_length=10)
    description: Optional[str] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMLeadCreate(CRMLeadBase):
    owner_id: Optional[int] = None


class CRMLeadUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_id: Optional[int] = None
    company_id: Optional[int] = None
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    owner_id: Optional[int] = None
    estimated_value: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    description: Optional[str] = None
    custom_fields: Optional[dict[str, Any]] = None


class CRMLeadResponse(CRMLeadBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    owner_id: Optional[int] = None
    converted_at: Optional[datetime] = None
    deal_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


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


# --- Cross-Entity Search Schema ---
class CRMSearchResponse(BaseModel):
    companies: list[CRMCompanyResponse]
    contacts: list[CRMContactResponse]
    leads: list[CRMLeadResponse]
    deals: list[CRMDealResponse]
