"""Pricing plan model — defines which modules a tier unlocks and its AI usage quota"""

from __future__ import annotations

import enum
from sqlalchemy import String, Integer, Enum, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class PlanTier(str, enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class Module(str, enum.Enum):
    PROJECT_MANAGEMENT = "project_management"
    CRM_MANAGEMENT = "crm_management"
    TIMESHEET_MANAGEMENT = "timesheet_management"
    CANDIDATE_MANAGEMENT = "candidate_management"
    TRAINING_MANAGEMENT = "training_management"
    PLACEMENT_MANAGEMENT = "placement_management"
    REPORTS_MANAGEMENT = "reports_management"


class Plan(BaseModel):
    """A pricing tier — which modules it unlocks and its monthly AI credit grant."""

    __tablename__ = "plans"

    tier: Mapped[PlanTier] = mapped_column(
        Enum(PlanTier, values_callable=lambda x: [e.value for e in x]),
        unique=True,
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # List of Module values enabled for this tier, e.g. ["project_management", "crm_management"]
    enabled_modules: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)

    # Monthly AI credits granted to an org on this plan (token-weighted, see AICreditWallet).
    ai_credits_monthly: Mapped[int] = mapped_column(Integer, nullable=False)

    # Maximum number of users allowed in this organization tier (None for unlimited)
    user_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)

    def __repr__(self) -> str:
        return f"<Plan(id={self.id}, tier={self.tier})>"
