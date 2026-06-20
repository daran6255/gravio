import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.onboarding import OrganizationCreate, OrgPublic, UserPublic


class TrialExtensionRequest(BaseModel):
    """Schema for trial extension request"""
    extend_days: int = Field(..., ge=1, le=365, description="Number of days to extend the trial (between 1 and 365)")


class TrialExtensionResponse(BaseModel):
    """Schema for trial extension response"""
    public_id: uuid.UUID
    subscription_status: str
    trial_expires_at: datetime

    class Config:
        from_attributes = True


# ── Flow B: Super Admin creates an organization ─────────────────────────────────

class AdminInvite(BaseModel):
    """The first (admin) user of a Super-Admin-provisioned organization — invite-based, no password"""
    username: str = Field(
        ...,
        min_length=3,
        max_length=100,
        pattern=r"^[a-z0-9_]+$",
        description="Lowercase alphanumeric username (underscores allowed)",
    )
    email: EmailStr = Field(..., description="Org admin's business email address")
    full_name: str = Field(..., min_length=2, max_length=255)


class CreateOrganizationRequest(BaseModel):
    """Super Admin provisions a new organization + its first admin (invite-based)"""
    organization: OrganizationCreate
    admin: AdminInvite


class OrganizationListItem(BaseModel):
    """A single row in the Super Admin's organization list"""
    model_config = ConfigDict(from_attributes=True)

    public_id: uuid.UUID
    name: str
    location: Optional[str]
    is_active: bool
    subscription_status: str
    trial_expires_at: Optional[datetime] = None
    plan_id: Optional[int] = None


class CreateOrganizationResponse(BaseModel):
    """Response for a successful Flow B organization provisioning"""
    success: bool = True
    message: str
    organization: OrgPublic
    admin_user: UserPublic
