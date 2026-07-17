"""Pydantic schemas for Org-Admin-side user management (Flow C)"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import UserRole


class InviteUserRequest(BaseModel):
    """Org Admin invites a teammate into their organization"""
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        pattern=r"^[a-z0-9_]+$",
        description="Lowercase alphanumeric username (underscores allowed)",
    )
    email: EmailStr = Field(..., description="Invitee's email address")
    full_name: str = Field(..., min_length=2, max_length=255)
    role: UserRole = Field(..., description="Role to assign within the organization")


class UserListItem(BaseModel):
    """A single row in the org's user list"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    reporting_manager_id: Optional[int] = None
    created_at: datetime


class UpdateUserRequest(BaseModel):
    """Admin updates user details"""
    username: Optional[str] = Field(
        None,
        min_length=3,
        max_length=100,
        pattern=r"^[a-z0-9_]+$",
        description="Lowercase alphanumeric username (underscores allowed)",
    )
    email: Optional[EmailStr] = Field(None, description="Updated email address")
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    role: Optional[UserRole] = Field(None, description="Role to assign")
    reporting_manager_id: Optional[int] = None


class BulkDeleteUsersRequest(BaseModel):
    """Admin deletes multiple users"""
    public_ids: list[uuid.UUID]


class ConvertToOrganizationRequest(BaseModel):
    """Convert an individual/freelancer account into a full team organization"""
    name: str = Field(..., min_length=2, max_length=255, description="Your organization's real name")
    location: Optional[str] = Field(None, max_length=255, description="City / country of the organization")
    company_size: Optional[str] = Field(None, max_length=50, description="e.g. '1-10', '11-50'")
    industry: Optional[str] = Field(None, max_length=100, description="e.g. 'Technology', 'Healthcare'")
