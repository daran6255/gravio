from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey, String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.placement_mapping import PlacementMapping
    from app.models.candidate import Candidate
    from app.models.job_role import JobRole
    from app.models.user import User


class PlacementPipelineHistory(BaseModel):
    """Tracking status changes for a placement mapping"""
    
    __tablename__ = "placement_pipeline_history"
    
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
    
    from_status: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )
    
    to_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
    
    changed_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    
    changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    remarks: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )
    
    # Relationships
    mapping: Mapped["PlacementMapping"] = relationship("PlacementMapping", back_populates="history")
    candidate: Mapped["Candidate"] = relationship("Candidate")
    job_role: Mapped["JobRole"] = relationship("JobRole")
    changed_by: Mapped["User"] = relationship("User")
    
    @property
    def changed_by_name(self) -> Optional[str]:
        if self.changed_by:
            return self.changed_by.full_name
        return None

    def __repr__(self) -> str:
        return f"<PlacementPipelineHistory(id={self.id}, mapping_id={self.mapping_id}, to_status={self.to_status})>"
