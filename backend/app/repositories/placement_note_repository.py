from typing import List
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_note import PlacementNote
from app.repositories.base import BaseRepository


class PlacementNoteRepository(BaseRepository[PlacementNote]):
    def __init__(self, db: AsyncSession):
        super().__init__(PlacementNote, db)

    async def get_by_mapping(self, mapping_id: int) -> List[PlacementNote]:
        stmt = (
            select(self.model)
            .where(
                and_(
                    self.model.mapping_id == mapping_id,
                    self.model.is_deleted == False
                )
            )
            .options(selectinload(self.model.created_by))
            .order_by(self.model.is_pinned.desc(), self.model.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_candidate(self, candidate_id: int) -> List[PlacementNote]:
        stmt = (
            select(self.model)
            .where(
                and_(
                    self.model.candidate_id == candidate_id,
                    self.model.is_deleted == False
                )
            )
            .options(selectinload(self.model.created_by))
            .order_by(self.model.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
