"""Data access layer for Meetings."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.booking import MeetingStatus, ScheduledMeeting


class ScheduledMeetingRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, meeting_id: int) -> Optional[ScheduledMeeting]:
        return await db.get(ScheduledMeeting, meeting_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[ScheduledMeeting]:
        result = await db.execute(select(ScheduledMeeting).where(ScheduledMeeting.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_idempotency_key(db: AsyncSession, idempotency_key: str) -> Optional[ScheduledMeeting]:
        result = await db.execute(
            select(ScheduledMeeting).where(ScheduledMeeting.idempotency_key == idempotency_key)
        )
        return result.scalars().first()

    @staticmethod
    async def list_overlapping(
        db: AsyncSession, *, host_user_id: int, start_time: datetime, end_time: datetime,
        exclude_meeting_id: Optional[int] = None,
    ) -> list[ScheduledMeeting]:
        """Active (non-cancelled) meetings on this host's calendar overlapping
        [start_time, end_time). exclude_meeting_id lets a reschedule re-validate the
        new time without the meeting's own current (pre-move) row counting as a
        conflict against itself."""
        conditions = [
            ScheduledMeeting.host_user_id == host_user_id,
            ScheduledMeeting.status == MeetingStatus.SCHEDULED,
            ScheduledMeeting.start_time < end_time,
            ScheduledMeeting.end_time > start_time,
        ]
        if exclude_meeting_id is not None:
            conditions.append(ScheduledMeeting.id != exclude_meeting_id)
        result = await db.execute(select(ScheduledMeeting).where(*conditions))
        return list(result.scalars().all())

    @staticmethod
    async def create(db: AsyncSession, *, host_user_id: int, **kwargs) -> ScheduledMeeting:
        meeting = ScheduledMeeting(host_user_id=host_user_id, **kwargs)
        db.add(meeting)
        await db.flush()
        await db.refresh(meeting)
        return meeting

    @staticmethod
    async def update(db: AsyncSession, meeting: ScheduledMeeting, **kwargs) -> ScheduledMeeting:
        for key, val in kwargs.items():
            setattr(meeting, key, val)
        await db.flush()
        await db.refresh(meeting)
        return meeting

    @staticmethod
    async def list_for_user(
        db: AsyncSession, *, user_id: int, status: Optional[MeetingStatus] = None,
        start_after: Optional[datetime] = None, search: Optional[str] = None,
        page: int = 1, page_size: int = 20,
    ) -> tuple[list[ScheduledMeeting], int]:
        from sqlalchemy import func

        conditions = [ScheduledMeeting.host_user_id == user_id, ScheduledMeeting.is_deleted.is_(False)]
        if status is not None:
            conditions.append(ScheduledMeeting.status == status)
        if start_after is not None:
            conditions.append(ScheduledMeeting.start_time >= start_after)
        if search:
            like = f"%{search}%"
            conditions.append(or_(ScheduledMeeting.client_name.ilike(like), ScheduledMeeting.client_email.ilike(like)))

        base = select(ScheduledMeeting).where(*conditions)

        count_result = await db.execute(select(func.count()).select_from(ScheduledMeeting).where(*conditions))
        total = count_result.scalar_one()

        result = await db.execute(
            base.order_by(ScheduledMeeting.start_time.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total
