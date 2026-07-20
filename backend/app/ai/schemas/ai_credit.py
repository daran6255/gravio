"""AI credit wallet response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel

if TYPE_CHECKING:
    from app.models.ai_credit import AICreditWallet


class AICreditBalanceResponse(BaseModel):
    balance: int
    granted: int
    period_start: datetime
    percent_used: float

    @classmethod
    def from_wallet(cls, wallet: "AICreditWallet") -> "AICreditBalanceResponse":
        used = max(wallet.granted - wallet.balance, 0)
        percent_used = round((used / wallet.granted) * 100, 1) if wallet.granted else 0.0
        return cls(
            balance=wallet.balance,
            granted=wallet.granted,
            period_start=wallet.period_start,
            percent_used=percent_used,
        )
