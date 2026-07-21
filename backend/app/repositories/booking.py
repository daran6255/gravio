"""Data access layer for the Calendar & Appointment Booking Scheduler"""

import uuid
from datetime import date as date_type, datetime
from typing import Optional

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import (
    BookingAvailabilityException,
    BookingPage,
    CalendarSyncStatus,
    GoogleOAuthConnection,
    MeetingStatus,
    ScheduledMeeting,
)


class GoogleOAuthConnectionRepository:
    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: int) -> Optional[GoogleOAuthConnection]:
        result = await db.execute(
            select(GoogleOAuthConnection).where(GoogleOAuthConnection.user_id == user_id)
        )
        return result.scalars().first()

    @staticmethod
    async def upsert(db: AsyncSession, *, user_id: int, **kwargs) -> GoogleOAuthConnection:
        connection = await GoogleOAuthConnectionRepository.get_by_user_id(db, user_id)
        if connection is None:
            connection = GoogleOAuthConnection(user_id=user_id, **kwargs)
            db.add(connection)
        else:
            for key, val in kwargs.items():
                setattr(connection, key, val)
        await db.flush()
        await db.refresh(connection)
        return connection

    @staticmethod
    async def update(db: AsyncSession, connection: GoogleOAuthConnection, **kwargs) -> GoogleOAuthConnection:
        for key, val in kwargs.items():
            setattr(connection, key, val)
        await db.flush()
        await db.refresh(connection)
        return connection

    @staticmethod
    async def delete(db: AsyncSession, connection: GoogleOAuthConnection) -> None:
        await db.delete(connection)
        await db.flush()


class BookingPageRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, page_id: int) -> Optional[BookingPage]:
        return await db.get(BookingPage, page_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[BookingPage]:
        result = await db.execute(select(BookingPage).where(BookingPage.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_slug(db: AsyncSession, slug: str) -> Optional[BookingPage]:
        result = await db.execute(
            select(BookingPage)
            .options(selectinload(BookingPage.user))
            .where(BookingPage.slug == slug)
        )
        return result.scalars().first()

    @staticmethod
    async def lock_by_id_for_update(db: AsyncSession, page_id: int) -> Optional[BookingPage]:
        """Locks the BookingPage row for the duration of the caller's transaction.

        Used as the serialization point for concurrent booking attempts on the same
        page: two requests racing for the same slot both try to lock this row first,
        so the second one blocks until the first commits/rolls back, then re-checks
        for conflicts with up-to-date data — closing the race a naive
        check-then-insert would leave open.
        """
        result = await db.execute(
            select(BookingPage).where(BookingPage.id == page_id).with_for_update()
        )
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, user_id: int, slug: str, title: str, **kwargs) -> BookingPage:
        page = BookingPage(user_id=user_id, slug=slug, title=title, **kwargs)
        db.add(page)
        await db.flush()
        await db.refresh(page)
        return page

    @staticmethod
    async def update(db: AsyncSession, page: BookingPage, **kwargs) -> BookingPage:
        for key, val in kwargs.items():
            setattr(page, key, val)
        await db.flush()
        await db.refresh(page)
        return page

    @staticmethod
    async def list_for_user(db: AsyncSession, *, user_id: int) -> list[BookingPage]:
        result = await db.execute(
            select(BookingPage)
            .where(BookingPage.user_id == user_id, BookingPage.is_deleted.is_(False))
            .order_by(BookingPage.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def slug_exists(db: AsyncSession, slug: str) -> bool:
        result = await db.execute(select(BookingPage.id).where(BookingPage.slug == slug))
        return result.scalars().first() is not None


class BookingAvailabilityExceptionRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, exception_id: int) -> Optional[BookingAvailabilityException]:
        return await db.get(BookingAvailabilityException, exception_id)

    @staticmethod
    async def list_for_page_in_range(
        db: AsyncSession, *, booking_page_id: int, start_date: date_type, end_date: date_type
    ) -> list[BookingAvailabilityException]:
        result = await db.execute(
            select(BookingAvailabilityException).where(
                BookingAvailabilityException.booking_page_id == booking_page_id,
                BookingAvailabilityException.date >= start_date,
                BookingAvailabilityException.date <= end_date,
                BookingAvailabilityException.is_deleted.is_(False),
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_for_page_and_date(
        db: AsyncSession, *, booking_page_id: int, date: date_type
    ) -> Optional[BookingAvailabilityException]:
        result = await db.execute(
            select(BookingAvailabilityException).where(
                BookingAvailabilityException.booking_page_id == booking_page_id,
                BookingAvailabilityException.date == date,
                BookingAvailabilityException.is_deleted.is_(False),
            )
        )
        return result.scalars().first()

    @staticmethod
    async def create(db: AsyncSession, *, booking_page_id: int, date: date_type, **kwargs) -> BookingAvailabilityException:
        exception = BookingAvailabilityException(booking_page_id=booking_page_id, date=date, **kwargs)
        db.add(exception)
        await db.flush()
        await db.refresh(exception)
        return exception

    @staticmethod
    async def delete(db: AsyncSession, exception: BookingAvailabilityException) -> None:
        exception.soft_delete()
        await db.flush()


class ScheduledMeetingRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, meeting_id: int) -> Optional[ScheduledMeeting]:
        return await db.get(ScheduledMeeting, meeting_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[ScheduledMeeting]:
        result = await db.execute(select(ScheduledMeeting).where(ScheduledMeeting.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def get_by_manage_token(db: AsyncSession, manage_token: str) -> Optional[ScheduledMeeting]:
        result = await db.execute(
            select(ScheduledMeeting)
            .options(selectinload(ScheduledMeeting.booking_page))
            .where(ScheduledMeeting.manage_token == manage_token)
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_idempotency_key(db: AsyncSession, idempotency_key: str) -> Optional[ScheduledMeeting]:
        result = await db.execute(
            select(ScheduledMeeting).where(ScheduledMeeting.idempotency_key == idempotency_key)
        )
        return result.scalars().first()

    @staticmethod
    async def list_overlapping(
        db: AsyncSession, *, booking_page_id: int, start_time: datetime, end_time: datetime,
        exclude_meeting_id: Optional[int] = None,
    ) -> list[ScheduledMeeting]:
        """Active (non-cancelled) meetings on this page overlapping [start_time, end_time).

        exclude_meeting_id lets a reschedule re-validate the new time without the
        meeting's own current (pre-move) row counting as a conflict against itself.
        """
        conditions = [
            ScheduledMeeting.booking_page_id == booking_page_id,
            ScheduledMeeting.status == MeetingStatus.SCHEDULED,
            ScheduledMeeting.start_time < end_time,
            ScheduledMeeting.end_time > start_time,
        ]
        if exclude_meeting_id is not None:
            conditions.append(ScheduledMeeting.id != exclude_meeting_id)
        result = await db.execute(select(ScheduledMeeting).where(*conditions))
        return list(result.scalars().all())

    @staticmethod
    async def count_for_page_on_date(
        db: AsyncSession, *, booking_page_id: int, day_start: datetime, day_end: datetime,
        exclude_meeting_id: Optional[int] = None,
    ) -> int:
        from sqlalchemy import func

        conditions = [
            ScheduledMeeting.booking_page_id == booking_page_id,
            ScheduledMeeting.status == MeetingStatus.SCHEDULED,
            ScheduledMeeting.start_time >= day_start,
            ScheduledMeeting.start_time < day_end,
        ]
        if exclude_meeting_id is not None:
            conditions.append(ScheduledMeeting.id != exclude_meeting_id)
        result = await db.execute(select(func.count()).select_from(ScheduledMeeting).where(*conditions))
        return result.scalar_one()

    @staticmethod
    async def create(db: AsyncSession, *, booking_page_id: int, **kwargs) -> ScheduledMeeting:
        meeting = ScheduledMeeting(booking_page_id=booking_page_id, **kwargs)
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

        conditions = [BookingPage.user_id == user_id, ScheduledMeeting.is_deleted.is_(False)]
        if status is not None:
            conditions.append(ScheduledMeeting.status == status)
        if start_after is not None:
            conditions.append(ScheduledMeeting.start_time >= start_after)
        if search:
            like = f"%{search}%"
            conditions.append(or_(ScheduledMeeting.client_name.ilike(like), ScheduledMeeting.client_email.ilike(like)))

        base = select(ScheduledMeeting).join(BookingPage, ScheduledMeeting.booking_page_id == BookingPage.id).where(*conditions)

        count_result = await db.execute(
            select(func.count()).select_from(ScheduledMeeting)
            .join(BookingPage, ScheduledMeeting.booking_page_id == BookingPage.id)
            .where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            base.order_by(ScheduledMeeting.start_time.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def list_pending_sync(db: AsyncSession, *, max_attempts: int) -> list[int]:
        """Cheap, lock-free id scan of meetings needing a Google sync (re)attempt —
        mirrors CRMReminderRepository.list_due_ids; each id is then claimed
        individually by the sync worker."""
        result = await db.execute(
            select(ScheduledMeeting.id).where(
                ScheduledMeeting.status == MeetingStatus.SCHEDULED,
                or_(
                    ScheduledMeeting.calendar_sync_status == CalendarSyncStatus.PENDING,
                    and_(
                        ScheduledMeeting.calendar_sync_status == CalendarSyncStatus.FAILED,
                        ScheduledMeeting.calendar_sync_attempts < max_attempts,
                    ),
                ),
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def claim_for_sync(db: AsyncSession, meeting_id: int) -> Optional[ScheduledMeeting]:
        """Locks a single meeting for this worker only (SKIP LOCKED) — same pattern as
        CRMReminderRepository.claim_one, applied to calendar-sync retries instead of reminders."""
        result = await db.execute(
            select(ScheduledMeeting)
            .options(selectinload(ScheduledMeeting.booking_page).selectinload(BookingPage.user))
            .where(ScheduledMeeting.id == meeting_id)
            .with_for_update(skip_locked=True)
        )
        return result.scalars().first()
