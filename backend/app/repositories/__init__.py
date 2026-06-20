"""Repositories package - data access layer"""

from app.repositories.user_repository import UserRepository
from app.repositories.system_setting_repository import SystemSettingRepository

__all__ = [
    "UserRepository",
    "SystemSettingRepository",
]

