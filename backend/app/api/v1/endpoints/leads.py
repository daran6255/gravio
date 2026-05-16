"""Lead Endpoints"""

from typing import Any, List, Optional, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.lead import LeadStatus, LeadSource
from app.models.user import User, UserRole
from app.schemas.lead import LeadCreate, LeadUpdate, LeadRead, LeadListResponse, LeadConversionResponse
from app.services.lead_service import LeadService

router = APIRouter()


@router.get("/", response_model=LeadListResponse)
async def get_leads(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[LeadStatus] = None,
    source: Optional[LeadSource] = None,
    assigned_to: Optional[int] = None,
    min_score: Optional[int] = None,
    max_score: Optional[int] = None,
    sort_by: Optional[str] = "lead_score",
    sort_order: str = "desc"
) -> Any:
    """Get all leads with pagination and filters"""
    service = LeadService(db)
    items, total = await service.get_leads(
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        source=source,
        assigned_to=assigned_to,
        min_score=min_score,
        max_score=max_score,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {"items": items, "total": total}


@router.post("/", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles([UserRole.MANAGER, UserRole.ADMIN, UserRole.PROJECT_COORDINATOR]))
) -> Any:
    """Create a new lead"""
    service = LeadService(db)
    return await service.create_lead(lead_in, current_user.id)


@router.get("/stats", response_model=dict)
async def get_lead_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    own_only: bool = Query(False)
) -> Any:
    """Get lead statistics"""
    service = LeadService(db)
    user_id = current_user.id if own_only else None
    return await service.get_stats(user_id)


@router.get("/{public_id}", response_model=LeadRead)
async def get_lead(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get lead by public_id"""
    service = LeadService(db)
    return await service.get_lead(public_id, with_details=True)


@router.put("/{public_id}", response_model=LeadRead)
async def update_lead(
    public_id: UUID,
    lead_in: LeadUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Update lead info"""
    service = LeadService(db)
    return await service.update_lead(public_id, lead_in, current_user.id)


@router.post("/{public_id}/convert", response_model=LeadConversionResponse)
async def convert_lead(
    public_id: UUID,
    deal_data: Dict[str, Any],
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Convert a lead to a deal"""
    service = LeadService(db)
    return await service.convert_to_deal(public_id, current_user.id, deal_data)


@router.delete("/{public_id}")
async def delete_lead(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles([UserRole.ADMIN]))
) -> Any:
    """Delete lead"""
    service = LeadService(db)
    await service.delete_lead(public_id, current_user.id)
    return {"message": "Lead deleted successfully"}
