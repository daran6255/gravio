import httpx
import json
import logging
from typing import AsyncGenerator
from app.core.config import settings
from app.ai.brain.exceptions import LLMAuthError, LLMProviderError, LLMRateLimitError
from app.ai.providers.base import LLMProvider, LLMResponse
from app.ai.providers.key_pool import APIKeyPool

logger = logging.getLogger(__name__)


def _build_key_pool() -> APIKeyPool:
    keys = [
        settings.GROQ_API_KEY_1,
        settings.GROQ_API_KEY_2,
        settings.GROQ_API_KEY_3,
        settings.GROQ_API_KEY,  # legacy single-key var, folded in if set
    ]
    return APIKeyPool(keys=[k for k in keys if k])


# Module-level singleton so the pool's cooldown state is shared across every GroqProvider
# instance/request within this process, not reset per-call.
_KEY_POOL: APIKeyPool | None = None


def _get_key_pool() -> APIKeyPool:
    global _KEY_POOL
    if _KEY_POOL is None:
        _KEY_POOL = _build_key_pool()
    return _KEY_POOL


class GroqProvider(LLMProvider):
    """Groq adapter. Rotates across up to 3 API keys (GROQ_API_KEY_1/2/3, plus the legacy
    single-key GROQ_API_KEY) on rate limit, so one key's limit never interrupts a user as long
    as another key in the pool has headroom."""

    BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._model = model or settings.AI_MODEL_GROQ
        self._last_stream_usage: int | None = None

        if api_key:
            # Explicit key passed (e.g. a test/override) — use it alone, no pool rotation.
            self._pool = APIKeyPool(keys=[api_key])
        else:
            self._pool = _get_key_pool()

        if not self._pool.has_keys() or not self._pool.has_live_keys():
            raise LLMAuthError("groq")

    @property
    def provider_name(self) -> str:
        return "groq"

    @property
    def model_name(self) -> str:
        return self._model

    def get_last_stream_usage(self) -> int | None:
        """Total tokens from the most recently completed stream_complete() call, if the API
        returned it (requires `stream_options.include_usage`, sent below). None if unavailable —
        callers should estimate from output length instead."""
        return self._last_stream_usage

    async def complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> LLMResponse:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        last_error: LLMProviderError | None = None
        for attempt in range(self._pool.size):
            try:
                key = await self._pool.get_key()
            except RuntimeError:
                break  # every key went dead mid-loop
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    resp = await client.post(self.BASE_URL, json=payload, headers=headers)
            except (httpx.TimeoutException, httpx.ConnectError, httpx.RequestError) as e:
                logger.warning(
                    "Groq key #%d/%d network error (%s) on attempt %d/%d — rotating to next key",
                    self._pool.key_index(key), self._pool.size, e, attempt + 1, self._pool.size,
                )
                last_error = LLMProviderError(f"Groq network error: {e}", provider="groq")
                continue

            if resp.status_code == 413:
                # Groq reports "request too large for this model" as a 413 whose body
                # still carries code=="rate_limit_exceeded" (it's a token-budget error,
                # not an RPM one) -- treating that as a per-key rate limit would rotate
                # through and cool down every key in the pool for a request that's too
                # big for all of them equally. Fail fast instead so the resilient
                # wrapper can fall back to another provider without burning 60s per key.
                raise LLMProviderError(
                    f"Request too large for Groq model '{self._model}' (413).", provider="groq",
                )

            if resp.status_code == 429:
                retry_after = resp.headers.get("retry-after")
                await self._pool.mark_rate_limited(key, float(retry_after) if retry_after else None)
                logger.warning(
                    "Groq key #%d/%d rate-limited (attempt %d/%d) — rotating to next key",
                    self._pool.key_index(key), self._pool.size, attempt + 1, self._pool.size,
                )
                last_error = LLMRateLimitError(provider="groq", retry_after=int(float(retry_after)) if retry_after else None)
                continue

            if resp.status_code in (401, 403):
                await self._pool.mark_dead(key)
                last_error = LLMProviderError(f"Groq auth error ({resp.status_code}) on key #{self._pool.key_index(key)}.", provider="groq")
                continue

            if resp.status_code >= 500:
                logger.warning(
                    "Groq key #%d/%d server error (%d) on attempt %d/%d — rotating to next key",
                    self._pool.key_index(key), self._pool.size, resp.status_code, attempt + 1, self._pool.size,
                )
                last_error = LLMProviderError(f"Groq server error ({resp.status_code}): {resp.text}", provider="groq")
                continue

            if not resp.is_success:
                try:
                    error_data = resp.json()
                    if error_data.get("error", {}).get("code") == "rate_limit_exceeded":
                        await self._pool.mark_rate_limited(key)
                        last_error = LLMRateLimitError(provider="groq")
                        continue
                except Exception:
                    pass
                raise LLMProviderError(f"Groq error: {resp.text}", provider="groq")

            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            tokens_used = data.get("usage", {}).get("total_tokens")
            return LLMResponse(content=content, tokens_used=tokens_used, raw_response=data)

        # Every key in the pool failed (rate-limited, dead, erroring, or unreachable).
        raise last_error or LLMRateLimitError(provider="groq")

    async def stream_complete(self, system_prompt, user_message, temperature=0.2, max_tokens=4096) -> AsyncGenerator[str, None]:
        self._last_stream_usage = None
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
            "stream_options": {"include_usage": True},
        }

        last_error: LLMProviderError | None = None
        for attempt in range(self._pool.size):
            try:
                key = await self._pool.get_key()
            except RuntimeError:
                break  # every key went dead mid-loop
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            yielded_any = False

            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream("POST", self.BASE_URL, json=payload, headers=headers) as response:
                        if response.status_code == 413:
                            # See the non-streaming complete() for why 413 must not be treated
                            # as a rotatable per-key rate limit.
                            raise LLMProviderError(
                                f"Request too large for Groq model '{self._model}' (413).", provider="groq",
                            )

                        if response.status_code == 429:
                            retry_after = response.headers.get("retry-after")
                            await self._pool.mark_rate_limited(key, float(retry_after) if retry_after else None)
                            logger.warning(
                                "Groq key #%d/%d rate-limited on stream (attempt %d/%d) — rotating",
                                self._pool.key_index(key), self._pool.size, attempt + 1, self._pool.size,
                            )
                            last_error = LLMRateLimitError(provider="groq", retry_after=int(float(retry_after)) if retry_after else None)
                            continue

                        if response.status_code in (401, 403):
                            await self._pool.mark_dead(key)
                            last_error = LLMProviderError(f"Groq auth error ({response.status_code}) on key #{self._pool.key_index(key)}.", provider="groq")
                            continue

                        if response.status_code >= 500:
                            logger.warning(
                                "Groq key #%d/%d server error (%d) on stream attempt %d/%d — rotating",
                                self._pool.key_index(key), self._pool.size, response.status_code, attempt + 1, self._pool.size,
                            )
                            error_text = await response.aread()
                            last_error = LLMProviderError(f"Groq server error ({response.status_code}): {error_text.decode()}", provider="groq")
                            continue

                        if not response.is_success:
                            error_text = await response.aread()
                            raise LLMProviderError(f"Groq streaming error: {error_text.decode()}", provider="groq")

                        async for line in response.aiter_lines():
                            if not line.startswith("data: "):
                                continue

                            data_str = line[6:]
                            if data_str == "[DONE]":
                                return

                            try:
                                data = json.loads(data_str)
                            except json.JSONDecodeError:
                                continue

                            usage = data.get("usage")
                            if usage:
                                self._last_stream_usage = usage.get("total_tokens")

                            choices = data.get("choices") or []
                            if not choices:
                                continue
                            delta = choices[0].get("delta", {}).get("content", "")
                            if delta:
                                yielded_any = True
                                yield delta
                        return  # stream completed successfully on this key
            except (httpx.TimeoutException, httpx.ConnectError, httpx.RequestError) as e:
                if yielded_any:
                    # Partial content already reached the caller -- can't silently splice in a
                    # fresh completion from another key without producing incoherent output.
                    # Let ResilientLLMProvider's own "failed mid-stream" handling take over.
                    raise LLMProviderError(f"Groq network error mid-stream: {e}", provider="groq") from e
                logger.warning(
                    "Groq key #%d/%d network error (%s) on stream attempt %d/%d — rotating to next key",
                    self._pool.key_index(key), self._pool.size, e, attempt + 1, self._pool.size,
                )
                last_error = LLMProviderError(f"Groq network error: {e}", provider="groq")
                continue

        raise last_error or LLMRateLimitError(provider="groq")
