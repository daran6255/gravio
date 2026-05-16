"""
AI Engine — API Response Schemas
================================
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from app.ai.brain.schemas import ToolStepLog


class AITaskRunResponse(BaseModel):
    """Response from POST /api/v1/ai/run"""
    task_id: str | uuid.UUID
    task_db_id: int | None = None  # Internal ID for linking
    status: str
    task_name: str
    steps_planned: int
    steps_completed: int
    steps_failed: int
    records_affected: int
    requires_approval: bool
    summary: str | None = None
    duration_ms: int | None = None
    error: str | None = None


class AITaskLogRead(BaseModel):
    """Full task journal read model for the API response."""
    id: int
    public_id: uuid.UUID
    task_name: str
    trigger: str
    status: str
    ai_provider: str | None
    ai_model: str | None
    raw_input: dict | None
    plan: list | None
    plan_reasoning: str | None
    steps: list[ToolStepLog] | None
    tools_called: int
    tools_succeeded: int
    tools_failed: int
    records_affected: int
    requires_approval: bool
    summary: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    duration_ms: int | None
    llm_tokens_used: int | None
    llm_cost_usd: float | None
    created_at: datetime

    class Config:
        from_attributes = True


class AITaskLogListItem(BaseModel):
    """Compact summary for task list views."""
    id: int
    public_id: uuid.UUID
    task_name: str
    trigger: str
    status: str
    tools_called: int
    records_affected: int
    requires_approval: bool
    summary: str | None
    duration_ms: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class JobRoleExtractionResponse(BaseModel):
    """Result of JD extraction."""
    data: dict
    suggestions: dict
    raw_content: str | None = None


class CandidateExtractionResponse(BaseModel):
    """Result of Candidate/Resume extraction."""
    data: dict
    raw_content: str | None = None
