"""Cross-provider fallback wrapper.

Tries the primary provider (which, for providers like Groq, already retries across its own
API key pool internally — see key_pool.py). If the primary is fully exhausted/down, retries
once against a configured secondary provider before giving up. If BOTH fail in the same round,
waits out the shorter provider-reported cooldown (capped) and runs one more round before finally
giving up — a lot of "every provider is down" moments are really just every key being mid-
cooldown at the same instant, which a few seconds resolves. Every failure is logged with which
provider failed and why, so an eventual error is diagnosable rather than a bare stack trace
reaching the client.

Each provider attempt is additionally gated by an optional per-provider ProviderCircuitBreaker
(circuit_breaker.py): once a provider has failed repeatedly across recent requests, its breaker
trips open and subsequent requests skip straight past it instead of paying its full retry/timeout
cost again -- see get_circuit_breaker() in factory.py for how these are attached.
"""

from __future__ import annotations

import asyncio
import logging
from typing import AsyncGenerator

from app.ai.providers.base import LLMProvider, LLMResponse
from app.ai.providers.circuit_breaker import ProviderCircuitBreaker
from app.ai.brain.exceptions import LLMProviderError, LLMRateLimitError
from app.middleware.exceptions import AIServiceUnavailableError

logger = logging.getLogger(__name__)

_RECOVERABLE = (LLMRateLimitError, LLMProviderError)

# One initial attempt + one retry round after both primary and fallback fail together.
_MAX_ROUNDS = 2
_DEFAULT_WAIT_SECONDS = 5
_MAX_WAIT_SECONDS = 15  # never block a user-facing request longer than this per round


def _retry_wait_seconds(error: Exception | None) -> int:
    retry_after = getattr(error, "context", {}).get("retry_after") if error else None
    return min(retry_after or _DEFAULT_WAIT_SECONDS, _MAX_WAIT_SECONDS)


