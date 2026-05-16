from __future__ import annotations
"""Training Batch model"""

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import String, JSON, Date, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.training_candidate_allocation import TrainingCandidateAllocation
    from app.models.training_batch_extension import TrainingBatchExtension


class TrainingBatch(BaseModel):
    """Training Batch database model"""
    
    __tablename__ = "training_batches"
    
    # Public UUID for external API (security)
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    batch_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    disability_types: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=True)
    approx_close_date: Mapped[date] = mapped_column(Date, nullable=True)
    total_extension_days: Mapped[int] = mapped_column(Integer, default=0)
    
    courses: Mapped[dict | list | None] = mapped_column(JSON, nullable=True) # JSON list of courses
    duration: Mapped[dict | None] = mapped_column(JSON, nullable=True) # JSON with start/end/weeks
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="planned", index=True)
    other: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Relationships
    allocations: Mapped[list[TrainingCandidateAllocation]] = relationship(
        "TrainingCandidateAllocation",
        back_populates="batch",
        cascade="all, delete-orphan"
    )
    
    extensions: Mapped[list[TrainingBatchExtension]] = relationship(
        "TrainingBatchExtension",
        back_populates="batch",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<TrainingBatch(id={self.id}, public_id={self.public_id}, batch_name={self.batch_name})>"
