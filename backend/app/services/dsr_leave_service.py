"""DSR Leave Application Service"""

from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dsr_leave_application import DSRLeaveApplication, DSRLeaveStatus
from app.models.user import User, UserRole
from app.schemas.dsr_leave_application import (
    DSRLeaveApplicationCreate,
    DSRLeaveApplicationUpdate,
)
from app.repositories.dsr_leave_application_repository import DSRLeaveApplicationRepository
from app.repositories.dsr_entry_repository import DSREntryRepository
from app.services.company_holiday_service import CompanyHolidayService


class DSRLeaveService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DSRLeaveApplicationRepository(db)
        self.entry_repo = DSREntryRepository(db)
        self.holiday_service = CompanyHolidayService(db)

    async def create_leave_application(
        self, data: DSRLeaveApplicationCreate, current_user: User
    ) -> DSRLeaveApplication:
        if data.end_date < data.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date cannot be before start date"
            )

        # Check for overlaps
        overlaps = await self.repo.get_overlapping_leaves(
            current_user.id, data.start_date, data.end_date
        )
        if overlaps:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Leave application overlaps with an existing requested or approved leave."
            )

        # Holiday check
        holidays = await self.holiday_service.get_holidays_in_range(data.start_date, data.end_date)
        if holidays:
            holiday_str = ", ".join([str(h) for h in holidays])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Leave application covers company holidays: {holiday_str}. Leaves cannot be applied on holidays."
            )

        leave_data = {
            "user_id": current_user.id,
            "start_date": data.start_date,
            "end_date": data.end_date,
            "leave_type": data.leave_type,
            "reason": data.reason,
            "status": DSRLeaveStatus.PENDING,
        }
        
        # For now, all leaves go through the pending workflow.
        # if current_user.role in (UserRole.ADMIN, UserRole.MANAGER):
        #     leave_data["status"] = DSRLeaveStatus.APPROVED
        #     leave_data["handled_by"] = current_user.id
        #     leave_data["handled_at"] = datetime.utcnow()
        #     leave_data["admin_notes"] = "Auto-approved for privileged user."

        return await self.repo.create(leave_data)

    async def get_my_leaves(
        self, current_user: User, skip: int = 0, limit: int = 50, status: Optional[DSRLeaveStatus] = None
    ) -> Tuple[List[DSRLeaveApplication], int]:
        return await self.repo.get_by_user(current_user.id, skip=skip, limit=limit, status=status)

    async def get_all_leaves(
        self, current_user: User, skip: int = 0, limit: int = 100, status: Optional[DSRLeaveStatus] = None, user_id: Optional[int] = None
    ) -> Tuple[List[DSRLeaveApplication], int]:
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(status_code=403, detail="Not authorized")
        return await self.repo.get_all_requests(skip=skip, limit=limit, status=status, user_id=user_id)

    async def handle_leave_application(
        self, public_id: UUID, data: DSRLeaveApplicationUpdate, current_user: User
    ) -> DSRLeaveApplication:
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(status_code=403, detail="Not authorized")

        application = await self.repo.get_by_public_id(public_id)
        if not application:
            raise HTTPException(status_code=404, detail="Leave application not found")

        update_data = {
            "status": data.status,
            "admin_notes": data.admin_notes,
            "handled_by": current_user.id,
            "handled_at": datetime.utcnow(),
        }
        
        return await self.repo.update(application.id, update_data)

    async def cancel_leave_application(self, public_id: UUID, current_user: User) -> DSRLeaveApplication:
        application = await self.repo.get_by_public_id(public_id)
        if not application:
            raise HTTPException(status_code=404, detail="Leave application not found")

        if application.user_id != current_user.id and current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(status_code=403, detail="Not authorized")

        if application.status != DSRLeaveStatus.PENDING and current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(status_code=400, detail="Only pending applications can be cancelled by user")

        update_data = {"status": DSRLeaveStatus.CANCELLED}
        return await self.repo.update(application.id, update_data)

    async def get_leave_stats(self, current_user: User) -> dict:
        return await self.repo.get_stats(current_user.id)
