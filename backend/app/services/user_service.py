"""User service - business logic for user operations"""

from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.repositories.user_repository import UserRepository
from app.core.security import get_password_hash, verify_password


class UserService:
    """Service for user-related business logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = UserRepository(db)
    
    async def get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        user = await self.repository.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return await self.repository.get_by_email(email)
    
    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get user by username"""
        return await self.repository.get_by_username(username)
    
    async def get_users(
        self,
        skip: int = 0,
        limit: int = 100,
        role: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[User]:
        """Get list of users"""
        return await self.repository.get_multi(skip=skip, limit=limit, role=role, search=search)
    
    async def create_user(self, user_in: UserCreate) -> User:
        """Create a new user"""
        # Check if email already exists
        existing_user = await self.repository.get_by_email(user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_username = await self.repository.get_by_username(user_in.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create user with hashed password
        user_data = user_in.model_dump(exclude={"password"})
        user_data["hashed_password"] = get_password_hash(user_in.password)
        
        user = await self.repository.create(user_data)
        return user
    
    async def update_user(
        self,
        user_id: int,
        user_in: UserUpdate
    ) -> User:
        """Update user"""
        # Check if user exists
        user = await self.repository.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare update data
        update_data = user_in.model_dump(exclude_unset=True)
        
        # Handle password update
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        # Check email uniqueness if being updated
        if "email" in update_data and update_data["email"] != user.email:
            existing_email = await self.repository.get_by_email(update_data["email"])
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Check username uniqueness if being updated
        if "username" in update_data and update_data["username"] != user.username:
            existing_username = await self.repository.get_by_username(update_data["username"])
            if existing_username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        updated_user = await self.repository.update(user_id, update_data)
        return updated_user
    
    async def delete_user(self, user_id: int) -> bool:
        """Delete user (soft delete)"""
        user = await self.repository.get(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return await self.repository.delete(user_id, soft=True)
    
    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await self.repository.get_by_email(email)
        
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        return user

    async def search_users(self, query: str = None, role: str = None, limit: int = 10) -> List[User]:
        """Search users by name, email or username"""
        return await self.repository.search_users(query=query, role=role, limit=limit)
