"""Google Calendar (+ Google Meet, generated via the Calendar API) integration.

Single choke point for every Google API call the booking scheduler makes — every
public function here catches its own exceptions and returns a result object instead
of raising. app/services/booking.py (the caller) decides how to degrade when Google
is unreachable/not connected/revoked: the booking itself always succeeds regardless,
falling back to an ICS email invite (app/utils/ics.py) with no Google dependency.

The google-api-python-client / google-auth-oauthlib libraries are synchronous
(blocking network I/O), so every call into them is wrapped in asyncio.to_thread to
avoid blocking the event loop.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from jose import JWTError, jwt
from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.crypto import decrypt_secret, encrypt_secret
from app.models.booking import BookingLocationType, BookingPage, GoogleConnectionStatus, GoogleOAuthConnection, ScheduledMeeting
from app.repositories.booking import GoogleOAuthConnectionRepository


class GoogleNotConfiguredError(Exception):
    """Google_CLIENT_ID/SECRET/REDIRECT_URI aren't set — callers must treat this as
    'Google integration unavailable', never as a bug to surface as a 500."""


def is_configured() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET and settings.GOOGLE_OAUTH_REDIRECT_URI)


def _client_config() -> dict:
    return {
        "web": {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.GOOGLE_OAUTH_REDIRECT_URI],
        }
    }


_STATE_SECRET = settings.SECRET_KEY + "_google_oauth_state"
_STATE_ALGORITHM = "HS256"
_STATE_EXPIRE_MINUTES = 10


def create_oauth_state_token(user_id: int) -> str:
    """Short-lived signed token identifying who is connecting, carried through the
    OAuth `state` param. The callback (a plain browser redirect with no Authorization
    header) verifies this instead of trusting an unauthenticated user_id query param —
    otherwise anyone could attach their own authorization code to another account."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=_STATE_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "type": "google_oauth_state", "exp": expire}
    return jwt.encode(payload, _STATE_SECRET, algorithm=_STATE_ALGORITHM)


def decode_oauth_state_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, _STATE_SECRET, algorithms=[_STATE_ALGORITHM])
        if payload.get("type") != "google_oauth_state":
            return None
        return int(payload["sub"])
    except (JWTError, ValueError, KeyError):
        return None


def get_authorization_url(state: str) -> str:
    """Builds the Google consent-screen URL the frontend redirects the user to.

    `state` should be a signed/opaque token identifying the connecting user (e.g. a
    short-lived JWT) — verified again in the callback so the OAuth callback can't be
    used to attach a stolen code to the wrong account.
    """
    if not is_configured():
        raise GoogleNotConfiguredError("Google OAuth client is not configured")

    flow = Flow.from_client_config(
        _client_config(), scopes=settings.GOOGLE_CALENDAR_SCOPES, redirect_uri=settings.GOOGLE_OAUTH_REDIRECT_URI
    )
    # access_type=offline + prompt=consent guarantees a refresh_token is issued even
    # if this user granted consent once before (Google otherwise omits it on repeat grants).
    auth_url, _ = flow.authorization_url(access_type="offline", include_granted_scopes="true", prompt="consent", state=state)
    return auth_url


@dataclass
class ExchangedTokens:
    refresh_token: str
    access_token: str
    access_token_expires_at: datetime
    granted_scopes: str
    google_email: str


async def exchange_code(code: str) -> ExchangedTokens:
    """Exchanges an OAuth authorization code for tokens + the connected account's email."""
    if not is_configured():
        raise GoogleNotConfiguredError("Google OAuth client is not configured")

    def _do_exchange() -> ExchangedTokens:
        flow = Flow.from_client_config(
            _client_config(), scopes=settings.GOOGLE_CALENDAR_SCOPES, redirect_uri=settings.GOOGLE_OAUTH_REDIRECT_URI
        )
        flow.fetch_token(code=code)
        creds = flow.credentials
        if not creds.refresh_token:
            raise ValueError(
                "Google did not return a refresh token. This usually means the user already "
                "granted this app access previously — ask them to revoke access at "
                "https://myaccount.google.com/permissions and reconnect."
            )

        oauth2_service = build("oauth2", "v2", credentials=creds, cache_discovery=False)
        userinfo = oauth2_service.userinfo().get().execute()

        expires_at = creds.expiry
        if expires_at is not None and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        return ExchangedTokens(
            refresh_token=creds.refresh_token,
            access_token=creds.token,
            access_token_expires_at=expires_at or datetime.now(timezone.utc),
            granted_scopes=" ".join(creds.scopes or []),
            google_email=userinfo.get("email", ""),
        )

    return await asyncio.to_thread(_do_exchange)


