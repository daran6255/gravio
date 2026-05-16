import asyncio
import sys
import os

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal, engine
from app.models.candidate import Candidate
from sqlalchemy import select

async def run_check():
    async with AsyncSessionLocal() as session:
        query = select(Candidate).where(
            Candidate.disability_details.isnot(None),
            Candidate.is_deleted == False
        )
        result = await session.execute(query)
        candidates = result.scalars().all()
        
        print("\n--- Current Disability Types in Database ---")
        types_found = {}
        for c in candidates:
            d_type = c.disability_details.get('disability_type') if c.disability_details else None
            if d_type:
                types_found[d_type] = types_found.get(d_type, 0) + 1
                if d_type in ["Hearing Impairment (deaf and hard of hearing)", "Low-vision", "low vision"]:
                    print(f"STILL WRONG: ID {c.id}, Name {c.name}, Type: '{d_type}'")
        
        print("\nSummary Count:")
        for d_type, count in sorted(types_found.items()):
            print(f"'{d_type}': {count}")
        print("-------------------------------------------\n")

async def main():
    try:
        await run_check()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
