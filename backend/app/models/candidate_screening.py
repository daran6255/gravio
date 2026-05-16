from __future__ import annotations
"""Candidate Screening model for trainer-filled screening data"""

from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, JSON, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from datetime import datetime

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.user import User


class CandidateScreening(BaseModel):
    """Candidate Screening database model - filled by trainers"""
    
    __tablename__ = "candidate_screenings"
    
    # Foreign Key
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    
    # Status field for screening process
    status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Consent Management
    consent_status: Mapped[str | None] = mapped_column(String(50), nullable=True) # None, Pending, Accepted
    consent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    consent_ip: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Screening Data (JSON fields)
    previous_training: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    documents_upload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    skills: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    family_details: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)
    others: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Metadata
    screened_by_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationship
    candidate: Mapped[Candidate] = relationship("Candidate", back_populates="screening")
    screened_by: Mapped[User] = relationship("User")
    
    def __repr__(self) -> str:
        return f"<CandidateScreening(id={self.id}, candidate_id={self.candidate_id})>"
