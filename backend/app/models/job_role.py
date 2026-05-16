from __future__ import annotations
"""JobRole model for Placement Management"""

import uuid
import enum
from datetime import date
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, Integer, Date, ForeignKey, JSON, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.contact import Contact
    from app.models.user import User


class JobRoleStatus(str, enum.Enum):
    """Job status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    CLOSED = "closed"


class JobRole(BaseModel):
    """Job Role database model"""
    
    __tablename__ = "job_roles"
    
    # Public UUID for external API security
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    # Primary fields
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    
    status: Mapped[JobRoleStatus] = mapped_column(
        Enum(JobRoleStatus, values_callable=lambda x: [e.value for e in x]),
        default=JobRoleStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    
    is_visible: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    
    no_of_vacancies: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    
    close_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
    
    # Foreign Keys
    company_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    contact_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("contacts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    
    created_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    # JSON Columns (Optimized grouping)
    location: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment='{"cities": [], "state": "", "country": ""}'
    )
    
    salary_range: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment='{"min": float, "max": float, "currency": "INR"}'
    )
    
    experience: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment='{"min": float, "max": float}'
    )
    
    requirements: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment='{"skills": [], "qualifications": [], "disability_preferred": []}'
    )
    
    job_details: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment='{"designation": "", "workplace_type": "", "job_type": ""}'
    )
    
    status_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    deletion_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    other: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    pipeline_stages: Mapped[list[dict] | None] = mapped_column(
        JSON,
        nullable=True,
        comment='[{"id": "string", "label": "string", "category": "lead|shortlisted|interview|offer|hired|rejected|not_joined"}]'
    )
    
    # Relationships
    company: Mapped["Company"] = relationship(
        "Company",
        lazy="selectin",
    )
    
    contact: Mapped["Contact"] = relationship(
        "Contact",
        lazy="selectin",
    )
    
    creator: Mapped["User"] = relationship(
        "User",
        lazy="selectin",
    )
    
    def __repr__(self) -> str:
        return f"<JobRole(id={self.id}, title={self.title}, company_id={self.company_id})>"
