"""HR tools — leave-pattern insight for approvers, employee document summarization.

Scoped deliberately narrow: only the two features grounded in entities that actually exist in
this HR module today (HRLeaveRequest, HREmployeeDocument). JD/candidate extraction
(JobRoleExtractionService / CandidateExtractionService) is intentionally NOT wired up here --
there is no candidate/ATS entity in this schema to save extracted data into (HR only has
HREmployeeProfile, which is post-hire), so wiring it up would mean inventing a new data model
first. That's flagged as a separate, bigger decision in the roadmap, not something to build
silently as a side effect of this pass.
"""

from __future__ import annotations

import os
from collections import defaultdict
from datetime import date, timedelta
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.ai.providers import get_llm_provider
from app.models.hr import HREmployeeDocument, HRLeaveRequest, LeaveStatus
from app.models.user import User, UserRole

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

ELEVATED_ROLES = {UserRole.ADMIN, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.HR_MANAGER}


async def _resolve_employee(db: "AsyncSession", organization_id: int, name: str) -> Optional[User]:
    result = await db.execute(
        select(User)
        .where(User.organization_id == organization_id, User.is_deleted.is_(False), User.full_name.ilike(f"%{name}%"))
        .limit(1)
    )
    return result.scalars().first()


class SummarizeLeavePatternsTool(BaseTool):
    """Aggregates approved leave over a period, flagging Friday/Monday-adjacent leave that can
    indicate a long-weekend pattern worth a manager's attention — without anyone having to
    scroll through the raw leave calendar by hand."""

    definition = ToolDefinition(
        name="summarize_leave_patterns",
        description=(
            "Summarizes approved employee leave over a period — total days taken and how often "
            "leave falls adjacent to a weekend (Friday/Monday). Defaults to the last 90 days. "
            "Managers/HR see their team or the whole org by default; everyone else only sees "
            "their own leave unless they name themselves."
        ),
        category="hr",
        is_read_only=True,
        requires_approval=False,
        parameters={
            "employee": ToolParameterSchema(type="string", description="Employee name to focus on. Omit for a team/org summary."),
            "days": ToolParameterSchema(type="integer", description="How many days back to look (default 90).", default=90),
        },
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        days = int(params.get("days") or 90)
        since = date.today() - timedelta(days=days)
        elevated = user.is_superuser or user.role in ELEVATED_ROLES

        conditions = [
            HRLeaveRequest.organization_id == user.organization_id,
            HRLeaveRequest.status == LeaveStatus.APPROVED,
            HRLeaveRequest.from_date >= since,
        ]

        if params.get("employee"):
            employee = await _resolve_employee(db, user.organization_id, str(params["employee"]))
            if employee is None:
                return ToolResult(success=False, message=f"No employee matching '{params['employee']}' was found.", error="not_found")
            conditions.append(HRLeaveRequest.user_id == employee.id)
        elif not elevated:
            # No name given and this caller isn't a manager/HR role — scope to themselves plus
            # anyone reporting directly to them, rather than exposing the whole org's leave data.
            team_result = await db.execute(
                select(User.id).where(or_(User.id == user.id, User.reporting_manager_id == user.id))
            )
            allowed_ids = [row[0] for row in team_result.all()]
            conditions.append(HRLeaveRequest.user_id.in_(allowed_ids))

        result = await db.execute(
            select(HRLeaveRequest)
            .options(selectinload(HRLeaveRequest.user))
            .where(*conditions)
            .order_by(HRLeaveRequest.from_date.desc())
        )
        requests = list(result.scalars().all())

        if not requests:
            return ToolResult(success=True, message=f"No approved leave in the last {days} days.", data={"employees": []})

        stats: dict[int, dict[str, Any]] = defaultdict(lambda: {"name": None, "total_days": 0.0, "weekend_adjacent": 0, "count": 0})
        for r in requests:
            s = stats[r.user_id]
            s["name"] = r.user.full_name if r.user else f"User #{r.user_id}"
            s["total_days"] += r.total_days
            s["count"] += 1
            if r.from_date.weekday() in (0, 4) or r.to_date.weekday() in (0, 4):
                s["weekend_adjacent"] += 1

        ordered = sorted(stats.values(), key=lambda s: -s["weekend_adjacent"])
        lines = [
            f"- {s['name']}: {s['total_days']:.1f} day(s) across {s['count']} request(s)"
            + (f", {s['weekend_adjacent']} Friday/Monday-adjacent" if s["weekend_adjacent"] else "")
            for s in ordered
        ]
        message = f"Leave summary for the last {days} days:\n" + "\n".join(lines)

        return ToolResult(success=True, message=message, data={"employees": ordered})


class SummarizeEmployeeDocumentTool(BaseTool):
    """Reads an employee's uploaded document off disk (same storage the manual download
    endpoint uses) and produces a short summary — a genuine LLM call made by the tool itself,
    not just a relayed confirmation, since the point is understanding document *content*."""

    definition = ToolDefinition(
        name="summarize_employee_document",
        description=(
            "Reads an uploaded employee document (offer letter, ID proof, certificate, etc.) "
            "and summarizes its contents. Use this when the user asks what a document says "
            "instead of wanting to open and read it themselves."
        ),
        category="hr",
        is_read_only=True,
        requires_approval=False,
        parameters={
            "employee": ToolParameterSchema(type="string", description="The employee's name whose document should be summarized."),
            "document_type": ToolParameterSchema(type="string", description="Document type to narrow down which one, if the employee has several."),
        },
        required_parameters=["employee"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        elevated = user.is_superuser or user.role in (UserRole.ADMIN, UserRole.HR_ADMIN, UserRole.HR_MANAGER)

        employee = await _resolve_employee(db, user.organization_id, str(params["employee"]))
        if employee is None:
            return ToolResult(success=False, message=f"No employee matching '{params['employee']}' was found.", error="not_found")

        if not elevated and employee.id != user.id:
            return ToolResult(success=False, message="You don't have access to another employee's documents.", error="forbidden")

        conditions = [
            HREmployeeDocument.organization_id == user.organization_id,
            HREmployeeDocument.user_id == employee.id,
        ]
        if params.get("document_type"):
            conditions.append(HREmployeeDocument.document_type.ilike(f"%{params['document_type']}%"))

        result = await db.execute(
            select(HREmployeeDocument).where(*conditions).order_by(HREmployeeDocument.created_at.desc()).limit(1)
        )
        doc = result.scalars().first()
        if doc is None:
            return ToolResult(success=False, message=f"No matching document found for {employee.full_name}.", error="not_found")

        if not os.path.exists(doc.file_url):
            return ToolResult(success=False, message="That document's file is missing from storage.", error="file_missing")

        text = self._extract_text(doc.file_url, doc.file_name or "")
        if not text.strip():
            return ToolResult(
                success=True,
                message=(
                    f"'{doc.file_name or doc.document_type}' doesn't contain text that can be extracted "
                    "(likely an image or an unsupported format) — open it directly to view it."
                ),
                data={"document_id": doc.id, "document_type": doc.document_type},
            )

        summary = await self._summarize(db, user, text)
        return ToolResult(
            success=True,
            message=f"Summary of {employee.full_name}'s {doc.document_type} ({doc.file_name}):\n{summary}",
            data={"document_id": doc.id, "document_type": doc.document_type},
        )

    def _extract_text(self, file_path: str, file_name: str) -> str:
        lower = (file_name or file_path).lower()
        if lower.endswith(".pdf"):
            import PyPDF2
            try:
                with open(file_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    return "\n".join(page.extract_text() or "" for page in reader.pages)
            except Exception:
                return ""
        if lower.endswith((".txt", ".md")):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()
            except Exception:
                return ""
        return ""

    async def _summarize(self, db: "AsyncSession", user: "User", text: str) -> str:
        truncated = text[:8000]
        provider = await get_llm_provider(db, org_id=user.organization_id, user_id=user.id, action_type="document_summary")
        response = await provider.complete(
            system_prompt=(
                "You summarize documents concisely and factually in 3-5 sentences. "
                "Do not invent details that aren't present in the text."
            ),
            user_message=f"Summarize this document:\n\n{truncated}",
            temperature=0.2,
        )
        return response.content.strip()


registry.register(SummarizeLeavePatternsTool())
registry.register(SummarizeEmployeeDocumentTool())
