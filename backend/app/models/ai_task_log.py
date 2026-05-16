"""AI Task Log model — persists every agentic task run as a structured journal."""

from __future__ import annotations

import uuid
import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, JSON, Integer, Float, ForeignKey, Enum, Uuid, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.ai_chat import AIChatSession


class AITaskStatus(str, enum.Enum):
    """Status of an AI task execution run."""
    PENDING = "pending"           # Created, not yet started
    PLANNING = "planning"         # LLM generating the plan
    RUNNING = "running"           # Tools being executed
    AWAITING_APPROVAL = "awaiting_approval"  # Paused — needs human approval
    COMPLETED = "completed"       # All tools ran successfully
    PARTIALLY_COMPLETED = "partially_completed"  # Some tools failed
    FAILED = "failed"             # Fatal error, no actions taken
    CANCELLED = "cancelled"       # Manually cancelled by user


class AITaskTrigger(str, enum.Enum):
    """What initiated this AI task."""
    MANUAL = "manual"             # User triggered via UI
    WEBHOOK = "webhook"           # Incoming webhook (e.g., WhatsApp)
    SCHEDULE = "schedule"         # Cron/scheduled job
    API = "api"                   # External API call
    SYSTEM = "system"             # Internal system event


class AITaskLog(BaseModel):
    """
    Persistent task journal for every AI engine run.

    Every time the AI engine executes a task, a row is created here.
    Think of it as the AI's co-worker notepad — readable, auditable,
    and reviewable by admins.
    """

    __tablename__ = "ai_task_logs"

    # ── Identity ──────────────────────────────────────────────────────────────
    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    # ── Task Metadata ─────────────────────────────────────────────────────────
    task_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Human-readable task name, e.g. 'Process WhatsApp Enquiry'"
    )

    trigger: Mapped[AITaskTrigger] = mapped_column(
        Enum(AITaskTrigger, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
        default=AITaskTrigger.MANUAL,
    )

    status: Mapped[AITaskStatus] = mapped_column(
        Enum(AITaskStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
        default=AITaskStatus.PENDING,
    )

    # ── Initiator ─────────────────────────────────────────────────────────────
    triggered_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="User who triggered this task (null for automated/webhook triggers)"
    )

    chat_session_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("ai_chat_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Chat session from which this task was spawned"
    )

    # ── AI Provider Info ──────────────────────────────────────────────────────
    ai_provider: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="LLM provider used: gemini, openai, ollama"
    )

    ai_model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Exact model name used, e.g. gemini-1.5-flash"
    )

    # ── Input & Plan ──────────────────────────────────────────────────────────
    raw_input: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="The original trigger input payload (e.g., WhatsApp message data)"
    )

    context_snapshot: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="DB context loaded before planning (e.g., existing contact record)"
    )

    plan: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Ordered list of tool calls the LLM planned to make"
    )

    plan_reasoning: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="LLM's chain-of-thought reasoning for this plan"
    )

    # ── Execution Journal ─────────────────────────────────────────────────────
    steps: Mapped[list | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Ordered list of ToolStepLog dicts capturing every tool call result"
    )

    tools_called: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Total number of tool calls made in this run"
    )

    tools_succeeded: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    tools_failed: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    records_affected: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Total DB records created/updated across all tool calls"
    )

    # ── Approval Gate ─────────────────────────────────────────────────────────
    requires_approval: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        comment="True if this task was paused pending human approval"
    )

    approved_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="User who approved this task (if approval was required)"
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ── Outcome ───────────────────────────────────────────────────────────────
    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="AI-generated human-readable summary of what was accomplished"
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Top-level error if the task failed entirely"
    )

    # ── Performance ───────────────────────────────────────────────────────────
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    duration_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Total wall-clock time in milliseconds"
    )

    llm_tokens_used: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    llm_cost_usd: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
        comment="Estimated LLM cost in USD for this task run"
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    triggered_by: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[triggered_by_user_id],
        lazy="selectin",
    )

    approved_by: Mapped[User | None] = relationship(
        "User",
        foreign_keys=[approved_by_user_id],
        lazy="selectin",
    )

    chat_session: Mapped[AIChatSession | None] = relationship(
        "AIChatSession",
        foreign_keys=[chat_session_id],
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<AITaskLog(id={self.id}, task='{self.task_name}', "
            f"status={self.status}, tools={self.tools_called})>"
        )
