"""Plan access service — resolves an organization's effective module access and AI quota,
and exposes FastAPI dependencies that enforce them.

Trial orgs get every module unlocked (so prospects can fully evaluate the product) but only
a Pro-level AI quota, to cap cost exposure during evaluation. Orgs with no plan and no active
trial get no module access at all — mirrors the existing "expired" lockout in deps.py.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import Depends
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.models.plan import Plan, PlanTier, Module
from app.models.ai_usage import AIUsageCounter
from app.repositories.plan import PlanRepository
from app.middleware.exceptions import ForbiddenError, RateLimitError

# Fallback AI quota for trial orgs if the Pro plan hasn't been seeded yet.
TRIAL_AI_LIMIT_FALLBACK = 1000


@dataclass(frozen=True)
class EffectiveAccess:
    """The module access and AI quota that actually apply to an organization right now."""
    enabled_modules: frozenset[str]
    ai_monthly_limit: int


async def get_effective_access(db: AsyncSession, org: Organization) -> EffectiveAccess:
    """Resolve the access an organization currently has, accounting for trial status."""
    if org.subscription_status == "trial":
        pro_plan = await PlanRepository.get_by_tier(db, PlanTier.PRO)
        ai_limit = pro_plan.ai_monthly_limit if pro_plan else TRIAL_AI_LIMIT_FALLBACK
        return EffectiveAccess(
            enabled_modules=frozenset(m.value for m in Module),
            ai_monthly_limit=ai_limit,
        )

    if org.plan_id is None:
        return EffectiveAccess(enabled_modules=frozenset(), ai_monthly_limit=0)

    plan = await PlanRepository.get_by_id(db, org.plan_id)
    if plan is None:
        return EffectiveAccess(enabled_modules=frozenset(), ai_monthly_limit=0)

    return EffectiveAccess(
        enabled_modules=frozenset(plan.enabled_modules),
        ai_monthly_limit=plan.ai_monthly_limit,
    )


def require_module(module: Module):
    """Create a dependency that checks the current user's organization has `module` enabled.

    Superusers bypass the check, matching the bypass already applied for trial expiry
    in deps.get_current_user.

    Example:
        @router.get("/candidates")
        async def list_candidates(
            current_user: User = Depends(require_module(Module.CANDIDATE_MANAGEMENT)),
        ):
            ...
    """
    async def module_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if current_user.is_superuser or current_user.organization_id is None:
            return current_user

        org = await db.get(Organization, current_user.organization_id)
        access = await get_effective_access(db, org)

        if module.value not in access.enabled_modules:
            raise ForbiddenError(
                f"Your organization's plan does not include the '{module.value}' module."
            )
        return current_user

    return module_checker


def require_paid_plan():
    """Create a dependency that blocks organizations on the Free tier from a feature.

    Trial orgs pass — they get full access during evaluation, same as `require_module`.
    Superusers bypass the check. Orgs with no plan and no active trial (expired) are
    blocked, same as a Free-tier org.

    Example:
        @router.get("/leads/export")
        async def export_leads(
            current_user: User = Depends(require_paid_plan()),
        ):
            ...
    """
    async def paid_plan_checker(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        if current_user.is_superuser or current_user.organization_id is None:
            return current_user

        org = await db.get(Organization, current_user.organization_id)
        if org.subscription_status == "trial":
            return current_user

        plan = await PlanRepository.get_by_id(db, org.plan_id) if org.plan_id else None
        if plan is None or plan.tier == PlanTier.FREE:
            raise ForbiddenError(
                "This feature requires a paid plan. Please upgrade your subscription."
            )
        return current_user

    return paid_plan_checker


def _current_period_start(now: datetime) -> datetime:
    """First moment of the current calendar month (UTC).

    Simplification: AI quota resets align to the calendar month, not the org's billing
    cycle, since there is no billing/subscription-period tracking yet for paid plans.
    """
    return now.replace(year=now.year, month=now.month, day=1, hour=0, minute=0, second=0, microsecond=0)


async def consume_ai_quota(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency for AI-powered endpoints: increments and enforces the org's AI quota.

    Raises RateLimitError (429) once the organization's monthly AI action count reaches
    its plan's limit. Superusers bypass the check.
    """
    if current_user.is_superuser or current_user.organization_id is None:
        return current_user

    org = await db.get(Organization, current_user.organization_id)
    access = await get_effective_access(db, org)

    period_start = _current_period_start(datetime.now(timezone.utc))

    result = await db.execute(
        select(AIUsageCounter).where(
            AIUsageCounter.organization_id == org.id,
            AIUsageCounter.period_start == period_start,
        )
    )
    counter = result.scalars().first()

    if counter is None:
        counter = AIUsageCounter(
            organization_id=org.id,
            period_start=period_start,
            count=0,
        )
        db.add(counter)

    if counter.count >= access.ai_monthly_limit:
        raise RateLimitError(
            "Your organization's AI usage quota for this billing period has been reached. "
            "Upgrade your plan or wait for the quota to reset."
        )

    counter.count += 1
    await db.flush()
    return current_user
