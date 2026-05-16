"""Company model for CRM"""

import uuid
import enum
from sqlalchemy import String, JSON, Enum, and_, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship, foreign, remote
from app.models.crm_task import CRMRelatedToType
from app.models.base import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.contact import Contact
    from app.models.lead import Lead
    from app.models.deal import Deal
    from app.models.crm_activity_log import CRMActivityLog
    from app.models.crm_task import CRMTask


class CompanySize(str, enum.Enum):
    """Company size enumeration"""
    MICRO = "micro"  # 1-10 employees
    SMALL = "small"  # 11-50 employees
    MEDIUM = "medium"  # 51-250 employees
    LARGE = "large"  # 251-1000 employees
    ENTERPRISE = "enterprise"  # 1000+ employees


class CompanyStatus(str, enum.Enum):
    """Company status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PROSPECT = "prospect"
    CUSTOMER = "customer"


class Company(BaseModel):
    """Company database model"""
    
    __tablename__ = "companies"
    
    # Public UUID for external API (security)
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    # Basic Details
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    
    industry: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )
    
    company_size: Mapped[CompanySize | None] = mapped_column(
        Enum(CompanySize, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    
    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    
    status: Mapped[CompanyStatus] = mapped_column(
        Enum(CompanyStatus, values_callable=lambda x: [e.value for e in x]),
        default=CompanyStatus.PROSPECT,
        nullable=False,
        index=True,
    )
    
    # JSON Fields for Flexible Data
    address: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Company address details: street, city, state, country, pincode"
    )
    
    social_media: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Social media profiles: linkedin, twitter, facebook"
    )
    
    custom_fields: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Extensible custom data for company"
    )
    
    # Relationships
    contacts: Mapped[list["Contact"]] = relationship(
        "Contact",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    
    leads: Mapped[list["Lead"]] = relationship(
        "Lead",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    
    deals: Mapped[list["Deal"]] = relationship(
        "Deal",
        back_populates="company",
        cascade="all, delete-orphan",
    )
    
    crm_activities: Mapped[list["CRMActivityLog"]] = relationship(
        "CRMActivityLog",
        foreign_keys="CRMActivityLog.entity_id",
        primaryjoin="and_(Company.id==CRMActivityLog.entity_id, CRMActivityLog.entity_type=='company')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    
    tasks: Mapped[list["CRMTask"]] = relationship(
        "CRMTask",
        foreign_keys="CRMTask.related_to_id",
        primaryjoin="and_(Company.id==CRMTask.related_to_id, CRMTask.related_to_type=='company')",
        cascade="all, delete-orphan",
        viewonly=True,
    )
    
    def __repr__(self) -> str:
        return f"<Company(id={self.id}, public_id={self.public_id}, name={self.name})>"
