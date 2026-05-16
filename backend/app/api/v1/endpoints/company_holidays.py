"""Company Holidays API endpoints"""

from datetime import date
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.schemas.company_holiday import (
    CompanyHolidayCreate,
    CompanyHolidayUpdate,
    CompanyHolidayResponse,
    CompanyHolidayListResponse,
)
from app.services.company_holiday_service import CompanyHolidayService

router = APIRouter()


@router.get("/", response_model=CompanyHolidayListResponse)
async def get_holidays(
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all company holidays"""
    service = CompanyHolidayService(db)
    items, total = await service.get_holidays(skip=skip, limit=limit, date_from=date_from, date_to=date_to)
    return {"items": items, "total": total}


@router.post("/", response_model=CompanyHolidayResponse)
async def create_holiday(
    data: CompanyHolidayCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new holiday (Admin/Manager only)"""
    service = CompanyHolidayService(db)
    return await service.create_holiday(data, current_user)


@router.delete("/{public_id}")
async def delete_holiday(
    public_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a holiday (Admin/Manager only)"""
    service = CompanyHolidayService(db)
    success = await service.delete_holiday(public_id, current_user)
    return {"success": success}


@router.put("/{public_id}", response_model=CompanyHolidayResponse)
async def update_holiday(
    public_id: UUID,
    data: CompanyHolidayUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a holiday (Admin/Manager only)"""
    service = CompanyHolidayService(db)
    return await service.update_holiday(public_id, data, current_user)


@router.post("/import")
async def import_holidays(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Import holidays from CSV (Admin/Manager only). CSV format: date,name"""
    service = CompanyHolidayService(db)
    return await service.import_holidays_csv(file, current_user)
