"""CRM Task Schemas"""

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.crm_task import CRMTaskStatus, CRMTaskType, CRMTaskPriority, CRMRelatedToType
from app.schemas.user import UserResponse


class CRMTaskBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    task_type: CRMTaskType
    priority: CRMTaskPriority = CRMTaskPriority.MEDIUM
    status: CRMTaskStatus = CRMTaskStatus.PENDING
    assigned_to: int
    related_to_type: Optional[CRMRelatedToType] = None
    related_to_id: Optional[int] = None
    due_date: datetime
    reminder_before_minutes: int = 30
    custom_fields: Optional[Dict[str, Any]] = None


class CRMTaskCreate(CRMTaskBase):
    pass


class CRMTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    task_type: Optional[CRMTaskType] = None
    priority: Optional[CRMTaskPriority] = None
    status: Optional[CRMTaskStatus] = None
    assigned_to: Optional[int] = None
    related_to_type: Optional[CRMRelatedToType] = None
    related_to_id: Optional[int] = None
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    is_reminder_sent: Optional[bool] = None
    reminder_before_minutes: Optional[int] = None
    outcome: Optional[Dict[str, Any]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    custom_fields: Optional[Dict[str, Any]] = None


class CRMTaskRead(CRMTaskBase):
    id: int
    public_id: UUID
    assigned_user: Optional[UserResponse] = None
    created_by: int
    completed_date: Optional[datetime] = None
    is_reminder_sent: bool
    outcome: Optional[Dict[str, Any]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CRMTaskListResponse(BaseModel):
    items: List[CRMTaskRead]
    total: int
