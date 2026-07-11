"""One-off seed script: adds 8 pre-verified, active demo teammates to a single
organization so the Manager Allocation tree/unassigned UI has real data to
show. Bypasses the invite-email flow entirely (no emails sent) by writing
is_verified=True directly, as if each user had already accepted their invite.

Usage:
    python -m app.scripts.seed_manager_allocation_demo_users
"""
import asyncio

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.repositories.user import UserRepository

ORG_PUBLIC_ID = "dc76eb51-ffc3-4bee-9a0f-efad2348d754"
DEMO_PASSWORD = "DemoUser@2026"

# (email, username, full_name, role, reports_to) -- reports_to is resolved by
# username against either an existing user or another row in this same batch.
NEW_USERS = [
    ("priya.sharma.demo@example.com", "priya.sharma", "Priya Sharma", UserRole.MANAGER, "dharani6255"),
    ("karthik.rajan.demo@example.com", "karthik.rajan", "Karthik Rajan", UserRole.MANAGER, "dharani6255"),
    ("ananya.iyer.demo@example.com", "ananya.iyer", "Ananya Iyer", UserRole.DEVELOPER, "swethadaran"),
    ("rahul.verma.demo@example.com", "rahul.verma", "Rahul Verma", UserRole.DEVELOPER, "priya.sharma"),
    ("sneha.reddy.demo@example.com", "sneha.reddy", "Sneha Reddy", UserRole.TRAINER, "priya.sharma"),
    ("vikram.nair.demo@example.com", "vikram.nair", "Vikram Nair", UserRole.PLACEMENT, "karthik.rajan"),
    ("divya.menon.demo@example.com", "divya.menon", "Divya Menon", UserRole.COUNSELOR, None),
    ("arjun.das.demo@example.com", "arjun.das", "Arjun Das", UserRole.SOURCING, None),
]


async def run() -> None:
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        from app.models.organization import Organization

        org = (await db.execute(select(Organization).where(Organization.public_id == ORG_PUBLIC_ID))).scalar_one_or_none()
        if not org:
            print(f"No organization found with public_id={ORG_PUBLIC_ID}")
            return

        username_to_id: dict[str, int] = {}
        existing = (await db.execute(select(User).where(User.organization_id == org.id))).scalars().all()
        for u in existing:
            username_to_id[u.username] = u.id

        # Delete existing users with these emails or usernames to ensure fresh seed
        from sqlalchemy import delete
        demo_emails = [u[0] for u in NEW_USERS]
        demo_usernames = [u[1] for u in NEW_USERS]
        await db.execute(delete(User).where((User.email.in_(demo_emails)) | (User.username.in_(demo_usernames))))
        await db.flush()

        placeholder_hash = get_password_hash(DEMO_PASSWORD)
        created = []

        for email, username, full_name, role, reports_to_username in NEW_USERS:
            if await UserRepository.get_by_email(db, email):
                print(f"Skipping {email} -- already exists.")
                continue
            if await UserRepository.get_by_username(db, username):
                print(f"Skipping {username} -- already exists.")
                continue

            user = await UserRepository.create(
                db,
                email=email,
                username=username,
                full_name=full_name,
                hashed_password=placeholder_hash,
                organization_id=org.id,
                role=role,
            )
            user.is_verified = True
            await db.flush()

            username_to_id[username] = user.id
            created.append((user, reports_to_username))

        for user, reports_to_username in created:
            if reports_to_username:
                manager_id = username_to_id.get(reports_to_username)
                if manager_id is None:
                    print(f"WARNING: could not resolve manager '{reports_to_username}' for {user.username}")
                else:
                    user.reporting_manager_id = manager_id

        await db.commit()

        print(f"\nCreated {len(created)} demo users in org '{org.name}' (id={org.id}):")
        for user, reports_to_username in created:
            print(f"  {user.full_name} <{user.email}> role={user.role.value} reports_to={reports_to_username or 'Unassigned'}")
        print(f"\nDemo login password for all of these accounts: {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(run())
