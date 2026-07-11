"""HR Module — REST API endpoints (Phase 1: Foundation)

Routes:
  Departments:    GET/POST /hr/departments
                  GET/PATCH/DELETE /hr/departments/{id}
  Designations:   GET/POST /hr/designations
                  PATCH/DELETE /hr/designations/{id}
  Employees:      GET/POST /hr/employees
                  GET/PATCH /hr/employees/{public_id}
"""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import User, UserRole
from app.schemas.hr import (
    DepartmentCreate, DepartmentUpdate, DepartmentListItem, DepartmentResponse,
    DesignationCreate, DesignationUpdate, DesignationListItem, DesignationResponse,
    EmployeeProfileCreate, EmployeeProfileUpdate, EmployeeListItem, EmployeeResponse,
    LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeResponse,
    LeaveBalanceUpdate, LeaveBalanceResponse,
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse, LeaveApprovalRequest
)
from app.schemas.common import PaginatedResponse
from app.services import hr as hr_service

router = APIRouter(prefix="/hr", tags=["HR Module"])

# Role groups
HR_ADMIN_ROLES = [UserRole.ADMIN, UserRole.HR_ADMIN]
HR_MANAGER_ROLES = [UserRole.ADMIN, UserRole.HR_ADMIN, UserRole.HR_MANAGER]
HR_VIEWER_ROLES = [UserRole.ADMIN, UserRole.HR_ADMIN, UserRole.HR_MANAGER, UserRole.LEADERSHIP, UserRole.MANAGER]

require_hr_admin = require_roles(HR_ADMIN_ROLES)
require_hr_manager = require_roles(HR_MANAGER_ROLES)
require_hr_viewer = require_roles(HR_VIEWER_ROLES)


# ===========================================================================
# Departments
# ===========================================================================

