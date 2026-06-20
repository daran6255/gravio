"""Pydantic schemas for the onboarding flow"""

import uuid
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Request Schemas ────────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    """Organization details collected during self-onboarding"""
    name: str = Field(..., min_length=2, max_length=255, description="Unique organization name")
    location: Optional[str] = Field(None, max_length=255, description="City / country of the organization")
    metadata: Optional[dict[str, Any]] = Field(
        None,
        description="Extra org-level data stored in the 'others' JSON column (e.g. industry, size)",
    )


class AdminUserCreate(BaseModel):
    """Tenant admin user details collected during self-onboarding"""
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        pattern=r"^[a-z0-9_]+$",
        description="Lowercase alphanumeric username (underscores allowed)",
    )
    email: EmailStr = Field(..., description="Business email address")
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, description="Min 8 chars with uppercase, digit, and special char")
    metadata: Optional[dict[str, Any]] = Field(
        None,
        description="Extra user-level data stored in the 'others' JSON column (e.g. job title, source)",
    )


class OnboardRequest(BaseModel):
    """Combined self-onboarding request payload"""
    organization: OrganizationCreate
    admin_user: AdminUserCreate


# ── Response Schemas ───────────────────────────────────────────────────────────

class OrgPublic(BaseModel):
    """Safe public-facing organization representation (no internal PK)"""
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID
    name: str
    location: Optional[str]


class UserPublic(BaseModel):
    """Safe public-facing user representation (no password hash)"""
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID
    username: str
    email: str
    full_name: Optional[str]
    role: str


class OnboardData(BaseModel):
    """Data payload embedded inside the onboard response"""
    organization: OrgPublic
    admin_user: UserPublic


class OnboardResponse(BaseModel):
    """Standard response for successful onboarding"""
    success: bool = True
    message: str
    data: OnboardData
