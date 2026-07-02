"""SQLAlchemy model for in-app user notifications"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, Boolean, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TenantAwareMixin

if TYPE_CHECKING:
    from app.models.user import User


class NotificationType(str, enum.Enum):
    LEAD_ASSIGNED = "lead_assigned"
    LEAD_REASSIGNED_AWAY = "lead_reassigned_away"
    LEAD_STATUS_CHANGED = "lead_status_changed"
    LEAD_STALE = "lead_stale"
    DEAL_TASK_ASSIGNED = "deal_task_assigned"
    DEAL_TASK_DUE_SOON = "deal_task_due_soon"
    DEAL_TASK_OVERDUE = "deal_task_overdue"
    DEAL_TASK_COMPLETED = "deal_task_completed"
    REMINDER_DUE = "reminder_due"


class Notification(BaseModel, TenantAwareMixin):
    """An in-app notification delivered to a single user"""
    __tablename__ = "notifications"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, values_callable=lambda x: [e.value for e in x]), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user: Mapped[User] = relationship("User", foreign_keys=[user_id])

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.type}')>"
