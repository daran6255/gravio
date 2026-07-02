"""Data access layer for CRMReminder"""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.reminder import CRMReminder, ReminderStatus


class CRMReminderRepository:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> CRMReminder:
        reminder = CRMReminder(**kwargs)
        db.add(reminder)
        await db.flush()
        await db.refresh(reminder)
        return reminder

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[CRMReminder]:
        result = await db.execute(select(CRMReminder).where(CRMReminder.public_id == public_id))
        return result.scalars().first()

    @staticmethod
    async def list_for_entity(db: AsyncSession, *, entity_type: str, entity_id: int) -> list[CRMReminder]:
        result = await db.execute(
            select(CRMReminder)
            .where(
                CRMReminder.entity_type == entity_type,
                CRMReminder.entity_id == entity_id,
                CRMReminder.is_deleted.is_(False),
            )
            .order_by(CRMReminder.remind_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def list_active_for_entities(db: AsyncSession, *, entity_type: str, entity_ids: list[int]) -> list[CRMReminder]:
        """Pending reminders across a batch of entities — powers list-view badges
        (e.g. 'Reminds Tomorrow at 9:00 AM' on each row) without one request per row."""
        if not entity_ids:
            return []
        result = await db.execute(
            select(CRMReminder)
            .where(
                CRMReminder.entity_type == entity_type,
                CRMReminder.entity_id.in_(entity_ids),
                CRMReminder.status == ReminderStatus.PENDING,
                CRMReminder.is_deleted.is_(False),
            )
            .order_by(CRMReminder.remind_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def list_for_user(db: AsyncSession, *, user_id: int) -> list[CRMReminder]:
        result = await db.execute(
            select(CRMReminder)
            .where(
                CRMReminder.user_id == user_id,
                CRMReminder.status == ReminderStatus.PENDING,
                CRMReminder.is_deleted.is_(False),
            )
            .order_by(CRMReminder.remind_at.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def list_due_ids(db: AsyncSession, *, now: datetime) -> list[int]:
        """Cheap, lock-free enumeration of candidate reminder ids. Each id is
        claimed (and locked) individually via claim_one in its own transaction,
        so this list may include ids another replica claims first — that's fine,
        claim_one simply returns None for those."""
        result = await db.execute(
            select(CRMReminder.id).where(
                CRMReminder.status == ReminderStatus.PENDING,
                CRMReminder.remind_at <= now,
                CRMReminder.is_deleted.is_(False),
            )
        )
        return list(result.scalars().all())

    @staticmethod
    async def claim_one(db: AsyncSession, reminder_id: int) -> Optional[CRMReminder]:
        """Locks a single pending reminder for this worker only (SKIP LOCKED).

        Must be called and fully processed (mark_sent/commit) within the same
        transaction the lock was taken in — committing releases the lock, so
        callers must not batch multiple claims under one shared transaction,
        or an early commit would release locks on the other rows still in
        that batch, reopening the multi-replica double-send window this
        exists to close.
        """
        result = await db.execute(
            select(CRMReminder)
            .options(selectinload(CRMReminder.user))
            .where(CRMReminder.id == reminder_id, CRMReminder.status == ReminderStatus.PENDING)
            .with_for_update(skip_locked=True)
        )
        return result.scalars().first()

    @staticmethod
    async def update(db: AsyncSession, reminder: CRMReminder, **kwargs) -> CRMReminder:
        for key, val in kwargs.items():
            setattr(reminder, key, val)
        await db.flush()
        await db.refresh(reminder)
        return reminder

    @staticmethod
    async def mark_sent(db: AsyncSession, reminder: CRMReminder, *, sent_at: datetime) -> CRMReminder:
        reminder.status = ReminderStatus.SENT
        reminder.sent_at = sent_at
        await db.flush()
        return reminder

    @staticmethod
    async def cancel(db: AsyncSession, reminder: CRMReminder) -> CRMReminder:
        reminder.status = ReminderStatus.CANCELLED
        await db.flush()
        return reminder
