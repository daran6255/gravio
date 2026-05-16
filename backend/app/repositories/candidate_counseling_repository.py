"""Candidate Counseling Repository"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.candidate_counseling import CandidateCounseling
from app.repositories.base import BaseRepository


class CandidateCounselingRepository(BaseRepository[CandidateCounseling]):
    """Repository for CandidateCounseling model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateCounseling, db)
    
    async def get_by_candidate_id(self, candidate_id: int) -> Optional[CandidateCounseling]:
        """Get counseling record by candidate_id"""
        result = await self.db.execute(
            select(CandidateCounseling).where(CandidateCounseling.candidate_id == candidate_id)
        )
        return result.scalars().first()
    
    async def get_by_status(self, status: str) -> list[CandidateCounseling]:
        """Get all counseling records by status (pending, selected, rejected)"""
        result = await self.db.execute(
            select(CandidateCounseling)
            .where(CandidateCounseling.status == status)
            .order_by(CandidateCounseling.counseling_date.desc())
        )
        return result.scalars().all()
    
    async def get_by_counselor(self, counselor_id: int) -> list[CandidateCounseling]:
        """Get all counseling records by a specific counselor"""
        result = await self.db.execute(
            select(CandidateCounseling)
            .where(CandidateCounseling.counselor_id == counselor_id)
            .order_by(CandidateCounseling.counseling_date.desc())
        )
        return result.scalars().all()
