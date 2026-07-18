"""Auth service — login, token refresh, email verification, and logout"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.user import User
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
from app.schemas.auth import TokenResponse, UpdateProfileRequest
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

            trial_expires = org.trial_expires_at
            if trial_expires and trial_expires.tzinfo is None:
                trial_expires = trial_expires.replace(tzinfo=timezone.utc)

            now = datetime.now(timezone.utc)
            if org.subscription_status == "expired" or (
                org.subscription_status == "trial" and trial_expires and trial_expires < now
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

async def verify_email(db: AsyncSession, *, email: str, otp: str) -> str:
    """Activate a user account by confirming the one-time code sent to their email.

    Returns a human-readable message string (used by the endpoint).

    Raises:
        BadRequestError: Account not found, no code on file, or the code is
            incorrect/expired.
    """
    from datetime import datetime, timezone

    user = await UserRepository.get_by_email(db, email.strip().lower())
    if not user:
        raise BadRequestError("Invalid verification code.")

    if user.is_verified:
        return "Your account is already verified. You can log in now."

    stored_otp = (user.others or {}).get("email_verify_otp")
    expires_at_raw = (user.others or {}).get("email_verify_otp_expires_at")

    if not stored_otp or not expires_at_raw:
        raise BadRequestError("No verification code found for this account. Please request a new one.")

    if datetime.now(timezone.utc) > datetime.fromisoformat(expires_at_raw):
        raise BadRequestError("This verification code has expired. Please request a new one.")

    if otp.strip() != stored_otp:
        raise BadRequestError("Incorrect verification code. Please try again.")

    await UserRepository.consume_verification_otp(db, user)
    await db.commit()

    logger.info(f"User '{user.username}' (id={user.id}) email verified successfully.")
    return (
        f"Email verified successfully. Welcome to Gravit, {user.full_name or user.username}! "
        "You can now log in."
    )


# ── Resend Verification ─────────────────────────────────────────────────────────

_RESEND_GENERIC_MESSAGE = (
    "If an account with that email exists and still needs verification, "
    "we've sent a new verification code."
)


async def resend_verification_email(db: AsyncSession, *, email: str) -> str:
    """Send a fresh verification code for a not-yet-verified account.

    Always returns the same generic message regardless of whether the email
    exists, is already verified, or is inactive — this endpoint is public and
    unauthenticated, so distinguishing those cases would leak account existence.
    """
    from app.utils.email import send_verification_email, spawn_email_task, generate_otp, otp_expiry

    user = await UserRepository.get_by_email(db, email.strip().lower())
    if user and user.is_active and not user.is_verified:
        otp = generate_otp()
        await UserRepository.set_verification_otp(db, user, otp=otp, expires_at=otp_expiry().isoformat())
        await db.commit()
        spawn_email_task(
            send_verification_email(
                to_email=user.email,
                full_name=user.full_name or user.username,
                otp=otp,
            )
        )
        logger.info(f"Resent verification code to '{user.email}' (id={user.id}).")

    return _RESEND_GENERIC_MESSAGE


# ── Forgot Password ──────────────────────────────────────────────────────────────

_FORGOT_PASSWORD_GENERIC_MESSAGE = (
    "If an account with that email exists, we've sent a password reset link."
)


async def forgot_password(db: AsyncSession, *, email: str) -> str:
    """Send a password reset email for a self-service "forgot password" request.

    Always returns the same generic message regardless of whether the email
    exists or is active — this endpoint is public and unauthenticated, so
    distinguishing those cases would leak account existence.
    """
    from app.utils.email import send_password_reset_email, spawn_email_task

    user = await UserRepository.get_by_email(db, email.strip().lower())
    if user and user.is_active:
        spawn_email_task(
            send_password_reset_email(
                to_email=user.email,
                full_name=user.full_name or user.username,
                user_id=user.id,
            )
        )
        logger.info(f"Sent password reset email to '{user.email}' (id={user.id}).")

    return _FORGOT_PASSWORD_GENERIC_MESSAGE


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


async def reset_password_with_token(
    db: AsyncSession,
    *,
    token: str,
    new_password: str,
) -> None:
    """Consume a password reset token and update the user's password.

    Revokes all active sessions for security.
    """
    from app.utils.email import decode_reset_token

    user_id = decode_reset_token(token)
    if not user_id:
        raise BadRequestError(
            "This password reset link is invalid or has expired. Please request a new link."
        )

    user = await UserRepository.get_by_id(db, user_id)
    if not user:
        raise BadRequestError("Account not found.")

    if not user.is_active:
        raise BadRequestError("This account is inactive. Please contact support.")

    validate_password_strength(new_password)

    hashed_pw = get_password_hash(new_password)
    user.hashed_password = hashed_pw
    user.is_verified = True

    # Revoke all active tokens/sessions to force re-login
    await RefreshTokenRepository.revoke_all_for_user(db, user.id)
    await db.commit()
    logger.info(f"User '{user.username}' (id={user_id}) reset password successfully.")


# ── Self-Service Profile Update ─────────────────────────────────────────────────

# Fields that aren't real User columns — they live inside the `others` JSON
# column instead (see User.dob/phone/avatar properties).
_OTHERS_BACKED_PROFILE_FIELDS = {"dob", "phone", "avatar", "job_title", "billing_address", "billing_reminder"}


async def update_own_profile(
    db: AsyncSession,
    *,
    user: User,
    payload: UpdateProfileRequest,
) -> User:
    """Update the current user's own display preferences (timezone, currency)
    and profile extras (dob, phone, avatar)."""
    data = payload.model_dump(exclude_unset=True)

    if "reporting_manager_id" in data:
        val = data["reporting_manager_id"]
        data["reporting_manager_id"] = val if val and val > 0 else None

    others_updates = {key: data.pop(key) for key in list(data) if key in _OTHERS_BACKED_PROFILE_FIELDS}
    if others_updates:
        # Reassign a new dict (rather than mutating in place) so SQLAlchemy's
        # change tracking actually notices the JSON column changed.
        user.others = {**(user.others or {}), **others_updates}

    for field, value in data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return user

