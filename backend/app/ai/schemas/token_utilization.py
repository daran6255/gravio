"""Token utilization / usage-analytics response schemas.

Shaped like the usage APIs most AI platforms expose: totals, a few standard breakdowns, and a
daily time series — read/aggregation only, sourced entirely from ai_credit_transactions.
"""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel


class ProviderBreakdown(BaseModel):
    provider: str
    tokens: int
    credits: int
    calls: int


class ModelBreakdown(BaseModel):
    model: str
    tokens: int
    credits: int
    calls: int


class ActionTypeBreakdown(BaseModel):
    action_type: str
    tokens: int
    credits: int
    calls: int


class DailyUsagePoint(BaseModel):
    date: date
    tokens: int
    credits: int
    calls: int


class TokenUtilizationSummary(BaseModel):
    total_tokens_used: int
    total_credits_consumed: int
    total_calls: int
    by_provider: list[ProviderBreakdown]
    by_model: list[ModelBreakdown]
    by_action_type: list[ActionTypeBreakdown]
    daily_trend: list[DailyUsagePoint]