async def _get_valid_credentials(db: AsyncSession, connection: GoogleOAuthConnection) -> Credentials:
    """Builds live Credentials for a stored connection, refreshing (and persisting the
    refreshed access token) if the cached one is missing or expired."""
    creds = Credentials(
        token=decrypt_secret(connection.encrypted_access_token) if connection.encrypted_access_token else None,
        refresh_token=decrypt_secret(connection.encrypted_refresh_token),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=settings.GOOGLE_CALENDAR_SCOPES,
    )

    now = datetime.now(timezone.utc)
    expires_at = connection.access_token_expires_at
    needs_refresh = not creds.token or expires_at is None or expires_at <= now
    if needs_refresh:
        await asyncio.to_thread(creds.refresh, GoogleAuthRequest())
        new_expiry = creds.expiry.replace(tzinfo=timezone.utc) if creds.expiry and creds.expiry.tzinfo is None else creds.expiry
        await GoogleOAuthConnectionRepository.update(
            db, connection,
            encrypted_access_token=encrypt_secret(creds.token),
            access_token_expires_at=new_expiry,
        )
    return creds


@dataclass
class CalendarSyncResult:
    ok: bool
    google_event_id: Optional[str] = None
    google_meet_link: Optional[str] = None
    error: Optional[str] = None


