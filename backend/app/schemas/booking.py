"""Pydantic validation schemas for Meetings."""

import uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.booking import CancelledBy, MeetingLocationType, MeetingStatus, RecurrenceRule

MAX_RECURRING_OCCURRENCES = 52
# A meeting's start time may lag "now" by at most this much — small enough to just
# cover clock skew / the time spent filling out the form, not a general allowance
# for booking whatever's already happened.
MEETING_PAST_GRACE_MINUTES = 15


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
    recurrence_rule: Optional[RecurrenceRule] = Field(
        None, description="If set, generates one occurrence per interval up to recurrence_end_date (inclusive)"
    )
    recurrence_end_date: Optional[date] = Field(None, description="Required when recurrence_rule is set")

    @field_validator("start_time", "end_time")
    @classmethod
    def _require_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("must be timezone-aware")
        return v

    @field_validator("start_time")
    @classmethod
    def _not_too_far_past(cls, v: datetime) -> datetime:
        earliest_allowed = datetime.now(timezone.utc) - timedelta(minutes=MEETING_PAST_GRACE_MINUTES)
        if v < earliest_allowed:
            raise ValueError(f"start_time can't be more than {MEETING_PAST_GRACE_MINUTES} minutes in the past")
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

    @model_validator(mode="after")
    def _validate_recurrence(self) -> "ScheduleMeetingRequest":
        if self.recurrence_rule is not None:
            if self.recurrence_end_date is None:
                raise ValueError("recurrence_end_date is required when recurrence_rule is set")
            if self.recurrence_end_date < self.start_time.date():
                raise ValueError("recurrence_end_date must be on or after the first occurrence's date")
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
    outcome_notes: Optional[str] = None
    recurrence_rule: Optional[RecurrenceRule] = None
    recurrence_end_date: Optional[date] = None
    recurrence_group_id: Optional[uuid.UUID] = None
    # Populated only by the /bookings/meetings/team endpoint (gap 7) — a host viewing
    # their own meetings already knows who they are, so these stay unset there.
    host_name: Optional[str] = None
    host_email: Optional[str] = None
    # Non-persisted — set only on the create response for a recurring series, so the
    # frontend can toast "created 8 of 10 occurrences" when some were skipped.
    occurrences_created: int = 1


class RescheduleMeetingRequest(BaseModel):
    start_time: datetime

    @field_validator("start_time")
    @classmethod
    def _require_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("start_time must be timezone-aware")
        return v

    @field_validator("start_time")
    @classmethod
    def _not_too_far_past(cls, v: datetime) -> datetime:
        earliest_allowed = datetime.now(timezone.utc) - timedelta(minutes=MEETING_PAST_GRACE_MINUTES)
        if v < earliest_allowed:
            raise ValueError(f"start_time can't be more than {MEETING_PAST_GRACE_MINUTES} minutes in the past")
        return v


class CancelMeetingRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class CompleteMeetingRequest(BaseModel):
    outcome_notes: Optional[str] = Field(None, max_length=2000)


class PublicMeetingView(BaseModel):
    """Deliberately slim — what an unauthenticated client sees via a manage link.
    Excludes internal ids (lead_id, participant_user_ids) that don't belong in front
    of someone who only has a token, not a login."""
    model_config = ConfigDict(from_attributes=True)
    public_id: uuid.UUID
    meeting_title: Optional[str] = None
    # Not a column on ScheduledMeeting — always set explicitly after model_validate()
    # in the endpoint (see _public_meeting_view in api/v1/endpoints/booking.py).
    host_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendee_timezone: str
    location_type: MeetingLocationType
    location_detail: Optional[str] = None
    status: MeetingStatus
    recurrence_group_id: Optional[uuid.UUID] = None


# --- Video-call join gate (see get_meeting_join_info in app/services/booking.py) ---

class MeetingJoinInfo(BaseModel):
    """What a join-token holder learns about a meeting — deliberately just enough to
    either embed the call or explain why not, nothing else (no client contact info,
    no reschedule/cancel capability)."""
    joinable: bool
    # "not_started" | "ended" | "cancelled" | "no_video_link" | None (only set when joinable)
    reason: Optional[str] = None
    meeting_title: Optional[str] = None
    host_name: Optional[str] = None
    start_time: datetime
    end_time: datetime
    # Only set when joinable — the bare pieces needed to embed via the Jitsi IFrame
    # External API, never the raw location_detail URL itself.
    jitsi_domain: Optional[str] = None
    jitsi_room: Optional[str] = None


