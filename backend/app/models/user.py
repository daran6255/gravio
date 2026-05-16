from __future__ import annotations
"""User model - example database model"""

import enum
import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, Enum, Numeric, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.lead import Lead
    from app.models.deal import Deal
    from app.models.crm_task import CRMTask
    from app.models.crm_activity_log import CRMActivityLog
    from app.models.candidate_assignment import CandidateAssignment
    from app.models.user_email_configuration import UserEmailConfiguration


class UserRole(str, enum.Enum):
    """User role enumeration"""
    ADMIN = "admin"
    MANAGER = "manager"
    SOURCING = "sourcing"
    PLACEMENT = "placement"
    TRAINER = "trainer"
    COUNSELOR = "counselor"
    PROJECT_COORDINATOR = "project_coordinator"
    DEVELOPER = "developer"
    MARKETING = "marketing"


class User(BaseModel):
    """User database model"""
    
    __tablename__ = "users"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    
    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    
    full_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    
    is_superuser: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.PLACEMENT,
        nullable=False,
        index=True,
    )

    mobile: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        index=True,
        comment="Professional/Personal mobile number for WhatsApp link"
    )
    
    # CRM-specific fields
    team: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="Sales team assignment"
    )
    
    sales_quota_monthly: Mapped[float | None] = mapped_column(
        Numeric(15, 2),
        nullable=True,
        comment="Monthly sales target"
    )
    
    commission_percentage: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        comment="Commission rate"
    )
    
    # CRM Relationships
    assigned_leads: Mapped[list[Lead]] = relationship(
        "Lead",
        foreign_keys="Lead.assigned_to",
        back_populates="assigned_user",
    )
    
    assigned_deals: Mapped[list[Deal]] = relationship(
        "Deal",
        foreign_keys="Deal.assigned_to",
        back_populates="assigned_user",
    )
    
    assigned_crm_tasks: Mapped[list[CRMTask]] = relationship(
        "CRMTask",
        foreign_keys="CRMTask.assigned_to",
        back_populates="assigned_user",
    )
    
    created_crm_tasks: Mapped[list[CRMTask]] = relationship(
        "CRMTask",
        foreign_keys="CRMTask.created_by",
        back_populates="creator",
    )
    
    crm_activities: Mapped[list[CRMActivityLog]] = relationship(
        "CRMActivityLog",
        foreign_keys="CRMActivityLog.performed_by",
        back_populates="performer",
    )
    
    assigned_candidates: Mapped[list[CandidateAssignment]] = relationship(
        "CandidateAssignment",
        foreign_keys="CandidateAssignment.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    email_configuration: Mapped[UserEmailConfiguration | None] = relationship(
        "UserEmailConfiguration",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, username={self.username})>"
