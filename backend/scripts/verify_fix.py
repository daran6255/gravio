
import asyncio
import sys
import os
import uuid
from datetime import date, datetime

# Ensure we can import app
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal, engine
from app.services.training_candidate_allocation_service import TrainingCandidateAllocationService
from app.models.candidate import Candidate
from app.models.training_batch import TrainingBatch
from app.models.training_candidate_allocation import TrainingCandidateAllocation
from app.models.candidate_counseling import CandidateCounseling
from sqlalchemy import select, delete

async def verify_fix():
    print("START_TEST_VERIFICATION", flush=True)
    async with AsyncSessionLocal() as session:
        service = TrainingCandidateAllocationService(session)
        
        # 1. Create Test Data
        print("Creating test data...", flush=True)
        
        # Candidate
        test_candidate = Candidate(
            name="Test Verification Candidate",
            gender="Male",
            email=f"test_verify_{uuid.uuid4()}@example.com",
            phone="1234567890",
            pincode="123456",
            city="Test City",
            district="Test District",
            state="Test State",
            disability_details={"disability_type": "Test Disability"}
        )
        session.add(test_candidate)
        await session.flush()
        
        # Counseling (must be selected)
        counseling = CandidateCounseling(
            candidate_id=test_candidate.id,
            status="Selected",
            counseling_date=datetime.now()
        )
        session.add(counseling)
        
        # Batch (Completed)
        test_batch = TrainingBatch(
            batch_name="Test Completed Batch", 
            status="completed", # ! Important: This should allow re-allocation with the fix
            disability_type="Test Disability" 
        )
        session.add(test_batch)
        await session.flush()
        
        # Allocation
        allocation = TrainingCandidateAllocation(
            candidate_id=test_candidate.id,
            batch_id=test_batch.id,
            status={"current": "completed"}
        )
        session.add(allocation)
        await session.commit()
        
        try:
            # 2. Test Case 1: Batch is COMPLETED
            print("Test 1: Check eligibility with COMPLETED batch...", flush=True)
            eligible = await service.get_eligible_candidates()
            found = any(c['public_id'] == test_candidate.public_id for c in eligible)
            
            if found:
                print("PASS: Candidate is eligible (because batch is completed).", flush=True)
            else:
                print("FAIL: Candidate is NOT eligible (even though batch is completed). Logic failed.", flush=True)
                
            # 3. Test Case 2: Batch is RUNNING
            print("Test 2: Check eligibility with RUNNING batch...", flush=True)
            
            # Update batch status
            test_batch.status = "running"
            session.add(test_batch)
            await session.commit()
            
            eligible = await service.get_eligible_candidates()
            found = any(c['public_id'] == test_candidate.public_id for c in eligible)
            
            if not found:
                print("PASS: Candidate is blocked (because batch is running).", flush=True)
            else:
                print("FAIL: Candidate is eligible (should be blocked by running batch).", flush=True)

        except Exception as e:
            print(f"Error during test: {e}", flush=True)
            import traceback
            traceback.print_exc()
        finally:
            # 4. Clean up
            print("Cleaning up test data...", flush=True)
            await session.delete(allocation)
            await session.delete(counseling)
            await session.delete(test_candidate)
            await session.delete(test_batch)
            await session.commit()
            
    print("END_TEST_VERIFICATION", flush=True)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_fix())
