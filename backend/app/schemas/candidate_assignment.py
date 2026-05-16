from __future__ import annotations
"""Candidate Assignment schemas"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CandidateAssignmentBase(BaseModel):
    """Base Candidate Assignment schema"""
    user_id: int


class CandidateAssignmentCreate(CandidateAssignmentBase):
    """Schema for creating a candidate assignment"""
    pass


class CandidateAssignmentUpdate(BaseModel):
    """Schema for updating a candidate assignment"""
    user_id: int


class CandidateAssignmentInDBBase(CandidateAssignmentBase):
    """Base schema for candidate assignment in DB"""
    id: int
    candidate_id: int
    assigned_by_id: int
    assigned_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CandidateAssignmentResponse(CandidateAssignmentInDBBase):
    """Schema for candidate assignment response"""
    assigned_to_name: str | None = None
    assigned_by_name: str | None = None
