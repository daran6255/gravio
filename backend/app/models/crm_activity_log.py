from __future__ import annotations
"""CRM Activity Log model for tracking CRM entity changes"""

import uuid
import enum
from typing import TYPE_CHECKING

from sqlalchemy import String, JSON, Integer, ForeignKey, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class CRMEntityType(str, enum.Enum):
    """CRM Entity type enumeration"""
    COMPANY = "company"
    CONTACT = "contact"
    LEAD = "lead"
    DEAL = "deal"
    TASK = "task"


class CRMActivityType(str, enum.Enum):
    """CRM Activity type enumeration"""
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    STATUS_CHANGED = "status_changed"
    EMAIL_SENT = "email_sent"
    CALL_MADE = "call_made"
    MEETING_HELD = "meeting_held"
    NOTE_ADDED = "note_added"
    STAGE_CHANGED = "stage_changed"
    CONVERTED = "converted"
    WHATSAPP_MESSAGE = "whatsapp_message"


class CRMActivityLog(BaseModel):
    """CRM Activity log database model for audit trail"""
    
    __tablename__ = "crm_activity_logs"
    
    # Public UUID for external API (security)
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    # Entity Reference (Polymorphic)
    entity_type: Mapped[CRMEntityType] = mapped_column(
        Enum(CRMEntityType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    
    entity_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )
    
    # Activity Details
    activity_type: Mapped[CRMActivityType] = mapped_column(
        Enum(CRMActivityType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    
    performed_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=False,
        index=True,
    )
    
    summary: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )
    
    # JSON Fields for Flexible Data
    details: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Detailed activity data: old_value, new_value, field_changed, ip_address, user_agent"
    )
    
    extra_data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Additional context for the activity"
    )
    
    # Relationships
    performer: Mapped[User] = relationship(
        "User",
        foreign_keys=[performed_by],
        back_populates="crm_activities",
    )
    
    def __repr__(self) -> str:
        return f"<CRMActivityLog(id={self.id}, entity_type={self.entity_type}, activity_type={self.activity_type})>"
