"""HR Module — Service layer (Phase 1: Foundation)

Handles Departments, Designations, and Employee Profiles.
All queries are org-scoped via organization_id.
"""

from datetime import date, datetime, timedelta
import uuid
from typing import Optional
from io import BytesIO
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.hr import (
    HRDepartment, HRDesignation, HREmployeeProfile,
    HRLeaveType, HRLeaveBalance, HRLeaveRequest, LeaveStatus,
    HRSalaryComponent, HRSalaryStructure, HRSalaryStructureItem,
    HREmployeeSalary, HRPayrollRun, HRVariablePayEntry, HRPayslip,
    SalaryComponentType, SalaryCalculationType, PayrollRunStatus,
    HRChecklistTemplate, HRChecklistInstance, HREmployeeDocument,
    ChecklistType, ChecklistStatus, EmployeeStatus
)
from app.models.user import User
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
    ChecklistTaskToggle, EmployeeDocumentResponse, DocumentVerifyRequest,
    HeadcountReportResponse, AttritionReportResponse, LeaveSummaryReportResponse,
    PayrollCostReportResponse
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _employee_list_item(profile: HREmployeeProfile) -> EmployeeListItem:
    user = profile.user
    dept = profile.department
    desig = profile.designation
    return EmployeeListItem(
        id=profile.id,
        public_id=profile.public_id,
        user_id=profile.user_id,
        is_invited=user is not None,
        employee_id=profile.employee_id,
        full_name=user.full_name if user else profile.full_name,
        email=user.email if user else profile.email,
        phone=user.phone if user else profile.phone,
        role=user.role.value if user else None,
        avatar=user.avatar if user else None,
        employee_status=profile.employee_status,
        employment_type=profile.employment_type,
        work_location=profile.work_location,
        department_id=profile.department_id,
        department_name=dept.name if dept else None,
        designation_id=profile.designation_id,
        designation_name=desig.name if desig else None,
        date_of_joining=profile.date_of_joining,
        is_active=user.is_active if user else None,
        created_at=profile.created_at,
    )


def _employee_response(profile: HREmployeeProfile) -> EmployeeResponse:
    user = profile.user
    dept = profile.department
    desig = profile.designation
    mgr = user.reporting_manager if user else None
    return EmployeeResponse(
        id=profile.id,
        public_id=profile.public_id,
        user_id=profile.user_id,
        is_invited=user is not None,
        employee_id=profile.employee_id,
        employment_type=profile.employment_type,
        work_location=profile.work_location,
        employee_status=profile.employee_status,
        date_of_joining=profile.date_of_joining,
        date_of_leaving=profile.date_of_leaving,
        probation_end_date=profile.probation_end_date,
        pan_number=profile.pan_number,
        aadhaar_number=profile.aadhaar_number,
        bank_account_number=profile.bank_account_number,
        bank_ifsc=profile.bank_ifsc,
        bank_name=profile.bank_name,
        emergency_contact=profile.emergency_contact,
        others=profile.others,
        organization_id=profile.organization_id,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        user_public_id=user.public_id if user else None,
        full_name=user.full_name if user else profile.full_name,
        email=user.email if user else profile.email,
        username=user.username if user else None,
        role=user.role.value if user else None,
        is_active=user.is_active if user else None,
        avatar=user.avatar if user else None,
        job_title=user.job_title if user else None,
        phone=user.phone if user else profile.phone,
        department_id=profile.department_id,
        department_name=dept.name if dept else None,
        designation_id=profile.designation_id,
        designation_name=desig.name if desig else None,
        reporting_manager_id=user.reporting_manager_id if user else None,
        reporting_manager_name=mgr.full_name if mgr else None,
    )


# ---------------------------------------------------------------------------
# Department CRUD
# ---------------------------------------------------------------------------

async def list_departments(
    db: AsyncSession, org_id: int, include_inactive: bool = False
) -> list[DepartmentListItem]:
    q = select(HRDepartment).where(
        and_(HRDepartment.organization_id == org_id, HRDepartment.is_deleted == False)
    ).options(selectinload(HRDepartment.head))

    if not include_inactive:
        q = q.where(HRDepartment.is_active == True)

    result = await db.execute(q.order_by(HRDepartment.name))
    depts = result.scalars().all()

    # Employee count per department
    emp_counts_result = await db.execute(
        select(
            HREmployeeProfile.department_id,
            func.count(HREmployeeProfile.id).label("cnt")
        ).where(
            and_(
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.is_deleted == False,
            )
        ).group_by(HREmployeeProfile.department_id)
    )
    emp_counts = {row.department_id: row.cnt for row in emp_counts_result}

    # Designation count per department
    desig_counts_result = await db.execute(
        select(
            HRDesignation.department_id,
            func.count(HRDesignation.id).label("cnt")
        ).where(
            and_(
                HRDesignation.organization_id == org_id,
                HRDesignation.is_deleted == False,
            )
        ).group_by(HRDesignation.department_id)
    )
    desig_counts = {row.department_id: row.cnt for row in desig_counts_result}

    return [
        DepartmentListItem(
            id=d.id,
            public_id=d.public_id,
            name=d.name,
            description=d.description,
            parent_id=d.parent_id,
            head_user_id=d.head_user_id,
            head_user_name=d.head.full_name if d.head else None,
            is_active=d.is_active,
            designation_count=desig_counts.get(d.id, 0),
            employee_count=emp_counts.get(d.id, 0),
            created_at=d.created_at,
        )
        for d in depts
    ]


async def get_department(
    db: AsyncSession, org_id: int, department_id: int
) -> DepartmentResponse:
    result = await db.execute(
        select(HRDepartment).where(
            and_(
                HRDepartment.id == department_id,
                HRDepartment.organization_id == org_id,
                HRDepartment.is_deleted == False,
            )
        ).options(selectinload(HRDepartment.head))
    )
    dept = result.scalars().first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    return DepartmentResponse(
        id=dept.id,
        public_id=dept.public_id,
        name=dept.name,
        description=dept.description,
        parent_id=dept.parent_id,
        head_user_id=dept.head_user_id,
        head_user_name=dept.head.full_name if dept.head else None,
        is_active=dept.is_active,
        others=dept.others,
        organization_id=dept.organization_id,
        created_at=dept.created_at,
        updated_at=dept.updated_at,
    )


