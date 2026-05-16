"""Training Batch Extension Repository"""

from app.models.training_batch_extension import TrainingBatchExtension
from app.repositories.base import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession


class TrainingBatchExtensionRepository(BaseRepository[TrainingBatchExtension]):
    """Repository for TrainingBatchExtension CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(TrainingBatchExtension, db)
