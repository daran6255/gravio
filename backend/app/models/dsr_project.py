from __future__ import annotations
import uuid
import enum
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, ForeignKey, Uuid, Enum, Table, Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.dsr_activity import DSRActivity
    from app.models.training_batch import TrainingBatch


class DSRProjectType(str, enum.Enum):
    """Type of DSR project"""
    STANDARD = "standard"
    TRAINING = "training"


# Association table for many-to-many relationship between Projects and Training Batches
dsr_project_batches = Table(
    "dsr_project_batch_association",
    BaseModel.metadata,
    Column("project_id", Integer, ForeignKey("dsr_projects.id", ondelete="CASCADE"), primary_key=True),
    Column("batch_id", Integer, ForeignKey("training_batches.id", ondelete="CASCADE"), primary_key=True),
)


class DSRProject(BaseModel):
    """DSR Project - created by Manager/Admin, assigned to an owner user."""

    __tablename__ = "dsr_projects"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    project_type: Mapped[DSRProjectType] = mapped_column(
        Enum(DSRProjectType, values_callable=lambda x: [e.value for e in x]),
        default=DSRProjectType.STANDARD,
        nullable=False,
        index=True,
    )

    # For training projects, link to a batch
    linked_batch_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("training_batches.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Owner — the user responsible for this project (set by Manager/Admin)
    owner_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Creator — who created this project record
    created_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    # Extensible metadata
    others: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Extensible project metadata (e.g. client, priority, tags)",
    )

    # Relationships
    owner: Mapped[User] = relationship(
        "User",
        foreign_keys=[owner_id],
        lazy="selectin",
    )

    creator: Mapped[User] = relationship(
        "User",
        foreign_keys=[created_by],
        lazy="selectin",
    )

    linked_batch: Mapped[TrainingBatch | None] = relationship(
        "TrainingBatch",
        foreign_keys=[linked_batch_id],
        lazy="selectin",
    )

    linked_batches: Mapped[list[TrainingBatch]] = relationship(
        "TrainingBatch",
        secondary=dsr_project_batches,
        lazy="selectin",
    )

    activities: Mapped[list[DSRActivity]] = relationship(
        "DSRActivity",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<DSRProject(id={self.id}, public_id={self.public_id}, name={self.name})>"
