"""User endpoints"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.rate_limiter import rate_limit_medium
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate, PaginationParams, UserCreate, PaginatedResponse
from app.services.user_service import UserService
from app.utils.activity_tracker import log_update, log_delete, log_create
from loguru import logger


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
@rate_limit_medium()
async def get_current_user_info(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information (Any authenticated user)
    """
    return current_user


@router.get("/roles", response_model=List[str])
async def get_roles(
    current_user: User = Depends(get_current_user)
):
    """
    Get all available user roles (Any authenticated user)
    """
    return [role.value for role in UserRole]


@router.put("/me", response_model=UserResponse)
@rate_limit_medium()
async def update_current_user(
    request: Request,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update current user information (Any authenticated user)
    """
    logger.info(f"User update request: {current_user.email}")
    
    # Store before state
    before_state = {
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "role": current_user.role.value,
    }
    
    user_service = UserService(db)
    updated_user = await user_service.update_user(current_user.id, user_in)
    
    # Log the update
    after_state = {
        "email": updated_user.email,
        "username": updated_user.username,
        "full_name": updated_user.full_name,
        "is_active": updated_user.is_active,
        "role": updated_user.role.value,
    }
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="user",
        resource_id=current_user.id,
        before=before_state,
        after=after_state,
    )
    
    logger.info(f"User updated successfully: {current_user.email}")
    return updated_user


@router.get("/stats")
@rate_limit_medium()
async def get_user_stats(
    request: Request,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user statistics (Admin or Manager only)
    
    Returns statistics about users including:
    - Total count
    - Count by role (admin, trainer, counselor, manager)
    - Active vs inactive count
    """
    logger.info(f"Fetching user stats by {current_user.role.value} {current_user.email}")
    
    user_service = UserService(db)
    
    # Get total count
    total = await user_service.repository.count()
    
    # Get active count
    from sqlalchemy import select, func
    active_query = select(func.count(User.id)).where(
        User.is_deleted == False,
        User.is_active == True
    )
    active_result = await db.execute(active_query)
    active = active_result.scalar() or 0
    
    # Get count by role
    role_query = select(User.role, func.count(User.id)).where(
        User.is_deleted == False
    ).group_by(User.role)
    role_result = await db.execute(role_query)
    role_counts = {role.value: count for role, count in role_result.all()}
    
    inactive = total - active
    
    return {
        "total": total,
        "by_role": role_counts,
        "active": active,
        "inactive": inactive,
        "roles_count": len(role_counts)
    }


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_medium()
async def create_user(
    request: Request,
    user_in: UserCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user (Admin only)
    """
    logger.info(f"Creating new user: {user_in.email} by admin {current_user.email}")
    
    user_service = UserService(db)
    user = await user_service.create_user(user_in)
    
    # Log the creation
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="user",
        resource_id=user.id,
        created_object=user,
    )
    
    logger.info(f"User created successfully: {user.id}")
    return user


@router.get("/", response_model=PaginatedResponse)
@rate_limit_medium()
async def get_users(
    request: Request,
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Maximum number of records to return"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    search: Optional[str] = Query(None, description="Search users by name, email, username, or phone"),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SOURCING, UserRole.TRAINER, UserRole.PLACEMENT, UserRole.COUNSELOR])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of users with pagination and search
    """
    logger.info(f"Fetching users list (skip={skip}, limit={limit}, role={role}, search={search}) by {current_user.role.value} {current_user.email}")
    
    user_service = UserService(db)
    users = await user_service.get_users(skip=skip, limit=limit, role=role.value if role else None, search=search)
    
    # Construct filter for total count
    filters = []
    if role:
        filters.append(User.role == role)
    if search:
        search_filter = (
            User.full_name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.username.ilike(f"%{search}%") |
            User.mobile.ilike(f"%{search}%")
        )
        filters.append(search_filter)
    
    filter_expr = None
    if filters:
        from sqlalchemy import and_
        filter_expr = and_(*filters)
    
    total = await user_service.repository.count(filter_expr=filter_expr)
    
    return PaginatedResponse(
        items=users,
        total=total,
        page=(skip // limit) + 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit
    )


@router.get("/search", response_model=PaginatedResponse)
@rate_limit_medium()
async def search_users(
    request: Request,
    q: str = Query(..., description="Search query string"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search users by name, email, or username (Alias for get_users)
    """
    user_service = UserService(db)
    users = await user_service.get_users(skip=skip, limit=limit, search=q)
    total = await user_service.repository.count(
        filter_expr=(
            User.full_name.ilike(f"%{q}%") | 
            User.email.ilike(f"%{q}%") | 
            User.username.ilike(f"%{q}%")
        )
    )
    return PaginatedResponse(
        items=users,
        total=total,
        page=(skip // limit) + 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit
    )


@router.get("/{user_id}", response_model=UserResponse)
@rate_limit_medium()
async def get_user(
    request: Request,
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user by ID (Admin or Manager only)
    """
    logger.info(f"Fetching user: {user_id} by {current_user.role.value} {current_user.email}")
    
    user_service = UserService(db)
    user = await user_service.get_user(user_id)
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
@rate_limit_medium()
async def update_user(
    request: Request,
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Update user by ID (Admin only)
    """
    logger.info(f"Updating user: {user_id} by admin {current_user.email}")
    
    user_service = UserService(db)
    
    # Get before state
    existing_user = await user_service.get_user(user_id)
    before_state = {
        "email": existing_user.email,
        "username": existing_user.username,
        "full_name": existing_user.full_name,
        "is_active": existing_user.is_active,
        "is_verified": existing_user.is_verified,
        "role": existing_user.role.value,
    }
    
    updated_user = await user_service.update_user(user_id, user_in)
    
    # Log the update
    after_state = {
        "email": updated_user.email,
        "username": updated_user.username,
        "full_name": updated_user.full_name,
        "is_active": updated_user.is_active,
        "is_verified": updated_user.is_verified,
        "role": updated_user.role.value,
    }
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="user",
        resource_id=user_id,
        before=before_state,
        after=after_state,
    )
    
    logger.info(f"User updated successfully: {user_id}")
    return updated_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@rate_limit_medium()
async def delete_user(
    request: Request,
    user_id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete user by ID (Admin only)
    
    Performs soft delete
    """
    logger.info(f"Deleting user: {user_id} by admin {current_user.email}")
    
    user_service = UserService(db)
    await user_service.delete_user(user_id)
    
    # Log the deletion
    await log_delete(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="user",
        resource_id=user_id,
    )
    
    logger.info(f"User deleted successfully: {user_id}")
    return None
