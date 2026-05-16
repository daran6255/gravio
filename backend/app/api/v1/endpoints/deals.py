"""Deal Endpoints"""

from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User, UserRole
from app.models.deal import DealStage, DealType
from app.schemas.deal import DealCreate, DealUpdate, DealRead, DealListResponse
from app.services.deal_service import DealService

router = APIRouter()

@router.get("/", response_model=DealListResponse)
async def get_deals(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    stage: Optional[DealStage] = None,
    deal_type: Optional[DealType] = None,
    assigned_to: Optional[int] = None,
    company_id: Optional[int] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: str = "desc"
) -> Any:
    """Get all deals with pagination and filters"""
    service = DealService(db)
    items, total = await service.get_deals(
        skip=skip,
        limit=limit,
        search=search,
        stage=stage,
        deal_type=deal_type,
        assigned_to=assigned_to,
        company_id=company_id,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {"items": items, "total": total}


@router.post("/", response_model=DealRead, status_code=status.HTTP_201_CREATED)
async def create_deal(
    deal_in: DealCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles([UserRole.MANAGER, UserRole.ADMIN, UserRole.PROJECT_COORDINATOR]))
) -> Any:
    """Create a new deal"""
    service = DealService(db)
    return await service.create_deal(deal_in, current_user.id)


@router.get("/pipeline", response_model=dict)
async def get_pipeline_summary(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    own_only: bool = Query(False)
) -> Any:
    """Get pipeline summary"""
    service = DealService(db)
    user_id = current_user.id if own_only else None
    return await service.get_pipeline_summary(user_id)


@router.get("/{public_id}", response_model=DealRead)
async def get_deal(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get deal by public_id"""
    service = DealService(db)
    return await service.get_deal(public_id, with_details=True)


@router.put("/{public_id}", response_model=DealRead)
async def update_deal(
    public_id: UUID,
    deal_in: DealUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Update deal info"""
    service = DealService(db)
    return await service.update_deal(public_id, deal_in, current_user.id)


@router.delete("/{public_id}")
async def delete_deal(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles([UserRole.ADMIN]))
) -> Any:
    """Delete deal"""
    service = DealService(db)
    await service.delete_deal(public_id, current_user.id)
    return {"message": "Deal deleted successfully"}
