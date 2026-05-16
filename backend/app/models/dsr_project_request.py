from __future__ import annotations
"""DSR Project Request model — users request admin to add a new project"""

import uuid
import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User


class DSRProjectRequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DSRProjectRequest(BaseModel):
    """
    DSR Project Request — raised by any user when their project is not in the pre-defined list.
    Admin approves (auto-creates the project) or rejects with notes.
    """

    __tablename__ = "dsr_project_requests"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    requested_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    project_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Project name being requested",
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Why this project needs to be added",
    )

    status: Mapped[DSRProjectRequestStatus] = mapped_column(
        Enum(DSRProjectRequestStatus, values_callable=lambda x: [e.value for e in x]),
        default=DSRProjectRequestStatus.PENDING,
        nullable=False,
        index=True,
    )

    handled_by: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    handled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    admin_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Admin feedback on approval or rejection",
    )

    # Auto-created project reference (set on approval)
    created_project_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("dsr_projects.id", ondelete="SET NULL"),
        nullable=True,
        comment="Set to the newly created project ID when approved",
    )

    # Relationships
    requester: Mapped[User] = relationship(
        "User",
        foreign_keys=[requested_by],
        lazy="selectin",
    )

    handler: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[handled_by],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<DSRProjectRequest(id={self.id}, public_id={self.public_id}, "
            f"project_name={self.project_name}, status={self.status})>"
        )
