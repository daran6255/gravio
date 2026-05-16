"""
AI Engine — Chat Service
========================

Orchestrates multi-turn conversations between users and the AI Coworker.
Handles session persistence, message history retrieval, and agentic response generation.
"""

from __future__ import annotations

import json
import logging
import asyncio
from typing import AsyncGenerator, TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.ai.brain.engine import AIEngine
from app.ai.brain.synthesizer import Synthesizer
from app.ai.brain.journal import TaskJournal
from app.ai.providers import get_llm_provider
from app.ai.mcp.registry import registry
from app.ai.brain.exceptions import LLMAuthError, LLMRateLimitError
from app.models.ai_chat import AIChatSession, AIChatMessage
from app.models.ai_task_log import AITaskStatus, AITaskTrigger
from app.repositories.system_setting_repository import SystemSettingRepository

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User
    from app.schemas.ai_chat import AIChatSessionCreate, AIChatMessageCreate

logger = logging.getLogger(__name__)


class AIChatService:
    """
    Manages the lifecycle and execution of AI chat interactions.
    """

    def __init__(self, db: "AsyncSession", user: "User"):
        self._db = db
        self._user = user
        self._engine = AIEngine(db, user)
        self._synthesizer = Synthesizer()

    # ── Persistence Logic ────────────────────────────────────────────────────

    async def create_session(self, schema: "AIChatSessionCreate") -> AIChatSession:
        """Initialize a new chat thread."""
        session = AIChatSession(
            user_id=self._user.id,
            title=schema.title
        )
        self._db.add(session)
        await self._db.flush()

        # Initial greeting
        greeting = AIChatMessage(
            session_id=session.id,
            role="assistant",
            content="Hello! I am ARIA, your AI coworker. How can I help you today?"
        )
        self._db.add(greeting)
        await self._db.commit()
        
        return await self.get_session_details(session.id)

    async def get_sessions(self) -> list[AIChatSession]:
        """Retrieve the user's conversation history."""
        result = await self._db.execute(
            select(AIChatSession)
            .where(AIChatSession.user_id == self._user.id)
            .order_by(AIChatSession.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_session_details(self, session_id: int) -> AIChatSession | None:
        """Fetch a specific session with history."""
        result = await self._db.execute(
            select(AIChatSession)
            .where(AIChatSession.id == session_id, AIChatSession.user_id == self._user.id)
            .options(selectinload(AIChatSession.messages))
        )
        return result.scalar_one_or_none()

    # ── Streaming Execution ──────────────────────────────────────────────────

    async def stream_message(self, session_id: int, schema: "AIChatMessageCreate") -> AsyncGenerator[str, None]:
        """
        Stream the assistant response via SSE and persist everything to the DB.
        """
        # 1. Load context
        session = await self.get_session_details(session_id)
        if not session:
            yield f"data: {json.dumps({'error': 'Session not found', 'status': 'failed'})}\n\n"
            return

        # 2. Persist User Message
        user_msg = AIChatMessage(
            session_id=session_id,
            role="user",
            content=schema.content
        )
        self._db.add(user_msg)
        await self._db.flush()

        # Auto-name session
        if session.title in ("New Conversation", "") and schema.content.strip():
            new_title = schema.content.strip().replace("\n", " ")[:40]
            if len(schema.content.strip()) > 40: new_title += "…"
            session.title = new_title
            await self._db.flush()

        # 3. Prepare History (cap for TPM/context limits)
        history = [{"role": m.role, "content": m.content} for m in session.messages[-6:]]

        # 4. Agentic Execution Flow
        repo = SystemSettingRepository(self._db)
        stored_prompt = await repo.get_by_key("AI_SYSTEM_PROMPT")
        system_prompt_override = stored_prompt.value if stored_prompt else None

        try:
            provider = await get_llm_provider(self._db)
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e), 'status': 'failed'})}\n\n"
            return

        journal = await TaskJournal.create(
            db=self._db,
            task_name="AI Coworker Chat",
            trigger=AITaskTrigger.MANUAL,
            raw_input={"message": schema.content},
            ai_provider=provider.provider_name,
            ai_model=provider.model_name,
            triggered_by_user_id=self._user.id,
            chat_session_id=session_id,
        )

        full_content = ""
        try:
            # Planning
            yield f"data: {json.dumps({'status': 'planning', 'message': 'Planning response...'})}\n\n"
            await journal.mark_planning()
            from app.ai.brain.planner import Planner
            planner = Planner(provider=provider, registry=registry, db=self._db)
            
            plan = await planner.plan(
                task_hint=schema.content,
                input_data={},
                history=history,
                system_prompt_override=system_prompt_override,
            )
            await journal.record_plan(plan)

            # Executing Tools
            if plan.steps:
                for step in plan.steps:
                    yield f"data: {json.dumps({'status': 'executing', 'message': f'Running {step.tool_name}...'})}\n\n"
            
            _, results = await self._engine._execute_task_with_plan(plan, journal)
            
            # Synthesis & Token Streaming
            yield f"data: {json.dumps({'status': 'typing'})}\n\n"
            full_content = self._synthesizer.synthesize_tool_results(
                results=results,
                planned_response=plan.response_to_user
            )

            words = full_content.split(" ")
            for i, word in enumerate(words):
                token = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'token': token})}\n\n"
                await asyncio.sleep(0.01) # Low latency streaming

            # Finalize
            await journal.finalize(status=AITaskStatus.COMPLETED, summary=full_content)
            yield f"data: {json.dumps({'status': 'completed', 'summary': full_content, 'task_db_id': journal.task_id})}\n\n"

        except Exception as e:
            logger.exception("Chat failed")
            msg = f"⚠️ **Error:** {str(e)}"
            await journal.finalize(status=AITaskStatus.FAILED, summary=msg, error_message=str(e))
            yield f"data: {json.dumps({'error': msg, 'status': 'failed'})}\n\n"
            full_content = msg

        # 5. Persist Assistant Message
        if full_content:
            assistant_msg = AIChatMessage(
                session_id=session_id,
                role="assistant",
                content=full_content,
                task_log_id=journal.task_id
            )
            self._db.add(assistant_msg)
            await self._db.commit()
            yield f"data: {json.dumps({'session_title_update': session.title, 'session_id': session_id})}\n\n"

    async def delete_session(self, session_id: int) -> bool:
        """Permanently remove a chat thread."""
        session = await self.get_session_details(session_id)
        if not session: return False
        await self._db.delete(session)
        await self._db.commit()
        return True
