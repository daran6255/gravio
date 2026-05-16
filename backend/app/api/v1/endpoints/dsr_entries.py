"""DSR Entries API endpoints"""

from datetime import date
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.dsr_entry import DSRStatus
from app.schemas.dsr_entry import (
    DSREntryCreate,
    DSREntryUpdate,
    DSREntryResponse,
    DSREntryListResponse,
    DSRGrantPreviousDayPermission,
    DSRSendReminder,
    DSRMissingUserResponse,
    DSRApproveEntry,
    DSRRejectEntry,
    DSRRevokeEntry,
    DSRUserStatsSummary,
)
from app.schemas.dsr_permission_request import (
    DSRPermissionRequestCreate,
    DSRPermissionRequestUpdate,
    DSRPermissionRequestResponse,
    DSRPermissionRequestListResponse,
)
from app.services.dsr_service import DSRService

router = APIRouter()


# ---------------------------------------------------------------
# Entry CRUD (all authenticated users)
# ---------------------------------------------------------------

@router.post("/entries", response_model=DSREntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    data: DSREntryCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a DSR entry for today (all roles).
    Submitting for a past date requires admin prior permission.
    """
    service = DSRService(db)
    entry = await service.create_entry(data, current_user)
    await db.commit()
    await db.refresh(entry)
    return entry




@router.put("/entries/{public_id}", response_model=DSREntryResponse)
async def update_entry(
    public_id: UUID,
    data: DSREntryUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Update a DRAFT DSR entry (owner only)."""
    service = DSRService(db)
    entry = await service.update_entry(public_id, data, current_user)
    await db.commit()
    return entry


@router.post("/entries/{public_id}/submit", response_model=DSREntryResponse)
async def submit_entry(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Submit a DRAFT DSR entry, changing status to SUBMITTED (owner only)."""
    service = DSRService(db)
    entry = await service.submit_entry(public_id, current_user)
    await db.commit()
    return entry


@router.get("/entries/me", response_model=DSREntryListResponse)
async def get_my_entries(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    status: Optional[DSRStatus] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Get my own DSR entry history (all roles)."""
    service = DSRService(db)
    items, total = await service.get_my_entries(
        current_user,
        skip=skip,
        limit=limit,
        date_from=date_from,
        date_to=date_to,
        status=status,
        search=search,
    )
    return DSREntryListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/entries/pending-approval", response_model=DSREntryListResponse)
async def get_pending_approval(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin: list all SUBMITTED DSR entries awaiting review, ordered oldest-first.
    These are the entries that need admin action (approve or reject).
    """
    service = DSRService(db)
    items, total = await service.get_pending_approval(current_user, skip=skip, limit=limit)
    return DSREntryListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/entries/calendar-status")
async def get_calendar_status(
    date_from: date = Query(...),
    date_to: date = Query(...),
    user_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get DSR and Leave status for a user within a range (for calendar)."""
    service = DSRService(db)
    
    # Permission check: Only Admin/Manager can view others' calendar
    target_user_id = current_user.id
    if user_id is not None and current_user.role in (UserRole.ADMIN, UserRole.MANAGER):
        target_user_id = user_id
    
    # 1. Get DSR entries
    entries, _ = await service.repo.get_entries_by_user(
        target_user_id, limit=31, date_from=date_from, date_to=date_to
    )
    
    # 2. Get Leave applications
    leaves = await service.get_calendar_leave_data(target_user_id, date_from, date_to)
    
    return {
        "entries": [
            {
                "report_date": e.report_date,
                "status": e.status,
                "is_leave": e.is_leave,
                "admin_notes": e.admin_notes
            }
            for e in entries
        ],
        "leaves": leaves
    }


@router.get("/entries/my-stats")
async def get_my_dsr_stats(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """
    User: get a count summary of their own DSR entries by status.
    Returns: pending_approval, action_required (rejected), approved counts.
    """
    service = DSRService(db)
    return await service.repo.count_by_status_for_user(current_user.id)


@router.get("/entries/my-summary", response_model=DSRUserStatsSummary)
async def get_my_stats_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a summary of hours (month/total), leaves, and missed days for the current user."""
    service = DSRService(db)
    return await service.get_user_stats_summary(current_user)


@router.get("/entries/{public_id}", response_model=DSREntryResponse)
async def get_entry(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Get a single DSR entry detail (owner or Admin)."""
    service = DSRService(db)
    return await service.get_entry(public_id, current_user)


@router.delete("/entries/{public_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    public_id: UUID,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Delete a DSR entry (owner can delete DRAFT; Admin can delete any)."""
    service = DSRService(db)
    await service.delete_entry(public_id, current_user)
    await db.commit()


# ---------------------------------------------------------------
# Admin-only
# ---------------------------------------------------------------

@router.get("/entries", response_model=DSREntryListResponse)
async def get_all_entries(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    user_id: Optional[int] = Query(default=None, description="Filter by internal user_id"),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
    status: Optional[DSRStatus] = Query(default=None),
    search: Optional[str] = Query(default=None, description="Search by user name or username"),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """List all users' DSR entries with filters (Admin only)."""
    service = DSRService(db)
    items, total = await service.get_all_entries(
        current_user,
        skip=skip,
        limit=limit,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        status=status,
        search=search,
    )
    return DSREntryListResponse(items=items, total=total, skip=skip, limit=limit)


@router.post("/admin/grant-permission", response_model=DSREntryResponse)
async def grant_previous_day_permission(
    data: DSRGrantPreviousDayPermission,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin grants a user permission to submit a DSR for a past date.
    Creates an empty DRAFT entry with the permission flag set.
    """
    service = DSRService(db)
    entry = await service.grant_previous_day_permission(data, current_user)
    await db.commit()
    return entry


@router.get("/admin/missing", response_model=list[DSRMissingUserResponse])
async def get_missing_dsr_users(
    report_date: Optional[date] = Query(default=None, description="Defaults to today"),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of active users who have NOT submitted their DSR for the given date (Admin only).
    Defaults to today's date.
    """
    from datetime import date as date_cls
    target_date = report_date or date_cls.today()

    service = DSRService(db)
    missing_users = await service.get_missing_dsr_users(target_date, current_user)

    return [
        DSRMissingUserResponse(
            user_id=u.id,
            public_id=u.public_id,
            full_name=u.full_name,
            username=u.username,
            email=u.email,
            role=u.role.value,
            report_date=target_date,
        )
        for u in missing_users
    ]


@router.post("/admin/send-reminders", status_code=status.HTTP_200_OK)
async def send_reminders(
    data: DSRSendReminder,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin sends DSR submission reminders to specified users for a given date.
    Returns a summary of dispatched reminders.
    """
    service = DSRService(db)
    return await service.send_reminders(data, current_user)

# ---------------------------------------------------------------
# Permission Requests
# ---------------------------------------------------------------

@router.post("/permissions/request", response_model=DSRPermissionRequestResponse)
async def create_permission_request(
    data: DSRPermissionRequestCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """User requests permission to submit a DSR for a past date."""
    service = DSRService(db)
    request = await service.create_permission_request(data, current_user)
    await db.commit()
    return await service.get_permission_request(request.public_id)

@router.get("/permissions/requests", response_model=DSRPermissionRequestListResponse)
async def get_permission_requests(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    user_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """List permission requests (Users see their own; Admins see all)."""
    service = DSRService(db)
    from app.models.dsr_permission_request import DSRPermissionStatus
    req_status = DSRPermissionStatus(status) if status else None
    
    items, total = await service.get_permission_requests(
        current_user, skip=skip, limit=limit, user_id=user_id, status=req_status, search=search
    )
    return DSRPermissionRequestListResponse(items=items, total=total)

@router.put("/permissions/requests/{public_id}", response_model=DSRPermissionRequestResponse)
async def handle_permission_request(
    public_id: UUID,
    data: DSRPermissionRequestUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Admin grants or rejects a permission request."""
    service = DSRService(db)
    request = await service.handle_permission_request(public_id, data, current_user)
    await db.commit()
    return await service.get_permission_request(public_id)
@router.get("/permissions/stats")
async def get_permission_stats(
    user_id: Optional[int] = Query(default=None),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.TRAINER, UserRole.SOURCING, UserRole.PLACEMENT, UserRole.COUNSELOR, UserRole.PROJECT_COORDINATOR, UserRole.DEVELOPER, UserRole.MARKETING])),
    db: AsyncSession = Depends(get_db),
):
    """Get summary stats of permission requests (raised vs approved)."""
    service = DSRService(db)
    return await service.get_permission_stats(current_user, user_id=user_id)


# ---------------------------------------------------------------
# DSR Review Queue (Admin)
# ---------------------------------------------------------------



@router.post("/entries/{public_id}/approve", response_model=DSREntryResponse)
async def approve_entry(
    public_id: UUID,
    data: DSRApproveEntry,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin approves a SUBMITTED DSR entry.
    - Optional admin_notes can be sent as feedback.
    - Transition: SUBMITTED → APPROVED (terminal state).
    """
    service = DSRService(db)
    entry = await service.approve_entry(public_id, data, current_user)
    await db.commit()
    return await service.get_entry(entry.public_id, current_user)


@router.post("/entries/{public_id}/reject", response_model=DSREntryResponse)
async def reject_entry(
    public_id: UUID,
    data: DSRRejectEntry,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin rejects a SUBMITTED DSR entry with a mandatory reason.
    - reason field is mandatory (min 10 chars).
    - Transition: SUBMITTED → DRAFT (user must fix and re-submit).
    """
    service = DSRService(db)
    entry = await service.reject_entry(public_id, data, current_user)
    await db.commit()
    return await service.get_entry(entry.public_id, current_user)


@router.post("/entries/{public_id}/revoke", response_model=DSREntryResponse)
async def revoke_entry(
    public_id: UUID,
    data: DSRRevokeEntry,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin revokes an APPROVED or SUBMITTED DSR entry.
    - Status transitions back to DRAFT.
    - Hour actuals are reversed if previously approved.
    """
    service = DSRService(db)
    entry = await service.revoke_entry(public_id, data, current_user)
    await db.commit()
    return await service.get_entry(entry.public_id, current_user)


@router.get("/permissions/pending-submissions")
async def get_pending_submissions(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
):
    """
    Admin: list users who have a GRANTED permission request but have not yet submitted their DSR.
    Returns an 'abandoned' list — useful for follow-up reminders.
    """
    service = DSRService(db)
    return await service.get_pending_submissions(current_user)


