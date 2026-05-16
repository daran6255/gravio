"""
AI Engine — REST API Endpoints
================================

Endpoints:
  POST  /api/v1/ai/run         → Trigger a task run
  GET   /api/v1/ai/tasks        → List task journal (paginated)
  GET   /api/v1/ai/tasks/{id}   → Full task journal detail
  GET   /api/v1/ai/tools        → List all registered tools (admin)
  POST  /api/v1/ai/tasks/{id}/approve → Approve a paused task

Access:
  - POST /ai/run    → requires MANAGER or ADMIN role
  - GET  /ai/tasks  → requires MANAGER or ADMIN role
  - GET  /ai/tools  → requires ADMIN role
"""

from __future__ import annotations

from typing import Annotated, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.ai.brain.engine import AIEngine
from app.ai.brain.journal import TaskJournal, get_task_log_by_public_id, list_task_logs
from app.ai.mcp.registry import registry
from app.ai.schemas import (
    AITaskRunRequest,
    AITaskRunResponse,
    AITaskLogRead,
    AITaskLogListItem,
    JobRoleExtractionResponse,
    CandidateExtractionResponse,
    ToolDefinition,
)
from app.ai.services.extraction_service import (
    JobRoleExtractionService, 
    CandidateExtractionService,
    SkillRecommendationService
)
from app.core.config import settings
from app.models.ai_task_log import AITaskStatus
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/run — Trigger a task
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/run",
    response_model=AITaskRunResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger an AI task run",
    description=(
        "Run an agentic AI task. The engine will plan a sequence of tool calls, "
        "execute them against the CRM database, and return a structured result with "
        "a task journal ID for tracking. Supports dry_run mode for testing."
    ),
)
async def run_task(
    request: AITaskRunRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> AITaskRunResponse:
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI Engine is currently disabled. Set AI_ENABLED=true in configuration.",
        )

    engine = AIEngine(db=db, user=current_user)
    result = await engine.run(request)

    logger.info(
        "AI task run completed: task_id=%s, status=%s, user=%d",
        result.task_id, result.status, current_user.id
    )
    return result


