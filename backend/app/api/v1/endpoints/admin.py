"""Admin endpoints — operations restricted to Gravit Super Admins"""

import uuid
from fastapi import APIRouter, Depends, Query, Request, status
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
    SystemMetric,
    SystemHealthResponse,
)
from app.schemas.common import PaginatedResponse
from app.schemas.onboarding import OrgPublic, UserPublic
from app.schemas.user_management import UserListItem
from app.ai.schemas.ai_credit import AICreditBalanceResponse, AICreditGrantRequest
from app.services.admin import create_organization, list_organizations, get_admin_stats, delete_organization
from app.services import ai_credit_service
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
    account_type: str | None = Query(None, description="Filter by 'organization' or 'individual'"),
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[OrganizationListItem]:
    items, total = await list_organizations(
        db, page=page, page_size=page_size, search=search, account_type=account_type
    )

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
                account_type=(o.others or {}).get("account_type", "organization"),
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
    "/system-health",
    response_model=SystemHealthResponse,
    summary="Live infrastructure health for the Super Admin dashboard",
    description=(
        "Real (not mocked) status for the services the platform depends on: "
        "database connectivity + latency, whether outgoing email is configured, "
        "and whether the in-process background schedulers (memory monitor, CRM "
        "reminder checker) are still alive."
    ),
)
async def get_system_health(
    request: Request,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> SystemHealthResponse:
    import time
    from sqlalchemy import text
    from app.core.config import settings

    metrics: list[SystemMetric] = []
    overall = "healthy"

    # 1. Database — actually round-trip a query and time it.
    start = time.perf_counter()
    try:
        await db.execute(text("SELECT 1"))
        elapsed_ms = (time.perf_counter() - start) * 1000
        metrics.append(SystemMetric(
            name="Database",
            status="operational",
            responseTime=round(elapsed_ms, 1),
            detail=f"{round(elapsed_ms, 1)}ms round-trip",
        ))
    except Exception as e:
        overall = "critical"
        metrics.append(SystemMetric(name="Database", status="down", detail=str(e)))

    # 2. Outgoing email — configuration presence, not a live SMTP handshake
    # (opening a real connection on every dashboard load isn't worth the latency).
    if settings.SMTP_HOST and settings.SMTP_PORT:
        metrics.append(SystemMetric(
            name="Outgoing Email",
            status="operational",
            detail=f"Configured ({settings.SMTP_HOST}:{settings.SMTP_PORT})",
        ))
    else:
        overall = "degraded" if overall == "healthy" else overall
        metrics.append(SystemMetric(
            name="Outgoing Email",
            status="degraded",
            detail="SMTP not configured — verification/invite emails will not send",
        ))

    # 3. Background schedulers — are the asyncio tasks started at startup still alive?
    monitor_task = getattr(request.app.state, "monitor_task", None)
    reminder_task = getattr(request.app.state, "reminder_task", None)
    schedulers_alive = bool(
        monitor_task and not monitor_task.done() and reminder_task and not reminder_task.done()
    )
    if schedulers_alive:
        metrics.append(SystemMetric(
            name="Background Schedulers",
            status="operational",
            detail="Memory monitor + CRM reminder checker running",
        ))
    else:
        overall = "degraded" if overall == "healthy" else overall
        metrics.append(SystemMetric(
            name="Background Schedulers",
            status="degraded",
            detail="One or more background tasks have stopped — reminders/memory monitoring may be paused",
        ))

    return SystemHealthResponse(
        status=overall,
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
        metrics=metrics,
    )


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


@router.delete(
    "/organizations/{public_id}",
    response_model=OrgPublic,
    summary="Permanently delete an organization and all its data (Super Admin only)",
)
async def delete_organization_endpoint(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> OrgPublic:
    org = await delete_organization(db, public_id=public_id)
    return org


@router.post(
    "/users/{public_id}/credits/grant",
    response_model=AICreditBalanceResponse,
    summary="Grant a user extra AI credits (Super Admin)",
    description=(
        "Adds credits directly to one user's own wallet -- credits are per-user, not pooled "
        "per org (see AICreditWallet), so this targets a specific person, not their whole "
        "organization."
    ),
)
async def grant_user_credits_endpoint(
    public_id: uuid.UUID,
    payload: AICreditGrantRequest,
    current_user: User = Depends(get_current_superuser),
    db: AsyncSession = Depends(get_db),
) -> AICreditBalanceResponse:
    from app.models.organization import Organization
    from app.models.ai_credit import AICreditTransactionReason
    from app.repositories.ai_credit import AICreditRepository

    target_user = await UserRepository.get_by_public_id(db, public_id)
    if not target_user:
        raise NotFoundError(f"User with ID '{public_id}' not found.")
    if target_user.organization_id is None:
        raise NotFoundError("This user is not associated with an organization.")

    org = await db.get(Organization, target_user.organization_id)
    if org is None:
        raise NotFoundError("Organization not found.")

    wallet = await ai_credit_service.get_or_create_wallet_for_user(db, org, target_user.id)
    await AICreditRepository.grant_bonus_credits(
        db, wallet, amount=payload.amount, user_id=target_user.id,
        reason=AICreditTransactionReason.ADMIN_ADJUSTMENT,
    )
    await db.commit()
    return AICreditBalanceResponse.from_wallet(wallet)
