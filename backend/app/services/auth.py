"""Auth service — login, token refresh, email verification, and logout"""

from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.repositories.user import UserRepository
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
)
from app.middleware.exceptions import UnauthorizedError, ForbiddenError, BadRequestError
from app.schemas.auth import TokenResponse


# ── Login ──────────────────────────────────────────────────────────────────────

async def login(
    db: AsyncSession,
    *,
    identifier: str,
    password: str,
) -> TokenResponse:
    """Authenticate a user by email or username and return a JWT token pair.

    Option A is enforced: unverified users cannot log in.

    Raises:
        UnauthorizedError: Invalid credentials (user not found or wrong password).
        ForbiddenError:    Account is inactive or email is not yet verified.
    """
    user = await UserRepository.get_by_email_or_username(db, identifier)

    # Use a generic message for both "not found" and "wrong password"
    # to avoid user enumeration attacks
    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid email/username or password.")

    if not user.is_active:
        raise ForbiddenError(
            "Your account has been deactivated. Please contact support."
        )

    # Option A: block login until email is verified
    if not user.is_verified:
        raise ForbiddenError(
            "Your email address has not been verified. "
            "Please check your inbox for the verification link."
        )

    # Enforce trial expiry check (exempting superusers)
    if not user.is_superuser and user.organization_id is not None:
        from app.repositories.organization import OrganizationRepository
        from datetime import datetime, timezone
        
        org = await OrganizationRepository.get_by_id(db, user.organization_id)
        if org:
            now = datetime.now(timezone.utc)
            if org.subscription_status == "expired" or (
                org.subscription_status == "trial" and org.trial_expires_at and org.trial_expires_at < now
            ):
                if org.subscription_status == "trial":
                    org.subscription_status = "expired"
                    await db.flush()
                raise ForbiddenError(
                    "Your organization's 30-day free trial has expired. "
                    "Please upgrade to a paid subscription to restore access."
                )

    token_data = {
        "sub": str(user.id),
        "org": user.organization_id,
        "username": user.username,
    }

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    logger.info(f"User '{user.username}' (org={user.organization_id}) logged in.")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


# ── Token Refresh ──────────────────────────────────────────────────────────────

async def refresh_tokens(*, refresh_token: str) -> TokenResponse:
    """Issue a new access + refresh token pair from a valid refresh token.

    Raises:
        UnauthorizedError: Token is invalid, expired, or wrong type.
    """
    payload = decode_token(refresh_token)

    if not payload or not verify_token_type(payload, "refresh"):
        raise UnauthorizedError("Invalid or expired refresh token.")

    token_data = {
        "sub": payload["sub"],
        "org": payload.get("org"),
        "username": payload.get("username"),
    }

    new_access = create_access_token(data=token_data)
    new_refresh = create_refresh_token(data=token_data)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
    )


# ── Email Verification ─────────────────────────────────────────────────────────

async def verify_email(db: AsyncSession, *, token: str) -> str:
    """Activate a user account by consuming a valid email verification token.

    Returns a human-readable message string (used by the endpoint).

    Raises:
        BadRequestError: Token is invalid, expired, or the user no longer exists.
    """
    from app.utils.email import decode_verification_token

    user_id = decode_verification_token(token)
    if not user_id:
        raise BadRequestError(
            "This verification link is invalid or has expired. "
            "Please request a new one."
        )

    user = await UserRepository.get_by_id(db, user_id)
    if not user:
        raise BadRequestError("Account not found.")

    if user.is_verified:
        return "Your account is already verified. You can log in now."

    await UserRepository.mark_verified(db, user_id)
    await db.commit()

    logger.info(f"User '{user.username}' (id={user_id}) email verified successfully.")
    return (
        f"Email verified successfully. Welcome to Gravit, {user.full_name or user.username}! "
        "You can now log in."
    )
