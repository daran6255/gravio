from __future__ import annotations
"""DSR Activity Type model — global taxonomy of work categories"""

import uuid
from sqlalchemy import String, Boolean, Integer, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class DSRActivityType(BaseModel):
    """
    DSR Activity Type — a global, admin-managed taxonomy entry.
    Examples: Development, Testing, Meeting, Documentation.
    These are org-wide codes used to standardize DSR analytics.
    """

    __tablename__ = "dsr_activity_types"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Display name e.g. 'Development'",
    )

    code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
        comment="Short uppercase code e.g. 'DEV' — used in analytics grouping",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Optional description of this activity type",
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="Grouping category e.g. 'Sourcing', 'Training'",
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Controls display order in dropdowns (ascending)",
    )

    def __repr__(self) -> str:
        return f"<DSRActivityType(id={self.id}, code={self.code}, name={self.name})>"
