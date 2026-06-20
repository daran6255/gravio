"""Auth service — login, token refresh, email verification, and logout"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.repositories.user import UserRepository
from app.repositories.refresh_token import RefreshTokenRepository
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token_type,
)
from app.middleware.exceptions import UnauthorizedError, ForbiddenError, BadRequestError
from app.schemas.auth import TokenResponse
from app.utils.password import validate_password_strength


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
            if not org.is_active:
                raise ForbiddenError(
                    "Your organization's account has been deactivated. Please contact support."
                )

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
    refresh_token, jti, expires_at = create_refresh_token(data=token_data)

    await RefreshTokenRepository.create(db, jti=jti, user_id=user.id, expires_at=expires_at)

    logger.info(f"User '{user.username}' (org={user.organization_id}) logged in.")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


# ── Token Refresh ──────────────────────────────────────────────────────────────

async def refresh_tokens(db: AsyncSession, *, refresh_token: str) -> TokenResponse:
    """Issue a new access + refresh token pair from a valid refresh token.

    Refresh tokens are one-time-use: each call here revokes the presented token
    and mints a brand new one (rotation). If a token is presented that was
    already rotated/revoked, that's a signal it was copied/stolen — every
    refresh token for that user is revoked immediately, forcing a fresh login.

    Raises:
        UnauthorizedError: Token is invalid, expired, wrong type, unknown to the
            server, or already used (reuse detected — all sessions are revoked).
    """
    payload = decode_token(refresh_token)

    if not payload or not verify_token_type(payload, "refresh"):
        raise UnauthorizedError("Invalid or expired refresh token.")

    jti = payload.get("jti")
    user_id = payload.get("sub")
    if not jti or not user_id:
        raise UnauthorizedError("Invalid or expired refresh token.")

    stored = await RefreshTokenRepository.get_by_jti(db, jti)
    if stored is None:
        # Signature is valid but we never issued this jti (e.g. tampered token).
        raise UnauthorizedError("Invalid or expired refresh token.")

    if stored.revoked_at is not None:
        await RefreshTokenRepository.revoke_all_for_user(db, int(user_id))
        # Commit now: the exception raised below propagates through get_db's
        # generator dependency, which rolls back the session on any exception.
        # Without committing here, this revocation would be undone by that
        # rollback and the reuse-detection sweep would silently do nothing.
        await db.commit()
        logger.warning(
            f"Refresh token reuse detected for user_id={user_id} (jti={jti[:8]}...). "
            "All sessions for this user have been revoked."
        )
        raise UnauthorizedError(
            "This refresh token has already been used. For your security, all "
            "sessions have been logged out — please log in again."
        )

    token_data = {
        "sub": payload["sub"],
        "org": payload.get("org"),
        "username": payload.get("username"),
    }

    new_access = create_access_token(data=token_data)
    new_refresh, new_jti, new_expires_at = create_refresh_token(data=token_data)

    # Rotate: retire the presented token and record what replaced it, then track the new one.
    await RefreshTokenRepository.revoke(db, jti, replaced_by=new_jti)
    await RefreshTokenRepository.create(db, jti=new_jti, user_id=int(user_id), expires_at=new_expires_at)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        token_type="bearer",
    )


# ── Logout ─────────────────────────────────────────────────────────────────────

async def logout(db: AsyncSession, *, refresh_token: Optional[str]) -> None:
    """Revoke the given refresh token so it can't be used again.

    Access tokens are not individually revocable (stateless by design) and will
    simply expire on their own within ACCESS_TOKEN_EXPIRE_MINUTES. If no
    refresh_token is supplied, this is a no-op — the client should still discard
    both tokens locally.
    """
    if not refresh_token:
        return

    payload = decode_token(refresh_token)
    if payload and verify_token_type(payload, "refresh"):
        jti = payload.get("jti")
        if jti:
            await RefreshTokenRepository.revoke(db, jti)


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


# ── Accept Invite ────────────────────────────────────────────────────────────────

async def accept_invite(db: AsyncSession, *, token: str, new_password: str) -> TokenResponse:
    """Accept an invite (Flow B's org admin or Flow C's invited teammate).

    Sets the real password, marks the account verified, and logs the user
    straight in — avoids a redundant separate login step right after accepting.

    Raises:
        BadRequestError: Token is invalid/expired, the user no longer exists, or
            the invite was already accepted.
    """
    from app.utils.email import decode_invite_token

    user_id = decode_invite_token(token)
    if not user_id:
        raise BadRequestError(
            "This invite link is invalid or has expired. Please ask for a new invite."
        )

    user = await UserRepository.get_by_id(db, user_id)
    if not user:
        raise BadRequestError("Account not found.")

    if user.is_verified:
        raise BadRequestError("This invite has already been accepted. Please log in instead.")

    validate_password_strength(new_password)

    hashed_pw = get_password_hash(new_password)
    await UserRepository.activate_with_password(db, user_id, hashed_password=hashed_pw)

    token_data = {
        "sub": str(user.id),
        "org": user.organization_id,
        "username": user.username,
    }
    access_token = create_access_token(data=token_data)
    refresh_token, jti, expires_at = create_refresh_token(data=token_data)
    await RefreshTokenRepository.create(db, jti=jti, user_id=user.id, expires_at=expires_at)

    await db.commit()

    logger.info(f"User '{user.username}' (id={user_id}) accepted their invite.")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )
