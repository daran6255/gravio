"""Training Batch Event Repository"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.base import BaseRepository
from app.models.training_batch_event import TrainingBatchEvent


class TrainingBatchEventRepository(BaseRepository[TrainingBatchEvent]):
    """Repository for TrainingBatchEvent model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(TrainingBatchEvent, db)

    async def get_by_batch(self, batch_id: int) -> List[TrainingBatchEvent]:
        """Get all events for a batch"""
        return await self.get_by_fields(batch_id=batch_id)
