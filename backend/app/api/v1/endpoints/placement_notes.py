from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.placement_note import (
    PlacementNoteResponse, 
    PlacementNoteCreate, 
    PlacementNoteUpdate
)
from app.services.placement_note_service import PlacementNoteService

router = APIRouter()


@router.post("/", response_model=PlacementNoteResponse)
async def add_placement_note(
    note_in: PlacementNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a new internal note to a placement mapping.
    """
    service = PlacementNoteService(db)
    note_in.created_by_id = current_user.id
    return await service.add_note(note_in)


@router.get("/{id}", response_model=PlacementNoteResponse)
async def get_note(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific placement note.
    """
    service = PlacementNoteService(db)
    note = await service.repository.get(id)
    if not note or note.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return note


@router.patch("/{id}", response_model=PlacementNoteResponse)
async def update_note(
    id: int,
    note_in: PlacementNoteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update details of a specific placement note (e.g., content or pinning status).
    """
    service = PlacementNoteService(db)
    updated_note = await service.update_note(id, note_in)
    if not updated_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return updated_note


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Soft delete a placement note.
    """
    service = PlacementNoteService(db)
    success = await service.delete_note(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    return None


@router.get("/mapping/{mapping_id}", response_model=List[PlacementNoteResponse])
async def get_mapping_notes(
    mapping_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all internal notes for a specific placement mapping.
    """
    service = PlacementNoteService(db)
    return await service.get_by_mapping(mapping_id)
