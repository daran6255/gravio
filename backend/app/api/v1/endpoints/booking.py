"""FastAPI endpoint routers for the Calendar & Appointment Booking Scheduler.

Route ordering matters: the literal `/pages/mine...` (authenticated, host-facing)
routes are registered before the wildcard `/pages/{slug}` (public) routes so
Starlette's order-of-registration matching resolves "mine" as the literal segment,
not as a slug value.
"""

import uuid
from datetime import date as date_type
from typing import Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.core.rate_limiter import limiter
from app.middleware.exceptions import BadRequestError, NotFoundError
from app.models.booking import CancelledBy, MeetingStatus
from app.models.user import User
from app.repositories.booking import (
    BookingAvailabilityExceptionRepository,
    BookingPageRepository,
    ScheduledMeetingRepository,
)
from app.schemas.booking import (
    AvailableSlot,
    AvailableSlotsResponse,
    BookingAvailabilityExceptionCreate,
    BookingAvailabilityExceptionResponse,
    BookingPageCreate,
    BookingPagePublicResponse,
    BookingPageResponse,
    BookingPageUpdate,
    CancelMeetingRequest,
    HostScheduleMeetingRequest,
    OrgMemberOption,
    RescheduleMeetingRequest,
    ScheduleMeetingRequest,
    ScheduledMeetingHostResponse,
    ScheduledMeetingResponse,
)
from app.schemas.common import PaginatedResponse
from app.services import booking as booking_service

router = APIRouter(prefix="/bookings", tags=["Booking Scheduler"])


def _require_valid_timezone(tz: str) -> str:
    try:
        ZoneInfo(tz)
    except ZoneInfoNotFoundError:
        raise BadRequestError(f"Unknown IANA timezone: '{tz}'")
    return tz


# ── Host-facing: booking pages ───────────────────────────────────────────────────

