"""AI endpoints — credits/usage, ARIA chat, and one-shot agentic task runs.

Thin route wrappers only: all real logic lives in AIChatService, AIEngine, and
ai_credit_service/token_utilization_service. Every user-triggered call here goes through
get_llm_provider(org_id=..., user_id=...) internally, so it's metered against the org's AI
credit wallet automatically — no credit bookkeeping needed in this file.
"""

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
from app.ai.schemas.ai_credit import AICreditBalanceResponse
from app.ai.schemas.token_utilization import TokenUtilizationSummary
from app.ai.schemas.ai_chat import (
    AIChatSessionCreate,
    AIChatSessionRead,
    AIChatSessionDetail,
    AIChatMessageCreate,
)
from app.ai.schemas.requests import AITaskRunRequest
from app.ai.schemas.responses import AITaskRunResponse
from app.ai.services.chat_service import AIChatService
from app.ai.brain.engine import AIEngine

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
    summary="Get the current AI credit balance for my organization",
)
async def get_credit_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AICreditBalanceResponse:
    org = await _get_current_org(current_user, db)
    wallet = await ai_credit_service.get_wallet_status(db, org)
    await db.commit()  # persists a first-time wallet creation / period rollover, if one occurred
    return AICreditBalanceResponse.from_wallet(wallet)


@router.get(
    "/usage",
    response_model=TokenUtilizationSummary,
    summary="Token utilization for my organization — totals, breakdowns, and a daily trend",
)
async def get_token_utilization(
    period_start: Optional[datetime] = Query(None, description="Defaults to the start of the current calendar month"),
    period_end: Optional[datetime] = Query(None, description="Defaults to now"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TokenUtilizationSummary:
    org = await _get_current_org(current_user, db)
    return await token_utilization_service.get_utilization_summary(db, org.id, period_start, period_end)


# ── ARIA Chat ────────────────────────────────────────────────────────────────

@router.post(
    "/chat/sessions",
    response_model=AIChatSessionDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new ARIA chat session",
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
    summary="List my ARIA chat sessions, most recent first",
)
async def list_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AIChatSessionRead]:
    service = AIChatService(db, current_user)
    return await service.get_sessions()


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
    summary="Send a message and stream ARIA's response (SSE)",
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
