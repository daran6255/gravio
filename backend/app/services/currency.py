"""Currency conversion for display purposes — converts a Deal/Lead's own recorded value into
a viewer's preferred currency using the exchange rate on the day the record was created.

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

# fawazahmed0/currency-api — free, keyless, full ISO 4217 coverage (including e.g. BHD/KWD/AED,
# which the ECB-only Frankfurter API doesn't publish) with historical data by date. Two mirrors
# are tried in order since the jsdelivr CDN occasionally rate-limits.
CURRENCY_API_URLS = [
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{date}/v1/currencies/{from_currency}.json",
    "https://{date}.currency-api.pages.dev/v1/currencies/{from_currency}.json",
]


class CurrencyConversionService:
    @staticmethod
    async def _fetch_rate_from_api(*, from_currency: str, to_currency: str, on_date: date) -> Optional[Decimal]:
        from_lower = from_currency.lower()
        to_lower = to_currency.lower()
        date_str = on_date.isoformat()

        for url_template in CURRENCY_API_URLS:
            url = url_template.format(date=date_str, from_currency=from_lower)
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.get(url)
                    if not resp.is_success:
                        logger.warning(f"Currency rate lookup failed ({from_currency}->{to_currency} on {on_date}) via {url}: {resp.status_code}")
                        continue
                    data = resp.json()
                    raw_rate = data.get(from_lower, {}).get(to_lower)
                    if raw_rate is None:
                        logger.warning(f"Currency rate lookup missing pair ({from_currency}->{to_currency} on {on_date}) via {url}")
                        continue
                    return Decimal(str(raw_rate))
            except (httpx.HTTPError, InvalidOperation, ValueError) as exc:
                logger.warning(f"Currency rate lookup errored ({from_currency}->{to_currency} on {on_date}) via {url}: {exc}")
                continue

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
        """Sets transient `display_value`/`display_currency`/`display_rate` on `obj` in place.
        No-ops (leaves all None) when there's nothing to convert — unset preference, no recorded
        value, or the record is already in the viewer's preferred currency."""
        obj.display_value = None
        obj.display_currency = None
        obj.display_rate = None

        if not user_currency:
            return

        record_currency = getattr(obj, currency_field, None)
        record_value = getattr(obj, value_field, None)
        if not record_currency or record_value is None or record_currency == user_currency:
            return

        created_at = getattr(obj, "created_at", None)
        on_date = created_at.date() if created_at else date.today()

        rate = await CurrencyConversionService.get_rate(
            db, from_currency=record_currency, to_currency=user_currency, on_date=on_date,
        )
        if rate is None:
            return

        obj.display_value = round(float(Decimal(str(record_value)) * rate), 2)
        obj.display_currency = user_currency
        obj.display_rate = float(rate)

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
