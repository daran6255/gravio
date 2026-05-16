"""Contact Endpoints"""

from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api import deps
from app.models.user import User, UserRole
from app.schemas.contact import ContactCreate, ContactUpdate, ContactRead, ContactListResponse
from app.services.contact_service import ContactService

router = APIRouter()


@router.get("/", response_model=ContactListResponse)
async def get_contacts(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    company_id: Optional[int] = None,
    is_decision_maker: Optional[bool] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: str = "desc"
) -> Any:
    """Get all contacts with pagination and filters"""
    service = ContactService(db)
    items, total = await service.get_contacts(
        skip=skip,
        limit=limit,
        search=search,
        company_id=company_id,
        is_decision_maker=is_decision_maker,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return {"items": items, "total": total}


@router.post("/", response_model=ContactRead, status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact_in: ContactCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Create a new contact"""
    service = ContactService(db)
    return await service.create_contact(contact_in, current_user.id)


@router.get("/{public_id}", response_model=ContactRead)
async def get_contact(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """Get contact by public_id"""
    service = ContactService(db)
    return await service.get_contact(public_id, with_company=True)


@router.put("/{public_id}", response_model=ContactRead)
async def update_contact(
    public_id: UUID,
    contact_in: ContactUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Update contact info"""
    service = ContactService(db)
    return await service.update_contact(public_id, contact_in, current_user.id)


@router.post("/{public_id}/set-primary", response_model=ContactRead)
async def set_primary_contact(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """Set contact as primary for its company"""
    service = ContactService(db)
    return await service.set_primary_contact(public_id, current_user.id)


@router.delete("/{public_id}")
async def delete_contact(
    public_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.require_roles([UserRole.ADMIN]))
) -> Any:
    """Delete contact"""
    service = ContactService(db)
    await service.delete_contact(public_id, current_user.id)
    return {"message": "Contact deleted successfully"}
