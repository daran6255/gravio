"""Company Schemas"""

from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.company import CompanySize, CompanyStatus
from app.schemas.contact import ContactRead
from app.schemas.lead import LeadRead
from app.schemas.deal import DealRead
from app.schemas.crm_task import CRMTaskRead
from app.schemas.crm_activity_log import CRMActivityLogRead


class CompanyBase(BaseModel):
    name: str = Field(..., max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[CompanySize] = None
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    status: CompanyStatus = CompanyStatus.PROSPECT
    address: Optional[Dict[str, Any]] = None
    social_media: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    company_size: Optional[CompanySize] = None
    website: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    status: Optional[CompanyStatus] = None
    address: Optional[Dict[str, Any]] = None
    social_media: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class CompanyRead(CompanyBase):
    id: int
    public_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanyDetailRead(CompanyRead):
    contacts: list[ContactRead] = []
    leads: list[LeadRead] = []
    deals: list[DealRead] = []
    tasks: list[CRMTaskRead] = []
    crm_activities: list[CRMActivityLogRead] = []


class CompanyStats(BaseModel):
    total: int
    by_status: Dict[str, int]
    top_industries: list[Dict[str, Any]]


class CompanyListResponse(BaseModel):
    items: list[CompanyRead]
    total: int
