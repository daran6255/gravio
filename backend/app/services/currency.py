"""Currency conversion for display purposes — converts a Deal/Lead's own recorded value into
a viewer's preferred currency using today's exchange rate, so the displayed figure always
reflects what the record would be worth right now.

This never mutates the record's actual recorded value/currency; it only attaches transient
`display_value`/`display_currency` attributes that the response schema picks up (mirrors
`CRMDealResponse`'s existing `_attach_task_counts` transient-attribute pattern)."""

from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Optional
import httpx
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.currency_rate import CurrencyRateRepository

FRANKFURTER_BASE_URL = "https://api.frankfurter.dev/v1"


class CurrencyConversionService:
    @staticmethod
    async def _fetch_rate_from_api(*, from_currency: str, to_currency: str, on_date: date) -> Optional[Decimal]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{FRANKFURTER_BASE_URL}/{on_date.isoformat()}",
                    params={"base": from_currency, "symbols": to_currency},
                )
                if not resp.is_success:
                    logger.warning(f"Currency rate lookup failed ({from_currency}->{to_currency} on {on_date}): {resp.status_code}")
                    return None
                data = resp.json()
                raw_rate = data.get("rates", {}).get(to_currency)
                if raw_rate is None:
                    return None
                return Decimal(str(raw_rate))
        except (httpx.HTTPError, InvalidOperation, ValueError) as exc:
            logger.warning(f"Currency rate lookup errored ({from_currency}->{to_currency} on {on_date}): {exc}")
            return None

    @staticmethod
    async def get_rate(db: AsyncSession, *, from_currency: str, to_currency: str, on_date: date) -> Optional[Decimal]:
        if from_currency == to_currency:
            return Decimal("1")

        cached = await CurrencyRateRepository.get(db, from_currency=from_currency, to_currency=to_currency, rate_date=on_date)
        if cached:
            return cached.rate

        rate = await CurrencyConversionService._fetch_rate_from_api(from_currency=from_currency, to_currency=to_currency, on_date=on_date)
        if rate is None:
            return None

        await CurrencyRateRepository.create(db, from_currency=from_currency, to_currency=to_currency, rate_date=on_date, rate=rate)
        await db.commit()
        return rate

    @staticmethod
    async def attach_display_value(
        db: AsyncSession,
        obj,
        *,
        value_field: str,
        currency_field: str,
        user_currency: Optional[str],
    ) -> None:
        """Sets transient `display_value`/`display_currency` on `obj` in place. No-ops (leaves
        both None) when there's nothing to convert — unset preference, no recorded value, or the
        record is already in the viewer's preferred currency."""
        obj.display_value = None
        obj.display_currency = None

        if not user_currency:
            return

        record_currency = getattr(obj, currency_field, None)
        record_value = getattr(obj, value_field, None)
        if not record_currency or record_value is None or record_currency == user_currency:
            return

        rate = await CurrencyConversionService.get_rate(
            db, from_currency=record_currency, to_currency=user_currency, on_date=date.today(),
        )
        if rate is None:
            return

        obj.display_value = round(float(Decimal(str(record_value)) * rate), 2)
        obj.display_currency = user_currency

    @staticmethod
    async def attach_display_values(
        db: AsyncSession,
        objs: list,
        *,
        value_field: str,
        currency_field: str,
        user_currency: Optional[str],
    ) -> None:
        for obj in objs:
            await CurrencyConversionService.attach_display_value(
                db, obj, value_field=value_field, currency_field=currency_field, user_currency=user_currency,
            )
