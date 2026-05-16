"""DSR Project Requests API endpoints"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.dsr_project_request import DSRProjectRequestStatus
from app.schemas.dsr_project_request import (
    DSRProjectRequestCreate,
    DSRProjectRequestHandle,
    DSRProjectRequestResponse,
    DSRProjectRequestListResponse,
)
from app.services.dsr_project_request_service import DSRProjectRequestService

router = APIRouter()

_ALL_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TRAINER,
    UserRole.SOURCING,
    UserRole.PLACEMENT,
    UserRole.COUNSELOR,
    UserRole.PROJECT_COORDINATOR,
    UserRole.DEVELOPER,
    UserRole.MARKETING,
]


@router.post("", response_model=DSRProjectRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_project_request(
    data: DSRProjectRequestCreate,
    current_user: User = Depends(require_roles(_ALL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Raise a request to add a new project to the dropdown (any authenticated user)."""
    service = DSRProjectRequestService(db)
    req = await service.create_request(data, current_user)
    await db.commit()
    await db.refresh(req)
    return req


@router.get("", response_model=DSRProjectRequestListResponse)
async def list_project_requests(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    status_filter: Optional[DSRProjectRequestStatus] = Query(default=None, alias="status"),
    current_user: User = Depends(require_roles(_ALL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """List project requests. Users see their own; Admins/Managers see all."""
    service = DSRProjectRequestService(db)
    items, total = await service.get_requests(
        current_user,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
    )
    return DSRProjectRequestListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{public_id}", response_model=DSRProjectRequestResponse)
async def get_project_request(
    public_id: UUID,
    current_user: User = Depends(require_roles(_ALL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific project request."""
    service = DSRProjectRequestService(db)
    return await service.get_request(public_id, current_user)


@router.put("/{public_id}/handle", response_model=DSRProjectRequestResponse)
async def handle_project_request(
    public_id: UUID,
    data: DSRProjectRequestHandle,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """Admin/Manager approves or rejects a project request. Approval auto-creates the project."""
    service = DSRProjectRequestService(db)
    req = await service.handle_request(public_id, data, current_user)
    await db.commit()
    await db.refresh(req)
    return req
