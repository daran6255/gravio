import asyncio
import sys
import os
import argparse
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from dotenv import load_dotenv

# Fix for Windows asyncio issue
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Add parent directory to path to allow importing app modules
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BACKEND_DIR)

def setup_environment(env_file_path=None):
    """
    Sets up the environment by loading the specified .env file.
    If no path is provided, it tries to detect .env or .env.dev.
    """
    if not env_file_path:
        # Check for .env or fallback to .env.dev
        if os.path.exists(os.path.join(BACKEND_DIR, ".env")):
            env_file_path = ".env"
        elif os.path.exists(os.path.join(BACKEND_DIR, ".env.dev")):
            env_file_path = ".env.dev"
        else:
            # If neither exists, we might still proceed if environment variables are set
            # But we'll try .env by default
            env_file_path = ".env"

    # Set ENV_FILE for Pydantic Settings BEFORE it's imported
    os.environ["ENV_FILE"] = env_file_path
    
    # Load dotenv to make variables available to os.getenv()
    full_path = os.path.join(BACKEND_DIR, env_file_path)
    if os.path.exists(full_path):
        load_dotenv(full_path)
        print(f"Loaded environment variables from {env_file_path}")
    else:
        print(f"Warning: Environment file {env_file_path} not found.")

async def clear_database(engine_to_use, include_users: bool = False):
    """
    Clears records from the database tables in the correct order to respect FK constraints.
    """
    # Import models locally to prevent early validation crashes
    from app.models.user import User
    from app.models.candidate import Candidate
    from app.models.candidate_screening import CandidateScreening
    from app.models.candidate_document import CandidateDocument
    from app.models.candidate_counseling import CandidateCounseling
    from app.models.activity_log import ActivityLog
    # New models
    from app.models.training_attendance import TrainingAttendance
    from app.models.training_assessment import TrainingAssessment
    from app.models.training_mock_interview import TrainingMockInterview
    from app.models.training_batch_event import TrainingBatchEvent
    from app.models.training_candidate_allocation import TrainingCandidateAllocation
    from app.models.training_batch import TrainingBatch
    from app.models.training_batch_extension import TrainingBatchExtension
    from app.models.ticket import Ticket, TicketMessage
    from app.models.crm_activity_log import CRMActivityLog
    from app.models.crm_task import CRMTask
    from app.models.deal import Deal
    from app.models.lead import Lead
    from app.models.company import Company
    from app.models.contact import Contact
    from app.core.config import settings

    # Safety check for environment
    allowed_envs = ["development", "qa", "staging", "production"]
    current_env = settings.ENVIRONMENT.lower()
    if current_env not in allowed_envs:
        print(f"CRITICAL ERROR: Attempting to clear database in '{current_env}' environment.")
        print(f"This script is strictly allowed only in {allowed_envs} environments.")
        sys.exit(1)

    if current_env in ["staging", "production"]:
        print(f"\n! WARNING: YOU ARE RUNNING THIS ON {current_env.upper()} !")
        print("This operation will DESTROY all data in the target database.")
        confirm_env = input(f"Confirm environment name '{current_env}' to proceed: ")
        if confirm_env != current_env:
            print("Environment name mismatch. Operation cancelled.")
            sys.exit(1)

    print(f"Environment Check Passed: {current_env}")

    SessionLocal = async_sessionmaker(engine_to_use, expire_on_commit=False)
    
    async with SessionLocal() as session:
        try:
            # Order of deletion matters because of foreign keys
            
            # 1. CRM Logs & Tasks (Refers to Entities)
            print("Clearing CRM Activity Logs & Tasks...")
            await session.execute(delete(CRMActivityLog))
            await session.execute(delete(CRMTask))
            
            # 2. Activity Logs (Refers to Users/Entities)
            print("Clearing Activity Logs...")
            await session.execute(delete(ActivityLog))

            # 3. Ticket System (Refers to Users)
            print("Clearing Ticket Messages & Tickets...")
            await session.execute(delete(TicketMessage))
            await session.execute(delete(Ticket))

            # 4. Training Extensions (Refers to Batches & Candidates)
            print("Clearing Training Extensions (Attendance, Assessments, Interviews, Events)...")
            await session.execute(delete(TrainingAttendance))
            await session.execute(delete(TrainingAssessment))
            await session.execute(delete(TrainingMockInterview))
            await session.execute(delete(TrainingBatchEvent))
            await session.execute(delete(TrainingBatchExtension))

            # 5. CRM Root Entities (Deals/Leads)
            print("Clearing CRM Deals & Leads...")
            await session.execute(delete(Deal))
            await session.execute(delete(Lead))

            # 6. Allocations (Refers to Batches & Candidates)
            print("Clearing Candidate Allocations...")
            await session.execute(delete(TrainingCandidateAllocation))

            # 7. Batches (Refers to nothing/Users)
            print("Clearing Training Batches...")
            await session.execute(delete(TrainingBatch))
            
            # 8. Candidate Data (Refers to Candidates)
            print("Clearing Candidate Documents...")
            await session.execute(delete(CandidateDocument))
            
            print("Clearing Candidate Counseling...")
            await session.execute(delete(CandidateCounseling))
            
            print("Clearing Candidate Screenings...")
            await session.execute(delete(CandidateScreening))
            
            # 9. Candidates
            print("Clearing Candidates...")
            await session.execute(delete(Candidate))

            # 10. CRM Base Entities (Contacts/Companies)
            print("Clearing CRM Contacts & Companies...")
            await session.execute(delete(Contact))
            await session.execute(delete(Company))
            
            # 11. Users (Optional)
            if include_users:
                print("Clearing Users (excluding superusers)...")
                await session.execute(delete(User).where(User.is_superuser == False))
            
            await session.commit()
            print("\nSuccessfully cleared the specified tables.")
            
        except Exception as e:
            await session.rollback()
            print(f"\nError occurred while clearing database: {e}")
            sys.exit(1)
        finally:
            # Dispose the engine to close all connections
            await engine_to_use.dispose()

