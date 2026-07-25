"""Credits metering wrapper — the single choke point every AI call passes through.

Wraps any LLMProvider (typically a ResilientLLMProvider): pre-checks the calling user's own
credit balance (wallets are per-user, not pooled per org — see AICreditWallet), delegates the
call, and deducts real usage afterward. Every current and future AI feature gets credit
accounting for free just by going through get_llm_provider() with an org_id and user_id — no
feature-level code has to know credits exist.
"""

from __future__ import annotations

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.providers.base import LLMProvider, LLMResponse
from app.core.config import settings
from app.models.ai_credit import AICreditWallet
from app.models.organization import Organization
from app.repositories.ai_credit import AICreditRepository
from app.services import ai_credit_service

logger = logging.getLogger(__name__)

# Fallback token estimate for streaming responses when the provider didn't report real usage
# (e.g. a provider without stream_options.include_usage support). ~4 chars/token is a common
# rough English-text approximation; the resulting ledger row is flagged is_estimated=True.
_CHARS_PER_TOKEN_ESTIMATE = 4


class MeteredLLMProvider(LLMProvider):
    def __init__(
        self,
        inner: LLMProvider,
        db: AsyncSession,
        org_id: int,
        user_id: int | None = None,
        action_type: str | None = None,
    ) -> None:
        self._inner = inner
        self._db = db
        self._org_id = org_id
        self._user_id = user_id
        self._action_type = action_type
        # Set after each successful deduct() -- lets a caller that finds out *after the fact*
        # that this call's real-world work was worthless (e.g. every tool it planned failed)
        # reverse the charge via refund_last_charge(), without the caller needing to know cost
        # math or wallet plumbing itself.
        self._last_deduction: tuple[AICreditWallet, int] | None = None

    @property
    def provider_name(self) -> str:
        return self._inner.provider_name

    @property
    def model_name(self) -> str:
        return self._inner.model_name

    async def _get_org(self) -> Organization:
        org = await self._db.get(Organization, self._org_id)
        if org is None:
            raise RuntimeError(f"MeteredLLMProvider: organization {self._org_id} not found.")
        return org

    async def _clamp_max_tokens(self, wallet: AICreditWallet, requested_max_tokens: int) -> int:
        """Bounds worst-case overdraft: a single call can't cost dramatically more than the
        org's remaining balance, by capping how many completion tokens the provider may return."""
        multiplier = settings.AI_PROVIDER_COST_MULTIPLIER.get(self._inner.provider_name, 1.0)
        affordable_tokens = int((max(wallet.balance, 1) * settings.AI_CREDIT_TOKEN_RATIO) / multiplier)
        return max(1, min(requested_max_tokens, affordable_tokens))

    async def complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> LLMResponse:
        org = await self._get_org()
        wallet = await ai_credit_service.ensure_credits_available(self._db, org, self._user_id)
        clamped_max_tokens = await self._clamp_max_tokens(wallet, max_tokens)

        response = await self._inner.complete(system_prompt, user_message, temperature, clamped_max_tokens)

        if not response.content or not response.content.strip():
            # A technically-successful call that produced nothing usable -- no real value
            # delivered, so no charge (mirrors the empty-stream guard below).
            logger.warning(
                "Empty response from '%s' — not charging any credits for this call.",
                self._inner.provider_name,
            )
            return response

        tokens_used = response.tokens_used or 0
        cost = ai_credit_service.compute_credit_cost(max(tokens_used, 1), self._inner.provider_name)
        await AICreditRepository.deduct(
            self._db, wallet,
            cost=cost, provider=self._inner.provider_name, model=self._inner.model_name,
            action_type=self._action_type, user_id=self._user_id,
            tokens_used=tokens_used or None, is_estimated=response.tokens_used is None,
        )
        self._last_deduction = (wallet, cost)
        return response

    async def stream_complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> AsyncGenerator[str, None]:
        org = await self._get_org()
        wallet = await ai_credit_service.ensure_credits_available(self._db, org, self._user_id)
        clamped_max_tokens = await self._clamp_max_tokens(wallet, max_tokens)

        accumulated_chars = 0
        accumulated_text = []
        async for chunk in self._inner.stream_complete(system_prompt, user_message, temperature, clamped_max_tokens):
            accumulated_chars += len(chunk)
            accumulated_text.append(chunk)
            yield chunk

        if not "".join(accumulated_text).strip():
            # A technically-successful stream that produced nothing usable -- no real value
            # delivered, so no charge (mirrors the empty-response guard in complete() above).
            logger.warning(
                "Empty stream from '%s' — not charging any credits for this call.",
                self._inner.provider_name,
            )
            return

        # Some providers (Groq, via stream_options.include_usage) expose real usage on the
        # underlying instance after the stream completes. ResilientLLMProvider tracks which
        # concrete provider actually served the call in `_last_served`.
        served_by = getattr(self._inner, "_last_served", self._inner)
        get_usage = getattr(served_by, "get_last_stream_usage", None)
        real_tokens = get_usage() if callable(get_usage) else None

        if real_tokens:
            tokens_used, is_estimated = real_tokens, False
        else:
            tokens_used, is_estimated = max(1, accumulated_chars // _CHARS_PER_TOKEN_ESTIMATE), True

        cost = ai_credit_service.compute_credit_cost(tokens_used, self._inner.provider_name)
        await AICreditRepository.deduct(
            self._db, wallet,
            cost=cost, provider=self._inner.provider_name, model=self._inner.model_name,
            action_type=self._action_type, user_id=self._user_id,
            tokens_used=tokens_used, is_estimated=is_estimated,
        )
        self._last_deduction = (wallet, cost)

    async def refund_last_charge(self) -> bool:
        """Reverses the most recent deduct() on this provider instance, once. Returns False
        (no-op) if nothing has been charged yet or it's already been refunded -- safe to call
        speculatively without the caller tracking whether a charge actually happened."""
        if self._last_deduction is None:
            return False
        wallet, cost = self._last_deduction
        self._last_deduction = None
        await AICreditRepository.refund(self._db, wallet, amount=cost, user_id=self._user_id)
        return True
