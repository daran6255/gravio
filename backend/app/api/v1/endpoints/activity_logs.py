"""Activity Logs endpoints"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limiter import rate_limit_medium
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.activity_log import ActionType
from app.schemas.activity_log import (
    ActivityLogFilter,
    PaginatedActivityLogsResponse,
)
from app.services.activity_log_service import ActivityLogService
from loguru import logger


router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])


@router.get("/", response_model=PaginatedActivityLogsResponse)
@rate_limit_medium()
async def get_all_activity_logs(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    action_type: Optional[ActionType] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    resource_id: Optional[int] = Query(None, description="Filter by resource ID"),
    method: Optional[str] = Query(None, description="Filter by HTTP method"),
    status_code: Optional[int] = Query(None, description="Filter by status code"),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all activity logs (Admin only)
    
    Supports filtering by:
    - user_id
    - action_type
    - resource_type
    - resource_id
    - method
    - status_code
    """
    logger.info(f"Admin {current_user.email} requesting activity logs")
    
    activity_service = ActivityLogService(db)
    filters = ActivityLogFilter(
        user_id=user_id,
        action_type=action_type,
        resource_type=resource_type,
        resource_id=resource_id,
        method=method,
        status_code=status_code,
    )
    
    return await activity_service.get_filtered_activities(
        filters=filters,
        page=page,
        page_size=page_size
    )


@router.get("/me", response_model=PaginatedActivityLogsResponse)
@rate_limit_medium()
async def get_my_activity_logs(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's activity logs
    """
    logger.info(f"User {current_user.email} requesting own activity logs")
    
    activity_service = ActivityLogService(db)
    return await activity_service.get_user_activities(
        user_id=current_user.id,
        page=page,
        page_size=page_size
    )
