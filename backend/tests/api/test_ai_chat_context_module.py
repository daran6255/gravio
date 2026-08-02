"""Verifies the new AIChatSession.context_module plumbing added to thread per-module IRIS
panels (Leave/Timesheet/Meeting/a Project Task) onto the real chat session engine instead of
the old stateless preview/confirm endpoints:
 - a session created with context_module is scoped correctly by get_sessions()
 - stream_message prepends the one-line planner grounding note for a context'd session
 - approve/reject's resumed reply is durably persisted into the session's message thread
   (the gap found during research: AIEngine.resume() has no notion of chat sessions)
"""

from datetime import datetime, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.core.context import tenant_context, superuser_context
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.ai.brain.schemas import ToolCallPlan, ToolCallRequest
from app.ai.models.ai_task_log import AITaskLog, AITaskStatus, AITaskTrigger
from app.ai.schemas.ai_chat import AIChatSessionCreate, AIChatMessageCreate
from app.ai.services.chat_service import AIChatService


@pytest.fixture
async def chat_test_user(db_session: AsyncSession):
    org = Organization(name="Chat Context Org", subscription_status="trial")
    db_session.add(org)
    await db_session.flush()

    user = User(
        email="chatctx@x.com", username="chatctx_user", full_name="Chat Ctx User",
        hashed_password=get_password_hash("password123"), organization_id=org.id,
        role=UserRole.DEVELOPER, is_active=True, is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


def _set_tenant(user) -> None:
    # pytest-asyncio runs each fixture/test in its own task, and asyncio tasks only inherit a
    # *copy* of the context at creation time -- a contextvar set inside the fixture's task
    # would not be visible in the test function's task, so this must be called from within
    # each test itself (mirrors what get_current_user does per-request in production).
    tenant_context.set(user.organization_id)
    superuser_context.set(user.is_superuser)


async def test_get_sessions_scopes_by_context_module(db_session: AsyncSession, chat_test_user):
    _set_tenant(chat_test_user)
    service = AIChatService(db_session, chat_test_user)

    leave_session = await service.create_session(AIChatSessionCreate(context_module="leave"))
    timesheet_session = await service.create_session(AIChatSessionCreate(context_module="timesheet"))
    global_session = await service.create_session(AIChatSessionCreate())

    leave_only = await service.get_sessions(context_module="leave")
    assert [s.id for s in leave_only] == [leave_session.id]

    timesheet_only = await service.get_sessions(context_module="timesheet")
    assert [s.id for s in timesheet_only] == [timesheet_session.id]

    unfiltered = await service.get_sessions()
    assert {s.id for s in unfiltered} == {leave_session.id, timesheet_session.id, global_session.id}


async def test_stream_message_prepends_grounding_note_for_context_module(db_session: AsyncSession, chat_test_user, monkeypatch):
    _set_tenant(chat_test_user)
    service = AIChatService(db_session, chat_test_user)
    session = await service.create_session(AIChatSessionCreate(context_module="leave"))

    captured: dict = {}

    class FakeProvider:
        provider_name = "gemini"
        model_name = "gemini-3.5-flash-lite"

    async def fake_get_llm_provider(*args, **kwargs):
        return FakeProvider()

    async def fake_plan(self, *, task_hint, input_data, history=None, **kwargs):
        captured["history"] = history
        return ToolCallPlan(
            task_name="Check balance", reasoning="r", response_to_user="Here you go.",
            steps=[], estimated_record_impact=0,
        )

    monkeypatch.setattr("app.ai.brain.engine.get_llm_provider", fake_get_llm_provider)
    monkeypatch.setattr("app.ai.brain.planner.Planner.plan", fake_plan)

    from app.ai.schemas.ai_chat import AIChatMessageCreate as MsgCreate
    events = [chunk async for chunk in service.stream_message(session.id, MsgCreate(content="What is my balance?"))]
    assert events, "expected at least one SSE line"

    history = captured.get("history")
    assert history is not None
    assert history[0]["role"] == "system"
    assert "Leave module" in history[0]["content"]


async def test_approve_resume_persists_reply_into_chat_session(db_session: AsyncSession, chat_test_user):
    """Directly exercises AIChatService.append_assistant_reply -- the fix for the durability
    gap where a resumed approval's reply previously only existed as a client-side optimistic
    message and reopening the session would silently drop that turn."""
    _set_tenant(chat_test_user)
    service = AIChatService(db_session, chat_test_user)
    session = await service.create_session(AIChatSessionCreate(context_module="leave"))

    log = AITaskLog(
        task_name="test task", trigger=AITaskTrigger.MANUAL, status=AITaskStatus.AWAITING_APPROVAL,
        raw_input={}, ai_provider="gemini", ai_model="gemini-3.5-flash-lite",
        triggered_by_user_id=chat_test_user.id, chat_session_id=session.id,
        steps=[], tools_called=0, tools_succeeded=0, tools_failed=0, records_affected=0,
        requires_approval=True, started_at=datetime.now(timezone.utc),
    )
    db_session.add(log)
    await db_session.commit()
    await db_session.refresh(log)

    await service.append_assistant_reply(session.id, "Approved and completed.", log.id)

    reopened = await service.get_session_details(session.id)
    assert reopened is not None
    assistant_replies = [m for m in reopened.messages if m.role == "assistant" and m.content == "Approved and completed."]
    assert len(assistant_replies) == 1
    assert assistant_replies[0].task_log_id == log.id


async def test_debug_inspect_message_org(db_session: AsyncSession, chat_test_user):
    from sqlalchemy import select
    from app.ai.models.ai_chat import AIChatMessage

    _set_tenant(chat_test_user)
    service = AIChatService(db_session, chat_test_user)
    session = await service.create_session(AIChatSessionCreate(context_module="leave"))
    await service.append_assistant_reply(session.id, "Approved and completed.", None)

    result = await db_session.execute(select(AIChatMessage.id, AIChatMessage.content, AIChatMessage.organization_id, AIChatMessage.session_id))
    for row in result.all():
        print("ROW:", row)
    print("session.organization_id =", session.organization_id, "user.organization_id =", chat_test_user.organization_id)


async def test_debug_inspect_with_tasklog(db_session: AsyncSession, chat_test_user):
    from sqlalchemy import select
    from app.ai.models.ai_chat import AIChatMessage

    _set_tenant(chat_test_user)
    service = AIChatService(db_session, chat_test_user)
    session = await service.create_session(AIChatSessionCreate(context_module="leave"))

    log = AITaskLog(
        task_name="test task", trigger=AITaskTrigger.MANUAL, status=AITaskStatus.AWAITING_APPROVAL,
        raw_input={}, ai_provider="gemini", ai_model="gemini-3.5-flash-lite",
        triggered_by_user_id=chat_test_user.id, chat_session_id=session.id,
        steps=[], tools_called=0, tools_succeeded=0, tools_failed=0, records_affected=0,
        requires_approval=True, started_at=datetime.now(timezone.utc),
    )
    db_session.add(log)
    await db_session.commit()
    await db_session.refresh(log)
    print("log.organization_id =", log.organization_id)

    await service.append_assistant_reply(session.id, "Approved and completed.", log.id)

    result = await db_session.execute(select(AIChatMessage.id, AIChatMessage.content, AIChatMessage.organization_id, AIChatMessage.task_log_id))
    for row in result.all():
        print("ROW2:", row)

    reopened = await service.get_session_details(session.id)
    print("reopened messages:", [(m.role, m.content) for m in reopened.messages] if reopened else None)
