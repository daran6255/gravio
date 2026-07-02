"""SQLAlchemy model for user-configurable CRM reminders"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum, Uuid, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TenantAwareMixin

if TYPE_CHECKING:
    from app.models.user import User


class ReminderStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    CANCELLED = "cancelled"


class CRMReminder(BaseModel, TenantAwareMixin):
    """A user-scheduled reminder attached to a CRM record (lead, deal, deal task, or activity).

    entity_type is a plain string (not a DB enum) to match the existing polymorphic
    pattern used by CRMActivity/CRMFile/Notification.entity_type, so new target
    entity types can be added without a migration.
    """
    __tablename__ = "crm_reminders"
    __table_args__ = (
        Index("ix_crm_reminders_status_remind_at", "status", "remind_at"),
    )

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    remind_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[ReminderStatus] = mapped_column(
        Enum(ReminderStatus, values_callable=lambda x: [e.value for e in x]),
        default=ReminderStatus.PENDING,
        nullable=False,
        index=True,
    )
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped[User] = relationship("User", foreign_keys=[user_id])
    created_by: Mapped[Optional[User]] = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self) -> str:
        return f"<CRMReminder(id={self.id}, entity_type='{self.entity_type}', entity_id={self.entity_id}, status='{self.status}')>"
