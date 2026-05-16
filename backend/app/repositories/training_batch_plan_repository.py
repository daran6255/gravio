"""Training Batch Plan Repository"""

import uuid
from typing import Optional, List, Any
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.training_batch_plan import TrainingBatchPlan
from app.repositories.base import BaseRepository
from datetime import date


class TrainingBatchPlanRepository(BaseRepository[TrainingBatchPlan]):
    """Repository for TrainingBatchPlan CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(TrainingBatchPlan, db)
    
    async def get_by_public_id(self, public_id: uuid.UUID) -> Optional[TrainingBatchPlan]:
        query = (
            select(self.model)
            .options(joinedload(self.model.trainer_user))
            .where(
                self.model.public_id == public_id,
                self.model.is_deleted == False
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_batch_and_date_range(
        self, 
        batch_id: int, 
        start_date: date, 
        end_date: date
    ) -> List[TrainingBatchPlan]:
        """Get all plan entries for a batch within a date range"""
        query = (
            select(self.model)
            .options(joinedload(self.model.trainer_user))
            .where(
                and_(
                    self.model.batch_id == batch_id,
                    self.model.date >= start_date,
                    self.model.date <= end_date,
                    self.model.is_deleted == False
                )
            ).order_by(self.model.date, self.model.start_time)
        )
        
        result = await self.db.execute(query)
        return list(result.unique().scalars().all())

    async def get_by_batch_and_day(
        self, 
        batch_id: int, 
        day: date
    ) -> List[TrainingBatchPlan]:
        """Get all plan entries for a specific batch and day"""
        query = (
            select(self.model)
            .options(joinedload(self.model.trainer_user))
            .where(
                and_(
                    self.model.batch_id == batch_id,
                    self.model.date == day,
                    self.model.is_deleted == False
                )
            ).order_by(self.model.start_time)
        )
        
        result = await self.db.execute(query)
        return list(result.unique().scalars().all())

    async def get_all_by_batch_id(self, batch_id: int) -> List[TrainingBatchPlan]:
        """Get all plan entries for a specific batch"""
        query = (
            select(self.model)
            .options(joinedload(self.model.trainer_user))
            .where(
                and_(
                    self.model.batch_id == batch_id,
                    self.model.is_deleted == False
                )
            ).order_by(self.model.date, self.model.start_time)
        )
        
        result = await self.db.execute(query)
        return list(result.unique().scalars().all())
