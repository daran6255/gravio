"""Candidate Counseling Endpoints"""

from uuid import UUID
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limiter import rate_limit_medium
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.candidate_counseling import (
    CandidateCounselingCreate,
    CandidateCounselingUpdate,
    CandidateCounselingResponse
)
from app.services.candidate_counseling_service import CandidateCounselingService
from app.utils.activity_tracker import log_create, log_update, log_delete


router = APIRouter(tags=["Candidate Counseling"])


@router.post(
    "/candidates/{public_id}/counseling",
    response_model=CandidateCounselingResponse,
    status_code=status.HTTP_201_CREATED
)
@rate_limit_medium()
async def create_candidate_counseling(
    request: Request,
    public_id: UUID,
    counseling_in: CandidateCounselingCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.TRAINER, UserRole.MANAGER, UserRole.SOURCING])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create counseling record for a candidate (Trainer only)
    Automatically tracks the counselor who created the record.
    """
    service = CandidateCounselingService(db)
    counseling = await service.create_counseling(
        public_id, 
        counseling_in,
        counselor_id=current_user.id  # Track who created this
    )
    
    # Log the creation
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_counseling",
        resource_id=counseling.id,
        created_object=counseling
    )
    
    return counseling


@router.put(
    "/candidates/{public_id}/counseling",
    response_model=CandidateCounselingResponse
)
@rate_limit_medium()
async def update_candidate_counseling(
    request: Request,
    public_id: UUID,
    counseling_in: CandidateCounselingUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.TRAINER, UserRole.MANAGER, UserRole.SOURCING])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update candidate counseling record (Trainer only)
    Updates the counselor who last modified the record.
    """
    service = CandidateCounselingService(db)
    
    # Get before state
    existing_counseling = await service.get_counseling(public_id)
    
    updated_counseling = await service.update_counseling(
        public_id,
        counseling_in,
        counselor_id=current_user.id  # Track who updated this
    )
    
    # Log the update
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_counseling",
        resource_id=updated_counseling.id,
        before=existing_counseling,
        after=updated_counseling
    )
    
    return updated_counseling


@router.delete(
    "/candidates/{public_id}/counseling",
    status_code=status.HTTP_204_NO_CONTENT
)
@rate_limit_medium()
async def delete_candidate_counseling(
    request: Request,
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete candidate counseling record (Admin only)
    """
    service = CandidateCounselingService(db)
    # Get counseling info before deleting
    counseling = await service.get_counseling(public_id)
    
    await service.delete_counseling(public_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="candidate_counseling",
        resource_id=counseling.id
    )
    
    return None
