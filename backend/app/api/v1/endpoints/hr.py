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
