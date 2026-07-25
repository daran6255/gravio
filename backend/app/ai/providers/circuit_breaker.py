"""Per-provider circuit breaker.

Complements key_pool.py's per-key cooldown with a coarser, per-*provider* signal: if every key
in a provider's pool is failing (not just one), retrying that provider's HTTP endpoint on every
single user request wastes real latency (Groq alone can cost up to 3 sequential 60s-timeout
attempts before ResilientLLMProvider falls back to Gemini). Once tripped, requests skip the
provider's HTTP calls entirely and go straight to the next one in the chain, until a cooldown
elapses and a trial request is allowed through to test recovery.

State is in-memory per worker process, same tradeoff/rationale as key_pool.py's pool state.
"""

from __future__ import annotations

import asyncio
import time
import logging
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)

# Consecutive failures (with no intervening success) that trip the breaker open. Chosen to
# comfortably exceed one request's worth of internal key-pool retries (e.g. Groq's 3 keys) so a
# single request's own rotation doesn't trip the breaker by itself -- it takes roughly two full
# requests failing across every key before the breaker gives up on the provider.
_FAILURE_THRESHOLD = 5

# How long an open breaker waits before allowing one trial request through.
_OPEN_COOLDOWN_SECONDS = 30.0


class _State(str, Enum):
    CLOSED = "closed"        # normal operation
    OPEN = "open"             # provider skipped entirely
    HALF_OPEN = "half_open"   # one trial request in flight


@dataclass
class ProviderCircuitBreaker:
    provider_name: str
    failure_threshold: int = _FAILURE_THRESHOLD
    open_cooldown_seconds: float = _OPEN_COOLDOWN_SECONDS
    _state: _State = field(init=False, default=_State.CLOSED)
    _consecutive_failures: int = field(init=False, default=0)
    _opened_at: float = field(init=False, default=0.0)
    _trial_in_flight: bool = field(init=False, default=False)
    _lock: asyncio.Lock = field(init=False, default_factory=asyncio.Lock)

    @property
    def state(self) -> str:
        return self._state.value

    async def allow_request(self) -> bool:
        """Call before attempting this provider. False means skip it (go to fallback)."""
        async with self._lock:
            if self._state == _State.CLOSED:
                return True

            if self._state == _State.OPEN:
                if time.monotonic() - self._opened_at < self.open_cooldown_seconds:
                    return False
                # Cooldown elapsed -- allow exactly one trial request through.
                self._state = _State.HALF_OPEN
                self._trial_in_flight = True
                logger.info(
                    "Circuit breaker for '%s' entering half-open trial after %.0fs cooldown",
                    self.provider_name, self.open_cooldown_seconds,
                )
                return True

            # HALF_OPEN: only the one in-flight trial gets through; concurrent requests during
            # the trial still treat the provider as unavailable rather than piling on.
            return False

    async def record_success(self) -> None:
        async with self._lock:
            if self._state != _State.CLOSED:
                logger.info("Circuit breaker for '%s' closed after a successful trial", self.provider_name)
            self._state = _State.CLOSED
            self._consecutive_failures = 0
            self._trial_in_flight = False

    async def record_failure(self) -> None:
        async with self._lock:
            if self._state == _State.HALF_OPEN:
                # Trial failed -- back to a fresh open cooldown.
                self._state = _State.OPEN
                self._opened_at = time.monotonic()
                self._trial_in_flight = False
                logger.warning("Circuit breaker for '%s' re-opened after a failed recovery trial", self.provider_name)
                return

            self._consecutive_failures += 1
            if self._consecutive_failures >= self.failure_threshold and self._state == _State.CLOSED:
                self._state = _State.OPEN
                self._opened_at = time.monotonic()
                logger.warning(
                    "Circuit breaker TRIPPED for '%s' after %d consecutive failures -- "
                    "routing around it for %.0fs",
                    self.provider_name, self._consecutive_failures, self.open_cooldown_seconds,
                )


_BREAKERS: dict[str, ProviderCircuitBreaker] = {}
_REGISTRY_LOCK = asyncio.Lock()


async def get_circuit_breaker(provider_name: str) -> ProviderCircuitBreaker:
    """Module-level singleton per provider name, shared across every request in this process."""
    if provider_name in _BREAKERS:
        return _BREAKERS[provider_name]
    async with _REGISTRY_LOCK:
        if provider_name not in _BREAKERS:
            _BREAKERS[provider_name] = ProviderCircuitBreaker(provider_name=provider_name)
        return _BREAKERS[provider_name]


def iter_breakers() -> list[ProviderCircuitBreaker]:
    """Snapshot of all breakers created so far -- used by the health-check task to find which
    providers are currently open and worth probing."""
    return list(_BREAKERS.values())
