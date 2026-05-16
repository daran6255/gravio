
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.models.user import User
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
    
    print("Imports successful!")
except ImportError as e:
    print(f"Import failed: {e}")
    sys.exit(1)
