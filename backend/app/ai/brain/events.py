"""
AI Engine — Execution Events
=============================

The event stream `AIEngine._run_loop()` yields as it plans and executes a task.
One shared vocabulary drives three different consumers: `AIEngine._execute_task()`
(collapses the stream into a single `AITaskRunResponse`), `AIChatService.stream_message()`
(turns each event into an SSE line), and `AIEngine.resume()` (drains the same stream
re-entered mid-plan after a human approval decision).
"""

from __future__ import annotations

import enum
from typing import Any

from pydantic import BaseModel

from app.ai.brain.schemas import ToolResult
from app.ai.schemas.responses import AITaskRunResponse


class EngineEventType(str, enum.Enum):
    PLANNING = "planning"
    STEP_START = "step_start"
    STEP_RESULT = "step_result"
    AWAITING_APPROVAL = "awaiting_approval"
    TURN_LIMIT_REACHED = "turn_limit_reached"
    DONE = "done"
    FAILED = "failed"


class EngineEvent(BaseModel):
    """One unit of progress from the execution loop.

    `response` is populated only on terminal events (`awaiting_approval`, `done`,
    `failed`, `turn_limit_reached`) — it's the finished `AITaskRunResponse` a
    non-streaming caller can return directly.
    """
    type: EngineEventType
    turn: int
    step_number: int | None = None
    tool_name: str | None = None
    result: ToolResult | None = None
    response: AITaskRunResponse | None = None

    class Config:
        arbitrary_types_allowed = True
