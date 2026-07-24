"""One-off backfill script: seeds the standard default leave types (Sick/Casual/
Earned/Loss-of-Pay) for every existing organization that has none yet.

New organizations no longer need this -- onboarding calls
app.services.hr.seed_default_leave_types directly, and any org still missing
leave types gets lazily seeded the next time it lists them (see
list_leave_types in app/services/hr.py). This script exists only to backfill
in bulk (e.g. right after deploying that change) instead of waiting for each
org to hit the lazy-seed path on its own.

Usage:
    python -m app.scripts.seed_leave_types
"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
from app.services.hr import seed_default_leave_types


async def run() -> None:
    async with AsyncSessionLocal() as db:
        orgs = (await db.execute(select(Organization))).scalars().all()
        if not orgs:
            print("No organizations found to seed.")
            return

        seeded_orgs = 0
        for org in orgs:
            created = await seed_default_leave_types(db, org.id)
            if created:
                seeded_orgs += 1

        await db.commit()
        print(f"Seeded default leave types for {seeded_orgs} of {len(orgs)} organizations (rest already had some).")


if __name__ == "__main__":
    asyncio.run(run())
