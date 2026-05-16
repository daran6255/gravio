"""Company Holiday Service — core business logic for holidays"""

import csv
import io
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company_holiday import CompanyHoliday
from app.models.user import User, UserRole
from app.schemas.company_holiday import CompanyHolidayCreate, CompanyHolidayUpdate
from app.repositories.company_holiday_repository import CompanyHolidayRepository


class CompanyHolidayService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CompanyHolidayRepository(db)

    async def create_holiday(self, data: CompanyHolidayCreate, current_user: User) -> CompanyHoliday:
        """Create a single holiday entry"""
        # Admin/Manager only for creation
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admins and Managers can create holidays",
            )

        # Check for ANY record with this date (deleted or not) to avoid UniqueViolationError
        existing = await self.repo.get_by_date(data.holiday_date, include_deleted=True)
        if existing:
            if not existing.is_deleted:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"A holiday already exists for {data.holiday_date}",
                )
            else:
                # Restore the deleted holiday
                existing.restore()
                existing.holiday_name = data.holiday_name
                existing.created_by_id = current_user.id
                await self.db.flush()
                await self.db.refresh(existing)
                return existing

        holiday_data = data.model_dump()
        holiday_data["created_by_id"] = current_user.id
        return await self.repo.create(holiday_data)

    async def get_holidays(
        self,
        skip: int = 0,
        limit: int = 100,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> Tuple[List[CompanyHoliday], int]:
        """List holidays with filters"""
        return await self.repo.get_all_holidays(skip=skip, limit=limit, date_from=date_from, date_to=date_to)

    async def update_holiday(self, public_id: UUID, data: CompanyHolidayUpdate, current_user: User) -> CompanyHoliday:
        """Update an existing holiday"""
        # Admin/Manager only
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admins and Managers can update holidays",
            )

        holiday = await self.repo.get_by_public_id(public_id)
        if not holiday:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Holiday not found",
            )

        update_data = data.model_dump(exclude_unset=True)
        
        # If date is being updated, check for conflicts
        if "holiday_date" in update_data and update_data["holiday_date"] != holiday.holiday_date:
            conflict = await self.repo.get_by_date(update_data["holiday_date"], include_deleted=True)
            if conflict and conflict.id != holiday.id:
                if not conflict.is_deleted:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"A holiday already exists for {update_data['holiday_date']}",
                    )
                else:
                    # Date conflict with a deleted record - we can't easily "transplant" 
                    # but we can hard delete the old deleted one or just error out.
                    # For now, let's just error out to keep it simple.
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Cannot update to {update_data['holiday_date']} because a deleted holiday with this date exists. Please contact admin.",
                    )

        updated = await self.repo.update(holiday.id, update_data)
        if not updated:
            raise HTTPException(status_code=400, detail="Failed to update holiday")
        return updated

    async def delete_holiday(self, public_id: UUID, current_user: User) -> bool:
        """Delete a holiday"""
        # Only Admins can delete
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admins can delete holidays",
            )

        holiday = await self.repo.get_by_public_id(public_id)
        if not holiday:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Holiday not found",
            )
        return await self.repo.delete(holiday.id)

    async def import_holidays_csv(self, file: UploadFile, current_user: User) -> dict:
        """Import holidays from CSV file: date,name"""
        if current_user.role not in (UserRole.ADMIN, UserRole.MANAGER):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admins and Managers can import holidays",
            )

        content = await file.read()
        
        # Robust decoding strategy
        try:
            decoded = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                decoded = content.decode("utf-8-sig")
            except UnicodeDecodeError:
                # Fallback to cp1252 which is common for Excel-exported CSVs on Windows
                decoded = content.decode("cp1252", errors="replace")
        
        reader = list(csv.DictReader(io.StringIO(decoded)))

        total_rows = len(reader)
        imported_count = 0
        skipped_count = 0
        errors = []

        for index, row in enumerate(reader):
            line_num = index + 2 # Header is row 1
            try:
                if not row.get("date") or not row.get("name"):
                    skipped_count += 1
                    errors.append({"row": line_num, "error": "Missing date or name column"})
                    continue

                date_str = row["date"].strip()
                h_date = None
                
                # Try common formats to be robust (ISO, Indian/common formats)
                for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d"):
                    try:
                        h_date = datetime.strptime(date_str, fmt).date()
                        break
                    except ValueError:
                        continue
                
                if not h_date:
                    raise ValueError(f"Unsupported date format: '{date_str}'. Use YYYY-MM-DD or DD-MM-YYYY.")

                h_name = row["name"].strip()

                existing = await self.repo.get_by_date(h_date, include_deleted=True)
                if existing:
                    if existing.is_deleted:
                        # Restore deleted holiday
                        existing.is_deleted = False
                        existing.deleted_at = None
                        existing.holiday_name = h_name
                        existing.created_by_id = current_user.id
                    else:
                        # Update existing holiday
                        existing.holiday_name = h_name
                    await self.db.flush()
                else:
                    # Create new holiday
                    await self.repo.create({
                        "holiday_date": h_date,
                        "holiday_name": h_name,
                        "created_by_id": current_user.id
                    })
                imported_count += 1
            except Exception as e:
                skipped_count += 1
                errors.append({"row": line_num, "error": str(e)})

        return {
            "total_rows": total_rows,
            "created": imported_count,
            "skipped": skipped_count,
            "errors": errors
        }

    async def is_holiday(self, check_date: date) -> bool:
        """Helper for other services to check if a date is a holiday (including 2nd Saturdays)"""
        # 1. Check if it's the 2nd Saturday
        if check_date.weekday() == 5:  # Saturday
            # A day is the 2nd Saturday if its day of month is between 8 and 14
            if 8 <= check_date.day <= 14:
                return True

        # 2. Check database for explicit holidays
        return await self.repo.is_holiday(check_date)

    async def get_holidays_in_range(self, start_date: date, end_date: date) -> List[date]:
        """Helper for other services to get holidays in a range (including 2nd Saturdays)"""
        # 1. Get explicit holidays from DB
        db_holidays = await self.repo.get_holidays_in_range(start_date, end_date)
        
        # 2. Add 2nd Saturdays in range
        all_holidays = set(db_holidays)
        curr = start_date
        while curr <= end_date:
            if curr.weekday() == 5:  # Saturday
                if 8 <= curr.day <= 14:
                    all_holidays.add(curr)
            curr += timedelta(days=1)
            
        return sorted(list(all_holidays))
