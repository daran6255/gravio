"""Training Mock Interview Repository"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.training_mock_interview import TrainingMockInterview
from app.models.candidate import Candidate
from app.repositories.base import BaseRepository


class TrainingMockInterviewRepository(BaseRepository[TrainingMockInterview]):
    """Repository for TrainingMockInterview CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(TrainingMockInterview, db)

    async def get_by_batch_id(self, batch_id: int, skip: int = 0, limit: int = 100) -> List[TrainingMockInterview]:
        """Get mock interviews by batch ID with expert eager loading"""
        from sqlalchemy import select, desc
        from sqlalchemy.orm import selectinload
        query = (
            select(self.model)
            .options(
                selectinload(self.model.candidate).selectinload(Candidate.documents),
                selectinload(self.model.batch)
            )
            .where(self.model.batch_id == batch_id)
            .where(self.model.is_deleted == False)
            .order_by(desc(self.model.created_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())
