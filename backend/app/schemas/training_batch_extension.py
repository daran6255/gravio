"""Training Batch Extension schemas"""

import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class TrainingBatchExtensionBase(BaseModel):
    new_close_date: date
    reason: Optional[str] = None


class TrainingBatchExtensionCreate(TrainingBatchExtensionBase):
    """Schema for creating a training batch extension"""
    batch_id: int
    previous_close_date: date
    extension_days: int


class TrainingBatchExtensionResponse(TrainingBatchExtensionBase):
    """Schema for training batch extension response"""
    id: int
    public_id: uuid.UUID
    batch_id: int
    previous_close_date: date
    extension_days: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
