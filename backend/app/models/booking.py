"""SQLAlchemy models for Meetings — a host schedules a meeting directly with a
client at a date/time/location of their choosing. No public booking page, no
availability rules, no Google Calendar integration: the host has full freedom
over when and how a meeting happens, and every meeting still gets a working
.ics calendar invite by email (see app/utils/ics.py, app/utils/email.py).
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
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

    host: Mapped["User"] = relationship("User", foreign_keys=[host_user_id])
    lead: Mapped[Optional["CRMLead"]] = relationship("CRMLead", foreign_keys=[lead_id])

    def __repr__(self) -> str:
        return f"<ScheduledMeeting(id={self.id}, start_time={self.start_time}, status='{self.status}')>"
