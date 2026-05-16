"""Job Role Schemas"""

from typing import Optional, Dict, List, Any
from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, Field
from app.models.job_role import JobRoleStatus


class JobRoleBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    status: JobRoleStatus = JobRoleStatus.ACTIVE
    is_visible: bool = True
    no_of_vacancies: Optional[int] = None
    close_date: Optional[date] = None
    company_id: int
    contact_id: int
    location: Optional[Dict[str, Any]] = None
    salary_range: Optional[Dict[str, Any]] = None
    experience: Optional[Dict[str, Any]] = None
    requirements: Optional[Dict[str, Any]] = Field(
        None, 
        description='{"skills": [], "qualifications": [], "disability_preferred": []}'
    )
    job_details: Optional[Dict[str, Any]] = None
    other: Optional[Dict[str, Any]] = None
    pipeline_stages: Optional[List[Dict[str, Any]]] = None
    status_reason: Optional[str] = None
    deletion_reason: Optional[str] = None


class JobRoleCreate(JobRoleBase):
    pass


class JobRoleUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[JobRoleStatus] = None
    is_visible: Optional[bool] = None
    no_of_vacancies: Optional[int] = None
    close_date: Optional[date] = None
    company_id: Optional[int] = None
    contact_id: Optional[int] = None
    location: Optional[Dict[str, Any]] = None
    salary_range: Optional[Dict[str, Any]] = None
    experience: Optional[Dict[str, Any]] = None
    requirements: Optional[Dict[str, Any]] = None
    job_details: Optional[Dict[str, Any]] = None
    other: Optional[Dict[str, Any]] = None
    pipeline_stages: Optional[List[Dict[str, Any]]] = None
    status_reason: Optional[str] = None
    deletion_reason: Optional[str] = None


class CompanyMinimal(BaseModel):
    id: int
    public_id: UUID
    name: str

    model_config = ConfigDict(from_attributes=True)


class ContactMinimal(BaseModel):
    id: int
    public_id: UUID
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserMinimal(BaseModel):
    id: int
    public_id: UUID
    full_name: Optional[str] = None
    username: str

    model_config = ConfigDict(from_attributes=True)


class JobRoleRead(JobRoleBase):
    id: int
    public_id: UUID
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyMinimal] = None
    contact: Optional[ContactMinimal] = None
    creator: Optional[UserMinimal] = None
    mappings_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class JobRoleListResponse(BaseModel):
    items: List[JobRoleRead]
    total: int
