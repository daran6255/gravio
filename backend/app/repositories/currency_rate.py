"""Data access layer for CurrencyRate"""

from datetime import date
from decimal import Decimal
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.currency_rate import CurrencyRate


class CurrencyRateRepository:
    @staticmethod
    async def get(db: AsyncSession, *, from_currency: str, to_currency: str, rate_date: date) -> Optional[CurrencyRate]:
        result = await db.execute(
            select(CurrencyRate).where(
                CurrencyRate.from_currency == from_currency,
                CurrencyRate.to_currency == to_currency,
                CurrencyRate.rate_date == rate_date,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, from_currency: str, to_currency: str, rate_date: date, rate: Decimal) -> CurrencyRate:
        row = CurrencyRate(from_currency=from_currency, to_currency=to_currency, rate_date=rate_date, rate=rate)
        db.add(row)
        await db.flush()
        await db.refresh(row)
        return row
