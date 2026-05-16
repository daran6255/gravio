from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_offer import PlacementOffer
from app.repositories.base import BaseRepository


class PlacementOfferRepository(BaseRepository[PlacementOffer]):
    def __init__(self, db: AsyncSession):
        super().__init__(PlacementOffer, db)

    async def get_by_mapping(self, mapping_id: int) -> Optional[PlacementOffer]:
        stmt = (
            select(self.model)
            .where(
                and_(
                    self.model.mapping_id == mapping_id,
                    self.model.is_deleted == False
                )
            )
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_candidate(self, candidate_id: int) -> List[PlacementOffer]:
        stmt = (
            select(self.model)
            .where(
                and_(
                    self.model.candidate_id == candidate_id,
                    self.model.is_deleted == False
                )
            )
            .order_by(self.model.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
