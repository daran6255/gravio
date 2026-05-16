from __future__ import annotations
"""DSR Activity model — planned work items under a DSR project"""

import uuid
import enum
from datetime import date
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, Integer, Date, ForeignKey, Enum, Uuid, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.dsr_project import DSRProject
    from app.models.user import User

from sqlalchemy import Table, Column

# Association table for many-to-many relationship between Activities and Users
activity_assignments = Table(
    "dsr_activity_assignments",
    BaseModel.metadata,
    Column("activity_id", Integer, ForeignKey("dsr_activities.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class DSRActivityStatus(str, enum.Enum):
    """Status of a planned activity"""
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"


class DSRActivity(BaseModel):
    """
    DSR Activity — a planned work item / task belonging to a project.
    Created and managed only by the project owner or Admin.
    """

    __tablename__ = "dsr_activities"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    project_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("dsr_projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    actual_end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    actual_start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    estimated_hours: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    total_actual_hours: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    status: Mapped[DSRActivityStatus] = mapped_column(
        Enum(DSRActivityStatus, values_callable=lambda x: [e.value for e in x]),
        default=DSRActivityStatus.PLANNED,
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    # Extensible metadata
    others: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Extensible metadata (e.g. priority, estimated_hours, labels)",
    )

    # Relationship
    project: Mapped[DSRProject] = relationship(
        "DSRProject",
        back_populates="activities",
        lazy="selectin",
    )

    # Assignments — users assigned to this activity
    assigned_users: Mapped[list[User]] = relationship(
        "User",
        secondary=activity_assignments,
        lazy="selectin",
    )

    # Legacy Assignment (to be deprecated)
    assigned_to: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    assigned_user: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[assigned_to],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<DSRActivity(id={self.id}, public_id={self.public_id}, "
            f"name={self.name}, project_id={self.project_id}, status={self.status})>"
        )
