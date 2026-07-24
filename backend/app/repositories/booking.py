"""Data access layer for Meetings."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.booking import HostAvailabilityRule, HostAvailabilitySettings, MeetingStatus, ScheduledMeeting


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
    async def list_overlapping_any_host(
        db: AsyncSession, *, start_time: datetime, end_time: datetime, exclude_meeting_id: Optional[int] = None,
    ) -> list[ScheduledMeeting]:
        """Active meetings overlapping [start_time, end_time) regardless of who's
        hosting — used to check invited participants' own availability (see
        app/services/booking.py's _participant_conflict_name), not just the
        requesting host's calendar. Unscoped by host_user_id so it also catches a
        participant who's merely *attending* (not hosting) another meeting at this
        time; automatically narrowed to the current organization by the tenant
        filter on TenantAwareMixin queries (see core/database.py)."""
        conditions = [
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
        start_after: Optional[datetime] = None, start_before: Optional[datetime] = None,
        search: Optional[str] = None, page: int = 1, page_size: int = 20,
    ) -> tuple[list[ScheduledMeeting], int]:
        return await ScheduledMeetingRepository.list_for_hosts(
            db, host_user_ids=[user_id], status=status, start_after=start_after,
            start_before=start_before, search=search, page=page, page_size=page_size,
        )

    @staticmethod
    async def list_for_hosts(
        db: AsyncSession, *, host_user_ids: list[int], status: Optional[MeetingStatus] = None,
        start_after: Optional[datetime] = None, start_before: Optional[datetime] = None,
        search: Optional[str] = None, page: int = 1, page_size: int = 20,
        with_host: bool = False,
    ) -> tuple[list[ScheduledMeeting], int]:
        """Generalizes list_for_user to one or more hosts — used directly by a host's
        own Meetings view (a single-element list) and by the manager/admin team view
        (gap 7, multiple hosts). with_host eager-loads the host relationship so the
        team view can show who owns each meeting without N+1 queries."""
        from sqlalchemy import func

        conditions = [ScheduledMeeting.host_user_id.in_(host_user_ids), ScheduledMeeting.is_deleted.is_(False)]
        if status is not None:
            conditions.append(ScheduledMeeting.status == status)
        if start_after is not None:
            conditions.append(ScheduledMeeting.start_time >= start_after)
        if start_before is not None:
            conditions.append(ScheduledMeeting.start_time <= start_before)
        if search:
            like = f"%{search}%"
            conditions.append(or_(ScheduledMeeting.client_name.ilike(like), ScheduledMeeting.client_email.ilike(like)))

        base = select(ScheduledMeeting).where(*conditions)
        if with_host:
            base = base.options(selectinload(ScheduledMeeting.host))

        count_result = await db.execute(select(func.count()).select_from(ScheduledMeeting).where(*conditions))
        total = count_result.scalar_one()

        result = await db.execute(
            base.order_by(ScheduledMeeting.start_time.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def list_active_series(db: AsyncSession, *, recurrence_group_id: uuid.UUID, from_start_time: datetime) -> list[ScheduledMeeting]:
        """All not-yet-cancelled occurrences of a recurring series from a given point
        forward — used by cancel-series to cancel 'this and all following'."""
        result = await db.execute(
            select(ScheduledMeeting).where(
                ScheduledMeeting.recurrence_group_id == recurrence_group_id,
                ScheduledMeeting.status == MeetingStatus.SCHEDULED,
                ScheduledMeeting.start_time >= from_start_time,
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def list_due_for_client_reminder(
        db: AsyncSession, *, column_name: str, before: datetime,
    ) -> list[int]:
        """Ids of scheduled meetings starting before `before` whose given reminder
        column (client_reminder_24h_sent_at / client_reminder_1h_sent_at) hasn't been
        set yet. Lock-free id scan — app/services/meeting_scheduler.py claims each one
        individually via a conditional UPDATE."""
        column = getattr(ScheduledMeeting, column_name)
        now = datetime.now(before.tzinfo)
        result = await db.execute(
            select(ScheduledMeeting.id).where(
                ScheduledMeeting.status == MeetingStatus.SCHEDULED,
                ScheduledMeeting.start_time > now,
                ScheduledMeeting.start_time <= before,
                column.is_(None),
            )
        )
        return [row[0] for row in result.all()]

    @staticmethod
    async def claim_client_reminder(db: AsyncSession, *, meeting_id: int, column_name: str, now: datetime) -> bool:
        """Conditional UPDATE that only succeeds if this reminder hasn't been claimed
        yet — safe under multiple app instances polling concurrently without needing
        a row lock (mirrors the intent of CRMReminderRepository.claim_one's
        skip_locked, via an optimistic update instead)."""
        from sqlalchemy import update

        result = await db.execute(
            update(ScheduledMeeting)
            .where(ScheduledMeeting.id == meeting_id, getattr(ScheduledMeeting, column_name).is_(None))
            .values(**{column_name: now})
        )
        return result.rowcount > 0

    @staticmethod
    async def list_due_for_auto_complete(db: AsyncSession, *, now: datetime) -> list[int]:
        result = await db.execute(
            select(ScheduledMeeting.id).where(
                ScheduledMeeting.status == MeetingStatus.SCHEDULED,
                ScheduledMeeting.end_time < now,
            )
        )
        return [row[0] for row in result.all()]


class HostAvailabilityRepository:
    @staticmethod
    async def get_settings_by_user(db: AsyncSession, user_id: int) -> Optional[HostAvailabilitySettings]:
        result = await db.execute(
            select(HostAvailabilitySettings)
            .options(selectinload(HostAvailabilitySettings.rules))
            .where(HostAvailabilitySettings.user_id == user_id, HostAvailabilitySettings.is_deleted.is_(False))
        )
        return result.scalars().first()

    @staticmethod
    async def get_settings_by_share_token(db: AsyncSession, token: uuid.UUID) -> Optional[HostAvailabilitySettings]:
        """Looked up by token alone -- no organization scoping, since the token
        itself is the credential for an unauthenticated visitor with no tenant
        context (same convention as Project's share_token lookup)."""
        result = await db.execute(
            select(HostAvailabilitySettings)
            .options(selectinload(HostAvailabilitySettings.rules))
            .where(HostAvailabilitySettings.share_token == token, HostAvailabilitySettings.is_deleted.is_(False))
        )
        return result.scalars().first()

    @staticmethod
    async def create_settings(db: AsyncSession, *, user_id: int, organization_id: int, timezone: str) -> HostAvailabilitySettings:
        settings = HostAvailabilitySettings(user_id=user_id, organization_id=organization_id, timezone=timezone)
        db.add(settings)
        await db.flush()
        await db.refresh(settings, attribute_names=["rules"])
        return settings

    @staticmethod
    async def update_settings(db: AsyncSession, settings: HostAvailabilitySettings, **kwargs) -> HostAvailabilitySettings:
        for key, val in kwargs.items():
            if val is not None:
                setattr(settings, key, val)
        await db.flush()
        return settings

    @staticmethod
    async def replace_rules(
        db: AsyncSession, *, settings: HostAvailabilitySettings, user_id: int, organization_id: int,
        rules: list[dict],
    ) -> list[HostAvailabilityRule]:
        """Wholesale replace -- the weekly schedule is small and edited as a whole
        page, not row-by-row, so there's no reason to diff it (same approach as
        Project's task-status board reset)."""
        for existing in list(settings.rules):
            await db.delete(existing)
        await db.flush()

        created = []
        for r in rules:
            rule = HostAvailabilityRule(
                user_id=user_id,
                organization_id=organization_id,
                settings_id=settings.id,
                weekday=r["weekday"],
                start_time=r["start_time"],
                end_time=r["end_time"],
            )
            db.add(rule)
            created.append(rule)
        await db.flush()
        return created

    @staticmethod
    async def list_rules_for_weekday(db: AsyncSession, *, settings_id: int, weekday: int) -> list[HostAvailabilityRule]:
        result = await db.execute(
            select(HostAvailabilityRule).where(
                HostAvailabilityRule.settings_id == settings_id,
                HostAvailabilityRule.weekday == weekday,
                HostAvailabilityRule.is_deleted.is_(False),
            ).order_by(HostAvailabilityRule.start_time.asc())
        )
        return list(result.scalars().all())
