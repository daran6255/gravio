from __future__ import annotations
"""DSR Leave Application model — separate table for multi-day leaves"""

import uuid
import enum
from datetime import date, datetime
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Integer, Date, DateTime, ForeignKey, Enum, Uuid, Text, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class DSRLeaveStatus(str, enum.Enum):
    """Lifecycle status of a Leave Application"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class DSRLeaveApplication(BaseModel):
    """
    Leave Application — tracks multi-day leave requests separately from DSR entries.
    """

    __tablename__ = "dsr_leave_applications"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    # Who this leave belongs to
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    leave_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[DSRLeaveStatus] = mapped_column(
        Enum(DSRLeaveStatus, values_callable=lambda x: [e.value for e in x]),
        default=DSRLeaveStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Admin review fields
    admin_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    handled_by: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    handled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    user: Mapped[User] = relationship(
        "User",
        foreign_keys=[user_id],
        lazy="selectin",
    )

    handler: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[handled_by],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<DSRLeaveApplication(id={self.id}, public_id={self.public_id}, "
            f"user_id={self.user_id}, start_date={self.start_date}, end_date={self.end_date}, "
            f"status={self.status})>"
        )