async def create_department(
    db: AsyncSession, org_id: int, payload: DepartmentCreate
) -> DepartmentResponse:
    dept = HRDepartment(
        organization_id=org_id,
        name=payload.name,
        description=payload.description,
        parent_id=payload.parent_id,
        head_user_id=payload.head_user_id,
        is_active=True,
        others=payload.others,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return await get_department(db, org_id, dept.id)


async def update_department(
    db: AsyncSession, org_id: int, department_id: int, payload: DepartmentUpdate
) -> DepartmentResponse:
    result = await db.execute(
        select(HRDepartment).where(
            and_(
                HRDepartment.id == department_id,
                HRDepartment.organization_id == org_id,
                HRDepartment.is_deleted == False,
            )
        )
    )
    dept = result.scalars().first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(dept, field, value)

    await db.commit()
    return await get_department(db, org_id, dept.id)


async def delete_department(db: AsyncSession, org_id: int, department_id: int) -> None:
    result = await db.execute(
        select(HRDepartment).where(
            and_(
                HRDepartment.id == department_id,
                HRDepartment.organization_id == org_id,
                HRDepartment.is_deleted == False,
            )
        )
    )
    dept = result.scalars().first()
    if not dept:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    dept.soft_delete()
    await db.commit()


# ---------------------------------------------------------------------------
# Designation CRUD
# ---------------------------------------------------------------------------

async def list_designations(
    db: AsyncSession, org_id: int, department_id: Optional[int] = None
) -> list[DesignationListItem]:
    q = select(HRDesignation).where(
        and_(HRDesignation.organization_id == org_id, HRDesignation.is_deleted == False)
    ).options(selectinload(HRDesignation.department))

    if department_id:
        q = q.where(HRDesignation.department_id == department_id)

    result = await db.execute(q.order_by(HRDesignation.name))
    designations = result.scalars().all()

    # Employee count per designation
    emp_counts_result = await db.execute(
        select(
            HREmployeeProfile.designation_id,
            func.count(HREmployeeProfile.id).label("cnt")
        ).where(
            and_(
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.is_deleted == False,
            )
        ).group_by(HREmployeeProfile.designation_id)
    )
    emp_counts = {row.designation_id: row.cnt for row in emp_counts_result}

    return [
        DesignationListItem(
            id=d.id,
            public_id=d.public_id,
            name=d.name,
            department_id=d.department_id,
            department_name=d.department.name if d.department else None,
            grade=d.grade,
            description=d.description,
            is_active=d.is_active,
            employee_count=emp_counts.get(d.id, 0),
            created_at=d.created_at,
        )
        for d in designations
    ]


async def create_designation(
    db: AsyncSession, org_id: int, payload: DesignationCreate
) -> DesignationResponse:
    desig = HRDesignation(
        organization_id=org_id,
        name=payload.name,
        department_id=payload.department_id,
        grade=payload.grade,
        description=payload.description,
        is_active=True,
        others=payload.others,
    )
    db.add(desig)
    await db.commit()
    await db.refresh(desig)

    dept_name = None
    if desig.department_id:
        dept_result = await db.get(HRDepartment, desig.department_id)
        dept_name = dept_result.name if dept_result else None

    return DesignationResponse(
        id=desig.id,
        public_id=desig.public_id,
        name=desig.name,
        department_id=desig.department_id,
        department_name=dept_name,
        grade=desig.grade,
        description=desig.description,
        is_active=desig.is_active,
        others=desig.others,
        organization_id=desig.organization_id,
        created_at=desig.created_at,
        updated_at=desig.updated_at,
    )


async def update_designation(
    db: AsyncSession, org_id: int, designation_id: int, payload: DesignationUpdate
) -> DesignationResponse:
    result = await db.execute(
        select(HRDesignation).where(
            and_(
                HRDesignation.id == designation_id,
                HRDesignation.organization_id == org_id,
                HRDesignation.is_deleted == False,
            )
        )
    )
    desig = result.scalars().first()
    if not desig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Designation not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(desig, field, value)

    await db.commit()
    await db.refresh(desig)

    dept_name = None
    if desig.department_id:
        dept_result = await db.get(HRDepartment, desig.department_id)
        dept_name = dept_result.name if dept_result else None

    return DesignationResponse(
        id=desig.id,
        public_id=desig.public_id,
        name=desig.name,
        department_id=desig.department_id,
        department_name=dept_name,
        grade=desig.grade,
        description=desig.description,
        is_active=desig.is_active,
        others=desig.others,
        organization_id=desig.organization_id,
        created_at=desig.created_at,
        updated_at=desig.updated_at,
    )


async def delete_designation(db: AsyncSession, org_id: int, designation_id: int) -> None:
    result = await db.execute(
        select(HRDesignation).where(
            and_(
                HRDesignation.id == designation_id,
                HRDesignation.organization_id == org_id,
                HRDesignation.is_deleted == False,
            )
        )
    )
    desig = result.scalars().first()
    if not desig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Designation not found")
    desig.soft_delete()
    await db.commit()


# ---------------------------------------------------------------------------
# Employee Profile CRUD
# ---------------------------------------------------------------------------

_PROFILE_LOAD_OPTIONS = [
    selectinload(HREmployeeProfile.user).selectinload(User.reporting_manager),
    selectinload(HREmployeeProfile.department),
    selectinload(HREmployeeProfile.designation),
]


async def list_employees(
    db: AsyncSession,
    org_id: int,
    department_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[EmployeeListItem], int]:
    q = (
        select(HREmployeeProfile)
        .where(
            and_(
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.is_deleted == False,
            )
        )
        .options(*_PROFILE_LOAD_OPTIONS)
        .outerjoin(HREmployeeProfile.user)
    )

    display_name = func.coalesce(User.full_name, HREmployeeProfile.full_name)
    display_email = func.coalesce(User.email, HREmployeeProfile.email)

    if department_id:
        q = q.where(HREmployeeProfile.department_id == department_id)
    if status_filter:
        q = q.where(HREmployeeProfile.employee_status == status_filter)
    if search:
        q = q.where(display_name.ilike(f"%{search}%") | display_email.ilike(f"%{search}%"))

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(q.order_by(display_name).offset(skip).limit(limit))
    profiles = result.scalars().all()

    return [_employee_list_item(p) for p in profiles], total


async def get_employee_by_user_id(
    db: AsyncSession, org_id: int, user_id: int
) -> EmployeeResponse:
    result = await db.execute(
        select(HREmployeeProfile)
        .where(
            and_(
                HREmployeeProfile.user_id == user_id,
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.is_deleted == False,
            )
        )
        .options(*_PROFILE_LOAD_OPTIONS)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return _employee_response(profile)


async def get_employee_by_public_id(
    db: AsyncSession, org_id: int, public_id: uuid.UUID
) -> EmployeeResponse:
    result = await db.execute(
        select(HREmployeeProfile)
        .where(
            and_(
                HREmployeeProfile.public_id == public_id,
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.is_deleted == False,
            )
        )
        .options(*_PROFILE_LOAD_OPTIONS)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return _employee_response(profile)


async def _generate_employee_id(db: AsyncSession, org_id: int) -> str:
    """Auto-generate the next sequential employee ID like EMP-001."""
    result = await db.execute(
        select(func.count(HREmployeeProfile.id)).where(
            and_(
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.is_deleted == False,
            )
        )
    )
    count = result.scalar() or 0
    return f"EMP-{str(count + 1).zfill(3)}"


async def create_employee_profile(
    db: AsyncSession, org_id: int, payload: EmployeeProfileCreate
) -> EmployeeResponse:
    if payload.user_id is not None:
        # Validate user belongs to org
        user = await db.get(User, payload.user_id)
        if not user or user.organization_id != org_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in this organization",
            )

        # Check no duplicate profile
        existing = await db.execute(
            select(HREmployeeProfile).where(
                and_(
                    HREmployeeProfile.user_id == payload.user_id,
                    HREmployeeProfile.is_deleted == False,
                )
            )
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee profile already exists for this user",
            )
    else:
        # Pre-invite path: dedupe against both existing Users and other
        # pre-invite employee records sharing this email in the org.
        existing_user = await db.execute(
            select(User).where(
                and_(User.email == payload.email, User.organization_id == org_id)
            )
        )
        if existing_user.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists — link them as an existing team member instead",
            )
        existing_profile = await db.execute(
            select(HREmployeeProfile).where(
                and_(
                    HREmployeeProfile.organization_id == org_id,
                    HREmployeeProfile.email == payload.email,
                    HREmployeeProfile.is_deleted == False,
                )
            )
        )
        if existing_profile.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An employee record with this email already exists",
            )

    emp_id = payload.employee_id or await _generate_employee_id(db, org_id)

    profile = HREmployeeProfile(
        organization_id=org_id,
        user_id=payload.user_id,
        full_name=payload.full_name if payload.user_id is None else None,
        email=payload.email if payload.user_id is None else None,
        phone=payload.phone if payload.user_id is None else None,
        employee_id=emp_id,
        department_id=payload.department_id,
        designation_id=payload.designation_id,
        employment_type=payload.employment_type,
        work_location=payload.work_location,
        employee_status=payload.employee_status,
        date_of_joining=payload.date_of_joining,
        date_of_leaving=payload.date_of_leaving,
        probation_end_date=payload.probation_end_date,
        pan_number=payload.pan_number,
        aadhaar_number=payload.aadhaar_number,
        bank_account_number=payload.bank_account_number,
        bank_ifsc=payload.bank_ifsc,
        bank_name=payload.bank_name,
        emergency_contact=payload.emergency_contact.model_dump() if payload.emergency_contact else None,
        others=payload.others,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return await get_employee_by_public_id(db, org_id, profile.public_id)


async def invite_employee_to_gravit(
    db: AsyncSession,
    org_id: int,
    public_id: uuid.UUID,
    payload: EmployeeInviteRequest,
    current_user: User,
) -> EmployeeResponse:
    """Create a Gravit login for a pre-invite employee and link it to their profile."""
    from app.models.user import UserRole
    from app.schemas.user_management import InviteUserRequest
    from app.services.user_management import invite_user

    result = await db.execute(
        select(HREmployeeProfile).where(
            and_(
                HREmployeeProfile.public_id == public_id,
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.is_deleted == False,
            )
        )
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    if profile.user_id is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This employee already has a Gravit login")
    if not profile.email or not profile.full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee record is missing name/email — cannot invite",
        )
    if payload.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot assign the Admin role from the employee invite flow",
        )

    invite_payload = InviteUserRequest(
        username=payload.username,
        email=profile.email,
        full_name=profile.full_name,
        role=payload.role,
    )
    user = await invite_user(db, current_user=current_user, payload=invite_payload)

    profile.user_id = user.id
    profile.full_name = None
    profile.email = None
    profile.phone = None
    await db.commit()
    await db.refresh(profile)
    return await get_employee_by_public_id(db, org_id, public_id)


