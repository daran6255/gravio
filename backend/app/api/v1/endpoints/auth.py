"""Authentication endpoints"""

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token, verify_token_type
from app.core.rate_limiter import rate_limit_auth, rate_limit_high
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest, RefreshTokenRequest
from app.services.user_service import UserService
from app.utils.activity_tracker import log_create, log_login
from loguru import logger
from app.api.deps import get_current_user
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@rate_limit_auth()
async def register(
    request: Request,
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user
    
    - **email**: Valid email address
    - **username**: Unique username (3-100 characters)
    - **password**: Strong password (min 8 characters, must contain uppercase, lowercase, and digit)
    - **full_name**: Optional full name
    """
    logger.info(f"New user registration attempt: {user_in.email}")
    
    user_service = UserService(db)
    user = await user_service.create_user(user_in)
    
    # Log user creation
    await log_create(
        db=db,
        request=request,
        user_id=user.id,
        resource_type="user",
        resource_id=user.id,
        created_object=user,
        status_code=201,
    )
    
    logger.info(f"User registered successfully: {user.email}")
    return user


@router.post("/login", response_model=Token)
@rate_limit_auth()
async def login(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password
    
    Returns access and refresh tokens
    """
    logger.info(f"Login attempt for: {login_data.email}")
    
    user_service = UserService(db)
    user = await user_service.authenticate(login_data.email, login_data.password)
    
    if not user:
        logger.warning(f"Failed login attempt for: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )
    
    # Log successful login
    await log_login(
        db=db,
        request=request,
        user_id=user.id,
    )
    
    logger.info(f"User logged in successfully: {user.email}")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
@rate_limit_auth()
async def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    Returns new access and refresh tokens
    """
    payload = decode_token(refresh_data.refresh_token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_token_type(payload, "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Verify user still exists and is active
    user_service = UserService(db)
    user = await user_service.get_user(int(user_id))
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Create new tokens
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )
    
    logger.info(f"Token refreshed for user: {user.email}")
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

