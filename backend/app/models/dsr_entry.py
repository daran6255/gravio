from __future__ import annotations
"""DSR Entry model — a user's daily status report"""

import uuid
import enum
from datetime import date, datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Integer, Date, DateTime, ForeignKey, Enum, Uuid, Text, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class DSRStatus(str, enum.Enum):
    """Lifecycle status of a DSR entry"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class DSREntry(BaseModel):
    """
    DSR Entry — one row per user per day.
    `items` holds a JSON array of per-project/activity work logs.

    items schema:
    [
      {
        "project_public_id": "<uuid>",
        "activity_public_id": "<uuid>",
        "description": "...",
        "start_time": "09:00",
        "end_time": "12:30",
        "hours": 3.5
      },
      ...
    ]
    """

    __tablename__ = "dsr_entries"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    # Who this DSR belongs to
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # The day this DSR covers
    report_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    status: Mapped[DSRStatus] = mapped_column(
        Enum(DSRStatus, values_callable=lambda x: [e.value for e in x]),
        default=DSRStatus.DRAFT,
        nullable=False,
        index=True,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Previous-day submission control
    is_previous_day_submission: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
        comment="True when report_date is before today",
    )

    previous_day_permission_granted_by: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Admin user who granted past-day submission permission",
    )

    # Line items — one element per project/activity log
    items: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        comment="Array of work log items: project, activity, description, start_time, end_time, hours",
    )

    # Extensible metadata (also used to log reminder events)
    others: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Extensible metadata, reminder logs, etc.",
    )

    is_leave: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    leave_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    # Admin review fields
    admin_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Admin feedback on approve / rejection",
    )

    reviewed_by: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Admin who approved or rejected this entry",
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when admin reviewed",
    )

    # Relationships
    user: Mapped[User] = relationship(
        "User",
        foreign_keys=[user_id],
        lazy="selectin",
    )

    permission_granter: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[previous_day_permission_granted_by],
        lazy="selectin",
    )

    reviewer: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[reviewed_by],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<DSREntry(id={self.id}, public_id={self.public_id}, "
            f"user_id={self.user_id}, report_date={self.report_date}, status={self.status})>"
        )
