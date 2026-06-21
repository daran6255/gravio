"""Self-service onboarding endpoint — register a new organization and its admin"""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limiter import limiter
from app.schemas.onboarding import OnboardRequest, OnboardResponse
from app.services.onboarding import onboard_organization

router = APIRouter(prefix="/onboard", tags=["Onboarding"])


@router.post(
    "",
    response_model=OnboardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new organization",
    description=(
        "Self-service endpoint that atomically creates a new tenant organization "
        "and its first administrator account. A verification email is dispatched "
        "automatically — the admin must verify their email before they can log in."
    ),
)
@limiter.limit("3/minute")
async def register_organization(
    request: Request,  # required by slowapi for IP extraction
    payload: OnboardRequest,
    db: AsyncSession = Depends(get_db),
) -> OnboardResponse:
    """Self-onboard a new tenant organization with an admin user account."""
    return await onboard_organization(db, payload)


@router.get("/check-org", summary="Verify organization name availability")
async def check_org(name: str, db: AsyncSession = Depends(get_db)):
    """Check if organization name is available, including fuzzy matching."""
    from app.services.onboarding_checks import check_org_name_availability
    return await check_org_name_availability(db, name)


@router.get("/check-username", summary="Verify username availability")
async def check_username_endpoint(username: str, db: AsyncSession = Depends(get_db)):
    """Check if username is available and matches regex constraints."""
    from app.services.onboarding_checks import check_username_availability
    return await check_username_availability(db, username)


@router.get("/check-email", summary="Verify email availability")
async def check_email_endpoint(email: str, db: AsyncSession = Depends(get_db)):
    """Check if email is available and not already used."""
    from app.services.onboarding_checks import check_email_availability
    return await check_email_availability(db, email)

