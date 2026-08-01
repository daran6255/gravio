"""FastAPI endpoint routers for Meetings — a host schedules a meeting directly
with a client; no public discovery page, no availability rules."""

import uuid
from datetime import date, datetime, timezone as tz
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, require_roles
from app.core.database import get_db
from app.middleware.exceptions import NotFoundError
from app.models.booking import CancelledBy, HostAvailabilitySettings, MeetingStatus
from app.models.user import User, UserRole
from app.repositories.booking import ScheduledMeetingRepository
from app.schemas.booking import (
    AvailabilityRuleItem,
    AvailabilityRulesUpdateRequest,
    AvailableSlotsResponse,
    CancelMeetingRequest,
    CompleteMeetingRequest,
    HostAvailabilityShareLinkResponse,
    HostAvailabilitySettingsResponse,
    HostAvailabilitySettingsUpdate,
    MeetingJoinInfo,
    OrgMemberOption,
    PublicAvailabilityView,
    PublicBookingConfirmation,
    PublicBookingRequest,
    PublicMeetingView,
    RescheduleMeetingRequest,
    ScheduleMeetingRequest,
    ScheduledMeetingResponse,
)
from app.schemas.common import PaginatedResponse
from app.schemas.project import IrisMessageRequest, IrisPreviewResponse, IrisPlannedStep
from app.schemas.crm import AuditLogResponse
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


# ── IRIS assist (propose-then-confirm) ──────────────────────────────────────
# Same propose-then-confirm shape as the project task drawer's IRIS panel (see
# preview_iris_action/execute_iris_action in projects.py): /preview plans without touching
# the DB, /execute only runs after the user confirms, and the reply is recorded as an
# audit-log row scoped to this user so the panel has a "recent activity" feed for free.

