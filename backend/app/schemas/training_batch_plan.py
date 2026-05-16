"""Training Batch Plan Pydantic schemas"""

import uuid
from typing import Optional, Any
from datetime import date, time, datetime
from pydantic import BaseModel, ConfigDict


class TrainingBatchPlanBase(BaseModel):
    date: date
    start_time: time
    end_time: time
    activity_type: str
    activity_name: str
    trainer: Optional[str] = None  # Free text trainer name
    notes: Optional[str] = None
    others: Optional[Any] = None


class TrainerUserSnapshot(BaseModel):
    """Brief user info for plan responses"""
    id: int
    public_id: uuid.UUID
    full_name: Optional[str] = None
    email: str

    model_config = ConfigDict(from_attributes=True)


class TrainingBatchPlanCreate(TrainingBatchPlanBase):
    """Schema for creating a training batch plan"""
    batch_internal_id: Optional[int] = None # Internal ID if known
    batch_public_id: Optional[uuid.UUID] = None # Public ID for resolution
    trainer_user_public_id: Optional[uuid.UUID] = None # Link to system user


class TrainingBatchPlanUpdate(BaseModel):
    """Schema for updating a training batch plan"""
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    activity_type: Optional[str] = None
    activity_name: Optional[str] = None
    trainer: Optional[str] = None
    trainer_user_public_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    others: Optional[Any] = None


class TrainingBatchPlanResponse(TrainingBatchPlanBase):
    """Schema for training batch plan response"""
    id: int
    public_id: uuid.UUID
    batch_id: int
    trainer_user_id: Optional[int] = None
    trainer_user_public_id: Optional[uuid.UUID] = None
    trainer_user: Optional[TrainerUserSnapshot] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
