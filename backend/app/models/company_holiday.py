from __future__ import annotations
"""Company Holiday model — marks holidays for all users"""

import uuid
from datetime import date
from sqlalchemy import Integer, Date, Uuid, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import User


class CompanyHoliday(BaseModel):
    """
    Company Holiday — common holidays for all users.
    Prevents DSR submission and Leave application on these dates.
    """

    __tablename__ = "company_holidays"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    holiday_date: Mapped[date] = mapped_column(
        Date,
        unique=True,
        nullable=False,
        index=True,
    )

    holiday_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    created_by_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationship
    creator: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[created_by_id],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<CompanyHoliday(id={self.id}, public_id={self.public_id}, "
            f"holiday_date={self.holiday_date}, holiday_name='{self.holiday_name}')>"
        )
