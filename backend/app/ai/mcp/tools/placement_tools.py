"""
AI Engine — Placement Tools
==========================

Tools for job roles, candidate matching, and placement pipelines.
"""

from __future__ import annotations

import logging
from typing import Any, TYPE_CHECKING

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.repositories.job_role_repository import JobRoleRepository
from app.schemas.job_role import JobRoleCreate

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User

logger = logging.getLogger(__name__)


# ── Create Job Role ───────────────────────────────────────────────────────────

class CreateJobRoleTool(BaseTool):
    """
    Creates a new Job Role from parsed JD text.
    Associates skills and requirements automatically.
    """
    definition = ToolDefinition(
        name="create_job_role",
        description="Creates a new Job Role from parsed job description (JD) text.",
        category="placement",
        requires_approval=True,
        parameters={
            "title": ToolParameterSchema(type="string", description="Job title (e.g., 'React Developer')"),
            "description": ToolParameterSchema(type="string", description="Full job description"),
            "requirements": ToolParameterSchema(type="string", description="Key requirements/skills list"),
            "company_name": ToolParameterSchema(type="string", description="Name of the hiring company"),
            "location": ToolParameterSchema(type="string", description="Work location (Remote, Bangalore, etc.)"),
            "experience_range": ToolParameterSchema(type="string", description="Required yrs of exp (e.g., '2-4 years')")
        },
        required_parameters=["title", "description", "company_name"]
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            repo = JobRoleRepository(db)
            
            job_role = await repo.create_job_role(JobRoleCreate(
                title=params["title"],
                description=params["description"],
                requirements=params.get("requirements"),
                company_name=params["company_name"],
                location=params.get("location"),
                experience_range=params.get("experience_range"),
                status="active"
            ))

            return ToolResult(
                success=True,
                message=f"Job Role '{job_role.title}' created successfully for {job_role.company_name}.",
                data={"job_role_id": job_role.id, "public_id": str(job_role.public_id)},
                records_affected=1
            )

        except Exception as e:
            logger.exception("Error in create_job_role tool")
            return ToolResult(success=False, message=f"Failed to create job role: {str(e)}", error=str(e))


# ── Registration ─────────────────────────────────────────────────────────────

registry.register(CreateJobRoleTool())
