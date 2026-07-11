"""HR Module — Service layer (Phase 1: Foundation)

Handles Departments, Designations, and Employee Profiles.
All queries are org-scoped via organization_id.
"""

from datetime import date, datetime
import uuid
from typing import Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.hr import (
    HRDepartment, HRDesignation, HREmployeeProfile,
    HRLeaveType, HRLeaveBalance, HRLeaveRequest, LeaveStatus
)
from app.models.user import User
from app.schemas.hr import (
    DepartmentCreate, DepartmentUpdate, DepartmentListItem, DepartmentResponse,
    DesignationCreate, DesignationUpdate, DesignationListItem, DesignationResponse,
    EmployeeProfileCreate, EmployeeProfileUpdate, EmployeeListItem, EmployeeResponse,
    LeaveTypeCreate, LeaveTypeUpdate, LeaveTypeResponse,
    LeaveBalanceUpdate, LeaveBalanceResponse,
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse, LeaveApprovalRequest
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
        employee_id=profile.employee_id,
        full_name=user.full_name if user else None,
        email=user.email if user else None,
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
        full_name=user.full_name if user else None,
        email=user.email if user else None,
        username=user.username if user else None,
        role=user.role.value if user else None,
        is_active=user.is_active if user else None,
        avatar=user.avatar if user else None,
        job_title=user.job_title if user else None,
        phone=user.phone if user else None,
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

    return [
        DesignationListItem(
            id=d.id,
            public_id=d.public_id,
            name=d.name,
            department_id=d.department_id,
            department_name=d.department.name if d.department else None,
            grade=d.grade,
            is_active=d.is_active,
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
        .join(HREmployeeProfile.user)
    )

    if department_id:
        q = q.where(HREmployeeProfile.department_id == department_id)
    if status_filter:
        q = q.where(HREmployeeProfile.employee_status == status_filter)
    if search:
        q = q.where(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))

    count_result = await db.execute(select(func.count()).select_from(q.subquery()))
    total = count_result.scalar() or 0

    result = await db.execute(q.order_by(User.full_name).offset(skip).limit(limit))
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

    emp_id = payload.employee_id or await _generate_employee_id(db, org_id)

    profile = HREmployeeProfile(
        organization_id=org_id,
        user_id=payload.user_id,
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
    return _leave_req_response(req)


async def approve_reject_leave_request(
    db: AsyncSession,
    org_id: int,
    public_id: uuid.UUID,
    manager_user_id: int,
    payload: LeaveApprovalRequest,
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
    return _leave_req_response(req)

