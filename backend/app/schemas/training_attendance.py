"""Training Attendance Pydantic schemas"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime


class TrainingAttendanceBase(BaseModel):
    batch_id: int
    candidate_id: int
    date: date
    period_id: Optional[int] = None  # NULL = full day attendance (legacy)
    status: str = "present"
    remarks: Optional[str] = None
    trainer_notes: Optional[str] = None


class TrainingAttendanceCreate(TrainingAttendanceBase):
    @field_validator('date')
    @classmethod
    def validate_not_future_date(cls, v: date) -> date:
        """Prevent marking attendance for future dates"""
        if v > datetime.now().date():
            raise ValueError('Cannot mark attendance for future dates')
        return v


class TrainingAttendanceUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None
    trainer_notes: Optional[str] = None


from app.schemas.training_batch import TrainingBatchMini
from app.schemas.training_batch_plan import TrainingBatchPlanResponse

class TrainingAttendanceResponse(TrainingAttendanceBase):
    id: int
    batch: Optional[TrainingBatchMini] = None
    period: Optional[TrainingBatchPlanResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

