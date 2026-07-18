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
    PlanTier.FREE: {
        "name": "Free",
        "enabled_modules": [
            Module.PROJECT_MANAGEMENT.value,
        ],
        "ai_monthly_limit": 10,
        "user_limit": 10,
    },
    PlanTier.BASIC: {
        "name": "Basic",
        "enabled_modules": [
            Module.PROJECT_MANAGEMENT.value,
            Module.TIMESHEET_MANAGEMENT.value,
            Module.CRM_MANAGEMENT.value,
            Module.REPORTS_MANAGEMENT.value,
        ],
        "ai_monthly_limit": 100,
        "user_limit": 20,
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
        "user_limit": 50,
    },
    PlanTier.ENTERPRISE: {
        "name": "Enterprise",
        "enabled_modules": [m.value for m in Module],
        "ai_monthly_limit": 10000,
        "user_limit": None,
    },
}


async def seed_plans(session) -> None:
    """Ensure the Free/Basic/Pro/Enterprise pricing plans exist and match PLAN_DEFINITIONS."""
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
            plan.user_limit = definition["user_limit"]
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

        # 4. Seed several test organizations with user counts to populate Seat Usage Monitor and widgets
        # Get plans
        free_plan = (await session.execute(select(Plan).where(Plan.tier == PlanTier.FREE))).scalars().first()
        basic_plan = (await session.execute(select(Plan).where(Plan.tier == PlanTier.BASIC))).scalars().first()
        pro_plan = (await session.execute(select(Plan).where(Plan.tier == PlanTier.PRO))).scalars().first()
        enterprise_plan = (await session.execute(select(Plan).where(Plan.tier == PlanTier.ENTERPRISE))).scalars().first()

        # Helper function to seed organization and its users
        async def seed_org(name, plan_id, status, count, expires_in_days=None, location="Chennai"):
            result = await session.execute(select(Organization).where(Organization.name == name))
            org = result.scalars().first()
            from datetime import datetime, timezone, timedelta
            
            now = datetime.now(timezone.utc)
            trial_started = now - timedelta(days=10)
            trial_expires = now + timedelta(days=expires_in_days) if expires_in_days is not None else now + timedelta(days=30)
            
            if not org:
                org = Organization(
                    name=name,
                    location=location,
                    public_id=uuid.uuid4(),
                    is_active=True,
                    subscription_status=status,
                    trial_started_at=trial_started,
                    trial_expires_at=trial_expires,
                    plan_id=plan_id,
                    others={}
                )
                session.add(org)
                await session.flush()
                print(f"Created organization: {org.name}")
            else:
                org.plan_id = plan_id
                org.subscription_status = status
                org.trial_expires_at = trial_expires
                await session.flush()
                print(f"Updated organization: {org.name}")
            
            # Now seed users in this organization
            user_count_result = await session.execute(
                select(User).where(User.organization_id == org.id)
            )
            existing_users = user_count_result.scalars().all()
            needed = count - len(existing_users)
            
            if needed > 0:
                hashed_pw = get_password_hash("Testpass@123")
                for i in range(needed):
                    suffix = f"{org.name.lower().replace(' ', '')}_{i+len(existing_users)}"
                    user = User(
                        username=f"user_{suffix}",
                        email=f"user_{suffix}@example.com",
                        full_name=f"User {i+len(existing_users)} - {org.name}",
                        hashed_password=hashed_pw,
                        is_active=True,
                        is_verified=True,
                        is_superuser=False,
                        role=UserRole.DEVELOPER if i > 0 else UserRole.ADMIN,
                        organization_id=org.id,
                        public_id=uuid.uuid4(),
                        others={}
                    )
                    session.add(user)
                await session.flush()
                print(f"Seeded {needed} users for organization {org.name}")

        # Seed test orgs
        await seed_org("Acme Corporation", pro_plan.id if pro_plan else None, "active", 45, location="San Francisco")
        await seed_org("Globex Corporation", basic_plan.id if basic_plan else None, "active", 18, location="Boston")
        await seed_org("Initech Inc.", free_plan.id if free_plan else None, "trial", 8, expires_in_days=3, location="Austin")
        await seed_org("Hooli", pro_plan.id if pro_plan else None, "trial", 46, expires_in_days=1, location="Silicon Valley")
        await seed_org("Umbrella Corp", enterprise_plan.id if enterprise_plan else None, "active", 12, location="Raccoon City")
        await seed_org("Stark Industries", pro_plan.id if pro_plan else None, "active", 15, location="New York")

        await session.commit()
        print("Database seeding completed successfully.")

if __name__ == "__main__":
    asyncio.run(seed_db())
