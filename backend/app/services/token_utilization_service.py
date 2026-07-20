"""Token utilization / usage analytics — read-only aggregation over ai_credit_transactions.

No new tables: every AI_CALL transaction already carries tokens_used, provider, model,
action_type, and created_at, so this is pure SQL GROUP BY over the existing ledger.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import Date, cast, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.ai_credit import AICreditTransaction, AICreditTransactionReason
from app.ai.schemas.token_utilization import (
    TokenUtilizationSummary,
    ProviderBreakdown,
    ModelBreakdown,
    ActionTypeBreakdown,
    DailyUsagePoint,
)

_TOKENS = func.coalesce(func.sum(AICreditTransaction.tokens_used), 0)
_CREDITS = func.coalesce(func.sum(-AICreditTransaction.amount), 0)  # amount is negative for consumption
_CALLS = func.count(AICreditTransaction.id)


def _default_period_start(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


async def get_utilization_summary(
    db: AsyncSession,
    org_id: int,
    period_start: datetime | None = None,
    period_end: datetime | None = None,
) -> TokenUtilizationSummary:
    now = datetime.now(timezone.utc)
    period_start = period_start or _default_period_start(now)
    period_end = period_end or now

    call_filters = [
        AICreditTransaction.organization_id == org_id,
        AICreditTransaction.reason == AICreditTransactionReason.AI_CALL,
        AICreditTransaction.created_at >= period_start,
        AICreditTransaction.created_at <= period_end,
    ]

    total_tokens, total_credits, total_calls = (
        await db.execute(select(_TOKENS, _CREDITS, _CALLS).where(*call_filters))
    ).one()

    by_provider_rows = (
        await db.execute(
            select(AICreditTransaction.provider, _TOKENS, _CREDITS, _CALLS)
            .where(*call_filters)
            .group_by(AICreditTransaction.provider)
        )
    ).all()

    by_model_rows = (
        await db.execute(
            select(AICreditTransaction.model, _TOKENS, _CREDITS, _CALLS)
            .where(*call_filters)
            .group_by(AICreditTransaction.model)
        )
    ).all()

    by_action_rows = (
        await db.execute(
            select(AICreditTransaction.action_type, _TOKENS, _CREDITS, _CALLS)
            .where(*call_filters)
            .group_by(AICreditTransaction.action_type)
        )
    ).all()

    day_col = cast(AICreditTransaction.created_at, Date)
    daily_rows = (
        await db.execute(
            select(day_col.label("day"), _TOKENS, _CREDITS, _CALLS)
            .where(
                AICreditTransaction.organization_id == org_id,
                AICreditTransaction.reason == AICreditTransactionReason.AI_CALL,
                AICreditTransaction.created_at >= period_end - timedelta(days=30),
                AICreditTransaction.created_at <= period_end,
            )
            .group_by(day_col)
            .order_by(day_col)
        )
    ).all()

    return TokenUtilizationSummary(
        total_tokens_used=total_tokens,
        total_credits_consumed=total_credits,
        total_calls=total_calls,
        by_provider=[
            ProviderBreakdown(provider=row[0] or "unknown", tokens=row[1], credits=row[2], calls=row[3])
            for row in by_provider_rows
        ],
        by_model=[
            ModelBreakdown(model=row[0] or "unknown", tokens=row[1], credits=row[2], calls=row[3])
            for row in by_model_rows
        ],
        by_action_type=[
            ActionTypeBreakdown(action_type=row[0] or "unknown", tokens=row[1], credits=row[2], calls=row[3])
            for row in by_action_rows
        ],
        daily_trend=[
            DailyUsagePoint(date=row[0], tokens=row[1], credits=row[2], calls=row[3])
            for row in daily_rows
        ],
    )
