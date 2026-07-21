"""FastAPI endpoint routers for Meetings — a host schedules a meeting directly
with a client; no public discovery page, no availability rules."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.middleware.exceptions import NotFoundError
from app.models.booking import CancelledBy, MeetingStatus
from app.models.user import User
from app.repositories.booking import ScheduledMeetingRepository
from app.schemas.booking import (
    CancelMeetingRequest,
    OrgMemberOption,
    RescheduleMeetingRequest,
    ScheduleMeetingRequest,
    ScheduledMeetingResponse,
)
from app.schemas.common import PaginatedResponse
from app.services import booking as booking_service

router = APIRouter(prefix="/bookings", tags=["Meetings"])


@router.get("/meetings", response_model=PaginatedResponse[ScheduledMeetingResponse])
async def list_my_meetings(
    status_filter: Optional[MeetingStatus] = Query(None, alias="status"),
    upcoming_only: bool = Query(False),
    search: Optional[str] = Query(None, description="Matches against client name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ScheduledMeetingResponse]:
    from datetime import datetime, timezone as tz

    start_after = datetime.now(tz.utc) if upcoming_only else None
    meetings, total = await ScheduledMeetingRepository.list_for_user(
        db, user_id=current_user.id, status=status_filter, start_after=start_after, search=search,
        page=page, page_size=page_size,
    )
    return PaginatedResponse[ScheduledMeetingResponse](
        items=[ScheduledMeetingResponse.model_validate(m) for m in meetings],
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


@router.post("/meetings", response_model=ScheduledMeetingResponse, status_code=status.HTTP_201_CREATED)
async def host_create_meeting(
    payload: ScheduleMeetingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    meeting = await booking_service.create_meeting(db, host=current_user, payload=payload)
    return ScheduledMeetingResponse.model_validate(meeting)


@router.post("/meetings/{public_id}/cancel", response_model=ScheduledMeetingResponse)
async def host_cancel_meeting(
    public_id: uuid.UUID,
    payload: CancelMeetingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("Meeting not found")
    booking_service.assert_host_owns_meeting(meeting, current_user)
    meeting = await booking_service.cancel_meeting(db, meeting=meeting, cancelled_by=CancelledBy.HOST, reason=payload.reason)
    return ScheduledMeetingResponse.model_validate(meeting)


@router.post("/meetings/{public_id}/reschedule", response_model=ScheduledMeetingResponse)
async def host_reschedule_meeting(
    public_id: uuid.UUID,
    payload: RescheduleMeetingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("Meeting not found")
    booking_service.assert_host_owns_meeting(meeting, current_user)
    meeting = await booking_service.reschedule_meeting(db, meeting=meeting, new_start_time=payload.start_time)
    return ScheduledMeetingResponse.model_validate(meeting)
