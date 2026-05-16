from __future__ import annotations
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String, DateTime, Text, Float, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.placement_mapping import PlacementMapping
    from app.models.candidate import Candidate
    from app.models.job_role import JobRole
    from app.models.user import User


class InterviewRoundType(str, enum.Enum):
    """Types of interview rounds"""
    L1 = "L1"
    L2 = "L2"
    TECHNICAL = "technical"
    HR = "hr"
    CULTURAL_FIT = "cultural_fit"


class InterviewMode(str, enum.Enum):
    """Modes of interview"""
    IN_PERSON = "in_person"
    VIRTUAL = "virtual"
    PHONE = "phone"


class InterviewResult(str, enum.Enum):
    """Results of interview rounds"""
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class PlacementInterview(BaseModel):
    """A single interview round for a placement mapping"""
    
    __tablename__ = "placement_interviews"
    
    mapping_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("placement_mappings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    job_role_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("job_roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    round_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )
    
    round_type: Mapped[InterviewRoundType] = mapped_column(
        String(50),
        nullable=False
    )
    
    mode: Mapped[InterviewMode] = mapped_column(
        String(50),
        nullable=False,
        default=InterviewMode.VIRTUAL
    )
    
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
    
    conducted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
    
    duration_minutes: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )
    
    interviewer_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    
    interviewer_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    interview_link: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )
    
    venue: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    
    result: Mapped[InterviewResult] = mapped_column(
        String(50),
        nullable=False,
        default=InterviewResult.PENDING
    )
    
    score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )
    
    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    
    feedback_json: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment='{"communication": float, "tech": float, "culture": float, "comments": ""}'
    )
    
    scheduled_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Relationships
    mapping: Mapped["PlacementMapping"] = relationship("PlacementMapping", back_populates="interviews")
    candidate: Mapped["Candidate"] = relationship("Candidate")
    job_role: Mapped["JobRole"] = relationship("JobRole")
    interviewer: Mapped["User"] = relationship("User", foreign_keys=[interviewer_id])
    scheduled_by: Mapped["User"] = relationship("User", foreign_keys=[scheduled_by_id])

    def __repr__(self) -> str:
        return f"<PlacementInterview(id={self.id}, mapping_id={self.mapping_id}, round_number={self.round_number}, result={self.result})>"
