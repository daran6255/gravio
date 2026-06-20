"""Pydantic schemas for authentication (login, tokens, profile)"""

import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# ── Request Schemas ────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Login with email or username + password"""
    identifier: str = Field(..., description="Email address or username")
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    """Request a new access token using a valid refresh token"""
    refresh_token: str


class LogoutRequest(BaseModel):
    """Logout — supply the refresh token so the server can revoke it.

    Optional for backward compatibility, but without it the refresh token
    stays valid until it naturally expires.
    """
    refresh_token: Optional[str] = None


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
    organization_id: Optional[int]
    organization: Optional[OrgPublic] = None
