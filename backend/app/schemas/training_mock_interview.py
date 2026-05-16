"""Training Mock Interview Pydantic schemas"""

from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, ConfigDict, Field


class QuestionSchema(BaseModel):
    question: str
    answer: str


class SkillSchema(BaseModel):
    skill: str
    level: str  # Beginner, Intermediate, Expert
    rating: float = Field(..., ge=0, le=10)


class TrainingMockInterviewBase(BaseModel):
    batch_id: int
    candidate_id: int
    interviewer_name: Optional[str] = None
    interview_date: datetime = Field(default_factory=datetime.utcnow)
    questions: Optional[List[QuestionSchema]] = None
    skills: Optional[List[SkillSchema]] = None
    feedback: Optional[str] = None
    overall_rating: Optional[float] = Field(None, ge=0, le=10)
    status: str = "pending"
    interview_type: Optional[str] = "internal"
    interview_category: Optional[str] = "domain"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    candidate_submitted_at: Optional[datetime] = None
    duration_minutes: Optional[int] = 0
    candidate_token: Optional[str] = None
    interviewer_id: Optional[int] = None


class TrainingMockInterviewCreate(TrainingMockInterviewBase):
    pass


class TrainingMockInterviewUpdate(BaseModel):
    interviewer_name: Optional[str] = None
    interview_date: Optional[datetime] = None
    questions: Optional[List[QuestionSchema]] = None
    skills: Optional[List[SkillSchema]] = None
    feedback: Optional[str] = None
    overall_rating: Optional[float] = Field(None, ge=0, le=10)
    status: Optional[str] = None
    interview_type: Optional[str] = None
    interview_category: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    candidate_token: Optional[str] = None
    interviewer_id: Optional[int] = None


from app.schemas.training_batch import TrainingBatchMini
from app.schemas.candidate import CandidateMini

class TrainingMockInterviewResponse(TrainingMockInterviewBase):
    id: int
    created_at: datetime
    updated_at: datetime
    batch: Optional[TrainingBatchMini] = None
    candidate: Optional[CandidateMini] = None
    
    model_config = ConfigDict(from_attributes=True)
