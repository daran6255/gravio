from __future__ import annotations
"""DSR Leave Application schemas"""

import uuid
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.models.dsr_leave_application import DSRLeaveStatus


class DSRLeaveApplicationBase(BaseModel):
    start_date: date
    end_date: date
    leave_type: str = Field(..., max_length=50)
    reason: Optional[str] = None


class DSRLeaveApplicationCreate(DSRLeaveApplicationBase):
    pass


class DSRLeaveApplicationUpdate(BaseModel):
    status: Optional[DSRLeaveStatus] = None
    admin_notes: Optional[str] = None


class DSRLeaveUser(BaseModel):
    full_name: Optional[str] = None
    username: str

    model_config = ConfigDict(from_attributes=True)


class DSRLeaveApplicationRead(DSRLeaveApplicationBase):
    id: int
    public_id: uuid.UUID
    user_id: int
    user: Optional[DSRLeaveUser] = None
    status: DSRLeaveStatus
    admin_notes: Optional[str] = None
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DSRLeaveApplicationList(BaseModel):
    items: List[DSRLeaveApplicationRead]
    total: int


class DSRLeaveStats(BaseModel):
    total_apps: int
    total_days: int
    pending_apps: int
    pending_days: int
    approved_apps: int
    approved_days: int
    rejected_apps: int
    rejected_days: int
