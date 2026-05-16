"""DSR Leave Application API Endpoints"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.dsr_leave_application import DSRLeaveStatus
from app.models.user import User, UserRole
from app.schemas.dsr_leave_application import (
    DSRLeaveApplicationCreate,
    DSRLeaveApplicationRead,
    DSRLeaveApplicationUpdate,
    DSRLeaveApplicationList,
    DSRLeaveStats,
)
from app.services.dsr_leave_service import DSRLeaveService

router = APIRouter()


@router.post("/", response_model=DSRLeaveApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_leave(
    data: DSRLeaveApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apply for multi-day leave."""
    service = DSRLeaveService(db)
    leave = await service.create_leave_application(data, current_user)
    await db.commit()
    await db.refresh(leave)
    return leave


@router.get("/my", response_model=DSRLeaveApplicationList)
async def list_my_leaves(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1),
    status: Optional[DSRLeaveStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User: List own leave applications."""
    service = DSRLeaveService(db)
    items, total = await service.get_my_leaves(current_user, skip=skip, limit=limit, status=status)
    return DSRLeaveApplicationList(items=items, total=total)


@router.get("/stats", response_model=DSRLeaveStats)
async def get_leave_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User: Get personal leave statistics."""
    service = DSRLeaveService(db)
    return await service.get_leave_stats(current_user)


@router.get("/all", response_model=DSRLeaveApplicationList)
async def list_all_leaves(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    status: Optional[DSRLeaveStatus] = None,
    user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
):
    """Admin/Manager: List all leave applications across the team."""
    service = DSRLeaveService(db)
    items, total = await service.get_all_leaves(current_user, skip=skip, limit=limit, status=status, user_id=user_id)
    return DSRLeaveApplicationList(items=items, total=total)


@router.patch("/{public_id}", response_model=DSRLeaveApplicationRead)
async def handle_leave_request(
    public_id: UUID,
    data: DSRLeaveApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
):
    """Admin/Manager: Approve or Reject a leave application."""
    service = DSRLeaveService(db)
    leave = await service.handle_leave_application(public_id, data, current_user)
    await db.commit()
    await db.refresh(leave)
    return leave


@router.post("/{public_id}/cancel", response_model=DSRLeaveApplicationRead)
async def cancel_leave(
    public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User/Admin: Cancel a leave application."""
    service = DSRLeaveService(db)
    leave = await service.cancel_leave_application(public_id, current_user)
    await db.commit()
    await db.refresh(leave)
    return leave
