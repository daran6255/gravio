from __future__ import annotations
"""Lead model for CRM"""

import uuid
import enum
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, JSON, Integer, Numeric, Date, DateTime, ForeignKey, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.user import User
    from app.models.deal import Deal
    from app.models.crm_task import CRMTask
    from app.models.crm_activity_log import CRMActivityLog


class LeadSource(str, enum.Enum):
    """Lead source enumeration"""
    WEBSITE = "website"
    REFERRAL = "referral"
    CAMPAIGN = "campaign"
    EVENT = "event"
    COLD_CALL = "cold_call"
    SOCIAL_MEDIA = "social_media"
    PARTNER = "partner"
    WHATSAPP = "whatsapp"


class LeadStatus(str, enum.Enum):
    """Lead status enumeration"""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    LOST = "lost"


class Lead(BaseModel):
    """Lead database model"""
    
    __tablename__ = "leads"
    
    # Public UUID for external API (security)
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    # Foreign Keys
    company_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    contact_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("contacts.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    assigned_to: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Sales rep responsible for this lead"
    )
    
    converted_to_deal_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("deals.id", ondelete="SET NULL"),
        nullable=True,
        comment="Deal ID if this lead was converted"
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
    
    lead_source: Mapped[LeadSource] = mapped_column(
        Enum(LeadSource, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    
    lead_status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, values_callable=lambda x: [e.value for e in x]),
        default=LeadStatus.NEW,
        nullable=False,
        index=True,
    )
    
    lead_score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        index=True,
        comment="Lead scoring 0-100"
    )
    
    # Financial Details
    estimated_value: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )
    
    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        nullable=False,
    )
    
    # Dates
    expected_close_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )
    
    conversion_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    # Lost Information
    lost_reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # JSON Fields for Flexible Data
    tags: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Array of tags for categorization"
    )
    
    qualification_notes: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="BANT/CHAMP qualification: budget, authority, need, timeline, pain_points"
    )
    
    utm_data: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Marketing attribution: utm_source, utm_medium, utm_campaign, landing_page"
    )
    
    custom_fields: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Extensible custom data for lead"
    )
    
    # Relationships
    company: Mapped[Company] = relationship(
        "Company",
        back_populates="leads",
    )
    
    contact: Mapped[Contact] = relationship(
        "Contact",
        back_populates="leads",
    )
    
    assigned_user: Mapped[User] = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_leads",
    )
    
    converted_deal: Mapped[Deal] = relationship(
        "Deal",
        foreign_keys=[converted_to_deal_id],
        uselist=False,
    )
    
    tasks: Mapped[list[CRMTask]] = relationship(
        "CRMTask",
        foreign_keys="CRMTask.related_to_id",
        primaryjoin="and_(Lead.id==CRMTask.related_to_id, CRMTask.related_to_type=='lead')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    
    crm_activities: Mapped[list[CRMActivityLog]] = relationship(
        "CRMActivityLog",
        foreign_keys="CRMActivityLog.entity_id",
        primaryjoin="and_(Lead.id==CRMActivityLog.entity_id, CRMActivityLog.entity_type=='lead')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    
    def __repr__(self) -> str:
        return f"<Lead(id={self.id}, public_id={self.public_id}, title={self.title}, status={self.lead_status})>"
