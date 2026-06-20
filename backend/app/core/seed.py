"""Database seeding script to initialize the primary superuser and organization"""

import asyncio
import uuid
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, engine
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.core.security import get_password_hash

async def seed_db() -> None:
    """Seed the database with the primary super admin and organization"""
    print("Connecting to database...")
    async with AsyncSessionLocal() as session:
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
