"""Candidate Screening Endpoints"""

from uuid import UUID
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limiter import rate_limit_medium
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.candidate_screening import (
    CandidateScreeningCreate,
    CandidateScreeningUpdate,
    CandidateScreeningResponse
)
from app.services.candidate_screening_service import CandidateScreeningService
from app.utils.activity_tracker import log_create, log_update, log_delete


router = APIRouter(tags=["Candidate Screening"])


@router.post(
    "/candidates/{public_id}/screening",
    response_model=CandidateScreeningResponse,
    status_code=status.HTTP_201_CREATED
)
@rate_limit_medium()
async def create_candidate_screening(
    request: Request,
    public_id: UUID,
    screening_in: CandidateScreeningCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SOURCING, UserRole.MANAGER, UserRole.TRAINER, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create screening for a candidate
    """
    service = CandidateScreeningService(db)
    screening_in.screened_by_id = current_user.id
    screening = await service.create_screening(public_id, screening_in)
    
    # Log the creation
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_screening",
        resource_id=screening.id,
        created_object=screening
    )
    
    return screening


@router.put(
    "/candidates/{public_id}/screening",
    response_model=CandidateScreeningResponse
)
@rate_limit_medium()
async def update_candidate_screening(
    request: Request,
    public_id: UUID,
    screening_in: CandidateScreeningUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SOURCING, UserRole.MANAGER, UserRole.TRAINER, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update candidate screening
    """
    service = CandidateScreeningService(db)
    
    # Get before state
    existing_screening = await service.get_screening(public_id)
    
    # If screened_by_id is not set, set it now
    if existing_screening and not existing_screening.screened_by_id:
        screening_in.screened_by_id = current_user.id
    
    updated_screening = await service.update_screening(public_id, screening_in)
    
    # Log the update
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_screening",
        resource_id=updated_screening.id,
        before=existing_screening,
        after=updated_screening
    )
    
    return updated_screening


@router.delete(
    "/candidates/{public_id}/screening",
    status_code=status.HTTP_204_NO_CONTENT
)
@rate_limit_medium()
async def delete_candidate_screening(
    request: Request,
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete candidate screening (Admin only)
    """
    service = CandidateScreeningService(db)
    # Get screening info before deleting
    screening = await service.get_screening(public_id)
    
    await service.delete_screening(public_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_screening",
        resource_id=screening.id
    )
    
    return None