async def update_employee_profile(
    db: AsyncSession, org_id: int, public_id: uuid.UUID, payload: EmployeeProfileUpdate
) -> EmployeeResponse:
    result = await db.execute(
        select(HREmployeeProfile).where(
            and_(
                HREmployeeProfile.public_id == public_id,
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.is_deleted == False,
            )
        )
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")

    data = payload.model_dump(exclude_none=True)
    if "emergency_contact" in data and data["emergency_contact"] is not None:
        data["emergency_contact"] = data["emergency_contact"]

    if profile.user_id is not None:
        # full_name/email/phone are only meaningful pre-invite — once a login
        # exists, identity is sourced live from the linked User instead.
        data.pop("full_name", None)
        data.pop("email", None)
        data.pop("phone", None)

    for field, value in data.items():
        setattr(profile, field, value)

    await db.commit()
    return await get_employee_by_public_id(db, org_id, public_id)


# ===========================================================================
# Leave Types CRUD
# ===========================================================================

async def list_leave_types(db: AsyncSession, org_id: int, include_inactive: bool = False) -> list[HRLeaveType]:
    q = select(HRLeaveType).where(
        and_(HRLeaveType.organization_id == org_id, HRLeaveType.is_deleted == False)
    )
    if not include_inactive:
        q = q.where(HRLeaveType.is_active == True)
    result = await db.execute(q.order_by(HRLeaveType.name))
    return list(result.scalars().all())


async def create_leave_type(db: AsyncSession, org_id: int, payload: LeaveTypeCreate) -> HRLeaveType:
    # Check duplicate code
    existing = await db.execute(
        select(HRLeaveType).where(
            and_(
                HRLeaveType.organization_id == org_id,
                HRLeaveType.code == payload.code.upper(),
                HRLeaveType.is_deleted == False
            )
        )
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Leave type with code '{payload.code}' already exists."
        )

    lt = HRLeaveType(
        organization_id=org_id,
        name=payload.name,
        code=payload.code.upper(),
        description=payload.description,
        default_allocation=payload.default_allocation,
        is_carry_forward=payload.is_carry_forward,
        max_carry_forward=payload.max_carry_forward,
        is_lop=payload.is_lop,
        is_active=True,
        others=payload.others,
    )
    db.add(lt)
    await db.commit()
    await db.refresh(lt)
    return lt


async def update_leave_type(db: AsyncSession, org_id: int, id: int, payload: LeaveTypeUpdate) -> HRLeaveType:
    result = await db.execute(
        select(HRLeaveType).where(
            and_(
                HRLeaveType.id == id,
                HRLeaveType.organization_id == org_id,
                HRLeaveType.is_deleted == False
            )
        )
    )
    lt = result.scalars().first()
    if not lt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")

    data = payload.model_dump(exclude_none=True)
    if "code" in data:
        data["code"] = data["code"].upper()

    for field, value in data.items():
        setattr(lt, field, value)

    await db.commit()
    await db.refresh(lt)
    return lt


async def delete_leave_type(db: AsyncSession, org_id: int, id: int) -> None:
    result = await db.execute(
        select(HRLeaveType).where(
            and_(
                HRLeaveType.id == id,
                HRLeaveType.organization_id == org_id,
                HRLeaveType.is_deleted == False
            )
        )
    )
    lt = result.scalars().first()
    if not lt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")
    lt.soft_delete()
    await db.commit()


# ===========================================================================
# Leave Balance Management
# ===========================================================================

async def get_user_balances(db: AsyncSession, org_id: int, user_id: int, year: int) -> list[LeaveBalanceResponse]:
    # Ensure balances exist for active leave types
    await allocate_balances_for_user(db, org_id, user_id, year)

    result = await db.execute(
        select(HRLeaveBalance)
        .where(
            and_(
                HRLeaveBalance.user_id == user_id,
                HRLeaveBalance.year == year,
                HRLeaveBalance.organization_id == org_id,
                HRLeaveBalance.is_deleted == False
            )
        )
        .options(selectinload(HRLeaveBalance.leave_type))
    )
    balances = result.scalars().all()
    return [
        LeaveBalanceResponse(
            id=b.id,
            public_id=b.public_id,
            user_id=b.user_id,
            leave_type_id=b.leave_type_id,
            leave_type_name=b.leave_type.name,
            leave_type_code=b.leave_type.code,
            is_lop=b.leave_type.is_lop,
            year=b.year,
            allocated=b.allocated,
            used=b.used,
            pending=b.pending,
            others=b.others,
            organization_id=b.organization_id,
            created_at=b.created_at,
            updated_at=b.updated_at,
        )
        for b in balances
    ]


async def allocate_balances_for_user(db: AsyncSession, org_id: int, user_id: int, year: int) -> None:
    """Pre-allocate leave balance rows for active leave types if they don't exist"""
    active_types = await list_leave_types(db, org_id, include_inactive=False)
    
    # Check existing balances
    existing_result = await db.execute(
        select(HRLeaveBalance.leave_type_id).where(
            and_(
                HRLeaveBalance.user_id == user_id,
                HRLeaveBalance.year == year,
                HRLeaveBalance.organization_id == org_id,
                HRLeaveBalance.is_deleted == False
            )
        )
    )
    existing_type_ids = set(existing_result.scalars().all())

    created_any = False
    for lt in active_types:
        if lt.id not in existing_type_ids:
            b = HRLeaveBalance(
                organization_id=org_id,
                user_id=user_id,
                leave_type_id=lt.id,
                year=year,
                allocated=lt.default_allocation,
                used=0.0,
                pending=0.0,
            )
            db.add(b)
            created_any = True

    if created_any:
        await db.commit()


async def update_leave_balance(db: AsyncSession, org_id: int, id: int, payload: LeaveBalanceUpdate) -> LeaveBalanceResponse:
    result = await db.execute(
        select(HRLeaveBalance)
        .where(
            and_(
                HRLeaveBalance.id == id,
                HRLeaveBalance.organization_id == org_id,
                HRLeaveBalance.is_deleted == False
            )
        )
        .options(selectinload(HRLeaveBalance.leave_type))
    )
    b = result.scalars().first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave balance tracker not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(b, field, value)

    await db.commit()
    await db.refresh(b)
    return LeaveBalanceResponse(
        id=b.id,
        public_id=b.public_id,
        user_id=b.user_id,
        leave_type_id=b.leave_type_id,
        leave_type_name=b.leave_type.name,
        leave_type_code=b.leave_type.code,
        is_lop=b.leave_type.is_lop,
        year=b.year,
        allocated=b.allocated,
        used=b.used,
        pending=b.pending,
        others=b.others,
        organization_id=b.organization_id,
        created_at=b.created_at,
        updated_at=b.updated_at,
    )


# ===========================================================================
# Leave Requests logic & Workflow
# ===========================================================================

_LEAVE_REQ_LOAD_OPTIONS = [
    selectinload(HRLeaveRequest.user).selectinload(User.employee_profile),
    selectinload(HRLeaveRequest.leave_type),
    selectinload(HRLeaveRequest.approved_by),
]


def _leave_req_response(req: HRLeaveRequest) -> LeaveRequestResponse:
    user = req.user
    profile = user.employee_profile if user else None
    lt = req.leave_type
    mgr = req.approved_by
    return LeaveRequestResponse(
        id=req.id,
        public_id=req.public_id,
        user_id=req.user_id,
        employee_name=user.full_name if user else None,
        employee_code=profile.employee_id if profile else None,
        leave_type_id=req.leave_type_id,
        leave_type_name=lt.name if lt else None,
        leave_type_code=lt.code if lt else None,
        from_date=req.from_date,
        to_date=req.to_date,
        is_half_day=req.is_half_day,
        half_day_session=req.half_day_session,
        total_days=req.total_days,
        status=req.status.value,
        reason=req.reason,
        approved_by_id=req.approved_by_id,
        approved_by_name=mgr.full_name if mgr else None,
        approved_at=req.approved_at,
        manager_notes=req.manager_notes,
        others=req.others,
        organization_id=req.organization_id,
        created_at=req.created_at,
        updated_at=req.updated_at,
    )


async def list_leave_requests(
    db: AsyncSession,
    org_id: int,
    user_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    manager_user_id: Optional[int] = None,
) -> list[LeaveRequestResponse]:
    q = select(HRLeaveRequest).where(
        and_(HRLeaveRequest.organization_id == org_id, HRLeaveRequest.is_deleted == False)
    ).options(*_LEAVE_REQ_LOAD_OPTIONS).join(HRLeaveRequest.user)

    if user_id:
        q = q.where(HRLeaveRequest.user_id == user_id)
    if status_filter:
        q = q.where(HRLeaveRequest.status == status_filter)
    if manager_user_id:
        # Filter where user reports to this manager
        q = q.where(User.reporting_manager_id == manager_user_id)

    result = await db.execute(q.order_by(HRLeaveRequest.from_date.desc()))
    reqs = result.scalars().all()
    return [_leave_req_response(r) for r in reqs]


async def get_leave_request(db: AsyncSession, org_id: int, public_id: uuid.UUID) -> LeaveRequestResponse:
    result = await db.execute(
        select(HRLeaveRequest).where(
            and_(
                HRLeaveRequest.public_id == public_id,
                HRLeaveRequest.organization_id == org_id,
                HRLeaveRequest.is_deleted == False
            )
        ).options(*_LEAVE_REQ_LOAD_OPTIONS)
    )
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")
    return _leave_req_response(req)


async def create_leave_request(db: AsyncSession, org_id: int, user_id: int, payload: LeaveRequestCreate) -> LeaveRequestResponse:
    # 1. Dates validation
    if payload.to_date < payload.from_date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="To Date cannot be before From Date")

    # Calculate days
    if payload.is_half_day:
        days = 0.5
    else:
        days = float((payload.to_date - payload.from_date).days + 1)

    # 2. Get leave type & verify balance
    lt = await db.get(HRLeaveType, payload.leave_type_id)
    if not lt or lt.organization_id != org_id or not lt.is_active or lt.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave type not found")

    year = payload.from_date.year
    await allocate_balances_for_user(db, org_id, user_id, year)

    balance_result = await db.execute(
        select(HRLeaveBalance).where(
            and_(
                HRLeaveBalance.user_id == user_id,
                HRLeaveBalance.leave_type_id == lt.id,
                HRLeaveBalance.year == year,
                HRLeaveBalance.is_deleted == False
            )
        )
    )
    bal = balance_result.scalars().first()
    if not bal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave balance records not found")

    # If LOP, we don't block. Otherwise, verify remaining balance (allocated - used - pending)
    if not lt.is_lop:
        available = bal.allocated - bal.used - bal.pending
        if available < days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient leave balance. Available: {available} days, Requested: {days} days."
            )

    # 3. Create request & update pending balance
    req = HRLeaveRequest(
        organization_id=org_id,
        user_id=user_id,
        leave_type_id=lt.id,
        from_date=payload.from_date,
        to_date=payload.to_date,
        is_half_day=payload.is_half_day,
        half_day_session=payload.half_day_session if payload.is_half_day else None,
        total_days=days,
        status=LeaveStatus.PENDING,
        reason=payload.reason,
        others=payload.others,
    )
    db.add(req)

    # Increase pending tracker
    bal.pending += days

    await db.commit()
    await db.refresh(req)
    
    # Reload request with relationships
    return await get_leave_request(db, org_id, req.public_id)


