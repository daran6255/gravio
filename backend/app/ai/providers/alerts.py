"""Full-exhaustion alerting -- fires when every key on every configured LLM provider has failed
for a single request (i.e. AIServiceUnavailableError reached the caller). This should be rare;
per the graceful-degradation requirements it's meant to page the team, not the end user.

Two channels, matching what already exists in this codebase (no new external integrations):
  1. A structured ERROR log line -- the "real-time monitoring" signal, consistent with how
     circuit_breaker.py/key_pool.py already log trips and dead keys.
  2. An in-app notification to platform superusers (User.is_superuser=True with no
     organization_id -- the actual "team" account, seeded in core/seed.py), via the existing
     NotificationService. Reuses its documented cross-org `organization_id` override so a
     superuser can be notified about a failure that happened in a tenant org they don't belong to.
"""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import NotificationType
from app.models.user import User
from app.services.notification import NotificationService

logger = logging.getLogger(__name__)


async def alert_full_exhaustion(
    db: AsyncSession,
    *,
    organization_id: int,
    errors: dict[str, str],
    context: str,
) -> None:
    """`errors` is the {provider_name: last_error} map AIServiceUnavailableError carries in
    `detail["errors"]`. `context` is a short human label for where this happened (e.g. "chat
    message", "agentic task run") so the alert is actionable without needing to correlate logs."""
    logger.error(
        "AI FULL EXHAUSTION [%s] org=%s — every provider/key failed: %s",
        context, organization_id, errors,
    )

    result = await db.execute(
        select(User).where(User.is_superuser.is_(True), User.organization_id.is_(None))
    )
    superusers = result.scalars().all()
    if not superusers:
        logger.warning("AI full exhaustion occurred but no platform superuser exists to notify.")
        return

    detail_lines = "\n".join(f"- {provider}: {error}" for provider, error in errors.items()) or "(no detail captured)"
    message = f"Every configured LLM provider/key failed for a {context} in org {organization_id}.\n{detail_lines}"

    for su in superusers:
        await NotificationService.notify(
            db,
            user_id=su.id,
            type=NotificationType.AI_PROVIDER_EXHAUSTED,
            title="IRIS: full LLM provider exhaustion",
            message=message,
            organization_id=organization_id,
        )
