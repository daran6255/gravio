"""Training Mock Interview Endpoints"""

from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.training_mock_interview import TrainingMockInterviewCreate, TrainingMockInterviewUpdate, TrainingMockInterviewResponse
from app.services.training_extension_service import TrainingExtensionService
from app.utils.activity_tracker import log_create, log_update, log_delete

router = APIRouter(prefix="/mock-interviews", tags=["Training Mock Interviews"])



@router.post("/", response_model=TrainingMockInterviewResponse, status_code=status.HTTP_201_CREATED)
async def create_mock_interview(
    request: Request,
    mock_in: TrainingMockInterviewCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new mock interview record.
    """
    service = TrainingExtensionService(db)
    mock = await service.create_mock_interview(mock_in)
    
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_mock_interview",
        resource_id=mock.id,
        created_object=mock
    )
    return mock


@router.get("/batch/{batch_id}", response_model=List[TrainingMockInterviewResponse])
async def get_mock_interviews_by_batch(
    batch_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get mock interviews for a specific training batch.
    """
    service = TrainingExtensionService(db)
    return await service.get_mock_interviews(batch_id)


@router.get("/{id}", response_model=TrainingMockInterviewResponse)
async def get_mock_interview(
    id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a mock interview record by ID.
    """
    service = TrainingExtensionService(db)
    mock = await service.get_mock_interview(id)
    if not mock:
        raise HTTPException(status_code=404, detail="Mock interview not found")
    return mock


@router.put("/{id}", response_model=TrainingMockInterviewResponse)
async def update_mock_interview(
    request: Request,
    id: int,
    mock_in: TrainingMockInterviewUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a mock interview record.
    """
    service = TrainingExtensionService(db)
    
    original_mock = await service.get_mock_interview(id)
    if not original_mock:
        raise HTTPException(status_code=404, detail="Mock interview not found")
        
    mock = await service.update_mock_interview(id, mock_in)
    
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_mock_interview",
        resource_id=id,
        before=original_mock,
        after=mock
    )
    return mock


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mock_interview(
    request: Request,
    id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a mock interview record.
    """
    service = TrainingExtensionService(db)
    
    # Check if exists
    mock = await service.get_mock_interview(id)
    if not mock:
        raise HTTPException(status_code=404, detail="Mock interview not found")
        
    await service.delete_mock_interview(id)
    
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_mock_interview",
        resource_id=id
    )
    return None
@router.get("/candidate/{public_id}", response_model=List[TrainingMockInterviewResponse])
async def get_candidate_mock_interviews(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all mock interview records for a specific candidate across all batches.
    """
    service = TrainingExtensionService(db)
    return await service.get_mock_interviews_by_candidate(public_id)


@router.post("/{id}/generate-token", response_model=TrainingMockInterviewResponse)
async def generate_mock_interview_token(
    id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a secure token for candidate self-assessment.
    """
    service = TrainingExtensionService(db)
    return await service.generate_mock_interview_token(id)
