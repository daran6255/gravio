from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.placement_interview import (
    PlacementInterviewResponse, 
    PlacementInterviewCreate, 
    PlacementInterviewUpdate
)
from app.services.placement_interview_service import PlacementInterviewService

router = APIRouter()


@router.post("/", response_model=PlacementInterviewResponse)
async def schedule_interview(
    interview_in: PlacementInterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Schedule a new interview round for a placement mapping.
    """
    service = PlacementInterviewService(db)
    interview_in.scheduled_by_id = current_user.id
    return await service.schedule(interview_in)


@router.get("/{id}", response_model=PlacementInterviewResponse)
async def get_interview(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific interview round.
    """
    service = PlacementInterviewService(db)
    interview = await service.repository.get(id)
    if not interview or interview.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return interview


@router.patch("/{id}", response_model=PlacementInterviewResponse)
async def update_interview(
    id: int,
    interview_in: PlacementInterviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update details of a specific interview round.
    """
    service = PlacementInterviewService(db)
    updated_interview = await service.update(id, interview_in)
    if not updated_interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview not found"
        )
    return updated_interview


@router.get("/mapping/{mapping_id}", response_model=List[PlacementInterviewResponse])
async def get_mapping_interviews(
    mapping_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all interview rounds for a specific placement mapping.
    """
    service = PlacementInterviewService(db)
    return await service.get_by_mapping(mapping_id)


@router.get("/candidate/{candidate_id}", response_model=List[PlacementInterviewResponse])
async def get_candidate_interviews(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all interviews scheduled for a specific candidate across all job roles.
    """
    service = PlacementInterviewService(db)
    return await service.get_by_candidate(candidate_id)
