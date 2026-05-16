from typing import Optional, List
from sqlalchemy import select
from app.models.system_setting import SystemSetting
from app.repositories.base import BaseRepository


class SystemSettingRepository(BaseRepository[SystemSetting]):
    """Repository for managing system-wide settings"""
    
    def __init__(self, db):
        super().__init__(SystemSetting, db)
    
    async def get_by_key(self, key: str) -> Optional[SystemSetting]:
        """Get a setting by its unique key"""
        query = select(self.model).where(self.model.key == key)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all_settings(self) -> List[SystemSetting]:
        """Get all system settings"""
        query = select(self.model)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def update_by_key(self, key: str, value: str) -> Optional[SystemSetting]:
        """Update a setting value by its key"""
        setting = await self.get_by_key(key)
        if setting:
            setting.value = value
            await self.db.flush()
            return setting
        return None
