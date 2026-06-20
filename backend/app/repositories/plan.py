"""Plan repository — raw database queries for the Plan model"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.plan import Plan, PlanTier


class PlanRepository:
    """Data access layer for Plan records.

    All methods are static — call them directly without instantiation:
        plan = await PlanRepository.get_by_tier(db, PlanTier.PRO)
    """

    @staticmethod
    async def get_by_tier(db: AsyncSession, tier: PlanTier) -> Optional[Plan]:
        """Return a plan by its tier, or None if not seeded yet."""
        result = await db.execute(select(Plan).where(Plan.tier == tier))
        return result.scalars().first()

    @staticmethod
    async def get_by_id(db: AsyncSession, plan_id: int) -> Optional[Plan]:
        """Return a plan by its internal primary key."""
        return await db.get(Plan, plan_id)

    @staticmethod
    async def list_all(db: AsyncSession) -> list[Plan]:
        """Return all plans, ordered by tier."""
        result = await db.execute(select(Plan).order_by(Plan.id))
        return list(result.scalars().all())
