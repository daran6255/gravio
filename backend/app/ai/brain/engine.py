"""
AI Engine — Main Orchestrator
==============================

AIEngine is the central coordinator for all agentic task runs.
Focuses strictly on task execution and orchestration; planning lives in `Planner`,
journaling in `TaskJournal`, response formatting in `Synthesizer`.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, TYPE_CHECKING

from app.ai.brain.exceptions import (
    AIEngineError,
    LLMAuthError,
    LLMProviderError,
    LLMResponseParseError,
    NoPlanGeneratedError,
    PlanningError,
    ToolLimitExceededError,
)
from app.ai.brain.events import EngineEvent, EngineEventType
from app.ai.brain.planner import Planner
from app.ai.brain.synthesizer import Synthesizer
from app.ai.providers import get_llm_provider
from app.ai.brain.schemas import ToolCallPlan, ToolCallRequest, ToolResult, ToolRiskTier
from app.ai.schemas import AITaskRunRequest, AITaskRunResponse
from app.ai.brain.journal import TaskJournal
from app.ai.mcp.registry import registry as global_registry
import app.ai.mcp.tools  # Trigger tool discovery and registration
from app.core.config import settings
from app.middleware.exceptions import BadRequestError, ForbiddenError
from app.ai.models.ai_task_log import AITaskStatus, AITaskTrigger

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User
    from app.ai.models.ai_task_log import AITaskLog

logger = logging.getLogger(__name__)


class AIEngine:
    """
    The agentic orchestrator.
    Handles task lifecycle: Plan -> Execute Tools -> (re-plan as needed) -> Synthesize -> Journal.
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

    async def preview(self, request: AITaskRunRequest) -> ToolCallPlan:
        """
        Planning-only preview for the propose-then-confirm flow: runs just the LLM planning
        phase and returns the raw plan (steps + response_to_user) without executing anything
        and without creating a TaskJournal row. Deliberately separate from `dry_run` on `run()`,
        which finalizes a journal and only returns a terse tool-name summary -- callers that
        need to show the user what's about to happen (not just log that something was planned)
        call this instead, then call `run(..., dry_run=False, confirmed=True)` to actually
        execute on confirm.

        Stays single-turn even though `run()` may now re-plan across multiple turns: preview
        never executes a tool, so there's nothing for a second turn to observe or react to --
        multi-turn re-planning only has value once real tool results exist.
        """
        provider = await get_llm_provider(
            self._db, org_id=self._user.organization_id, user_id=self._user_id,
            action_type="agentic_task_preview",
        )
        planner = Planner(provider=provider, registry=self._registry, db=self._db)
        return await planner.plan(
            task_hint=request.task_hint,
            input_data=request.input_data,
        )

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

        # Initialise LLM provider (metered against the user's org, so agentic runs draw from
        # the same AI credit wallet as chat/extraction calls)
        try:
            provider = await get_llm_provider(
                self._db, org_id=self._user.organization_id, user_id=self._user_id,
                action_type="agentic_task",
            )
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

    async def resume(
        self,
        log: "AITaskLog",
        approved: bool,
        approver: "User",
        reason: str | None = None,
    ) -> AITaskRunResponse:
        """
        Approve or reject a task paused with status=AWAITING_APPROVAL.

        Only the user who originally triggered the task may decide it. Approving stamps
        `approved_by_user_id`/`approved_at` and resumes `_run_loop` from the paused step
        onward, inside a *fresh* full `AI_TASK_TIMEOUT_SECONDS` window -- human approval
        latency is unbounded and shouldn't burn into execution time. Rejecting cancels the
        task without touching the approval columns (those specifically mean "approved").
        """
        if approver.id != log.triggered_by_user_id:
            raise ForbiddenError("Only the user who triggered this task can approve or reject it.")
        if log.status != AITaskStatus.AWAITING_APPROVAL:
            raise BadRequestError(f"Task is '{log.status.value}', not awaiting approval.")

        journal = TaskJournal.load(self._db, log)

        if not approved:
            await journal.reject(rejected_by=approver, reason=reason)
            return self._build_response(journal, status="cancelled")

        log.approved_by_user_id = approver.id
        log.approved_at = datetime.now(timezone.utc)
        await self._db.flush()

        try:
            provider = await get_llm_provider(
                self._db, org_id=self._user.organization_id, user_id=self._user_id,
                action_type="agentic_task_resume",
            )
        except (LLMAuthError, LLMProviderError) as e:
            await journal.finalize(
                status=AITaskStatus.FAILED,
                summary=f"❌ LLM provider error: {e.message}",
                error_message=e.message,
            )
            return self._build_response(journal, status="failed", error=e.message)

        try:
            result = await asyncio.wait_for(
                self._resume_execution(journal, provider),
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
            logger.exception("Unexpected error in AIEngine.resume — task_id=%d", journal.task_id)
            await journal.finalize(
                status=AITaskStatus.FAILED,
                summary="💥 An unexpected error occurred.",
                error_message=str(e),
            )
            return self._build_response(journal, status="failed", error=str(e))

    async def _resume_execution(self, journal: TaskJournal, provider: Any) -> AITaskRunResponse:
        """Core resume logic -- called inside the timeout guard, mirrors `_execute_task`'s
        non-dry-run branch but re-enters `_run_loop` mid-plan instead of starting fresh."""
        task_hint = journal.log.task_name
        input_data = journal.log.raw_input or {}
        try:
            return await self._drain_run_loop(
                self._run_loop(journal, provider, task_hint, input_data, resume=True)
            )
        except ToolLimitExceededError as e:
            await journal.finalize(
                status=AITaskStatus.FAILED,
                summary=f"🤔 {e.message} Try asking for this in smaller batches.",
                error_message=e.message,
            )
            return self._build_response(journal, status="failed", error=e.message)

    # ── Internal Execution Flow ───────────────────────────────────────────────

    async def _execute_task(
        self,
        request: AITaskRunRequest,
        journal: TaskJournal,
        provider: Any,
    ) -> AITaskRunResponse:
        """Core task execution logic — called inside the timeout guard."""

        # dry_run stays single-turn, same reasoning as preview(): nothing is executed, so
        # there's nothing for a second planning turn to react to.
        if request.dry_run:
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
            except LLMResponseParseError as e:
                await journal.finalize(
                    status=AITaskStatus.FAILED,
                    summary="🤔 IRIS's plan came back malformed -- this can happen when a request "
                            "needs a lot of steps at once. Try a more specific or smaller request.",
                    error_message=e.message,
                )
                return self._build_response(journal, status="failed", error=e.message)
            except PlanningError as e:
                await journal.finalize(
                    status=AITaskStatus.FAILED,
                    summary=f"🤔 {e.message}",
                    error_message=e.message,
                )
                return self._build_response(journal, status="failed", error=e.message)
            except LLMProviderError as e:
                await journal.finalize(
                    status=AITaskStatus.FAILED,
                    summary=f"❌ LLM provider error: {e.message}",
                    error_message=e.message,
                )
                return self._build_response(journal, status="failed", error=e.message)

            await journal.record_plan(plan, turn=1, step_offset=1)
            dry_summary = (
                f"[DRY RUN] {len(plan.steps)} step(s) planned: "
                + ", ".join(s.tool_name for s in plan.steps)
            )
            await journal.finalize(status=AITaskStatus.COMPLETED, summary=dry_summary)
            return self._build_response(journal, status="completed")

        try:
            return await self._drain_run_loop(
                self._run_loop(
                    journal, provider, request.task_hint, request.input_data,
                    skip_approval_gate=request.confirmed,
                )
            )
        except ToolLimitExceededError as e:
            await journal.finalize(
                status=AITaskStatus.FAILED,
                summary=f"🤔 {e.message} Try asking for this in smaller batches.",
                error_message=e.message,
            )
            return self._build_response(journal, status="failed", error=e.message)

    async def _drain_run_loop(self, gen: AsyncGenerator[EngineEvent, None]) -> AITaskRunResponse:
        """Consumes a `_run_loop` generator to completion and returns its terminal response.
        Used by every non-streaming caller (`_execute_task`, `_resume_execution`); the chat
        path (`AIChatService.stream_message`) iterates `_run_loop` itself instead, to turn
        each event into an SSE line. `ToolLimitExceededError` propagates to the caller."""
        last_event: EngineEvent | None = None
        async for event in gen:
            last_event = event
        if last_event is None or last_event.response is None:
            # Defensive only -- `_run_loop` always yields a terminal event with `.response`
            # set before returning; reaching this would mean that contract was broken.
            raise AIEngineError("AI engine loop ended without a terminal response.")
        return last_event.response

    async def _run_loop(
        self,
        journal: TaskJournal,
        provider: Any,
        task_hint: str,
        input_data: dict,
        *,
        history: list[dict] | None = None,
        context_snapshot: dict | None = None,
        allowed_categories: list[str] | None = None,
        system_prompt_override: str | None = None,
        skip_approval_gate: bool = False,
        resume: bool = False,
    ) -> AsyncGenerator[EngineEvent, None]:
        """
        The engine's single execution core: plan -> execute a turn's steps -> (if the plan
        isn't empty) re-plan with results so far -> repeat, until a turn returns no more
        steps (done), a destructive/high-impact step needs approval (pause), the tool-call
        or planning-turn budget is hit, or something fails outright.

        Yields one `EngineEvent` per meaningful thing that happens; the terminal event
        (`awaiting_approval` | `done` | `failed` | `turn_limit_reached`) carries the finished
        `AITaskRunResponse` in `.response`.
        """
        planner = Planner(provider=provider, registry=self._registry, db=self._db)
        execution_results: list[tuple[ToolCallRequest, ToolResult]] = []
        turn_start = 1
        final_plan: ToolCallPlan | None = None

        if resume:
            pending = next((s for s in journal._steps if s.status == "pending_approval"), None)
            if pending is None:
                await journal.finalize(
                    status=AITaskStatus.FAILED,
                    summary="⚠️ No paused step found to resume.",
                    error_message="Resume called on a task with no pending_approval step.",
                )
                yield EngineEvent(
                    type=EngineEventType.FAILED, turn=1,
                    response=self._build_response(journal, status="failed", error="No paused step found."),
                )
                return

            turn = pending.turn
            turn_entry = journal.log.plan[turn - 1]
            plan = ToolCallPlan(
                task_name=journal.log.task_name,
                reasoning=turn_entry["reasoning"],
                response_to_user=turn_entry.get("response_to_user"),
                steps=[ToolCallRequest(**s) for s in turn_entry["steps"]],
                estimated_record_impact=turn_entry.get("estimated_record_impact", 0),
            )
            remaining_steps = plan.steps[pending.step_number - turn_entry["step_offset"]:]

            # Earlier turns'/steps' results already happened and are persisted -- reconstruct
            # them into execution_results so the eventual Synthesizer call (and any further
            # re-planning this generator call does) sees the full picture, not just what runs
            # from this point on.
            for s in journal._steps:
                if s.status in ("success", "failed"):
                    execution_results.append((
                        ToolCallRequest(tool_name=s.tool_name, parameters=s.parameters, reasoning=s.reasoning),
                        ToolResult(
                            success=(s.status == "success"),
                            message=s.result_message or "",
                            data=s.result_data or {},
                            records_affected=s.records_affected,
                            error=s.error,
                        ),
                    ))

            await journal.mark_running()
            async for ev in self._run_turn(
                journal, remaining_steps, turn, plan.estimated_record_impact, execution_results,
                skip_approval_gate=True, force_run_first=True,
            ):
                yield ev
                if ev.type in (EngineEventType.AWAITING_APPROVAL, EngineEventType.FAILED):
                    return
            final_plan = plan
            turn_start = turn + 1
        else:
            await journal.mark_planning()

        turn = turn_start
        while turn <= settings.AI_MAX_PLANNING_TURNS:
            yield EngineEvent(type=EngineEventType.PLANNING, turn=turn)
            try:
                plan = await planner.plan(
                    task_hint=task_hint,
                    input_data=input_data,
                    history=history,
                    context_snapshot=context_snapshot,
                    allowed_categories=allowed_categories,
                    system_prompt_override=system_prompt_override,
                    prior_results=journal.get_step_results() if turn > 1 else None,
                )
            except NoPlanGeneratedError:
                await journal.finalize(
                    status=AITaskStatus.FAILED,
                    summary="🤔 The AI could not determine a plan for this task.",
                    error_message="No tool calls were generated.",
                )
                yield EngineEvent(
                    type=EngineEventType.FAILED, turn=turn,
                    response=self._build_response(journal, status="failed", error="No plan generated."),
                )
                return
            except LLMResponseParseError as e:
                await journal.finalize(
                    status=AITaskStatus.FAILED,
                    summary="🤔 IRIS's plan came back malformed -- this can happen when a request "
                            "needs a lot of steps at once. Try a more specific or smaller request.",
                    error_message=e.message,
                )
                yield EngineEvent(
                    type=EngineEventType.FAILED, turn=turn,
                    response=self._build_response(journal, status="failed", error=e.message),
                )
                return
            except PlanningError as e:
                await journal.finalize(status=AITaskStatus.FAILED, summary=f"🤔 {e.message}", error_message=e.message)
                yield EngineEvent(
                    type=EngineEventType.FAILED, turn=turn,
                    response=self._build_response(journal, status="failed", error=e.message),
                )
                return
            except LLMProviderError as e:
                await journal.finalize(
                    status=AITaskStatus.FAILED,
                    summary=f"❌ LLM provider error: {e.message}",
                    error_message=e.message,
                )
                yield EngineEvent(
                    type=EngineEventType.FAILED, turn=turn,
                    response=self._build_response(journal, status="failed", error=e.message),
                )
                return

            step_offset = len(journal.get_step_results()) + 1
            await journal.record_plan(plan, turn=turn, step_offset=step_offset)
            final_plan = plan

            if not plan.steps:
                break  # The planner has nothing further to do -- genuinely done.

            await journal.mark_running()
            paused_or_failed = False
            async for ev in self._run_turn(
                journal, plan.steps, turn, plan.estimated_record_impact, execution_results,
                skip_approval_gate=skip_approval_gate,
            ):
                yield ev
                if ev.type in (EngineEventType.AWAITING_APPROVAL, EngineEventType.FAILED):
                    paused_or_failed = True
            if paused_or_failed:
                return

            turn += 1
        else:
            # Exhausted AI_MAX_PLANNING_TURNS without a turn ever returning `steps: []`.
            summary = self._synthesizer.synthesize_tool_results(results=execution_results, planned_response=None)
            summary += f"\n\n_Stopped after reaching the maximum of {settings.AI_MAX_PLANNING_TURNS} planning turns._"
            await journal.finalize(status=AITaskStatus.PARTIALLY_COMPLETED, summary=summary)
            yield EngineEvent(
                type=EngineEventType.TURN_LIMIT_REACHED, turn=turn,
                response=self._build_response(journal, status="partially_completed"),
            )
            return

        # Reaching here means a turn returned `steps: []` -- the task is genuinely done.
        # Credit efficiency: the planning call(s) already succeeded and were charged (real
        # tokens, real provider cost) by the time we know whether execution delivered
        # anything. If every single planned step across every turn failed, the user got no
        # real value from this run at all -- refund that charge rather than silently let a
        # fully-failed run cost credits. A partial success (some steps worked) still
        # delivered real value, so only a complete wipeout qualifies.
        refunded = False
        if journal.log.tools_called > 0 and journal.log.tools_succeeded == 0:
            refund_fn = getattr(provider, "refund_last_charge", None)
            if callable(refund_fn):
                refunded = await refund_fn()

        synthesis = self._synthesizer.synthesize_tool_results(
            results=execution_results,
            planned_response=final_plan.response_to_user if final_plan else None,
        )
        if refunded:
            synthesis += "\n\n_No credits were charged for this — nothing it tried to do succeeded._"

        final_status = AITaskStatus.COMPLETED if journal.log.tools_failed == 0 else AITaskStatus.PARTIALLY_COMPLETED
        await journal.finalize(status=final_status, summary=synthesis)
        yield EngineEvent(
            type=EngineEventType.DONE, turn=turn,
            response=self._build_response(journal, status=final_status.value),
        )

    async def _run_turn(
        self,
        journal: TaskJournal,
        steps: list[ToolCallRequest],
        turn: int,
        estimated_record_impact: int,
        execution_results: list[tuple[ToolCallRequest, ToolResult]],
        skip_approval_gate: bool = False,
        force_run_first: bool = False,
    ) -> AsyncGenerator[EngineEvent, None]:
        """
        Executes one planning turn's steps in order. Applies both approval gates unless
        `skip_approval_gate` is set: a plan-level record-impact gate (checked once, only at
        the turn's first step) and a per-tool DESTRUCTIVE risk-tier gate (checked per step).
        `force_run_first=True` means the turn's first step was already approved by a human on
        a prior resume -- it always runs unconditionally; later steps in the same turn are
        still gated normally (a second destructive step can still pause the turn again).
        """
        for i, step in enumerate(steps):
            step_number = len(journal.get_step_results()) + 1
            if step_number > settings.AI_MAX_TOOL_CALLS_PER_RUN:
                raise ToolLimitExceededError(settings.AI_MAX_TOOL_CALLS_PER_RUN)

            # Written as pending_approval *before* either gate is checked -- this is what
            # makes a paused step always identifiable later (the resume bootstrap finds the
            # one step still in this status), regardless of which gate paused it.
            await journal.record_step_start(
                step_number=step_number, tool_name=step.tool_name, parameters=step.parameters,
                reasoning=step.reasoning, turn=turn,
            )
            yield EngineEvent(type=EngineEventType.STEP_START, turn=turn, step_number=step_number, tool_name=step.tool_name)

            try:
                tool = self._registry.get(step.tool_name)
            except AIEngineError as e:
                result = ToolResult(success=False, message=e.message, error=e.message)
                await journal.record_step_result(step_number, result)
                execution_results.append((step, result))
                yield EngineEvent(type=EngineEventType.STEP_RESULT, turn=turn, step_number=step_number, tool_name=step.tool_name, result=result)
                continue

            already_approved = force_run_first and i == 0
            if not already_approved and not skip_approval_gate:
                if i == 0 and estimated_record_impact > settings.AI_APPROVAL_RECORD_THRESHOLD:
                    await journal.mark_awaiting_approval(
                        reason=f"Plan estimated to affect {estimated_record_impact} records "
                               f"(threshold {settings.AI_APPROVAL_RECORD_THRESHOLD})",
                        pending_tool=step.tool_name,
                    )
                    yield EngineEvent(
                        type=EngineEventType.AWAITING_APPROVAL, turn=turn, step_number=step_number, tool_name=step.tool_name,
                        response=self._build_response(journal, status="awaiting_approval"),
                    )
                    return
                if tool.definition.risk_tier == ToolRiskTier.DESTRUCTIVE:
                    await journal.mark_awaiting_approval(
                        reason="Destructive action requires approval",
                        pending_tool=step.tool_name,
                    )
                    yield EngineEvent(
                        type=EngineEventType.AWAITING_APPROVAL, turn=turn, step_number=step_number, tool_name=step.tool_name,
                        response=self._build_response(journal, status="awaiting_approval"),
                    )
                    return

            validation_errors = tool.validate_params(step.parameters)
            if validation_errors:
                error_msg = "; ".join(validation_errors)
                result = ToolResult(success=False, message=f"Validation failed: {error_msg}", error=error_msg)
                await journal.record_step_result(step_number, result)
                execution_results.append((step, result))
                yield EngineEvent(type=EngineEventType.STEP_RESULT, turn=turn, step_number=step_number, tool_name=step.tool_name, result=result)
                continue

            try:
                result = await tool.execute(params=step.parameters, db=self._db, user=self._user)
            except Exception as e:
                logger.exception(f"Tool '{step.tool_name}' failed at step {step_number}")
                result = ToolResult(success=False, message=f"Tool crashed: {type(e).__name__}", error=str(e))

            await journal.record_step_result(step_number, result)
            execution_results.append((step, result))
            yield EngineEvent(type=EngineEventType.STEP_RESULT, turn=turn, step_number=step_number, tool_name=step.tool_name, result=result)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_response(
        self,
        journal: TaskJournal,
        status: str,
        error: str | None = None,
    ) -> AITaskRunResponse:
        log = journal.log
        steps_planned = sum(len(turn_entry.get("steps", [])) for turn_entry in log.plan) if log.plan else 0
        return AITaskRunResponse(
            task_id=log.public_id,
            task_db_id=log.id,
            status=status,
            task_name=log.task_name,
            steps_planned=steps_planned,
            steps_completed=log.tools_succeeded,
            steps_failed=log.tools_failed,
            records_affected=log.records_affected,
            requires_approval=log.requires_approval,
            summary=log.summary,
            duration_ms=log.duration_ms,
            error=error or log.error_message,
        )
