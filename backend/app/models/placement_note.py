from __future__ import annotations
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String, DateTime, Text, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.placement_mapping import PlacementMapping
    from app.models.candidate import Candidate
    from app.models.job_role import JobRole
    from app.models.user import User


class NoteType(str, enum.Enum):
    """Types of placement notes"""
    GENERAL = "general"
    CALL = "call"
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    FOLLOW_UP = "follow_up"


class PlacementNote(BaseModel):
    """Internal notes for a placement mapping"""
    
    __tablename__ = "placement_notes"
    
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
    
    note_type: Mapped[NoteType] = mapped_column(
        String(50),
        nullable=False,
        default=NoteType.GENERAL
    )
    
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    created_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Relationships
    mapping: Mapped["PlacementMapping"] = relationship("PlacementMapping", back_populates="placement_notes")
    candidate: Mapped["Candidate"] = relationship("Candidate")
    job_role: Mapped["JobRole"] = relationship("JobRole")
    created_by: Mapped["User"] = relationship("User")

    @property
    def created_by_name(self) -> str | None:
        if self.created_by:
            return self.created_by.full_name or self.created_by.username
        return None

    def __repr__(self) -> str:
        return f"<PlacementNote(id={self.id}, mapping_id={self.mapping_id}, type={self.note_type})>"
