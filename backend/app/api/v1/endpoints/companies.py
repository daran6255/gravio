"""Company Endpoints"""

from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User, UserRole
from app.models.company import CompanyStatus
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyRead, CompanyStats, CompanyListResponse, CompanyDetailRead
from app.services.company_service import CompanyService

router = APIRouter()


@router.get("/", response_model=CompanyListResponse)
async def get_companies(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[CompanyStatus] = None,
    industry: Optional[str] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: str = "desc"
) -> Any:
    """Get all companies with pagination and filters"""
    service = CompanyService(db)
    items, total = await service.get_companies(
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        industry=industry,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {"items": items, "total": total}


@router.post("/", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_in: CompanyCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Create a new company"""
    service = CompanyService(db)
    return await service.create_company(company_in, current_user.id)


@router.get("/stats", response_model=CompanyStats)
async def get_company_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get company statistics"""
    service = CompanyService(db)
    return await service.get_stats()


@router.get("/{public_id}", response_model=CompanyDetailRead)
async def get_company(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get company by public_id"""
    service = CompanyService(db)
    return await service.get_company(public_id, with_details=True)


@router.put("/{public_id}", response_model=CompanyRead)
async def update_company(
    public_id: UUID,
    company_in: CompanyUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Update company info"""
    service = CompanyService(db)
    return await service.update_company(public_id, company_in, current_user.id)


@router.delete("/{public_id}")
async def delete_company(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles([UserRole.ADMIN]))
) -> Any:
    """Delete company (Admin only)"""
    service = CompanyService(db)
    await service.delete_company(public_id, current_user.id)
    return {"message": "Company deleted successfully"}
