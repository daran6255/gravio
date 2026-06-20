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

    @staticmethod
    async def activate_with_password(
        db: AsyncSession,
        user_id: int,
        *,
        hashed_password: str,
    ) -> Optional[User]:
        """Accept an invite: set the real password hash and mark the account verified.

        Does NOT commit — the calling service owns the transaction boundary.
        """
        user = await UserRepository.get_by_id(db, user_id)
        if user:
            user.hashed_password = hashed_password
            user.is_verified = True
            await db.flush()
        return user

    @staticmethod
    async def list_by_organization(
        db: AsyncSession,
        organization_id: int,
        *,
        page: int = 1,
        page_size: int = 20,
        include_inactive: bool = True,
    ) -> tuple[list[User], int]:
        """Return a page of users belonging to an organization, plus the total count.

        User does NOT inherit TenantAwareMixin, so the automatic tenant filter in
        app/core/database.py does not apply here — organization_id is filtered
        explicitly below.
        """
        from sqlalchemy import func

        conditions = [User.organization_id == organization_id]
        if not include_inactive:
            conditions.append(User.is_active.is_(True))

        count_result = await db.execute(
            select(func.count()).select_from(User).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(User)
            .where(*conditions)
            .order_by(User.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    @staticmethod
    async def set_active(db: AsyncSession, user_id: int, *, active: bool) -> Optional[User]:
        """Activate or deactivate a user. Mirrors OrganizationRepository.set_active."""
        user = await UserRepository.get_by_id(db, user_id)
        if user:
            user.is_active = active
            await db.flush()
        return user

    @staticmethod
    async def delete(db: AsyncSession, user: User) -> None:
        """Delete a user record from the database.

        Does NOT commit — the calling service owns the transaction boundary.
        """
        await db.delete(user)
        await db.flush()

