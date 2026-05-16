"""System setting model for application-wide configurations"""

from sqlalchemy import String, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class SystemSetting(BaseModel):
    """
    Model for storing system-wide settings.
    Used for AI configuration, email settings, etc.
    """
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # is_secret helps in masking values (like API keys) in API responses
