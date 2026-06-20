"""Trial registry repository — raw database queries for the TrialEmailRegistry model"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.trial_registry import TrialEmailRegistry


class TrialRegistryRepository:
    """Data access layer for TrialEmailRegistry records."""

    @staticmethod
    async def exists_by_email(db: AsyncSession, email: str) -> bool:
        """Check if an email address (normalized to lowercase) is already registered for a trial."""
        normalized_email = email.strip().lower()
        result = await db.execute(
            select(TrialEmailRegistry).where(TrialEmailRegistry.email == normalized_email)
        )
        return result.scalars().first() is not None

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        email: str,
        organization_name: str,
    ) -> TrialEmailRegistry:
        """Insert a new trial registration record.
        
        Does NOT commit — the calling service owns the transaction boundary.
        """
        normalized_email = email.strip().lower()
        record = TrialEmailRegistry(
            email=normalized_email,
            organization_name=organization_name,
        )
        db.add(record)
        await db.flush()  # populate record.id
        return record
