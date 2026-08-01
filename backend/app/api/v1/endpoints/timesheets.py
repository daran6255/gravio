import uuid
from datetime import date, timedelta, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.timesheet import TimesheetStatus, TimesheetBillingType, HolidayType, ProjectTimeLog, WeekUnlockStatus
from app.models.project import Project, ProjectTask
from app.schemas.timesheet import (
    TimesheetCategoryCreate, TimesheetCategoryUpdate, TimesheetCategoryResponse,
    OrgHolidayCreate, OrgHolidayUpdate, OrgHolidayResponse,
    TimesheetUserSettingsUpdate, TimesheetUserSettingsResponse,
    ProjectTimeLogCreate, ProjectTimeLogUpdate, ProjectTimeLogResponse,
    TimesheetSubmitWeekRequest, TimesheetApproveRejectRequest, TimesheetReportRow,
    TimesheetWeekUnlockRequestCreate, TimesheetWeekUnlockResolve, TimesheetWeekUnlockRequestResponse,
    TimesheetBulkApproveRequest, TimesheetBulkApproveResult, TimesheetTeamSettingsRow,
)
from app.repositories.timesheet import (
    TimesheetCategoryRepository, OrgHolidayRepository,
    TimesheetUserSettingsRepository, ProjectTimeLogRepository,
    TimesheetWeekUnlockRequestRepository
)
from app.repositories.user import UserRepository
from app.services.timesheet import TimesheetLockService, TimesheetService, get_week_bounds, is_weekly_off, can_manage_timesheet_for
from app.middleware.exceptions import NotFoundError, BadRequestError, ForbiddenError
from app.schemas.project import IrisMessageRequest, IrisPreviewResponse, IrisPlannedStep
from app.schemas.crm import AuditLogResponse

router = APIRouter(prefix="/timesheets", tags=["timesheets"])
router_holidays = APIRouter(prefix="/holidays", tags=["holidays"])


# ==========================================
# 1. TIME LOG CATEGORIES ENDPOINTS
# ==========================================

@router.get("/categories/my", response_model=List[TimesheetCategoryResponse])
async def get_my_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve personal and organization default timesheet categories for the current user."""
    categories = await TimesheetCategoryRepository.list_for_user(
        db, organization_id=current_user.organization_id, user_id=current_user.id
    )
    # Orgs created before default-category seeding existed (or where onboarding was
    # skipped) would otherwise never get the org-default set -- lazily seed it,
    # mirroring list_project_task_statuses_endpoint. Checked against org-defaults
    # specifically (not "any categories"), since a user's own personal categories
    # (e.g. one they added via "+ Add New Category") shouldn't mask this.
    if current_user.organization_id and not any(c.is_org_default for c in categories):
        seeded = await TimesheetCategoryRepository.seed_defaults(db, current_user.organization_id)
        categories = list(categories) + list(seeded)
    return categories

@router.post("/categories", response_model=TimesheetCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: TimesheetCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a user-defined category for general time logging."""
    category = await TimesheetCategoryRepository.create(
        db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        name=payload.name,
        color=payload.color,
        is_org_default=False
    )
    await db.commit()
    await db.refresh(category)
    return category

