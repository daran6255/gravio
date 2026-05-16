"""Company Holiday schemas"""

import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class CompanyHolidayBase(BaseModel):
    holiday_date: date = Field(..., description="Date of the holiday")
    holiday_name: str = Field(..., min_length=1, max_length=255, description="Name of the holiday")


class CompanyHolidayCreate(CompanyHolidayBase):
    pass


class CompanyHolidayUpdate(BaseModel):
    holiday_date: Optional[date] = None
    holiday_name: Optional[str] = Field(None, min_length=1, max_length=255)


class CompanyHolidayResponse(CompanyHolidayBase):
    id: int
    public_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[int] = None

    model_config = {"from_attributes": True}


class CompanyHolidayListResponse(BaseModel):
    items: list[CompanyHolidayResponse]
    total: int
