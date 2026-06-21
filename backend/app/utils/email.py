"""Email dispatch utility — verification emails and future notifications.

SMTP Note: If SMTP_HOST is not configured in settings, all emails are
silently logged (DEV mode). No exception is raised so development
works without a mail server.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from loguru import logger

from app.core.config import settings
from app.templates import render_template


# ── Verification Token ─────────────────────────────────────────────────────────

_VERIFY_SECRET = settings.SECRET_KEY + "_email_verify"
_VERIFY_ALGORITHM = "HS256"
_VERIFY_EXPIRE_HOURS = 24


def create_verification_token(user_id: int) -> str:
    """Generate a time-limited JWT used for email verification links.

    Token expires in 24 hours.
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=_VERIFY_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "type": "email_verify",
        "exp": expire,
    }
    return jwt.encode(payload, _VERIFY_SECRET, algorithm=_VERIFY_ALGORITHM)


def decode_verification_token(token: str) -> Optional[int]:
    """Decode a verification token and return the user_id, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, _VERIFY_SECRET, algorithms=[_VERIFY_ALGORITHM])
        if payload.get("type") != "email_verify":
            return None
        user_id_str = payload.get("sub")
        if user_id_str is None:
            return None
        return int(user_id_str)
    except (JWTError, ValueError):
        return None


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


# ── Sending ────────────────────────────────────────────────────────────────────

async def send_verification_email(
    to_email: str,
    full_name: str,
    user_id: int,
) -> None:
    """Send an account verification email to a newly registered user.

    In development (SMTP_HOST not set): logs the link and returns gracefully.
    In production (SMTP_HOST configured): sends the email via SMTP.
    """
    token = create_verification_token(user_id)
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    verification_link = f"{base_url}/verify-email?token={token}"

    if not settings.SMTP_HOST:
        # Dev / no-SMTP fallback — just log it
        logger.info(
            f"[EMAIL - DEV] Verification email for '{full_name}' ({to_email})\n"
            f"  Link: {verification_link}"
        )
        return

    # Production: send via SMTP (aiosmtplib for async support)
    await _send_via_smtp(
        to_email=to_email,
        subject=f"Verify your {settings.APP_NAME} account",
        html_body=_build_verification_html(full_name, verification_link),
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
    invite_link = f"{base_url}/accept-invite?token={token}"

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


def _build_verification_html(full_name: str, link: str) -> str:
    """Build the HTML body for the verification email from templates/email/verification.html."""
    return render_template(
        "email/verification.html",
        app_name=settings.APP_NAME,
        full_name=full_name,
        link=link,
        expire_hours=_VERIFY_EXPIRE_HOURS,
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
