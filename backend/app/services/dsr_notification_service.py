"""DSR Notification Service — reminder stub, ready to wire to email/Celery"""

import logging
from datetime import date
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


class DSRNotificationService:
    """
    Handles DSR reminder notifications.

    Currently logs reminder events. To integrate real email/push notifications,
    replace _dispatch_reminder() with your email/Celery task call.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def send_dsr_reminder(
        self,
        user_ids: List[int],
        report_date: date,
        message: str | None = None,
    ) -> dict:
        """
        Send DSR submission reminders to a list of users.

        Returns a summary dict with sent count and any failures.
        """
        results = {"sent": 0, "failed": 0, "details": []}

        for user_id in user_ids:
            try:
                await self._dispatch_reminder(user_id, report_date, message)
                results["sent"] += 1
                results["details"].append({"user_id": user_id, "status": "sent"})
                logger.info(
                    "DSR reminder dispatched: user_id=%s, report_date=%s",
                    user_id,
                    report_date,
                )
            except Exception as exc:  # pragma: no cover
                results["failed"] += 1
                results["details"].append({"user_id": user_id, "status": "failed", "error": str(exc)})
                logger.error(
                    "DSR reminder failed: user_id=%s, error=%s",
                    user_id,
                    exc,
                )

        return results

    async def _dispatch_reminder(
        self,
        user_id: int,
        report_date: date,
        message: str | None,
    ) -> None:
        """
        Dispatch a single reminder. 

        Replace this method body to integrate:
        - Email: await email_service.send(user_id, subject, body)
        - Celery: send_reminder_task.delay(user_id, str(report_date))
        - WebSocket/Push: await ws_manager.notify(user_id, payload)
        """
        logger.info(
            "[STUB] Would send DSR reminder to user_id=%s for date=%s. Message: %s",
            user_id,
            report_date,
            message or "Please submit your Daily Status Report.",
        )