async def cancel_leave_request(db: AsyncSession, org_id: int, public_id: uuid.UUID, user_id: int) -> LeaveRequestResponse:
    result = await db.execute(
        select(HRLeaveRequest).where(
            and_(
                HRLeaveRequest.public_id == public_id,
                HRLeaveRequest.organization_id == org_id,
                HRLeaveRequest.is_deleted == False
            )
        ).options(*_LEAVE_REQ_LOAD_OPTIONS)
    )
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    # User can only cancel their own request
    if req.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only cancel your own leave requests")

    if req.status == LeaveStatus.CANCELLED:
        return _leave_req_response(req)

    # Balance update depending on current status
    year = req.from_date.year
    bal_res = await db.execute(
        select(HRLeaveBalance).where(
            and_(
                HRLeaveBalance.user_id == user_id,
                HRLeaveBalance.leave_type_id == req.leave_type_id,
                HRLeaveBalance.year == year,
                HRLeaveBalance.is_deleted == False
            )
        )
    )
    bal = bal_res.scalars().first()

    if bal:
        if req.status == LeaveStatus.PENDING:
            # Deduct from pending
            bal.pending = max(0.0, bal.pending - req.total_days)
        elif req.status == LeaveStatus.APPROVED:
            # If approved, return used days back to balance
            bal.used = max(0.0, bal.used - req.total_days)

    req.status = LeaveStatus.CANCELLED
    await db.commit()
    await db.refresh(req, attribute_names=["updated_at"])
    return _leave_req_response(req)


async def approve_reject_leave_request(
    db: AsyncSession,
    org_id: int,
    public_id: uuid.UUID,
    manager_user_id: int,
    payload: LeaveApprovalRequest,
    is_admin_override: bool = False,
) -> LeaveRequestResponse:
    result = await db.execute(
        select(HRLeaveRequest).where(
            and_(
                HRLeaveRequest.public_id == public_id,
                HRLeaveRequest.organization_id == org_id,
                HRLeaveRequest.is_deleted == False
            )
        ).options(*_LEAVE_REQ_LOAD_OPTIONS)
    )
    req = result.scalars().first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    # Only the employee's allocated reporting manager may act -- same identity
    # check Timesheets enforces for approve/reject. HR admins bypass it.
    if not is_admin_override and (not req.user or req.user.reporting_manager_id != manager_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve or reject leave requests for your direct reports",
        )

    if req.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only approve/reject pending requests")

    # Get balance
    year = req.from_date.year
    bal_res = await db.execute(
        select(HRLeaveBalance).where(
            and_(
                HRLeaveBalance.user_id == req.user_id,
                HRLeaveBalance.leave_type_id == req.leave_type_id,
                HRLeaveBalance.year == year,
                HRLeaveBalance.is_deleted == False
            )
        )
    )
    bal = bal_res.scalars().first()

    if payload.status == "approved":
        req.status = LeaveStatus.APPROVED
        if bal:
            # Shift from pending to used
            bal.pending = max(0.0, bal.pending - req.total_days)
            bal.used += req.total_days
    else:
        req.status = LeaveStatus.REJECTED
        if bal:
            # Release pending days
            bal.pending = max(0.0, bal.pending - req.total_days)

    req.approved_by_id = manager_user_id
    req.approved_at = datetime.utcnow()
    req.manager_notes = payload.manager_notes

    await db.commit()
    await db.refresh(req, attribute_names=["updated_at", "approved_by"])
    return _leave_req_response(req)


# ===========================================================================
# Payroll Management Services
# ===========================================================================

# --- Salary Components ---

async def list_salary_components(db: AsyncSession, org_id: int) -> list[HRSalaryComponent]:
    res = await db.execute(
        select(HRSalaryComponent).where(
            and_(HRSalaryComponent.organization_id == org_id, HRSalaryComponent.is_deleted == False)
        ).order_by(HRSalaryComponent.code)
    )
    return list(res.scalars().all())


async def create_salary_component(db: AsyncSession, org_id: int, payload: SalaryComponentCreate) -> HRSalaryComponent:
    comp = HRSalaryComponent(
        organization_id=org_id,
        name=payload.name,
        code=payload.code.upper(),
        component_type=payload.component_type,
        is_statutory=payload.is_statutory,
        is_taxable=payload.is_taxable,
        others=payload.others,
    )
    db.add(comp)
    await db.commit()
    await db.refresh(comp)
    return comp


async def update_salary_component(db: AsyncSession, org_id: int, id: int, payload: SalaryComponentUpdate) -> HRSalaryComponent:
    res = await db.execute(
        select(HRSalaryComponent).where(
            and_(
                HRSalaryComponent.organization_id == org_id,
                HRSalaryComponent.id == id,
                HRSalaryComponent.is_deleted == False
            )
        )
    )
    comp = res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary component not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if field == "code":
            setattr(comp, field, val.upper())
        else:
            setattr(comp, field, val)

    await db.commit()
    await db.refresh(comp)
    return comp


async def delete_salary_component(db: AsyncSession, org_id: int, id: int) -> None:
    res = await db.execute(
        select(HRSalaryComponent).where(
            and_(
                HRSalaryComponent.organization_id == org_id,
                HRSalaryComponent.id == id,
                HRSalaryComponent.is_deleted == False
            )
        )
    )
    comp = res.scalar_one_or_none()
    if not comp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary component not found")

    comp.is_deleted = True
    comp.deleted_at = datetime.utcnow()
    await db.commit()


# --- Salary Structures ---

async def list_salary_structures(db: AsyncSession, org_id: int) -> list[HRSalaryStructure]:
    res = await db.execute(
        select(HRSalaryStructure).where(
            and_(HRSalaryStructure.organization_id == org_id, HRSalaryStructure.is_deleted == False)
        ).options(selectinload(HRSalaryStructure.items).selectinload(HRSalaryStructureItem.component))
        .order_by(HRSalaryStructure.id.desc())
    )
    return list(res.scalars().all())


async def create_salary_structure(db: AsyncSession, org_id: int, payload: SalaryStructureCreate) -> HRSalaryStructure:
    struct = HRSalaryStructure(
        organization_id=org_id,
        name=payload.name,
        description=payload.description,
        others=payload.others,
    )
    db.add(struct)
    await db.flush()

    for item in payload.items:
        # Verify component exists
        comp_res = await db.execute(
            select(HRSalaryComponent).where(
                and_(
                    HRSalaryComponent.organization_id == org_id,
                    HRSalaryComponent.id == item.salary_component_id,
                    HRSalaryComponent.is_deleted == False
                )
            )
        )
        if not comp_res.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid component ID: {item.salary_component_id}")

        db_item = HRSalaryStructureItem(
            structure_id=struct.id,
            salary_component_id=item.salary_component_id,
            calculation_type=item.calculation_type,
            value_expr=item.value_expr,
            others=item.others,
        )
        db.add(db_item)

    await db.commit()
    
    # Reload structure with items
    struct_res = await db.execute(
        select(HRSalaryStructure).where(HRSalaryStructure.id == struct.id)
        .options(selectinload(HRSalaryStructure.items).selectinload(HRSalaryStructureItem.component))
    )
    return struct_res.scalar_one()


async def update_salary_structure(db: AsyncSession, org_id: int, id: int, payload: SalaryStructureUpdate) -> HRSalaryStructure:
    res = await db.execute(
        select(HRSalaryStructure).where(
            and_(
                HRSalaryStructure.organization_id == org_id,
                HRSalaryStructure.id == id,
                HRSalaryStructure.is_deleted == False
            )
        ).options(selectinload(HRSalaryStructure.items))
    )
    struct = res.scalar_one_or_none()
    if not struct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary structure not found")

    dump = payload.model_dump(exclude_unset=True)
    if "name" in dump:
        struct.name = dump["name"]
    if "description" in dump:
        struct.description = dump["description"]
    if "others" in dump:
        struct.others = dump["others"]

    if "items" in dump and dump["items"] is not None:
        # Clear existing items
        from sqlalchemy import delete
        await db.execute(delete(HRSalaryStructureItem).where(HRSalaryStructureItem.structure_id == struct.id))
        await db.flush()

        for item in payload.items:
            # Verify component exists
            comp_res = await db.execute(
                select(HRSalaryComponent).where(
                    and_(
                        HRSalaryComponent.organization_id == org_id,
                        HRSalaryComponent.id == item.salary_component_id,
                        HRSalaryComponent.is_deleted == False
                    )
                )
            )
            if not comp_res.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid component ID: {item.salary_component_id}")

            db_item = HRSalaryStructureItem(
                structure_id=struct.id,
                salary_component_id=item.salary_component_id,
                calculation_type=item.calculation_type,
                value_expr=item.value_expr,
                others=item.others,
            )
            db.add(db_item)

    await db.commit()
    
    # Reload structure with items
    struct_res = await db.execute(
        select(HRSalaryStructure).where(HRSalaryStructure.id == struct.id)
        .options(selectinload(HRSalaryStructure.items).selectinload(HRSalaryStructureItem.component))
    )
    return struct_res.scalar_one()


async def delete_salary_structure(db: AsyncSession, org_id: int, id: int) -> None:
    res = await db.execute(
        select(HRSalaryStructure).where(
            and_(
                HRSalaryStructure.organization_id == org_id,
                HRSalaryStructure.id == id,
                HRSalaryStructure.is_deleted == False
            )
        )
    )
    struct = res.scalar_one_or_none()
    if not struct:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salary structure not found")

    struct.is_deleted = True
    struct.deleted_at = datetime.utcnow()
    await db.commit()


