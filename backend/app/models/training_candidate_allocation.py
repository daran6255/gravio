from __future__ import annotations
"""Candidate Allocation model"""

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, JSON, Boolean, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.training_batch import TrainingBatch
    from app.models.candidate import Candidate


class TrainingCandidateAllocation(BaseModel):
    """Training Candidate Allocation database model - links candidates to batches"""
    
    __tablename__ = "training_candidate_allocations"
    
    # Public UUID for external API (security)
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    batch_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("training_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Status: 'allocated', 'in_training', 'completed', 'dropped_out', 'placed'
    status: Mapped[str] = mapped_column(String(50), default="allocated", index=True, nullable=False)
    
    is_dropout: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    dropout_remark: Mapped[str | None] = mapped_column(String(500), nullable=True)
    others: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Relationships
    batch: Mapped[TrainingBatch] = relationship("TrainingBatch", back_populates="allocations")
    candidate: Mapped[Candidate] = relationship("Candidate")
    
    def __repr__(self) -> str:
        return f"<TrainingCandidateAllocation(id={self.id}, public_id={self.public_id}, batch_id={self.batch_id}, candidate_id={self.candidate_id})>"
