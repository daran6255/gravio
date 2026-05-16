from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.utils.activity_tracker import log_create, log_update, log_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import UserRole
from app.repositories.dynamic_field_repository import DynamicFieldRepository
from app.schemas.dynamic_field import DynamicFieldCreate, DynamicFieldUpdate, DynamicFieldResponse

router = APIRouter(prefix="/settings/fields", tags=["Settings"])


@router.get("/{entity_type}", response_model=List[DynamicFieldResponse])
async def get_fields(
    entity_type: str,
    db: AsyncSession = Depends(get_db),
    # Any authenticated user can read fields to render forms
) -> Any:
    """
    Get all dynamic fields for a specific entity type.
    """
    repo = DynamicFieldRepository(db)
    fields = await repo.get_by_entity_type(entity_type)
    return fields


@router.post("", response_model=DynamicFieldResponse, status_code=status.HTTP_201_CREATED)
async def create_field(
    *,
    db: AsyncSession = Depends(get_db),
    request: Request,
    field_in: DynamicFieldCreate,
    current_user: Any = Depends(require_roles([UserRole.ADMIN])),
) -> Any:
    """
    Create a new dynamic field. (Admin only)
    """
    repo = DynamicFieldRepository(db)
    # Check if field name already exists for this entity
    existing = await repo.get_by_entity_type(field_in.entity_type)
    if any(f.name == field_in.name for f in existing):
        raise HTTPException(status_code=400, detail=f"Field with name '{field_in.name}' already exists for {field_in.entity_type}")
    
    field = await repo.create(field_in.model_dump())
    
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="dynamic_field",
        resource_id=field.id,
        created_object=field
    )
    
    return field


@router.put("/{id}", response_model=DynamicFieldResponse)
async def update_field(
    *,
    db: AsyncSession = Depends(get_db),
    request: Request,
    id: int,
    field_in: DynamicFieldUpdate,
    current_user: Any = Depends(require_roles([UserRole.ADMIN])),
) -> Any:
    """
    Update a dynamic field. (Admin only)
    """
    repo = DynamicFieldRepository(db)
    field = await repo.get(id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    update_data = field_in.model_dump(exclude_unset=True)
    updated_field = await repo.update(id, update_data)
    
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="dynamic_field",
        resource_id=id,
        before=field,
        after=updated_field
    )
    
    return updated_field


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_field(
    *,
    db: AsyncSession = Depends(get_db),
    request: Request,
    id: int,
    current_user: Any = Depends(require_roles([UserRole.ADMIN])),
):
    """
    Delete a dynamic field. (Admin only)
    """
    repo = DynamicFieldRepository(db)
    # Use include_deleted=True to check if it exists at all
    field = await repo.get(id, include_deleted=True)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    if not field.is_deleted:
        await repo.delete(id)
        
        await log_delete(
            db=db,
            request=request,
            user_id=current_user.id,
            resource_type="dynamic_field",
            resource_id=id
        )
        
    return None
