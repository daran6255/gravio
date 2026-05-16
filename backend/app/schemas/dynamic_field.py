"""Dynamic Field Pydantic schemas"""

from typing import Optional, Any, List
from pydantic import BaseModel


class DynamicFieldBase(BaseModel):
    entity_type: str
    name: str
    label: str
    field_type: str
    options: Optional[List[str]] = None
    is_required: bool = False
    order: int = 0


class DynamicFieldCreate(DynamicFieldBase):
    """Schema for creating a dynamic field"""
    pass


class DynamicFieldUpdate(BaseModel):
    """Schema for updating a dynamic field"""
    entity_type: Optional[str] = None
    name: Optional[str] = None
    label: Optional[str] = None
    field_type: Optional[str] = None
    options: Optional[List[str]] = None
    is_required: Optional[bool] = None
    order: Optional[int] = None


class DynamicFieldResponse(DynamicFieldBase):
    """Schema for dynamic field response"""
    id: int

    class Config:
        from_attributes = True