# --- Employee Salaries ---

async def get_employee_salary(db: AsyncSession, org_id: int, user_id: int) -> Optional[HREmployeeSalary]:
    res = await db.execute(
        select(HREmployeeSalary).where(
            and_(
                HREmployeeSalary.organization_id == org_id,
                HREmployeeSalary.user_id == user_id,
                HREmployeeSalary.is_deleted == False
            )
        ).options(selectinload(HREmployeeSalary.structure))
    )
    return res.scalar_one_or_none()


async def create_or_update_employee_salary(db: AsyncSession, org_id: int, payload: EmployeeSalaryCreate) -> HREmployeeSalary:
    # Check if structure exists
    struct_res = await db.execute(
        select(HRSalaryStructure).where(
            and_(
                HRSalaryStructure.organization_id == org_id,
                HRSalaryStructure.id == payload.structure_id,
                HRSalaryStructure.is_deleted == False
            )
        )
    )
    if not struct_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid salary structure")

    # Check if already exists
    res = await db.execute(
        select(HREmployeeSalary).where(
            and_(
                HREmployeeSalary.organization_id == org_id,
                HREmployeeSalary.user_id == payload.user_id,
                HREmployeeSalary.is_deleted == False
            )
        )
    )
    sal = res.scalar_one_or_none()

    if sal:
        sal.structure_id = payload.structure_id
        sal.ctc = payload.ctc
        sal.effective_from = payload.effective_from
        sal.is_active = payload.is_active
        if payload.others is not None:
            sal.others = payload.others
    else:
        sal = HREmployeeSalary(
            organization_id=org_id,
            user_id=payload.user_id,
            structure_id=payload.structure_id,
            ctc=payload.ctc,
            effective_from=payload.effective_from,
            is_active=payload.is_active,
            others=payload.others,
        )
        db.add(sal)

    await db.commit()
    
    # Reload with structure
    res = await db.execute(
        select(HREmployeeSalary).where(HREmployeeSalary.id == sal.id)
        .options(selectinload(HREmployeeSalary.structure))
    )
    return res.scalar_one()


# --- Payroll Runs ---

async def list_payroll_runs(db: AsyncSession, org_id: int) -> list[HRPayrollRun]:
    res = await db.execute(
        select(HRPayrollRun).where(
            and_(HRPayrollRun.organization_id == org_id, HRPayrollRun.is_deleted == False)
        ).options(selectinload(HRPayrollRun.processed_by))
        .order_by(HRPayrollRun.year.desc(), HRPayrollRun.month.desc())
    )
    return list(res.scalars().all())


