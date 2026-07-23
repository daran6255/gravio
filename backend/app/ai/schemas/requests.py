"""
AI Engine — API Request Schemas
===============================
"""

from typing import Any
from pydantic import BaseModel, Field


class AITaskRunRequest(BaseModel):
    """
    Request body for POST /api/v1/ai/run
    Supports both manual and webhook-triggered task runs.
    """
    trigger_type: str = Field(
        ...,
        description="Type of trigger: manual | webhook | schedule | api",
        examples=["manual", "webhook"]
    )
    task_hint: str = Field(
        ...,
        description="Short description/intent of what should happen",
        examples=["Process WhatsApp enquiry from Raj Kumar", "Create job role from uploaded JD"]
    )
    input_data: dict[str, Any] = Field(
        default_factory=dict,
        description="Structured input payload for the task (e.g., parsed WhatsApp message)"
    )
    context_keys: list[str] = Field(
        default_factory=list,
        description="Hints for which context to pre-load (e.g., ['contact', 'open_deals'])"
    )
    dry_run: bool = Field(
        default=False,
        description="If True, plan is produced but no tools are actually executed"
    )
    confirmed: bool = Field(
        default=False,
        description=(
            "Set by callers that already ran their own propose-then-confirm UX for this exact "
            "request (e.g. IrisTaskPanel's preview-then-run flow) -- skips the engine's own "
            "approval gate for this run. Leave False for any entry point where the user hasn't "
            "already seen and accepted the plan (general chat, direct API calls)."
        ),
    )


class AITaskApprovalRequest(BaseModel):
    """Request body for POST /ai/tasks/{public_id}/approve and .../reject."""
    reason: str | None = Field(default=None, description="Optional note on why this was approved/rejected")


class JobRoleExtractionRequest(BaseModel):
    """Request for extracting job role from JD text or PDF."""
    jd_text: str | None = None
    # PDF is usually handled via multi-part form data in the endpoint
