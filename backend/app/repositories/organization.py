"""Organization repository — raw database queries for the Organization model"""

import uuid
from datetime import datetime
from typing import Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.organization import Organization


class OrganizationRepository:
    """Data access layer for Organization records.

    All methods are static — call them directly without instantiation:
        org = await OrganizationRepository.get_by_name(db, "Taydens")
    """

    @staticmethod
    async def get_by_name(db: AsyncSession, name: str) -> Optional[Organization]:
        """Return an organization by its unique name, or None if not found."""
        result = await db.execute(
            select(Organization).where(Organization.name == name)
        )
        return result.scalars().first()

    @staticmethod
    async def get_by_id(db: AsyncSession, org_id: int) -> Optional[Organization]:
        """Return an organization by its internal primary key."""
        return await db.get(Organization, org_id)

    @staticmethod
    async def get_by_public_id(db: AsyncSession, public_id: uuid.UUID) -> Optional[Organization]:
        """Return an organization by its public UUID."""
        result = await db.execute(
            select(Organization).where(Organization.public_id == public_id)
        )
        return result.scalars().first()

    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        name: str,
        location: Optional[str] = None,
        subscription_status: str = "trial",
        trial_started_at: Optional[datetime] = None,
        trial_expires_at: Optional[datetime] = None,
        others: Optional[dict[str, Any]] = None,
    ) -> Organization:
        """Insert a new organization and flush to populate its auto-incremented ID.

        Does NOT commit — the calling service owns the transaction boundary.
        """
        from datetime import datetime, timezone, timedelta
        
        start_time = trial_started_at or datetime.now(timezone.utc)
        expires_time = trial_expires_at or (start_time + timedelta(days=30))
        
        org = Organization(
            name=name,
            location=location,
            subscription_status=subscription_status,
            trial_started_at=start_time,
            trial_expires_at=expires_time,
            is_active=True,
            others=others or {},
        )
        db.add(org)
        await db.flush()  # populate org.id without committing
        return org

    @staticmethod
    async def extend_trial(
        db: AsyncSession,
        org_id: int,
        *,
        extend_days: int,
    ) -> Optional[Organization]:
        """Extend organization trial period by specified number of days.
        Resets status to 'trial' if it was expired.
        """
        org = await OrganizationRepository.get_by_id(db, org_id)
        if org:
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc)
            
            trial_expires = org.trial_expires_at
            if trial_expires and trial_expires.tzinfo is None:
                trial_expires = trial_expires.replace(tzinfo=timezone.utc)

            # If expired or invalid dates, extend from current time.
            # Otherwise, extend from existing expiration date.
            if org.subscription_status == "expired" or not trial_expires or trial_expires < now:
                base_time = now
            else:
                base_time = trial_expires
                
            org.trial_expires_at = base_time + timedelta(days=extend_days)
            org.subscription_status = "trial"
            org.is_active = True
            await db.flush()
        return org

    @staticmethod
    async def set_active(db: AsyncSession, org_id: int, *, active: bool) -> Optional[Organization]:
        """Activate or deactivate an organization."""
        org = await OrganizationRepository.get_by_id(db, org_id)
        if org:
            org.is_active = active
            await db.flush()
        return org

    @staticmethod
    async def list_all(
        db: AsyncSession,
        *,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        account_type: Optional[str] = None,
    ) -> tuple[list[Organization], int]:
        """Return a page of organizations, plus the total count.

        Args:
            search: Optional case-insensitive substring match on organization name.
            account_type: Optional filter on others['account_type'] ('organization' or
                'individual'). Orgs with no account_type recorded are treated as 'organization'
                (pre-dates the individual-account feature / created directly by a Super Admin).
        """
        from sqlalchemy import func, or_
        from sqlalchemy.orm import selectinload

        conditions = []
        if search:
            conditions.append(Organization.name.ilike(f"%{search}%"))
        if account_type == "individual":
            conditions.append(Organization.others["account_type"].as_string() == "individual")
        elif account_type == "organization":
            conditions.append(
                or_(
                    Organization.others.is_(None),
                    Organization.others["account_type"].as_string().is_(None),
                    Organization.others["account_type"].as_string() != "individual",
                )
            )

        count_result = await db.execute(
            select(func.count()).select_from(Organization).where(*conditions)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(Organization)
            .options(selectinload(Organization.plan), selectinload(Organization.users))
            .where(*conditions)
            .order_by(Organization.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total
