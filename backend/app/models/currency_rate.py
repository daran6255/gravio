"""Cached foreign-exchange rate lookups, used to display Deal/Lead values in a viewer's preferred currency"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from sqlalchemy import String, Date, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class CurrencyRate(BaseModel):
    """A single day's exchange rate between two currencies. Global — not tenant-scoped, since
    exchange rates are shared market data, not per-organization (mirrors `Plan`)."""

    __tablename__ = "currency_rates"
    __table_args__ = (
        UniqueConstraint("rate_date", "from_currency", "to_currency", name="uq_currency_rate_date_pair"),
    )

    rate_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    from_currency: Mapped[str] = mapped_column(String(10), nullable=False)
    to_currency: Mapped[str] = mapped_column(String(10), nullable=False)
    rate: Mapped[Decimal] = mapped_column(Numeric(20, 10), nullable=False)

    def __repr__(self) -> str:
        return f"<CurrencyRate({self.from_currency}->{self.to_currency} on {self.rate_date} = {self.rate})>"
