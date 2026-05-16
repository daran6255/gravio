"""Deal Schemas"""

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.models.deal import DealStage, DealType
from app.schemas.user import UserResponse


class DealBase(BaseModel):
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    lead_id: Optional[int] = None
    assigned_to: int
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    deal_stage: DealStage = DealStage.DISCOVERY
    deal_type: DealType = DealType.NEW_BUSINESS
    win_probability: int = Field(0, ge=0, le=100)
    deal_value: Decimal = Field(..., decimal_places=2)
    currency: str = Field("INR", max_length=3)
    payment_terms: Optional[str] = Field(None, max_length=100)
    contract_duration_months: Optional[int] = None
    expected_close_date: date
    lost_reason: Optional[str] = Field(None, max_length=255)
    lost_to_competitor: Optional[str] = Field(None, max_length=255)
    competitors: Optional[List[str]] = None
    products_services: Optional[List[Dict[str, Any]]] = None
    next_action: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    assigned_to: Optional[int] = None
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    deal_stage: Optional[DealStage] = None
    deal_type: Optional[DealType] = None
    win_probability: Optional[int] = Field(None, ge=0, le=100)
    deal_value: Optional[Decimal] = None
    currency: Optional[str] = Field(None, max_length=3)
    payment_terms: Optional[str] = Field(None, max_length=100)
    contract_duration_months: Optional[int] = None
    expected_close_date: Optional[date] = None
    actual_close_date: Optional[date] = None
    lost_reason: Optional[str] = Field(None, max_length=255)
    lost_to_competitor: Optional[str] = Field(None, max_length=255)
    competitors: Optional[List[str]] = None
    products_services: Optional[List[Dict[str, Any]]] = None
    next_action: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class DealRead(DealBase):
    id: int
    public_id: UUID
    assigned_user: Optional[UserResponse] = None
    actual_close_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DealListResponse(BaseModel):
    items: List[DealRead]
    total: int
