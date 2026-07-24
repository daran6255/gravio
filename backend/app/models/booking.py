"""SQLAlchemy models for Meetings — a host schedules a meeting directly with a
client at a date/time/location of their choosing. No public booking page, no
availability rules, no Google Calendar integration: the host has full freedom
over when and how a meeting happens, and every meeting still gets a working
.ics calendar invite by email (see app/utils/ics.py, app/utils/email.py).
"""

from __future__ import annotations

import enum
import uuid
from datetime import date, datetime, time
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
    Time,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TenantAwareMixin

if TYPE_CHECKING:
    from app.models.crm import CRMLead
    from app.models.user import User


class MeetingLocationType(str, enum.Enum):
    GOOGLE_MEET = "google_meet"
    OFFLINE = "offline"
    PHONE = "phone"


class MeetingStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CancelledBy(str, enum.Enum):
    HOST = "host"
    CLIENT = "client"
    SYSTEM = "system"


class RecurrenceRule(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"


class ScheduledMeeting(BaseModel, TenantAwareMixin):
    """A meeting a host schedules directly with a client."""
    __tablename__ = "scheduled_meetings"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    host_user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lead_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_leads.id", ondelete="SET NULL"), nullable=True, index=True
    )

    client_name: Mapped[str] = mapped_column(String(150), nullable=False)
    client_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    meeting_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    meeting_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    location_type: Mapped[MeetingLocationType] = mapped_column(
        Enum(MeetingLocationType, values_callable=lambda x: [e.value for e in x]),
        default=MeetingLocationType.GOOGLE_MEET,
        nullable=False,
    )
    # Free text the host fills in directly: a video-call link (google_meet or any
    # other provider), a physical address (offline), or a phone number (phone) — no
    # calendar integration generates this automatically anymore.
    location_detail: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Internal teammates invited alongside the client, plus any extra external
    # guests beyond the client. Snapshotted as plain ids/emails at creation time
    # rather than a live join, so a participant's email/name changing later doesn't
    # retroactively alter past invites.
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

    cancelled_by: Mapped[Optional[CancelledBy]] = mapped_column(
        Enum(CancelledBy, values_callable=lambda x: [e.value for e in x]), nullable=True
    )
    cancellation_reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # RFC5545 SEQUENCE — bumped on every reschedule/cancel so calendar clients
    # (Outlook/Apple/Google) correctly replace rather than duplicate a prior invite.
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Free-form notes a host adds after the meeting happens (see app/services/booking.py
    # complete_meeting) — independent of status so a host can annotate without re-triggering
    # a state transition.
    outcome_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Recurrence: null rule means a one-off meeting. Recurring meetings are materialized
    # as one row per occurrence at creation time (not expanded virtually at read time), so
    # each occurrence can be individually rescheduled/cancelled/completed like any other
    # meeting. All occurrences in one series share recurrence_group_id (the first
    # occurrence's own public_id).
    recurrence_rule: Mapped[Optional[RecurrenceRule]] = mapped_column(
        Enum(RecurrenceRule, values_callable=lambda x: [e.value for e in x]), nullable=True
    )
    recurrence_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    recurrence_group_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, nullable=True, index=True)

    # Dedup markers for the client-reminder poller (app/services/meeting_scheduler.py) —
    # set once each reminder is sent so a restarted/duplicated poller never double-sends.
    client_reminder_24h_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    client_reminder_1h_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    host: Mapped["User"] = relationship("User", foreign_keys=[host_user_id])
    lead: Mapped[Optional["CRMLead"]] = relationship("CRMLead", foreign_keys=[lead_id])

    def __repr__(self) -> str:
        return f"<ScheduledMeeting(id={self.id}, start_time={self.start_time}, status='{self.status}')>"


# ---------------------------------------------------------------------------
# Public self-service booking ("book a slot with me") — a host publishes a
# weekly availability schedule behind a revocable share link; a client picks an
# open slot themselves instead of the host creating every meeting by hand. Slot
# computation and the actual meeting creation both live in app/services/booking.py
# (compute_available_slots / public_book_slot), reusing create_meeting so a
# self-booked meeting is a completely ordinary ScheduledMeeting afterward.
# ---------------------------------------------------------------------------

class HostAvailabilitySettings(BaseModel, TenantAwareMixin):
    """One row per user — their public booking page configuration. Created lazily
    (see get_or_create_availability_settings) the first time a user opens their
    own availability settings, same lazy-seed convention used elsewhere in the app."""
    __tablename__ = "host_availability_settings"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # Looked up directly (no organization scoping needed -- it's the credential
    # itself) by an unauthenticated visitor; rotates on regenerate, which is how an
    # old link is revoked. Mirrors Project's share_token/share_enabled pattern.
    share_token: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, unique=True, index=True, nullable=True)

    meeting_type_name: Mapped[str] = mapped_column(String(150), default="Meeting", nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    buffer_minutes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # A slot can't start less than this many hours from now -- gives the host some
    # lead time instead of a client booking a meeting starting in two minutes.
    min_notice_hours: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    # How many days ahead a client can see/book a slot.
    booking_window_days: Mapped[int] = mapped_column(Integer, default=30, nullable=False)

    # IANA timezone the weekly rules below are defined in -- defaults to the host's
    # own User.timezone at creation time, but kept independent of it afterward (a
    # host changing their profile timezone shouldn't silently reinterpret an
    # already-published weekly schedule).
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)

    location_type: Mapped[MeetingLocationType] = mapped_column(
        Enum(MeetingLocationType, values_callable=lambda x: [e.value for e in x]),
        default=MeetingLocationType.GOOGLE_MEET,
        nullable=False,
    )
    # For offline/phone, the address/number reused on every booking. For
    # google_meet, an explicit host-set link (e.g. a personal Zoom room) reused as-
    # is; left blank, a fresh Jitsi room is generated per booking instead (see
    # _resolve_booking_location in services/booking.py) so simultaneous bookings
    # never collide in the same room.
    location_detail: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
    rules: Mapped[list["HostAvailabilityRule"]] = relationship(
        "HostAvailabilityRule", back_populates="settings", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<HostAvailabilitySettings(user_id={self.user_id}, is_enabled={self.is_enabled})>"


class HostAvailabilityRule(BaseModel, TenantAwareMixin):
    """One recurring weekly availability window (e.g. Monday 9:00-17:00). A host can
    have several rows for the same weekday (a morning window and an afternoon
    window with a lunch gap between); slot generation treats each independently."""
    __tablename__ = "host_availability_rules"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    settings_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("host_availability_settings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # 0=Monday .. 6=Sunday, matching Python's date.weekday() -- same convention
    # already used for is_weekly_off in app/services/timesheet.py.
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

    settings: Mapped["HostAvailabilitySettings"] = relationship("HostAvailabilitySettings", back_populates="rules")

    def __repr__(self) -> str:
        return f"<HostAvailabilityRule(user_id={self.user_id}, weekday={self.weekday}, {self.start_time}-{self.end_time})>"
