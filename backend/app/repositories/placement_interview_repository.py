from typing import List
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_interview import PlacementInterview
from app.repositories.base import BaseRepository


class PlacementInterviewRepository(BaseRepository[PlacementInterview]):
    def __init__(self, db: AsyncSession):
        super().__init__(PlacementInterview, db)

    async def get_by_mapping(self, mapping_id: int) -> List[PlacementInterview]:
        stmt = (
            select(self.model)
            .where(
                and_(
                    self.model.mapping_id == mapping_id,
                    self.model.is_deleted == False
                )
            )
            .order_by(self.model.round_number.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_candidate(self, candidate_id: int) -> List[PlacementInterview]:
        from app.models.job_role import JobRole
        stmt = (
            select(self.model)
            .where(
                and_(
                    self.model.candidate_id == candidate_id,
                    self.model.is_deleted == False
                )
            )
            .options(selectinload(self.model.job_role).selectinload(JobRole.company))
            .order_by(self.model.scheduled_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
