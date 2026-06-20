from __future__ import annotations

import uuid
from typing import TYPE_CHECKING
from datetime import datetime
from sqlalchemy import String, Boolean, Uuid, JSON, DateTime, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.plan import Plan

class Organization(BaseModel):
    """Organization model for multi-tenancy"""
    
    __tablename__ = "organizations"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False, 
        unique=True, 
        index=True
    )
    
    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False
    )
    
    others: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    
    subscription_status: Mapped[str] = mapped_column(
        String(50),
        default="trial",
        nullable=False,
    )
    
    trial_started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    
    trial_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Paid plan, if any. Null while on trial or after a trial expires with no plan chosen.
    plan_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("plans.id"),
        nullable=True,
        index=True,
    )

    # Relationships
    users: Mapped[list[User]] = relationship(
        "User",
        back_populates="organization"
    )

    plan: Mapped[Plan | None] = relationship("Plan")
    
    def __repr__(self) -> str:
        return f"<Organization(id={self.id}, name={self.name})>"