def _event_body(meeting: ScheduledMeeting, booking_page: BookingPage) -> dict:
    body = {
        "summary": f"{booking_page.title} with {meeting.client_name}",
        "description": meeting.meeting_notes or "",
        "start": {"dateTime": meeting.start_time.astimezone(timezone.utc).isoformat()},
        "end": {"dateTime": meeting.end_time.astimezone(timezone.utc).isoformat()},
        "attendees": [{"email": meeting.client_email}],
    }
    if booking_page.location_type == BookingLocationType.GOOGLE_MEET:
        body["conferenceData"] = {
            "createRequest": {
                "requestId": str(meeting.public_id),
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        }
    elif booking_page.location_type == BookingLocationType.OFFLINE and booking_page.offline_address:
        body["location"] = booking_page.offline_address
    return body


async def create_event(
    db: AsyncSession, connection: GoogleOAuthConnection, meeting: ScheduledMeeting, booking_page: BookingPage
) -> CalendarSyncResult:
    """Creates the Google Calendar event, generating a Meet link via conferenceData
    when the booking page is an online meeting. Never raises — every failure mode
    (network, quota, revoked consent) is caught and returned as ok=False so the
    caller can fall back to ICS-only and/or queue a retry."""
    try:
        creds = await _get_valid_credentials(db, connection)

        def _insert():
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            return service.events().insert(
                calendarId="primary",
                body=_event_body(meeting, booking_page),
                conferenceDataVersion=1,
                sendUpdates="all",
            ).execute()

        event = await asyncio.to_thread(_insert)
        meet_link = None
        for entry_point in (event.get("conferenceData", {}) or {}).get("entryPoints", []):
            if entry_point.get("entryPointType") == "video":
                meet_link = entry_point.get("uri")
                break
        return CalendarSyncResult(ok=True, google_event_id=event.get("id"), google_meet_link=meet_link)
    except RefreshError as exc:
        await _mark_connection_broken(db, connection, str(exc))
        return CalendarSyncResult(ok=False, error=f"Google connection revoked: {exc}")
    except HttpError as exc:
        logger.warning(f"Google Calendar create_event failed for meeting {meeting.public_id}: {exc}")
        return CalendarSyncResult(ok=False, error=str(exc))
    except Exception as exc:  # noqa: BLE001 - must never propagate into the booking flow
        logger.exception(f"Unexpected error creating Google Calendar event for meeting {meeting.public_id}")
        return CalendarSyncResult(ok=False, error=str(exc))


async def patch_event(
    db: AsyncSession, connection: GoogleOAuthConnection, meeting: ScheduledMeeting, booking_page: BookingPage
) -> CalendarSyncResult:
    """Updates an already-synced event's time (reschedule). Falls back to create_event
    if the stored google_event_id is missing (e.g. the original sync never completed)."""
    if not meeting.google_event_id:
        return await create_event(db, connection, meeting, booking_page)
    try:
        creds = await _get_valid_credentials(db, connection)

        def _patch():
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            return service.events().patch(
                calendarId="primary",
                eventId=meeting.google_event_id,
                body={
                    "start": {"dateTime": meeting.start_time.astimezone(timezone.utc).isoformat()},
                    "end": {"dateTime": meeting.end_time.astimezone(timezone.utc).isoformat()},
                },
                sendUpdates="all",
            ).execute()

        event = await asyncio.to_thread(_patch)
        meet_link = meeting.google_meet_link
        for entry_point in (event.get("conferenceData", {}) or {}).get("entryPoints", []):
            if entry_point.get("entryPointType") == "video":
                meet_link = entry_point.get("uri")
                break
        return CalendarSyncResult(ok=True, google_event_id=event.get("id"), google_meet_link=meet_link)
    except RefreshError as exc:
        await _mark_connection_broken(db, connection, str(exc))
        return CalendarSyncResult(ok=False, error=f"Google connection revoked: {exc}")
    except HttpError as exc:
        logger.warning(f"Google Calendar patch_event failed for meeting {meeting.public_id}: {exc}")
        return CalendarSyncResult(ok=False, error=str(exc))
    except Exception as exc:  # noqa: BLE001
        logger.exception(f"Unexpected error patching Google Calendar event for meeting {meeting.public_id}")
        return CalendarSyncResult(ok=False, error=str(exc))


async def cancel_event(db: AsyncSession, connection: GoogleOAuthConnection, meeting: ScheduledMeeting) -> CalendarSyncResult:
    """Deletes the Google Calendar event. A 410/404 (already gone) counts as success —
    the desired end state (no event) is already true."""
    if not meeting.google_event_id:
        return CalendarSyncResult(ok=True)
    try:
        creds = await _get_valid_credentials(db, connection)

        def _delete():
            service = build("calendar", "v3", credentials=creds, cache_discovery=False)
            service.events().delete(calendarId="primary", eventId=meeting.google_event_id, sendUpdates="all").execute()

        await asyncio.to_thread(_delete)
        return CalendarSyncResult(ok=True)
    except HttpError as exc:
        if exc.resp is not None and exc.resp.status in (404, 410):
            return CalendarSyncResult(ok=True)
        logger.warning(f"Google Calendar cancel_event failed for meeting {meeting.public_id}: {exc}")
        return CalendarSyncResult(ok=False, error=str(exc))
    except RefreshError as exc:
        await _mark_connection_broken(db, connection, str(exc))
        return CalendarSyncResult(ok=False, error=f"Google connection revoked: {exc}")
    except Exception as exc:  # noqa: BLE001
        logger.exception(f"Unexpected error cancelling Google Calendar event for meeting {meeting.public_id}")
        return CalendarSyncResult(ok=False, error=str(exc))


async def _mark_connection_broken(db: AsyncSession, connection: GoogleOAuthConnection, error: str) -> None:
    await GoogleOAuthConnectionRepository.update(
        db, connection, status=GoogleConnectionStatus.ERROR, last_error=error[:500]
    )


async def disconnect(db: AsyncSession, connection: GoogleOAuthConnection) -> None:
    """Best-effort revoke with Google, then always remove the local connection —
    a revoke failure (network blip, already-revoked) must not block the user from
    disconnecting on our side."""
    try:
        refresh_token = decrypt_secret(connection.encrypted_refresh_token)
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post("https://oauth2.googleapis.com/revoke", params={"token": refresh_token})
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Google token revoke failed (continuing with local disconnect): {exc}")
    await GoogleOAuthConnectionRepository.delete(db, connection)
