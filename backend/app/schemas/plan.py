"""Plan Pydantic schemas"""

from pydantic import BaseModel
from app.models.plan import PlanTier


class PlanResponse(BaseModel):
    """Public-facing representation of a pricing plan, e.g. for a pricing page."""

    tier: PlanTier
    name: str
    enabled_modules: list[str]
    ai_monthly_limit: int

    class Config:
        from_attributes = True
