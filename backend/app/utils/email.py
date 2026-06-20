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
        logger.info(f"Verification email sent to {to_email}")

    except ImportError:
        logger.warning(
            "aiosmtplib not installed — email not sent. "
            "Run: pip install aiosmtplib"
        )
    except Exception as exc:
        # Email failure must never crash the onboarding flow
        logger.error(f"Failed to send verification email to {to_email}: {exc}")


def _build_verification_html(full_name: str, link: str) -> str:
    """Build the HTML body for the verification email."""
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #4F46E5;">Welcome to {settings.APP_NAME}, {full_name}!</h2>
        <p>Your organization account has been created. To activate it, please verify your email address by clicking the button below.</p>
        <p style="text-align: center; margin: 32px 0;">
            <a href="{link}"
               style="background-color: #4F46E5; color: #fff; padding: 14px 28px;
                      border-radius: 6px; text-decoration: none; font-weight: bold;">
                Verify Email Address
            </a>
        </p>
        <p style="color: #888; font-size: 13px;">
            This link expires in 24 hours. If you did not sign up for {settings.APP_NAME}, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 32px;">
        <p style="color: #bbb; font-size: 12px; text-align: center;">
            &copy; {datetime.now().year} {settings.APP_NAME}
        </p>
    </body>
    </html>
    """
