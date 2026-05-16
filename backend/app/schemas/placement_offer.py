from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.models.placement_offer import OfferResponse, JoiningStatus


class PlacementOfferBase(BaseModel):
    mapping_id: int
    candidate_id: int
    job_role_id: int
    offered_ctc: Optional[float] = None
    offered_designation: Optional[str] = None
    work_location: Optional[str] = None
    joining_date: Optional[date] = None
    offer_letter_url: Optional[str] = None
    offer_letter_id: Optional[int] = None
    offer_date: Optional[date] = None
    response_deadline: Optional[date] = None
    candidate_response: OfferResponse = OfferResponse.PENDING
    response_date: Optional[date] = None
    rejection_reason: Optional[str] = None
    actual_joining_date: Optional[date] = None
    joining_status: Optional[JoiningStatus] = None


class PlacementOfferCreate(PlacementOfferBase):
    offered_by_id: Optional[int] = None


class PlacementOfferUpdate(BaseModel):
    offered_ctc: Optional[float] = None
    offered_designation: Optional[str] = None
    work_location: Optional[str] = None
    joining_date: Optional[date] = None
    offer_letter_url: Optional[str] = None
    offer_date: Optional[date] = None
    response_deadline: Optional[date] = None
    candidate_response: Optional[OfferResponse] = None
    response_date: Optional[date] = None
    rejection_reason: Optional[str] = None
    actual_joining_date: Optional[date] = None
    joining_status: Optional[JoiningStatus] = None
    offered_by_id: Optional[int] = None


class PlacementOfferResponse(PlacementOfferBase):
    id: int
    offered_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
