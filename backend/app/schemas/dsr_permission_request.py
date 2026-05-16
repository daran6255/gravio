import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.dsr_permission_request import DSRPermissionStatus

class DSRPermissionRequestCreate(BaseModel):
    report_date: date
    reason: str = Field(..., min_length=5, max_length=500)

class DSRPermissionRequestUpdate(BaseModel):
    status: DSRPermissionStatus
    admin_notes: Optional[str] = None

class DSRPermissionRequestUser(BaseModel):
    full_name: str
    username: str

    class Config:
        from_attributes = True

class DSRPermissionRequestResponse(BaseModel):
    id: int
    public_id: uuid.UUID
    user_id: int
    user: Optional[DSRPermissionRequestUser] = None
    report_date: date
    reason: str
    status: DSRPermissionStatus
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DSRPermissionRequestListResponse(BaseModel):
    items: list[DSRPermissionRequestResponse]
    total: int
