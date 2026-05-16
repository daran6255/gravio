from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.services.maintenance_service import MaintenanceService

router = APIRouter()

@router.post("/dsr/clear-data", status_code=status.HTTP_200_OK)
async def clear_dsr_data(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Clear all DSR-related data (Projects, Activities, Entries, Requests).
    ADMIN ONLY. Permanent and destructive.
    """
    service = MaintenanceService(db)
    return await service.clear_dsr_data(current_user)
