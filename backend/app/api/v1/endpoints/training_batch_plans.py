"""Training Batch Plan Endpoints"""

from typing import List
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.training_batch_plan import TrainingBatchPlanCreate, TrainingBatchPlanResponse, TrainingBatchPlanUpdate
from app.services.training_batch_plan_service import TrainingBatchPlanService
from app.utils.activity_tracker import log_create, log_update, log_delete


router = APIRouter(prefix="/training-batch-plans", tags=["Training Batch Plans"])


@router.post("/", response_model=TrainingBatchPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan_entry(
    request: Request,
    plan_in: TrainingBatchPlanCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new training batch plan entry (Admin/Manager only)
    """
    service = TrainingBatchPlanService(db)
    plan = await service.create_plan_entry(plan_in)
    
    # Log the creation
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch_plan",
        resource_id=plan.id,
        created_object=plan
    )
    
    return plan


@router.get("/batch/{batch_public_id}", response_model=List[TrainingBatchPlanResponse])
async def get_weekly_plan(
    batch_public_id: UUID,
    start_date: date,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a weekly plan for a batch starting from a specific date
    """
    service = TrainingBatchPlanService(db)
    return await service.get_weekly_plan(batch_public_id, start_date)


@router.get("/batch/{batch_public_id}/all", response_model=List[TrainingBatchPlanResponse])
async def get_all_batch_plans(
    batch_public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all plan entries for a batch (for overall statistics)
    """
    service = TrainingBatchPlanService(db)
    return await service.get_full_batch_plan(batch_public_id)


@router.get("/{public_id}", response_model=TrainingBatchPlanResponse)
async def get_plan_entry(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a training plan entry by its public ID
    """
    service = TrainingBatchPlanService(db)
    return await service.get_plan_by_public_id(public_id)


@router.put("/{public_id}", response_model=TrainingBatchPlanResponse)
async def update_plan_entry(
    request: Request,
    public_id: UUID,
    plan_in: TrainingBatchPlanUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a training plan entry (Admin/Manager only)
    """
    service = TrainingBatchPlanService(db)
    
    # Get before state
    existing_plan = await service.get_plan_by_public_id(public_id)
    
    updated_plan = await service.update_plan_entry(public_id, plan_in)
    
    # Log the update
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch_plan",
        resource_id=updated_plan.id,
        before=existing_plan,
        after=updated_plan
    )
    
    return updated_plan


@router.delete("/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan_entry(
    request: Request,
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a training plan entry (Admin/Manager only)
    """
    service = TrainingBatchPlanService(db)
    plan = await service.get_plan_by_public_id(public_id)
    
    await service.delete_plan_entry(public_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch_plan",
        resource_id=plan.id
    )
    
    return None


@router.post("/batch/{batch_public_id}/sync", status_code=status.HTTP_200_OK)
async def sync_batch_with_project(
    batch_public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger a full synchronization of batch plan entries with DSR activities (Admin/Manager only).
    """
    service = TrainingBatchPlanService(db)
    await service.full_sync_batch(batch_public_id)
    return {"message": "Batch synchronized successfully"}
