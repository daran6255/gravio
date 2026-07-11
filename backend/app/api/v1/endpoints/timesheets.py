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
    TimesheetWeekUnlockRequestCreate, TimesheetWeekUnlockResolve, TimesheetWeekUnlockRequestResponse
)
from app.repositories.timesheet import (
    TimesheetCategoryRepository, OrgHolidayRepository,
    TimesheetUserSettingsRepository, ProjectTimeLogRepository,
    TimesheetWeekUnlockRequestRepository
)
from app.repositories.user import UserRepository
from app.services.timesheet import TimesheetLockService, get_week_bounds, is_weekly_off
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
    today = date.today()
    
    # Validation 1: Future logging prevention
    if payload.log_date > today:
         raise BadRequestError("Future time logging is blocked by default configuration")

    # Validation 1.5: Past-week lock -- a week that already ended without being
    # submitted is locked until the reporting manager grants an unlock request.
    week_start, _ = get_week_bounds(payload.log_date)
    locked, _ = await TimesheetLockService.check_week_access(
        db, current_user.organization_id, current_user.id, week_start
    )
    if locked:
        raise BadRequestError(
            f"The week of {week_start.isoformat()} has already ended and is locked. "
            "Request access from your manager to add entries for that week."
        )

    # Validation 1.6: Submitted/Approved week block -- once a week is submitted or approved,
    # no new entries can be added to it until the manager rejects or revokes it.
    _, week_end = get_week_bounds(payload.log_date)
    has_submitted_or_approved = await ProjectTimeLogRepository.week_has_submitted_or_approved_entry(
        db, current_user.organization_id, current_user.id, week_start, week_end
    )
    if has_submitted_or_approved:
        raise BadRequestError(
            "This week is already submitted or approved. You cannot log additional time "
            "until your manager rejects or revokes it."
        )

    # Validation 2: Retroactive limit check
    user_settings = await TimesheetUserSettingsRepository.get_by_user(db, current_user.organization_id, current_user.id)
    max_days = user_settings.max_retroactive_days if user_settings.max_retroactive_days is not None else 30
    if (today - payload.log_date).days > max_days:
        raise BadRequestError(f"Cannot log time older than {max_days} days retroactively")

    # Validation 3: Holiday blocking -- Sunday is always a holiday, in addition to
    # whatever the org's holiday calendar has configured.
    holiday = await OrgHolidayRepository.check_date(db, current_user.organization_id, payload.log_date)
    is_holiday_override = False
    if holiday or is_weekly_off(payload.log_date):
        if not user_settings.can_log_on_holidays:
            reason = holiday.name if holiday else "Sunday"
            raise BadRequestError(f"Logging time on holidays is blocked ({reason}). Contact your manager for override access.")
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

    # Validation 6: Duplicate entry prevention -- one entry per project/task (or
    # category, for general time) per user per day. Edit the existing entry
    # instead of logging a separate one for the same target.
    existing = await ProjectTimeLogRepository.find_existing_entry(
        db, current_user.organization_id, current_user.id, payload.log_date,
        payload.project_id, payload.task_id, payload.category_id, payload.billing_type
    )
    if existing:
        target_desc = "this task" if payload.task_id else "this project" if payload.project_id else "this category"
        raise BadRequestError(
            f"You already have a time entry for {target_desc} on {payload.log_date.isoformat()}. "
            "Edit the existing entry instead of adding a new one."
        )

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

    # Past-week lock -- only applies to DRAFT entries. A REJECTED entry is exempt:
    # the manager already re-opened it by rejecting, so the user must be able to fix
    # and resubmit it regardless of how long ago that week ended.
    if log.status == TimesheetStatus.DRAFT:
        target_date = payload.log_date if payload.log_date is not None else log.log_date
        week_start, _ = get_week_bounds(target_date)
        locked, _ = await TimesheetLockService.check_week_access(
            db, current_user.organization_id, current_user.id, week_start
        )
        if locked:
            raise BadRequestError(
                f"The week of {week_start.isoformat()} has already ended and is locked. "
                "Request access from your manager to edit entries for that week."
            )

    # Validate 24 Hours cap on update
    if payload.hours is not None:
        current_day_total = await ProjectTimeLogRepository.get_day_total_hours(
            db, current_user.organization_id, current_user.id, log.log_date, exclude_log_id=log.id
        )
        if current_day_total + payload.hours > 24.0:
            raise BadRequestError(f"Logging {payload.hours}h would exceed the maximum limit of 24 hours per day (already logged {current_day_total}h)")

    # Duplicate entry prevention -- same rule as create, applied to whatever the
    # entry's project/task/category/date will be *after* this update (fields not
    # included in the payload keep their current stored value).
    fields_set = payload.model_fields_set
    target_project_id = payload.project_id if "project_id" in fields_set else log.project_id
    target_task_id = payload.task_id if "task_id" in fields_set else log.task_id
    target_category_id = payload.category_id if "category_id" in fields_set else log.category_id
    target_log_date = payload.log_date if "log_date" in fields_set else log.log_date
    target_billing_type = payload.billing_type if "billing_type" in fields_set else log.billing_type
    existing = await ProjectTimeLogRepository.find_existing_entry(
        db, current_user.organization_id, current_user.id, target_log_date,
        target_project_id, target_task_id, target_category_id, target_billing_type, exclude_log_id=log.id
    )
    if existing:
        target_desc = "this task" if target_task_id else "this project" if target_project_id else "this category"
        raise BadRequestError(
            f"You already have a time entry for {target_desc} on {target_log_date.isoformat()}. "
            "Edit that entry instead of creating a duplicate."
        )

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

    # Same past-week lock exemption as update: only DRAFT entries are affected.
    if log.status == TimesheetStatus.DRAFT:
        week_start, _ = get_week_bounds(log.log_date)
        locked, _ = await TimesheetLockService.check_week_access(
            db, current_user.organization_id, current_user.id, week_start
        )
        if locked:
            raise BadRequestError(
                f"The week of {week_start.isoformat()} has already ended and is locked. "
                "Request access from your manager to delete entries for that week."
            )

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

    # Past-week lock -- once a week has ended, it can only be submitted if the
    # manager granted an unlock request for it.
    locked, grant = await TimesheetLockService.check_week_access(
        db, current_user.organization_id, current_user.id, payload.start_date
    )
    if locked:
        raise BadRequestError(
            f"The week of {payload.start_date.isoformat()} has already ended and is locked for "
            "submission. Request access from your manager to submit it."
        )

    rowcount = await ProjectTimeLogRepository.submit_week(
        db, organization_id=current_user.organization_id, user_id=current_user.id,
        start_date=payload.start_date, end_date=payload.end_date
    )
    if rowcount == 0:
        raise BadRequestError("No draft or rejected time entries found to submit for the selected week")

    # The unlock grant that got us past the lock check above is one-shot -- consume
    # it now that the submission actually went through.
    if grant is not None:
        await TimesheetWeekUnlockRequestRepository.consume(db, grant)

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
    """Retrieve submitted timesheet entries for approval, routed strictly by reporting
    manager -- each manager (admin or not) only sees their own direct reports' entries,
    matching the same reporting_manager_id rule enforced on approve/reject/revoke."""
    conditions = [
        ProjectTimeLog.organization_id == current_user.organization_id,
        ProjectTimeLog.log_date >= start_date,
        ProjectTimeLog.log_date <= end_date,
        ProjectTimeLog.is_deleted.is_(False)
    ]

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

