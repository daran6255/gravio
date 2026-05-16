
import asyncio
import sys
import os
import uuid
from datetime import date, datetime

# Ensure we can import app
sys.path.append(os.getcwd())

from app.schemas.training_attendance import TrainingAttendanceResponse
from app.schemas.training_assessment import TrainingAssessmentResponse
from app.schemas.training_mock_interview import TrainingMockInterviewResponse
from app.schemas.training_batch import TrainingBatchMini

async def verify_schemas():
    print("START_SCHEMA_VERIFICATION", flush=True)
    
    batch_data = {
        "public_id": uuid.uuid4(),
        "batch_name": "Test Batch",
        "status": "planned",
        "disability_type": "Locomotor Disability",
        "start_date": date.today(),
        "approx_close_date": date.today()
    }
    
    mock_batch = type('MockBatch', (), batch_data)()

    print("\n--- Testing Attendance Schema ---", flush=True)
    att_data = {
        "id": 1,
        "batch_id": 1,
        "candidate_id": 1,
        "date": date.today(),
        "status": "present",
        "batch": mock_batch
    }
    try:
        model = TrainingAttendanceResponse.model_validate(type('MockAtt', (), att_data)())
        dump = model.model_dump()
        if dump['batch']['disability_type']:
            print("PASS: Attendance includes batch details", flush=True)
        else:
            print("FAIL: Attendance missing batch details", flush=True)
    except Exception as e:
        print(f"FAIL: Attendance Error: {e}", flush=True)

    print("\n--- Testing Assessment Schema ---", flush=True)
    ass_data = {
        "id": 1,
        "batch_id": 1,
        "candidate_id": 1,
        "assessment_name": "Test",
        "marks_obtained": 80.0,
        "max_marks": 100.0,
        "assessment_date": date.today(),
        "batch": mock_batch
    }
    try:
        model = TrainingAssessmentResponse.model_validate(type('MockAss', (), ass_data)())
        dump = model.model_dump()
        if dump['batch']['disability_type']:
            print("PASS: Assessment includes batch details", flush=True)
        else:
            print("FAIL: Assessment missing batch details", flush=True)
    except Exception as e:
        print(f"FAIL: Assessment Error: {e}", flush=True)

    print("\n--- Testing Mock Interview Schema ---", flush=True)
    mock_data = {
        "id": 1,
        "batch_id": 1,
        "candidate_id": 1,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "interview_date": datetime.now(),
        "status": "pending",
        "batch": mock_batch
    }
    try:
        model = TrainingMockInterviewResponse.model_validate(type('MockInt', (), mock_data)())
        dump = model.model_dump()
        if dump['batch']['disability_type']:
            print("PASS: Mock Interview includes batch details", flush=True)
        else:
            print("FAIL: Mock Interview missing batch details", flush=True)
    except Exception as e:
        print(f"FAIL: Mock Interview Error: {e}", flush=True)


    print("END_SCHEMA_VERIFICATION", flush=True)

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_schemas())
