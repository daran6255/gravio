"""User repository — raw database queries for the User model"""

import uuid
from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User, UserRole


class UserRepository:
    """Data access layer for User records.

    All methods are static — call them directly without instantiation:
        user = await UserRepository.get_by_email(db, "admin@example.com")
    """

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        """Return a user by internal primary key."""
        return await db.get(User, user_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[User]:
        """Return a user by public UUID."""
        result = await db.execute(
            select(User).where(User.public_id == public_id)
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Return a user by email address."""
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """Return a user by username."""
        result = await db.execute(
            select(User).where(User.username == username)
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_email_or_username(db: AsyncSession, identifier: str) -> Optional[User]:
        """Return a user matching either the given email address or username.

        Used during login where the caller may supply either credential.
        """
        result = await db.execute(
            select(User).where(
                (User.email == identifier) | (User.username == identifier)
            )
        )
        return result.scalars().first()

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        email: str,
        username: str,
        full_name: str,
        hashed_password: str,
        organization_id: int,
        role: UserRole = UserRole.ADMIN,
        is_superuser: bool = False,
        others: Optional[dict[str, Any]] = None,
    ) -> User:
        """Insert a new user and flush to populate its auto-incremented ID.

        - is_active is set to True (they can try to log in after verification)
        - is_verified is set to False (blocks login until email link is clicked)

        Does NOT commit — the calling service owns the transaction boundary.
        """
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=hashed_password,
            organization_id=organization_id,
            role=role,
            is_superuser=is_superuser,
            is_active=True,
            is_verified=False,  # must click verification email
            others=others or {},
        )
        db.add(user)
        await db.flush()  # populate user.id without committing
        return user

    @staticmethod
    async def mark_verified(db: AsyncSession, user_id: int) -> Optional[User]:
        """Set is_verified=True on the user record."""
        user = await UserRepository.get_by_id(db, user_id)
        if user:
            user.is_verified = True
            await db.flush()
        return user
