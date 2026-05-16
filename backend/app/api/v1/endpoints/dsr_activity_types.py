"""DSR Activity Types API endpoints"""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.dsr_activity_type import (
    DSRActivityTypeCreate,
    DSRActivityTypeUpdate,
    DSRActivityTypeResponse,
    DSRActivityTypeListResponse,
    DSRActivityTypeBulkDelete,
)
from app.services.dsr_activity_type_service import DSRActivityTypeService

router = APIRouter()

# All authenticated roles allowed to list types (needed for DSR form dropdown)
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


@router.get("", response_model=DSRActivityTypeListResponse)
async def list_activity_types(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=200, ge=1, le=500),
    active_only: bool = Query(default=False),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles(_ALL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """List all DSR activity types (all authenticated roles — used by DSR form dropdown)."""
    service = DSRActivityTypeService(db)
    items, total = await service.get_types(skip=skip, limit=limit, active_only=active_only, search=search)
    return DSRActivityTypeListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{public_id}", response_model=DSRActivityTypeResponse)
async def get_activity_type(
    public_id: UUID,
    current_user: User = Depends(require_roles(_ALL_ROLES)),
    db: AsyncSession = Depends(get_db),
):
    """Get a single DSR activity type by public_id."""
    service = DSRActivityTypeService(db)
    return await service.get_type(public_id)


@router.post("", response_model=DSRActivityTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_activity_type(
    data: DSRActivityTypeCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new DSR activity type (Admin only)."""
    service = DSRActivityTypeService(db)
    obj = await service.create_type(data, current_user)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.put("/{public_id}", response_model=DSRActivityTypeResponse)
async def update_activity_type(
    public_id: UUID,
    data: DSRActivityTypeUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Update a DSR activity type (Admin only)."""
    service = DSRActivityTypeService(db)
    obj = await service.update_type(public_id, data, current_user)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity_type(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a DSR activity type (Admin only)."""
    service = DSRActivityTypeService(db)
    await service.delete_type(public_id, current_user)
    await db.commit()


@router.get("/import/template")
async def get_import_template(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    """Get CSV template for importing activity types."""
    csv_content = "name,code,category,description,sort_order\n"
    csv_content += "Sample Activity,SAMPLE01,Sourcing,This is a sample description,10\n"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dsr_activity_types_template.csv"}
    )


@router.post("/import")
async def import_activity_types(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Import activity types from CSV (Admin only)."""
    service = DSRActivityTypeService(db)
    result = await service.import_activity_types(file, current_user)
    await db.commit()
    return result


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_activity_types(
    data: DSRActivityTypeBulkDelete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    """Bulk delete activity types (Admin only)."""
    service = DSRActivityTypeService(db)
    count = await service.bulk_delete_types(data.public_ids, current_user)
    await db.commit()
    return {"message": f"Successfully deleted {count} activity types", "count": count}
