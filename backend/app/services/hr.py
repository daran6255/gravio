"""HR Module — Service layer (Phase 1: Foundation)

Handles Departments, Designations, and Employee Profiles.
All queries are org-scoped via organization_id.
"""

import uuid
from typing import Optional
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.models.hr import HRDepartment, HRDesignation, HREmployeeProfile
from app.models.user import User
from app.schemas.hr import (
    DepartmentCreate, DepartmentUpdate, DepartmentListItem, DepartmentResponse,
    DesignationCreate, DesignationUpdate, DesignationListItem, DesignationResponse,
    EmployeeProfileCreate, EmployeeProfileUpdate, EmployeeListItem, EmployeeResponse,
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
