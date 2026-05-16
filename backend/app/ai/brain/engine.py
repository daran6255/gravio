"""
AI Engine — Main Orchestrator
==============================

AIEngine is the central coordinator for all agentic task runs.
Refactored to focus strictly on task execution and orchestration.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import timedelta
from typing import Any, TYPE_CHECKING

from app.ai.brain.exceptions import (
    AIEngineError,
    LLMAuthError,
    LLMProviderError,
    NoPlanGeneratedError,
    ToolLimitExceededError,
)
from app.ai.brain.planner import Planner
from app.ai.brain.synthesizer import Synthesizer
from app.ai.providers import get_llm_provider
from app.ai.brain.schemas import ToolCallPlan, ToolCallRequest, ToolResult
from app.ai.schemas import AITaskRunRequest, AITaskRunResponse
from app.ai.brain.journal import TaskJournal
from app.ai.mcp.registry import registry as global_registry
import app.ai.mcp.tools  # Trigger tool discovery and registration
from app.core.config import settings
from app.models.ai_task_log import AITaskStatus, AITaskTrigger

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User

logger = logging.getLogger(__name__)


class AIEngine:
    """
    The agentic orchestrator.
    Handle task lifecycle: Plan -> Execute Tools -> Synthesize Response -> Journal.
    """

    def __init__(
        self,
        db: "AsyncSession",
        user: "User",
    ):
        self._db = db
        self._user = user
        self._user_id = user.id
        self._registry = global_registry
        self._synthesizer = Synthesizer()
        
        # Log tool count for diagnostics
        logger.debug(f"AIEngine initialized with {len(self._registry.all())} tools.")

    async def run(self, request: AITaskRunRequest) -> AITaskRunResponse:
        """
        Execute a full agentic task run.
        The single entry point for non-streaming AI task execution.
        """
        # Determine trigger type
        try:
            trigger = AITaskTrigger(request.trigger_type)
        except ValueError:
            trigger = AITaskTrigger.API

        # Initialise LLM provider
        try:
            provider = await get_llm_provider(self._db)
        except (LLMAuthError, LLMProviderError) as e:
            logger.error("Cannot initialize LLM provider: %s", str(e))
            return AITaskRunResponse(
                task_id=uuid.uuid4(),
                status="failed",
                task_name=request.task_hint,
                steps_planned=0,
                steps_completed=0,
                steps_failed=0,
                records_affected=0,
                requires_approval=False,
                error=e.message,
            )

        # Create the journal (DB row) immediately
        journal = await TaskJournal.create(
            db=self._db,
            task_name=request.task_hint,
            trigger=trigger,
            raw_input=request.input_data,
            ai_provider=provider.provider_name,
            ai_model=provider.model_name,
            triggered_by_user_id=self._user_id,
        )

        try:
            # Run the full task with a hard timeout
            result = await asyncio.wait_for(
                self._execute_task(request, journal, provider),
                timeout=settings.AI_TASK_TIMEOUT_SECONDS,
            )
            return result

        except asyncio.TimeoutError:
            error_msg = f"Task timed out after {settings.AI_TASK_TIMEOUT_SECONDS}s"
            await journal.finalize(
                status=AITaskStatus.FAILED,
                summary="⏱️ Task execution timed out.",
                error_message=error_msg,
            )
            return self._build_response(journal, status="failed", error=error_msg)

        except Exception as e:
            logger.exception("Unexpected error in AIEngine.run — task_id=%d", journal.task_id)
            await journal.finalize(
                status=AITaskStatus.FAILED,
                summary="💥 An unexpected error occurred.",
                error_message=str(e),
            )
            return self._build_response(journal, status="failed", error=str(e))

    # ── Internal Execution Flow ───────────────────────────────────────────────

    async def _execute_task(
        self,
        request: AITaskRunRequest,
        journal: TaskJournal,
        provider: Any,
    ) -> AITaskRunResponse:
        """Core task execution logic — called inside the timeout guard."""

        # ── 1. Planning Phase ─────────────────────────────────────────────────
        await journal.mark_planning()

        planner = Planner(provider=provider, registry=self._registry, db=self._db)

        try:
            plan: ToolCallPlan = await planner.plan(
                task_hint=request.task_hint,
                input_data=request.input_data,
            )
        except NoPlanGeneratedError:
            await journal.finalize(
                status=AITaskStatus.FAILED,
                summary="🤔 The AI could not determine a plan for this task.",
                error_message="No tool calls were generated.",
            )
            return self._build_response(journal, status="failed", error="No plan generated.")

        except LLMProviderError as e:
            await journal.finalize(
                status=AITaskStatus.FAILED,
                summary=f"❌ LLM provider error: {e.message}",
                error_message=e.message,
            )
            return self._build_response(journal, status="failed", error=e.message)

        await journal.record_plan(plan)

        # ── Dry Run: Return plan without executing ────────────────────────────
        if request.dry_run:
            dry_summary = (
                f"[DRY RUN] {len(plan.steps)} step(s) planned: "
                + ", ".join(s.tool_name for s in plan.steps)
            )
            await journal.finalize(
                status=AITaskStatus.COMPLETED,
                summary=dry_summary,
            )
            return self._build_response(journal, status="completed")

        # ── 2. Execution Phase ────────────────────────────────────────────────
        response, results = await self._execute_task_with_plan(plan, journal)
        
        # ── 3. Synthesis Phase ────────────────────────────────────────────────
        if results and response.status == "completed":
             synthesis = self._synthesizer.synthesize_tool_results(
                 results=results,
                 planned_response=plan.response_to_user
             )
             await journal.finalize(status=AITaskStatus.COMPLETED, summary=synthesis)
             return self._build_response(journal, status="completed")
                 
        return response

    async def _execute_task_with_plan(
        self,
        plan: ToolCallPlan,
        journal: TaskJournal,
    ) -> tuple[AITaskRunResponse, list[tuple[ToolCallRequest, ToolResult]]]:
        """Executes a series of tool calls from a plan."""
        await journal.mark_running()

        final_status = AITaskStatus.COMPLETED
        execution_results: list[tuple[ToolCallRequest, ToolResult]] = []

        for step_num, step in enumerate(plan.steps, start=1):
            # Safety limit
            if step_num > settings.AI_MAX_TOOL_CALLS_PER_RUN:
                raise ToolLimitExceededError(settings.AI_MAX_TOOL_CALLS_PER_RUN)

            await journal.record_step_start(
                step_number=step_num,
                tool_name=step.tool_name,
                parameters=step.parameters,
                reasoning=step.reasoning,
            )

            # Get tool
            try:
                tool = self._registry.get(step.tool_name)
            except AIEngineError as e:
                await journal.record_step_result(
                    step_num,
                    ToolResult(success=False, message=e.message, error=e.message),
                )
                final_status = AITaskStatus.PARTIALLY_COMPLETED
                continue

            # Validate parameters
            validation_errors = tool.validate_params(step.parameters)
            if validation_errors:
                error_msg = "; ".join(validation_errors)
                await journal.record_step_result(
                    step_num,
                    ToolResult(success=False, message=f"Validation failed: {error_msg}", error=error_msg),
                )
                final_status = AITaskStatus.PARTIALLY_COMPLETED
                continue

            # Approval gate
            if tool.definition.requires_approval:
                await journal.mark_awaiting_approval(
                    reason="Tool requires human approval before execution",
                    pending_tool=step.tool_name,
                )
                return self._build_response(journal, status="awaiting_approval"), execution_results

            # Execute
            try:
                result = await tool.execute(params=step.parameters, db=self._db, user=self._user)
                await journal.record_step_result(step_num, result)
                execution_results.append((step, result))
                if not result.success:
                    final_status = AITaskStatus.PARTIALLY_COMPLETED
            except Exception as e:
                logger.exception(f"Tool '{step.tool_name}' failed at step {step_num}")
                await journal.record_step_result(
                    step_num,
                    ToolResult(success=False, message=f"Tool crashed: {type(e).__name__}", error=str(e)),
                )
                final_status = AITaskStatus.PARTIALLY_COMPLETED

        return self._build_response(journal, status=final_status.value), execution_results

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_response(
        self,
        journal: TaskJournal,
        status: str,
        error: str | None = None,
    ) -> AITaskRunResponse:
        log = journal.log
        return AITaskRunResponse(
            task_id=log.public_id,
            task_db_id=log.id,
            status=status,
            task_name=log.task_name,
            steps_planned=len(log.plan) if log.plan else 0,
            steps_completed=log.tools_succeeded,
            steps_failed=log.tools_failed,
            records_affected=log.records_affected,
            requires_approval=log.requires_approval,
            summary=log.summary,
            duration_ms=log.duration_ms,
            error=error or log.error_message,
        )
