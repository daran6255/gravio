"""Company Holiday Repository"""

from datetime import date
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company_holiday import CompanyHoliday
from app.repositories.base import BaseRepository


class CompanyHolidayRepository(BaseRepository[CompanyHoliday]):

    def __init__(self, db: AsyncSession):
        super().__init__(CompanyHoliday, db)

    async def get_by_public_id(self, public_id: UUID) -> Optional[CompanyHoliday]:
        result = await self.db.execute(
            select(CompanyHoliday)
            .where(CompanyHoliday.public_id == public_id)
            .where(CompanyHoliday.is_deleted == False)
        )
        return result.scalar_one_or_none()

    async def get_by_date(self, holiday_date: date, include_deleted: bool = False) -> Optional[CompanyHoliday]:
        query = select(CompanyHoliday).where(CompanyHoliday.holiday_date == holiday_date)
        if not include_deleted:
            query = query.where(CompanyHoliday.is_deleted == False)
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all_holidays(
        self,
        skip: int = 0,
        limit: int = 100,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> Tuple[List[CompanyHoliday], int]:
        query = select(CompanyHoliday).where(CompanyHoliday.is_deleted == False)
        count_query = select(func.count()).select_from(CompanyHoliday).where(CompanyHoliday.is_deleted == False)

        if date_from:
            query = query.where(CompanyHoliday.holiday_date >= date_from)
            count_query = count_query.where(CompanyHoliday.holiday_date >= date_from)
        if date_to:
            query = query.where(CompanyHoliday.holiday_date <= date_to)
            count_query = count_query.where(CompanyHoliday.holiday_date <= date_to)

        total = (await self.db.execute(count_query)).scalar_one()
        query = query.order_by(CompanyHoliday.holiday_date.asc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def is_holiday(self, check_date: date) -> bool:
        """Check if a given date is a company holiday"""
        result = await self.db.execute(
            select(func.count())
            .select_from(CompanyHoliday)
            .where(CompanyHoliday.holiday_date == check_date)
            .where(CompanyHoliday.is_deleted == False)
        )
        return result.scalar_one() > 0

    async def get_holidays_in_range(self, start_date: date, end_date: date) -> List[date]:
        """Returns a list of holiday dates within the given range"""
        result = await self.db.execute(
            select(CompanyHoliday.holiday_date)
            .where(CompanyHoliday.holiday_date >= start_date)
            .where(CompanyHoliday.holiday_date <= end_date)
            .where(CompanyHoliday.is_deleted == False)
        )
        return list(result.scalars().all())
