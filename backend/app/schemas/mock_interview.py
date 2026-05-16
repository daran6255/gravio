from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, root_validator

# Shared properties
class MockInterviewBase(BaseModel):
    interviewer_name: Optional[str] = None
    interview_date: Optional[datetime] = None
    questions: Optional[List[Dict[str, Any]]] = None # List of {question: str, answer: str}
    skills: Optional[List[Dict[str, Any]]] = None # List of {skill_name: str, level: str, rating: int}
    others: Optional[Dict[str, Any]] = None # Dynamic fields
    feedback: Optional[str] = None
    overall_rating: Optional[float] = None
    status: Optional[str] = "pending"
    candidate_token: Optional[str] = None
    interviewer_id: Optional[int] = None

# Properties to receive on creation
class MockInterviewCreate(MockInterviewBase):
    batch_id: int
    candidate_id: int
    interview_date: datetime

# Properties to receive on update
class MockInterviewUpdate(MockInterviewBase):
    pass

# Properties shared by models stored in DB
class MockInterviewInDBBase(MockInterviewBase):
    id: int
    batch_id: int
    candidate_id: int

    class Config:
        orm_mode = True

# Properties to return to client
class MockInterview(MockInterviewInDBBase):
    pass

class MockInterviewInList(MockInterviewInDBBase):
    pass