@router.patch("/categories/{category_id}", response_model=TimesheetCategoryResponse)
async def update_category(
    category_id: int,
    payload: TimesheetCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a user-defined category."""
    category = await TimesheetCategoryRepository.get_by_id(db, category_id)
    if not category or category.organization_id != current_user.organization_id:
        raise NotFoundError("Category not found")
    
    if not category.user_id or category.user_id != current_user.id:
        raise ForbiddenError("You cannot modify organization-level default categories")
        
    updated = await TimesheetCategoryRepository.update(db, category, **payload.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(updated)
    return updated

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a user-defined category."""
    category = await TimesheetCategoryRepository.get_by_id(db, category_id)
    if not category or category.organization_id != current_user.organization_id:
        raise NotFoundError("Category not found")
        
    if not category.user_id or category.user_id != current_user.id:
        raise ForbiddenError("You cannot delete organization-level default categories")
        
    await TimesheetCategoryRepository.delete(db, category)
    await db.commit()

@router.get("/categories/org-defaults", response_model=List[TimesheetCategoryResponse])
async def get_org_default_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve organization-wide default categories (Admin/Manager check)."""
    categories = await TimesheetCategoryRepository.list_for_user(
        db, organization_id=current_user.organization_id, user_id=0
    )
    return [c for c in categories if c.is_org_default]


# ==========================================
# 2. HOLIDAY ENDPOINTS
# ==========================================

@router_holidays.get("/", response_model=List[OrgHolidayResponse])
async def list_holidays(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List holidays configured for the current organization."""
    return await OrgHolidayRepository.list_all(
        db, organization_id=current_user.organization_id, start_date=start_date, end_date=end_date
    )

@router_holidays.post("/", response_model=OrgHolidayResponse, status_code=status.HTTP_201_CREATED)
async def create_holiday(
    payload: OrgHolidayCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Add a new holiday to the organization calendar (Admin only)."""
    holiday = await OrgHolidayRepository.create(
        db,
        organization_id=current_user.organization_id,
        name=payload.name,
        holiday_date=payload.holiday_date,
        type=payload.type,
        country_code=payload.country_code
    )
    await db.commit()
    await db.refresh(holiday)
    return holiday

@router_holidays.patch("/{holiday_id}", response_model=OrgHolidayResponse)
async def update_holiday(
    holiday_id: int,
    payload: OrgHolidayUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Edit an existing holiday (Admin only)."""
    holiday = await OrgHolidayRepository.get_by_id(db, holiday_id)
    if not holiday or holiday.organization_id != current_user.organization_id:
        raise NotFoundError("Holiday not found")
        
    updated = await OrgHolidayRepository.update(db, holiday, **payload.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(updated)
    return updated

@router_holidays.delete("/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_holiday(
    holiday_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Delete a holiday (Admin only)."""
    holiday = await OrgHolidayRepository.get_by_id(db, holiday_id)
    if not holiday or holiday.organization_id != current_user.organization_id:
        raise NotFoundError("Holiday not found")
        
    await OrgHolidayRepository.delete(db, holiday)
    await db.commit()

@router_holidays.get("/check")
async def check_holiday(
    check_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if a specific date is a configured holiday, or a Sunday (always off)."""
    holiday = await OrgHolidayRepository.check_date(db, organization_id=current_user.organization_id, check_date=check_date)
    return {
        "is_holiday": holiday is not None or is_weekly_off(check_date),
        "holiday": OrgHolidayResponse.model_validate(holiday) if holiday else None
    }


# ==========================================
# 3. USER TIMESHEET SETTINGS ENDPOINTS
# ==========================================

@router.get("/users/{user_id}/settings", response_model=TimesheetUserSettingsResponse)
async def get_user_timesheet_settings(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve timesheet settings for a user."""
    if current_user.id != user_id and current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise ForbiddenError("You cannot view settings for other users")
        
    settings = await TimesheetUserSettingsRepository.get_by_user(
        db, organization_id=current_user.organization_id, user_id=user_id
    )
    await db.commit()
    await db.refresh(settings)
    return settings

@router.patch("/users/{user_id}/settings", response_model=TimesheetUserSettingsResponse)
async def update_user_timesheet_settings(
    user_id: int,
    payload: TimesheetUserSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Update timesheet settings for a user (e.g. grant holiday logging override) (Admin/Manager only)."""
    settings = await TimesheetUserSettingsRepository.get_by_user(
        db, organization_id=current_user.organization_id, user_id=user_id
    )
    updated = await TimesheetUserSettingsRepository.update(db, settings, **payload.model_dump(exclude_unset=True))
    await db.commit()
    await db.refresh(updated)
    return updated


# ==========================================
# 4. TIME LOGS ENDPOINTS
# ==========================================

@router.get("/my", response_model=List[ProjectTimeLogResponse])
async def get_my_time_logs(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve logged time entries for the current user in a date range."""
    # Preload projects, tasks, and categories for optimal performance
    stmt = (
        select(ProjectTimeLog)
        .options(
            selectinload(ProjectTimeLog.project),
            selectinload(ProjectTimeLog.task),
            selectinload(ProjectTimeLog.category),
            selectinload(ProjectTimeLog.user)
        )
        .where(
            ProjectTimeLog.organization_id == current_user.organization_id,
            ProjectTimeLog.user_id == current_user.id,
            ProjectTimeLog.log_date >= start_date,
            ProjectTimeLog.log_date <= end_date,
            ProjectTimeLog.is_deleted.is_(False)
        )
        .order_by(ProjectTimeLog.log_date.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=ProjectTimeLogResponse, status_code=status.HTTP_201_CREATED)
async def create_time_log(
    payload: ProjectTimeLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log a new time entry, enforcing holiday and maximum hours validations."""
    return await TimesheetService.create_time_log(db, current_user, payload)

@router.patch("/{log_id}", response_model=ProjectTimeLogResponse)
async def update_time_log(
    log_id: int,
    payload: ProjectTimeLogUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a draft or rejected time entry."""
    return await TimesheetService.update_time_log(db, current_user, log_id, payload)

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete a draft or rejected time entry."""
    await TimesheetService.delete_time_log(db, current_user, log_id)

@router.post("/submit-week")
async def submit_weekly_timesheet(
    payload: TimesheetSubmitWeekRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit draft/rejected time entries in a week to the designated reporting manager."""
    rowcount = await TimesheetService.submit_weekly_timesheet(db, current_user, payload.start_date, payload.end_date)
    return {
        "success": True,
        "message": f"Successfully submitted {rowcount} time log(s) for approval.",
        "submitted_count": rowcount
    }


# ==========================================
# 5. APPROVAL CHAIN ENDPOINTS (Managers/Admins)
# ==========================================

@router.get("/team", response_model=List[ProjectTimeLogResponse])
async def get_team_logs(
    start_date: date = Query(...),
    end_date: date = Query(...),
    user_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    status: Optional[TimesheetStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Retrieve submitted timesheet entries for approval. A MANAGER only sees their own
    direct reports' entries; an ADMIN sees every entry in the org (the escalation tier --
    see can_manage_timesheet_for), matching the same rule enforced on approve/reject/revoke."""
    conditions = [
        ProjectTimeLog.organization_id == current_user.organization_id,
        ProjectTimeLog.log_date >= start_date,
        ProjectTimeLog.log_date <= end_date,
        ProjectTimeLog.is_deleted.is_(False)
    ]

    if current_user.role != UserRole.ADMIN:
        stmt_reports = select(User.id).where(User.reporting_manager_id == current_user.id)
        report_ids_res = await db.execute(stmt_reports)
        report_ids = [r[0] for r in report_ids_res.all()]
        conditions.append(ProjectTimeLog.user_id.in_(report_ids))

    if user_id:
        conditions.append(ProjectTimeLog.user_id == user_id)
    if project_id:
        conditions.append(ProjectTimeLog.project_id == project_id)
    if status:
        conditions.append(ProjectTimeLog.status == status)

    stmt = (
        select(ProjectTimeLog)
        .options(
            selectinload(ProjectTimeLog.project),
            selectinload(ProjectTimeLog.task),
            selectinload(ProjectTimeLog.category),
            selectinload(ProjectTimeLog.user)
        )
        .where(*conditions)
        .order_by(ProjectTimeLog.log_date.asc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/team/bulk-approve", response_model=TimesheetBulkApproveResult)
async def bulk_approve_team_week(
    payload: TimesheetBulkApproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Approve one week for several team members in a single call -- the manager-facing
    equivalent of ticking several rows and hitting Approve once, instead of one request
    per person. Anyone in the list this approver isn't authorized for (or who has
    nothing submitted for that week) is skipped rather than failing the whole batch."""
    result = await TimesheetService.bulk_approve_week(
        db, current_user, payload.user_ids, payload.start_date, payload.end_date
    )
    await db.commit()
    return TimesheetBulkApproveResult(**result)


@router.get("/team/settings", response_model=List[TimesheetTeamSettingsRow])
async def get_team_timesheet_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Per-person timesheet settings (weekly hour target, holiday-logging override) for
    everyone this user manages -- their direct reports, or org-wide for an ADMIN --
    so the team-approvals UI can flag overtime without a fetch per row."""
    rows = await TimesheetService.get_team_settings(db, current_user)
    return [TimesheetTeamSettingsRow(**row) for row in rows]


@router.post("/users/{target_user_id}/approve")
async def approve_user_week(
    target_user_id: int,
    payload: TimesheetSubmitWeekRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Approve a user's submitted logs for a week. Authorized for that user's direct
    reporting manager, or any org ADMIN as the escalation tier."""
    target_user = await UserRepository.get_by_id(db, target_user_id)
    if not target_user or not can_manage_timesheet_for(current_user, target_user):
        raise ForbiddenError("You can only approve timesheets for your direct reports")

    approved = await ProjectTimeLogRepository.approve_reject_week(
        db, organization_id=current_user.organization_id, user_id=target_user_id,
        start_date=payload.start_date, end_date=payload.end_date,
        status=TimesheetStatus.APPROVED, approved_by_id=current_user.id
    )
    await db.commit()
    return {"success": True, "approved_count": approved}

@router.post("/users/{target_user_id}/reject")
async def reject_user_week(
    target_user_id: int,
    date_range: TimesheetSubmitWeekRequest,
    payload: TimesheetApproveRejectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Reject a user's submitted logs for a week with a reason. Authorized for that
    user's direct reporting manager, or any org ADMIN as the escalation tier."""
    if not payload.rejection_note or not payload.rejection_note.strip():
        raise BadRequestError("Rejection reason is required")

    target_user = await UserRepository.get_by_id(db, target_user_id)
    if not target_user or not can_manage_timesheet_for(current_user, target_user):
        raise ForbiddenError("You can only reject timesheets for your direct reports")

    rejected = await ProjectTimeLogRepository.approve_reject_week(
        db, organization_id=current_user.organization_id, user_id=target_user_id,
        start_date=date_range.start_date, end_date=date_range.end_date,
        status=TimesheetStatus.REJECTED, approved_by_id=current_user.id,
        rejection_note=payload.rejection_note
    )
    await db.commit()
    return {"success": True, "rejected_count": rejected}

@router.post("/users/{target_user_id}/unapprove")
async def unapprove_user_week(
    target_user_id: int,
    payload: TimesheetSubmitWeekRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Revoke a wrongly submitted or approved week back to draft, so the employee can
    fix and resubmit it. Authorized for that user's direct reporting manager, or any
    org ADMIN as the escalation tier. Unlike Reject, no note is required -- this is
    for "that shouldn't have gone through" corrections rather than a formal quality
    rejection.

    If the week has already ended, revoking it would otherwise immediately re-lock it
    behind the past-week lock -- so this also auto-grants an unlock for that week.
    """
    target_user = await UserRepository.get_by_id(db, target_user_id)
    if not target_user or not can_manage_timesheet_for(current_user, target_user):
        raise ForbiddenError("You can only revoke timesheets for your direct reports")

    unapproved = await ProjectTimeLogRepository.unapprove_week(
        db, organization_id=current_user.organization_id, user_id=target_user_id,
        start_date=payload.start_date, end_date=payload.end_date,
        from_statuses=[TimesheetStatus.SUBMITTED, TimesheetStatus.APPROVED]
    )
    if unapproved == 0:
        raise BadRequestError("No submitted or approved time entries found to revoke for the selected week")

    await TimesheetLockService.auto_grant_for_revoke(
        db, organization_id=current_user.organization_id, user_id=target_user_id,
        week_start=payload.start_date, week_end=payload.end_date, resolved_by_id=current_user.id,
    )

    await db.commit()
    return {"success": True, "unapproved_count": unapproved}


# ==========================================
# 5.5 WEEK UNLOCK REQUESTS
# ==========================================

@router.post("/week-unlock-requests", response_model=TimesheetWeekUnlockRequestResponse, status_code=status.HTTP_201_CREATED)
async def request_week_unlock(
    payload: TimesheetWeekUnlockRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ask the reporting manager to re-open a past week that ended without being submitted."""
    return await TimesheetService.request_week_unlock(
        db, current_user, payload.week_start_date, payload.week_end_date, payload.reason
    )

@router.get("/week-unlock-requests/my", response_model=List[TimesheetWeekUnlockRequestResponse])
async def my_week_unlock_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """The current user's own unlock requests, so the timesheet grid can show pending/
    resolved status for a locked week."""
    return await TimesheetWeekUnlockRequestRepository.list_for_user(
        db, current_user.organization_id, current_user.id
    )

@router.get("/week-unlock-requests/team", response_model=List[TimesheetWeekUnlockRequestResponse])
async def team_week_unlock_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Requests routed to this manager -- their own direct reports only, or every
    request org-wide for an ADMIN (the escalation tier)."""
    return await TimesheetWeekUnlockRequestRepository.list_for_manager(
        db, current_user.organization_id, current_user.id, org_wide=current_user.role == UserRole.ADMIN,
    )

@router.post("/week-unlock-requests/{request_id}/approve", response_model=TimesheetWeekUnlockRequestResponse)
async def approve_week_unlock(
    request_id: int,
    payload: TimesheetWeekUnlockResolve,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Grant a pending unlock request -- the employee can then edit/submit that week once.
    Authorized for that user's direct reporting manager, or any org ADMIN as the
    escalation tier."""
    req = await TimesheetWeekUnlockRequestRepository.get_by_id(db, request_id)
    if not req or req.organization_id != current_user.organization_id:
        raise NotFoundError("Unlock request not found")

    target_user = await UserRepository.get_by_id(db, req.user_id)
    if not target_user or not can_manage_timesheet_for(current_user, target_user):
        raise ForbiddenError("You can only resolve unlock requests from your direct reports")

    if req.status != WeekUnlockStatus.PENDING:
        raise BadRequestError("This request has already been resolved")

    updated = await TimesheetWeekUnlockRequestRepository.resolve(
        db, req, status=WeekUnlockStatus.APPROVED, resolved_by_id=current_user.id,
        resolution_note=payload.resolution_note
    )
    await db.commit()
    return updated

@router.post("/week-unlock-requests/{request_id}/deny", response_model=TimesheetWeekUnlockRequestResponse)
async def deny_week_unlock(
    request_id: int,
    payload: TimesheetWeekUnlockResolve,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Deny a pending unlock request. Authorized for that user's direct reporting
    manager, or any org ADMIN as the escalation tier."""
    req = await TimesheetWeekUnlockRequestRepository.get_by_id(db, request_id)
    if not req or req.organization_id != current_user.organization_id:
        raise NotFoundError("Unlock request not found")

    target_user = await UserRepository.get_by_id(db, req.user_id)
    if not target_user or not can_manage_timesheet_for(current_user, target_user):
        raise ForbiddenError("You can only resolve unlock requests from your direct reports")

    if req.status != WeekUnlockStatus.PENDING:
        raise BadRequestError("This request has already been resolved")

    updated = await TimesheetWeekUnlockRequestRepository.resolve(
        db, req, status=WeekUnlockStatus.DENIED, resolved_by_id=current_user.id,
        resolution_note=payload.resolution_note
    )
    await db.commit()
    return updated


# ==========================================
# 6. REPORTS & EXPORTS ENDPOINTS
# ==========================================

@router.get("/report", response_model=List[TimesheetReportRow])
async def get_timesheet_report(
    start_date: date = Query(...),
    end_date: date = Query(...),
    project_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    billing_type: Optional[TimesheetBillingType] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aggregate logged hours by User/Project/Task/Category for timesheet auditing."""
    conditions = [
        ProjectTimeLog.organization_id == current_user.organization_id,
        ProjectTimeLog.log_date >= start_date,
        ProjectTimeLog.log_date <= end_date,
        ProjectTimeLog.is_deleted.is_(False)
    ]
    if project_id:
        conditions.append(ProjectTimeLog.project_id == project_id)
    if billing_type:
        conditions.append(ProjectTimeLog.billing_type == billing_type)

    if current_user.role == UserRole.ADMIN:
        if user_id:
            conditions.append(ProjectTimeLog.user_id == user_id)
    elif current_user.role == UserRole.MANAGER:
        stmt_reports = select(User.id).where(User.reporting_manager_id == current_user.id)
        report_ids_res = await db.execute(stmt_reports)
        report_ids = [r[0] for r in report_ids_res.all()]
        allowed_user_ids = [current_user.id] + report_ids
        
        if user_id:
            if user_id not in allowed_user_ids:
                raise ForbiddenError("You can only query reports for yourself or your direct reports")
            conditions.append(ProjectTimeLog.user_id == user_id)
        else:
            conditions.append(ProjectTimeLog.user_id.in_(allowed_user_ids))
    else:
        if user_id and user_id != current_user.id:
            raise ForbiddenError("You can only query your own reports")
        conditions.append(ProjectTimeLog.user_id == current_user.id)

    # Core aggregation query using join
    # Select user full_name/email, project name, task title, category name, billing type, sum of hours
    # Group by all identifiers
    # We join with User, Project, ProjectTask, UserTimesheetCategory (outer joins where nullable)
    # Perform direct execution
    from app.models.user import User as DBUser
    from app.models.timesheet import UserTimesheetCategory as DBCat
    from app.models.project import Project as DBProj, ProjectTask as DBTask
    
    stmt = (
        select(
            ProjectTimeLog.user_id,
            DBUser.full_name,
            DBUser.email,
            ProjectTimeLog.project_id,
            DBProj.name.label("project_name"),
            ProjectTimeLog.task_id,
            DBTask.title.label("task_title"),
            ProjectTimeLog.category_id,
            DBCat.name.label("category_name"),
            ProjectTimeLog.billing_type,
            func.sum(ProjectTimeLog.hours).label("total_hours")
        )
        .join(DBUser, DBUser.id == ProjectTimeLog.user_id)
        .outerjoin(DBProj, DBProj.id == ProjectTimeLog.project_id)
        .outerjoin(DBTask, DBTask.id == ProjectTimeLog.task_id)
        .outerjoin(DBCat, DBCat.id == ProjectTimeLog.category_id)
        .where(*conditions)
        .group_by(
            ProjectTimeLog.user_id,
            DBUser.full_name,
            DBUser.email,
            ProjectTimeLog.project_id,
            DBProj.name,
            ProjectTimeLog.task_id,
            DBTask.title,
            ProjectTimeLog.category_id,
            DBCat.name,
            ProjectTimeLog.billing_type
        )
    )
    
    res = await db.execute(stmt)
    rows = res.all()
    
    return [
        TimesheetReportRow(
            user_id=row.user_id,
            user_name=row.full_name or row.email,
            project_id=row.project_id,
            project_name=row.project_name,
            task_id=row.task_id,
            task_title=row.task_title,
            category_id=row.category_id,
            category_name=row.category_name,
            billing_type=row.billing_type,
            total_hours=float(row.total_hours)
        )
        for row in rows
    ]


# ==========================================
# 7. IRIS ASSIST (propose-then-confirm)
# ==========================================
# Powers the "Ask IRIS" panel on the Timesheet page -- same propose-then-confirm shape as
# the project task drawer's IRIS panel (see preview_iris_action/execute_iris_action in
# projects.py): /preview plans without touching the DB, /execute only runs after the user
# confirms, and the reply is recorded as an audit-log row scoped to this user so the panel
# has a "recent activity" feed to show without a separate history model.

@router.post("/iris/preview", response_model=IrisPreviewResponse, summary="Ask IRIS what it would do, without executing anything")
async def preview_timesheet_iris_action(
    payload: IrisMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.ai.brain.engine import AIEngine
    from app.ai.brain.exceptions import LLMProviderError, LLMResponseParseError, NoPlanGeneratedError, PlanningError
    from app.ai.schemas.requests import AITaskRunRequest
    from app.middleware.exceptions import ServiceUnavailableError

    engine = AIEngine(db, current_user)
    try:
        plan = await engine.preview(AITaskRunRequest(trigger_type="manual", task_hint=payload.message, input_data={}))
    except NoPlanGeneratedError:
        raise BadRequestError("IRIS couldn't work out a plan for that -- try rephrasing.")
    except LLMResponseParseError:
        raise BadRequestError(
            "IRIS's plan came back malformed -- this can happen when a request needs a lot of "
            "steps at once. Try a more specific or smaller request."
        )
    except PlanningError as e:
        raise BadRequestError(e.message)
    except LLMProviderError as e:
        raise ServiceUnavailableError(e.message)

    return IrisPreviewResponse(
        task_name=plan.task_name,
        response_to_user=plan.response_to_user,
        reasoning=plan.reasoning,
        estimated_record_impact=plan.estimated_record_impact,
        steps=[IrisPlannedStep(tool_name=s.tool_name, parameters=s.parameters, reasoning=s.reasoning) for s in plan.steps],
    )


@router.post("/iris/execute", response_model=AuditLogResponse, summary="Confirm and run an IRIS action for the current user's timesheet")
async def execute_timesheet_iris_action(
    payload: IrisMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.ai.brain.engine import AIEngine
    from app.ai.schemas.requests import AITaskRunRequest
    from app.services.audit import AuditService

    engine = AIEngine(db, current_user)
    result = await engine.run(AITaskRunRequest(
        trigger_type="manual", task_hint=payload.message, input_data={}, confirmed=True,
    ))
    reply_text = result.summary or (f"⚠️ {result.error}" if result.error else "IRIS didn't return a result.")
    entry = await AuditService.record(
        db, entity_type="timesheet_iris", entity_id=current_user.id,
        action="comment", changed_by_user_id=None, new_value=reply_text,
    )
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/iris/activity", response_model=List[AuditLogResponse], summary="Recent IRIS activity on the current user's timesheet")
async def get_timesheet_iris_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.audit import AuditService

    return await AuditService.list_for_entity(db, entity_type="timesheet_iris", entity_id=current_user.id, page=1, page_size=5)
