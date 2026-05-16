import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, Float, Text, DateTime, UniqueConstraint, String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.job_role import JobRole
    from app.models.user import User
    from app.models.placement_pipeline_history import PlacementPipelineHistory
    from app.models.placement_interview import PlacementInterview
    from app.models.placement_offer import PlacementOffer
    from app.models.placement_note import PlacementNote


class PlacementStatus(str, enum.Enum):
    """Pipeline stages for placement mapping.

    Interview rounds L1–L5 are defined statically here.
    The API accepts any 'interview_lN' pattern (N >= 1) dynamically,
    so companies with more than 5 rounds will also work without code changes.
    The DB column is String(50), not a native PG enum, so no migration is needed.
    """
    MAPPED = "mapped"
    SHORTLISTED = "shortlisted"
    INTERVIEW_L1 = "interview_l1"
    INTERVIEW_L2 = "interview_l2"
    INTERVIEW_L3 = "interview_l3"
    INTERVIEW_L4 = "interview_l4"
    INTERVIEW_L5 = "interview_l5"
    TECHNICAL_ROUND = "technical_round"
    HR_ROUND = "hr_round"
    OFFER_MADE = "offer_made"
    OFFERED = "offered"  # Legacy alias for offer_made
    OFFER_ACCEPTED = "offer_accepted"
    OFFER_REJECTED = "offer_rejected"
    JOINED = "joined"
    NOT_JOINED = "not_joined"
    DROPPED = "dropped"
    REJECTED = "rejected"
    ON_HOLD = "on_hold"


class PlacementMapping(BaseModel):
    """Placement Mapping database model - records that a candidate is mapped to a job role"""
    
    __tablename__ = "placement_mappings"
    
    # Foreign Keys
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
    
    mapped_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Mapping Data
    match_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        default=0.0,
        comment="Calculated match score at the time of mapping"
    )
    
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Reasoning or notes for the mapping"
    )
    
    mapped_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Pipeline Data
    status: Mapped[PlacementStatus] = mapped_column(
        String(50),
        default=PlacementStatus.MAPPED,
        nullable=False,
        index=True
    )
    
    priority: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        default="medium",
        comment="high, medium, low"
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    unmapped_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    unmapped_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
    
    unmapped_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    
    source: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        default="manual"
    )
    
    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate")
    job_role: Mapped["JobRole"] = relationship("JobRole")
    mapped_by: Mapped["User"] = relationship("User", foreign_keys=[mapped_by_id])
    unmapped_by: Mapped["User"] = relationship("User", foreign_keys=[unmapped_by_id])
    
    history: Mapped[list["PlacementPipelineHistory"]] = relationship(
        "PlacementPipelineHistory",
        back_populates="mapping",
        cascade="all, delete-orphan"
    )
    
    interviews: Mapped[list["PlacementInterview"]] = relationship(
        "PlacementInterview",
        back_populates="mapping",
        cascade="all, delete-orphan"
    )
    
    offer: Mapped["PlacementOffer"] = relationship(
        "PlacementOffer",
        back_populates="mapping",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    placement_notes: Mapped[list["PlacementNote"]] = relationship(
        "PlacementNote",
        back_populates="mapping",
        cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("candidate_id", "job_role_id", name="uq_candidate_job_role_mapping"),
    )
    
    def __repr__(self) -> str:
        return f"<PlacementMapping(id={self.id}, candidate_id={self.candidate_id}, job_role_id={self.job_role_id}, status={self.status})>"
