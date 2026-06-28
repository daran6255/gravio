"""SQLAlchemy models for Gravit CRM module"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, date
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import String, Integer, ForeignKey, Uuid, JSON, DateTime, Date, Numeric, Boolean, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TenantAwareMixin

if TYPE_CHECKING:
    from app.models.user import User


class CompanySize(str, enum.Enum):
    STARTUP = "startup"
    SMALL = "small"
    MEDIUM = "medium"
    ENTERPRISE = "enterprise"


class CompanyStatus(str, enum.Enum):
    PROSPECT = "prospect"
    CUSTOMER = "customer"
    CHURNED = "churned"
    PARTNER = "partner"


class LeadSource(str, enum.Enum):
    WEBSITE = "website"
    REFERRAL = "referral"
    COLD_CALL = "cold_call"
    LINKEDIN = "linkedin"
    AD = "ad"
    EVENT = "event"
    OTHER = "other"


class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    UNQUALIFIED = "unqualified"
    CONVERTED = "converted"


class LeadPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class DealStatus(str, enum.Enum):
    OPEN = "open"
    WON = "won"
    LOST = "lost"
    ON_HOLD = "on_hold"


class ActivityType(str, enum.Enum):
    NOTE = "note"
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    WHATSAPP = "whatsapp"


class CRMTag(BaseModel, TenantAwareMixin):
    """Org-scoped reusable tags for CRM records"""
    __tablename__ = "crm_tags"
    
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="#808080")

    def __repr__(self) -> str:
        return f"<CRMTag(id={self.id}, name='{self.name}')>"


class CRMCompany(BaseModel, TenantAwareMixin):
    """Company profile representing a B2B client or account"""
    __tablename__ = "crm_companies"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    size: Mapped[Optional[CompanySize]] = mapped_column(
        Enum(CompanySize, values_callable=lambda x: [e.value for e in x]), nullable=True
    )
    status: Mapped[CompanyStatus] = mapped_column(
        Enum(CompanyStatus, values_callable=lambda x: [e.value for e in x]), 
        default=CompanyStatus.PROSPECT, nullable=False
    )
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    tags: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    owner: Mapped[Optional[User]] = relationship("User", foreign_keys=[owner_id])
    contacts: Mapped[list[CRMContact]] = relationship("CRMContact", back_populates="company", cascade="all, delete-orphan")
    leads: Mapped[list[CRMLead]] = relationship("CRMLead", back_populates="company")
    deals: Mapped[list[CRMDeal]] = relationship("CRMDeal", back_populates="company")

    def __repr__(self) -> str:
        return f"<CRMCompany(id={self.id}, name='{self.name}')>"


class CRMContact(BaseModel, TenantAwareMixin):
    """A person representing a point of contact inside a company or an independent contact"""
    __tablename__ = "crm_contacts"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mobile: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_companies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tags: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    social_links: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    company: Mapped[Optional[CRMCompany]] = relationship("CRMCompany", back_populates="contacts")
    owner: Mapped[Optional[User]] = relationship("User", foreign_keys=[owner_id])
    leads: Mapped[list[CRMLead]] = relationship("CRMLead", back_populates="contact")
    deals: Mapped[list[CRMDeal]] = relationship("CRMDeal", back_populates="contact")

    def __repr__(self) -> str:
        last_name_str = self.last_name or ""
        return f"<CRMContact(id={self.id}, name='{self.first_name} {last_name_str}')>"


class CRMPipeline(BaseModel, TenantAwareMixin):
    """Sales flow pipeline containing stages"""
    __tablename__ = "crm_pipelines"
    
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    stages: Mapped[list[CRMPipelineStage]] = relationship(
        "CRMPipelineStage", back_populates="pipeline", cascade="all, delete-orphan", order_by="CRMPipelineStage.order"
    )

    def __repr__(self) -> str:
        return f"<CRMPipeline(id={self.id}, name='{self.name}', is_default={self.is_default})>"


class CRMPipelineStage(BaseModel):
    """A stage inside a sales pipeline"""
    __tablename__ = "crm_pipeline_stages"
    
    pipeline_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("crm_pipelines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    probability: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="#808080")
    is_won_stage: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_lost_stage: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    pipeline: Mapped[CRMPipeline] = relationship("CRMPipeline", back_populates="stages")
    deals: Mapped[list[CRMDeal]] = relationship("CRMDeal", back_populates="stage")

    def __repr__(self) -> str:
        return f"<CRMPipelineStage(id={self.id}, name='{self.name}', order={self.order})>"


class CRMLead(BaseModel, TenantAwareMixin):
    """An unqualified sales opportunity or prospect"""
    __tablename__ = "crm_leads"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    company_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_companies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    source: Mapped[Optional[LeadSource]] = mapped_column(
        Enum(LeadSource, values_callable=lambda x: [e.value for e in x]), nullable=True
    )
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, values_callable=lambda x: [e.value for e in x]), default=LeadStatus.NEW, nullable=False
    )
    priority: Mapped[LeadPriority] = mapped_column(
        Enum(LeadPriority, values_callable=lambda x: [e.value for e in x]), default=LeadPriority.MEDIUM, nullable=False
    )
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    estimated_value: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    converted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    deal_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_deals.id", ondelete="SET NULL", use_alter=True, name="fk_crm_leads_deal_id"), nullable=True, index=True
    )
    tags: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_anonymized: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    contact: Mapped[Optional[CRMContact]] = relationship("CRMContact", back_populates="leads")
    company: Mapped[Optional[CRMCompany]] = relationship("CRMCompany", back_populates="leads")
    owner: Mapped[Optional[User]] = relationship("User", foreign_keys=[owner_id])
    deal: Mapped[Optional[CRMDeal]] = relationship("CRMDeal", foreign_keys=[deal_id])

    def __repr__(self) -> str:
        return f"<CRMLead(id={self.id}, title='{self.title}', status='{self.status}')>"


class CRMDeal(BaseModel, TenantAwareMixin):
    """A qualified opportunity moving through sales pipeline stages"""
    __tablename__ = "crm_deals"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_contacts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    company_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_companies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    lead_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_leads.id", ondelete="SET NULL"), nullable=True, index=True
    )
    pipeline_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("crm_pipelines.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    stage_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("crm_pipeline_stages.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    value: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    close_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    probability: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    status: Mapped[DealStatus] = mapped_column(
        Enum(DealStatus, values_callable=lambda x: [e.value for e in x]), default=DealStatus.OPEN, nullable=False
    )
    lost_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    contact: Mapped[Optional[CRMContact]] = relationship("CRMContact", back_populates="deals")
    company: Mapped[Optional[CRMCompany]] = relationship("CRMCompany", back_populates="deals")
    lead: Mapped[Optional[CRMLead]] = relationship("CRMLead", foreign_keys=[lead_id])
    pipeline: Mapped[CRMPipeline] = relationship("CRMPipeline")
    stage: Mapped[CRMPipelineStage] = relationship("CRMPipelineStage", back_populates="deals")
    owner: Mapped[Optional[User]] = relationship("User", foreign_keys=[owner_id])

    def __repr__(self) -> str:
        return f"<CRMDeal(id={self.id}, title='{self.title}', value={self.value})>"


class CRMActivity(BaseModel, TenantAwareMixin):
    """An activity log (note, call, task, WhatsApp message, etc.) associated with a CRM entity"""
    __tablename__ = "crm_activities"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    type: Mapped[ActivityType] = mapped_column(
        Enum(ActivityType, values_callable=lambda x: [e.value for e in x]), nullable=False
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "lead", "deal", "company", "contact"
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    owner: Mapped[Optional[User]] = relationship("User", foreign_keys=[owner_id])

    def __repr__(self) -> str:
        return f"<CRMActivity(id={self.id}, type='{self.type}', subject='{self.subject}')>"


class CRMFile(BaseModel, TenantAwareMixin):
    """An uploaded attachment associated with a CRM entity (lead, deal, company, contact)"""
    __tablename__ = "crm_files"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "lead", "deal", "company", "contact"
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relationships
    owner: Mapped[Optional[User]] = relationship("User", foreign_keys=[owner_id])

    def __repr__(self) -> str:
        return f"<CRMFile(id={self.id}, file_name='{self.file_name}', entity_type='{self.entity_type}', entity_id={self.entity_id})>"