@router.post("/pages", response_model=BookingPageResponse, status_code=status.HTTP_201_CREATED)
async def create_booking_page(
    payload: BookingPageCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> BookingPageResponse:
    if await BookingPageRepository.slug_exists(db, payload.slug):
        raise BadRequestError(f"The link '{payload.slug}' is already taken. Please choose another.")
    page = await BookingPageRepository.create(db, user_id=current_user.id, **payload.model_dump())
    return BookingPageResponse.model_validate(page)


@router.get("/pages/mine", response_model=list[BookingPageResponse])
async def list_my_booking_pages(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[BookingPageResponse]:
    pages = await BookingPageRepository.list_for_user(db, user_id=current_user.id)
    return [BookingPageResponse.model_validate(p) for p in pages]


async def _get_own_page_or_404(db: AsyncSession, public_id: uuid.UUID, current_user: User):
    page = await BookingPageRepository.get_by_public_id(db, public_id)
    if page is None or page.is_deleted:
        raise NotFoundError("Booking page not found")
    booking_service.assert_host_owns_page(page, current_user)
    return page


@router.get("/pages/mine/{public_id}", response_model=BookingPageResponse)
async def get_my_booking_page(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> BookingPageResponse:
    page = await _get_own_page_or_404(db, public_id, current_user)
    return BookingPageResponse.model_validate(page)


@router.patch("/pages/mine/{public_id}", response_model=BookingPageResponse)
async def update_my_booking_page(
    public_id: uuid.UUID,
    payload: BookingPageUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> BookingPageResponse:
    page = await _get_own_page_or_404(db, public_id, current_user)
    data = payload.model_dump(exclude_unset=True)
    page = await BookingPageRepository.update(db, page, **data)
    return BookingPageResponse.model_validate(page)


@router.get("/pages/mine/{public_id}/exceptions", response_model=list[BookingAvailabilityExceptionResponse])
async def list_my_booking_page_exceptions(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[BookingAvailabilityExceptionResponse]:
    page = await _get_own_page_or_404(db, public_id, current_user)
    from datetime import date, timedelta
    exceptions = await BookingAvailabilityExceptionRepository.list_for_page_in_range(
        db, booking_page_id=page.id, start_date=date.today(), end_date=date.today() + timedelta(days=page.max_advance_days)
    )
    return [BookingAvailabilityExceptionResponse.model_validate(e) for e in exceptions]


@router.post("/pages/mine/{public_id}/exceptions", response_model=BookingAvailabilityExceptionResponse, status_code=status.HTTP_201_CREATED)
async def create_my_booking_page_exception(
    public_id: uuid.UUID,
    payload: BookingAvailabilityExceptionCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> BookingAvailabilityExceptionResponse:
    page = await _get_own_page_or_404(db, public_id, current_user)
    exception = await BookingAvailabilityExceptionRepository.create(db, booking_page_id=page.id, **payload.model_dump())
    return BookingAvailabilityExceptionResponse.model_validate(exception)


@router.delete("/pages/mine/{public_id}/exceptions/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_booking_page_exception(
    public_id: uuid.UUID,
    exception_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    page = await _get_own_page_or_404(db, public_id, current_user)
    exception = await BookingAvailabilityExceptionRepository.get_by_id(db, exception_id)
    if exception is None or exception.booking_page_id != page.id or exception.is_deleted:
        raise NotFoundError("Availability exception not found")
    await BookingAvailabilityExceptionRepository.delete(db, exception)


# ── Host-facing: meetings ─────────────────────────────────────────────────────────

@router.get("/meetings", response_model=PaginatedResponse[ScheduledMeetingHostResponse])
async def list_my_meetings(
    status_filter: Optional[MeetingStatus] = Query(None, alias="status"),
    upcoming_only: bool = Query(False),
    search: Optional[str] = Query(None, description="Matches against client name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ScheduledMeetingHostResponse]:
    from datetime import datetime, timezone as tz

    start_after = datetime.now(tz.utc) if upcoming_only else None
    meetings, total = await ScheduledMeetingRepository.list_for_user(
        db, user_id=current_user.id, status=status_filter, start_after=start_after, search=search,
        page=page, page_size=page_size,
    )
    return PaginatedResponse[ScheduledMeetingHostResponse](
        items=[ScheduledMeetingHostResponse.model_validate(m) for m in meetings],
        total=total, page=page, page_size=page_size,
    )


@router.get("/org-members", response_model=list[OrgMemberOption])
async def list_org_members_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrgMemberOption]:
    """Teammates a host can invite to a meeting they're creating — any authenticated
    user with an organization, not gated to a specific role (unlike /crm/owners),
    since inviting a colleague to your own meeting isn't a CRM permission. Empty for
    a solo user with no organization; the New Meeting form falls back to guest-only
    invites in that case."""
    members = await booking_service.list_org_members(
        db, organization_id=current_user.organization_id, exclude_user_id=current_user.id
    )
    return [OrgMemberOption.model_validate(m) for m in members]


@router.post("/meetings", response_model=ScheduledMeetingHostResponse, status_code=status.HTTP_201_CREATED)
async def host_create_meeting(
    payload: HostScheduleMeetingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingHostResponse:
    """Lets a host directly book a meeting on their own page (e.g. a call scheduled
    over the phone) — reuses the exact same conflict-safe, Google-sync-with-fallback
    path a public visitor's booking goes through, so it's held to the same guarantees."""
    page = await BookingPageRepository.get_by_public_id(db, payload.booking_page_public_id)
    if page is None or page.is_deleted:
        raise NotFoundError("Booking page not found")
    booking_service.assert_host_owns_page(page, current_user)

    # Passed straight through (not re-wrapped into the base ScheduleMeetingRequest) so
    # host-only fields like participant_user_ids/guest_emails survive into create_booking —
    # HostScheduleMeetingRequest already IS-A ScheduleMeetingRequest, so this is type-safe.
    meeting = await booking_service.create_booking(db, page=page, payload=payload)
    return ScheduledMeetingHostResponse.model_validate(meeting)


@router.post("/meetings/{public_id}/cancel", response_model=ScheduledMeetingHostResponse)
async def host_cancel_meeting(
    public_id: uuid.UUID,
    payload: CancelMeetingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingHostResponse:
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("Meeting not found")
    page = await BookingPageRepository.get_by_id(db, meeting.booking_page_id)
    if page is None:
        raise NotFoundError("Meeting not found")
    booking_service.assert_host_owns_page(page, current_user)
    meeting = await booking_service.cancel_booking(db, meeting=meeting, cancelled_by=CancelledBy.HOST, reason=payload.reason)
    return ScheduledMeetingHostResponse.model_validate(meeting)


@router.post("/meetings/{public_id}/reschedule", response_model=ScheduledMeetingHostResponse)
async def host_reschedule_meeting(
    public_id: uuid.UUID,
    payload: RescheduleMeetingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingHostResponse:
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("Meeting not found")
    page = await BookingPageRepository.get_by_id(db, meeting.booking_page_id)
    if page is None:
        raise NotFoundError("Meeting not found")
    booking_service.assert_host_owns_page(page, current_user)
    meeting = await booking_service.reschedule_booking(db, meeting=meeting, new_start_time=payload.start_time)
    return ScheduledMeetingHostResponse.model_validate(meeting)


# ── Public: booking page discovery + scheduling ──────────────────────────────────

@router.get("/pages/{slug}", response_model=BookingPagePublicResponse)
@limiter.limit("60/minute;1000/hour")
async def get_public_booking_page(
    request: Request,
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> BookingPagePublicResponse:
    page = await BookingPageRepository.get_by_slug(db, slug)
    if page is None or page.is_deleted or not page.is_active:
        raise NotFoundError("This booking page doesn't exist or is no longer active.")
    return BookingPagePublicResponse(
        slug=page.slug, title=page.title, description=page.description,
        duration_minutes=page.duration_minutes, location_type=page.location_type,
        timezone=page.timezone, host_name=page.user.full_name or page.user.email,
    )


@router.get("/pages/{slug}/slots", response_model=AvailableSlotsResponse)
@limiter.limit("60/minute;1000/hour")
async def get_available_slots(
    request: Request,
    slug: str,
    date: date_type = Query(..., description="Date to check availability for, in the viewer's own timezone"),
    tz: str = Query("UTC", description="Viewer's IANA timezone"),
    db: AsyncSession = Depends(get_db),
) -> AvailableSlotsResponse:
    _require_valid_timezone(tz)
    page = await BookingPageRepository.get_by_slug(db, slug)
    if page is None or page.is_deleted or not page.is_active:
        raise NotFoundError("This booking page doesn't exist or is no longer active.")
    slots = await booking_service.compute_available_slots(db, page, date, tz)
    return AvailableSlotsResponse(
        date=date, timezone=tz,
        slots=[AvailableSlot(start_time=s, end_time=e) for s, e in slots],
    )


@router.post("/pages/{slug}/schedule", response_model=ScheduledMeetingResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute;60/hour")
async def schedule_meeting(
    request: Request,
    slug: str,
    payload: ScheduleMeetingRequest,
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    page = await BookingPageRepository.get_by_slug(db, slug)
    if page is None or page.is_deleted or not page.is_active:
        raise NotFoundError("This booking page doesn't exist or is no longer active.")
    meeting = await booking_service.create_booking(db, page=page, payload=payload)
    return ScheduledMeetingResponse.model_validate(meeting)


# ── Public: self-serve manage (cancel/reschedule) via emailed token ──────────────

@router.get("/manage/{manage_token}", response_model=ScheduledMeetingResponse)
@limiter.limit("30/minute;300/hour")
async def get_meeting_by_manage_token(
    request: Request,
    manage_token: str,
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    meeting = await booking_service.get_meeting_by_manage_token(db, manage_token)
    return ScheduledMeetingResponse.model_validate(meeting)


@router.post("/manage/{manage_token}/cancel", response_model=ScheduledMeetingResponse)
@limiter.limit("10/minute;60/hour")
async def client_cancel_meeting(
    request: Request,
    manage_token: str,
    payload: CancelMeetingRequest,
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    meeting = await booking_service.get_meeting_by_manage_token(db, manage_token)
    meeting = await booking_service.cancel_booking(db, meeting=meeting, cancelled_by=CancelledBy.CLIENT, reason=payload.reason)
    return ScheduledMeetingResponse.model_validate(meeting)


@router.post("/manage/{manage_token}/reschedule", response_model=ScheduledMeetingResponse)
@limiter.limit("10/minute;60/hour")
async def client_reschedule_meeting(
    request: Request,
    manage_token: str,
    payload: RescheduleMeetingRequest,
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    meeting = await booking_service.get_meeting_by_manage_token(db, manage_token)
    meeting = await booking_service.reschedule_booking(db, meeting=meeting, new_start_time=payload.start_time)
    return ScheduledMeetingResponse.model_validate(meeting)