@router.get(
    "/departments",
    response_model=list[DepartmentListItem],
    summary="List departments",
)
async def list_departments(
    include_inactive: bool = Query(False),
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.list_departments(
        db, current_user.organization_id, include_inactive=include_inactive
    )


@router.post(
    "/departments",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a department",
)
async def create_department(
    payload: DepartmentCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_department(db, current_user.organization_id, payload)


@router.get(
    "/departments/{department_id}",
    response_model=DepartmentResponse,
    summary="Get a department by ID",
)
async def get_department(
    department_id: int,
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.get_department(db, current_user.organization_id, department_id)


@router.patch(
    "/departments/{department_id}",
    response_model=DepartmentResponse,
    summary="Update a department",
)
async def update_department(
    department_id: int,
    payload: DepartmentUpdate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.update_department(db, current_user.organization_id, department_id, payload)


@router.delete(
    "/departments/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a department",
)
async def delete_department(
    department_id: int,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    await hr_service.delete_department(db, current_user.organization_id, department_id)


# ===========================================================================
# Designations
# ===========================================================================

@router.get(
    "/designations",
    response_model=list[DesignationListItem],
    summary="List designations (optionally filtered by department)",
)
async def list_designations(
    department_id: Optional[int] = Query(None),
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.list_designations(db, current_user.organization_id, department_id)


@router.post(
    "/designations",
    response_model=DesignationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a designation",
)
async def create_designation(
    payload: DesignationCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_designation(db, current_user.organization_id, payload)


@router.patch(
    "/designations/{designation_id}",
    response_model=DesignationResponse,
    summary="Update a designation",
)
async def update_designation(
    designation_id: int,
    payload: DesignationUpdate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.update_designation(db, current_user.organization_id, designation_id, payload)


@router.delete(
    "/designations/{designation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a designation",
)
async def delete_designation(
    designation_id: int,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    await hr_service.delete_designation(db, current_user.organization_id, designation_id)


# ===========================================================================
# Employees
# ===========================================================================

@router.get(
    "/employees",
    response_model=PaginatedResponse[EmployeeListItem],
    summary="List employees in the directory",
)
async def list_employees(
    department_id: Optional[int] = Query(None),
    employee_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    items, total = await hr_service.list_employees(
        db,
        org_id=current_user.organization_id,
        department_id=department_id,
        status_filter=employee_status,
        search=search,
        skip=skip,
        limit=limit,
    )
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.post(
    "/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an HR employee profile for an existing user",
)
async def create_employee_profile(
    payload: EmployeeProfileCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_employee_profile(db, current_user.organization_id, payload)


@router.get(
    "/employees/{public_id}",
    response_model=EmployeeResponse,
    summary="Get a full employee profile",
)
async def get_employee(
    public_id: uuid.UUID,
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.get_employee_by_public_id(db, current_user.organization_id, public_id)


@router.patch(
    "/employees/{public_id}",
    response_model=EmployeeResponse,
    summary="Update an employee HR profile",
)
async def update_employee(
    public_id: uuid.UUID,
    payload: EmployeeProfileUpdate,
    current_user: User = Depends(require_hr_manager),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.update_employee_profile(db, current_user.organization_id, public_id, payload)


@router.get(
    "/employees/by-user/{user_id}",
    response_model=EmployeeResponse,
    summary="Get employee profile by user ID",
)
async def get_employee_by_user(
    user_id: int,
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.get_employee_by_user_id(db, current_user.organization_id, user_id)


# ===========================================================================
# Leave Types Configuration
# ===========================================================================

@router.get(
    "/leave-types",
    response_model=list[LeaveTypeResponse],
    summary="List configure leave types",
)
async def list_leave_types(
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.list_leave_types(
        db, current_user.organization_id, include_inactive=include_inactive
    )


@router.post(
    "/leave-types",
    response_model=LeaveTypeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a leave type configuration",
)
async def create_leave_type(
    payload: LeaveTypeCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_leave_type(db, current_user.organization_id, payload)


@router.patch(
    "/leave-types/{id}",
    response_model=LeaveTypeResponse,
    summary="Update a leave type configuration",
)
async def update_leave_type(
    id: int,
    payload: LeaveTypeUpdate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.update_leave_type(db, current_user.organization_id, id, payload)


@router.delete(
    "/leave-types/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a leave type configuration",
)
async def delete_leave_type(
    id: int,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    await hr_service.delete_leave_type(db, current_user.organization_id, id)


# ===========================================================================
# Leave Balances
# ===========================================================================

@router.get(
    "/leaves/balances",
    response_model=list[LeaveBalanceResponse],
    summary="Get current user's leave balances",
)
async def get_my_balances(
    year: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    yr = year or datetime.utcnow().year
    return await hr_service.get_user_balances(db, current_user.organization_id, current_user.id, yr)


@router.get(
    "/leaves/balances/{user_id}",
    response_model=list[LeaveBalanceResponse],
    summary="Get specific employee's leave balances",
)
async def get_employee_balances(
    user_id: int,
    year: Optional[int] = Query(None),
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    yr = year or datetime.utcnow().year
    return await hr_service.get_user_balances(db, current_user.organization_id, user_id, yr)


@router.patch(
    "/leaves/balances/{id}",
    response_model=LeaveBalanceResponse,
    summary="Update leave balance tracker (admin only)",
)
async def update_leave_balance(
    id: int,
    payload: LeaveBalanceUpdate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.update_leave_balance(db, current_user.organization_id, id, payload)


# ===========================================================================
# Leave Requests
# ===========================================================================

@router.get(
    "/leaves/requests",
    response_model=list[LeaveRequestResponse],
    summary="Get personal leave requests history",
)
async def get_my_requests(
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.list_leave_requests(
        db, current_user.organization_id, user_id=current_user.id, status_filter=status_filter
    )


@router.post(
    "/leaves/requests",
    response_model=LeaveRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a leave request",
)
async def create_leave_request(
    payload: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_leave_request(db, current_user.organization_id, current_user.id, payload)


@router.get(
    "/leaves/requests/pending",
    response_model=list[LeaveRequestResponse],
    summary="List pending requests for manager's approval",
)
async def list_pending_requests(
    current_user: User = Depends(require_hr_manager),
    db: AsyncSession = Depends(get_db),
):
    # Manager sees pending requests of their direct reports. HR Admin sees all pending requests.
    mgr_id = None if UserRole.HR_ADMIN in [current_user.role, UserRole.ADMIN] else current_user.id
    return await hr_service.list_leave_requests(
        db, current_user.organization_id, status_filter="pending", manager_user_id=mgr_id
    )


@router.get(
    "/leaves/requests/{public_id}",
    response_model=LeaveRequestResponse,
    summary="Get leave request details",
)
async def get_leave_request(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    req = await hr_service.get_leave_request(db, current_user.organization_id, public_id)
    # Only owner or viewer can see details
    is_hr_viewer = current_user.role in [UserRole.ADMIN, UserRole.HR_ADMIN, UserRole.HR_MANAGER, UserRole.LEADERSHIP, UserRole.MANAGER]
    if req.user_id != current_user.id and not is_hr_viewer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return req


@router.post(
    "/leaves/requests/{public_id}/approve-reject",
    response_model=LeaveRequestResponse,
    summary="Approve or reject a leave request (manager/admin only)",
)
async def approve_reject_request(
    public_id: uuid.UUID,
    payload: LeaveApprovalRequest,
    current_user: User = Depends(require_hr_manager),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.approve_reject_leave_request(
        db, current_user.organization_id, public_id, current_user.id, payload
    )


@router.post(
    "/leaves/requests/{public_id}/cancel",
    response_model=LeaveRequestResponse,
    summary="Cancel a submitted leave request",
)
async def cancel_request(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.cancel_leave_request(db, current_user.organization_id, public_id, current_user.id)

