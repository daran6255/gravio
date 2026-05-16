from __future__ import annotations
"""Contact model for CRM"""

import uuid
import enum
from typing import TYPE_CHECKING
from sqlalchemy import String, JSON, Integer, Boolean, ForeignKey, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.lead import Lead
    from app.models.deal import Deal
    from app.models.crm_activity_log import CRMActivityLog


class ContactSource(str, enum.Enum):
    """Contact source enumeration"""
    WEBSITE = "website"
    REFERRAL = "referral"
    EVENT = "event"
    COLD_CALL = "cold_call"
    LINKEDIN = "linkedin"
    OTHER = "other"
    WHATSAPP = "whatsapp"


class Contact(BaseModel):
    """Contact database model"""
    
    __tablename__ = "contacts"
    
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
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    
    # Basic Details
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    
    email: Mapped[str | None] = mapped_column(
        String(255),
        unique=False,
        index=True,
        nullable=True,
        comment="Optional for WhatsApp-sourced contacts",
    )
    
    phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    
    mobile: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    
    designation: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )
    
    department: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Primary contact for the company"
    )
    
    is_decision_maker: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    linkedin_url: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    contact_source: Mapped[ContactSource | None] = mapped_column(
        Enum(ContactSource, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        index=True,
    )
    
    # JSON Fields for Flexible Data
    contact_preferences: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Communication preferences: preferred_method, best_time_to_call, timezone, language"
    )
    
    address: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Contact address if different from company"
    )
    
    custom_fields: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Extensible custom data for contact"
    )
    
    # Relationships
    company: Mapped[Company] = relationship(
        "Company",
        back_populates="contacts",
    )
    
    leads: Mapped[list[Lead]] = relationship(
        "Lead",
        back_populates="contact",
        cascade="all, delete-orphan",
    )
    
    deals: Mapped[list[Deal]] = relationship(
        "Deal",
        back_populates="contact",
        cascade="all, delete-orphan",
    )
    
    crm_activities: Mapped[list[CRMActivityLog]] = relationship(
        "CRMActivityLog",
        foreign_keys="CRMActivityLog.entity_id",
        primaryjoin="and_(Contact.id==CRMActivityLog.entity_id, CRMActivityLog.entity_type=='contact')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    
    @property
    def full_name(self) -> str:
        """Get full name of contact"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self) -> str:
        return f"<Contact(id={self.id}, public_id={self.public_id}, name={self.full_name})>"
