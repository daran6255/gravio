"""
AI Engine — Task Journal
=========================

Responsible for writing structured execution logs to the database
during an AI task run. Think of it as the AI's "notepad" that
records every step in a format humans can audit later.

The journal follows the same pattern as the task.md convention:
  [ ] planned
  [/] running
  [x] completed
  [!] failed
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from sqlalchemy import select

from app.ai.models.ai_task_log import AITaskLog, AITaskStatus, AITaskTrigger
from app.ai.brain.schemas import ToolCallPlan, ToolStepLog, ToolResult

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User

logger = logging.getLogger(__name__)


class TaskJournal:
    """
    Manages all DB writes for a single AI task run.

    Lifecycle:
        journal = await TaskJournal.create(db, ...)   # Creates the DB row
        await journal.record_plan(plan)               # Saves the planned steps
        await journal.record_step_start(step_num, ...) # Mark a step as running
        await journal.record_step_result(step_num, result) # Save tool output
        await journal.finalize(status, summary)       # Mark task done/failed
    """

    def __init__(self, log: AITaskLog, db: "AsyncSession"):
        self._log = log
        self._db = db
        self._steps: list[ToolStepLog] = []
        self._wall_start = time.monotonic()

    # ── Factory ───────────────────────────────────────────────────────────────

    @classmethod
    async def create(
        cls,
        db: "AsyncSession",
        task_name: str,
        trigger: AITaskTrigger,
        raw_input: dict[str, Any],
        ai_provider: str,
        ai_model: str,
        triggered_by_user_id: int | None = None,
        chat_session_id: int | None = None,
    ) -> "TaskJournal":
        """Create a new task journal entry and persist it immediately."""
        log = AITaskLog(
            task_name=task_name,
            trigger=trigger,
            status=AITaskStatus.PENDING,
            raw_input=raw_input,
            ai_provider=ai_provider,
            ai_model=ai_model,
            triggered_by_user_id=triggered_by_user_id,
            chat_session_id=chat_session_id,
            steps=[],
            tools_called=0,
            tools_succeeded=0,
            tools_failed=0,
            records_affected=0,
            requires_approval=False,
        )
        db.add(log)
        await db.flush()  # Get the ID without full commit
        logger.info("TaskJournal created: id=%d, task='%s'", log.id, task_name)
        return cls(log=log, db=db)

    @classmethod
    def load(cls, db: "AsyncSession", log: AITaskLog) -> "TaskJournal":
        """Wrap an *existing* AITaskLog row (e.g. one paused at AWAITING_APPROVAL) so execution
        can resume against it. Unlike `create()`, this reconstructs `_steps` from `log.steps`
        instead of starting empty -- required so the resumed run can find the one step left in
        `pending_approval` status and continue the journal (not overwrite it)."""
        journal = cls(log=log, db=db)
        journal._steps = [ToolStepLog(**step) for step in (log.steps or [])]
        return journal

    # ── Status Updates ────────────────────────────────────────────────────────

    async def mark_planning(self) -> None:
        """Move to PLANNING state when the LLM prompt is sent."""
        self._log.status = AITaskStatus.PLANNING
        self._log.started_at = datetime.now(timezone.utc)
        await self._flush()
        logger.debug("[Task %d] → PLANNING", self._log.id)

    async def mark_running(self) -> None:
        """Move to RUNNING state when the first tool call starts."""
        self._log.status = AITaskStatus.RUNNING
        await self._flush()
        logger.debug("[Task %d] → RUNNING", self._log.id)

    async def mark_awaiting_approval(self, reason: str, pending_tool: str) -> None:
        """Pause the task pending human approval."""
        self._log.status = AITaskStatus.AWAITING_APPROVAL
        self._log.requires_approval = True
        self._log.summary = f"⏸️ Awaiting approval: {reason} (blocked on: {pending_tool})"
        await self._flush()
        logger.info("[Task %d] → AWAITING_APPROVAL: %s", self._log.id, reason)

    async def reject(self, rejected_by: "User", reason: str | None = None) -> None:
        """A human declined a paused task -- cancel it without touching approved_by_user_id/
        approved_at (those specifically mean "approved", not "decided")."""
        self._log.status = AITaskStatus.CANCELLED
        self._log.summary = (
            f"🚫 Rejected by {rejected_by.full_name}" + (f": {reason}" if reason else ".")
        )
        self._log.completed_at = datetime.now(timezone.utc)
        self._log.duration_ms = int((time.monotonic() - self._wall_start) * 1000)
        await self._db.commit()
        logger.info("[Task %d] → CANCELLED (rejected by user %d)", self._log.id, rejected_by.id)

    # ── Plan Recording ────────────────────────────────────────────────────────

    async def record_plan(
        self,
        plan: ToolCallPlan,
        turn: int = 1,
        step_offset: int = 1,
        context_snapshot: dict | None = None,
    ) -> None:
        """Append one planning turn's output to the journal.

        Additive rather than overwriting: a multi-turn task calls this once per re-planning
        pass, and the full per-turn history has to survive in `plan` for the journal to stay
        an honest audit trail (not just "whatever the last turn decided"). `plan_reasoning`
        is kept as a simple "latest turn" convenience field only -- the structural record
        lives in `plan`, and each executed step's own `turn` (ToolStepLog.turn) ties it back
        to the turn that planned it.
        """
        turn_entry = {
            "turn": turn,
            "reasoning": plan.reasoning,
            "response_to_user": plan.response_to_user,
            "estimated_record_impact": plan.estimated_record_impact,
            "step_offset": step_offset,
            "steps": [step.model_dump() for step in plan.steps],
        }
        # Reassign (not `.append()` in place) so the JSON column is recognized as dirty by
        # SQLAlchemy's change tracking.
        self._log.plan = [*(self._log.plan or []), turn_entry]
        self._log.plan_reasoning = plan.reasoning
        if context_snapshot is not None:
            self._log.context_snapshot = context_snapshot
        await self._flush()
        logger.info("[Task %d] Turn %d plan recorded: %d steps", self._log.id, turn, len(plan.steps))

    # ── Step Recording ────────────────────────────────────────────────────────

    async def record_step_start(
        self,
        step_number: int,
        tool_name: str,
        parameters: dict[str, Any],
        reasoning: str | None = None,
        turn: int = 1,
    ) -> None:
        """Called immediately before a tool's execute() is invoked.

        Written with status="pending_approval" *before* either approval gate is checked --
        this is deliberate, not a placeholder default: it's what makes a paused step always
        identifiable later (the resume bootstrap finds the one step still in this status),
        regardless of which gate (destructive tool tier, or plan-level record-impact
        threshold) is the one that actually paused it.
        """
        step = ToolStepLog(
            step_number=step_number,
            turn=turn,
            tool_name=tool_name,
            parameters=parameters,
            reasoning=reasoning,
            status="pending_approval",
            started_at=datetime.now(timezone.utc),
        )
        # Upsert into _steps by step_number
        self._upsert_step(step)
        await self._persist_steps()
        logger.debug("[Task %d] Step %d starting: %s", self._log.id, step_number, tool_name)

    async def record_step_result(
        self,
        step_number: int,
        result: ToolResult,
    ) -> None:
        """Called after a tool's execute() returns a ToolResult."""
        step = self._get_step(step_number)
        if step is None:
            logger.warning("[Task %d] Step %d not found to record result.", self._log.id, step_number)
            return

        step.status = "success" if result.success else "failed"
        step.result_data = result.data
        step.result_message = result.message
        step.records_affected = result.records_affected
        step.error = result.error
        step.completed_at = datetime.now(timezone.utc)

        if step.started_at:
            delta = (step.completed_at - step.started_at).total_seconds() * 1000
            step.duration_ms = int(delta)

        # Update aggregate counters
        self._log.tools_called += 1
        if result.success:
            self._log.tools_succeeded += 1
        else:
            self._log.tools_failed += 1
        self._log.records_affected += result.records_affected

        self._upsert_step(step)
        await self._persist_steps()
        logger.debug(
            "[Task %d] Step %d %s: %s (records=%d)",
            self._log.id, step_number, step.status, result.message, result.records_affected
        )

    async def record_step_skipped(self, step_number: int, tool_name: str, reason: str) -> None:
        """Mark a planned step as skipped (e.g., due to earlier failure)."""
        step = ToolStepLog(
            step_number=step_number,
            tool_name=tool_name,
            parameters={},
            status="skipped",
            result_message=reason,
        )
        self._upsert_step(step)
        await self._persist_steps()

    # ── Finalisation ──────────────────────────────────────────────────────────

    async def finalize(
        self,
        status: AITaskStatus,
        summary: str,
        error_message: str | None = None,
        llm_tokens_used: int | None = None,
        llm_cost_usd: float | None = None,
    ) -> None:
        """
        Mark the task as complete (success, partial, or failed).
        Calculates total wall-clock duration and persists final state.
        """
        self._log.status = status
        self._log.summary = summary
        self._log.error_message = error_message
        self._log.completed_at = datetime.now(timezone.utc)
        self._log.llm_tokens_used = llm_tokens_used
        self._log.llm_cost_usd = llm_cost_usd
        self._log.duration_ms = int((time.monotonic() - self._wall_start) * 1000)

        await self._persist_steps()
        await self._db.commit()
        logger.info(
            "[Task %d] FINALIZED — status=%s, tools=%d/%d, records=%d, duration=%dms",
            self._log.id,
            status.value,
            self._log.tools_succeeded,
            self._log.tools_called,
            self._log.records_affected,
            self._log.duration_ms,
        )

    # ── Context Token ─────────────────────────────────────────────────────────

    @property
    def task_id(self) -> int:
        return self._log.id

    @property
    def public_id(self):
        return self._log.public_id

    @property
    def log(self) -> AITaskLog:
        return self._log

    def get_step_results(self) -> list[dict]:
        """Return a list of all step results as dicts (for passing to next LLM call)."""
        return [s.model_dump() for s in self._steps]

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _flush(self) -> None:
        """Flush changes to the DB session without committing."""
        await self._db.flush()

    async def _persist_steps(self) -> None:
        """Serialize current _steps list to JSON and flush."""
        self._log.steps = [s.model_dump(mode="json") for s in self._steps]
        await self._flush()

    def _upsert_step(self, step: ToolStepLog) -> None:
        """Insert or replace a step in the internal steps list by step_number."""
        for i, existing in enumerate(self._steps):
            if existing.step_number == step.step_number:
                self._steps[i] = step
                return
        self._steps.append(step)
        self._steps.sort(key=lambda s: s.step_number)

    def _get_step(self, step_number: int) -> ToolStepLog | None:
        for step in self._steps:
            if step.step_number == step_number:
                return step
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Read Helpers (for API endpoints)
# ─────────────────────────────────────────────────────────────────────────────

async def get_task_log_by_public_id(
    db: "AsyncSession", public_id: str
) -> AITaskLog | None:
    result = await db.execute(
        select(AITaskLog).where(AITaskLog.public_id == public_id)
    )
    return result.scalar_one_or_none()


async def list_task_logs(
    db: "AsyncSession",
    organization_id: int,
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
) -> tuple[list[AITaskLog], int]:
    """Paginated task log list, scoped to one org, with an optional status filter."""
    from sqlalchemy import func

    query = select(AITaskLog).where(AITaskLog.organization_id == organization_id)
    count_query = select(func.count(AITaskLog.id)).where(AITaskLog.organization_id == organization_id)

    if status_filter:
        query = query.where(AITaskLog.status == status_filter)
        count_query = count_query.where(AITaskLog.status == status_filter)

    query = (
        query
        .order_by(AITaskLog.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items_result = await db.execute(query)
    count_result = await db.execute(count_query)

    return items_result.scalars().all(), count_result.scalar() or 0
