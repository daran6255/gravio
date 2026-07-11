"""Seeding script: adds default Salary Components and a standard Salary Structure
(Basic, HRA, Special Allowance, PF, ESI, PT) to all existing organizations.

Usage:
    python -m app.scripts.seed_payroll_structure
"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
from app.models.hr import (
    HRSalaryComponent, HRSalaryStructure, HRSalaryStructureItem,
    SalaryComponentType, SalaryCalculationType
)


async def run() -> None:
    async with AsyncSessionLocal() as db:
        orgs = (await db.execute(select(Organization))).scalars().all()
        if not orgs:
            print("No organizations found to seed.")
            return

        components = [
            {"name": "Basic Salary", "code": "BASIC", "type": SalaryComponentType.EARNING, "is_statutory": False, "is_taxable": True},
            {"name": "House Rent Allowance", "code": "HRA", "type": SalaryComponentType.EARNING, "is_statutory": False, "is_taxable": True},
            {"name": "Special Allowance", "code": "SPECIAL", "type": SalaryComponentType.EARNING, "is_statutory": False, "is_taxable": True},
            {"name": "Provident Fund", "code": "PF", "type": SalaryComponentType.DEDUCTION, "is_statutory": True, "is_taxable": False},
            {"name": "Employee State Insurance", "code": "ESI", "type": SalaryComponentType.DEDUCTION, "is_statutory": True, "is_taxable": False},
            {"name": "Professional Tax", "code": "PT", "type": SalaryComponentType.DEDUCTION, "is_statutory": True, "is_taxable": False},
        ]

        seeded_comps = 0
        seeded_structs = 0

        for org in orgs:
            # 1. Seed components
            code_to_comp = {}
            for comp_data in components:
                # Check if it already exists
                existing = (await db.execute(
                    select(HRSalaryComponent).where(
                        HRSalaryComponent.organization_id == org.id,
                        HRSalaryComponent.code == comp_data["code"],
                        HRSalaryComponent.is_deleted == False
                    )
                )).scalar_one_or_none()

                if not existing:
                    comp = HRSalaryComponent(
                        organization_id=org.id,
                        name=comp_data["name"],
                        code=comp_data["code"],
                        component_type=comp_data["type"],
                        is_statutory=comp_data["is_statutory"],
                        is_taxable=comp_data["is_taxable"],
                    )
                    db.add(comp)
                    await db.flush()
                    code_to_comp[comp_data["code"]] = comp
                    seeded_comps += 1
                else:
                    code_to_comp[comp_data["code"]] = existing

            # 2. Seed Standard Structure Template
            existing_struct = (await db.execute(
                select(HRSalaryStructure).where(
                    HRSalaryStructure.organization_id == org.id,
                    HRSalaryStructure.name == "Standard CTC Structure",
                    HRSalaryStructure.is_deleted == False
                )
            )).scalar_one_or_none()

            if not existing_struct:
                struct = HRSalaryStructure(
                    organization_id=org.id,
                    name="Standard CTC Structure",
                    description="Standard Indian salary breakdown based on CTC (50% Basic, 40% HRA, Special Allowance, PF, ESI, PT)",
                )
                db.add(struct)
                await db.flush()

                # Add items
                items_to_add = [
                    ("BASIC", SalaryCalculationType.FORMULA, "0.50 * CTC"),
                    ("HRA", SalaryCalculationType.FORMULA, "0.40 * BASIC"),
                    ("SPECIAL", SalaryCalculationType.FORMULA, "CTC - BASIC - HRA"),
                ]

                for code, calc_type, val_expr in items_to_add:
                    comp = code_to_comp.get(code)
                    if comp:
                        db_item = HRSalaryStructureItem(
                            structure_id=struct.id,
                            salary_component_id=comp.id,
                            calculation_type=calc_type,
                            value_expr=val_expr,
                        )
                        db.add(db_item)
                
                seeded_structs += 1

        await db.commit()
        print(f"Successfully seeded {seeded_comps} salary components and {seeded_structs} salary structures across {len(orgs)} organizations.")


if __name__ == "__main__":
    asyncio.run(run())
