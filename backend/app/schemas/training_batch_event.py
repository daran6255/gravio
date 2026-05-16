"""Training Batch Event schemas"""

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TrainingBatchEventBase(BaseModel):
    batch_id: int
    date: date
    event_type: str = "holiday"
    title: str
    description: Optional[str] = None


class TrainingBatchEventCreate(TrainingBatchEventBase):
    pass


class TrainingBatchEventUpdate(BaseModel):
    date: Optional[date] = None
    event_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class TrainingBatchEventResponse(TrainingBatchEventBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
