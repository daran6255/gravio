"""FastAPI endpoints for the per-user 'Connect Google Calendar' OAuth flow.

Google is not required for the booking scheduler to work — see
app/services/google_calendar.py and the booking flow's ICS-only fallback — these
endpoints simply let a user opt into richer sync (a real Meet link + their Google
Calendar showing the event) when they choose to.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.config import settings
from app.core.crypto import encrypt_secret
from app.core.database import get_db
from app.middleware.exceptions import NotFoundError, ServiceUnavailableError
from app.models.booking import GoogleConnectionStatus
from app.models.user import User
from app.repositories.booking import GoogleOAuthConnectionRepository
from app.schemas.auth import MessageResponse
from app.schemas.booking import GoogleAuthorizationUrlResponse, GoogleConnectionStatusResponse
from app.services import google_calendar

router = APIRouter(prefix="/integrations/google", tags=["Google Calendar Integration"])


@router.get("/connect", response_model=GoogleAuthorizationUrlResponse)
async def connect_google_calendar(
    current_user: User = Depends(get_current_active_user),
) -> GoogleAuthorizationUrlResponse:
    if not google_calendar.is_configured():
        raise ServiceUnavailableError(
            "Google Calendar integration isn't configured on this server yet. "
            "Bookings still work fully via email calendar invites in the meantime."
        )
    state = google_calendar.create_oauth_state_token(current_user.id)
    return GoogleAuthorizationUrlResponse(authorization_url=google_calendar.get_authorization_url(state))


@router.get("/callback", include_in_schema=False)
async def google_calendar_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    """Google redirects the user's browser here after consent — not called by the
    frontend directly, hence no auth dependency; `state` is what proves who's connecting."""
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    user_id = google_calendar.decode_oauth_state_token(state)
    if user_id is None:
        return RedirectResponse(f"{base_url}/settings?google_calendar=invalid_state")

    try:
        tokens = await google_calendar.exchange_code(code)
    except Exception:
        return RedirectResponse(f"{base_url}/settings?google_calendar=exchange_failed")

    await GoogleOAuthConnectionRepository.upsert(
        db, user_id=user_id,
        google_email=tokens.google_email,
        encrypted_refresh_token=encrypt_secret(tokens.refresh_token),
        encrypted_access_token=encrypt_secret(tokens.access_token),
        access_token_expires_at=tokens.access_token_expires_at,
        granted_scopes=tokens.granted_scopes,
        status=GoogleConnectionStatus.CONNECTED,
        last_error=None,
        connected_at=datetime.now(timezone.utc),
    )
    await db.commit()
    return RedirectResponse(f"{base_url}/settings?google_calendar=connected")


@router.get("/status", response_model=GoogleConnectionStatusResponse)
async def google_calendar_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> GoogleConnectionStatusResponse:
    connection = await GoogleOAuthConnectionRepository.get_by_user_id(db, current_user.id)
    if connection is None:
        return GoogleConnectionStatusResponse(status=GoogleConnectionStatus.DISCONNECTED)
    return GoogleConnectionStatusResponse(
        status=connection.status, google_email=connection.google_email,
        connected_at=connection.connected_at, last_error=connection.last_error,
    )


@router.post("/disconnect", response_model=MessageResponse)
async def disconnect_google_calendar(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    connection = await GoogleOAuthConnectionRepository.get_by_user_id(db, current_user.id)
    if connection is None:
        raise NotFoundError("No Google Calendar connection to disconnect.")
    await google_calendar.disconnect(db, connection)
    await db.commit()
    return MessageResponse(message="Google Calendar disconnected. Future bookings will use email calendar invites only.")
