"""SQLAlchemy models for the Calendar & Appointment Booking Scheduler.

Design notes (see docs/detailed_integration_plan.md §4 for the original sketch):
- BookingPage stays single-host (BookingPage.user_id), same as the original plan doc.
- ScheduledMeeting carries its own timezone snapshot + Google sync bookkeeping so the
  booking flow degrades gracefully to ICS-only email invites when Google Calendar isn't
  connected or is temporarily unreachable — see app/services/booking.py and
  app/services/google_calendar.py for how these fields are used.
"""

from __future__ import annotations

import enum
import secrets
import uuid
from datetime import date as date_type, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TenantAwareMixin

if TYPE_CHECKING:
    from app.models.crm import CRMLead
    from app.models.user import User


def _generate_manage_token() -> str:
    """256-bit URL-safe token for the no-login client cancel/reschedule link."""
    return secrets.token_urlsafe(32)


class GoogleConnectionStatus(str, enum.Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class BookingLocationType(str, enum.Enum):
    GOOGLE_MEET = "google_meet"
    OFFLINE = "offline"
    PHONE = "phone"


class MeetingStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CalendarSyncStatus(str, enum.Enum):
    NOT_APPLICABLE = "not_applicable"  # host has no Google connection — ICS-only, by design
    PENDING = "pending"                # awaiting first attempt or a retry
    SYNCED = "synced"
    FAILED = "failed"                  # exhausted retries — host has been notified


class CancelledBy(str, enum.Enum):
    HOST = "host"
    CLIENT = "client"
    SYSTEM = "system"


class GoogleOAuthConnection(BaseModel):
    """One row per user who has connected a Google account for Calendar/Meet sync.

    Tokens are Fernet-encrypted at rest (app/core/crypto.py) — never store them plain.
    """
    __tablename__ = "google_oauth_connections"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    google_email: Mapped[str] = mapped_column(String(255), nullable=False)
    encrypted_refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    encrypted_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    access_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    granted_scopes: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    status: Mapped[GoogleConnectionStatus] = mapped_column(
        Enum(GoogleConnectionStatus, values_callable=lambda x: [e.value for e in x]),
        default=GoogleConnectionStatus.CONNECTED,
        nullable=False,
    )
    last_error: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<GoogleOAuthConnection(user_id={self.user_id}, status='{self.status}')>"


class BookingPage(BaseModel, TenantAwareMixin):
    """A single host's public booking page (e.g. 'daran-consulting/15-min-discovery-call')."""
    __tablename__ = "booking_pages"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    location_type: Mapped[BookingLocationType] = mapped_column(
        Enum(BookingLocationType, values_callable=lambda x: [e.value for e in x]),
        default=BookingLocationType.GOOGLE_MEET,
        nullable=False,
    )
    # Free-text address for offline meetings. No Maps API/key involved — the public
    # page just renders this text plus a keyless https://www.google.com/maps/search
    # link built from it at render time.
    offline_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    # Shown to the client when this is a google_meet page but live link generation
    # failed/is pending (host not connected, or a transient Google API failure) — e.g.
    # a host's static personal meeting room URL or a phone number to call instead.
    fallback_meeting_note: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    # { "mon": [["09:00","17:00"]], "tue": [...], ... } in the host's own timezone above
    availability: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    buffer_before_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    buffer_after_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    min_notice_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    max_advance_days: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    max_bookings_per_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    exceptions: Mapped[list["BookingAvailabilityException"]] = relationship(
        "BookingAvailabilityException", back_populates="booking_page", cascade="all, delete-orphan"
    )
    meetings: Mapped[list["ScheduledMeeting"]] = relationship(
        "ScheduledMeeting", back_populates="booking_page", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<BookingPage(id={self.id}, slug='{self.slug}')>"


class BookingAvailabilityException(BaseModel, TenantAwareMixin):
    """A one-off override for a specific date: a full block (holiday/PTO) or custom hours."""
    __tablename__ = "booking_availability_exceptions"

    booking_page_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("booking_pages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    date: Mapped[date_type] = mapped_column(Date, nullable=False, index=True)
    is_blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Overrides the page's weekly availability for this one date when not fully blocked,
    # same shape as one day's entry in BookingPage.availability, e.g. [["10:00","14:00"]]
    custom_slots: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    booking_page: Mapped["BookingPage"] = relationship("BookingPage", back_populates="exceptions")

    def __repr__(self) -> str:
        return f"<BookingAvailabilityException(booking_page_id={self.booking_page_id}, date={self.date}, is_blocked={self.is_blocked})>"


class ScheduledMeeting(BaseModel, TenantAwareMixin):
    """A confirmed booking made through a BookingPage."""
    __tablename__ = "scheduled_meetings"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    booking_page_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("booking_pages.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lead_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_leads.id", ondelete="SET NULL"), nullable=True, index=True
    )

    client_name: Mapped[str] = mapped_column(String(150), nullable=False)
    client_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # Host-created meetings only — falls back to "{booking_page.title} with {client_name}"
    # (see google_calendar._event_body) when not set, e.g. for public self-serve bookings.
    meeting_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    meeting_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Host-created meetings only (see HostScheduleMeetingRequest) — internal teammates
    # invited alongside the client, plus any extra external guests beyond the client.
    # Snapshotted as plain ids/emails at creation time, same denormalized-at-write
    # pattern as client_name/client_email above rather than a live join, so a
    # participant's email/name changing later doesn't retroactively alter past invites.
    participant_user_ids: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    guest_emails: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    host_timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    attendee_timezone: Mapped[str] = mapped_column(String(64), nullable=False)

    status: Mapped[MeetingStatus] = mapped_column(
        Enum(MeetingStatus, values_callable=lambda x: [e.value for e in x]),
        default=MeetingStatus.SCHEDULED,
        nullable=False,
        index=True,
    )

    idempotency_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    manage_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True, default=_generate_manage_token
    )

    calendar_sync_status: Mapped[CalendarSyncStatus] = mapped_column(
        Enum(CalendarSyncStatus, values_callable=lambda x: [e.value for e in x]),
        default=CalendarSyncStatus.NOT_APPLICABLE,
        nullable=False,
        index=True,
    )
    calendar_sync_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    calendar_sync_last_error: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    google_event_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    google_meet_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    cancelled_by: Mapped[Optional[CancelledBy]] = mapped_column(
        Enum(CancelledBy, values_callable=lambda x: [e.value for e in x]), nullable=True
    )
    cancellation_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # RFC5545 SEQUENCE — bumped on every reschedule so calendar clients (Outlook/Apple/
    # Google) correctly replace rather than duplicate a previously-sent invite.
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    booking_page: Mapped["BookingPage"] = relationship("BookingPage", back_populates="meetings")
    lead: Mapped[Optional["CRMLead"]] = relationship("CRMLead", foreign_keys=[lead_id])

    def __repr__(self) -> str:
        return f"<ScheduledMeeting(id={self.id}, start_time={self.start_time}, status='{self.status}')>"
