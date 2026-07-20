"""Cross-provider fallback wrapper.

Tries the primary provider (which, for providers like Groq, already retries across its own
API key pool internally — see key_pool.py). If the primary is fully exhausted/down, retries
once against a configured secondary provider before giving up. Every failure is logged with
which provider failed and why, so an eventual error is diagnosable rather than a bare
stack trace reaching the client.
"""

from __future__ import annotations

import logging
from typing import AsyncGenerator

from app.ai.providers.base import LLMProvider, LLMResponse
from app.ai.brain.exceptions import LLMProviderError, LLMRateLimitError
from app.middleware.exceptions import AIServiceUnavailableError

logger = logging.getLogger(__name__)

_RECOVERABLE = (LLMRateLimitError, LLMProviderError)


class ResilientLLMProvider(LLMProvider):
    """Wraps a primary LLMProvider with an optional one-shot fallback provider."""

    def __init__(self, primary: LLMProvider, fallback: LLMProvider | None = None) -> None:
        self._primary = primary
        self._fallback = fallback
        # Tracks whichever provider actually served the most recent call, so callers (the
        # credits metering layer) charge the correct provider's cost multiplier.
        self._last_served: LLMProvider = primary

    @property
    def provider_name(self) -> str:
        return self._last_served.provider_name

    @property
    def model_name(self) -> str:
        return self._last_served.model_name

    async def complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> LLMResponse:
        try:
            result = await self._primary.complete(system_prompt, user_message, temperature, max_tokens)
            self._last_served = self._primary
            return result
        except _RECOVERABLE as primary_error:
            logger.warning(
                "Primary AI provider '%s' failed (%s); %s",
                self._primary.provider_name, primary_error,
                f"falling back to '{self._fallback.provider_name}'" if self._fallback else "no fallback configured",
            )
            if self._fallback is None:
                raise AIServiceUnavailableError(primary=self._primary.provider_name) from primary_error

            try:
                result = await self._fallback.complete(system_prompt, user_message, temperature, max_tokens)
                self._last_served = self._fallback
                return result
            except _RECOVERABLE as fallback_error:
                logger.error(
                    "Fallback AI provider '%s' also failed (%s) after primary '%s' failed (%s)",
                    self._fallback.provider_name, fallback_error,
                    self._primary.provider_name, primary_error,
                )
                raise AIServiceUnavailableError(
                    primary=self._primary.provider_name, fallback=self._fallback.provider_name,
                ) from fallback_error

    async def stream_complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> AsyncGenerator[str, None]:
        # A stream that fails after already yielding partial content can't cleanly "fall back"
        # mid-stream (the caller has already seen output from the primary) — fallback only
        # applies if the primary fails before yielding anything.
        yielded_any = False
        try:
            async for chunk in self._primary.stream_complete(system_prompt, user_message, temperature, max_tokens):
                yielded_any = True
                self._last_served = self._primary
                yield chunk
            return
        except _RECOVERABLE as primary_error:
            if yielded_any or self._fallback is None:
                logger.error(
                    "Primary AI provider '%s' failed mid-stream (%s); %s",
                    self._primary.provider_name, primary_error,
                    "partial content already sent, cannot fall back" if yielded_any else "no fallback configured",
                )
                raise AIServiceUnavailableError(primary=self._primary.provider_name) from primary_error

            logger.warning(
                "Primary AI provider '%s' failed before yielding any content (%s); falling back to '%s'",
                self._primary.provider_name, primary_error, self._fallback.provider_name,
            )

        try:
            async for chunk in self._fallback.stream_complete(system_prompt, user_message, temperature, max_tokens):
                self._last_served = self._fallback
                yield chunk
        except _RECOVERABLE as fallback_error:
            logger.error(
                "Fallback AI provider '%s' also failed (%s)",
                self._fallback.provider_name, fallback_error,
            )
            raise AIServiceUnavailableError(
                primary=self._primary.provider_name, fallback=self._fallback.provider_name,
            ) from fallback_error
