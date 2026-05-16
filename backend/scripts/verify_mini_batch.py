
import asyncio
import sys
import os
import uuid
from datetime import date

# Ensure we can import app
sys.path.append(os.getcwd())

from app.schemas.training_candidate_allocation import BatchMini

async def verify_mini_batch():
    print("START_MINI_BATCH_VERIFICATION", flush=True)
    
    # Mock data with new fields
    batch_data = {
        "public_id": uuid.uuid4(),
        "batch_name": "Test Batch",
        "status": "planned",
        "disability_type": "Locomotor Disability",
        "start_date": date.today(),
        "approx_close_date": date.today()
    }
    
    try:
        mini = BatchMini(**batch_data)
        print("BatchMini initialized successfully with new fields.", flush=True)
        print(f"Disability: {mini.disability_type}", flush=True)
        print(f"Start Date: {mini.start_date}", flush=True)
        
        # Check serialization (pydantic .dict() or .model_dump())
        dump = mini.model_dump()
        if "disability_type" in dump and "start_date" in dump:
             print("PASS: Fields present in serialization.", flush=True)
        else:
             print("FAIL: Fields MISSING in serialization.", flush=True)
             
    except Exception as e:
        print(f"Error: {e}", flush=True)
        import traceback
        traceback.print_exc()

    print("END_MINI_BATCH_VERIFICATION", flush=True)

if __name__ == "__main__":
    asyncio.run(verify_mini_batch())