async def create_payroll_run(db: AsyncSession, org_id: int, payload: PayrollRunCreate) -> HRPayrollRun:
    # Check if run already exists for this month/year
    res = await db.execute(
        select(HRPayrollRun).where(
            and_(
                HRPayrollRun.organization_id == org_id,
                HRPayrollRun.month == payload.month,
                HRPayrollRun.year == payload.year,
                HRPayrollRun.is_deleted == False
            )
        )
    )
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payroll run already exists for {payload.month}/{payload.year}"
        )

    run = HRPayrollRun(
        organization_id=org_id,
        month=payload.month,
        year=payload.year,
        status=PayrollRunStatus.DRAFT,
        others=payload.others,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run


# --- Safe expression evaluator for simple arithmetic formulas ---
def _evaluate_expr(expr: str, context: dict) -> float:
    expr = expr.upper()
    for key, val in context.items():
        expr = expr.replace(key.upper(), str(val))
    
    import re
    # Match ONLY digits, operators, dots, parentheses, and spaces for strict safety
    if re.match(r'^[\d\.\+\-\*\/\(\)\s]+$', expr):
        try:
            return float(eval(expr))
        except Exception:
            pass
    return 0.0


async def run_payroll_calculations(db: AsyncSession, org_id: int, run_id: int) -> HRPayrollRun:
    # Fetch payroll run
    res = await db.execute(
        select(HRPayrollRun).where(
            and_(
                HRPayrollRun.organization_id == org_id,
                HRPayrollRun.id == run_id,
                HRPayrollRun.is_deleted == False
            )
        )
    )
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll run not found")

    if run.status == PayrollRunStatus.FINALIZED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot recalculate finalized run")

    run.status = PayrollRunStatus.PROCESSING
    await db.flush()

    # Get all active employees with salary structures
    salaries_res = await db.execute(
        select(HREmployeeSalary).where(
            and_(
                HREmployeeSalary.organization_id == org_id,
                HREmployeeSalary.is_active == True,
                HREmployeeSalary.is_deleted == False
            )
        ).options(
            selectinload(HREmployeeSalary.user),
            selectinload(HREmployeeSalary.structure).selectinload(HRSalaryStructure.items).selectinload(HRSalaryStructureItem.component)
        )
    )
    salaries = salaries_res.scalars().all()

    # Clear existing payslips for this run
    from sqlalchemy import delete
    await db.execute(delete(HRPayslip).where(HRPayslip.payroll_run_id == run.id))
    await db.flush()

    import calendar
    days_in_month = calendar.monthrange(run.year, run.month)[1]

    # Calculate for each employee
    for es in salaries:
        monthly_ctc = es.ctc / 12.0
        
        # Calculate LOP leaves
        import datetime as dt
        from_date = dt.date(run.year, run.month, 1)
        to_date = dt.date(run.year, run.month, days_in_month)

        leaves_res = await db.execute(
            select(HRLeaveRequest).where(
                and_(
                    HRLeaveRequest.user_id == es.user_id,
                    HRLeaveRequest.status == LeaveStatus.APPROVED,
                    HRLeaveRequest.from_date <= to_date,
                    HRLeaveRequest.to_date >= from_date,
                    HRLeaveRequest.is_deleted == False
                )
            ).options(selectinload(HRLeaveRequest.leave_type))
        )
        leaves = leaves_res.scalars().all()
        
        lop_days = 0.0
        for lv in leaves:
            if lv.leave_type.is_lop:
                # Count days overlapping with current month
                overlap_start = max(lv.from_date, from_date)
                overlap_end = min(lv.to_date, to_date)
                days = (overlap_end - overlap_start).days + 1
                # Adjust if leave is half day
                if lv.is_half_day:
                    lop_days += 0.5
                else:
                    lop_days += days

        # Evaluate Earnings components first
        earnings = {}
        context = {"CTC": monthly_ctc}
        
        # Standard CTC breakdown: Basic, HRA, Special Allowance
        # Sort items: BASIC first, HRA second, then others to resolve dependencies in formula evaluation
        sorted_items = sorted(
            es.structure.items,
            key=lambda x: 0 if x.component.code == "BASIC" else (1 if x.component.code == "HRA" else 2)
        )

        for item in sorted_items:
            comp = item.component
            if comp.component_type != SalaryComponentType.EARNING:
                continue

            if item.calculation_type == SalaryCalculationType.FLAT:
                amount = float(item.value_expr)
            else:
                amount = _evaluate_expr(item.value_expr, context)
            
            earnings[comp.code] = round(amount, 2)
            context[comp.code] = round(amount, 2)

        # Standard Statutory deductions
        deductions = {}
        basic = earnings.get("BASIC", 0.0)
        
        # 1. Employee PF: 12% of Basic, capped at ₹1,800
        pf_employee = round(min(basic * 0.12, 1800.0), 2)
        deductions["PF"] = pf_employee
        
        # Calculate Gross earnings (pre-deductions)
        gross_earnings = sum(earnings.values())
        
        # 2. Employee ESI: 0.75% of Gross, only if monthly Gross <= 21000
        esi_employee = 0.0
        if gross_earnings <= 21000.0:
            esi_employee = round(gross_earnings * 0.0075, 2)
        deductions["ESI"] = esi_employee

        # 3. Professional Tax (PT)
        pt = 0.0
        if gross_earnings > 15000.0:
            pt = 200.0
        deductions["PT"] = pt

        # 4. LOP deduction
        lop_deduction = 0.0
        if lop_days > 0.0:
            lop_deduction = round((gross_earnings / days_in_month) * lop_days, 2)
            deductions["LOP"] = lop_deduction

        # 5. TDS - simple slab-based tax estimator
        annual_taxable = gross_earnings * 12.0
        tds = 0.0
        if annual_taxable > 1000000.0:
            tds = round(((annual_taxable - 1000000.0) * 0.20 + 75000.0) / 12.0, 2)
        elif annual_taxable > 500000.0:
            tds = round(((annual_taxable - 500000.0) * 0.10) / 12.0, 2)
        deductions["TDS"] = tds

        # Fetch custom Variable Pay Entries (bonuses or TDS overrides)
        var_res = await db.execute(
            select(HRVariablePayEntry).where(
                and_(
                    HRVariablePayEntry.organization_id == org_id,
                    HRVariablePayEntry.user_id == es.user_id,
                    HRVariablePayEntry.payroll_run_id == run.id,
                    HRVariablePayEntry.is_deleted == False
                )
            )
        )
        var_entries = var_res.scalars().all()
        for ve in var_entries:
            if ve.entry_type == SalaryComponentType.EARNING:
                earnings[ve.component_code] = round(ve.amount, 2)
                gross_earnings += round(ve.amount, 2)
            else:
                deductions[ve.component_code] = round(ve.amount, 2)

        # Re-calc Gross and Deductions
        gross_earnings = max(0.0, gross_earnings - lop_deduction)
        total_deductions = sum(deductions.values())
        net_pay = max(0.0, gross_earnings - total_deductions)

        # Create Payslip record
        payslip = HRPayslip(
            organization_id=org_id,
            user_id=es.user_id,
            payroll_run_id=run.id,
            earnings_breakdown=earnings,
            deductions_breakdown=deductions,
            gross_earnings=gross_earnings,
            total_deductions=total_deductions,
            net_pay=net_pay,
            lop_days=lop_days,
        )
        db.add(payslip)

    run.status = PayrollRunStatus.DRAFT
    await db.commit()
    await db.refresh(run)
    return run


async def finalize_payroll_run(db: AsyncSession, org_id: int, run_id: int, manager_id: int) -> HRPayrollRun:
    res = await db.execute(
        select(HRPayrollRun).where(
            and_(
                HRPayrollRun.organization_id == org_id,
                HRPayrollRun.id == run_id,
                HRPayrollRun.is_deleted == False
            )
        )
    )
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll run not found")

    # Finalize
    run.status = PayrollRunStatus.FINALIZED
    run.processed_by_id = manager_id
    run.processed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(run)
    return run


# --- Variable Pay Entries ---

async def create_variable_pay_entry(db: AsyncSession, org_id: int, run_id: int, payload: VariablePayEntryCreate) -> HRVariablePayEntry:
    # Verify run exists
    run_res = await db.execute(
        select(HRPayrollRun).where(
            and_(HRPayrollRun.organization_id == org_id, HRPayrollRun.id == run_id, HRPayrollRun.is_deleted == False)
        )
    )
    if not run_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payroll run ID")

    entry = HRVariablePayEntry(
        organization_id=org_id,
        user_id=payload.user_id,
        payroll_run_id=run_id,
        component_code=payload.component_code.upper(),
        amount=payload.amount,
        entry_type=payload.entry_type,
        reason=payload.reason,
        others=payload.others,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_variable_pay_entry(db: AsyncSession, org_id: int, id: int) -> None:
    res = await db.execute(
        select(HRVariablePayEntry).where(
            and_(
                HRVariablePayEntry.organization_id == org_id,
                HRVariablePayEntry.id == id,
                HRVariablePayEntry.is_deleted == False
            )
        )
    )
    entry = res.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variable pay entry not found")

    entry.is_deleted = True
    entry.deleted_at = datetime.utcnow()
    await db.commit()


# --- Payslips & PDF Generation ---

async def list_payslips(db: AsyncSession, org_id: int, run_id: Optional[int] = None, user_id: Optional[int] = None) -> list[HRPayslip]:
    conditions = [HRPayslip.organization_id == org_id, HRPayslip.is_deleted == False]
    if run_id:
        conditions.append(HRPayslip.payroll_run_id == run_id)
    if user_id:
        conditions.append(HRPayslip.user_id == user_id)

    res = await db.execute(
        select(HRPayslip).where(and_(*conditions))
        .options(
            selectinload(HRPayslip.user),
            selectinload(HRPayslip.payroll_run)
        )
        .order_by(HRPayslip.id.desc())
    )
    return list(res.scalars().all())


async def get_payslip(db: AsyncSession, org_id: int, public_id: uuid.UUID) -> HRPayslip:
    res = await db.execute(
        select(HRPayslip).where(
            and_(HRPayslip.organization_id == org_id, HRPayslip.public_id == public_id, HRPayslip.is_deleted == False)
        ).options(
            selectinload(HRPayslip.user).selectinload(User.employee_profile).selectinload(HREmployeeProfile.department),
            selectinload(HRPayslip.user).selectinload(User.employee_profile).selectinload(HREmployeeProfile.designation),
            selectinload(HRPayslip.payroll_run)
        )
    )
    ps = res.scalar_one_or_none()
    if not ps:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payslip not found")
    return ps


def generate_payslip_pdf(payslip: HRPayslip) -> BytesIO:
    """Generates a professional, print-ready payslip PDF in-memory using ReportLab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    import calendar

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom colors
    primary_color = colors.HexColor('#002B49') # Sleeek dark blue
    border_color = colors.HexColor('#CCCCCC')
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=primary_color,
        alignment=1 # Centered
    )
    
    subtitle_style = ParagraphStyle(
        'SubStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#666666'),
        alignment=1
    )
    
    bold_style = ParagraphStyle(
        'BoldStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
    )
    
    normal_style = ParagraphStyle(
        'NormalStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.white,
    )

    # 1. Title Block
    story.append(Paragraph(f"{payslip.user.organization.name if payslip.user.organization else 'GRAVIT LOGISTICS'}", title_style))
    month_name = calendar.month_name[payslip.payroll_run.month]
    story.append(Paragraph(f"Payslip for the month of {month_name} {payslip.payroll_run.year}", subtitle_style))
    story.append(Spacer(1, 15))

    # 2. Employee Details Block Table
    profile = payslip.user.employee_profile if payslip.user else None
    
    details_data = [
        [
            Paragraph("Employee Name:", bold_style),
            Paragraph(f"{payslip.user.full_name or payslip.user.username}", normal_style),
            Paragraph("Employee ID:", bold_style),
            Paragraph(f"{profile.employee_id if profile else '—'}", normal_style)
        ],
        [
            Paragraph("Department:", bold_style),
            Paragraph(f"{profile.department.name if profile and profile.department else '—'}", normal_style),
            Paragraph("Designation:", bold_style),
            Paragraph(f"{profile.designation.name if profile and profile.designation else '—'}", normal_style)
        ],
        [
            Paragraph("Bank Name:", bold_style),
            Paragraph(f"{profile.bank_name if profile and profile.bank_name else '—'}", normal_style),
            Paragraph("Account No:", bold_style),
            Paragraph(f"{profile.bank_account_number if profile and profile.bank_account_number else '—'}", normal_style)
        ],
        [
            Paragraph("PAN Number:", bold_style),
            Paragraph(f"{profile.pan_number if profile and profile.pan_number else '—'}", normal_style),
            Paragraph("LOP Days:", bold_style),
            Paragraph(f"{payslip.lop_days}", normal_style)
        ]
    ]
    
    # 540 width total
    details_table = Table(details_data, colWidths=[110, 160, 110, 160])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#EEEEEE')),
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 20))

    # 3. Earnings & Deductions Tables side-by-side
    earnings_list = [[Paragraph("Earnings Component", header_style), Paragraph("Amount (INR)", header_style)]]
    for k, v in payslip.earnings_breakdown.items():
        earnings_list.append([Paragraph(k, normal_style), Paragraph(f"₹{v:,.2f}", normal_style)])
        
    deductions_list = [[Paragraph("Deductions Component", header_style), Paragraph("Amount (INR)", header_style)]]
    for k, v in payslip.deductions_breakdown.items():
        deductions_list.append([Paragraph(k, normal_style), Paragraph(f"₹{v:,.2f}", normal_style)])

    # Pad the shorter list to match lengths
    max_len = max(len(earnings_list), len(deductions_list))
    while len(earnings_list) < max_len:
        earnings_list.append([Paragraph("", normal_style), Paragraph("", normal_style)])
    while len(deductions_list) < max_len:
        deductions_list.append([Paragraph("", normal_style), Paragraph("", normal_style)])

    # Combined side by side structure
    combined_data = []
    for i in range(max_len):
        combined_data.append([
            earnings_list[i][0], earnings_list[i][1],
            Paragraph("", normal_style), # Spacer column
            deductions_list[i][0], deductions_list[i][1]
        ])

    # 540 width total: E_name(170), E_amt(90), Spacer(20), D_name(170), D_amt(90)
    payslip_table = Table(combined_data, colWidths=[170, 90, 20, 170, 90])
    payslip_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (1,0), primary_color),
        ('BACKGROUND', (3,0), (4,0), primary_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (1,-1), 0.5, colors.HexColor('#EAEAEA')),
        ('LINEBELOW', (3,0), (4,-1), 0.5, colors.HexColor('#EAEAEA')),
        ('LINEBELOW', (0,0), (1,0), 1, primary_color),
        ('LINEBELOW', (3,0), (4,0), 1, primary_color),
    ]))
    
    story.append(payslip_table)
    story.append(Spacer(1, 15))

    # 4. Totals Block Table
    totals_data = [
        [
            Paragraph("Gross Earnings:", bold_style),
            Paragraph(f"₹{payslip.gross_earnings:,.2f}", bold_style),
            Paragraph("", normal_style),
            Paragraph("Total Deductions:", bold_style),
            Paragraph(f"₹{payslip.total_deductions:,.2f}", bold_style)
        ]
    ]
    
    totals_table = Table(totals_data, colWidths=[170, 90, 20, 170, 90])
    totals_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (1,-1), 1, primary_color),
        ('LINEBELOW', (3,0), (4,-1), 1, primary_color),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 20))

    # 5. Net Pay Summary Banner
    net_data = [
        [
            Paragraph("NET TAKE HOME PAY:", ParagraphStyle('NetLbl', parent=bold_style, textColor=colors.white, fontSize=11)),
            Paragraph(f"INR {payslip.net_pay:,.2f}", ParagraphStyle('NetVal', parent=bold_style, textColor=colors.white, fontSize=12, alignment=2))
        ]
    ]
    
    net_table = Table(net_data, colWidths=[200, 340])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), primary_color),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(net_table)
    story.append(Spacer(1, 40))

    # 6. Signatures block
    sig_data = [
        [
            Paragraph("_____________________________<br/>Employer Signature", normal_style),
            Paragraph("", normal_style),
            Paragraph("_____________________________<br/>Employee Signature", normal_style)
        ]
    ]
    sig_table = Table(sig_data, colWidths=[220, 100, 220])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer


# ===========================================================================
# Checklists Templates Config (Phase 4: Advanced)
# ===========================================================================

async def list_checklist_templates(db: AsyncSession, org_id: int) -> list[HRChecklistTemplate]:
    res = await db.execute(
        select(HRChecklistTemplate).where(
            and_(HRChecklistTemplate.organization_id == org_id, HRChecklistTemplate.is_deleted == False)
        ).order_by(HRChecklistTemplate.id.desc())
    )
    return list(res.scalars().all())


async def create_checklist_template(db: AsyncSession, org_id: int, payload: ChecklistTemplateCreate) -> HRChecklistTemplate:
    tmpl = HRChecklistTemplate(
        organization_id=org_id,
        name=payload.name,
        checklist_type=payload.checklist_type,
        tasks=payload.tasks,
        is_active=payload.is_active,
        others=payload.others,
    )
    db.add(tmpl)
    await db.commit()
    await db.refresh(tmpl)
    return tmpl


async def update_checklist_template(db: AsyncSession, org_id: int, id: int, payload: ChecklistTemplateUpdate) -> HRChecklistTemplate:
    res = await db.execute(
        select(HRChecklistTemplate).where(
            and_(
                HRChecklistTemplate.organization_id == org_id,
                HRChecklistTemplate.id == id,
                HRChecklistTemplate.is_deleted == False
            )
        )
    )
    tmpl = res.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist template not found")

    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(tmpl, field, val)

    await db.commit()
    await db.refresh(tmpl)
    return tmpl


async def delete_checklist_template(db: AsyncSession, org_id: int, id: int) -> None:
    res = await db.execute(
        select(HRChecklistTemplate).where(
            and_(
                HRChecklistTemplate.organization_id == org_id,
                HRChecklistTemplate.id == id,
                HRChecklistTemplate.is_deleted == False
            )
        )
    )
    tmpl = res.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist template not found")

    tmpl.is_deleted = True
    tmpl.deleted_at = datetime.utcnow()
    await db.commit()


# ===========================================================================
# Checklists Instances Tracking (Phase 4: Advanced)
# ===========================================================================

async def list_checklist_instances(db: AsyncSession, org_id: int) -> list[HRChecklistInstance]:
    res = await db.execute(
        select(HRChecklistInstance).where(
            and_(HRChecklistInstance.organization_id == org_id, HRChecklistInstance.is_deleted == False)
        ).options(
            selectinload(HRChecklistInstance.user),
            selectinload(HRChecklistInstance.template)
        ).order_by(HRChecklistInstance.id.desc())
    )
    return list(res.scalars().all())


async def create_checklist_instance(db: AsyncSession, org_id: int, payload: ChecklistInstanceCreate) -> HRChecklistInstance:
    # Verify template
    t_res = await db.execute(
        select(HRChecklistTemplate).where(
            and_(
                HRChecklistTemplate.organization_id == org_id,
                HRChecklistTemplate.id == payload.template_id,
                HRChecklistTemplate.is_deleted == False
            )
        )
    )
    tmpl = t_res.scalar_one_or_none()
    if not tmpl:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid checklist template ID")

    # Verify user exists in the org
    u_res = await db.execute(
        select(User).where(and_(User.organization_id == org_id, User.id == payload.user_id, User.is_deleted == False))
    )
    if not u_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid employee user ID")

    # Initialize task statuses, seeding a computed due_date from each task's
    # optional "due_days" (days from launch) so the tracker UI can flag overdue items.
    launch_date = date.today()
    task_statuses = {}
    for task in tmpl.tasks:
        task_id = task.get("id")
        if task_id:
            due_days = task.get("due_days")
            due_date = None
            if isinstance(due_days, (int, float)):
                due_date = (launch_date + timedelta(days=int(due_days))).isoformat()
            task_statuses[task_id] = {
                "completed": False,
                "completed_by_id": None,
                "completed_at": None,
                "due_date": due_date,
            }

    inst = HRChecklistInstance(
        organization_id=org_id,
        user_id=payload.user_id,
        template_id=payload.template_id,
        status=ChecklistStatus.PENDING,
        task_statuses=task_statuses,
        others=payload.others,
    )
    db.add(inst)
    await db.commit()

    # Launching a lifecycle checklist marks the employee as being mid-transition:
    # onboarding -> PROBATION, offboarding -> ON_NOTICE. Skip if they're already
    # in a terminal state (resigned/terminated) to avoid clobbering an exit record.
    profile_res = await db.execute(
        select(HREmployeeProfile).where(
            and_(
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.user_id == payload.user_id,
                HREmployeeProfile.is_deleted == False,
            )
        )
    )
    profile = profile_res.scalar_one_or_none()
    if profile and profile.employee_status not in (EmployeeStatus.RESIGNED, EmployeeStatus.TERMINATED):
        if tmpl.checklist_type == ChecklistType.ONBOARDING:
            profile.employee_status = EmployeeStatus.PROBATION
        elif tmpl.checklist_type == ChecklistType.OFFBOARDING:
            profile.employee_status = EmployeeStatus.ON_NOTICE
        await db.commit()

    # Reload with relations
    res = await db.execute(
        select(HRChecklistInstance).where(HRChecklistInstance.id == inst.id)
        .options(
            selectinload(HRChecklistInstance.user),
            selectinload(HRChecklistInstance.template)
        )
    )
    return res.scalar_one()


async def toggle_checklist_task(db: AsyncSession, org_id: int, id: int, task_id: str, completed: bool, actor_id: int) -> HRChecklistInstance:
    res = await db.execute(
        select(HRChecklistInstance).where(
            and_(
                HRChecklistInstance.organization_id == org_id,
                HRChecklistInstance.id == id,
                HRChecklistInstance.is_deleted == False
            )
        ).options(
            selectinload(HRChecklistInstance.user),
            selectinload(HRChecklistInstance.template)
        )
    )
    inst = res.scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist instance not found")

    # Update task state in JSON
    # Duplicate dictionary to let SQLAlchemy detect mutation
    task_statuses = dict(inst.task_statuses)
    if task_id not in task_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Task ID '{task_id}' not found in checklist")

    existing = task_statuses[task_id]
    if completed:
        task_statuses[task_id] = {
            **existing,
            "completed": True,
            "completed_by_id": actor_id,
            "completed_at": datetime.utcnow().isoformat()
        }
    else:
        task_statuses[task_id] = {
            **existing,
            "completed": False,
            "completed_by_id": None,
            "completed_at": None
        }

    # Verify if all completed
    was_completed = inst.status == ChecklistStatus.COMPLETED
    all_completed = all(v.get("completed") for v in task_statuses.values())
    inst.status = ChecklistStatus.COMPLETED if all_completed else ChecklistStatus.PENDING
    inst.task_statuses = task_statuses

    # Finishing a lifecycle checklist closes out the employee's transition:
    # onboarding complete -> ACTIVE, offboarding complete -> RESIGNED/TERMINATED
    # (per the exit_reason captured at launch, defaulting to resigned) + exit date.
    if all_completed and not was_completed:
        profile_res = await db.execute(
            select(HREmployeeProfile).where(
                and_(
                    HREmployeeProfile.organization_id == org_id,
                    HREmployeeProfile.user_id == inst.user_id,
                    HREmployeeProfile.is_deleted == False,
                )
            )
        )
        profile = profile_res.scalar_one_or_none()
        if profile and inst.template.checklist_type == ChecklistType.ONBOARDING:
            profile.employee_status = EmployeeStatus.ACTIVE
        elif profile and inst.template.checklist_type == ChecklistType.OFFBOARDING:
            exit_reason = (inst.others or {}).get("exit_reason", "resigned")
            profile.employee_status = (
                EmployeeStatus.TERMINATED if exit_reason == "terminated" else EmployeeStatus.RESIGNED
            )
            if not profile.date_of_leaving:
                profile.date_of_leaving = date.today()

    await db.commit()
    await db.refresh(inst)
    return inst


async def delete_checklist_instance(db: AsyncSession, org_id: int, id: int) -> None:
    res = await db.execute(
        select(HRChecklistInstance).where(
            and_(
                HRChecklistInstance.organization_id == org_id,
                HRChecklistInstance.id == id,
                HRChecklistInstance.is_deleted == False
            )
        )
    )
    inst = res.scalar_one_or_none()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checklist tracker not found")

    inst.is_deleted = True
    inst.deleted_at = datetime.utcnow()
    await db.commit()


# ===========================================================================
# Documents Management (Phase 4: Advanced)
# ===========================================================================

async def list_employee_documents(db: AsyncSession, org_id: int, user_id: Optional[int] = None) -> list[HREmployeeDocument]:
    conditions = [HREmployeeDocument.organization_id == org_id, HREmployeeDocument.is_deleted == False]
    if user_id:
        conditions.append(HREmployeeDocument.user_id == user_id)

    res = await db.execute(
        select(HREmployeeDocument).where(and_(*conditions))
        .options(
            selectinload(HREmployeeDocument.user),
            selectinload(HREmployeeDocument.verified_by)
        ).order_by(HREmployeeDocument.id.desc())
    )
    return list(res.scalars().all())


async def create_employee_document(
    db: AsyncSession,
    org_id: int,
    user_id: int,
    document_type: str,
    file_url: str,
    expiry_date: Optional[date] = None,
    others: Optional[dict] = None
) -> HREmployeeDocument:
    # Verify user belongs to the org
    u_res = await db.execute(
        select(User).where(and_(User.organization_id == org_id, User.id == user_id, User.is_deleted == False))
    )
    if not u_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid employee user ID")

    doc = HREmployeeDocument(
        organization_id=org_id,
        user_id=user_id,
        document_type=document_type,
        file_url=file_url,
        expiry_date=expiry_date,
        is_verified=False,
        others=others,
    )
    db.add(doc)
    await db.commit()
    
    # Reload with relations
    res = await db.execute(
        select(HREmployeeDocument).where(HREmployeeDocument.id == doc.id)
        .options(selectinload(HREmployeeDocument.user))
    )
    return res.scalar_one()


async def verify_employee_document(db: AsyncSession, org_id: int, id: int, verified_by_id: int, is_verified: bool) -> HREmployeeDocument:
    res = await db.execute(
        select(HREmployeeDocument).where(
            and_(
                HREmployeeDocument.organization_id == org_id,
                HREmployeeDocument.id == id,
                HREmployeeDocument.is_deleted == False
            )
        ).options(selectinload(HREmployeeDocument.user))
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.is_verified = is_verified
    doc.verified_by_id = verified_by_id if is_verified else None
    doc.verified_at = datetime.utcnow() if is_verified else None
    await db.commit()
    await db.refresh(doc)
    return doc


async def delete_employee_document(db: AsyncSession, org_id: int, id: int) -> None:
    res = await db.execute(
        select(HREmployeeDocument).where(
            and_(
                HREmployeeDocument.organization_id == org_id,
                HREmployeeDocument.id == id,
                HREmployeeDocument.is_deleted == False
            )
        )
    )
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    doc.is_deleted = True
    doc.deleted_at = datetime.utcnow()
    await db.commit()


# ===========================================================================
# HR Analytics & Reports (Phase 4: Advanced)
# ===========================================================================

async def get_headcount_report(db: AsyncSession, org_id: int) -> HeadcountReportResponse:
    # Query active employees in the org
    res = await db.execute(
        select(HREmployeeProfile).where(
            and_(
                HREmployeeProfile.organization_id == org_id,
                HREmployeeProfile.employee_status != EmployeeStatus.TERMINATED,
                HREmployeeProfile.is_deleted == False
            )
        ).options(
            selectinload(HREmployeeProfile.department),
            selectinload(HREmployeeProfile.designation)
        )
    )
    profiles = res.scalars().all()
    
    dept_dist = {}
    desig_dist = {}
    emptype_dist = {}
    invited_count = 0

    for p in profiles:
        dept_name = p.department.name if p.department else "No Department"
        desig_name = p.designation.name if p.designation else "No Designation"
        emp_type = p.employment_type.value

        dept_dist[dept_name] = dept_dist.get(dept_name, 0) + 1
        desig_dist[desig_name] = desig_dist.get(desig_name, 0) + 1
        emptype_dist[emp_type] = emptype_dist.get(emp_type, 0) + 1
        if p.user_id is not None:
            invited_count += 1

    return HeadcountReportResponse(
        department_distribution=dept_dist,
        designation_distribution=desig_dist,
        employment_type_distribution=emptype_dist,
        total_count=len(profiles),
        invited_count=invited_count
    )


async def get_attrition_report(db: AsyncSession, org_id: int) -> AttritionReportResponse:
    # Retrieve all profiles (including terminated ones to compute joins/resigns)
    res = await db.execute(
        select(HREmployeeProfile).where(
            and_(HREmployeeProfile.organization_id == org_id, HREmployeeProfile.is_deleted == False)
        )
    )
    profiles = res.scalars().all()
    
    # We will aggregate joiners vs leavers by Month-Year over the past 12 months
    import collections
    from datetime import timedelta
    
    today = date.today()
    months_keys = []
    # Build list of past 12 months
    for i in range(11, -1, -1):
        # Subtract months
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        months_keys.append((y, m))

    month_names = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
        7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    }
    
    joiners_count = collections.Counter()
    leavers_count = collections.Counter()
    
    for p in profiles:
        if p.date_of_joining:
            jd = p.date_of_joining
            joiners_count[(jd.year, jd.month)] += 1
        if p.date_of_leaving:
            ld = p.date_of_leaving
            leavers_count[(ld.year, ld.month)] += 1
            
    timeline = []
    total_leavers_12m = 0
    headcounts = []
    current_headcount = 0
    
    # Simple headcount progression calculation over 12 months
    # 1. Starting headcount 12 months ago
    starting_hc = 0
    for p in profiles:
        if p.date_of_joining and p.date_of_joining < date(months_keys[0][0], months_keys[0][1], 1):
            if not p.date_of_leaving or p.date_of_leaving >= date(months_keys[0][0], months_keys[0][1], 1):
                starting_hc += 1
                
    current_headcount = starting_hc
    
    for y, m in months_keys:
        joins = joiners_count[(y, m)]
        leaves = leavers_count[(y, m)]
        total_leavers_12m += leaves
        current_headcount = current_headcount + joins - leaves
        headcounts.append(current_headcount)
        
        month_label = f"{month_names[m]} {y}"
        timeline.append({
            "month_year": month_label,
            "joiners": joins,
            "leavers": leaves,
            "headcount": current_headcount
        })

    avg_headcount = sum(headcounts) / len(headcounts) if headcounts else 1.0
    if avg_headcount == 0:
        avg_headcount = 1.0
        
    attrition_rate = round((total_leavers_12m / avg_headcount) * 100.0, 2)
    
    return AttritionReportResponse(
        timeline=timeline,
        annual_attrition_rate=attrition_rate
    )


async def get_leaves_report(db: AsyncSession, org_id: int) -> LeaveSummaryReportResponse:
    # 1. approved requests
    req_res = await db.execute(
        select(HRLeaveRequest).where(
            and_(
                HRLeaveRequest.organization_id == org_id,
                HRLeaveRequest.status == LeaveStatus.APPROVED,
                HRLeaveRequest.is_deleted == False
            )
        )
    )
    requests = req_res.scalars().all()
    
    # Average days calculated
    total_days = sum(r.total_days for r in requests)
    avg_days = round(total_days / len(requests), 2) if requests else 0.0

    # 2. Leave balances averages by leave type
    bal_res = await db.execute(
        select(HRLeaveBalance).where(
            and_(
                HRLeaveBalance.organization_id == org_id,
                HRLeaveBalance.year == date.today().year,
                HRLeaveBalance.is_deleted == False
            )
        ).options(selectinload(HRLeaveBalance.leave_type))
    )
    balances = bal_res.scalars().all()
    
    type_stats = {}
    for b in balances:
        name = b.leave_type.name
        if name not in type_stats:
            type_stats[name] = {"allocated": 0.0, "used": 0.0, "remaining": 0.0, "count": 0}
        type_stats[name]["allocated"] += b.allocated
        type_stats[name]["used"] += b.used
        type_stats[name]["remaining"] += (b.allocated - b.used)
        type_stats[name]["count"] += 1

    type_timeline = []
    for name, stat in type_stats.items():
        cnt = stat["count"] if stat["count"] > 0 else 1
        type_timeline.append({
            "type": name,
            "allocated": round(stat["allocated"] / cnt, 1),
            "used": round(stat["used"] / cnt, 1),
            "remaining": round(stat["remaining"] / cnt, 1)
        })

    return LeaveSummaryReportResponse(
        leave_type_balances=type_timeline,
        total_approved_requests=len(requests),
        average_leave_days=avg_days
    )


async def get_payroll_report(db: AsyncSession, org_id: int) -> PayrollCostReportResponse:
    # Query payroll cost trend based on finalized payslips over past 12 runs
    res = await db.execute(
        select(HRPayslip).where(
            and_(HRPayslip.organization_id == org_id, HRPayslip.is_deleted == False)
        ).options(selectinload(HRPayslip.payroll_run))
    )
    slips = res.scalars().all()
    
    import collections
    run_costs = collections.defaultdict(lambda: {"gross": 0.0, "net": 0.0})
    
    for s in slips:
        run_key = (s.payroll_run.year, s.payroll_run.month)
        run_costs[run_key]["gross"] += s.gross_earnings
        run_costs[run_key]["net"] += s.net_pay

    # Sort past runs
    sorted_runs = sorted(run_costs.keys(), key=lambda x: (x[0], x[1]))[-12:]
    
    month_names = {
        1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
        7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    }

    timeline = []
    current_cost = 0.0
    for key in sorted_runs:
        cost = run_costs[key]
        month_label = f"{month_names[key[1]]} {key[0]}"
        timeline.append({
            "month_year": month_label,
            "gross_total": round(cost["gross"], 2),
            "net_total": round(cost["net"], 2)
        })
        current_cost = cost["net"]

    # Fallback to annual CTC/12 estimate if no slips processed yet
    if not timeline:
        emp_sal_res = await db.execute(
            select(HREmployeeSalary).where(
                and_(
                    HREmployeeSalary.organization_id == org_id,
                    HREmployeeSalary.is_active == True,
                    HREmployeeSalary.is_deleted == False
                )
            )
        )
        total_monthly_ctc = sum(es.ctc for es in emp_sal_res.scalars().all()) / 12.0
        current_cost = total_monthly_ctc
        timeline.append({
            "month_year": "Current Month (Estimate)",
            "gross_total": round(total_monthly_ctc, 2),
            "net_total": round(total_monthly_ctc, 2)
        })

    return PayrollCostReportResponse(
        monthly_trend=timeline,
        current_month_cost=round(current_cost, 2)
    )



