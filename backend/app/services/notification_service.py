import logging
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.notification_repository import NotificationRepository
from app.models.notification import Notification

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = NotificationRepository(db)

    async def create_notification(
        self,
        user_id: int,
        title: str,
        message: str,
        notif_type: str,
        link: Optional[str] = None
    ) -> Notification:
        notif_data = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notif_type,
            "link": link
        }
        return await self.repo.create(notif_data)

    async def get_my_notifications(
        self, 
        user_id: int, 
        limit: int = 50, 
        unread_only: bool = False
    ) -> tuple[List[Notification], int]:
        items = await self.repo.get_user_notifications(user_id, limit, unread_only)
        unread_count = await self.repo.get_unread_count(user_id)
        return items, unread_count

    async def mark_as_read(self, public_id: UUID, user_id: int) -> bool:
        return await self.repo.mark_as_read(public_id, user_id)

    async def mark_all_as_read(self, user_id: int) -> int:
        return await self.repo.mark_all_as_read(user_id)

    async def notify_dsr_approved(self, user_id: int, report_date: str, dsr_public_id: UUID):
        await self.create_notification(
            user_id=user_id,
            title="DSR Approved",
            message=f"Your DSR for {report_date} has been approved.",
            notif_type="dsr_approved",
            link=f"/dashboard/dsr?id={dsr_public_id}"
        )

    async def notify_dsr_rejected(self, user_id: int, report_date: str, reason: str, dsr_public_id: UUID):
        await self.create_notification(
            user_id=user_id,
            title="DSR Resubmission Required",
            message=f"Your DSR for {report_date} was rejected: {reason}",
            notif_type="dsr_rejected",
            link=f"/dashboard/dsr?id={dsr_public_id}"
        )

    async def notify_permission_granted(self, user_id: int, target_date: str, dsr_public_id: UUID):
        await self.create_notification(
            user_id=user_id,
            title="DSR Permission Granted",
            message=f"You can now submit DSR for {target_date}.",
            notif_type="permission_granted",
            link=f"/dashboard/dsr?id={dsr_public_id}"
        )

    async def notify_permission_rejected(self, user_id: int, target_date: str, reason: str):
        await self.create_notification(
            user_id=user_id,
            title="DSR Permission Rejected",
            message=f"Your request for {target_date} was rejected: {reason}",
            notif_type="permission_rejected",
            link="/dashboard/dsr"
        )