# --- Org Member Options (for the "invite a teammate" picker) ---

class OrgMemberOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: Optional[str] = None
    email: str


# --- Public self-service booking ("book a slot with me") ---
# A host publishes a weekly availability schedule behind a revocable share link;
# a client picks an open slot themselves instead of the host creating every
# meeting by hand. See app/services/booking.py's compute_available_slots /
# public_book_slot -- the latter reuses create_meeting, so a self-booked meeting
# is an ordinary ScheduledMeeting afterward, no separate code path.

class AvailabilityRuleItem(BaseModel):
    """One weekly recurring window -- 0=Monday .. 6=Sunday, matching Python's
    date.weekday() (same convention as is_weekly_off in services/timesheet.py)."""
    model_config = ConfigDict(from_attributes=True)
    weekday: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def _validate_range(self) -> "AvailabilityRuleItem":
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        return self


def _validate_iana_timezone(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
    try:
        ZoneInfo(v)
    except ZoneInfoNotFoundError:
        raise ValueError(f"Unknown IANA timezone: '{v}'")
    return v


class HostAvailabilitySettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    is_enabled: bool
    share_token: Optional[uuid.UUID] = None
    meeting_type_name: str
    duration_minutes: int
    buffer_minutes: int
    min_notice_hours: int
    booking_window_days: int
    timezone: str
    location_type: MeetingLocationType
    location_detail: Optional[str] = None
    rules: list[AvailabilityRuleItem] = Field(default_factory=list)


class HostAvailabilitySettingsUpdate(BaseModel):
    meeting_type_name: Optional[str] = Field(None, min_length=1, max_length=150)
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    buffer_minutes: Optional[int] = Field(None, ge=0, le=120)
    min_notice_hours: Optional[int] = Field(None, ge=0, le=336)
    booking_window_days: Optional[int] = Field(None, ge=1, le=180)
    timezone: Optional[str] = None
    location_type: Optional[MeetingLocationType] = None
    location_detail: Optional[str] = Field(None, max_length=500)

    @field_validator("timezone")
    @classmethod
    def _tz(cls, v: Optional[str]) -> Optional[str]:
        return _validate_iana_timezone(v)


class AvailabilityRulesUpdateRequest(BaseModel):
    rules: list[AvailabilityRuleItem] = Field(default_factory=list)


class HostAvailabilityShareLinkResponse(BaseModel):
    is_enabled: bool
    share_token: Optional[uuid.UUID] = None


class PublicAvailabilityView(BaseModel):
    """What an unauthenticated visitor sees before picking a slot -- deliberately
    thin, no internal ids."""
    host_name: str
    meeting_type_name: str
    duration_minutes: int
    location_type: MeetingLocationType
    timezone: str
    booking_window_days: int
    min_notice_hours: int


class AvailableSlotsResponse(BaseModel):
    date: date
    # UTC start times -- the frontend renders each in the visitor's own timezone.
    slots: list[datetime] = Field(default_factory=list)


class PublicBookingRequest(BaseModel):
    start_time: datetime = Field(..., description="The exact slot start, timezone-aware")
    client_name: str = Field(..., min_length=1, max_length=150)
    client_email: EmailStr
    attendee_timezone: str
    notes: Optional[str] = Field(None, max_length=2000)
    idempotency_key: str = Field(..., min_length=8, max_length=100)

    @field_validator("start_time")
    @classmethod
    def _require_timezone_aware(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            raise ValueError("must be timezone-aware")
        return v

    @field_validator("attendee_timezone")
    @classmethod
    def _tz(cls, v: str) -> str:
        return _validate_iana_timezone(v)


class PublicBookingConfirmation(BaseModel):
    """Returned immediately on a successful booking -- the client also gets a full
    confirmation email (.ics + this same manage link), but the on-screen
    confirmation doesn't depend on that email actually arriving."""
    meeting: PublicMeetingView
    manage_link: str
