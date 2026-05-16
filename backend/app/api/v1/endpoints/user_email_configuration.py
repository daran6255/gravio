from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user_email_configuration import (
    UserEmailConfigurationCreate, 
    UserEmailConfigurationResponse,
    EmailTestRequest
)
from app.services.user_email_configuration_service import UserEmailConfigurationService

router = APIRouter(prefix="/user-email-config", tags=["User Email Configuration"])


@router.get("/me", response_model=UserEmailConfigurationResponse)
async def get_my_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get current user's email configuration.
    """
    service = UserEmailConfigurationService(db)
    config = await service.get_config(current_user.id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email configuration not found for current user"
        )
    return config


@router.post("", response_model=UserEmailConfigurationResponse)
async def save_config(
    config_in: UserEmailConfigurationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create or update current user's email configuration.
    """
    service = UserEmailConfigurationService(db)
    return await service.create_or_update_config(current_user.id, config_in)


@router.post("/test")
async def test_config(
    config_in: EmailTestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Test email connection with provided settings.
    """
    service = UserEmailConfigurationService(db)
    success, message = await service.test_connection(config_in)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    return {"status": "success", "message": message}


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete current user's email configuration.
    """
    service = UserEmailConfigurationService(db)
    success = await service.delete_config(current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email configuration not found or already deleted"
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
