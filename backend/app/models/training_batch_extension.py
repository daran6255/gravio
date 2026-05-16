"""Training Batch Extension model"""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Integer, Date, ForeignKey, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.training_batch import TrainingBatch


class TrainingBatchExtension(BaseModel):
    """Training Batch Extension history database model"""
    
    __tablename__ = "training_batch_extensions"
    
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )
    
    batch_id: Mapped[int] = mapped_column(Integer, ForeignKey("training_batches.id", ondelete="CASCADE"), nullable=False)
    
    previous_close_date: Mapped[date] = mapped_column(Date, nullable=False)
    new_close_date: Mapped[date] = mapped_column(Date, nullable=False)
    extension_days: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Relationships
    batch: Mapped["TrainingBatch"] = relationship("TrainingBatch", back_populates="extensions")

    def __repr__(self) -> str:
        return f"<TrainingBatchExtension(id={self.id}, batch_id={self.batch_id}, extension_days={self.extension_days})>"
