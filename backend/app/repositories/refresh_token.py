"""RefreshToken repository — raw database queries for refresh token revocation/rotation"""

import datetime
from typing import Optional
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    """Data access layer for RefreshToken records.

    All methods are static — call them directly without instantiation:
        token = await RefreshTokenRepository.get_by_jti(db, jti)
    """

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        jti: str,
        user_id: int,
        expires_at: datetime.datetime,
    ) -> RefreshToken:
        """Record a newly issued refresh token. Does NOT commit."""
        token = RefreshToken(jti=jti, user_id=user_id, expires_at=expires_at)
        db.add(token)
        await db.flush()
        return token

    @staticmethod
    async def get_by_jti(db: AsyncSession, jti: str) -> Optional[RefreshToken]:
        """Return the tracked refresh token row by its jti, or None if never issued."""
        result = await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
        return result.scalars().first()

    @staticmethod
    async def revoke(
        db: AsyncSession,
        jti: str,
        *,
        replaced_by: Optional[str] = None,
    ) -> None:
        """Mark a single refresh token as revoked (used on logout or rotation)."""
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.jti == jti, RefreshToken.revoked_at.is_(None))
            .values(
                revoked_at=datetime.datetime.now(datetime.timezone.utc),
                replaced_by_jti=replaced_by,
            )
        )
        await db.flush()

    @staticmethod
    async def revoke_all_for_user(db: AsyncSession, user_id: int) -> None:
        """Revoke every active refresh token for a user.

        Used when reuse of an already-rotated token is detected — treats it as a
        possible theft signal and kills every session so the leaked token (and any
        token derived from it) stops working immediately.
        """
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.datetime.now(datetime.timezone.utc))
        )
        await db.flush()
