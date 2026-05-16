"""DSR Projects API endpoints"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.dsr_project import (
    DSRProjectCreate,
    DSRProjectUpdate,
    DSRProjectResponse,
    DSRProjectListResponse,
    DSRProjectImportResult,
    TrainingProjectSummary,
)
from app.services.dsr_project_service import DSRProjectService

router = APIRouter()


@router.post("", response_model=DSRProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: DSRProjectCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new DSR project (Manager / Admin). Assigns an owner user."""
    service = DSRProjectService(db)
    project = await service.create_project(data, current_user)
    await db.commit()
    await db.refresh(project)
    return project


@router.post("/import", response_model=DSRProjectImportResult, status_code=status.HTTP_200_OK)
async def import_projects_excel(
    file: UploadFile = File(..., description="Excel file (.xlsx). Columns: name, owner_email, is_active"),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """Bulk-import DSR projects from an Excel file (Manager / Admin)."""
    service = DSRProjectService(db)
    result = await service.import_from_excel(file, current_user)
    await db.commit()
    return result


@router.get("/template")
async def get_project_import_template(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """Get a blank Excel template for project import."""
    service = DSRProjectService(db)
    output = await service.get_import_template()
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=project_import_template.xlsx"},
    )


@router.get("", response_model=DSRProjectListResponse)
async def list_projects(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    active_only: bool = Query(default=False),
    assigned_to: Optional[UUID] = Query(default=None, description="Filter by assigned user"),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """List all DSR projects (all roles)."""
    service = DSRProjectService(db)
    items, total = await service.get_projects(
        current_user=current_user, skip=skip, limit=limit, active_only=active_only, assigned_to_public_id=assigned_to, search=search
    )
    return DSRProjectListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{public_id}", response_model=DSRProjectResponse)
async def get_project(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Get a single DSR project by public_id (all roles)."""
    service = DSRProjectService(db)
    return await service.get_project(public_id, current_user)


@router.put("/{public_id}", response_model=DSRProjectResponse)
async def update_project(
    public_id: UUID,
    data: DSRProjectUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """Update a DSR project (Manager / Admin)."""
    service = DSRProjectService(db)
    project = await service.update_project(public_id, data, current_user)
    await db.commit()
    return project


@router.delete("/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a DSR project (Admin only)."""
    service = DSRProjectService(db)
    await service.delete_project(public_id, current_user)
    await db.commit()


@router.get("/{public_id}/training-summary", response_model=TrainingProjectSummary)
async def get_training_summary(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.PROJECT_COORDINATOR])),
    db: AsyncSession = Depends(get_db),
):
    """Get a detailed planned vs actual summary for a training project (Manager / Admin / Trainer)."""
    service = DSRProjectService(db)
    return await service.get_training_summary(public_id, current_user)


@router.post("/{public_id}/sync", status_code=status.HTTP_200_OK)
async def sync_training_project(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger sync for a training project (Manager / Admin)."""
    service = DSRProjectService(db)
    success = await service.sync_training_project(public_id, current_user)
    if success:
        await db.commit()
    return {"success": success}
