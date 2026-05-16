import asyncio
import sys
import os
import argparse
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

# Add parent directory to path to allow importing app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Manually load .env file from the backend directory
from dotenv import load_dotenv
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)
print(f"Loaded environment from: {env_path}")

# Set ENV_FILE explicitly for Pydantic
os.environ["ENV_FILE"] = env_path

from app.core.database import AsyncSessionLocal, engine

# Import all models to be cleared
from app.models.candidate import Candidate
from app.models.candidate_screening import CandidateScreening
from app.models.candidate_document import CandidateDocument
from app.models.candidate_counseling import CandidateCounseling
from app.models.activity_log import ActivityLog
from app.models.training_attendance import TrainingAttendance
from app.models.training_assessment import TrainingAssessment
from app.models.training_mock_interview import TrainingMockInterview
from app.models.training_batch_event import TrainingBatchEvent
from app.models.training_candidate_allocation import TrainingCandidateAllocation
from app.models.training_batch import TrainingBatch
from app.models.training_batch_extension import TrainingBatchExtension
from app.models.ticket import Ticket, TicketMessage

# CRM Models
from app.models.deal import Deal
from app.models.lead import Lead
from app.models.company import Company
from app.models.contact import Contact
from app.models.crm_activity_log import CRMActivityLog
from app.models.crm_task import CRMTask

async def clear_database():
    """
    Clears records from all database tables except User, SystemSetting, and DynamicField.
    Deletion order is managed to respect Foreign Key constraints.
    """
    try:
        async with AsyncSessionLocal() as session:
            # 1. Clear Activity and Task logs (Polymorphic)
            print("Clearing CRM Activity Logs & Tasks...")
            await session.execute(delete(CRMActivityLog))
            await session.execute(delete(CRMTask))
            await session.execute(delete(ActivityLog))

            # 2. Clear Ticket System
            print("Clearing Ticket Messages & Tickets...")
            await session.execute(delete(TicketMessage))
            await session.execute(delete(Ticket))

            # 3. Clear Training Extensions & Details
            print("Clearing Training Extensions (Attendance, Assessments, Interviews, Events)...")
            await session.execute(delete(TrainingAttendance))
            await session.execute(delete(TrainingAssessment))
            await session.execute(delete(TrainingMockInterview))
            await session.execute(delete(TrainingBatchEvent))
            await session.execute(delete(TrainingBatchExtension))

            # 4. Clear Training Allocations and Batches
            print("Clearing Training Allocations & Batches...")
            await session.execute(delete(TrainingCandidateAllocation))
            await session.execute(delete(TrainingBatch))

            # 5. Clear Candidate Details
            print("Clearing Candidate Details (Screenings, Counseling, Documents)...")
            await session.execute(delete(CandidateScreening))
            await session.execute(delete(CandidateCounseling))
            await session.execute(delete(CandidateDocument))
            await session.execute(delete(Candidate))

            # 6. Clear CRM Entities (Deals, Leads, Contacts, Companies)
            print("Clearing CRM Deals and Leads...")
            await session.execute(delete(Deal))
            await session.execute(delete(Lead))
            
            print("Clearing CRM Contacts and Companies...")
            await session.execute(delete(Contact))
            await session.execute(delete(Company))

            await session.commit()
            print("\nSuccessfully cleared all tables except User, SystemSetting, and DynamicField.")
    except Exception as e:
        print(f"\nError occurred while clearing database: {e}")
        raise
    finally:
        # Crucial for avoid event loop issues
        print("Disposing database engine...")
        await engine.dispose()

def main():
    parser = argparse.ArgumentParser(description="Clear records from all database tables except User, SystemSetting, and DynamicField.")
    parser.add_argument(
        "--confirm", 
        action="store_true", 
        help="Confirm that you want to delete all records. This action is irreversible."
    )

    args = parser.parse_args()

    if not args.confirm:
        print("WARNING: This script will delete ALL records from almost all database tables.")
        print("EXCEPTED: User, SystemSetting, DynamicField.")
        print("This action is IRREVERSIBLE.")
        confirm = input("Are you sure you want to proceed? Type 'YES' to confirm: ")
        if confirm != "YES":
            print("Operation cancelled.")
            sys.exit(0)

    try:
        asyncio.run(clear_database())
    except Exception:
        sys.exit(1)

if __name__ == "__main__":
    main()