@router.post("/iris/preview", response_model=IrisPreviewResponse, summary="Ask IRIS what it would do for meetings, without executing anything")
async def preview_meeting_iris_action(
    payload: IrisMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from app.ai.brain.engine import AIEngine
    from app.ai.brain.exceptions import LLMProviderError, LLMResponseParseError, NoPlanGeneratedError, PlanningError
    from app.ai.schemas.requests import AITaskRunRequest
    from app.middleware.exceptions import BadRequestError, ServiceUnavailableError

    engine = AIEngine(db, current_user)
    try:
        plan = await engine.preview(AITaskRunRequest(trigger_type="manual", task_hint=payload.message, input_data={}))
    except NoPlanGeneratedError:
        raise BadRequestError("IRIS couldn't work out a plan for that -- try rephrasing.")
    except LLMResponseParseError:
        raise BadRequestError(
            "IRIS's plan came back malformed -- this can happen when a request needs a lot of "
            "steps at once. Try a more specific or smaller request."
        )
    except PlanningError as e:
        raise BadRequestError(e.message)
    except LLMProviderError as e:
        raise ServiceUnavailableError(e.message)

    return IrisPreviewResponse(
        task_name=plan.task_name,
        response_to_user=plan.response_to_user,
        reasoning=plan.reasoning,
        estimated_record_impact=plan.estimated_record_impact,
        steps=[IrisPlannedStep(tool_name=s.tool_name, parameters=s.parameters, reasoning=s.reasoning) for s in plan.steps],
    )


@router.post("/iris/execute", response_model=AuditLogResponse, summary="Confirm and run an IRIS action for meetings")
async def execute_meeting_iris_action(
    payload: IrisMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from app.ai.brain.engine import AIEngine
    from app.ai.schemas.requests import AITaskRunRequest
    from app.services.audit import AuditService

    engine = AIEngine(db, current_user)
    result = await engine.run(AITaskRunRequest(
        trigger_type="manual", task_hint=payload.message, input_data={}, confirmed=True,
    ))
    reply_text = result.summary or (f"⚠️ {result.error}" if result.error else "IRIS didn't return a result.")
    entry = await AuditService.record(
        db, entity_type="meeting_iris", entity_id=current_user.id,
        action="comment", changed_by_user_id=None, new_value=reply_text,
    )
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/iris/activity", response_model=list[AuditLogResponse], summary="Recent IRIS activity on meetings for the current user")
async def get_meeting_iris_activity(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    from app.services.audit import AuditService

    return await AuditService.list_for_entity(db, entity_type="meeting_iris", entity_id=current_user.id, page=1, page_size=5)


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


# ── Host availability ("book a slot with me" self-service booking) ───────────────

def _availability_settings_response(settings: HostAvailabilitySettings) -> HostAvailabilitySettingsResponse:
    return HostAvailabilitySettingsResponse(
        is_enabled=settings.is_enabled,
        share_token=settings.share_token,
        meeting_type_name=settings.meeting_type_name,
        duration_minutes=settings.duration_minutes,
        buffer_minutes=settings.buffer_minutes,
        min_notice_hours=settings.min_notice_hours,
        booking_window_days=settings.booking_window_days,
        timezone=settings.timezone,
        location_type=settings.location_type,
        location_detail=settings.location_detail,
        rules=[
            AvailabilityRuleItem(weekday=r.weekday, start_time=r.start_time, end_time=r.end_time)
            for r in settings.rules if not r.is_deleted
        ],
    )


@router.get("/availability", response_model=HostAvailabilitySettingsResponse)
async def get_my_availability(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HostAvailabilitySettingsResponse:
    settings = await booking_service.get_or_create_availability_settings(db, current_user)
    return _availability_settings_response(settings)


@router.patch("/availability", response_model=HostAvailabilitySettingsResponse)
async def update_my_availability(
    payload: HostAvailabilitySettingsUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HostAvailabilitySettingsResponse:
    settings = await booking_service.update_availability_settings(db, current_user, payload)
    return _availability_settings_response(settings)


@router.put("/availability/rules", response_model=HostAvailabilitySettingsResponse)
async def replace_my_availability_rules(
    payload: AvailabilityRulesUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HostAvailabilitySettingsResponse:
    """Wholesale replace of the weekly schedule -- the whole page is edited and
    saved at once, not row-by-row (mirrors Project's task-status board reset)."""
    await booking_service.replace_availability_rules(db, current_user, payload.rules)
    settings = await booking_service.get_or_create_availability_settings(db, current_user)
    return _availability_settings_response(settings)


@router.post("/availability/enable", response_model=HostAvailabilityShareLinkResponse)
async def enable_my_booking_link(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HostAvailabilityShareLinkResponse:
    settings = await booking_service.enable_booking_link(db, current_user)
    return HostAvailabilityShareLinkResponse(is_enabled=settings.is_enabled, share_token=settings.share_token)


@router.post("/availability/regenerate", response_model=HostAvailabilityShareLinkResponse)
async def regenerate_my_booking_link(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HostAvailabilityShareLinkResponse:
    settings = await booking_service.regenerate_booking_link(db, current_user)
    return HostAvailabilityShareLinkResponse(is_enabled=settings.is_enabled, share_token=settings.share_token)


@router.delete("/availability", response_model=HostAvailabilityShareLinkResponse)
async def disable_my_booking_link(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> HostAvailabilityShareLinkResponse:
    settings = await booking_service.disable_booking_link(db, current_user)
    return HostAvailabilityShareLinkResponse(is_enabled=settings.is_enabled, share_token=settings.share_token)


# ── Public (no-login) self-service booking — token identifies the host ───────────

@router.get("/public/availability/{token}", response_model=PublicAvailabilityView)
async def public_get_availability(token: uuid.UUID, db: AsyncSession = Depends(get_db)) -> PublicAvailabilityView:
    settings, host = await booking_service.get_public_availability_view(db, token)
    return PublicAvailabilityView(
        host_name=host.full_name or host.email,
        meeting_type_name=settings.meeting_type_name,
        duration_minutes=settings.duration_minutes,
        location_type=settings.location_type,
        timezone=settings.timezone,
        booking_window_days=settings.booking_window_days,
        min_notice_hours=settings.min_notice_hours,
    )


@router.get("/public/availability/{token}/slots", response_model=AvailableSlotsResponse)
async def public_get_available_slots(
    token: uuid.UUID,
    date_param: date = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db),
) -> AvailableSlotsResponse:
    settings, _host = await booking_service.get_public_availability_view(db, token)
    slots = await booking_service.get_available_slots(db, settings=settings, target_date=date_param)
    return AvailableSlotsResponse(date=date_param, slots=slots)


@router.post(
    "/public/availability/{token}/book",
    response_model=PublicBookingConfirmation,
    status_code=status.HTTP_201_CREATED,
)
async def public_book_availability_slot(
    token: uuid.UUID, payload: PublicBookingRequest, db: AsyncSession = Depends(get_db),
) -> PublicBookingConfirmation:
    meeting, manage_link = await booking_service.public_book_slot(db, token=token, payload=payload)
    view = await _public_meeting_view(db, meeting)
    return PublicBookingConfirmation(meeting=view, manage_link=manage_link)


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
