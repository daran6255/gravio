"""Per-organization AI usage counter, tracked per billing period"""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class AIUsageCounter(BaseModel):
    """Counts AI actions consumed by an organization within a single billing period.

    One row per (organization, period_start). `period_start` is the first moment of the
    period the count applies to, so resets show up as a new row rather than a mutation.
    """

    __tablename__ = "ai_usage_counters"
    __table_args__ = (
        UniqueConstraint("organization_id", "period_start", name="uq_ai_usage_org_period"),
    )

    organization_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True,
    )

    period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return f"<AIUsageCounter(org_id={self.organization_id}, period_start={self.period_start}, count={self.count})>"
