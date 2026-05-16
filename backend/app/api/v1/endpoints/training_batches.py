"""Training Batch Endpoints"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.training_batch import TrainingBatchCreate, TrainingBatchResponse, TrainingBatchUpdate, TrainingBatchExtend, TrainingBatchPaginatedResponse
from app.services.training_batch_service import TrainingBatchService
from app.utils.activity_tracker import log_create, log_update, log_delete


router = APIRouter(prefix="/training-batches", tags=["Training Batches"])


@router.post("/", response_model=TrainingBatchResponse, status_code=status.HTTP_201_CREATED)
async def create_training_batch(
    request: Request,
    batch_in: TrainingBatchCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new training batch (Admin/Manager only)
    """
    service = TrainingBatchService(db)
    batch = await service.create_batch(batch_in)
    
    # Log the creation
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch",
        resource_id=batch.id,
        created_object=batch
    )
    
    return batch


@router.get("/", response_model=TrainingBatchPaginatedResponse)
async def get_training_batches(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    status: str = None,
    disability_types: str = None, # Comma-separated list
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all training batches with filtering and pagination
    """
    disability_types_list = disability_types.split(',') if disability_types else None
    status_list = status.split(',') if status else None
    
    service = TrainingBatchService(db)
    items = await service.get_batches(
        skip=skip,
        limit=limit,
        search=search,
        status=status_list or status,
        disability_types=disability_types_list,
        sort_by=sort_by,
        sort_order=sort_order
    )
    total = await service.get_total_count(
        search=search,
        status=status_list or status,
        disability_types=disability_types_list
    )
    
    return {"items": items, "total": total}


@router.get("/stats")
async def get_training_batch_stats(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get training batch statistics
    """
    service = TrainingBatchService(db)
    return await service.get_stats()


@router.get("/{public_id}", response_model=TrainingBatchResponse)
async def get_training_batch(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a training batch by its public ID
    """
    service = TrainingBatchService(db)
    return await service.get_batch_by_public_id(public_id)


@router.put("/{public_id}", response_model=TrainingBatchResponse)
async def update_training_batch(
    request: Request,
    public_id: UUID,
    batch_in: TrainingBatchUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a training batch (Admin/Manager only)
    """
    service = TrainingBatchService(db)
    
    # Get before state
    existing_batch = await service.get_batch_by_public_id(public_id)
    
    updated_batch = await service.update_batch(public_id, batch_in)
    
    # Log the update
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch",
        resource_id=updated_batch.id,
        before=existing_batch,
        after=updated_batch
    )
    
    return updated_batch


@router.post("/{public_id}/extend", response_model=TrainingBatchResponse)
async def extend_training_batch(
    request: Request,
    public_id: UUID,
    extend_in: TrainingBatchExtend,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Extend a training batch end date (Admin/Manager only)
    """
    service = TrainingBatchService(db)
    
    # Get before state
    existing_batch = await service.get_batch_by_public_id(public_id)
    
    updated_batch = await service.extend_batch(public_id, extend_in)
    
    # Log the update
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch",
        resource_id=updated_batch.id,
        before=existing_batch,
        after=updated_batch
    )
    
    return updated_batch


@router.delete("/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_training_batch(
    request: Request,
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a training batch (Admin only)
    """
    service = TrainingBatchService(db)
    batch = await service.get_batch_by_public_id(public_id)
    
    await service.delete_batch(public_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch",
        resource_id=batch.id
    )
    
    return None
