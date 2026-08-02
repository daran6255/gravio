"""AI endpoints — credits/usage, IRIS chat, and one-shot agentic task runs.

Thin route wrappers only: all real logic lives in AIChatService, AIEngine, and
ai_credit_service/token_utilization_service. Every user-triggered call here goes through
get_llm_provider(org_id=..., user_id=...) internally, so it's metered against the org's AI
credit wallet automatically — no credit bookkeeping needed in this file.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.middleware.exceptions import NotFoundError
from app.models.organization import Organization
from app.models.user import User
from app.services import ai_credit_service, token_utilization_service
from app.ai.schemas.ai_credit import AICreditBalanceResponse, AICreditPurchaseRequest
from app.ai.schemas.token_utilization import TokenUtilizationSummary
from app.ai.schemas.ai_chat import (
    AIChatSessionCreate,
    AIChatSessionRead,
    AIChatSessionDetail,
    AIChatMessageCreate,
)
from app.ai.schemas.requests import AITaskRunRequest, AITaskApprovalRequest
from app.ai.schemas.responses import AITaskRunResponse, AITaskLogRead, AITaskLogListItem
from app.ai.services.chat_service import AIChatService
from app.ai.brain.engine import AIEngine
from app.ai.brain.journal import get_task_log_by_public_id, list_task_logs
from app.schemas.project import DescriptionEnhanceRequest, DescriptionEnhanceResponse

router = APIRouter(prefix="/ai", tags=["AI"])


async def _get_current_org(current_user: User, db: AsyncSession) -> Organization:
    if current_user.organization_id is None:
        raise NotFoundError("This account is not associated with an organization.")
    org = await db.get(Organization, current_user.organization_id)
    if org is None:
        raise NotFoundError("Organization not found.")
    return org


@router.get(
    "/credits",
    response_model=AICreditBalanceResponse,
    summary="Get my own AI credit balance",
)
async def get_credit_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AICreditBalanceResponse:
    org = await _get_current_org(current_user, db)
    wallet = await ai_credit_service.get_wallet_status(db, org, current_user.id)
    await db.commit()  # persists a first-time wallet creation / period rollover, if one occurred
    return AICreditBalanceResponse.from_wallet(wallet)


@router.post(
    "/credits/purchase",
    response_model=AICreditBalanceResponse,
    summary="Buy additional AI credits for my own wallet",
    description=(
        "Self-service top-up -- adds credits directly to the caller's own wallet for the "
        "current period. Payment itself is out of scope here (mirrors how plan upgrades work "
        "elsewhere in this app: the frontend runs its own mock checkout, then calls this once "
        "'payment' succeeds) -- this endpoint only ever applies the credit grant."
    ),
)
async def purchase_credits(
    payload: AICreditPurchaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AICreditBalanceResponse:
    from app.repositories.ai_credit import AICreditRepository
    from app.models.ai_credit import AICreditTransactionReason

    org = await _get_current_org(current_user, db)
    wallet = await ai_credit_service.get_or_create_wallet_for_user(db, org, current_user.id)
    await AICreditRepository.grant_bonus_credits(
        db, wallet, amount=payload.amount, user_id=current_user.id,
        reason=AICreditTransactionReason.PURCHASE,
    )
    await db.commit()
    return AICreditBalanceResponse.from_wallet(wallet)


@router.get(
    "/usage",
    response_model=TokenUtilizationSummary,
    summary="Token utilization — totals, breakdowns, and a daily trend",
)
async def get_token_utilization(
    period_start: Optional[datetime] = Query(None, description="Defaults to the start of the current calendar month"),
    period_end: Optional[datetime] = Query(None, description="Defaults to now"),
    scope: str = Query("mine", pattern="^(mine|organization)$", description="'mine' (default) for my own usage, 'organization' for every member's combined"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TokenUtilizationSummary:
    org = await _get_current_org(current_user, db)
    user_id = current_user.id if scope == "mine" else None
    return await token_utilization_service.get_utilization_summary(db, org.id, period_start, period_end, user_id)


# ── IRIS Chat ────────────────────────────────────────────────────────────────

@router.post(
    "/chat/sessions",
    response_model=AIChatSessionDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new IRIS chat session",
)
async def create_chat_session(
    schema: AIChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIChatSessionDetail:
    service = AIChatService(db, current_user)
    return await service.create_session(schema)


@router.get(
    "/chat/sessions",
    response_model=list[AIChatSessionRead],
    summary="List my IRIS chat sessions, most recent first",
)
async def list_chat_sessions(
    context_module: Optional[str] = Query(None, description="Scope to sessions opened from this per-module panel, e.g. 'leave'"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AIChatSessionRead]:
    service = AIChatService(db, current_user)
    return await service.get_sessions(context_module=context_module)


@router.get(
    "/chat/sessions/{session_id}",
    response_model=AIChatSessionDetail,
    summary="Get one chat session with its full message history",
)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AIChatSessionDetail:
    service = AIChatService(db, current_user)
    session = await service.get_session_details(session_id)
    if session is None:
        raise NotFoundError("Chat session not found.")
    return session


@router.post(
    "/chat/sessions/{session_id}/messages",
    summary="Send a message and stream IRIS's response (SSE)",
)
async def send_chat_message(
    session_id: int,
    schema: AIChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    service = AIChatService(db, current_user)
    return StreamingResponse(
        service.stream_message(session_id, schema),
        media_type="text/event-stream",
    )


@router.delete(
    "/chat/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a chat session and its history",
)
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = AIChatService(db, current_user)
    deleted = await service.delete_session(session_id)
    if not deleted:
        raise NotFoundError("Chat session not found.")


# ── One-shot agentic task runs ────────────────────────────────────────────────

@router.post(
    "/tasks/run",
    response_model=AITaskRunResponse,
    summary="Run a one-shot agentic AI task (plan -> execute tools -> synthesize)",
)
async def run_ai_task(
    request: AITaskRunRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AITaskRunResponse:
    engine = AIEngine(db, current_user)
    return await engine.run(request)


@router.get(
    "/tasks",
    response_model=list[AITaskLogListItem],
    summary="List my organization's AI task runs, most recent first",
)
async def list_ai_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AITaskLogListItem]:
    org = await _get_current_org(current_user, db)
    logs, _total = await list_task_logs(
        db, organization_id=org.id, page=page, page_size=page_size, status_filter=status_filter,
    )
    return logs


async def _get_org_task_or_404(public_id: uuid.UUID, current_user: User, db: AsyncSession):
    log = await get_task_log_by_public_id(db, str(public_id))
    if log is None or log.organization_id != current_user.organization_id:
        raise NotFoundError("AI task not found.")
    return log


async def _persist_resume_reply_if_chat(
    db: AsyncSession, current_user: User, log, result: AITaskRunResponse, *, approved: bool,
) -> None:
    """AIEngine.resume() has no notion of chat sessions -- if this task was paused mid-
    conversation (log.chat_session_id set), append its resumed reply to that session's message
    thread so reopening the session later doesn't silently drop this turn. useAIChat's own
    optimistic local append still handles the immediate UI update; this is what makes it durable."""
    if log.chat_session_id is None:
        return
    reply_text = result.summary or ("Done." if approved else "Cancelled.")
    await AIChatService(db, current_user).append_assistant_reply(log.chat_session_id, reply_text, log.id)


@router.get(
    "/tasks/{public_id}",
    response_model=AITaskLogRead,
    summary="Get one AI task run, including its full plan/step journal",
)
async def get_ai_task(
    public_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AITaskLogRead:
    return await _get_org_task_or_404(public_id, current_user, db)


@router.post(
    "/tasks/{public_id}/approve",
    response_model=AITaskRunResponse,
    summary="Approve a task paused for human review, resuming execution from where it stopped",
)
async def approve_ai_task(
    public_id: uuid.UUID,
    payload: AITaskApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AITaskRunResponse:
    log = await _get_org_task_or_404(public_id, current_user, db)
    engine = AIEngine(db, current_user)
    result = await engine.resume(log, approved=True, approver=current_user, reason=payload.reason)
    await _persist_resume_reply_if_chat(db, current_user, log, result, approved=True)
    return result


@router.post(
    "/tasks/{public_id}/reject",
    response_model=AITaskRunResponse,
    summary="Reject a task paused for human review, cancelling it",
)
async def reject_ai_task(
    public_id: uuid.UUID,
    payload: AITaskApprovalRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AITaskRunResponse:
    log = await _get_org_task_or_404(public_id, current_user, db)
    engine = AIEngine(db, current_user)
    result = await engine.resume(log, approved=False, approver=current_user, reason=payload.reason)
    await _persist_resume_reply_if_chat(db, current_user, log, result, approved=False)
    return result


# ── Description Assist ────────────────────────────────────────────────────────

@router.post(
    "/description/enhance",
    response_model=DescriptionEnhanceResponse,
    summary="Have IRIS fix typos, tighten wording, or expand a task/subtask description",
)
async def enhance_description(
    request: DescriptionEnhanceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DescriptionEnhanceResponse:
    from app.ai.services.task_assist_service import TaskAssistService

    enhanced = await TaskAssistService(db, current_user).enhance_description(request.text, request.mode)
    return DescriptionEnhanceResponse(enhanced_text=enhanced)
