"""Training Assignment Repository"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.training_assignment import TrainingAssignment
from app.repositories.base import BaseRepository


class TrainingAssignmentRepository(BaseRepository[TrainingAssignment]):
    """Repository for TrainingAssignment CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(TrainingAssignment, db)

    async def get_by_batch(self, batch_id: int) -> List[TrainingAssignment]:
        """Get all assignments for a batch"""
        return await self.get_by_fields(batch_id=batch_id)
