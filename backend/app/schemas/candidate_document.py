"""Candidate Document Pydantic schemas"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


# Document Schemas

class CandidateDocumentBase(BaseModel):
    document_type: str  # 'resume', 'trainer_resume', 'disability_certificate', '10th_certificate', '12th_certificate', 'degree_certificate', 'pan_card', 'aadhar_card', 'passport_photo', 'other'
    document_name: str
    file_path: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None
    document_source: str = "candidate"
    is_active: bool = True
    uploaded_by_id: Optional[int] = None


class CandidateDocumentCreate(CandidateDocumentBase):
    """Schema for creating candidate document"""
    pass


class CandidateDocumentUpdate(BaseModel):
    """Schema for updating candidate document"""
    document_type: Optional[str] = None
    document_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    description: Optional[str] = None


class CandidateDocumentResponse(CandidateDocumentBase):
    """Schema for document response"""
    id: int
    candidate_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
