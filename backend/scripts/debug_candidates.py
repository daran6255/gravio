
import asyncio
import sys
import os

# Add the parent directory to the path so we can import app
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import AsyncSessionLocal
from app.models.candidate import Candidate
from app.models.candidate_counseling import CandidateCounseling
from app.models.training_candidate_allocation import TrainingCandidateAllocation
from sqlalchemy import select, func

async def check_candidates():
    async with AsyncSessionLocal() as session:
        print("--- Checking Candidates ---")
        
        # 1. Check all candidates count
        result = await session.execute(select(func.count(Candidate.id)).where(Candidate.is_deleted == False))
        count = result.scalar()
        print(f"Total active candidates: {count}")
        
        # 2. Check candidates with counseling status 'selected'
        query = select(Candidate.name, CandidateCounseling.status, Candidate.disability_details).join(CandidateCounseling).where(
            Candidate.is_deleted == False
        )
        result = await session.execute(query)
        candidates = result.all()
        
        selected_count = 0
        for c in candidates:
            status = c.status.lower() if c.status else "None"
            if status == "selected":
                selected_count += 1
                try:
                    disability = c.disability_details.get('disability_type') if c.disability_details else 'None'
                    print(f"Candidate: {c.name}, Status: {c.status}, Disability: {disability}")
                except Exception as e:
                    print(f"Candidate: {c.name}, Status: {c.status}, Disability Error: {e}")
            else:
                 # Print a few non-selected to see what their status is
                 pass
        
        print(f"Candidates with 'selected' status: {selected_count}")

        if selected_count == 0:
            print("WARNING: No candidates found with 'selected' status in counseling.")
            
        # 3. Check for active allocations
        print("\n--- Checking Active Allocations ---")
        query = select(TrainingCandidateAllocation).where(
             TrainingCandidateAllocation.is_deleted == False,
             TrainingCandidateAllocation.is_dropout == False
        )
        result = await session.execute(query)
        allocations = result.scalars().all()
        print(f"Total active allocations: {len(allocations)}")
        for a in allocations:
            print(f"Allocation ID: {a.id}, Candidate ID: {a.candidate_id}, Batch ID: {a.batch_id}")

if __name__ == "__main__":
    asyncio.run(check_candidates())
