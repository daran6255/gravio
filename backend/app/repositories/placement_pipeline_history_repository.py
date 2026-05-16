from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_pipeline_history import PlacementPipelineHistory
from app.repositories.base import BaseRepository


class PlacementPipelineHistoryRepository(BaseRepository[PlacementPipelineHistory]):
    def __init__(self, db: AsyncSession):
        super().__init__(PlacementPipelineHistory, db)

    async def get_by_mapping(self, mapping_id: int) -> List[PlacementPipelineHistory]:
        from sqlalchemy.orm import selectinload
        stmt = (
            select(self.model)
            .where(self.model.mapping_id == mapping_id)
            .options(selectinload(self.model.changed_by))
            .order_by(self.model.changed_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_candidate(self, candidate_id: int) -> List[PlacementPipelineHistory]:
        from sqlalchemy.orm import selectinload
        stmt = (
            select(self.model)
            .where(self.model.candidate_id == candidate_id)
            .options(selectinload(self.model.changed_by))
            .order_by(self.model.changed_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
