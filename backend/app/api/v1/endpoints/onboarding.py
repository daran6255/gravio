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
