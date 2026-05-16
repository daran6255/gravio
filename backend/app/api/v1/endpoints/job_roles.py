"""Job Role Endpoints"""

from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User, UserRole
from app.models.job_role import JobRoleStatus
from app.schemas.job_role import JobRoleCreate, JobRoleUpdate, JobRoleRead, JobRoleListResponse
from app.services.job_role_service import JobRoleService

router = APIRouter()


@router.get("/", response_model=JobRoleListResponse)
async def get_job_roles(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    status_filter: Optional[JobRoleStatus] = Query(None, alias="status"),
    company_id: Optional[int] = None,
    contact_id: Optional[int] = None,
) -> Any:
    """Get all job roles with pagination and filters"""
    service = JobRoleService(db)
    return await service.get_job_roles(
        skip=skip,
        limit=limit,
        search=search,
        status_filter=status_filter,
        company_id=company_id,
        contact_id=contact_id
    )


@router.post("/", response_model=JobRoleRead, status_code=status.HTTP_201_CREATED)
async def create_job_role(
    job_role_in: JobRoleCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Create a new job role"""
    service = JobRoleService(db)
    return await service.create_job_role(job_role_in, current_user)


@router.get("/{public_id}", response_model=JobRoleRead)
async def get_job_role(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Get job role by public_id"""
    service = JobRoleService(db)
    return await service.get_job_role(public_id)


@router.put("/{public_id}", response_model=JobRoleRead)
async def update_job_role(
    public_id: UUID,
    job_role_in: JobRoleUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Update job role info"""
    service = JobRoleService(db)
    return await service.update_job_role(public_id, job_role_in)


@router.patch("/{public_id}/status", response_model=JobRoleRead)
async def change_job_role_status(
    public_id: UUID,
    new_status: JobRoleStatus,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Change job role status"""
    service = JobRoleService(db)
    return await service.change_status(public_id, new_status, reason)


@router.delete("/{public_id}")
async def delete_job_role(
    public_id: UUID,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Soft delete a job role"""
    service = JobRoleService(db)
    await service.delete_job_role(public_id, reason)
    return {"message": "Job Role deleted successfully"}
