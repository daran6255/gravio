"""Seeding script: adds standard default leave policies (Sick Leave, Casual Leave,
Earned Leave, Loss of Pay) to all existing organizations.

Usage:
    python -m app.scripts.seed_leave_types
"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
from app.models.hr import HRLeaveType


async def run() -> None:
    async with AsyncSessionLocal() as db:
        orgs = (await db.execute(select(Organization))).scalars().all()
        if not orgs:
            print("No organizations found to seed.")
            return

        standard_leaves = [
            {"name": "Sick Leave", "code": "SL", "default_allocation": 12.0, "is_carry_forward": False, "is_lop": False},
            {"name": "Casual Leave", "code": "CL", "default_allocation": 12.0, "is_carry_forward": False, "is_lop": False},
            {"name": "Earned Leave", "code": "EL", "default_allocation": 15.0, "is_carry_forward": True, "max_carry_forward": 30.0, "is_lop": False},
            {"name": "Loss of Pay", "code": "LOP", "default_allocation": 0.0, "is_carry_forward": False, "is_lop": True},
        ]

        count = 0
        for org in orgs:
            for sl in standard_leaves:
                # Check if it already exists
                existing = (await db.execute(
                    select(HRLeaveType).where(
                        HRLeaveType.organization_id == org.id,
                        HRLeaveType.code == sl["code"],
                        HRLeaveType.is_deleted == False
                    )
                )).scalar_one_or_none()

                if not existing:
                    lt = HRLeaveType(
                        organization_id=org.id,
                        name=sl["name"],
                        code=sl["code"],
                        default_allocation=sl["default_allocation"],
                        is_carry_forward=sl.get("is_carry_forward", False),
                        max_carry_forward=sl.get("max_carry_forward", 0.0),
                        is_lop=sl["is_lop"],
                        is_active=True,
                    )
                    db.add(lt)
                    count += 1

        await db.commit()
        print(f"Successfully seeded {count} leave policy configurations across {len(orgs)} organizations.")


if __name__ == "__main__":
    asyncio.run(run())
