from fastapi import APIRouter, Depends, Request
from datetime import datetime, time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, String
from sqlalchemy.orm import selectinload
from fastapi.encoders import jsonable_encoder

from app.api import deps
from app.models.user import User, UserRole
from app.models.candidate import Candidate
from app.models.candidate_screening import CandidateScreening
from app.models.candidate_counseling import CandidateCounseling
from app.models.candidate_document import CandidateDocument
from app.models.activity_log import ActivityLog, ActionType
from app.models.training_candidate_allocation import TrainingCandidateAllocation
from app.models.training_batch import TrainingBatch
from app.models.training_attendance import TrainingAttendance
from app.models.training_assignment import TrainingAssignment
from app.models.training_mock_interview import TrainingMockInterview
from app.models.training_batch_event import TrainingBatchEvent
from app.models.training_batch_plan import TrainingBatchPlan
from app.models.training_batch_extension import TrainingBatchExtension
from app.models.dynamic_field import DynamicField
from app.models.ticket import Ticket
from app.models.dsr_entry import DSREntry
from app.models.dsr_project import DSRProject
from app.models.dsr_activity import DSRActivity
from app.models.dsr_activity_type import DSRActivityType
from app.models.dsr_permission_request import DSRPermissionRequest
from app.models.dsr_leave_application import DSRLeaveApplication
from app.models.dsr_project_request import DSRProjectRequest
from app.models.lead import Lead
from app.models.deal import Deal
from app.models.company import Company
from app.models.contact import Contact
from app.models.crm_task import CRMTask
from app.models.crm_activity_log import CRMActivityLog
from app.models.candidate_assignment import CandidateAssignment
from app.models.job_role import JobRole
from app.models.system_setting import SystemSetting
from app.models.company_holiday import CompanyHoliday
from app.models.notification import Notification
from app.models.skill import Skill
from app.models.placement_mapping import PlacementMapping
from app.models.placement_pipeline_history import PlacementPipelineHistory
from app.models.placement_interview import PlacementInterview
from app.models.placement_offer import PlacementOffer
from app.models.placement_note import PlacementNote
from app.models.ticket import TicketMessage
from app.utils.activity_tracker import log_read

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/export/{table_name}")
async def export_table_for_power_bi(
    table_name: str,
    db: AsyncSession = Depends(deps.get_db),
    api_key: str = Depends(deps.verify_api_key),
):
    """
    Get a specific table dump for Power BI.
    Returns a plain list of records.
    Supported tables: users, candidates, screenings, counselings, documents,
    activity_logs, allocations, batches, attendance, assignments, 
    mock_interviews, batch_events, batch_plans, batch_extensions, 
    fields, tickets, ticket_messages, dsr_entries, dsr_projects, dsr_activities, 
    dsr_activity_types, dsr_permission_requests, dsr_leave_applications, 
    dsr_project_requests, leads, deals, companies, contacts, 
    crm_tasks, crm_activity_logs, candidate_assignments, job_roles,
    system_settings, company_holidays, notifications,
    skills, placement_mappings, placement_pipeline_history,
    placement_interviews, placement_offers, placement_notes
    """
    from fastapi import HTTPException
    
    model_map = {
        "users": User,
        "candidates": Candidate,
        "screenings": CandidateScreening,
        "counselings": CandidateCounseling,
        "documents": CandidateDocument,
        "activity_logs": ActivityLog,
        "allocations": TrainingCandidateAllocation,
        "batches": TrainingBatch,
        "attendance": TrainingAttendance,
        "assignments": TrainingAssignment,
        "mock_interviews": TrainingMockInterview,
        "batch_events": TrainingBatchEvent,
        "batch_plans": TrainingBatchPlan,
        "batch_extensions": TrainingBatchExtension,
        "fields": DynamicField,
        "tickets": Ticket,
        "dsr_entries": DSREntry,
        "dsr_projects": DSRProject,
        "dsr_activities": DSRActivity,
        "dsr_activity_types": DSRActivityType,
        "dsr_permission_requests": DSRPermissionRequest,
        "dsr_leave_applications": DSRLeaveApplication,
        "dsr_project_requests": DSRProjectRequest,
        "leads": Lead,
        "deals": Deal,
        "companies": Company,
        "contacts": Contact,
        "crm_tasks": CRMTask,
        "crm_activity_logs": CRMActivityLog,
        "candidate_assignments": CandidateAssignment,
        "job_roles": JobRole,
        "system_settings": SystemSetting,
        "company_holidays": CompanyHoliday,
        "notifications": Notification,
        "skills": Skill,
        "placement_mappings": PlacementMapping,
        "placement_pipeline_history": PlacementPipelineHistory,
        "placement_interviews": PlacementInterview,
        "placement_offers": PlacementOffer,
        "placement_notes": PlacementNote,
        "ticket_messages": TicketMessage,
    }
    
    if table_name not in model_map:
        raise HTTPException(
            status_code=404,
            detail=f"Table '{table_name}' not found. Supported: {', '.join(model_map.keys())}"
        )
        
    model = model_map[table_name]
    result = await db.execute(select(model))
    data = result.scalars().all()
    
    return jsonable_encoder(data)


