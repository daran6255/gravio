from __future__ import annotations
"""Training Attendance model"""

from datetime import date
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.training_batch import TrainingBatch
    from app.models.candidate import Candidate
    from app.models.training_batch_plan import TrainingBatchPlan


class TrainingAttendance(BaseModel):
    """Training Attendance database model with period-based tracking"""
    
    __tablename__ = "training_attendance"
    
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
    
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    
    # Period-based tracking (nullable for backward compatibility with daily attendance)
    period_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("training_batch_plans.id", ondelete="SET NULL"),
        nullable=True,  # NULL = full day attendance (legacy records)
        index=True
    )
    
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="present") # present, absent, late, half_day
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Trainer notes for period-specific observations
    trainer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relationships
    batch: Mapped[TrainingBatch] = relationship("TrainingBatch")
    candidate: Mapped[Candidate] = relationship("Candidate")
    period: Mapped[TrainingBatchPlan | None] = relationship("TrainingBatchPlan")
    
    def __repr__(self) -> str:
        return f"<TrainingAttendance(batch_id={self.batch_id}, candidate_id={self.candidate_id}, date={self.date}, period_id={self.period_id}, status={self.status})>"
