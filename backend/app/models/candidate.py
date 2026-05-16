from __future__ import annotations
"""Candidate model"""

import uuid
from datetime import date
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, JSON, Date, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.candidate_screening import CandidateScreening
    from app.models.candidate_document import CandidateDocument
    from app.models.candidate_counseling import CandidateCounseling
    from app.models.training_attendance import TrainingAttendance
    from app.models.training_assignment import TrainingAssignment
    from app.models.training_candidate_allocation import TrainingCandidateAllocation
    from app.models.training_mock_interview import TrainingMockInterview
    from app.models.candidate_assignment import CandidateAssignment


class Candidate(BaseModel):
    """Candidate database model"""
    
    __tablename__ = "candidates"
    
    # Public UUID for external API (security)
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    # Basic Details (filled by candidates)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    gender: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    whatsapp_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dob: Mapped[date | None] = mapped_column(Date, nullable=True)
    
    # Address Details
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # JSON Data (filled by candidates)
    guardian_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    work_experience: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    education_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    disability_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    other: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Relationships (filled by trainers)
    screening: Mapped[CandidateScreening] = relationship(
        "CandidateScreening",
        back_populates="candidate",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    documents: Mapped[list[CandidateDocument]] = relationship(
        "CandidateDocument",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
    
    counseling: Mapped[CandidateCounseling] = relationship(
        "CandidateCounseling",
        back_populates="candidate",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    # Training Relationships
    attendance: Mapped[list[TrainingAttendance]] = relationship(
        "TrainingAttendance",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
    
    assignments: Mapped[list["TrainingAssignment"]] = relationship(
        "TrainingAssignment",
        back_populates="candidate",
        cascade="all, delete-orphan",
    )
    
    allocations: Mapped[list[TrainingCandidateAllocation]] = relationship(
        "TrainingCandidateAllocation",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
    
    mock_interviews: Mapped[list[TrainingMockInterview]] = relationship(
        "TrainingMockInterview",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
    
    assignment: Mapped[CandidateAssignment] = relationship(
        "CandidateAssignment",
        back_populates="candidate",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Candidate(id={self.id}, public_id={self.public_id}, name={self.name})>"
