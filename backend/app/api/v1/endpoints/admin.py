"""Admin endpoints — operations restricted to Gravit Super Admins"""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_superuser
from app.models.user import User
from app.repositories.organization import OrganizationRepository
from app.schemas.admin import TrialExtensionRequest, TrialExtensionResponse
from app.middleware.exceptions import NotFoundError

router = APIRouter(prefix="/admin", tags=["Admin"])


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
