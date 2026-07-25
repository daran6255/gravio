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
    LEAD_TASK_ASSIGNED = "lead_task_assigned"
    LEAD_TASK_COMPLETED = "lead_task_completed"
    REMINDER_DUE = "reminder_due"
    TRIAL_EXTENSION_REQUESTED = "trial_extension_requested"
    MEETING_RESCHEDULED_BY_CLIENT = "meeting_rescheduled_by_client"
    MEETING_CANCELLED_BY_CLIENT = "meeting_cancelled_by_client"
    TIMESHEET_WEEK_UNSUBMITTED = "timesheet_week_unsubmitted"
    TIMESHEET_PENDING_APPROVALS = "timesheet_pending_approvals"
    LEAVE_REQUEST_SUBMITTED = "leave_request_submitted"
    LEAVE_REQUEST_APPROVED = "leave_request_approved"
    LEAVE_REQUEST_REJECTED = "leave_request_rejected"
    AI_PROVIDER_EXHAUSTED = "ai_provider_exhausted"


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
