"""Email dispatch utility — verification emails and future notifications.

SMTP Note: If SMTP_HOST is not configured in settings, all emails are
silently logged (DEV mode). No exception is raised so development
works without a mail server.
"""

import asyncio
import secrets
from datetime import datetime, timedelta, timezone
from typing import Coroutine, Optional

from jose import JWTError, jwt
from loguru import logger

from app.core.config import settings
from app.templates import render_template


# ── Background dispatch ──────────────────────────────────────────────────────
#
# asyncio only holds a *weak* reference to a Task once nothing else refers to
# it — an unreferenced task fired with a bare `asyncio.create_task(...)` can be
# garbage-collected mid-flight, silently dropping the email with no error
# logged anywhere. Keep every spawned email task alive in this module-level
# set until it finishes.
_background_email_tasks: set[asyncio.Task] = set()


def spawn_email_task(coro: Coroutine) -> asyncio.Task:
    """Fire an email-sending coroutine in the background without losing it to GC."""
    task = asyncio.create_task(coro)
    _background_email_tasks.add(task)
    task.add_done_callback(_background_email_tasks.discard)
    return task


# ── Verification OTP ───────────────────────────────────────────────────────────
#
# Email verification uses a short numeric code entered directly on the page
# that requested it, rather than a link that opens a separate page — one
# consistent verification UI regardless of how the user gets there.

OTP_LENGTH = 6
OTP_EXPIRE_MINUTES = 10


def generate_otp() -> str:
    """Generate a zero-padded random numeric one-time code, e.g. '042817'."""
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


def otp_expiry() -> datetime:
    """Return the UTC expiry timestamp for a freshly generated OTP."""
    return datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES)


# ── Invite Token ───────────────────────────────────────────────────────────────

_INVITE_SECRET = settings.SECRET_KEY + "_invite"
_INVITE_ALGORITHM = "HS256"


def create_invite_token(user_id: int) -> str:
    """Generate a time-limited JWT used for invite ("set your password") links.

    Token expires in settings.INVITE_TOKEN_EXPIRE_DAYS days — invites plausibly sit
    unopened longer than a just-signed-up user's verification link.
    """
    expire = datetime.now(timezone.utc) + timedelta(days=settings.INVITE_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "type": "invite",
        "exp": expire,
    }
    return jwt.encode(payload, _INVITE_SECRET, algorithm=_INVITE_ALGORITHM)


