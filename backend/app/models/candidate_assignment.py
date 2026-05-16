from __future__ import annotations
"""Candidate Assignment model for tracking sourcing ownership"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.user import User


class CandidateAssignment(BaseModel):
    """Candidate Assignment database model - links a candidate to a sourcing user"""
    
    __tablename__ = "candidate_assignments"
    
    # Foreign Keys
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="The sourcing user assigned to the candidate"
    )
    
    assigned_by_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
        comment="The manager/admin who performed the assignment"
    )
    
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    candidate: Mapped[Candidate] = relationship("Candidate", back_populates="assignment")
    user: Mapped[User] = relationship("User", foreign_keys=[user_id], back_populates="assigned_candidates")
    assigned_by: Mapped[User] = relationship("User", foreign_keys=[assigned_by_id])
    
    def __repr__(self) -> str:
        return f"<CandidateAssignment(id={self.id}, candidate_id={self.candidate_id}, user_id={self.user_id})>"
