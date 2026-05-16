"""AI Chat models — persists multi-turn conversation history for the AI Coworker."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Literal

from sqlalchemy import String, Text, Integer, ForeignKey, Uuid, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.ai_task_log import AITaskLog


class AIChatSession(BaseModel):
    """
    Groups individual messages into a conversation context.
    Allows users to revisit past chats and pick up where they left off.
    """

    __tablename__ = "ai_chat_sessions"

    public_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        unique=True,
        index=True,
        nullable=False,
        default=uuid.uuid4,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="New AI Co-worker Chat",
        comment="Auto-generated or user-defined conversation title"
    )

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        default=True,
        nullable=False,
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    user: Mapped[User] = relationship("User", backref="chat_sessions")
    messages: Mapped[list[AIChatMessage]] = relationship(
        "AIChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="AIChatMessage.created_at",
    )

    def __repr__(self) -> str:
        return f"<AIChatSession(id={self.id}, title='{self.title}', user_id={self.user_id})>"


class AIChatMessage(BaseModel):
    """
    A single bubble in the chat conversation.
    Links assistant responses to Task Journals for full auditability.
    """

    __tablename__ = "ai_chat_messages"

    session_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    role: Mapped[Literal["user", "assistant", "system"]] = mapped_column(
        String(20),
        nullable=False,
        comment="OpenAI-compatible role: user | assistant | system"
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Raw text content of the message"
    )

    tokens: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Token count for this single message"
    )

    # ── Action Audit Linking ──────────────────────────────────────────────────
    task_log_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("ai_task_logs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="If this message triggered an agentic task (tool use), it's linked here."
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    session: Mapped[AIChatSession] = relationship("AIChatSession", back_populates="messages")
    task_log: Mapped[AITaskLog | None] = relationship("AITaskLog", foreign_keys=[task_log_id])

    def __repr__(self) -> str:
        return f"<AIChatMessage(id={self.id}, session_id={self.session_id}, role={self.role})>"
