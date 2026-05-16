"""Training Attendance Endpoints"""

from typing import List
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.schemas.training_attendance import TrainingAttendanceCreate, TrainingAttendanceResponse, TrainingAttendanceUpdate
from app.services.training_extension_service import TrainingExtensionService
from app.utils.activity_tracker import log_update

router = APIRouter(prefix="/attendance", tags=["Training Attendance"])


@router.post("/bulk", response_model=List[TrainingAttendanceResponse])
async def update_bulk_attendance(
    request: Request,
    attendance_in: List[TrainingAttendanceCreate],
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update bulk attendance for a training batch.
    Supports period-based attendance tracking.
    """
    service = TrainingExtensionService(db)
    
    # We might want to log before/after for bulk, but it's complex. 
    # For now, logging that an update happened.
    records = await service.update_bulk_attendance(attendance_in)
    
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_attendance",
        resource_id=0, # Bulk updated
        before={"action": "bulk_update_start"},
        after={"count": len(records)}
    )
    
    return records


@router.get("/{batch_id}", response_model=List[TrainingAttendanceResponse])
async def get_attendance(
    batch_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance for a specific training batch.
    """
    service = TrainingExtensionService(db)
    return await service.get_attendance(batch_id)


@router.get("/{batch_id}/date/{attendance_date}", response_model=List[TrainingAttendanceResponse])
async def get_attendance_by_date(
    batch_id: int,
    attendance_date: date,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get attendance records for a specific batch and date.
    Useful for period-based attendance tracking.
    """
    service = TrainingExtensionService(db)
    return await service.get_attendance_by_date(batch_id, attendance_date)


@router.get("/candidate/{public_id}", response_model=List[TrainingAttendanceResponse])
async def get_candidate_attendance(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all attendance records for a specific candidate across all batches.
    """
    service = TrainingExtensionService(db)
    return await service.get_attendance_by_candidate(public_id)


@router.put("/{attendance_id}", response_model=TrainingAttendanceResponse)
async def update_attendance(
    attendance_id: int,
    request: Request,
    attendance_in: TrainingAttendanceUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a single attendance record.
    """
    service = TrainingExtensionService(db)
    
    # Get before state for logging
    before = await service.attendance_repo.get(attendance_id)
    if not before:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    before_data = {
        "status": before.status,
        "remarks": before.remarks,
        "trainer_notes": before.trainer_notes
    }
    
    record = await service.update_attendance(attendance_id, attendance_in)
    
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_attendance",
        resource_id=attendance_id,
        before=before_data,
        after=attendance_in.model_dump(exclude_unset=True)
    )
    
    return record


@router.delete("/{attendance_id}")
async def delete_attendance(
    attendance_id: int,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a single attendance record.
    """
    service = TrainingExtensionService(db)
    
    # Get before state for logging
    before = await service.attendance_repo.get(attendance_id)
    if not before:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    success = await service.delete_attendance(attendance_id)
    
    if success:
        await log_update(
            db=db,
            request=request,
            user_id=current_user.id,
            resource_type="training_attendance",
            resource_id=attendance_id,
            before={"is_deleted": False},
            after={"is_deleted": True}
        )
        return {"message": "Attendance record deleted successfully"}
    
    from fastapi import HTTPException
    raise HTTPException(status_code=400, detail="Failed to delete attendance record")


@router.delete("/candidate/{candidate_id}/batch/{batch_id}")
async def delete_attendance_by_candidate(
    candidate_id: int,
    batch_id: int,
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Bulk soft-delete ALL attendance records for a specific candidate in a batch.
    Admin only. Used to correct erroneous batch allocations.
    """
    service = TrainingExtensionService(db)

    deleted_count = await service.delete_attendance_by_candidate(candidate_id, batch_id)

    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="training_attendance",
        resource_id=candidate_id,
        before={"action": "bulk_delete_candidate_attendance", "batch_id": batch_id},
        after={"deleted_count": deleted_count, "candidate_id": candidate_id}
    )

    return {
        "message": f"Successfully deleted {deleted_count} attendance record(s) for candidate",
        "deleted_count": deleted_count,
        "candidate_id": candidate_id,
        "batch_id": batch_id
    }
