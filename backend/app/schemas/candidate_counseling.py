"""Candidate Counseling Pydantic schemas"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


# Counseling Schemas

class CounselingWorkExperience(BaseModel):
    job_title: Optional[str] = None
    company: Optional[str] = None
    years_of_experience: Optional[str] = None
    currently_working: bool = False


class CandidateCounselingBase(BaseModel):
    skills: Optional[List[dict]] = None
    feedback: Optional[str] = None
    questions: Optional[List[dict]] = None
    others: Optional[dict] = None
    workexperience: Optional[List[CounselingWorkExperience]] = None
    counselor_name: Optional[str] = None
    suitable_job_roles: Optional[List[str]] = None
    assigned_to: Optional[List[str]] = None
    remarks: Optional[str] = None
    status: str = "pending"  # 'pending', 'selected', 'rejected'
    counseling_date: Optional[datetime] = None


class CandidateCounselingCreate(CandidateCounselingBase):
    """Schema for creating candidate counseling"""
    counselor_id: Optional[int] = None


class CandidateCounselingUpdate(BaseModel):
    """Schema for updating candidate counseling"""
    skills: Optional[List[dict]] = None
    feedback: Optional[str] = None
    questions: Optional[List[dict]] = None
    others: Optional[dict] = None
    workexperience: Optional[List[CounselingWorkExperience]] = None
    counselor_name: Optional[str] = None
    suitable_job_roles: Optional[List[str]] = None
    assigned_to: Optional[List[str]] = None
    remarks: Optional[str] = None
    status: Optional[str] = None
    counselor_id: Optional[int] = None
    counseling_date: Optional[datetime] = None


class CandidateCounselingResponse(CandidateCounselingBase):
    """Schema for counseling response"""
    id: int
    candidate_id: int
    counselor_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
