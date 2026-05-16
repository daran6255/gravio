"""Candidate Screening Repository"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.candidate_screening import CandidateScreening
from app.repositories.base import BaseRepository


class CandidateScreeningRepository(BaseRepository[CandidateScreening]):
    """Repository for CandidateScreening model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(CandidateScreening, db)
    
    async def get_by_candidate_id(self, candidate_id: int) -> Optional[CandidateScreening]:
        """Get screening by candidate_id"""
        result = await self.db.execute(
            select(CandidateScreening).where(CandidateScreening.candidate_id == candidate_id)
        )
        return result.scalars().first()

    async def count_screenings_by_user(self, user_id: int) -> int:
        """Count how many screenings a user has performed"""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count(CandidateScreening.id)).where(CandidateScreening.screened_by_id == user_id)
        )
        return result.scalar_one() or 0

    async def get_screenings_by_date(self, start_date: datetime, end_date: datetime) -> List[CandidateScreening]:
        """Get screenings performed within a date range"""
        from sqlalchemy.orm import joinedload
        result = await self.db.execute(
            select(CandidateScreening)
            .where(CandidateScreening.created_at >= start_date)
            .where(CandidateScreening.created_at <= end_date)
            .options(
                joinedload(CandidateScreening.candidate),
                joinedload(CandidateScreening.screened_by)
            )
        )
        return list(result.scalars().all())
