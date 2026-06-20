"""Database seeding script to initialize the primary superuser, organization, and pricing plans"""

import asyncio
import uuid
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, engine
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.plan import Plan, PlanTier, Module
from app.core.security import get_password_hash

# Tier -> modules unlocked + monthly AI action quota.
# See backend/documentation/PRICING_PLAN_BUSINESS_LOGIC.md for the business rationale.
PLAN_DEFINITIONS = {
    PlanTier.BASIC: {
        "name": "Basic",
        "enabled_modules": [
            Module.PROJECT_MANAGEMENT.value,
            Module.TIMESHEET_MANAGEMENT.value,
            Module.CRM_MANAGEMENT.value,
            Module.REPORTS_MANAGEMENT.value,
        ],
        "ai_monthly_limit": 100,
    },
    PlanTier.PRO: {
        "name": "Pro",
        "enabled_modules": [
            Module.PROJECT_MANAGEMENT.value,
            Module.TIMESHEET_MANAGEMENT.value,
            Module.CRM_MANAGEMENT.value,
            Module.REPORTS_MANAGEMENT.value,
            Module.CANDIDATE_MANAGEMENT.value,
            Module.PLACEMENT_MANAGEMENT.value,
        ],
        "ai_monthly_limit": 1000,
    },
    PlanTier.ENTERPRISE: {
        "name": "Enterprise",
        "enabled_modules": [m.value for m in Module],
        "ai_monthly_limit": 10000,
    },
}


async def seed_plans(session) -> None:
    """Ensure the Basic/Pro/Enterprise pricing plans exist and match PLAN_DEFINITIONS."""
    for tier, definition in PLAN_DEFINITIONS.items():
        result = await session.execute(select(Plan).where(Plan.tier == tier))
        plan = result.scalars().first()
        if not plan:
            plan = Plan(tier=tier, **definition)
            session.add(plan)
            print(f"Created plan: {definition['name']}")
        else:
            plan.name = definition["name"]
            plan.enabled_modules = definition["enabled_modules"]
            plan.ai_monthly_limit = definition["ai_monthly_limit"]
            print(f"Updated plan: {definition['name']}")


async def seed_db() -> None:
    """Seed the database with the primary super admin, organization, and pricing plans"""
    print("Connecting to database...")
    async with AsyncSessionLocal() as session:
        await seed_plans(session)

        # 1. Ensure the organization "Taydens" exists
        result_org = await session.execute(
            select(Organization).where(Organization.name == "Taydens")
        )
        org = result_org.scalars().first()
        if not org:
            org = Organization(
                name="Taydens",
                location="Chennai",
                public_id=uuid.uuid4(),
                is_active=True,
                others={}
            )
            session.add(org)
            await session.flush()  # flush to populate the autoincremented ID
            print(f"Created organization: {org.name} (ID: {org.id})")
        else:
            print(f"Organization '{org.name}' already exists (ID: {org.id}).")

        # 2. Check if the superuser 'dharanidaran' exists
        result_user = await session.execute(
            select(User).where(User.username == "dharanidaran")
        )
        user = result_user.scalars().first()
        
        hashed_pw = get_password_hash("Testpass@123")
        
        if not user:
            user = User(
                username="dharanidaran",
                email="dharanidaran.a@taydens.com",
                full_name="Dharanidaran Annadurai",
                hashed_password=hashed_pw,
                is_active=True,
                is_verified=True,
                is_superuser=True,
                role=UserRole.ADMIN,
                organization_id=org.id,
                public_id=uuid.uuid4(),
                others={}
            )
            session.add(user)
            print(f"Created superuser: {user.username} (email: {user.email})")
        else:
            # Update user info to match request
            user.email = "dharanidaran.a@taydens.com"
            user.full_name = "Dharanidaran Annadurai"
            user.hashed_password = hashed_pw
            user.is_superuser = True
            user.role = UserRole.ADMIN
            user.organization_id = org.id
            user.is_active = True
            user.is_verified = True
            print(f"Updated existing user '{user.username}' to match super admin specs.")

        # 3. Ensure no other users have superuser access
        result_other_superusers = await session.execute(
            select(User).where(User.is_superuser == True, User.username != "dharanidaran")
        )
        other_superusers = result_other_superusers.scalars().all()
        for other in other_superusers:
            other.is_superuser = False
            print(f"Declassified other superuser: {other.username}")

        await session.commit()
        print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_db())
