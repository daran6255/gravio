# pyre-ignore-all
"""DSR Activities API endpoints"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, UploadFile, File, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.dsr_activity import DSRActivityStatus
from app.schemas.dsr_activity import (
    DSRActivityCreate,
    DSRActivityUpdate,
    DSRActivityResponse,
    DSRActivityListResponse,
    DSRActivityImportResult,
    DSRActivityBulkDelete,
)
from app.services.dsr_activity_service import DSRActivityService

router = APIRouter()


@router.post("", response_model=DSRActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    data: DSRActivityCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Create a planned activity under a project (Project Owner / Admin)."""
    service = DSRActivityService(db)
    activity = await service.create_activity(data, current_user)
    await db.commit()
    await db.refresh(activity)
    return activity


@router.post("/import", response_model=DSRActivityImportResult, status_code=status.HTTP_200_OK)
async def import_activities_excel(
    file: UploadFile = File(
        ...,
        description="Excel file (.xlsx). Columns: project_name, name, description, start_date, end_date, status",
    ),
    project_public_id: Optional[UUID] = Query(None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk-import planned activities from Excel (Project Owner / Admin).
    Each row is only imported for projects the current user owns (Admin bypasses this).
    """
    service = DSRActivityService(db)
    result = await service.import_from_excel(file, current_user, project_public_id)
    await db.commit()
    return result


@router.get("", response_model=DSRActivityListResponse)
async def list_activities(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    project_public_id: Optional[UUID] = Query(default=None, description="Filter by project"),
    status: Optional[DSRActivityStatus] = Query(default=None),
    active_only: bool = Query(default=False),
    assigned_to: Optional[UUID] = Query(default=None, description="Filter by assigned user"),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """List activities with filters (all roles). Use project_public_id to scope to a project."""
    service = DSRActivityService(db)
    items, total = await service.get_activities(
        current_user=current_user,
        skip=skip,
        limit=limit,
        project_public_id=project_public_id,
        status=status,
        active_only=active_only,
        assigned_to_public_id=assigned_to,
        search=search,
    )
    return DSRActivityListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/template")
async def get_activity_import_template(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """Download a blank Excel template for activity import."""
    service = DSRActivityService(db)
    file_content = await service.get_import_template()
    return StreamingResponse(
        file_content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=activity_import_template.xlsx"}
    )


@router.get("/export")
async def export_activities_excel(
    project_public_id: UUID = Query(...),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Export all activities for a project to Excel (Project Owner / Admin)."""
    service = DSRActivityService(db)
    # Check ownership inside service or here
    file_content = await service.export_activities(project_public_id)
    return StreamingResponse(
        file_content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=activities_export.xlsx"}
    )


@router.get("/{public_id}", response_model=DSRActivityResponse)
async def get_activity(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Get a single activity (all roles)."""
    service = DSRActivityService(db)
    return await service.get_activity(public_id, current_user)


@router.put("/{public_id}", response_model=DSRActivityResponse)
async def update_activity(
    public_id: UUID,
    data: DSRActivityUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Update a planned activity (Project Owner / Admin)."""
    service = DSRActivityService(db)
    activity = await service.update_activity(public_id, data, current_user)
    await db.commit()
    return activity


@router.delete("/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a planned activity (Project Owner / Admin)."""
    service = DSRActivityService(db)
    await service.delete_activity(public_id, current_user)
    await db.commit()


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_activities(
    data: DSRActivityBulkDelete,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Bulk soft-delete planned activities (Project Owner / Admin)."""
    service = DSRActivityService(db)
    deleted_public_ids, skipped_names = await service.bulk_delete_activities(data.public_ids, current_user)
    await db.commit()
    return {
        "deleted_count": len(deleted_public_ids),
        "deleted_public_ids": deleted_public_ids,
        "skipped_count": len(skipped_names),
        "skipped_names": skipped_names,
        "message": f"Deleted {len(deleted_public_ids)} activities." + (f" Skipped {len(skipped_names)} activities due to existing DSR entries." if skipped_names else "")
    }
