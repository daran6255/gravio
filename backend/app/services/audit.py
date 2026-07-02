"""Generic change-audit logging business logic (used by CRM Leads and Deals)"""

from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.audit import AuditLogRepository


def _stringify(value: Any) -> Optional[str]:
    if value is None:
        return None
    if hasattr(value, "value"):  # enums
        return str(value.value)
    return str(value)


class AuditService:
    @staticmethod
    async def record(
        db: AsyncSession,
        *,
        entity_type: str,
        entity_id: int,
        action: str,
        changed_by_user_id: Optional[int],
        field_name: Optional[str] = None,
        old_value: Any = None,
        new_value: Any = None,
    ):
        return await AuditLogRepository.create(
            db,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            field_name=field_name,
            old_value=_stringify(old_value),
            new_value=_stringify(new_value),
            changed_by_user_id=changed_by_user_id,
        )

    @staticmethod
    async def record_field_changes(
        db: AsyncSession,
        *,
        entity_type: str,
        entity_id: int,
        action: str,
        changed_by_user_id: Optional[int],
        changes: dict[str, tuple[Any, Any]],
    ) -> None:
        """changes maps field_name -> (old_value, new_value); writes one row per changed field."""
        for field_name, (old_value, new_value) in changes.items():
            if old_value == new_value:
                continue
            await AuditService.record(
                db,
                entity_type=entity_type,
                entity_id=entity_id,
                action=action,
                changed_by_user_id=changed_by_user_id,
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
            )

    @staticmethod
    async def list_for_entity(db: AsyncSession, *, entity_type: str, entity_id: int, page: int, page_size: int):
        return await AuditLogRepository.list_by_entity(
            db, entity_type=entity_type, entity_id=entity_id, page=page, page_size=page_size
        )
