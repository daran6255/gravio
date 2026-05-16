"""Dynamic Field model for configurable form fields"""

from sqlalchemy import String, Integer, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import BaseModel


class DynamicField(BaseModel):
    """Dynamic Field database model"""
    
    __tablename__ = "dynamic_fields"
    
    entity_type: Mapped[str] = mapped_column(String(20), index=True)  # 'screening', 'counseling'
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    field_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'text', 'textarea', 'single_choice', 'multiple_choice', 'phone_number'
    options: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    
    def __repr__(self) -> str:
        return f"<DynamicField(id={self.id}, entity_type='{self.entity_type}', name='{self.name}')>"
