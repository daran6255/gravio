"""Plan access service — resolves an organization's effective module access and AI credit
grant, and exposes FastAPI dependencies that enforce module gating.

Trial orgs get every module unlocked (so prospects can fully evaluate the product) but the
Free tier's AI credit grant, to cap cost exposure during evaluation. Orgs with no plan and no
active trial get no module access at all — mirrors the existing "expired" lockout in deps.py.

AI credit *enforcement* (balance checks, deduction) lives in app.services.ai_credit_service —
this module only resolves how many credits a plan grants *per user* (see AICreditWallet: every
user gets their own full allotment off their org's plan rate, Solo or Team alike -- a 10-person
Team on Pro means 10 separate 1,000-credit wallets, not one 10,000-credit shared pool).
"""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.models.plan import Plan, PlanTier, Module
from app.repositories.plan import PlanRepository
from app.middleware.exceptions import ForbiddenError

# Fallback per-user AI credit grant for trial orgs if the Free plan hasn't been seeded yet.
TRIAL_AI_CREDITS_FALLBACK = 100


@dataclass(frozen=True)
class EffectiveAccess:
    """The module access and per-user AI credit grant that actually apply to an organization
    right now."""
    enabled_modules: frozenset[str]
    ai_credits_monthly: int


async def get_effective_access(db: AsyncSession, org: Organization) -> EffectiveAccess:
    """Resolve the access an organization currently has, accounting for trial status."""
    if org.subscription_status == "trial":
        free_plan = await PlanRepository.get_by_tier(db, PlanTier.FREE)
        base_credits = free_plan.ai_credits_monthly if free_plan else TRIAL_AI_CREDITS_FALLBACK
        return EffectiveAccess(
            enabled_modules=frozenset(m.value for m in Module),
            ai_credits_monthly=base_credits,
        )

    if org.plan_id is None:
        return EffectiveAccess(enabled_modules=frozenset(), ai_credits_monthly=0)

    plan = await PlanRepository.get_by_id(db, org.plan_id)
    if plan is None:
        return EffectiveAccess(enabled_modules=frozenset(), ai_credits_monthly=0)

    return EffectiveAccess(
        enabled_modules=frozenset(plan.enabled_modules),
        ai_credits_monthly=plan.ai_credits_monthly,
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
