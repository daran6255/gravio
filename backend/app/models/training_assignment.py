from __future__ import annotations
"""Training Assignment model"""

from datetime import date
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String, Float, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.training_batch import TrainingBatch
    from app.models.candidate import Candidate
    from app.models.user import User


class TrainingAssignment(BaseModel):
    """Training Assignment database model"""
    
    __tablename__ = "training_assignments"
    
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
    
    assignment_name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    course_name: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    course_marks: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    trainer_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    marks_obtained: Mapped[float] = mapped_column(Float, nullable=False)
    max_marks: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    assignment_date: Mapped[date] = mapped_column(Date, nullable=False)
    submission_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    others: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Relationships
    batch: Mapped[TrainingBatch] = relationship("TrainingBatch")
    candidate: Mapped[Candidate] = relationship("Candidate")
    trainer: Mapped[User] = relationship("User")
    
    def __repr__(self) -> str:
        return f"<TrainingAssignment(batch_id={self.batch_id}, candidate_id={self.candidate_id}, name={self.assignment_name}, marks={self.marks_obtained}/{self.max_marks})>"
