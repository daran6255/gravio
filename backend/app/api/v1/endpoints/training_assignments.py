"""Training Assignment Endpoints"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.training_assignment import TrainingAssignmentCreate, TrainingAssignmentResponse
from app.services.training_extension_service import TrainingExtensionService
from app.utils.activity_tracker import log_create, log_update, log_delete

router = APIRouter(prefix="/assignments", tags=["Training Assignments"])



@router.post("/", response_model=TrainingAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    request: Request,
    assignment_in: TrainingAssignmentCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new training assignment record.
    """
    service = TrainingExtensionService(db)
    assignment = await service.create_assignment(assignment_in)
    
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_assignment",
        resource_id=assignment.id,
        created_object=assignment
    )
    return assignment


@router.post("/bulk", response_model=List[TrainingAssignmentResponse])
async def update_bulk_assignments(
    request: Request,
    assignments_in: List[TrainingAssignmentCreate],
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update bulk assignment records for a training batch.
    """
    service = TrainingExtensionService(db)
    records = await service.update_bulk_assignments(assignments_in)
    
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_assignment",
        resource_id=0, # Bulk updated
        before={"action": "bulk_update_start"},
        after={"count": len(records)}
    )
    
    return records


@router.get("/{batch_id}", response_model=List[TrainingAssignmentResponse])
async def get_assignments(
    batch_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get assignments for a specific training batch.
    """
    service = TrainingExtensionService(db)
    return await service.get_assignments(batch_id)


@router.delete("/{batch_id}/{assignment_name}", status_code=status.HTTP_200_OK)
async def delete_assignments_by_name(
    request: Request,
    batch_id: int,
    assignment_name: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all assignment records with a specific name in a batch.
    """
    service = TrainingExtensionService(db)
    result = await service.delete_assignments_by_name(batch_id, assignment_name)
    
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_assignment",
        resource_id=batch_id, # Scoped to batch
        # We could add info in data if needed
    )
    
    return result
@router.get("/candidate/{public_id}", response_model=List[TrainingAssignmentResponse])
async def get_candidate_assignments(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all assignment records for a specific candidate across all batches.
    """
    service = TrainingExtensionService(db)
    return await service.get_assignments_by_candidate(public_id)
