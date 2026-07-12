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
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import User, UserRole
from app.schemas.hr import (
    DepartmentCreate, DepartmentUpdate, DepartmentListItem, DepartmentResponse,
    DesignationCreate, DesignationUpdate, DesignationListItem, DesignationResponse,
    EmployeeProfileCreate, EmployeeProfileUpdate, EmployeeListItem, EmployeeResponse,
    EmployeeInviteRequest,
    LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeResponse,
    LeaveBalanceUpdate, LeaveBalanceResponse,
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse, LeaveApprovalRequest,
    SalaryComponentCreate, SalaryComponentUpdate, SalaryComponentResponse,
    SalaryStructureCreate, SalaryStructureUpdate, SalaryStructureResponse,
    EmployeeSalaryCreate, EmployeeSalaryUpdate, EmployeeSalaryResponse,
    PayrollRunCreate, PayrollRunUpdate, PayrollRunResponse,
    VariablePayEntryCreate, VariablePayEntryResponse,
    PayslipResponse,
    ChecklistTemplateCreate, ChecklistTemplateUpdate, ChecklistTemplateResponse,
    ChecklistInstanceCreate, ChecklistInstanceResponse,
    ChecklistTaskToggle, EmployeeDocumentResponse, DocumentVerifyRequest, DocumentType,
    HeadcountReportResponse, AttritionReportResponse, LeaveSummaryReportResponse,
    PayrollCostReportResponse
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
    return PaginatedResponse(items=items, total=total, page=(skip // limit) + 1, page_size=limit)


@router.post(
    "/employees",
    response_model=EmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an HR employee profile — for an existing user, or as a pre-invite record (name + email only)",
)
async def create_employee_profile(
    payload: EmployeeProfileCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_employee_profile(db, current_user.organization_id, payload)


@router.post(
    "/employees/{public_id}/invite",
    response_model=EmployeeResponse,
    summary="Invite a pre-invite employee to create their Gravit login",
)
async def invite_employee(
    public_id: uuid.UUID,
    payload: EmployeeInviteRequest,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.invite_employee_to_gravit(db, current_user.organization_id, public_id, payload, current_user)


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
    "/leaves/requests/team",
    response_model=list[LeaveRequestResponse],
    summary="List all leave requests for the manager's team",
)
async def list_team_requests(
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mgr_id = None if current_user.role in HR_ADMIN_ROLES else current_user.id
    return await hr_service.list_leave_requests(
        db, current_user.organization_id, status_filter=status_filter, manager_user_id=mgr_id
    )


@router.get(
    "/leaves/requests/pending",
    response_model=list[LeaveRequestResponse],
    summary="List pending requests for the allocated reporting manager's approval",
)
async def list_pending_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Mirrors Timesheets: any authenticated user may call this and sees only the
    # pending requests of their own direct reports (via reporting_manager_id).
    # HR Admin / Admin see every pending request in the org.
    mgr_id = None if current_user.role in HR_ADMIN_ROLES else current_user.id
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
    summary="Approve or reject a leave request (allocated reporting manager, or HR admin)",
)
async def approve_reject_request(
    public_id: uuid.UUID,
    payload: LeaveApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.approve_reject_leave_request(
        db, current_user.organization_id, public_id, current_user.id, payload,
        is_admin_override=current_user.role in HR_ADMIN_ROLES,
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


# ===========================================================================
# Payroll Components Config
# ===========================================================================

@router.get(
    "/payroll/components",
    response_model=list[SalaryComponentResponse],
    summary="List salary components",
)
async def list_salary_components(
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.list_salary_components(db, current_user.organization_id)


@router.post(
    "/payroll/components",
    response_model=SalaryComponentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a salary component",
)
async def create_salary_component(
    payload: SalaryComponentCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_salary_component(db, current_user.organization_id, payload)


@router.patch(
    "/payroll/components/{id}",
    response_model=SalaryComponentResponse,
    summary="Update a salary component",
)
async def update_salary_component(
    id: int,
    payload: SalaryComponentUpdate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.update_salary_component(db, current_user.organization_id, id, payload)


@router.delete(
    "/payroll/components/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a salary component",
)
async def delete_salary_component(
    id: int,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    await hr_service.delete_salary_component(db, current_user.organization_id, id)


# ===========================================================================
# Salary Structures Config
# ===========================================================================

@router.get(
    "/payroll/structures",
    response_model=list[SalaryStructureResponse],
    summary="List salary structures",
)
async def list_salary_structures(
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.list_salary_structures(db, current_user.organization_id)


@router.post(
    "/payroll/structures",
    response_model=SalaryStructureResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a salary structure template",
)
async def create_salary_structure(
    payload: SalaryStructureCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_salary_structure(db, current_user.organization_id, payload)


@router.patch(
    "/payroll/structures/{id}",
    response_model=SalaryStructureResponse,
    summary="Update a salary structure template",
)
async def update_salary_structure(
    id: int,
    payload: SalaryStructureUpdate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.update_salary_structure(db, current_user.organization_id, id, payload)


@router.delete(
    "/payroll/structures/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a salary structure template",
)
async def delete_salary_structure(
    id: int,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    await hr_service.delete_salary_structure(db, current_user.organization_id, id)


# ===========================================================================
# Employee Salary Allocations
# ===========================================================================

@router.get(
    "/payroll/salaries/{user_id}",
    response_model=Optional[EmployeeSalaryResponse],
    summary="Get employee salary setup",
)
async def get_employee_salary(
    user_id: int,
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.get_employee_salary(db, current_user.organization_id, user_id)


@router.post(
    "/payroll/salaries",
    response_model=EmployeeSalaryResponse,
    summary="Assign or update employee salary setup",
)
async def assign_employee_salary(
    payload: EmployeeSalaryCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_or_update_employee_salary(db, current_user.organization_id, payload)


# ===========================================================================
# Payroll Runs
# ===========================================================================

@router.get(
    "/payroll/runs",
    response_model=list[PayrollRunResponse],
    summary="List monthly payroll runs",
)
async def list_payroll_runs(
    current_user: User = Depends(require_hr_viewer),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.list_payroll_runs(db, current_user.organization_id)


@router.post(
    "/payroll/runs",
    response_model=PayrollRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new monthly payroll run",
)
async def create_payroll_run(
    payload: PayrollRunCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_payroll_run(db, current_user.organization_id, payload)


@router.post(
    "/payroll/runs/{id}/calculate",
    response_model=PayrollRunResponse,
    summary="Execute calculations for a payroll run",
)
async def calculate_payroll(
    id: int,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.run_payroll_calculations(db, current_user.organization_id, id)


@router.post(
    "/payroll/runs/{id}/finalize",
    response_model=PayrollRunResponse,
    summary="Finalize and lock a payroll run",
)
async def finalize_payroll(
    id: int,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.finalize_payroll_run(db, current_user.organization_id, id, current_user.id)


# ===========================================================================
# Variable Pay Entries
# ===========================================================================

@router.post(
    "/payroll/runs/{run_id}/variable-pay",
    response_model=VariablePayEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a variable pay entry to a payroll run",
)
async def create_variable_pay_entry(
    run_id: int,
    payload: VariablePayEntryCreate,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    return await hr_service.create_variable_pay_entry(db, current_user.organization_id, run_id, payload)


@router.delete(
    "/payroll/variable-pay/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a variable pay entry",
)
async def delete_variable_pay_entry(
    id: int,
    current_user: User = Depends(require_hr_admin),
    db: AsyncSession = Depends(get_db),
):
    await hr_service.delete_variable_pay_entry(db, current_user.organization_id, id)


# ===========================================================================
# Payslips & PDF Download
# ===========================================================================

@router.get(
    "/payroll/payslips",
    response_model=list[PayslipResponse],
    summary="List employee payslips",
)
async def list_payslips(
    run_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Viewer roles can list anyone's payslips, standard users only their own
    is_hr_viewer = current_user.role in HR_VIEWER_ROLES
    target_user_id = user_id
    if not is_hr_viewer:
        target_user_id = current_user.id
        
    return await hr_service.list_payslips(db, current_user.organization_id, run_id=run_id, user_id=target_user_id)


@router.get(
    "/payroll/payslips/{public_id}",
    response_model=PayslipResponse,
    summary="Get details of a specific payslip",
)
async def get_payslip(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ps = await hr_service.get_payslip(db, current_user.organization_id, public_id)
    # Check permissions
    is_hr_viewer = current_user.role in HR_VIEWER_ROLES
    if ps.user_id != current_user.id and not is_hr_viewer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return ps


@router.get(
    "/payroll/payslips/{public_id}/pdf",
    summary="Download a print-ready payslip PDF",
)
async def download_payslip_pdf(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ps = await hr_service.get_payslip(db, current_user.organization_id, public_id)
    # Check permissions
    is_hr_viewer = current_user.role in HR_VIEWER_ROLES
    if ps.user_id != current_user.id and not is_hr_viewer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    pdf_buffer = hr_service.generate_payslip_pdf(ps)
    month_str = str(ps.payroll_run.month).zfill(2)
    filename = f"payslip_{ps.user.username}_{ps.payroll_run.year}_{month_str}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ===========================================================================
# Checklists Templates REST (Phase 4: Advanced)
# ===========================================================================

@router.get(
    "/checklists/templates",
    response_model=list[ChecklistTemplateResponse],
    summary="List all active checklist templates",
)
async def get_templates(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Only HR admins, managers can see templates
    if current_user.role not in HR_VIEWER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await hr_service.list_checklist_templates(db, current_user.organization_id)


@router.post(
    "/checklists/templates",
    response_model=ChecklistTemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new checklist template",
)
async def create_template(
    payload: ChecklistTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await hr_service.create_checklist_template(db, current_user.organization_id, payload)


@router.patch(
    "/checklists/templates/{id}",
    response_model=ChecklistTemplateResponse,
    summary="Update an existing checklist template",
)
async def update_template(
    id: int,
    payload: ChecklistTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await hr_service.update_checklist_template(db, current_user.organization_id, id, payload)


@router.delete(
    "/checklists/templates/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a checklist template",
)
async def delete_template(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    await hr_service.delete_checklist_template(db, current_user.organization_id, id)


# ===========================================================================
# Checklists Instances REST (Phase 4: Advanced)
# ===========================================================================

@router.get(
    "/checklists/instances",
    response_model=list[ChecklistInstanceResponse],
    summary="List employee lifecycle checklist instances",
)
async def get_checklist_instances(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Employees can only see their own checklists, HR team can see all
    instances = await hr_service.list_checklist_instances(db, current_user.organization_id)
    if current_user.role in HR_VIEWER_ROLES:
        # Populate names dynamically
        for inst in instances:
            inst.employee_name = inst.user.full_name or inst.user.username
            inst.template_name = inst.template.name
            inst.checklist_type = inst.template.checklist_type
        return instances

    # Filter to only the user's checklist
    filtered = [inst for inst in instances if inst.user_id == current_user.id]
    for inst in filtered:
        inst.employee_name = inst.user.full_name or inst.user.username
        inst.template_name = inst.template.name
        inst.checklist_type = inst.template.checklist_type
    return filtered


@router.post(
    "/checklists/instances",
    response_model=ChecklistInstanceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Launch a lifecycle checklist tracker for an employee",
)
async def launch_checklist(
    payload: ChecklistInstanceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_MANAGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    inst = await hr_service.create_checklist_instance(db, current_user.organization_id, payload)
    inst.employee_name = inst.user.full_name or inst.user.username
    inst.template_name = inst.template.name
    inst.checklist_type = inst.template.checklist_type
    return inst


@router.post(
    "/checklists/instances/{id}/tasks/{task_id}/toggle",
    response_model=ChecklistInstanceResponse,
    summary="Complete/uncomplete a checklist task item",
)
async def toggle_task(
    id: int,
    task_id: str,
    payload: ChecklistTaskToggle,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Only HR Managers/Admins can toggle checklist items
    if current_user.role not in HR_MANAGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    inst = await hr_service.toggle_checklist_task(
        db, current_user.organization_id, id, task_id, payload.completed, current_user.id
    )
    inst.employee_name = inst.user.full_name or inst.user.username
    inst.template_name = inst.template.name
    inst.checklist_type = inst.template.checklist_type
    return inst


@router.delete(
    "/checklists/instances/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a checklist tracker (e.g. one launched by mistake)",
)
async def delete_checklist_instance(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_MANAGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    await hr_service.delete_checklist_instance(db, current_user.organization_id, id)


# ===========================================================================
# Documents Management REST (Phase 4: Advanced)
# ===========================================================================

import os
from fastapi.responses import FileResponse
from app.utils.file_validation import validate_upload


def _hydrate_document(doc: "hr_service.HREmployeeDocument") -> None:
    doc.employee_name = doc.user.full_name or doc.user.username
    if doc.verified_by:
        doc.verified_by_name = doc.verified_by.full_name or doc.verified_by.username
    if doc.uploaded_by:
        doc.uploaded_by_name = doc.uploaded_by.full_name or doc.uploaded_by.username


@router.get(
    "/documents",
    response_model=list[EmployeeDocumentResponse],
    summary="List all employee documents",
)
async def get_documents(
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Employees can only see their own, HR can see all
    is_hr = current_user.role in HR_VIEWER_ROLES
    target_user_id = user_id if is_hr else current_user.id

    docs = await hr_service.list_employee_documents(db, current_user.organization_id, target_user_id)
    for doc in docs:
        _hydrate_document(doc)
    return docs


@router.post(
    "/documents/upload",
    response_model=EmployeeDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload an employee verification document",
)
async def upload_document(
    user_id: int = Form(...),
    document_type: str = Form(...),
    expiry_date: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Permissions checks
    is_hr = current_user.role in HR_MANAGER_ROLES
    if user_id != current_user.id and not is_hr:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if document_type not in [t.value for t in DocumentType]:
        allowed = ", ".join(t.value for t in DocumentType)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid document type. Allowed: {allowed}")

    content = await file.read()
    validate_upload(file, content)

    # Matches the storage convention used by CRM/Projects uploads:
    # uploads/org_{org_id}/user_{user_id}/{uuid}_{original_filename}
    upload_dir = os.path.join("uploads", f"org_{current_user.organization_id}", f"user_{user_id}")
    os.makedirs(upload_dir, exist_ok=True)

    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    # Save to disk
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    # Date parsing
    parsed_date = None
    if expiry_date:
        try:
            from datetime import datetime as dt
            parsed_date = dt.strptime(expiry_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    # Save metadata in DB
    db_doc = await hr_service.create_employee_document(
        db=db,
        org_id=current_user.organization_id,
        user_id=user_id,
        document_type=document_type,
        file_url=file_path,
        file_name=file.filename,
        file_size=len(content),
        expiry_date=parsed_date,
        uploaded_by_id=current_user.id,
    )
    _hydrate_document(db_doc)
    return db_doc


@router.get(
    "/documents/{id}/download",
    summary="Download an employee verification file",
)
async def download_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        sa_select := hr_service.select(hr_service.HREmployeeDocument).where(
            hr_service.and_(
                hr_service.HREmployeeDocument.organization_id == current_user.organization_id,
                hr_service.HREmployeeDocument.id == id,
                hr_service.HREmployeeDocument.is_deleted == False
            )
        )
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    is_hr = current_user.role in HR_VIEWER_ROLES
    if doc.user_id != current_user.id and not is_hr:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if not os.path.exists(doc.file_url):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File on disk not found")

    return FileResponse(
        path=doc.file_url,
        filename=doc.file_name or os.path.basename(doc.file_url)
    )


@router.post(
    "/documents/{id}/verify",
    response_model=EmployeeDocumentResponse,
    summary="Verify an employee document status",
)
async def verify_document(
    id: int,
    payload: DocumentVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_MANAGER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    doc = await hr_service.verify_employee_document(
        db, current_user.organization_id, id, current_user.id, payload.is_verified
    )
    _hydrate_document(doc)
    return doc


@router.delete(
    "/documents/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an employee document",
)
async def delete_document(
    id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        sa_select := hr_service.select(hr_service.HREmployeeDocument).where(
            hr_service.and_(
                hr_service.HREmployeeDocument.organization_id == current_user.organization_id,
                hr_service.HREmployeeDocument.id == id,
                hr_service.HREmployeeDocument.is_deleted == False
            )
        )
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    is_hr = current_user.role in HR_MANAGER_ROLES
    if doc.user_id != current_user.id and not is_hr:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Remove actual file on disk if exists
    try:
        if os.path.exists(doc.file_url):
            os.remove(doc.file_url)
    except Exception:
        pass

    await hr_service.delete_employee_document(db, current_user.organization_id, id)


# ===========================================================================
# HR Analytics REST (Phase 4: Advanced)
# ===========================================================================

@router.get(
    "/analytics/headcount",
    response_model=HeadcountReportResponse,
    summary="Get employee headcount distribution analytics",
)
async def headcount_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_VIEWER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await hr_service.get_headcount_report(db, current_user.organization_id)


@router.get(
    "/analytics/attrition",
    response_model=AttritionReportResponse,
    summary="Get monthly attrition and joiners/leavers trend metrics",
)
async def attrition_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_VIEWER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await hr_service.get_attrition_report(db, current_user.organization_id)


@router.get(
    "/analytics/leaves-summary",
    response_model=LeaveSummaryReportResponse,
    summary="Get average leave balances & duration analytics",
)
async def leaves_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_VIEWER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await hr_service.get_leaves_report(db, current_user.organization_id)


@router.get(
    "/analytics/payroll-costs",
    response_model=PayrollCostReportResponse,
    summary="Get monthly company payroll expenses trends",
)
async def payroll_costs_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in HR_VIEWER_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return await hr_service.get_payroll_report(db, current_user.organization_id)