class ResilientLLMProvider(LLMProvider):
    """Wraps a primary LLMProvider with an optional fallback provider and a bounded retry."""

    def __init__(
        self,
        primary: LLMProvider,
        fallback: LLMProvider | None = None,
        primary_breaker: ProviderCircuitBreaker | None = None,
        fallback_breaker: ProviderCircuitBreaker | None = None,
    ) -> None:
        self._primary = primary
        self._fallback = fallback
        self._primary_breaker = primary_breaker
        self._fallback_breaker = fallback_breaker
        # Tracks whichever provider actually served the most recent call, so callers (the
        # credits metering layer) charge the correct provider's cost multiplier.
        self._last_served: LLMProvider = primary
        # Every provider/error pair seen during the most recent call -- surfaced on
        # AIServiceUnavailableError so the failure audit trail (journal + alert) has real
        # context instead of just "both providers failed".
        self._last_attempt_errors: dict[str, str] = {}

    @property
    def provider_name(self) -> str:
        return self._last_served.provider_name

    @property
    def model_name(self) -> str:
        return self._last_served.model_name

    async def complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> LLMResponse:
        last_primary_error: Exception | None = None
        last_fallback_error: Exception | None = None
        self._last_attempt_errors = {}

        for round_num in range(_MAX_ROUNDS):
            primary_allowed = await self._primary_breaker.allow_request() if self._primary_breaker else True
            if primary_allowed:
                try:
                    result = await self._primary.complete(system_prompt, user_message, temperature, max_tokens)
                    if self._primary_breaker:
                        await self._primary_breaker.record_success()
                    self._last_served = self._primary
                    return result
                except _RECOVERABLE as primary_error:
                    if self._primary_breaker:
                        await self._primary_breaker.record_failure()
                    last_primary_error = primary_error
                    self._last_attempt_errors[self._primary.provider_name] = str(primary_error)
                    logger.warning(
                        "Primary AI provider '%s' failed (%s); %s",
                        self._primary.provider_name, primary_error,
                        f"falling back to '{self._fallback.provider_name}'" if self._fallback else "no fallback configured",
                    )
            else:
                logger.warning(
                    "Circuit breaker open for primary '%s' — skipping straight to fallback",
                    self._primary.provider_name,
                )
                self._last_attempt_errors[self._primary.provider_name] = "circuit breaker open"

            if self._fallback is not None:
                fallback_allowed = await self._fallback_breaker.allow_request() if self._fallback_breaker else True
                if fallback_allowed:
                    try:
                        result = await self._fallback.complete(system_prompt, user_message, temperature, max_tokens)
                        if self._fallback_breaker:
                            await self._fallback_breaker.record_success()
                        self._last_served = self._fallback
                        return result
                    except _RECOVERABLE as fallback_error:
                        if self._fallback_breaker:
                            await self._fallback_breaker.record_failure()
                        last_fallback_error = fallback_error
                        self._last_attempt_errors[self._fallback.provider_name] = str(fallback_error)
                        logger.error(
                            "Fallback AI provider '%s' also failed (%s) after primary '%s' failed",
                            self._fallback.provider_name, fallback_error, self._primary.provider_name,
                        )
                else:
                    logger.error(
                        "Circuit breaker open for fallback '%s' too — all providers unavailable this round",
                        self._fallback.provider_name,
                    )
                    self._last_attempt_errors[self._fallback.provider_name] = "circuit breaker open"

            if round_num < _MAX_ROUNDS - 1:
                wait_seconds = _retry_wait_seconds(last_primary_error)
                logger.warning(
                    "Both providers unavailable — retrying in %ds (round %d/%d)",
                    wait_seconds, round_num + 2, _MAX_ROUNDS,
                )
                await asyncio.sleep(wait_seconds)

        if self._fallback is None:
            raise AIServiceUnavailableError(
                primary=self._primary.provider_name, errors=self._last_attempt_errors,
            ) from last_primary_error
        raise AIServiceUnavailableError(
            primary=self._primary.provider_name, fallback=self._fallback.provider_name,
            errors=self._last_attempt_errors,
        ) from (last_fallback_error or last_primary_error)

    async def stream_complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> AsyncGenerator[str, None]:
        # A stream that fails after already yielding partial content can't cleanly "fall back"
        # or retry (the caller has already seen output from the primary) — retry/fallback only
        # applies if the primary fails before yielding anything.
        last_primary_error: Exception | None = None
        last_fallback_error: Exception | None = None
        self._last_attempt_errors = {}

        for round_num in range(_MAX_ROUNDS):
            yielded_any = False
            primary_allowed = await self._primary_breaker.allow_request() if self._primary_breaker else True
            if primary_allowed:
                try:
                    async for chunk in self._primary.stream_complete(system_prompt, user_message, temperature, max_tokens):
                        yielded_any = True
                        self._last_served = self._primary
                        yield chunk
                    if self._primary_breaker:
                        await self._primary_breaker.record_success()
                    return
                except _RECOVERABLE as primary_error:
                    if self._primary_breaker:
                        await self._primary_breaker.record_failure()
                    last_primary_error = primary_error
                    self._last_attempt_errors[self._primary.provider_name] = str(primary_error)
                    if yielded_any:
                        logger.error(
                            "Primary AI provider '%s' failed mid-stream (%s); partial content already sent, cannot retry",
                            self._primary.provider_name, primary_error,
                        )
                        raise AIServiceUnavailableError(
                            primary=self._primary.provider_name, errors=self._last_attempt_errors,
                        ) from primary_error

                    if self._fallback is not None:
                        logger.warning(
                            "Primary AI provider '%s' failed before yielding any content (%s); falling back to '%s'",
                            self._primary.provider_name, primary_error, self._fallback.provider_name,
                        )
            else:
                logger.warning(
                    "Circuit breaker open for primary '%s' — skipping straight to fallback stream",
                    self._primary.provider_name,
                )
                self._last_attempt_errors[self._primary.provider_name] = "circuit breaker open"

            if self._fallback is not None:
                fallback_allowed = await self._fallback_breaker.allow_request() if self._fallback_breaker else True
                if fallback_allowed:
                    try:
                        async for chunk in self._fallback.stream_complete(system_prompt, user_message, temperature, max_tokens):
                            self._last_served = self._fallback
                            yield chunk
                        if self._fallback_breaker:
                            await self._fallback_breaker.record_success()
                        return
                    except _RECOVERABLE as fallback_error:
                        if self._fallback_breaker:
                            await self._fallback_breaker.record_failure()
                        last_fallback_error = fallback_error
                        self._last_attempt_errors[self._fallback.provider_name] = str(fallback_error)
                        logger.error(
                            "Fallback AI provider '%s' also failed (%s)",
                            self._fallback.provider_name, fallback_error,
                        )
                else:
                    logger.error(
                        "Circuit breaker open for fallback '%s' too — all providers unavailable this round",
                        self._fallback.provider_name,
                    )
                    self._last_attempt_errors[self._fallback.provider_name] = "circuit breaker open"

            if round_num < _MAX_ROUNDS - 1:
                wait_seconds = _retry_wait_seconds(last_primary_error)
                logger.warning(
                    "Both providers unavailable — retrying stream in %ds (round %d/%d)",
                    wait_seconds, round_num + 2, _MAX_ROUNDS,
                )
                await asyncio.sleep(wait_seconds)

        raise AIServiceUnavailableError(
            primary=self._primary.provider_name,
            fallback=self._fallback.provider_name if self._fallback else None,
            errors=self._last_attempt_errors,
        ) from (last_fallback_error or last_primary_error)
