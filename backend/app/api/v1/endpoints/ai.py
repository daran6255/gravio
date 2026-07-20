"""AI credits + usage endpoints — the read surface for the credits/token-utilization system.

Wiring up the ARIA chat/extraction endpoints themselves is separate, larger follow-up work;
this router only exposes what's needed to see credit balance and usage today.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.middleware.exceptions import NotFoundError
from app.models.organization import Organization
from app.models.user import User
from app.services import ai_credit_service, token_utilization_service
from app.ai.schemas.ai_credit import AICreditBalanceResponse
from app.ai.schemas.token_utilization import TokenUtilizationSummary

router = APIRouter(prefix="/ai", tags=["AI"])


async def _get_current_org(current_user: User, db: AsyncSession) -> Organization:
    if current_user.organization_id is None:
        raise NotFoundError("This account is not associated with an organization.")
    org = await db.get(Organization, current_user.organization_id)
    if org is None:
        raise NotFoundError("Organization not found.")
    return org


@router.get(
    "/credits",
    response_model=AICreditBalanceResponse,
    summary="Get the current AI credit balance for my organization",
)
async def get_credit_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AICreditBalanceResponse:
    org = await _get_current_org(current_user, db)
    wallet = await ai_credit_service.get_wallet_status(db, org)
    await db.commit()  # persists a first-time wallet creation / period rollover, if one occurred
    return AICreditBalanceResponse.from_wallet(wallet)


@router.get(
    "/usage",
    response_model=TokenUtilizationSummary,
    summary="Token utilization for my organization — totals, breakdowns, and a daily trend",
)
async def get_token_utilization(
    period_start: Optional[datetime] = Query(None, description="Defaults to the start of the current calendar month"),
    period_end: Optional[datetime] = Query(None, description="Defaults to now"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TokenUtilizationSummary:
    org = await _get_current_org(current_user, db)
    return await token_utilization_service.get_utilization_summary(db, org.id, period_start, period_end)
