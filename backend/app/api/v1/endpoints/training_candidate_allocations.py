"""Training Candidate Allocation Endpoints"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Request, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.training_candidate_allocation import (
    TrainingCandidateAllocationCreate, 
    TrainingCandidateAllocationResponse, 
    TrainingCandidateAllocationUpdate,
    TrainingCandidateAllocationPaginatedResponse,
    TrainingCandidateAllocationReallocate
)
from app.services.training_candidate_allocation_service import TrainingCandidateAllocationService
from app.utils.activity_tracker import log_create, log_update, log_delete


router = APIRouter(prefix="/training-candidate-allocations", tags=["Training Candidate Allocations"])


@router.get("/", response_model=TrainingCandidateAllocationPaginatedResponse)
async def get_all_allocations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = Query(None),
    batch_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    is_dropout: Optional[bool] = Query(None),
    gender: Optional[str] = Query(None),
    disability_types: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Generic retrieval of candidate allocations for reports and management.
    """
    service = TrainingCandidateAllocationService(db)
    items, total = await service.get_multi(
        skip=skip,
        limit=limit,
        search=search,
        batch_id=batch_id,
        status=status,
        is_dropout=is_dropout,
        gender=gender,
        disability_types=disability_types,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {"items": items, "total": total}


from app.core.database import get_db, AsyncSessionLocal


async def _run_export_allocations(
    user_id: int,
    user_email: str,
    user_name: str,
    columns: Optional[str] = None,
    **kwargs
):
    """Wrapper to run export in background with its own DB session"""
    from loguru import logger
    import sys
    print(f"DEBUG: Background task STARTING for training allocations export (User: {user_email})")
    sys.stdout.flush()
    logger.info(f"Background task STARTED for training allocations export (User: {user_email})")
    try:
        async with AsyncSessionLocal() as db:
            from app.models.user import User
            current_user = User(
                id=user_id, 
                email=user_email, 
                full_name=user_name,
                username=user_email
            )
            
            service = TrainingCandidateAllocationService(db)
            await service.export_allocations(current_user=current_user, columns=columns, **kwargs)
        logger.info(f"Background task COMPLETED for training allocations export (User: {user_email})")
        print(f"DEBUG: Background task COMPLETED for training allocations export (User: {user_email})")
        sys.stdout.flush()
    except Exception as e:
        logger.error(f"Background task FAILED for training allocations export: {str(e)}", exc_info=True)
        print(f"DEBUG: Background task FAILED for training allocations export: {str(e)}")
        sys.stdout.flush()


@router.post("/export")
async def export_allocations(
    background_tasks: BackgroundTasks,
    search: Optional[str] = Query(None),
    batch_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    is_dropout: Optional[bool] = Query(None),
    gender: Optional[str] = Query(None),
    disability_types: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    columns: Optional[str] = Query(None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Export all matching allocations and send via email.
    """
    service = TrainingCandidateAllocationService(db)
    from loguru import logger
    logger.info(f"API: Export training allocations requested by {current_user.email}")
    
    # Trigger export in background
    background_tasks.add_task(
        _run_export_allocations,
        user_id=current_user.id,
        user_email=current_user.email,
        user_name=current_user.full_name or current_user.username,
        columns=columns,
        search=search,
        batch_id=batch_id,
        status=status,
        is_dropout=is_dropout,
        gender=gender,
        disability_types=disability_types,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return {"message": f"Export started. The report will be sent to {current_user.email} shortly."}


@router.post("/", response_model=TrainingCandidateAllocationResponse, status_code=status.HTTP_201_CREATED)
async def allocate_candidate(
    request: Request,
    allocation_in: TrainingCandidateAllocationCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Allocate a candidate to a training batch (Admin/Manager only)
    """
    service = TrainingCandidateAllocationService(db)
    allocation = await service.allocate_candidate(allocation_in)
    
    # Log the allocation
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_candidate_allocation",
        resource_id=allocation.id,
        created_object=allocation
    )
    
    return allocation


@router.get("/batch/{batch_public_id}", response_model=List[TrainingCandidateAllocationResponse])
async def get_batch_allocations(
    batch_public_id: UUID,
    search: Optional[str] = Query(None),
    is_dropout: Optional[bool] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all candidate allocations for a specific batch with search and filter
    """
    service = TrainingCandidateAllocationService(db)
    allocations = await service.get_allocations_by_batch(
        batch_public_id=batch_public_id,
        search=search,
        is_dropout=is_dropout,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return allocations


@router.get("/candidate/{candidate_public_id}", response_model=List[TrainingCandidateAllocationResponse])
async def get_candidate_allocations(
    candidate_public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all allocations for a specific candidate (current and historical)
    """
    service = TrainingCandidateAllocationService(db)
    allocations = await service.get_allocations_by_candidate(candidate_public_id)
    return allocations


@router.get("/eligible", response_model=List[dict])
async def get_eligible_candidates(
    batch_public_id: Optional[UUID] = Query(None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all candidates eligible for training (selected in counseling and not in active training)
    Optional: pass batch_public_id to filter by matching disability type
    """
    service = TrainingCandidateAllocationService(db)
    return await service.get_eligible_candidates(batch_public_id)


@router.put("/{public_id}", response_model=TrainingCandidateAllocationResponse)
async def update_allocation(
    request: Request,
    public_id: UUID,
    allocation_in: TrainingCandidateAllocationUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a candidate allocation (Admin/Manager)
    Can be used to mark as dropout.
    """
    service = TrainingCandidateAllocationService(db)
    
    # Get before state for logging
    allocation_obj = await service.repository.get_by_public_id(str(public_id))
    if not allocation_obj:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Allocation not found")
        
    updated_allocation = await service.update_allocation(public_id, allocation_in)
    
    # Log the update
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_candidate_allocation",
        resource_id=updated_allocation.id,
        before=allocation_obj,
        after=updated_allocation
    )
    
    return updated_allocation


@router.post("/{public_id}/reallocate", response_model=TrainingCandidateAllocationResponse)
async def reallocate_candidate(
    request: Request,
    public_id: UUID,
    reallocate_in: TrainingCandidateAllocationReallocate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Move a candidate from one batch to another (Admin/Manager only)
    """
    service = TrainingCandidateAllocationService(db)
    
    # 1. Get current allocation for logging
    old_allocation = await service.get_allocation(public_id)
    
    # 2. Perform reallocation
    new_allocation = await service.reallocate_candidate(
        public_id=public_id,
        new_batch_public_id=reallocate_in.new_batch_public_id,
        transfer_data=reallocate_in.transfer_data
    )
    
    # 3. Log the reallocation (combination of delete and create)
    # Log deletion of old
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_candidate_allocation",
        resource_id=old_allocation.id
    )
    
    # Log creation of new
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_candidate_allocation",
        resource_id=new_allocation.id,
        created_object=new_allocation
    )
    
    return new_allocation


@router.delete("/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allocation(
    request: Request,
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a candidate allocation (Admin/Manager only)
    """
    service = TrainingCandidateAllocationService(db)
    allocation = await service.repository.get_by_public_id(str(public_id))
    if not allocation:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Allocation not found")
        
    await service.remove_allocation(public_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_candidate_allocation",
        resource_id=allocation.id
    )
    
    return None
