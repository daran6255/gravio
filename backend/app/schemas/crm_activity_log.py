"""CRM Activity Log Schemas"""

from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.crm_activity_log import CRMEntityType, CRMActivityType


class CRMActivityLogBase(BaseModel):
    entity_type: CRMEntityType
    entity_id: int
    activity_type: CRMActivityType
    performed_by: int
    summary: str = Field(..., max_length=500)
    details: Optional[Dict[str, Any]] = None
    extra_data: Optional[Dict[str, Any]] = None


class CRMActivityLogCreate(CRMActivityLogBase):
    pass


class CRMActivityLogRead(CRMActivityLogBase):
    public_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
