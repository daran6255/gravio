"""Shared API dependencies"""

from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token, verify_token_type
from app.core.config import settings
from app.models.user import User
from app.repositories.user_repository import UserRepository


security = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(
    api_key_query: Optional[str] = Query(None, alias="api_key"),
    api_key_header: Optional[str] = Depends(api_key_header),
) -> str:
    """
    Verify the API key for analytics export.
    Checks api_key query parameter first, then X-API-Key header.
    """
    api_key = api_key_query or api_key_header
    if api_key is None or api_key != settings.ANALYTICS_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key",
        )
    return api_key


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    token_query: Optional[str] = Query(None, alias="token"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token.
    Checks Authorization header first, then 'token' query parameter.
    
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = None
    if credentials:
        token = credentials.credentials
    elif token_query:
        token = token_query
        
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_token_type(payload, "access"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_repo = UserRepository(db)
    user = await user_repo.get(int(user_id))
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user (alias for get_current_user)"""
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current superuser
    
    Raises:
        HTTPException: If user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user


def require_roles(allowed_roles: list):
    """
    Create a dependency that checks if user has one of the allowed roles
    
    Args:
        allowed_roles: List of UserRole enums that are allowed to access the endpoint
        
    Returns:
        Dependency function that returns the current user if they have an allowed role
        
    Raises:
        HTTPException: If user doesn't have one of the allowed roles
        
    Example:
        @router.get("/admin-only")
        async def admin_endpoint(
            current_user: User = Depends(require_roles([UserRole.ADMIN]))
        ):
            pass
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        from app.models.user import UserRole
        
        # Convert allowed_roles to list of strings for comparison
        allowed_role_values = [role.value if isinstance(role, UserRole) else role for role in allowed_roles]
        
        if current_user.role.value not in allowed_role_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_role_values)}"
            )
        return current_user
    
    return role_checker
