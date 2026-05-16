from __future__ import annotations
"""Deal model for CRM"""

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
    from app.models.lead import Lead
    from app.models.user import User
    from app.models.crm_task import CRMTask
    from app.models.crm_activity_log import CRMActivityLog


class DealStage(str, enum.Enum):
    """Deal stage enumeration"""
    DISCOVERY = "discovery"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class DealType(str, enum.Enum):
    """Deal type enumeration"""
    NEW_BUSINESS = "new_business"
    UPSELL = "upsell"
    RENEWAL = "renewal"
    CROSS_SELL = "cross_sell"


class Deal(BaseModel):
    """Deal database model"""
    
    __tablename__ = "deals"
    
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
    
    lead_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("leads.id", ondelete="SET NULL"),
        nullable=True,
        comment="Original lead if converted from lead"
    )
    
    assigned_to: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
        comment="Account owner responsible for this deal"
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
    
    # Deal Stage and Type
    deal_stage: Mapped[DealStage] = mapped_column(
        Enum(DealStage, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    
    deal_type: Mapped[DealType] = mapped_column(
        Enum(DealType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
    )
    
    win_probability: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Win probability percentage 0-100"
    )
    
    # Financial Details
    deal_value: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        index=True,
    )
    
    currency: Mapped[str] = mapped_column(
        String(3),
        default="INR",
        nullable=False,
    )
    
    payment_terms: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    
    contract_duration_months: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    
    # Dates
    expected_close_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    
    actual_close_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    
    # Lost Information
    lost_reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    lost_to_competitor: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    # JSON Fields for Flexible Data
    competitors: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Array of competitor information"
    )
    
    products_services: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Items in the deal: product_id, name, quantity, unit_price, discount, total"
    )
    
    next_action: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Next action details: action, due_date, assigned_to"
    )
    
    custom_fields: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Extensible custom data for deal"
    )
    
    # Relationships
    company: Mapped[Company] = relationship(
        "Company",
        back_populates="deals",
    )
    
    contact: Mapped[Contact] = relationship(
        "Contact",
        back_populates="deals",
    )
    
    original_lead: Mapped[Lead] = relationship(
        "Lead",
        foreign_keys=[lead_id],
    )
    
    assigned_user: Mapped[User] = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_deals",
    )
    
    tasks: Mapped[list[CRMTask]] = relationship(
        "CRMTask",
        foreign_keys="CRMTask.related_to_id",
        primaryjoin="and_(Deal.id==CRMTask.related_to_id, CRMTask.related_to_type=='deal')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    
    crm_activities: Mapped[list[CRMActivityLog]] = relationship(
        "CRMActivityLog",
        foreign_keys="CRMActivityLog.entity_id",
        primaryjoin="and_(Deal.id==CRMActivityLog.entity_id, CRMActivityLog.entity_type=='deal')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    
    def __repr__(self) -> str:
        return f"<Deal(id={self.id}, public_id={self.public_id}, title={self.title}, stage={self.deal_stage})>"