@router.post("/users/{target_user_id}/approve")
async def approve_user_week(
    target_user_id: int,
    payload: TimesheetSubmitWeekRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Approve a user's submitted logs for a week. Only that user's allocated
    reporting manager may approve -- admin does not grant a blanket bypass here."""
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
    """Reject a user's submitted logs for a week with a reason. Only that user's
    allocated reporting manager may reject."""
    if not payload.rejection_note or not payload.rejection_note.strip():
        raise BadRequestError("Rejection reason is required")

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
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Revoke a wrongly submitted or approved week back to draft, so the employee can
    fix and resubmit it. Only that user's allocated reporting manager may revoke.
    Unlike Reject, no note is required -- this is for "that shouldn't have gone
    through" corrections rather than a formal quality rejection.

    If the week has already ended, revoking it would otherwise immediately re-lock it
    behind the past-week lock -- so this also auto-grants an unlock for that week.
    """
    target_user = await UserRepository.get_by_id(db, target_user_id)
    if not target_user or target_user.reporting_manager_id != current_user.id:
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
    if current_user.reporting_manager_id is None:
        raise BadRequestError("You cannot request a week unlock without an assigned Reporting Manager. Set one in your Profile Settings.")

    week_start, week_end = get_week_bounds(payload.week_start_date)
    if week_end != payload.week_end_date:
        raise BadRequestError("week_start_date and week_end_date must be the Monday and Sunday of the same week")

    today_monday, _ = get_week_bounds(date.today())
    if week_start >= today_monday:
        raise BadRequestError("Only past weeks can be requested for unlock -- the current week is never locked")

    existing = await TimesheetWeekUnlockRequestRepository.get_pending_for_week(
        db, current_user.organization_id, current_user.id, week_start
    )
    if existing:
        raise BadRequestError("You already have a pending unlock request for this week")

    active_grant = await TimesheetWeekUnlockRequestRepository.get_active_grant(
        db, current_user.organization_id, current_user.id, week_start
    )
    if active_grant:
        raise BadRequestError("This week is already unlocked -- you can edit and submit it now")

    req = await TimesheetWeekUnlockRequestRepository.create(
        db,
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        week_start_date=week_start,
        week_end_date=week_end,
        reason=payload.reason,
    )
    await db.commit()
    return req

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
    """Requests routed to this manager -- their own direct reports only."""
    return await TimesheetWeekUnlockRequestRepository.list_for_manager(
        db, current_user.organization_id, current_user.id
    )

@router.post("/week-unlock-requests/{request_id}/approve", response_model=TimesheetWeekUnlockRequestResponse)
async def approve_week_unlock(
    request_id: int,
    payload: TimesheetWeekUnlockResolve,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Grant a pending unlock request -- the employee can then edit/submit that week once.
    Only that user's allocated reporting manager may resolve it."""
    req = await TimesheetWeekUnlockRequestRepository.get_by_id(db, request_id)
    if not req or req.organization_id != current_user.organization_id:
        raise NotFoundError("Unlock request not found")

    target_user = await UserRepository.get_by_id(db, req.user_id)
    if not target_user or target_user.reporting_manager_id != current_user.id:
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
    """Deny a pending unlock request. Only that user's allocated reporting manager may resolve it."""
    req = await TimesheetWeekUnlockRequestRepository.get_by_id(db, request_id)
    if not req or req.organization_id != current_user.organization_id:
        raise NotFoundError("Unlock request not found")

    target_user = await UserRepository.get_by_id(db, req.user_id)
    if not target_user or target_user.reporting_manager_id != current_user.id:
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
