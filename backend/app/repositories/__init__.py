"""Repositories package - data access layer"""

from app.repositories.user_repository import UserRepository
from app.repositories.activity_log_repository import ActivityLogRepository
from app.repositories.candidate_repository import CandidateRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.contact_repository import ContactRepository
from app.repositories.lead_repository import LeadRepository
from app.repositories.deal_repository import DealRepository
from app.repositories.crm_task_repository import CRMTaskRepository
from app.repositories.crm_activity_log_repository import CRMActivityLogRepository

__all__ = [
    "UserRepository",
    "ActivityLogRepository",
    "CandidateRepository",
    "CompanyRepository",
    "ContactRepository",
    "LeadRepository",
    "DealRepository",
    "CRMTaskRepository",
    "CRMActivityLogRepository",
]
