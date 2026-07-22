"""FastAPI endpoint routers for Meetings — a host schedules a meeting directly
with a client; no public discovery page, no availability rules."""

import uuid
from datetime import datetime, timezone as tz
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_roles
from app.core.database import get_db
from app.middleware.exceptions import NotFoundError
from app.models.booking import CancelledBy, MeetingStatus
from app.models.user import User, UserRole
from app.repositories.booking import ScheduledMeetingRepository
from app.schemas.booking import (
    CancelMeetingRequest,
    CompleteMeetingRequest,
    MeetingJoinInfo,
    OrgMemberOption,
    PublicMeetingView,
    RescheduleMeetingRequest,
    ScheduleMeetingRequest,
    ScheduledMeetingResponse,
)
from app.schemas.common import PaginatedResponse
from app.services import booking as booking_service
from app.utils.email import create_meeting_join_token

router = APIRouter(prefix="/bookings", tags=["Meetings"])


@router.get("/meetings", response_model=PaginatedResponse[ScheduledMeetingResponse])
async def list_my_meetings(
    status_filter: Optional[MeetingStatus] = Query(None, alias="status"),
    upcoming_only: bool = Query(False),
    start_before: Optional[datetime] = Query(None, description="Only meetings starting on or before this time"),
    search: Optional[str] = Query(None, description="Matches against client name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ScheduledMeetingResponse]:
    start_after = datetime.now(tz.utc) if upcoming_only else None
    meetings, total = await ScheduledMeetingRepository.list_for_user(
        db, user_id=current_user.id, status=status_filter, start_after=start_after, start_before=start_before,
        search=search, page=page, page_size=page_size,
    )
    return PaginatedResponse[ScheduledMeetingResponse](
        items=[ScheduledMeetingResponse.model_validate(m) for m in meetings],
        total=total, page=page, page_size=page_size,
    )


@router.get("/meetings/team", response_model=PaginatedResponse[ScheduledMeetingResponse])
async def list_team_meetings(
    status_filter: Optional[MeetingStatus] = Query(None, alias="status"),
    start_before: Optional[datetime] = Query(None),
    start_after: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None, description="Matches against client name or email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.MANAGER])),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ScheduledMeetingResponse]:
    """Manager/admin oversight view: an admin sees every host's meetings in the org,
    a manager sees their own plus their direct reports' (mirrors the scoping used in
    timesheets.py's report endpoint)."""
    from sqlalchemy import select

    if current_user.role == UserRole.ADMIN:
        host_ids_result = await db.execute(select(User.id).where(User.organization_id == current_user.organization_id))
        host_user_ids = [row[0] for row in host_ids_result.all()]
    else:
        report_ids_result = await db.execute(select(User.id).where(User.reporting_manager_id == current_user.id))
        host_user_ids = [current_user.id] + [row[0] for row in report_ids_result.all()]

    meetings, total = await ScheduledMeetingRepository.list_for_hosts(
        db, host_user_ids=host_user_ids, status=status_filter, start_after=start_after, start_before=start_before,
        search=search, page=page, page_size=page_size, with_host=True,
    )
    items = []
    for m in meetings:
        item = ScheduledMeetingResponse.model_validate(m)
        item.host_name = m.host.full_name or m.host.email if m.host else None
        item.host_email = m.host.email if m.host else None
        items.append(item)
    return PaginatedResponse[ScheduledMeetingResponse](items=items, total=total, page=page, page_size=page_size)


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
    meeting, occurrences_created = await booking_service.create_meeting(db, host=current_user, payload=payload)
    response = ScheduledMeetingResponse.model_validate(meeting)
    response.occurrences_created = occurrences_created
    return response


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


@router.post("/meetings/{public_id}/cancel-series", response_model=ScheduledMeetingResponse)
async def host_cancel_meeting_series(
    public_id: uuid.UUID,
    payload: CancelMeetingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    """Cancels this occurrence and every still-scheduled one at or after it in the
    same recurring series. Meetings with no recurrence_group_id behave the same as
    a plain cancel."""
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("Meeting not found")
    booking_service.assert_host_owns_meeting(meeting, current_user)
    meeting = await booking_service.cancel_series(db, meeting=meeting, cancelled_by=CancelledBy.HOST, reason=payload.reason)
    return ScheduledMeetingResponse.model_validate(meeting)


@router.post("/meetings/{public_id}/complete", response_model=ScheduledMeetingResponse)
async def host_complete_meeting(
    public_id: uuid.UUID,
    payload: CompleteMeetingRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> ScheduledMeetingResponse:
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("Meeting not found")
    booking_service.assert_host_owns_meeting(meeting, current_user)
    meeting = await booking_service.complete_meeting(db, meeting=meeting, outcome_notes=payload.outcome_notes)
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


@router.get("/meetings/{public_id}/join-link")
async def host_get_meeting_join_link(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mints a fresh join token for the host's own meeting and hands back the same
    join-gate URL a client/guest would get by email — the host goes through the
    identical joinability check (see get_meeting_join_info) rather than opening the
    raw video link directly, so branding-stripping and the active-window rule apply
    to everyone the same way."""
    meeting = await ScheduledMeetingRepository.get_by_public_id(db, public_id)
    if meeting is None:
        raise NotFoundError("Meeting not found")
    booking_service.assert_host_owns_meeting(meeting, current_user)

    from app.core.config import settings

    token = create_meeting_join_token(meeting.public_id)
    base_url = settings.FRONTEND_URL or "http://localhost:5173"
    return {"join_url": f"{base_url}/meetings/join?token={token}"}


# ── Public (no-login) client self-service — token identifies the meeting ─────────
#
# No current_user dependency anywhere below, by design (same convention as
# auth.py's forgot-password/reset-password/accept-invite routes).

async def _public_meeting_view(db: AsyncSession, meeting) -> PublicMeetingView:
    host = await db.get(User, meeting.host_user_id)
    view = PublicMeetingView.model_validate(meeting)
    view.host_name = (host.full_name or host.email) if host else "Your host"
    return view


@router.get("/public/meetings/{token}", response_model=PublicMeetingView)
async def public_get_meeting(token: str, db: AsyncSession = Depends(get_db)) -> PublicMeetingView:
    meeting = await booking_service.get_meeting_by_manage_token(db, token)
    return await _public_meeting_view(db, meeting)


@router.post("/public/meetings/{token}/reschedule", response_model=PublicMeetingView)
async def public_reschedule_meeting(
    token: str, payload: RescheduleMeetingRequest, db: AsyncSession = Depends(get_db),
) -> PublicMeetingView:
    meeting = await booking_service.get_meeting_by_manage_token(db, token)
    meeting = await booking_service.client_reschedule_meeting(db, meeting=meeting, new_start_time=payload.start_time)
    return await _public_meeting_view(db, meeting)


@router.post("/public/meetings/{token}/cancel", response_model=PublicMeetingView)
async def public_cancel_meeting(
    token: str, payload: CancelMeetingRequest, db: AsyncSession = Depends(get_db),
) -> PublicMeetingView:
    meeting = await booking_service.get_meeting_by_manage_token(db, token)
    meeting = await booking_service.client_cancel_meeting(db, meeting=meeting, reason=payload.reason)
    return await _public_meeting_view(db, meeting)


# ── Public (no-login) video-call join gate — a separate token from the manage one
# above, carrying no reschedule/cancel privilege (see create_meeting_join_token). ──

@router.get("/public/meetings/join/{token}", response_model=MeetingJoinInfo)
async def public_get_meeting_join_info(token: str, db: AsyncSession = Depends(get_db)) -> MeetingJoinInfo:
    meeting = await booking_service.get_meeting_by_join_token(db, token)
    host = await db.get(User, meeting.host_user_id)
    host_name = (host.full_name or host.email) if host else "Your host"
    return booking_service.get_meeting_join_info(meeting, host_name=host_name)
