"""DSR Project schemas"""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class DSRProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    owner_user_public_id: uuid.UUID = Field(..., description="Public ID of the user who owns this project")
    is_active: bool = Field(default=True)
    project_type: str = Field(default="standard", description="standard | training")
    linked_batch_public_id: Optional[uuid.UUID] = Field(default=None, description="Legacy: Single batch link")
    linked_batch_public_ids: Optional[list[uuid.UUID]] = Field(default=None, description="New: Multiple training batches")
    others: Optional[dict] = Field(default=None, description="Extensible metadata")


class DSRProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    owner_user_public_id: Optional[uuid.UUID] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)
    project_type: Optional[str] = Field(default=None)
    linked_batch_public_id: Optional[uuid.UUID] = Field(default=None)
    linked_batch_public_ids: Optional[list[uuid.UUID]] = Field(default=None)
    others: Optional[dict] = Field(default=None)


class DSRUserSnapshot(BaseModel):
    """Minimal user info embedded in project responses"""
    id: int
    public_id: uuid.UUID
    full_name: Optional[str]
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class TrainingBatchSnapshot(BaseModel):
    """Minimal batch info embedded in project responses"""
    id: int
    public_id: uuid.UUID
    batch_name: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class DSRProjectResponse(BaseModel):
    id: int
    public_id: uuid.UUID
    name: str
    is_active: bool
    project_type: str
    linked_batch_id: Optional[int] = None
    linked_batch_name: Optional[str] = Field(default=None, alias="batch_name") # Helper for UI
    batches: list[TrainingBatchSnapshot] = Field(default_factory=list, alias="linked_batches")
    owner_id: int
    owner: Optional[DSRUserSnapshot] = None
    creator: Optional[DSRUserSnapshot] = None
    others: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @property
    def batch_name(self) -> Optional[str]:
        if hasattr(self, "linked_batch") and self.linked_batch:
            return self.linked_batch.batch_name
        return None


class DSRProjectListResponse(BaseModel):
    items: list[DSRProjectResponse]
    total: int
    skip: int
    limit: int


# Excel import
class DSRProjectImportRow(BaseModel):
    """Schema for a single row parsed from the Excel import file"""
    name: str
    owner_email: str  # resolved to user during import
    is_active: Optional[bool] = True
    others: Optional[dict] = None


class DSRProjectImportResult(BaseModel):
    """Summary returned after an Excel import"""
    total_rows: int
    created: int
    skipped: int
    errors: list[dict]


# Training Summary
class TrainingProjectSubjectSummary(BaseModel):
    name: str
    trainer_name: Optional[str] = None
    trainer_public_id: Optional[uuid.UUID] = None
    planned_hours: float
    actual_hours: float
    completion_percentage: float
    status: str

    model_config = ConfigDict(from_attributes=True)


class TrainingProjectSummary(BaseModel):
    project_id: int
    project_public_id: uuid.UUID
    project_name: str
    batch_name: Optional[str] = None
    total_planned_hours: float
    total_actual_hours: float
    overall_completion_percentage: float
    subjects: list[TrainingProjectSubjectSummary]

    model_config = ConfigDict(from_attributes=True)