# ─────────────────────────────────────────────────────────────────────────────
# GET /ai/tasks — List task journal
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/tasks",
    response_model=dict,
    summary="List AI task journal",
    description="Paginated list of all AI task runs with status and summary.",
)
async def list_tasks(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    status_filter: Annotated[str | None, Query(description="Filter by status")] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> dict:
    items, total = await list_task_logs(
        db=db, page=page, page_size=page_size, status_filter=status_filter
    )
    return {
        "items": [
            AITaskLogListItem.model_validate(item).model_dump()
            for item in items
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /ai/tasks/{task_id} — Full task journal detail
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/tasks/{task_id}",
    response_model=AITaskLogRead,
    summary="Get full task journal",
    description="Retrieve the complete journal for a specific AI task run, including all steps.",
)
async def get_task(
    task_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> AITaskLogRead:
    log = await get_task_log_by_public_id(db, task_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task '{task_id}' not found.",
        )
    return AITaskLogRead.model_validate(log)


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/tasks/{task_id}/approve — Approve a paused task
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/tasks/{task_id}/approve",
    summary="Approve a paused AI task",
    description="Resume an AI task that is waiting for human approval.",
    status_code=status.HTTP_202_ACCEPTED,
)
async def approve_task(
    task_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> dict:
    from datetime import datetime, timezone
    log = await get_task_log_by_public_id(db, task_id)
    if not log:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

    if log.status != AITaskStatus.AWAITING_APPROVAL:
        raise HTTPException(
            status_code=400,
            detail=f"Task is not awaiting approval. Current status: {log.status}",
        )

    log.approved_by_user_id = current_user.id
    log.approved_at = datetime.now(timezone.utc)
    log.status = AITaskStatus.PENDING  # Reset to PENDING so it can be re-triggered
    await db.commit()

    logger.info("Task %s approved by user %d", task_id, current_user.id)
    return {
        "message": f"Task '{task_id}' approved. Re-trigger via POST /ai/run to resume.",
        "approved_by": current_user.username,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /ai/tools — Admin: List all registered tools
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/tools",
    response_model=list[ToolDefinition],
    summary="List all registered AI tools",
    description="Admin endpoint — returns full definitions of all tools available to the AI engine.",
)
async def list_tools(
    category: Annotated[str | None, Query(description="Filter by category")] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> list[ToolDefinition]:
    tools = registry.by_category(category) if category else registry.all()
    return [t.definition for t in tools]


# ─────────────────────────────────────────────────────────────────────────────
# GET /ai/health — Engine health check
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/health",
    summary="AI Engine health check",
    description="Returns engine status, all provider configurations, and registered tool count.",
)
async def ai_health(
    current_user: User = Depends(deps.get_current_active_user),
) -> dict:
    from app.ai.providers import get_provider_info, SUPPORTED_PROVIDERS

    return {
        "enabled": settings.AI_ENABLED,
        "active_provider": settings.AI_PROVIDER,
        "registered_tools": registry.count(),
        "tool_categories": sorted({t.definition.category for t in registry.all()}),
        "max_tool_calls_per_run": settings.AI_MAX_TOOL_CALLS_PER_RUN,
        "task_timeout_seconds": settings.AI_TASK_TIMEOUT_SECONDS,
        "supported_providers": SUPPORTED_PROVIDERS,
        "providers": get_provider_info(),
    }
# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/extract/job-role — Parse JD text
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/extract/job-role",
    response_model=JobRoleExtractionResponse,
    summary="Extract Job Role details from JD text",
    description=(
        "Uses the AI Engine to parse unstructured job description text into "
        "structured Job Role fields. Also attempts to find matching companies "
        "and contacts in the CRM."
    ),
)
async def extract_job_role(
    jd_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> JobRoleExtractionResponse:
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Engine is disabled.",
        )

    extractor = JobRoleExtractionService(db, current_user)
    try:
        file_bytes = None
        if file:
            file_bytes = await file.read()
            
        result = await extractor.extract_from_source(jd_text=jd_text, pdf_file=file_bytes)
        return JobRoleExtractionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("JD extraction failed")
        raise HTTPException(status_code=500, detail="AI extraction failed unexpectedly.")


# ─────────────────────────────────────────────────────────────────────────────
# POST /ai/extract/candidate — Parse Resume
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/extract/candidate",
    response_model=CandidateExtractionResponse,
    summary="Extract Candidate details from Resume",
    description=(
        "Uses the AI Engine to parse unstructured resume text or PDF into "
        "structured Candidate fields, including skills and training history."
    ),
)
async def extract_candidate(
    resume_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    document_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> CandidateExtractionResponse:
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI Engine is disabled.",
        )

    extractor = CandidateExtractionService(db, current_user)
    try:
        file_bytes = None
        if file:
            file_bytes = await file.read()
            
        result = await extractor.extract_from_source(
            resume_text=resume_text, 
            pdf_file=file_bytes,
            document_id=document_id
        )
        return CandidateExtractionResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Candidate extraction failed")
        raise HTTPException(status_code=500, detail="AI extraction failed unexpectedly.")


# ─────────────────────────────────────────────────────────────────────────────
# GET /ai/recommendations/skills — Smart Tagging
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/recommendations/skills",
    response_model=list[str],
    summary="Get skill recommendations (Smart Tagging)",
    description=(
        "Compares current candidate skills with high-demand skills from "
        "active Job Roles to identify gaps and suggest valuable tags."
    ),
)
async def get_skill_recommendations(
    skills: list[str] = Query([]),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> list[str]:
    service = SkillRecommendationService(db, current_user)
    try:
        return await service.get_recommendations(skills)
    except Exception as e:
        logger.exception("Skill recommendation failed")
        raise HTTPException(status_code=500, detail="Failed to generate skill recommendations.")
