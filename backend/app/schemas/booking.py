"""Pydantic validation schemas for the Calendar & Appointment Booking Scheduler"""

import re
import uuid
from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.booking import (
    BookingLocationType,
    CalendarSyncStatus,
    CancelledBy,
    GoogleConnectionStatus,
    MeetingStatus,
)

_DAY_KEYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
_TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _validate_availability_shape(availability: dict[str, Any]) -> dict[str, Any]:
    for day, ranges in availability.items():
        if day not in _DAY_KEYS:
            raise ValueError(f"Unknown availability day key: '{day}' (expected one of {_DAY_KEYS})")
        if not isinstance(ranges, list):
            raise ValueError(f"Availability for '{day}' must be a list of [start, end] pairs")
        for r in ranges:
            if not (isinstance(r, list) and len(r) == 2 and all(isinstance(x, str) for x in r)):
                raise ValueError(f"Each range for '{day}' must be a [start, end] string pair, got: {r}")
            start, end = r
            if not (_TIME_RE.match(start) and _TIME_RE.match(end)):
                raise ValueError(f"Times must be 'HH:MM' 24h format, got: {r}")
            if start >= end:
                raise ValueError(f"Range start must be before end, got: {r}")
    return availability


# --- Booking Page Schemas ---

class BookingPageBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    duration_minutes: int = Field(30, ge=5, le=480)
    location_type: BookingLocationType = BookingLocationType.GOOGLE_MEET
    offline_address: Optional[str] = Field(None, max_length=500)
    fallback_meeting_note: Optional[str] = Field(None, max_length=500)
    timezone: str = Field(..., description="IANA timezone, e.g. 'Asia/Kolkata'")
    availability: dict[str, Any] = Field(default_factory=dict)
    buffer_before_minutes: int = Field(0, ge=0, le=180)
    buffer_after_minutes: int = Field(0, ge=0, le=180)
    min_notice_minutes: int = Field(60, ge=0, le=10080)
    max_advance_days: int = Field(60, ge=1, le=365)
    max_bookings_per_day: Optional[int] = Field(None, ge=1)

    @field_validator("timezone")
    @classmethod
    def _validate_timezone(cls, v: str) -> str:
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        try:
            ZoneInfo(v)
        except ZoneInfoNotFoundError:
            raise ValueError(f"Unknown IANA timezone: '{v}'")
        return v

    @field_validator("availability")
    @classmethod
    def _validate_availability(cls, v: dict[str, Any]) -> dict[str, Any]:
        return _validate_availability_shape(v)

    @model_validator(mode="after")
    def _validate_offline_address_required(self) -> "BookingPageBase":
        if self.location_type == BookingLocationType.OFFLINE and not self.offline_address:
            raise ValueError("offline_address is required when location_type is 'offline'")
        return self


class BookingPageCreate(BookingPageBase):
    slug: str = Field(..., min_length=3, max_length=80, pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$")


class BookingPageUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    is_active: Optional[bool] = None
    location_type: Optional[BookingLocationType] = None
    offline_address: Optional[str] = Field(None, max_length=500)
    fallback_meeting_note: Optional[str] = Field(None, max_length=500)
    timezone: Optional[str] = None
    availability: Optional[dict[str, Any]] = None
    buffer_before_minutes: Optional[int] = Field(None, ge=0, le=180)
    buffer_after_minutes: Optional[int] = Field(None, ge=0, le=180)
    min_notice_minutes: Optional[int] = Field(None, ge=0, le=10080)
    max_advance_days: Optional[int] = Field(None, ge=1, le=365)
    max_bookings_per_day: Optional[int] = Field(None, ge=1)

    @field_validator("availability")
    @classmethod
    def _validate_availability(cls, v: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
        if v is None:
            return v
        return _validate_availability_shape(v)


class BookingPageResponse(BookingPageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    slug: str
    is_active: bool
    user_id: int


class BookingPagePublicResponse(BaseModel):
    """What an unauthenticated visitor sees on the public booking page — no internal ids."""
    model_config = ConfigDict(from_attributes=True)
    slug: str
    title: str
    description: Optional[str] = None
    duration_minutes: int
    location_type: BookingLocationType
    timezone: str
    host_name: str


# --- Availability Exception Schemas ---

class BookingAvailabilityExceptionCreate(BaseModel):
    date: date
    is_blocked: bool = True
    custom_slots: Optional[list[list[str]]] = None

    @field_validator("custom_slots")
    @classmethod
    def _validate_custom_slots(cls, v: Optional[list[list[str]]]) -> Optional[list[list[str]]]:
        if v is None:
            return v
        _validate_availability_shape({"mon": v})
        return v


class BookingAvailabilityExceptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    date: date
    is_blocked: bool
    custom_slots: Optional[list[list[str]]] = None


# --- Slot Schemas ---

class AvailableSlot(BaseModel):
    start_time: datetime
    end_time: datetime


class AvailableSlotsResponse(BaseModel):
    date: date
    timezone: str
    slots: list[AvailableSlot]


# --- Scheduling Schemas ---

class ScheduleMeetingRequest(BaseModel):
    start_time: datetime = Field(..., description="Requested slot start, timezone-aware")
    client_name: str = Field(..., min_length=1, max_length=150)
    client_email: EmailStr
    attendee_timezone: str = Field(..., description="IANA timezone of the attendee")
    meeting_notes: Optional[str] = Field(None, max_length=2000)
    idempotency_key: str = Field(
        ..., min_length=8, max_length=100,
        description="Client-generated UUID; resubmitting the same key returns the original booking instead of creating a duplicate",
    )

    @field_validator("start_time")
    @classmethod
    def _require_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("start_time must be timezone-aware")
        return v

    @field_validator("attendee_timezone")
    @classmethod
    def _validate_timezone(cls, v: str) -> str:
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        try:
            ZoneInfo(v)
        except ZoneInfoNotFoundError:
            raise ValueError(f"Unknown IANA timezone: '{v}'")
        return v


class ScheduledMeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    public_id: uuid.UUID
    client_name: str
    client_email: str
    meeting_notes: Optional[str] = None
    start_time: datetime
    end_time: datetime
    host_timezone: str
    attendee_timezone: str
    status: MeetingStatus
    calendar_sync_status: CalendarSyncStatus
    google_meet_link: Optional[str] = None
    cancelled_by: Optional[CancelledBy] = None
    cancellation_reason: Optional[str] = None


class ScheduledMeetingHostResponse(ScheduledMeetingResponse):
    """Adds host-only fields (never exposed on the public manage-by-token view)."""
    booking_page_id: int
    lead_id: Optional[int] = None
    google_event_id: Optional[str] = None
    calendar_sync_attempts: int
    calendar_sync_last_error: Optional[str] = None


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


# --- Google Integration Schemas ---

class GoogleConnectionStatusResponse(BaseModel):
    status: GoogleConnectionStatus
    google_email: Optional[str] = None
    connected_at: Optional[datetime] = None
    last_error: Optional[str] = None


class GoogleAuthorizationUrlResponse(BaseModel):
    authorization_url: str
