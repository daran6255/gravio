"""Plan endpoints — public listing of available pricing tiers"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.plan import PlanRepository
from app.schemas.plan import PlanResponse

router = APIRouter(prefix="/plans", tags=["Plans"])


@router.get(
    "",
    response_model=list[PlanResponse],
    summary="List available pricing plans",
    description="Returns every seeded pricing tier with the modules it unlocks and its AI usage quota.",
)
async def list_plans(db: AsyncSession = Depends(get_db)) -> list[PlanResponse]:
    """Public endpoint — no auth required, used to render a pricing page."""
    plans = await PlanRepository.list_all(db)
    return [PlanResponse.model_validate(plan) for plan in plans]
