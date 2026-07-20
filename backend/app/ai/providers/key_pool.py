"""Round-robin API key pool with per-key rate-limit cooldown.

Generic so any provider can adopt it, not Groq-specific — Groq is the first (and currently
only) consumer, rotating across up to 3 keys so a single key's rate limit never interrupts a
user as long as at least one key in the pool has headroom.

State is in-memory per worker process. In a multi-worker deployment each worker tracks key
health independently — acceptable for this scope; a shared store (e.g. Redis) would be needed
to coordinate cooldowns across workers, which isn't required for the current single-region,
few-worker deployment.
"""

from __future__ import annotations

import asyncio
import time
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class _KeyState:
    key: str
    cooldown_until: float = 0.0  # monotonic time; <= now means usable


@dataclass
class APIKeyPool:
    """Round-robins across N keys, skipping any key currently cooling down from a rate limit."""

    keys: list[str]
    cooldown_seconds: float = 60.0
    _states: list[_KeyState] = field(init=False, default_factory=list)
    _cursor: int = field(init=False, default=0)
    _lock: asyncio.Lock = field(init=False, default_factory=asyncio.Lock)

    def __post_init__(self) -> None:
        # Preserve order, drop duplicates/empties.
        seen: set[str] = set()
        unique_keys = []
        for k in self.keys:
            if k and k not in seen:
                seen.add(k)
                unique_keys.append(k)
        self._states = [_KeyState(key=k) for k in unique_keys]

    def has_keys(self) -> bool:
        return len(self._states) > 0

    @property
    def size(self) -> int:
        return len(self._states)

    async def get_key(self) -> str:
        """Return the next usable key, round-robin. If every key is cooling down, returns the
        one whose cooldown expires soonest (best effort — caller will likely fail fast anyway)."""
        if not self._states:
            raise RuntimeError("APIKeyPool has no keys configured.")

        async with self._lock:
            now = time.monotonic()
            for _ in range(len(self._states)):
                candidate = self._states[self._cursor]
                self._cursor = (self._cursor + 1) % len(self._states)
                if candidate.cooldown_until <= now:
                    return candidate.key

            soonest = min(self._states, key=lambda s: s.cooldown_until)
            return soonest.key

    async def mark_rate_limited(self, key: str, retry_after: float | None = None) -> None:
        async with self._lock:
            for state in self._states:
                if state.key == key:
                    state.cooldown_until = time.monotonic() + (retry_after or self.cooldown_seconds)
                    logger.warning(
                        "Groq key ...%s cooling down for %.0fs after a rate limit",
                        key[-4:], retry_after or self.cooldown_seconds,
                    )
                    break

    def key_index(self, key: str) -> int:
        """1-based position of a key in the pool, for log messages that shouldn't print the key itself."""
        for i, state in enumerate(self._states):
            if state.key == key:
                return i + 1
        return -1
