from __future__ import annotations
"""Training Mock Interview model"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String, Text, DateTime, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.training_batch import TrainingBatch
    from app.models.candidate import Candidate


class TrainingMockInterview(BaseModel):
    """Training Mock Interview database model"""
    
    __tablename__ = "training_mock_interviews"
    
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
    
    interviewer_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    interviewer_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    candidate_token: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    interview_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Structured data
    questions: Mapped[dict | list | None] = mapped_column(JSON, nullable=True) # List of {question, answer}
    skills: Mapped[dict | list | None] = mapped_column(JSON, nullable=True) # List of {skill_name, level, rating}
    others: Mapped[dict | list | None] = mapped_column(JSON, nullable=True) # Extra dynamic fields
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    overall_rating: Mapped[float | None] = mapped_column(Float, nullable=True) # e.g., 1-10
    
    status: Mapped[str] = mapped_column(
        String(20), 
        nullable=False, 
        default="pending",
        index=True
    ) # pending, cleared, re-test, rejected, absent
    
    interview_type: Mapped[str | None] = mapped_column(String(20), nullable=True, default="internal")
    interview_category: Mapped[str | None] = mapped_column(String(20), nullable=True, default="domain")
    start_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    candidate_submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    
    # Relationships
    batch: Mapped[TrainingBatch] = relationship("TrainingBatch")
    candidate: Mapped[Candidate] = relationship("Candidate")
    
    def __repr__(self) -> str:
        return f"<TrainingMockInterview(batch_id={self.batch_id}, candidate_id={self.candidate_id}, status={self.status})>"
