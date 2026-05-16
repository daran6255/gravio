"""Base repository with generic CRUD operations"""

from typing import TypeVar, Generic, Type, Optional, List, Any
from sqlalchemy import select, update, delete, func, insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import BaseModel


ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    """Generic repository for CRUD operations"""
    
    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db
    
    async def get(self, id: int, include_deleted: bool = False) -> Optional[ModelType]:
        """Get a single record by ID"""
        query = select(self.model).where(self.model.id == id)
        
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_fields(self, include_deleted: bool = False, **fields) -> List[ModelType]:
        """Get records by multiple field filters"""
        query = select(self.model)
        for field, value in fields.items():
            if hasattr(self.model, field):
                query = query.where(getattr(self.model, field) == value)
        
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
            
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
    ) -> List[ModelType]:
        """Get multiple records with pagination"""
        query = select(self.model)
        
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create(self, obj_in: dict[str, Any]) -> ModelType:
        """Create a new record"""
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def bulk_create(self, objects: List[dict[str, Any]]) -> List[ModelType]:
        """Efficiently create multiple records in one roundtrip"""
        if not objects:
            return []
        
        query = insert(self.model).values(objects).returning(self.model)
        result = await self.db.execute(query)
        await self.db.flush()
        return list(result.scalars().all())
    
    async def update(
        self,
        id: int,
        obj_in: dict[str, Any],
    ) -> Optional[ModelType]:
        """Update an existing record"""
        query = (
            update(self.model)
            .where(self.model.id == id)
            .where(self.model.is_deleted == False)
            .values(**obj_in)
            .returning(self.model)
        )
        
        result = await self.db.execute(query)
        await self.db.flush()
        return result.scalar_one_or_none()

    async def bulk_update(self, updates: List[dict[str, Any]]) -> List[ModelType]:
        """Efficiently update multiple records in one roundtrip."""
        if not updates:
            return []
        
        def _do_bulk_update(session):
            session.bulk_update_mappings(self.model, updates)
            
        await self.db.run_sync(_do_bulk_update)
        await self.db.flush()
        
        # To return the updated objects, we need to fetch them.
        # Assuming 'id' is the primary key.
        updated_ids = [item['id'] for item in updates if 'id' in item]
        if not updated_ids:
            return []
        
        query = select(self.model).where(self.model.id.in_(updated_ids))
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def delete(self, id: int, soft: bool = True) -> bool:
        """Delete a record (soft delete by default if model supports it)"""
        # Check if record exists
        db_obj = await self.get(id, include_deleted=True)
        if not db_obj:
            return False

        if soft and hasattr(self.model, "is_deleted"):
            # Soft delete
            db_obj.soft_delete()
            await self.db.flush()
            return True
        else:
            # Hard delete
            query = delete(self.model).where(self.model.id == id)
            result = await self.db.execute(query)
            await self.db.flush()
            return result.rowcount > 0

    async def bulk_soft_delete(self, ids: List[int]) -> int:
        """Soft-delete multiple records by ID"""
        if not ids:
            return 0
        from datetime import datetime
        query = (
            update(self.model)
            .where(self.model.id.in_(ids))
            .where(self.model.is_deleted == False)
            .values(is_deleted=True, deleted_at=datetime.utcnow())
        )
        result = await self.db.execute(query)
        await self.db.flush()
        return result.rowcount
    
    async def count(self, include_deleted: bool = False, filter_expr: Any = None) -> int:
        """Count total records"""
        query = select(func.count()).select_from(self.model)
        
        if not include_deleted:
            query = query.where(self.model.is_deleted == False)
        
        if filter_expr is not None:
            query = query.where(filter_expr)
        
        result = await self.db.execute(query)
        return result.scalar_one()
    
    async def exists(self, id: int) -> bool:
        """Check if a record exists"""
        query = select(self.model.id).where(
            self.model.id == id,
            self.model.is_deleted == False
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None
