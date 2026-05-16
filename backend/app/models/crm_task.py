from __future__ import annotations
"""CRM Task model"""

import uuid
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, JSON, Integer, Boolean, DateTime, ForeignKey, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.crm_activity_log import CRMActivityLog


class CRMTaskType(str, enum.Enum):
    """CRM Task type enumeration"""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    FOLLOW_UP = "follow_up"
    DEMO = "demo"
    PROPOSAL = "proposal"
    OTHER = "other"


class CRMTaskPriority(str, enum.Enum):
    """CRM Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class CRMTaskStatus(str, enum.Enum):
    """CRM Task status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CRMRelatedToType(str, enum.Enum):
    """Related entity type enumeration"""
    LEAD = "lead"
    DEAL = "deal"
    COMPANY = "company"
    CONTACT = "contact"


class CRMTask(BaseModel):
    """CRM Task database model"""
    
    __tablename__ = "crm_tasks"
    
    # Public UUID for external API (security)
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    # Basic Details
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    task_type: Mapped[CRMTaskType] = mapped_column(
        Enum(CRMTaskType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    
    priority: Mapped[CRMTaskPriority] = mapped_column(
        Enum(CRMTaskPriority, values_callable=lambda x: [e.value for e in x]),
        default=CRMTaskPriority.MEDIUM,
        nullable=False,
        index=True,
    )
    
    status: Mapped[CRMTaskStatus] = mapped_column(
        Enum(CRMTaskStatus, values_callable=lambda x: [e.value for e in x]),
        default=CRMTaskStatus.PENDING,
        nullable=False,
        index=True,
    )
    
    # Foreign Keys
    assigned_to: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    
    created_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    
    # Polymorphic relationship to different entities
    related_to_type: Mapped[CRMRelatedToType | None] = mapped_column(
        Enum(CRMRelatedToType, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        index=True,
    )
    
    related_to_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )
    
    # Dates
    due_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    
    completed_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Reminder Settings
    is_reminder_sent: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    reminder_before_minutes: Mapped[int] = mapped_column(
        Integer,
        default=30,
        nullable=False,
    )
    
    # JSON Fields for Flexible Data
    outcome: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Result of task: status, notes, next_steps, time_spent_minutes"
    )
    
    attachments: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        comment="File references: file_name, file_url, uploaded_at"
    )
    
    custom_fields: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Extensible custom data for task"
    )
    
    # Relationships
    assigned_user: Mapped[User] = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_crm_tasks",
    )
    
    creator: Mapped[User] = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="created_crm_tasks",
    )
    
    crm_activities: Mapped[list[CRMActivityLog]] = relationship(
        "CRMActivityLog",
        foreign_keys="CRMActivityLog.entity_id",
        primaryjoin="and_(CRMTask.id==CRMActivityLog.entity_id, CRMActivityLog.entity_type=='task')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    
    @property
    def is_overdue(self) -> bool:
        """Check if task is overdue"""
        if self.status in [CRMTaskStatus.COMPLETED, CRMTaskStatus.CANCELLED]:
            return False
        return datetime.now() > self.due_date
    
    def __repr__(self) -> str:
        return f"<CRMTask(id={self.id}, public_id={self.public_id}, title={self.title}, status={self.status})>"
