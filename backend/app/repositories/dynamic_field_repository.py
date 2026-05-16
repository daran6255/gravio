"""Dynamic Field Repository"""

from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dynamic_field import DynamicField
from app.repositories.base import BaseRepository


class DynamicFieldRepository(BaseRepository[DynamicField]):
    """Repository for DynamicField model"""
    
    def __init__(self, db: AsyncSession):
        super().__init__(DynamicField, db)
    
    async def get_by_entity_type(self, entity_type: str) -> List[DynamicField]:
        """Get fields by entity_type ordered by 'order'"""
        result = await self.db.execute(
            select(DynamicField)
            .where(DynamicField.entity_type == entity_type)
            .where(DynamicField.is_deleted == False)
            .order_by(DynamicField.order)
        )
        return list(result.scalars().all())
