"""DSR Project Request schemas"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.dsr_project_request import DSRProjectRequestStatus


class DSRProjectRequestCreate(BaseModel):
    project_name: str = Field(..., min_length=2, max_length=255, description="Name of the project to request")
    reason: Optional[str] = Field(default=None, max_length=1000, description="Why this project is needed")


class DSRProjectRequestHandle(BaseModel):
    """Admin approves or rejects a project request"""
    status: DSRProjectRequestStatus = Field(..., description="'approved' or 'rejected'")
    admin_notes: Optional[str] = Field(default=None, max_length=1000)
    # On approval: optional owner assignment (defaults to requester if not provided)
    owner_user_public_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Assign the created project to this user (defaults to requester)",
    )


class DSRProjectRequestRequesterResponse(BaseModel):
    id: int
    public_id: uuid.UUID
    full_name: Optional[str]
    username: str
    email: str

    model_config = {"from_attributes": True}


class DSRProjectRequestResponse(BaseModel):
    id: int
    public_id: uuid.UUID
    project_name: str
    reason: Optional[str] = None
    status: DSRProjectRequestStatus
    admin_notes: Optional[str] = None
    requested_by: int
    requester: Optional[DSRProjectRequestRequesterResponse] = None
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    created_project_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DSRProjectRequestListResponse(BaseModel):
    items: list[DSRProjectRequestResponse]
    total: int
    skip: int
    limit: int
