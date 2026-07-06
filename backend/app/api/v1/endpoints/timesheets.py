import uuid
from datetime import date, timedelta, datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.timesheet import TimesheetStatus, TimesheetBillingType, HolidayType, ProjectTimeLog
from app.models.project import Project, ProjectTask
from app.schemas.timesheet import (
    TimesheetCategoryCreate, TimesheetCategoryUpdate, TimesheetCategoryResponse,
    OrgHolidayCreate, OrgHolidayUpdate, OrgHolidayResponse,
    TimesheetUserSettingsUpdate, TimesheetUserSettingsResponse,
    ProjectTimeLogCreate, ProjectTimeLogUpdate, ProjectTimeLogResponse,
    TimesheetSubmitWeekRequest, TimesheetApproveRejectRequest, TimesheetReportRow
)
from app.repositories.timesheet import (
    TimesheetCategoryRepository, OrgHolidayRepository,
    TimesheetUserSettingsRepository, ProjectTimeLogRepository
)
from app.repositories.user import UserRepository
from app.middleware.exceptions import NotFoundError, BadRequestError, ForbiddenError

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
    return await TimesheetCategoryRepository.list_for_user(
        db, organization_id=current_user.organization_id, user_id=current_user.id
    )

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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Add a new holiday to the organization calendar (Admin/Manager only)."""
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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Edit an existing holiday (Admin/Manager only)."""
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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Delete a holiday (Admin/Manager only)."""
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
    """Check if a specific date is a configured holiday."""
    holiday = await OrgHolidayRepository.check_date(db, organization_id=current_user.organization_id, check_date=check_date)
    return {
        "is_holiday": holiday is not None,
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
    today = date.today()
    
    # Validation 1: Future logging prevention
    if payload.log_date > today:
         raise BadRequestError("Future time logging is blocked by default configuration")

    # Validation 2: Retroactive limit check
    user_settings = await TimesheetUserSettingsRepository.get_by_user(db, current_user.organization_id, current_user.id)
    max_days = user_settings.max_retroactive_days if user_settings.max_retroactive_days is not None else 30
    if (today - payload.log_date).days > max_days:
        raise BadRequestError(f"Cannot log time older than {max_days} days retroactively")

    # Validation 3: Holiday blocking
    holiday = await OrgHolidayRepository.check_date(db, current_user.organization_id, payload.log_date)
    is_holiday_override = False
    if holiday:
        if not user_settings.can_log_on_holidays:
            raise BadRequestError("Logging time on holidays is blocked. Contact your manager for override access.")
        is_holiday_override = True

    # Validation 4: 24 Hours cap verification
    current_day_total = await ProjectTimeLogRepository.get_day_total_hours(
        db, current_user.organization_id, current_user.id, payload.log_date
    )
    if current_day_total + payload.hours > 24.0:
        raise BadRequestError(f"Logging {payload.hours}h would exceed the maximum limit of 24 hours per day (already logged {current_day_total}h)")

    # Validation 5: Project & Task availability
    if payload.project_id:
        proj = await db.get(Project, payload.project_id)
        if not proj or proj.organization_id != current_user.organization_id:
            raise NotFoundError("Project not found")
        if payload.task_id:
            tsk = await db.get(ProjectTask, payload.task_id)
            if not tsk or tsk.project_id != payload.project_id:
                raise NotFoundError("Task not found under the selected project")

    log = await ProjectTimeLogRepository.create(
        db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        project_id=payload.project_id,
        task_id=payload.task_id,
        category_id=payload.category_id,
        log_date=payload.log_date,
        hours=payload.hours,
        notes=payload.notes,
        billing_type=payload.billing_type,
        is_holiday_override=is_holiday_override
    )
    await db.commit()
    stmt = (
        select(ProjectTimeLog)
        .options(
            selectinload(ProjectTimeLog.project),
            selectinload(ProjectTimeLog.task),
            selectinload(ProjectTimeLog.category),
            selectinload(ProjectTimeLog.user)
        )
        .where(ProjectTimeLog.id == log.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()

@router.patch("/{log_id}", response_model=ProjectTimeLogResponse)
async def update_time_log(
    log_id: int,
    payload: ProjectTimeLogUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a draft or rejected time entry."""
    log = await ProjectTimeLogRepository.get_by_id(db, log_id)
    if not log or log.organization_id != current_user.organization_id:
        raise NotFoundError("Time log entry not found")
        
    if log.user_id != current_user.id:
        raise ForbiddenError("You cannot modify other users' time logs")

    if log.status not in [TimesheetStatus.DRAFT, TimesheetStatus.REJECTED]:
        raise BadRequestError("You can only modify draft or rejected timesheet entries")

    # Validate 24 Hours cap on update
    if payload.hours is not None:
        current_day_total = await ProjectTimeLogRepository.get_day_total_hours(
            db, current_user.organization_id, current_user.id, log.log_date, exclude_log_id=log.id
        )
        if current_day_total + payload.hours > 24.0:
            raise BadRequestError(f"Logging {payload.hours}h would exceed the maximum limit of 24 hours per day (already logged {current_day_total}h)")

    updated = await ProjectTimeLogRepository.update(db, log, **payload.model_dump(exclude_unset=True))
    await db.commit()
    stmt = (
        select(ProjectTimeLog)
        .options(
            selectinload(ProjectTimeLog.project),
            selectinload(ProjectTimeLog.task),
            selectinload(ProjectTimeLog.category),
            selectinload(ProjectTimeLog.user)
        )
        .where(ProjectTimeLog.id == updated.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()

@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_time_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete a draft or rejected time entry."""
    log = await ProjectTimeLogRepository.get_by_id(db, log_id)
    if not log or log.organization_id != current_user.organization_id:
        raise NotFoundError("Time log entry not found")
        
    if log.user_id != current_user.id:
        raise ForbiddenError("You cannot delete other users' time logs")

    if log.status not in [TimesheetStatus.DRAFT, TimesheetStatus.REJECTED]:
        raise BadRequestError("You can only delete draft or rejected timesheet entries")

    await ProjectTimeLogRepository.delete(db, log)
    await db.commit()

@router.post("/submit-week")
async def submit_weekly_timesheet(
    payload: TimesheetSubmitWeekRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit draft/rejected time entries in a week to the designated reporting manager."""
    # Ensure reporting manager is assigned
    if current_user.reporting_manager_id is None:
        raise BadRequestError("You cannot submit timesheets without an assigned Reporting Manager. Set one in your Profile Settings.")

    rowcount = await ProjectTimeLogRepository.submit_week(
        db, organization_id=current_user.organization_id, user_id=current_user.id,
        start_date=payload.start_date, end_date=payload.end_date
    )
    if rowcount == 0:
        raise BadRequestError("No draft or rejected time entries found to submit for the selected week")

    await db.commit()
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
    """Retrieve submitted timesheet entries for approval, routed by reporting manager."""
    conditions = [
        ProjectTimeLog.organization_id == current_user.organization_id,
        ProjectTimeLog.log_date >= start_date,
        ProjectTimeLog.log_date <= end_date,
        ProjectTimeLog.is_deleted.is_(False)
    ]
    
    # Managers are restricted to their direct reports unless they are ADMIN
    if current_user.role != UserRole.ADMIN:
        # Fetch direct reports
        stmt_reports = select(User.id).where(User.reporting_manager_id == current_user.id)
        report_ids_res = await db.execute(stmt_reports)
        report_ids = [r[0] for r in report_ids_res.all()]
        # Add current user themselves as fallback or restrict query
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

@router.post("/users/{target_user_id}/approve")
async def approve_user_week(
    target_user_id: int,
    payload: TimesheetSubmitWeekRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Approve a user's submitted logs for a week."""
    # Validation: Manager check
    if current_user.role != UserRole.ADMIN:
        target_user = await UserRepository.get_by_id(db, target_user_id)
        if not target_user or target_user.reporting_manager_id != current_user.id:
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
    """Reject a user's submitted logs for a week with a reason."""
    if not payload.rejection_note or not payload.rejection_note.strip():
        raise BadRequestError("Rejection reason is required")

    if current_user.role != UserRole.ADMIN:
        target_user = await UserRepository.get_by_id(db, target_user_id)
        if not target_user or target_user.reporting_manager_id != current_user.id:
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
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Reset an approved week back to draft (Admin only)."""
    unapproved = await ProjectTimeLogRepository.unapprove_week(
        db, organization_id=current_user.organization_id, user_id=target_user_id,
        start_date=payload.start_date, end_date=payload.end_date
    )
    await db.commit()
    return {"success": True, "unapproved_count": unapproved}


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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Aggregate logged hours by User/Project/Task/Category for timesheet auditing (Admins/Managers only)."""
    conditions = [
        ProjectTimeLog.organization_id == current_user.organization_id,
        ProjectTimeLog.log_date >= start_date,
        ProjectTimeLog.log_date <= end_date,
        ProjectTimeLog.is_deleted.is_(False)
    ]
    if project_id:
        conditions.append(ProjectTimeLog.project_id == project_id)
    if user_id:
        conditions.append(ProjectTimeLog.user_id == user_id)
    if billing_type:
        conditions.append(ProjectTimeLog.billing_type == billing_type)

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