def main():
    parser = argparse.ArgumentParser(description="Clear records from database tables.")
    parser.add_argument("--env-file", help="Specify which .env file to use (e.g., .env.dev)")
    parser.add_argument("--host", help="Database host (overrides env file)")
    parser.add_argument("--port", help="Database port (overrides env file)")
    parser.add_argument("--user", help="Database user (overrides env file)")
    parser.add_argument("--password", help="Database password (overrides env file)")
    parser.add_argument("--dbname", help="Database name (overrides env file)")
    parser.add_argument(
        "--confirm", 
        action="store_true", 
        help="Confirm that you want to delete all records. This action is irreversible."
    )
    parser.add_argument(
        "--include-users", 
        action="store_true", 
        help="Also clear the users table (excluding superusers)."
    )

    args = parser.parse_args()

    # Step 1: Setup environment
    setup_environment(args.env_file)

    # Step 2: Determine which engine to use
    use_custom_engine = any([args.host, args.user, args.password, args.dbname])
    
    if use_custom_engine:
        # Construct custom URL if any override is provided
        host = args.host or os.getenv("POSTGRES_SERVER", "localhost")
        port = args.port or os.getenv("POSTGRES_PORT", "5432")
        user = args.user or os.getenv("POSTGRES_USER", "postgres")
        password = args.password or os.getenv("POSTGRES_PASSWORD", "")
        dbname = args.dbname or os.getenv("POSTGRES_DB", "fastapi_db")
        
        database_url = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{dbname}"
        print(f"Connecting to SPECIFIED database: {dbname} on {host}...")
        engine = create_async_engine(database_url, echo=False)
    else:
        # Step 3: Use default engine from app.core.database if no manual overrides
        # We try to import it inside main to avoid the ValidationError during module load if any env var is missing
        try:
            from app.core.database import engine as default_engine
            engine = default_engine
            print(f"Connecting to database using credentials from environment...")
        except Exception as e:
            print(f"Error: Could not load database configuration: {e}")
            print("Please ensure your environment file is present or provide credentials via arguments.")
            print("Example: python scripts/clear_db.py --env-file .env.dev")
            print("Run with --help to see all options.")
            sys.exit(1)

    # Step 4: Safety Confirmation
    if not args.confirm:
        print("\nWARNING: This script will delete ALL records from the candidate-related tables.")
        print("This action is IRREVERSIBLE.")
        confirm = input("Are you sure you want to proceed? Type 'YES' to confirm: ")
        if confirm.strip().upper() != "YES":
            print("Operation cancelled.")
            sys.exit(0)

    # Step 5: Execute
    try:
        asyncio.run(clear_database(engine, include_users=args.include_users))
    except KeyboardInterrupt:
        print("\nOperation interrupted by user.")
    except Exception as e:
        print(f"\nFailed to run script: {e}")

if __name__ == "__main__":
    main()

# python scripts/clear_db.py --env-file .env.dev --confirm