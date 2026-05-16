"""Training Attendance Repository"""

from datetime import date, datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.training_attendance import TrainingAttendance
from app.repositories.base import BaseRepository


class TrainingAttendanceRepository(BaseRepository[TrainingAttendance]):
    """Repository for TrainingAttendance CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(TrainingAttendance, db)
    
    async def get_by_batch_and_date(self, batch_id: int, date):
        """Get attendance for a specific batch and date"""
        query = select(self.model).where(
            self.model.batch_id == batch_id,
            self.model.is_deleted == False
        )
        if date:
            query = query.where(self.model.date == date)
            
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def bulk_upsert_attendance(self, attendance_data: List[dict]) -> List[TrainingAttendance]:
        """ 
        Expert-level bulk upsert using PostgreSQL ON CONFLICT.
        Note: This assumes a unique constraint exists on (batch_id, candidate_id, date).
        """
        if not attendance_data:
            return []
            
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        
        stmt = pg_insert(self.model).values(attendance_data)
        
        # Define what to update on conflict
        update_cols = {
            'status': stmt.excluded.status,
            'remarks': stmt.excluded.remarks,
            'updated_at': func.now()
        }
        
        upsert_stmt = stmt.on_conflict_do_update(
            index_elements=['batch_id', 'candidate_id', 'date'],
            set_=update_cols
        ).returning(self.model)
        
        result = await self.db.execute(upsert_stmt)
        await self.db.flush()
        return list(result.scalars().all())
