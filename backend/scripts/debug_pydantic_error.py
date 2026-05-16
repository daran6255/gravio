
import asyncio
import sys
import os
import uuid
from datetime import date

# Ensure we can import app
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.services.training_candidate_allocation_service import TrainingCandidateAllocationService
from app.schemas.training_candidate_allocation import TrainingCandidateAllocationResponse
from sqlalchemy import text
from pydantic import ValidationError

async def debug_pydantic():
    print("START_PYDANTIC_DEBUG", flush=True)
    async with AsyncSessionLocal() as session:
        service = TrainingCandidateAllocationService(session)
        
        # 1. Fetch valid public_id
        query = """
        SELECT c.public_id, c.name 
        FROM candidates c 
        JOIN training_candidate_allocations tca ON c.id = tca.candidate_id 
        WHERE tca.is_deleted = false
        LIMIT 1
        """
        result = await session.execute(text(query))
        row = result.fetchone()
        
        if not row:
            print("No allocations found to test.", flush=True)
            return

        public_id, name = row
        print(f"Testing Candidate: {name} ({public_id})", flush=True)

        allocations = await service.get_allocations_by_candidate(public_id)
        
        print(f"Testing serialization on {len(allocations)} allocations...", flush=True)
        
        for alloc in allocations:
            try:
                # Force load attributes
                _ = alloc.batch.batch_name
                disability = alloc.batch.disability_type
                print(f"DB Disability value: '{disability}'", flush=True)
                
                # Validate
                model = TrainingCandidateAllocationResponse.model_validate(alloc)
                dump = model.model_dump()
                
                print(f"Allocation {alloc.id}: Validation OK", flush=True)
                print(f"Dumped Batch Disability: '{dump['batch']['disability_type']}'", flush=True)
                
            except ValidationError as e:
                print(f"Allocation {alloc.id}: Validation ERROR!", flush=True)
                print(e.json(), flush=True)
            except Exception as e:
                print(f"Allocation {alloc.id}: Other Error: {e}", flush=True)
                import traceback
                traceback.print_exc()

    print("END_PYDANTIC_DEBUG", flush=True)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(debug_pydantic())
