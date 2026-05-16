"""Models package - SQLAlchemy ORM models"""

from app.models.user import User, UserRole
from app.models.activity_log import ActivityLog, ActionType
from app.models.candidate import Candidate
from app.models.candidate_assignment import CandidateAssignment
from app.models.candidate_screening import CandidateScreening
from app.models.candidate_document import CandidateDocument
from app.models.candidate_counseling import CandidateCounseling
from app.models.training_batch import TrainingBatch
from app.models.training_batch_extension import TrainingBatchExtension
from app.models.training_candidate_allocation import TrainingCandidateAllocation
from app.models.training_attendance import TrainingAttendance
from app.models.training_assignment import TrainingAssignment

from app.models.training_mock_interview import TrainingMockInterview
from app.models.training_batch_event import TrainingBatchEvent
from app.models.training_batch_plan import TrainingBatchPlan
from app.models.dynamic_field import DynamicField
from app.models.ticket import Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory
from app.models.company import Company, CompanySize, CompanyStatus
from app.models.contact import Contact, ContactSource
from app.models.lead import Lead, LeadSource, LeadStatus
from app.models.deal import Deal, DealStage, DealType
from app.models.crm_task import CRMTask, CRMTaskType, CRMTaskPriority, CRMTaskStatus, CRMRelatedToType
from app.models.crm_activity_log import CRMActivityLog, CRMEntityType, CRMActivityType
from app.models.job_role import JobRole, JobRoleStatus
from app.models.system_setting import SystemSetting
from app.models.dsr_project import DSRProject
from app.models.dsr_activity import DSRActivity, DSRActivityStatus
from app.models.dsr_activity_type import DSRActivityType
from app.models.dsr_entry import DSREntry, DSRStatus
from app.models.dsr_permission_request import DSRPermissionRequest, DSRPermissionStatus
from app.models.dsr_leave_application import DSRLeaveApplication, DSRLeaveStatus
from app.models.dsr_project_request import DSRProjectRequest, DSRProjectRequestStatus
from app.models.company_holiday import CompanyHoliday
from app.models.notification import Notification
from app.models.notification import Notification
from app.models.placement_mapping import PlacementMapping, PlacementStatus
from app.models.placement_pipeline_history import PlacementPipelineHistory
from app.models.placement_interview import PlacementInterview, InterviewRoundType, InterviewMode, InterviewResult
from app.models.placement_offer import PlacementOffer, OfferResponse, JoiningStatus
from app.models.placement_note import PlacementNote, NoteType
from app.models.skill import Skill
from app.models.ai_task_log import AITaskLog, AITaskStatus, AITaskTrigger
from app.models.ai_chat import AIChatSession, AIChatMessage
from app.models.user_email_configuration import UserEmailConfiguration

__all__ = [
    "User",
    "UserRole",
    "ActivityLog",
    "ActionType",
    "Candidate",
    "CandidateAssignment",
    "CandidateScreening",
    "CandidateDocument",
    "CandidateCounseling",
    "TrainingBatch",
    "TrainingBatchExtension",
    "TrainingCandidateAllocation",
    "TrainingAttendance",
    "TrainingAssignment",

    "TrainingMockInterview",
    "TrainingBatchEvent",
    "TrainingBatchPlan",
    "DynamicField",
    "Ticket",
    "TicketMessage",
    "TicketStatus",
    "TicketPriority",
    "TicketCategory",
    # CRM Models
    "Company",
    "CompanySize",
    "CompanyStatus",
    "Contact",
    "ContactSource",
    "Lead",
    "LeadSource",
    "LeadStatus",
    "Deal",
    "DealStage",
    "DealType",
    "CRMTask",
    "CRMTaskType",
    "CRMTaskPriority",
    "CRMTaskStatus",
    "CRMRelatedToType",
    "CRMActivityLog",
    "CRMEntityType",
    "CRMActivityType",
    "JobRole",
    "JobRoleStatus",
    "SystemSetting",
    # DSR Models
    "DSRProject",
    "DSRActivity",
    "DSRActivityStatus",
    "DSRActivityType",
    "DSREntry",
    "DSRStatus",
    "DSRPermissionRequest",
    "DSRPermissionStatus",
    "DSRLeaveApplication",
    "DSRLeaveStatus",
    "DSRProjectRequest",
    "DSRProjectRequestStatus",
    "CompanyHoliday",
    "Notification",
    # WhatsApp Integration removed
    # AI Engine
    "AITaskLog",
    "AITaskStatus",
    "AITaskTrigger",
    "AIChatSession",
    "AIChatMessage",
    "Skill",
    "PlacementMapping",
    "PlacementStatus",
    "PlacementPipelineHistory",
    "PlacementInterview",
    "InterviewRoundType",
    "InterviewMode",
    "InterviewResult",
    "PlacementOffer",
    "OfferResponse",
    "JoiningStatus",
    "PlacementNote",
    "NoteType",
    "UserEmailConfiguration",
]

