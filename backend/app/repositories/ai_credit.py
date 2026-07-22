"""AI credit repository — wallet lookup/rollover and the atomic deduct/grant ledger writes.

Mirrors PlanRepository's style: static methods, no instantiation. Callers (ai_credit_service)
own the business rules (how much to grant, when to block); this module owns the data access.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.ai_credit import AICreditWallet, AICreditTransaction, AICreditTransactionReason


def current_period_start(now: datetime) -> datetime:
    """First moment of the current calendar month (UTC).

    Simplification: AI credit periods align to the calendar month, not the org's billing cycle,
    since there is no billing/subscription-period tracking yet for paid plans (matches the
    same simplification the old AIUsageCounter scaffold used).
    """
    return now.replace(year=now.year, month=now.month, day=1, hour=0, minute=0, second=0, microsecond=0)


class AICreditRepository:
    @staticmethod
    async def get_wallet(db: AsyncSession, organization_id: int, user_id: int) -> AICreditWallet | None:
        result = await db.execute(
            select(AICreditWallet).where(
                AICreditWallet.organization_id == organization_id,
                AICreditWallet.user_id == user_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_or_create_wallet(
        db: AsyncSession, organization_id: int, user_id: int, ai_credits_monthly: int
    ) -> AICreditWallet:
        """Fetch this user's wallet, creating it (or rolling it to a fresh period) as needed.

        A wallet whose period_start has fallen behind the current calendar month is reset in
        place — balance and granted both go back to `ai_credits_monthly`, and a MONTHLY_GRANT
        ledger row records the reset. This is a lazy rollover (checked on read, not on a cron),
        matching the pattern the old AIUsageCounter/consume_ai_quota used.
        """
        wallet = await AICreditRepository.get_wallet(db, organization_id, user_id)
        period_start = current_period_start(datetime.now(timezone.utc))

        if wallet is None:
            wallet = AICreditWallet(
                organization_id=organization_id,
                user_id=user_id,
                period_start=period_start,
                balance=ai_credits_monthly,
                granted=ai_credits_monthly,
            )
            db.add(wallet)
            await db.flush()
            await AICreditRepository.record_grant(
                db, wallet, amount=ai_credits_monthly, reason=AICreditTransactionReason.MONTHLY_GRANT,
                user_id=user_id,
            )
            return wallet

        if wallet.period_start < period_start:
            wallet.period_start = period_start
            wallet.balance = ai_credits_monthly
            wallet.granted = ai_credits_monthly
            await db.flush()
            await AICreditRepository.record_grant(
                db, wallet, amount=ai_credits_monthly, reason=AICreditTransactionReason.MONTHLY_GRANT,
                user_id=user_id,
            )

        return wallet

    @staticmethod
    async def record_grant(
        db: AsyncSession, wallet: AICreditWallet, *, amount: int, reason: AICreditTransactionReason,
        user_id: int | None = None,
    ) -> AICreditTransaction:
        txn = AICreditTransaction(
            organization_id=wallet.organization_id,
            wallet_id=wallet.id,
            user_id=user_id,
            amount=amount,
            balance_after=wallet.balance,
            reason=reason,
        )
        db.add(txn)
        await db.flush()
        return txn

    @staticmethod
    async def deduct(
        db: AsyncSession,
        wallet: AICreditWallet,
        *,
        cost: int,
        provider: str,
        model: str | None,
        action_type: str | None,
        user_id: int | None,
        tokens_used: int | None,
        is_estimated: bool = False,
    ) -> AICreditTransaction:
        """Atomically deduct `cost` credits and record the ledger row. Called only after a
        successful LLM response — see ai_credit_service for the pre-check that gates entry."""
        result = await db.execute(
            update(AICreditWallet)
            .where(AICreditWallet.id == wallet.id)
            .values(balance=AICreditWallet.balance - cost)
            .returning(AICreditWallet.balance)
        )
        new_balance = result.scalar_one()
        wallet.balance = new_balance  # keep the in-memory object consistent for this request

        txn = AICreditTransaction(
            organization_id=wallet.organization_id,
            wallet_id=wallet.id,
            user_id=user_id,
            amount=-cost,
            balance_after=new_balance,
            reason=AICreditTransactionReason.AI_CALL,
            provider=provider,
            model=model,
            action_type=action_type,
            tokens_used=tokens_used,
            is_estimated=is_estimated,
        )
        db.add(txn)
        await db.flush()
        return txn

    @staticmethod
    async def refund(
        db: AsyncSession,
        wallet: AICreditWallet,
        *,
        amount: int,
        user_id: int | None,
    ) -> AICreditTransaction:
        """Reverses a previous AI_CALL deduction (e.g. the LLM call succeeded but every planned
        tool call it produced failed, so the user got no real value from it). Mirrors `deduct`'s
        atomic update, just adding instead of subtracting."""
        result = await db.execute(
            update(AICreditWallet)
            .where(AICreditWallet.id == wallet.id)
            .values(balance=AICreditWallet.balance + amount)
            .returning(AICreditWallet.balance)
        )
        new_balance = result.scalar_one()
        wallet.balance = new_balance

        txn = AICreditTransaction(
            organization_id=wallet.organization_id,
            wallet_id=wallet.id,
            user_id=user_id,
            amount=amount,
            balance_after=new_balance,
            reason=AICreditTransactionReason.ADMIN_ADJUSTMENT,
        )
        db.add(txn)
        await db.flush()
        return txn
