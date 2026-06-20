"""Authentication endpoints — login, refresh, logout, email verify, profile"""

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.rate_limiter import limiter, rate_limit_auth
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshRequest,
    TokenResponse,
    UserProfileResponse,
)
from app.services.auth import login, logout, refresh_tokens, verify_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Obtain JWT token pair",
    description=(
        "Authenticate with your email or username and password. "
        "Returns an access token (short-lived) and a refresh token (long-lived). "
        "**Requires a verified email address** — unverified accounts will be rejected."
    ),
)
@rate_limit_auth()
async def login_endpoint(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await login(db, identifier=payload.identifier, password=payload.password)


# ── Refresh ────────────────────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description=(
        "Exchange a valid refresh token for a new access + refresh token pair. "
        "Use this when the access token has expired. "
        "Refresh tokens are single-use: the old one is revoked the moment a new "
        "pair is issued. Re-submitting an already-used refresh token revokes "
        "every active session for the account as a theft precaution."
    ),
)
@limiter.limit("20/minute")
async def refresh_endpoint(
    request: Request,
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    return await refresh_tokens(db, refresh_token=payload.refresh_token)


# ── Logout ─────────────────────────────────────────────────────────────────────

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out",
    description=(
        "Revokes the supplied refresh token server-side so it cannot be used again, "
        "even if it leaks later. The client should also discard both tokens locally. "
        "Requires a valid access token; the access token itself simply expires on "
        "its own (it is never individually revocable)."
    ),
)
async def logout_endpoint(
    payload: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await logout(db, refresh_token=payload.refresh_token)
    return MessageResponse(
        message=f"User '{current_user.username}' has been logged out successfully."
    )


# ── Email Verification ─────────────────────────────────────────────────────────

@router.get(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address",
    description=(
        "Activate your account by supplying the token received in the verification email. "
        "The token is valid for 24 hours. After verification you can log in."
    ),
)
async def verify_email_endpoint(
    token: str = Query(..., description="Verification token from the email link"),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    message = await verify_email(db, token=token)
    return MessageResponse(message=message)


# ── Current User Profile ───────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile",
    description="Return the authenticated user's profile. Requires a valid Bearer token.",
)
async def me_endpoint(
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    return UserProfileResponse.model_validate(current_user)
