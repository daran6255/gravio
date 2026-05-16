from __future__ import annotations
import enum
from datetime import date
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String, Date, Text, Float, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.placement_mapping import PlacementMapping
    from app.models.candidate import Candidate
    from app.models.job_role import JobRole
    from app.models.user import User


class OfferResponse(str, enum.Enum):
    """Candidate responses to an offer"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    NEGOTIATING = "negotiating"


class JoiningStatus(str, enum.Enum):
    """Candidate joining status"""
    NOT_JOINED = "not_joined"
    JOINED = "joined"
    DEFERRED = "deferred"


class PlacementOffer(BaseModel):
    """A formal offer sent to a candidate for a job role"""
    
    __tablename__ = "placement_offers"
    
    mapping_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("placement_mappings.id", ondelete="CASCADE"),
        unique=True,
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
    
    offered_ctc: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )
    
    offered_designation: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    
    work_location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    
    joining_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )
    
    offer_letter_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )
    
    offer_letter_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("candidate_documents.id", ondelete="SET NULL"),
        nullable=True
    )
    
    offer_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )
    
    response_deadline: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )
    
    candidate_response: Mapped[OfferResponse] = mapped_column(
        String(50),
        nullable=False,
        default=OfferResponse.PENDING
    )
    
    response_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )
    
    rejection_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    
    actual_joining_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )
    
    joining_status: Mapped[JoiningStatus | None] = mapped_column(
        String(50),
        nullable=True
    )
    
    offered_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Relationships
    mapping: Mapped["PlacementMapping"] = relationship("PlacementMapping", back_populates="offer")
    candidate: Mapped["Candidate"] = relationship("Candidate")
    job_role: Mapped["JobRole"] = relationship("JobRole")
    offered_by: Mapped["User"] = relationship("User", foreign_keys=[offered_by_id])

    def __repr__(self) -> str:
        return f"<PlacementOffer(id={self.id}, mapping_id={self.mapping_id}, candidate_response={self.candidate_response})>"
