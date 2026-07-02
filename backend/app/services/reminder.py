"""Business logic for user-configurable CRM reminders"""

import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.reminder import CRMReminderRepository
from app.repositories.crm import (
    CRMLeadRepository,
    CRMDealRepository,
    CRMDealTaskRepository,
    CRMLeadTaskRepository,
    CRMActivityRepository,
)
from app.models.crm import LeadStatus
from app.schemas.crm import CRMReminderCreate, CRMReminderUpdate
from app.middleware.exceptions import NotFoundError, BadRequestError, ForbiddenError


async def _verify_entity_exists(db: AsyncSession, entity_type: str, entity_id: int) -> None:
    """Mirrors CRMService.create_activity's target-entity validation."""
    if entity_type == "lead":
        ent = await CRMLeadRepository.get_by_id(db, entity_id)
        if ent and not ent.is_deleted and ent.status == LeadStatus.CONVERTED:
            raise BadRequestError("Lead has been converted — set reminders on its tasks instead")
    elif entity_type == "deal":
        ent = await CRMDealRepository.get_by_id(db, entity_id)
    elif entity_type == "deal_task":
        ent = await CRMDealTaskRepository.get_by_id(db, entity_id)
    elif entity_type == "lead_task":
        ent = await CRMLeadTaskRepository.get_by_id(db, entity_id)
    elif entity_type == "activity":
        ent = await CRMActivityRepository.get_by_id(db, entity_id)
    else:
        raise BadRequestError("Invalid entity_type")

    if not ent or ent.is_deleted:
        raise NotFoundError(f"Target {entity_type} not found")


class ReminderService:
    @staticmethod
    async def create_reminder(db: AsyncSession, payload: CRMReminderCreate, created_by_user_id: int):
        await _verify_entity_exists(db, payload.entity_type, payload.entity_id)

        reminder = await CRMReminderRepository.create(
            db,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            user_id=payload.user_id or created_by_user_id,
            created_by_id=created_by_user_id,
            remind_at=payload.remind_at,
            message=payload.message,
        )
        await db.commit()
        return reminder

    @staticmethod
    async def list_reminders_for_entity(db: AsyncSession, *, entity_type: str, entity_id: int):
        return await CRMReminderRepository.list_for_entity(db, entity_type=entity_type, entity_id=entity_id)

    @staticmethod
    async def list_active_reminders_for_entities(db: AsyncSession, *, entity_type: str, entity_ids: list[int]):
        return await CRMReminderRepository.list_active_for_entities(db, entity_type=entity_type, entity_ids=entity_ids)

    @staticmethod
    async def list_my_reminders(db: AsyncSession, *, user_id: int):
        return await CRMReminderRepository.list_for_user(db, user_id=user_id)

    @staticmethod
    async def update_reminder(db: AsyncSession, public_id: uuid.UUID, payload: CRMReminderUpdate, user_id: int):
        reminder = await CRMReminderRepository.get_by_public_id(db, public_id)
        if not reminder or reminder.is_deleted:
            raise NotFoundError("Reminder not found")
        if reminder.user_id != user_id and reminder.created_by_id != user_id:
            raise ForbiddenError("You cannot modify another user's reminder")

        update_data = payload.model_dump(exclude_unset=True)
        reminder = await CRMReminderRepository.update(db, reminder, **update_data)
        await db.commit()
        return reminder

    @staticmethod
    async def cancel_reminder(db: AsyncSession, public_id: uuid.UUID, user_id: int):
        reminder = await CRMReminderRepository.get_by_public_id(db, public_id)
        if not reminder or reminder.is_deleted:
            raise NotFoundError("Reminder not found")
        if reminder.user_id != user_id and reminder.created_by_id != user_id:
            raise ForbiddenError("You cannot cancel another user's reminder")

        reminder = await CRMReminderRepository.cancel(db, reminder)
        await db.commit()
        return reminder
