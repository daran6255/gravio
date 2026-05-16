
import asyncio
import sys
import os
import uuid
from datetime import date

# Ensure we can import app
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.services.training_candidate_allocation_service import TrainingCandidateAllocationService
# Import from schemas
from app.schemas.training_candidate_allocation import TrainingCandidateAllocationResponse
from sqlalchemy import text

async def debug_api_response():
    print("START_API_DEBUG", flush=True)
    async with AsyncSessionLocal() as session:
        service = TrainingCandidateAllocationService(session)
        
        # 1. Find a candidate with an allocation
        query = """
        SELECT tca.candidate_id, c.public_id, c.name 
        FROM training_candidate_allocations tca
        JOIN candidates c ON tca.candidate_id = c.id
        WHERE tca.is_deleted = false
        LIMIT 1
        """
        result = await session.execute(text(query))
        row = result.fetchone()
        
        if not row:
            print("No allocations found to test.", flush=True)
            return

        cid, public_id, name = row
        print(f"Testing Candidate: {name} ({public_id})", flush=True)
        
        # 2. Get allocations using service
        allocations = await service.get_allocations_by_candidate(public_id)
        
        print(f"Found {len(allocations)} allocations.", flush=True)
        
        for alloc in allocations:
            # 3. Serialize MANUALLY first to inspect checking lazy load
            try:
                # Force access to attributes to ensure they are loaded in async session
                b_name = alloc.batch.batch_name
                b_dis = alloc.batch.disability_type
                b_start = alloc.batch.start_date
                b_close = alloc.batch.approx_close_date
                
                print(f"\nAllocation ID: {alloc.id}", flush=True)
                print(f"Direct DB Access -> Name: {b_name}, Disability: '{b_dis}', Start: {b_start}", flush=True)

                # Now try Pydantic serialization
                response_model = TrainingCandidateAllocationResponse.model_validate(alloc)
                data = response_model.model_dump()
                
                batch = data.get('batch')
                
                if batch:
                    print(f"Pydantic Dump -> Batch Name: {batch.get('batch_name')}", flush=True)
                    print(f"Pydantic Dump -> Disability Type: '{batch.get('disability_type')}'", flush=True)
                    print(f"Pydantic Dump -> Start Date: {batch.get('start_date')}", flush=True)
                    
                    if batch.get('disability_type') is None:
                         print("WARNING: disability_type is None in Pydantic output!", flush=True)
                    else:
                         print("SUCCESS: disability_type is present in Pydantic output.", flush=True)

                else:
                    print("Batch is None in Pydantic output!", flush=True)
            except Exception as e:
                print(f"Serialization Error: {e}", flush=True)
                import traceback
                traceback.print_exc()

    print("END_API_DEBUG", flush=True)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(debug_api_response())
