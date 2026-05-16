"""
AI Engine — Exception Hierarchy
================================

All AI-specific exceptions with structured error codes and context.
These allow callers to safely handle failures and populate the TaskJournal.
"""

from typing import Any


class AIEngineError(Exception):
    """Base exception for all AI engine errors."""

    def __init__(self, message: str, code: str = "AI_ENGINE_ERROR", context: dict | None = None):
        self.message = message
        self.code = code
        self.context = context or {}
        super().__init__(message)

    def to_dict(self) -> dict[str, Any]:
        return {"code": self.code, "message": self.message, "context": self.context}


# ── Provider Errors ───────────────────────────────────────────────────────────

class LLMProviderError(AIEngineError):
    """Raised when the LLM provider call fails (network, quota, auth)."""
    def __init__(self, message: str, provider: str, context: dict | None = None):
        super().__init__(message, code="LLM_PROVIDER_ERROR", context={"provider": provider, **(context or {})})


class LLMRateLimitError(LLMProviderError):
    """Raised on 429 / quota-exceeded responses from the LLM provider."""
    def __init__(self, provider: str, retry_after: int | None = None):
        super().__init__(
            f"Rate limit exceeded on {provider}. Retry after {retry_after}s." if retry_after else f"Rate limit exceeded on {provider}.",
            provider=provider,
            context={"retry_after": retry_after},
        )
        self.code = "LLM_RATE_LIMIT"


class LLMAuthError(LLMProviderError):
    """Raised when the API key is invalid or missing."""
    def __init__(self, provider: str):
        super().__init__(f"Authentication failed for LLM provider: {provider}.", provider=provider)
        self.code = "LLM_AUTH_ERROR"


class LLMResponseParseError(AIEngineError):
    """Raised when the LLM returns a response that cannot be parsed as a valid ToolCallPlan."""
    def __init__(self, raw_response: str):
        super().__init__(
            "Could not parse LLM response as a valid tool plan.",
            code="LLM_PARSE_ERROR",
            context={"raw_response": raw_response[:500]},
        )


# ── Planning Errors ───────────────────────────────────────────────────────────

class PlanningError(AIEngineError):
    """Raised when the planner cannot generate a valid execution plan."""
    def __init__(self, message: str, context: dict | None = None):
        super().__init__(message, code="PLANNING_ERROR", context=context)


class NoPlanGeneratedError(PlanningError):
    """LLM returned an empty or no-op plan."""
    def __init__(self):
        super().__init__("The AI planner did not generate any tool calls for this task.")
        self.code = "NO_PLAN_GENERATED"


# ── Tool Errors ───────────────────────────────────────────────────────────────

class ToolNotFoundError(AIEngineError):
    """Raised when the planner requests a tool that is not registered."""
    def __init__(self, tool_name: str):
        super().__init__(
            f"Tool '{tool_name}' is not registered in the ToolRegistry.",
            code="TOOL_NOT_FOUND",
            context={"tool_name": tool_name},
        )


class ToolInputValidationError(AIEngineError):
    """Raised when the LLM provides invalid parameters for a tool call."""
    def __init__(self, tool_name: str, validation_errors: list):
        super().__init__(
            f"Invalid parameters provided for tool '{tool_name}'.",
            code="TOOL_INPUT_INVALID",
            context={"tool_name": tool_name, "errors": validation_errors},
        )


class ToolExecutionError(AIEngineError):
    """Raised when a registered tool raises an unexpected exception during execution."""
    def __init__(self, tool_name: str, original_error: Exception):
        super().__init__(
            f"Tool '{tool_name}' failed during execution: {str(original_error)}",
            code="TOOL_EXEC_ERROR",
            context={"tool_name": tool_name, "original_error": str(original_error)},
        )
        self.original_error = original_error


class ToolLimitExceededError(AIEngineError):
    """Raised when the number of tool calls exceeds the configured safety limit."""
    def __init__(self, limit: int):
        super().__init__(
            f"AI task exceeded the maximum allowed tool calls per run ({limit}).",
            code="TOOL_LIMIT_EXCEEDED",
            context={"limit": limit},
        )


# ── Approval Errors ───────────────────────────────────────────────────────────

class ApprovalRequiredError(AIEngineError):
    """
    Not a real error — raised to PAUSE execution when an action requires human approval.
    The engine catches this and sets the task status to AWAITING_APPROVAL.
    """
    def __init__(self, reason: str, pending_tool: str, record_count: int):
        super().__init__(
            f"Human approval required before executing '{pending_tool}': {reason}",
            code="APPROVAL_REQUIRED",
            context={"reason": reason, "pending_tool": pending_tool, "record_count": record_count},
        )


# ── Context Errors ────────────────────────────────────────────────────────────

class ContextLoadError(AIEngineError):
    """Raised when the context loader fails to fetch prerequisite DB data."""
    def __init__(self, message: str, context: dict | None = None):
        super().__init__(message, code="CONTEXT_LOAD_ERROR", context=context)


# ── Task Errors ───────────────────────────────────────────────────────────────

class TaskTimeoutError(AIEngineError):
    """Raised when a task execution exceeds the configured timeout."""
    def __init__(self, timeout_seconds: int):
        super().__init__(
            f"AI task timed out after {timeout_seconds} seconds.",
            code="TASK_TIMEOUT",
            context={"timeout_seconds": timeout_seconds},
        )


class TaskNotFoundError(AIEngineError):
    """Raised when a task_id doesn't exist in the journal."""
    def __init__(self, task_id: str):
        super().__init__(
            f"AI task '{task_id}' not found.",
            code="TASK_NOT_FOUND",
            context={"task_id": task_id},
        )
