"""Pydantic validation schemas for the Gravit Project Management module"""

import uuid
from datetime import datetime, date
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import inspect as sa_inspect

from app.models.project import ProjectStatus, BillingType
from app.models.crm import LeadPriority


# --- Task Status (tenant-configurable) Schemas ---
class ProjectTaskStatusBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    order: int = Field(0, ge=0)
    color: str = Field("#808080", max_length=20)
    is_initial_status: bool = False
    is_done_status: bool = False
    custom_fields: Optional[dict[str, Any]] = None


class ProjectTaskStatusCreate(ProjectTaskStatusBase):
    pass


class ProjectTaskStatusResponse(ProjectTaskStatusBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProjectTaskStatusUpsert(ProjectTaskStatusBase):
    """A status in a bulk status-update request. Omit `id` to create a new status;
    any existing status whose id is not present in the request is deleted."""
    id: Optional[int] = None


class ProjectTaskStatusesUpdateRequest(BaseModel):
    statuses: list[ProjectTaskStatusUpsert]


# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    owner_id: Optional[int] = None
    company_id: Optional[int] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = Field(None, ge=0)
    currency: str = Field("USD", max_length=10)
    phase: Optional[str] = Field(None, max_length=100)
    issues: Optional[str] = None
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, Any]] = None


class ProjectCreate(ProjectBase):
    template_key: Optional[str] = None
    custom_tasks: Optional[list[dict[str, Any]]] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    owner_id: Optional[int] = None
    company_id: Optional[int] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    phase: Optional[str] = Field(None, max_length=100)
    issues: Optional[str] = None
    tags: Optional[list[str]] = None
    custom_fields: Optional[dict[str, Any]] = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    deal_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    completed_task_count: int = 0
    owner_name: Optional[str] = None
    company_name: Optional[str] = None
    deal_title: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _attach_task_counts(cls, data: Any) -> Any:
        # Only computed when `.tasks` was eagerly loaded (e.g. selectinload in list_all);
        # touching the relationship otherwise would trigger a lazy load and crash async sessions.
        if isinstance(data, dict) or "tasks" in sa_inspect(data).unloaded:
            return data
        non_deleted_tasks = [t for t in data.tasks if not t.is_deleted]
        data.task_count = len(non_deleted_tasks)
        data.completed_task_count = len([
            t for t in non_deleted_tasks
            if t.completed_at is not None
        ])
        return data

    @model_validator(mode="before")
    @classmethod
    def _attach_display_names(cls, data: Any) -> Any:
        # Same eager-load guard as _attach_task_counts -- only set when the
        # relationship was selectinload'd upfront (e.g. get_by_public_id).
        if isinstance(data, dict):
            return data
        unloaded = sa_inspect(data).unloaded
        if "owner" not in unloaded and data.owner is not None:
            data.owner_name = data.owner.full_name or data.owner.email
        if "company" not in unloaded and data.company is not None:
            data.company_name = data.company.name
        if "deal" not in unloaded and data.deal is not None:
            data.deal_title = data.deal.title
        return data


class ProjectBulkUpdateRequest(BaseModel):
    public_ids: list[uuid.UUID] = Field(..., min_length=1)
    owner_id: Optional[int] = None
    status: Optional[ProjectStatus] = None


# --- Project Stats ---
class ProjectBudgetByCurrency(BaseModel):
    currency: str
    total: float


class ProjectDeadlineItem(BaseModel):
    public_id: uuid.UUID
    name: str
    end_date: date


class ProjectStatusCount(BaseModel):
    status: ProjectStatus
    count: int


class ProjectStatsResponse(BaseModel):
    total_projects: int
    status_counts: list[ProjectStatusCount]
    overdue_count: int
    total_tasks: int
    completed_tasks: int
    budget_by_currency: list[ProjectBudgetByCurrency]
    upcoming_deadlines: list[ProjectDeadlineItem]
    overdue_projects: list[ProjectDeadlineItem]


# --- Deal -> Project conversion ---
class DealConvertToProjectRequest(BaseModel):
    name: Optional[str] = None       # defaults to deal.title if not provided
    owner_id: Optional[int] = None   # defaults to deal.owner_id
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None   # defaults to deal.value, converted into the target currency
    template_key: Optional[str] = None
    custom_tasks: Optional[list[dict[str, Any]]] = None


class DealProjectConversionPreview(BaseModel):
    """What converting this deal would produce, so the UI can show the budget
    pre-converted into the target currency before the user commits to it."""
    original_value: Optional[float] = None
    original_currency: str
    target_currency: str
    converted_value: Optional[float] = None
    rate: Optional[float] = None
    rate_date: Optional[date] = None
    converted: bool  # True only when the currencies differ AND a rate was found


# --- Project Task Schemas (also used for sub-tasks -- same shape, just parented) ---
class ProjectTaskTag(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(..., max_length=20)


class ProjectTaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status_id: Optional[int] = None  # defaults to the org's initial status if omitted
    priority: LeadPriority = LeadPriority.MEDIUM
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None
    start_date: Optional[date] = None
    order: int = 0
    estimated_hours: Optional[float] = Field(None, ge=0)
    actual_hours: Optional[float] = Field(None, ge=0)
    billing_type: BillingType = BillingType.BILLABLE
    tags: Optional[list[ProjectTaskTag]] = None
    custom_fields: Optional[dict[str, Any]] = None


class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status_id: Optional[int] = None
    priority: Optional[LeadPriority] = None
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None
    start_date: Optional[date] = None
    order: Optional[int] = None
    estimated_hours: Optional[float] = Field(None, ge=0)
    actual_hours: Optional[float] = Field(None, ge=0)
    billing_type: Optional[BillingType] = None
    parent_task_id: Optional[int] = None   # allows re-parenting a sub-task
    tags: Optional[list[ProjectTaskTag]] = None
    custom_fields: Optional[dict[str, Any]] = None


class ProjectTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    project_id: int
    parent_task_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    status_id: int
    priority: LeadPriority
    assignee_id: Optional[int] = None
    due_date: Optional[date] = None
    start_date: Optional[date] = None
    completed_at: Optional[datetime] = None
    order: int
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    billing_type: BillingType
    tags: Optional[list[ProjectTaskTag]] = None
    custom_fields: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


# --- Task File/Attachment Schemas ---
class ProjectTaskFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    task_id: int
    file_name: str
    file_size: int
    mime_type: str
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _attach_owner_name(cls, data: Any) -> Any:
        # Only computed when `.owner` was eagerly loaded (selectinload) -- touching
        # the relationship otherwise would trigger a lazy load and crash async sessions.
        if isinstance(data, dict):
            return data
        if "owner" not in sa_inspect(data).unloaded and data.owner is not None:
            data.owner_name = data.owner.full_name or data.owner.email
        return data
