"""Background task that proactively probes LLM providers whose circuit breaker has tripped.

Without this, a tripped provider only gets a recovery chance when real user traffic happens to
land while its breaker is in the post-cooldown half-open window (see circuit_breaker.py) -- fine
under steady load, but it means degradation can sit undetected during a quiet period instead of
being caught and cleared before the next real request arrives. This mirrors the fixed-interval
asyncio.create_task loop pattern already used for reminder_check_task/timesheet_reminder_task in
app/main.py, not a new scheduler dependency.
"""

from __future__ import annotations

import asyncio

from loguru import logger

from app.ai.providers.circuit_breaker import get_circuit_breaker, iter_breakers

_PROBE_SYSTEM_PROMPT = "You are a lightweight automated health check. Reply with a single word."
_PROBE_USER_MESSAGE = "Reply with: OK"


async def _try_recover(provider_name: str) -> None:
    breaker = await get_circuit_breaker(provider_name)
    if breaker.state != "open":
        return  # already closed, or a real request already has a half-open trial in flight

    # allow_request() is what actually flips OPEN -> HALF_OPEN once the cooldown has elapsed;
    # if it returns False the cooldown just hasn't passed yet, nothing to probe this tick.
    if not await breaker.allow_request():
        return

    from app.ai.providers.factory import _build_provider  # local import: avoids a factory<->health_check cycle

    try:
        provider = _build_provider(provider_name)
        await provider.complete(_PROBE_SYSTEM_PROMPT, _PROBE_USER_MESSAGE, temperature=0.0, max_tokens=5)
    except Exception as e:
        await breaker.record_failure()
        logger.warning(f"AI health check: '{provider_name}' still failing ({e}) — circuit breaker stays open")
    else:
        await breaker.record_success()
        logger.info(f"AI health check: '{provider_name}' recovered — circuit breaker closed")


async def health_check_task(interval_seconds: int = 60) -> None:
    """Long-running loop: every `interval_seconds`, probes any provider whose circuit breaker is
    currently open. A no-op tick (the common case) costs nothing -- iter_breakers() only returns
    breakers that have actually been created, and this skips straight past any that are closed."""
    logger.info("Starting AI provider health-check background task...")
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            for breaker in iter_breakers():
                if breaker.state == "open":
                    await _try_recover(breaker.provider_name)
        except asyncio.CancelledError:
            logger.info("AI provider health-check task cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in AI provider health-check task: {e}")
