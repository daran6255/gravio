"""Pydantic schemas for authentication (login, tokens, profile)"""

import uuid
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

class UserProfileResponse(BaseModel):
    """Authenticated user's profile (returned by /auth/me)"""
    model_config = ConfigDict(from_attributes=True)

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
    timezone: Optional[str] = None
    currency: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    """Self-service update of the current user's own display preferences."""
    timezone: Optional[str] = None
    currency: Optional[str] = None
