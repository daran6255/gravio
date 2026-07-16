"""Pydantic schemas for authentication (login, tokens, profile)"""

import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field, model_validator


# ── Request Schemas ────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Login with email or username + password"""
    identifier: Optional[str] = Field(None, description="Email address or username")
    email: Optional[str] = Field(None, description="Alternative field for email address")
    password: str = Field(..., min_length=1)

    @model_validator(mode="before")
    @classmethod
    def resolve_identifier(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "email" in data and not data.get("identifier"):
                data["identifier"] = data["email"]
            if not data.get("identifier"):
                raise ValueError("Either identifier or email is required")
        return data


class RefreshRequest(BaseModel):
    """Request a new access token using a valid refresh token"""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout — supply the refresh token so the server can revoke it.

    Optional for backward compatibility, but without it the refresh token
    stays valid until it naturally expires.
    """
    refresh_token: Optional[str] = None


class AcceptInviteRequest(BaseModel):
    """Accept an invite (Flow B's org admin or Flow C's invited user) by setting a password"""
    token: str = Field(..., description="Invite token from the email link")
    new_password: str = Field(..., min_length=8, description="Min 8 chars with uppercase, digit, and special char")


class ResetPasswordRequest(BaseModel):
    """Reset password using a token from email"""
    token: str = Field(..., description="Reset token from the email link")
    new_password: str = Field(..., min_length=8, description="Min 8 chars with uppercase, digit, and special char")


class ResendVerificationRequest(BaseModel):
    """Request a fresh verification email for a not-yet-verified account"""
    email: str = Field(..., description="Email address used at registration")


class ForgotPasswordRequest(BaseModel):
    """Request a password reset link for a forgotten password"""
    email: str = Field(..., description="Email address associated with the account")


# ── Response Schemas ───────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """JWT token pair returned on successful login or refresh"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    """Generic success/info response (logout, verify email, etc.)"""
    success: bool = True
    message: str


from app.schemas.onboarding import OrgPublic


class BillingAddress(BaseModel):
    """Structured billing address — stored inside User.others['billing_address'].

    Kept ready for future invoicing when an organization upgrades its plan.
    """
    line1: Optional[str] = Field(None, max_length=255)
    line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=120)
    state: Optional[str] = Field(None, max_length=120)
    postal_code: Optional[str] = Field(None, max_length=32)
    country: Optional[str] = Field(None, max_length=120)


class UserProfileResponse(BaseModel):
    """Authenticated user's profile (returned by /auth/me)"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    public_id: uuid.UUID
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    is_superuser: bool
    organization_id: Optional[int]
    organization: Optional[OrgPublic] = None
    reporting_manager_id: Optional[int] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    dob: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    job_title: Optional[str] = None
    billing_address: Optional[BillingAddress] = None
    billing_reminder: bool = False
    created_at: datetime
    updated_at: datetime


class UpdateProfileRequest(BaseModel):
    """Self-service update of the current user's own profile.

    dob/phone/avatar/job_title aren't first-class User columns — they're merged
    into the `others` JSON column (see the matching User model properties).
    """
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    reporting_manager_id: Optional[int] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    dob: Optional[str] = Field(None, description="Date of birth, ISO format YYYY-MM-DD")
    phone: Optional[str] = Field(None, max_length=32, description="Contact phone number, E.164 formatted")
    job_title: Optional[str] = Field(None, max_length=150)
    avatar: Optional[str] = Field(
        None,
        max_length=2_800_000,  # ~2MB of binary image data once base64-decoded
        description="Profile photo as a data URI, e.g. data:image/png;base64,...",
    )
    billing_address: Optional[BillingAddress] = None
    billing_reminder: Optional[bool] = Field(None, description="Remind me before my organization's plan renews/trial ends")
