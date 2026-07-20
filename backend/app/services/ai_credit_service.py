"""AI credit orchestration — wallet status, the pre-call availability gate, and the
token-to-credit cost formula. Sits between the metering provider wrapper / read endpoints and
the AICreditRepository data-access layer.
"""

from __future__ import annotations

import math

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.organization import Organization
from app.models.ai_credit import AICreditWallet
from app.repositories.ai_credit import AICreditRepository
from app.services.plan_access import get_effective_access
from app.middleware.exceptions import AICreditsExhaustedError


def compute_credit_cost(tokens_used: int, provider_name: str) -> int:
    """Credits charged for a completed call. Minimum 1 credit per call (no free-call loophole
    on tiny responses); scaled by the serving provider's relative cost multiplier."""
    multiplier = settings.AI_PROVIDER_COST_MULTIPLIER.get(provider_name, 1.0)
    return max(1, math.ceil((tokens_used / settings.AI_CREDIT_TOKEN_RATIO) * multiplier))


async def get_or_create_wallet_for_org(db: AsyncSession, org: Organization) -> AICreditWallet:
    access = await get_effective_access(db, org)
    return await AICreditRepository.get_or_create_wallet(db, org.id, access.ai_credits_monthly)


async def get_wallet_status(db: AsyncSession, org: Organization) -> AICreditWallet:
    """Read-only wallet lookup for the GET /ai/credits endpoint — auto-creates/rolls the wallet
    over just like the enforcement path, so a first-ever call and a status check agree."""
    return await get_or_create_wallet_for_org(db, org)


async def ensure_credits_available(db: AsyncSession, org: Organization) -> AICreditWallet:
    """Pre-call gate used by MeteredLLMProvider. Raises AICreditsExhaustedError immediately —
    before any provider HTTP call is made — if the org's wallet balance is at or below zero.
    Always hard-stops here regardless of provider health; no amount of provider fallback fixes
    an empty wallet.
    """
    wallet = await get_or_create_wallet_for_org(db, org)
    if wallet.balance <= 0:
        raise AICreditsExhaustedError()
    return wallet