def decode_invite_token(token: str) -> Optional[int]:
    """Decode an invite token and return the user_id, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, _INVITE_SECRET, algorithms=[_INVITE_ALGORITHM])
        if payload.get("type") != "invite":
            return None
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (JWTError, ValueError):
        return None


# ── Password Reset Token ───────────────────────────────────────────────────────

_RESET_SECRET = settings.SECRET_KEY + "_reset"
_RESET_ALGORITHM = "HS256"
_RESET_EXPIRE_HOURS = 2


def create_reset_token(user_id: int) -> str:
    """Generate a time-limited JWT used for password reset links."""
    expire = datetime.now(timezone.utc) + timedelta(hours=_RESET_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "type": "password_reset",
        "exp": expire,
    }
    return jwt.encode(payload, _RESET_SECRET, algorithm=_RESET_ALGORITHM)


def decode_reset_token(token: str) -> Optional[int]:
    """Decode a password reset token and return the user_id, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, _RESET_SECRET, algorithms=[_RESET_ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (JWTError, ValueError):
        return None


# ── Sending ────────────────────────────────────────────────────────────────────

async def send_verification_email(
    to_email: str,
    full_name: str,
    otp: str,
) -> None:
    """Send an account verification code to a newly registered (or re-requesting) user.

    In development (SMTP_HOST not set): logs the code and returns gracefully.
    In production (SMTP_HOST configured): sends the email via SMTP.
    """
    if not settings.SMTP_HOST:
        # Dev / no-SMTP fallback — just log it
        logger.info(f"[EMAIL - DEV] Verification code for '{full_name}' ({to_email}): {otp}")
        return

    # Production: send via SMTP (aiosmtplib for async support)
    await _send_via_smtp(
        to_email=to_email,
        subject=f"Verify your {settings.APP_NAME} account",
        html_body=_build_verification_html(full_name, otp),
    )


async def send_invite_email(
    to_email: str,
    full_name: str,
    org_name: str,
    role: str,
    user_id: int,
) -> None:
    """Send an invite ("set your password and join") email.

    Used both when a Super Admin provisions a new organization's first admin and
    when an Org Admin invites a teammate. Same dev/SMTP fallback as
    send_verification_email.
    """
    token = create_invite_token(user_id)
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    invite_link = f"{base_url}/auth/accept-invite?token={token}"

    if not settings.SMTP_HOST:
        logger.info(
            f"[EMAIL - DEV] Invite email for '{full_name}' ({to_email}) — org '{org_name}', role '{role}'\n"
            f"  Link: {invite_link}"
        )
        return

    await _send_via_smtp(
        to_email=to_email,
        subject=f"You've been invited to join {org_name} on {settings.APP_NAME}",
        html_body=_build_invite_html(full_name, org_name, role, invite_link),
    )


async def send_password_reset_email(
    to_email: str,
    full_name: str,
    user_id: int,
) -> None:
    """Send a password reset link to a user.

    Same dev/SMTP fallback as verification emails.
    """
    token = create_reset_token(user_id)
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    reset_link = f"{base_url}/auth/reset-password?token={token}"

    if not settings.SMTP_HOST:
        logger.info(
            f"[EMAIL - DEV] Password reset email for '{full_name}' ({to_email})\n"
            f"  Link: {reset_link}"
        )
        return

    await _send_via_smtp(
        to_email=to_email,
        subject=f"Reset your {settings.APP_NAME} password",
        html_body=_build_reset_html(full_name, reset_link),
    )


async def send_reminder_email(
    to_email: str,
    full_name: str,
    subject: str,
    body: str,
) -> None:
    """Send a CRM reminder notification email.

    Fired by the reminder scheduler background task, not a request handler —
    same dev/SMTP fallback as the other senders here.
    """
    if not settings.SMTP_HOST:
        logger.info(
            f"[EMAIL - DEV] Reminder email for '{full_name}' ({to_email}) — {subject}\n"
            f"  Body: {body}"
        )
        return

    await _send_via_smtp(
        to_email=to_email,
        subject=subject,
        html_body=_build_reminder_html(full_name, subject, body),
    )


async def _send_via_smtp(to_email: str, subject: str, html_body: str) -> None:
    """Internal helper — send an HTML email using aiosmtplib."""
    try:
        import aiosmtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME or settings.APP_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT or 587,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=False,
            start_tls=settings.SMTP_TLS,
        )
        logger.info(f"Email '{subject}' sent to {to_email}")

    except ImportError:
        logger.warning(
            "aiosmtplib not installed — email not sent. "
            "Run: pip install aiosmtplib"
        )
    except Exception as exc:
        # Email failure must never crash the calling flow (onboarding, invites, etc.)
        logger.error(f"Failed to send email '{subject}' to {to_email}: {exc}")


def _build_verification_html(full_name: str, otp: str) -> str:
    """Build the HTML body for the verification email from templates/email/verification.html."""
    return render_template(
        "email/verification.html",
        app_name=settings.APP_NAME,
        full_name=full_name,
        otp=otp,
        expire_minutes=OTP_EXPIRE_MINUTES,
        year=datetime.now().year,
    )


def _build_invite_html(full_name: str, org_name: str, role: str, link: str) -> str:
    """Build the HTML body for the invite email from templates/email/invite.html."""
    return render_template(
        "email/invite.html",
        app_name=settings.APP_NAME,
        full_name=full_name,
        org_name=org_name,
        role=role,
        link=link,
        expire_days=settings.INVITE_TOKEN_EXPIRE_DAYS,
        year=datetime.now().year,
    )


def _build_reminder_html(full_name: str, subject: str, body: str) -> str:
    """Build the HTML body for a reminder email from templates/email/reminder.html."""
    return render_template(
        "email/reminder.html",
        app_name=settings.APP_NAME,
        full_name=full_name,
        subject=subject,
        body=body,
        base_url=settings.FRONTEND_URL or "http://localhost:5173",
        year=datetime.now().year,
    )


def _build_reset_html(full_name: str, link: str) -> str:
    """Build the HTML body for the password reset email from templates/email/reset_password.html."""
    return render_template(
        "email/reset_password.html",
        app_name=settings.APP_NAME,
        full_name=full_name,
        link=link,
        expire_hours=_RESET_EXPIRE_HOURS,
        year=datetime.now().year,
    )
