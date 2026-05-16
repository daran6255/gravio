from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Any
from app.models.placement_interview import InterviewRoundType, InterviewMode, InterviewResult


class PlacementInterviewBase(BaseModel):
    mapping_id: int
    candidate_id: int
    job_role_id: int
    round_number: int = 1
    round_type: InterviewRoundType
    mode: InterviewMode = InterviewMode.VIRTUAL
    scheduled_at: Optional[datetime] = None
    conducted_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interviewer_name: Optional[str] = None
    interviewer_id: Optional[int] = None
    interview_link: Optional[str] = None
    venue: Optional[str] = None
    result: InterviewResult = InterviewResult.PENDING
    score: Optional[float] = None
    feedback: Optional[str] = None
    feedback_json: Optional[dict[str, Any]] = None


class PlacementInterviewCreate(PlacementInterviewBase):
    scheduled_by_id: Optional[int] = None


class PlacementInterviewUpdate(BaseModel):
    round_number: Optional[int] = None
    round_type: Optional[InterviewRoundType] = None
    mode: Optional[InterviewMode] = None
    scheduled_at: Optional[datetime] = None
    conducted_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    interviewer_name: Optional[str] = None
    interviewer_id: Optional[int] = None
    interview_link: Optional[str] = None
    venue: Optional[str] = None
    result: Optional[InterviewResult] = None
    score: Optional[float] = None
    feedback: Optional[str] = None
    feedback_json: Optional[dict[str, Any]] = None


class PlacementInterviewResponse(PlacementInterviewBase):
    id: int
    scheduled_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
