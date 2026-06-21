"""Admin endpoints — operations restricted to Gravit Super Admins"""

import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_superuser
from app.models.user import User
from app.repositories.organization import OrganizationRepository
from app.repositories.user import UserRepository
from app.schemas.admin import (
    CreateOrganizationRequest,
    CreateOrganizationResponse,
    OrganizationListItem,
    TrialExtensionRequest,
    TrialExtensionResponse,
    AdminStatsResponse,
)
from app.schemas.common import PaginatedResponse
from app.schemas.onboarding import OrgPublic, UserPublic
from app.schemas.user_management import UserListItem
from app.services.admin import create_organization, list_organizations, get_admin_stats
from app.middleware.exceptions import NotFoundError

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Flow B: Create Organization ─────────────────────────────────────────────────

@router.post(
    "/organizations",
    response_model=CreateOrganizationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Provision a new organization + admin (Super Admin)",
    description=(
        "Creates a new tenant organization with a 30-day trial and an invite-based "
        "admin user — no password is collected here, the admin sets one via "
        "POST /auth/accept-invite from the emailed invite link."
    ),
)
async def create_organization_endpoint(
    payload: CreateOrganizationRequest,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> CreateOrganizationResponse:
    org, admin_user = await create_organization(db, payload)
    return CreateOrganizationResponse(
        message=f"Organization '{org.name}' has been created. An invite has been emailed to its admin.",
        organization=OrgPublic.model_validate(org),
        admin_user=UserPublic.model_validate(admin_user),
    )


@router.get(
    "/organizations",
    response_model=PaginatedResponse[OrganizationListItem],
    summary="List organizations (Super Admin)",
)
async def list_organizations_endpoint(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, description="Case-insensitive substring match on org name"),
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[OrganizationListItem]:
    items, total = await list_organizations(db, page=page, page_size=page_size, search=search)
    
    response_items = []
    for o in items:
        user_count = len(o.users) if o.users else 0
        plan_name = o.plan.name if o.plan else "Free"
        user_limit = o.plan.user_limit if o.plan else 10
        response_items.append(
            OrganizationListItem(
                public_id=o.public_id,
                name=o.name,
                location=o.location,
                is_active=o.is_active,
                subscription_status=o.subscription_status,
                trial_expires_at=o.trial_expires_at,
                plan_id=o.plan_id,
                user_count=user_count,
                user_limit=user_limit,
                plan_name=plan_name,
            )
        )

    return PaginatedResponse[OrganizationListItem](
        items=response_items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/organizations/{public_id}/deactivate",
    response_model=OrganizationListItem,
    summary="Deactivate an organization (Super Admin)",
)
async def deactivate_organization_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> OrganizationListItem:
    org = await OrganizationRepository.get_by_public_id(db, public_id)
    if not org:
        raise NotFoundError(f"Organization with ID '{public_id}' not found.")
    updated = await OrganizationRepository.set_active(db, org.id, active=False)
    await db.commit()
    await db.refresh(updated)
    return OrganizationListItem.model_validate(updated)


@router.post(
    "/organizations/{public_id}/reactivate",
    response_model=OrganizationListItem,
    summary="Reactivate an organization (Super Admin)",
)
async def reactivate_organization_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> OrganizationListItem:
    org = await OrganizationRepository.get_by_public_id(db, public_id)
    if not org:
        raise NotFoundError(f"Organization with ID '{public_id}' not found.")
    updated = await OrganizationRepository.set_active(db, org.id, active=True)
    await db.commit()
    await db.refresh(updated)
    return OrganizationListItem.model_validate(updated)


@router.post(
    "/organizations/{public_id}/extend-trial",
    response_model=TrialExtensionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extend organization free trial",
    description="Allows a Super Admin to extend an organization's free trial by a specified number of days.",
)
async def extend_organization_trial(
    public_id: uuid.UUID,
    payload: TrialExtensionRequest,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> TrialExtensionResponse:
    """Extend the trial period for an organization."""
    # Find organization by public_id
    org = await OrganizationRepository.get_by_public_id(db, public_id)
    if not org:
        raise NotFoundError(f"Organization with ID '{public_id}' not found.")

    # Extend trial
    updated_org = await OrganizationRepository.extend_trial(
        db,
        org.id,
        extend_days=payload.extend_days,
    )
    
    # Commit changes
    await db.commit()
    await db.refresh(updated_org)

    return TrialExtensionResponse.model_validate(updated_org)


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get platform metrics (Super Admin)",
)
async def get_platform_stats(
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> AdminStatsResponse:
    stats = await get_admin_stats(db)
    return AdminStatsResponse(**stats)


@router.get(
    "/organizations/{public_id}/users",
    response_model=PaginatedResponse[UserListItem],
    summary="List users of a specific organization (Super Admin)",
)
async def list_organization_users_endpoint(
    public_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[UserListItem]:
    org = await OrganizationRepository.get_by_public_id(db, public_id)
    if not org:
        raise NotFoundError(f"Organization with ID '{public_id}' not found.")

    items, total = await UserRepository.list_by_organization(
        db, org.id, page=page, page_size=page_size
    )

    return PaginatedResponse[UserListItem](
        items=[UserListItem.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
    )
