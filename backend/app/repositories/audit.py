"""Data access layer for AuditLog"""

from typing import Optional
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.audit import AuditLog


class AuditLogRepository:
    @staticmethod
    async def create(db: AsyncSession, **kwargs) -> AuditLog:
        entry = AuditLog(**kwargs)
        db.add(entry)
        await db.flush()
        return entry

    @staticmethod
    async def list_by_entity(
        db: AsyncSession,
        *,
        entity_type: str,
        entity_id: int,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[AuditLog], int]:
        conditions = [AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id]

        count_result = await db.execute(
            select(func.count()).select_from(AuditLog).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(AuditLog)
            .where(*conditions)
            .order_by(AuditLog.changed_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total
