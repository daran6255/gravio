from __future__ import annotations

import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class TrialEmailRegistry(BaseModel):
    """Registry table keeping a permanent record of all email addresses that registered a free trial.
    Used for trial abuse prevention.
    """
    __tablename__ = "trial_email_registry"
    
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    
    registered_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
    organization_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    
    def __repr__(self) -> str:
        return f"<TrialEmailRegistry(id={self.id}, email={self.email}, org={self.organization_name})>"
