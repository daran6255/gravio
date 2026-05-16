"""DSR Activity Type Repository"""

from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, func
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dsr_activity_type import DSRActivityType
from app.repositories.base import BaseRepository


class DSRActivityTypeRepository(BaseRepository[DSRActivityType]):

    def __init__(self, db: AsyncSession):
        super().__init__(DSRActivityType, db)

    async def get_by_public_id(self, public_id: UUID) -> Optional[DSRActivityType]:
        result = await self.db.execute(
            select(DSRActivityType)
            .where(DSRActivityType.public_id == public_id)
            .where(DSRActivityType.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Optional[DSRActivityType]:
        result = await self.db.execute(
            select(DSRActivityType)
            .where(DSRActivityType.code == code.upper())
            .where(DSRActivityType.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Optional[DSRActivityType]:
        result = await self.db.execute(
            select(DSRActivityType)
            .where(DSRActivityType.name == name)
            .where(DSRActivityType.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_code_all(self, code: str) -> Optional[DSRActivityType]:
        """Fetch by code including soft-deleted ones."""
        result = await self.db.execute(
            select(DSRActivityType)
            .where(DSRActivityType.code == sa.func.upper(code))
        )
        return result.scalar_one_or_none()

    async def get_active_types(self) -> List[DSRActivityType]:
        result = await self.db.execute(
            select(DSRActivityType)
            .where(DSRActivityType.is_deleted == False)
            .where(DSRActivityType.is_active == True)
            .order_by(DSRActivityType.sort_order, DSRActivityType.name)
        )
        return list(result.scalars().all())

    async def get_multi_paginated(
        self,
        skip: int = 0,
        limit: int = 100,
        active_only: bool = False,
        search: Optional[str] = None,
    ) -> Tuple[List[DSRActivityType], int]:
        query = select(DSRActivityType).where(DSRActivityType.is_deleted == False)
        count_query = (
            select(func.count())
            .select_from(DSRActivityType)
            .where(DSRActivityType.is_deleted == False)
        )

        if active_only:
            query = query.where(DSRActivityType.is_active == True)
            count_query = count_query.where(DSRActivityType.is_active == True)

        if search:
            ilike_filter = (
                DSRActivityType.name.ilike(f"%{search}%")
                | DSRActivityType.code.ilike(f"%{search}%")
            )
            query = query.where(ilike_filter)
            count_query = count_query.where(ilike_filter)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        query = (
            query
            .order_by(DSRActivityType.sort_order, DSRActivityType.name)
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def bulk_delete(self, public_ids: List[UUID]) -> int:
        """Mark multiple activity types as deleted."""
        result = await self.db.execute(
            sa.update(DSRActivityType)
            .where(DSRActivityType.public_id.in_(public_ids))
            .values(is_deleted=True, deleted_at=sa.func.now())
        )
        return result.rowcount
