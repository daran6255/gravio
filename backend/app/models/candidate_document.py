from __future__ import annotations
"""Candidate Document model for managing uploaded documents"""

from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.candidate import Candidate
    from app.models.user import User


class CandidateDocument(BaseModel):
    """Candidate Document database model - for file management"""
    
    __tablename__ = "candidate_documents"
    
    # Foreign Key
    candidate_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Document Information
    document_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )  # 'resume', 'disability_certificate', 'other'
    
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)  # in bytes
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Optional metadata
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Metadata for multiple versions
    document_source: Mapped[str] = mapped_column(
        String(50), 
        nullable=False, 
        default="candidate",
        index=True
    ) # 'candidate', 'trainer'
    
    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False,
        index=True
    )
    
    uploaded_by_id: Mapped[int | None] = mapped_column(
        Integer, 
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationship
    candidate: Mapped[Candidate] = relationship("Candidate", back_populates="documents")
    uploaded_by: Mapped[User | None] = relationship("User")
    
    def __repr__(self) -> str:
        return f"<CandidateDocument(id={self.id}, candidate_id={self.candidate_id}, type={self.document_type})>"
