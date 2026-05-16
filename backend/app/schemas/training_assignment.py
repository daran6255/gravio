"""Training Assignment Pydantic schemas"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict


class TrainingAssignmentBase(BaseModel):
    batch_id: int
    candidate_id: int
    assignment_name: str
    description: Optional[str] = None
    course_name: Optional[list[str]] = None
    course_marks: Optional[dict[str, float]] = None
    trainer_id: Optional[int] = None
    marks_obtained: float
    max_marks: float = 100.0
    assignment_date: date
    submission_date: Optional[date] = None
    others: Optional[dict] = None


class TrainingAssignmentCreate(TrainingAssignmentBase):
    pass


class TrainingAssignmentUpdate(BaseModel):
    assignment_name: Optional[str] = None
    description: Optional[str] = None
    course_name: Optional[list[str]] = None
    course_marks: Optional[dict[str, float]] = None
    trainer_id: Optional[int] = None
    marks_obtained: Optional[float] = None
    max_marks: Optional[float] = None
    assignment_date: Optional[date] = None
    submission_date: Optional[date] = None
    others: Optional[dict] = None


from app.schemas.training_batch import TrainingBatchMini

class TrainingAssignmentResponse(TrainingAssignmentBase):
    id: int
    batch: Optional[TrainingBatchMini] = None
    
    model_config = ConfigDict(from_attributes=True)
