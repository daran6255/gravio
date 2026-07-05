"""SQLAlchemy models for the Gravit Project Management module.

A Won CRMDeal converts into a Project (see CRMDeal.project_id / Project.deal_id,
mirroring the existing CRMLead.deal_id <-> CRMDeal.lead_id pair). A Project holds
ProjectTasks, and a ProjectTask can itself have sub-tasks via a self-referential
parent_task_id -- sub-tasks are full ProjectTask rows, not a lightweight checklist.

Task status is intentionally NOT a fixed enum (unlike CRMDealTask.status): it's a
tenant-configurable list, mirroring CRMPipeline/CRMPipelineStage for Deals, so each
organization can rename/reorder/add/remove its own task workflow columns.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime, date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, ForeignKey, Uuid, JSON, DateTime, Date, Numeric, Boolean, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel, TenantAwareMixin
from app.models.crm import LeadPriority

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.crm import CRMCompany, CRMDeal


class ProjectStatus(str, enum.Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    IN_PROGRESS = "in_progress"
    DELAYED = "delayed"
    IN_TESTING = "in_testing"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    APPROVED = "approved"
    INVOICED = "invoiced"
    CANCELED = "canceled"


class BillingType(str, enum.Enum):
    BILLABLE = "billable"
    NON_BILLABLE = "non_billable"


class ProjectTaskStatus(BaseModel, TenantAwareMixin):
    """A tenant-configurable task workflow column (e.g. "To Do", "In Progress").

    Mirrors CRMPipelineStage exactly: an ordered, admin-editable, tenant-scoped
    list rather than a fixed Python enum, so each organization can customize its
    own task board columns.
    """
    __tablename__ = "project_task_statuses"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="#808080")
    is_initial_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_done_status: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    tasks: Mapped[list["ProjectTask"]] = relationship("ProjectTask", back_populates="status")

    def __repr__(self) -> str:
        return f"<ProjectTaskStatus(id={self.id}, name='{self.name}', order={self.order})>"


class Project(BaseModel, TenantAwareMixin):
    """A delivery project, typically created by converting a Won CRMDeal."""
    __tablename__ = "projects"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus, values_callable=lambda x: [e.value for e in x]),
        default=ProjectStatus.PLANNING,
        nullable=False,
    )
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    company_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_companies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    deal_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("crm_deals.id", ondelete="SET NULL"), nullable=True, index=True
    )
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    budget: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    phase: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    issues: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    owner: Mapped[Optional[User]] = relationship("User", foreign_keys=[owner_id])
    company: Mapped[Optional[CRMCompany]] = relationship("CRMCompany")
    deal: Mapped[Optional[CRMDeal]] = relationship("CRMDeal", foreign_keys=[deal_id])
    tasks: Mapped[list["ProjectTask"]] = relationship(
        "ProjectTask", back_populates="project", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Project(id={self.id}, name='{self.name}', status='{self.status}')>"


class ProjectTask(BaseModel, TenantAwareMixin):
    """A task within a project. Sub-tasks are ProjectTask rows with parent_task_id set --
    same shape as a top-level task (own status/assignee/due date/hours/billing type)."""
    __tablename__ = "project_tasks"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_task_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("project_tasks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project_task_statuses.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    priority: Mapped[LeadPriority] = mapped_column(
        Enum(LeadPriority, values_callable=lambda x: [e.value for e in x]),
        default=LeadPriority.MEDIUM,
        nullable=False,
    )
    assignee_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    estimated_hours: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    actual_hours: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    billing_type: Mapped[BillingType] = mapped_column(
        Enum(BillingType, values_callable=lambda x: [e.value for e in x]),
        default=BillingType.BILLABLE,
        nullable=False,
    )
    # Each tag is stored as {"name": str, "color": str} -- see ProjectTaskTag schema.
    tags: Mapped[Optional[list[dict]]] = mapped_column(JSON, nullable=True)
    custom_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    project: Mapped[Project] = relationship("Project", back_populates="tasks")
    status: Mapped[ProjectTaskStatus] = relationship("ProjectTaskStatus", back_populates="tasks")
    assignee: Mapped[Optional[User]] = relationship("User", foreign_keys=[assignee_id])
    parent: Mapped[Optional["ProjectTask"]] = relationship(
        "ProjectTask", remote_side="ProjectTask.id", back_populates="subtasks"
    )
    subtasks: Mapped[list["ProjectTask"]] = relationship(
        "ProjectTask", back_populates="parent", cascade="all, delete-orphan"
    )
    files: Mapped[list["ProjectTaskFile"]] = relationship(
        "ProjectTaskFile", back_populates="task", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ProjectTask(id={self.id}, title='{self.title}', project_id={self.project_id})>"


class ProjectTaskFile(BaseModel, TenantAwareMixin):
    """An uploaded attachment associated with a project task. Mirrors CRMFile,
    but scoped directly to a task_id rather than a generic entity_type/entity_id
    pair, since attachments here only ever belong to a project task."""
    __tablename__ = "project_task_files"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, unique=True, index=True, nullable=False, default=uuid.uuid4
    )
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("project_tasks.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    owner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relationships
    task: Mapped[ProjectTask] = relationship("ProjectTask", back_populates="files")
    owner: Mapped[Optional[User]] = relationship("User", foreign_keys=[owner_id])

    def __repr__(self) -> str:
        return f"<ProjectTaskFile(id={self.id}, file_name='{self.file_name}', task_id={self.task_id})>"
