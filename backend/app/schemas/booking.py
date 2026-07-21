"""Pydantic validation schemas for Meetings."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.booking import CancelledBy, MeetingLocationType, MeetingStatus


# --- Scheduling Schemas ---

class ScheduleMeetingRequest(BaseModel):
    start_time: datetime = Field(..., description="Meeting start, timezone-aware")
    end_time: datetime = Field(..., description="Meeting end, timezone-aware")
    client_name: str = Field(..., min_length=1, max_length=150)
    client_email: EmailStr
    host_timezone: str = Field(..., description="IANA timezone of the host")
    attendee_timezone: str = Field(..., description="IANA timezone of the attendee")
    meeting_title: Optional[str] = Field(None, max_length=200)
    meeting_notes: Optional[str] = Field(None, max_length=2000)
    location_type: MeetingLocationType = MeetingLocationType.GOOGLE_MEET
    location_detail: Optional[str] = Field(None, max_length=500)
    # Internal teammates to invite alongside the client, plus any extra external
    # guests beyond the client — always available regardless of team size.
    participant_user_ids: list[int] = Field(default_factory=list)
    guest_emails: list[EmailStr] = Field(default_factory=list)
    idempotency_key: str = Field(
        ..., min_length=8, max_length=100,
        description="Client-generated UUID; resubmitting the same key returns the original meeting instead of creating a duplicate",
    )

    @field_validator("start_time", "end_time")
    @classmethod
    def _require_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("must be timezone-aware")
        return v

    @field_validator("host_timezone", "attendee_timezone")
    @classmethod
    def _validate_timezone(cls, v: str) -> str:
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        try:
            ZoneInfo(v)
        except ZoneInfoNotFoundError:
            raise ValueError(f"Unknown IANA timezone: '{v}'")
        return v

    @model_validator(mode="after")
    def _validate_end_after_start(self) -> "ScheduleMeetingRequest":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self

    @model_validator(mode="after")
    def _validate_offline_detail_required(self) -> "ScheduleMeetingRequest":
        if self.location_type == MeetingLocationType.OFFLINE and not self.location_detail:
            raise ValueError("location_detail (the address) is required when location_type is 'offline'")
        return self


class ScheduledMeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    lead_id: Optional[int] = None
    client_name: str
    client_email: str
    meeting_title: Optional[str] = None
    meeting_notes: Optional[str] = None
    location_type: MeetingLocationType
    location_detail: Optional[str] = None
    participant_user_ids: list[int] = Field(default_factory=list)
    guest_emails: list[str] = Field(default_factory=list)
    start_time: datetime
    end_time: datetime
    host_timezone: str
    attendee_timezone: str
    status: MeetingStatus
    cancelled_by: Optional[CancelledBy] = None
    cancellation_reason: Optional[str] = None


class RescheduleMeetingRequest(BaseModel):
    start_time: datetime

    @field_validator("start_time")
    @classmethod
    def _require_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("start_time must be timezone-aware")
        return v


class CancelMeetingRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


# --- Org Member Options (for the "invite a teammate" picker) ---

class OrgMemberOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: Optional[str] = None
    email: str
