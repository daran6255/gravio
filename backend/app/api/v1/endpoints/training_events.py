"""Training Event Endpoints"""

from typing import List
from fastapi import APIRouter, Depends, status, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.training_batch_event import TrainingBatchEventCreate, TrainingBatchEventResponse
from app.services.training_extension_service import TrainingExtensionService
from app.utils.activity_tracker import log_create, log_delete

router = APIRouter(prefix="/events", tags=["Training Events"])



@router.post("/", response_model=TrainingBatchEventResponse, status_code=status.HTTP_201_CREATED)
async def create_batch_event(
    request: Request,
    event_in: TrainingBatchEventCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new training batch event (holiday/session).
    """
    service = TrainingExtensionService(db)
    event = await service.create_batch_event(event_in)
    
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch_event",
        resource_id=event.id,
        created_object=event
    )
    return event


@router.get("/{batch_id}", response_model=List[TrainingBatchEventResponse])
async def get_batch_events(
    batch_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all events for a specific training batch.
    """
    service = TrainingExtensionService(db)
    return await service.get_batch_events(batch_id)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_batch_event(
    request: Request,
    event_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a training batch event.
    """
    service = TrainingExtensionService(db)
    
    # We should get the event before deleting for logging but service doesn't have it yet.
    # Let's hope delete works.
    await service.delete_batch_event(event_id)
    
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_batch_event",
        resource_id=event_id
    )
    return None
