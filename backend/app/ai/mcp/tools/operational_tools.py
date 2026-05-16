"""
AI Engine — Operational & Business Intelligence Tools
=====================================================

Tools for high-level reporting on DSR, Training, and User Performance.
These tools use strictly aggregated SQL for performance.
"""

from __future__ import annotations

import logging
from datetime import datetime, date, timedelta, timezone
from typing import Any, TYPE_CHECKING

from sqlalchemy import select, func, and_
from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.models.candidate_screening import CandidateScreening
from app.models.dsr_entry import DSREntry, DSRStatus
from app.models.training_candidate_allocation import TrainingCandidateAllocation
from app.models.user import User, UserRole

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


# ── User Performance / KPIs ──────────────────────────────────────────────────

class GetUserPerformanceTool(BaseTool):
    """
    Retrieves performance metrics for staff members.
    Includes screening counts and lead assignments.
    """
    definition = ToolDefinition(
        name="get_user_performance",
        description="Get productivity metrics (screening counts, lead assignments) for specific staff or all users.",
        category="hr",
        is_read_only=True,
        parameters={
            "email": ToolParameterSchema(type="string", description="Optional: specific user email to filter by"),
            "days": ToolParameterSchema(type="integer", description="Lookback window in days (default 30)", default=30)
        }
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            target_email = params.get("email")
            days = params.get("days", 30)

            # ── RBAC ENFORCEMENT ──────────────────────────────────────────────
            # Only Admin, Manager, or Superuser can view OTHER users' performance.
            # Non-privileged users are silently restricted to their own data.
            privileged = user.is_superuser or user.role in (UserRole.ADMIN, UserRole.MANAGER)
            if not privileged:
                # Non-privileged: force scope to requesting user only
                target_email = user.email
            # ─────────────────────────────────────────────────────────────────

            # Use IST for business lookback
            now_ist = datetime.now(timezone.utc) + self._ist_offset
            since_date = now_ist - timedelta(days=days)

            # Screening Counts (aggregated)
            query = select(
                User.full_name,
                User.email,
                func.count(CandidateScreening.id).label("count")
            ).join(
                CandidateScreening, User.id == CandidateScreening.screened_by_id
            ).where(
                CandidateScreening.created_at >= since_date
            ).group_by(User.id)

            if target_email:
                query = query.where(User.email == target_email)

            result = await db.execute(query)
            stats = [
                {"name": r.full_name, "email": r.email, "screenings": r.count}
                for r in result.all()
            ]

            scope_note = "(all staff)" if privileged and not params.get("email") else f"for {target_email}"
            msg = f"Retrieved performance stats {scope_note} over the last {days} days."
            perf_summary = ", ".join([f"{s['name']}({s['screenings']})" for s in stats])
            return ToolResult(
                success=True,
                message=msg,
                data={
                    "performance_stats": stats,
                    "REVEAL_DATA": f"STAFF_PERFORMANCE: {perf_summary}"
                }
            )

        except Exception as e:
            logger.exception("Error in get_user_performance tool")
            return ToolResult(success=False, message=str(e), error=str(e))


# ── Training Analytics ────────────────────────────────────────────────────────

class GetTrainingAnalyticsTool(BaseTool):
    """
    Retrieves global training statistics including batch counts and dropout rates.
    """
    definition = ToolDefinition(
        name="get_training_analytics",
        description="Get global training statistics: candidate statuses, batch allocations, and dropout rates.",
        category="training",
        is_read_only=True,
        parameters={}
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            # Status Counts
            query = select(
                TrainingCandidateAllocation.status,
                func.count(TrainingCandidateAllocation.id)
            ).group_by(TrainingCandidateAllocation.status)
            
            result = await db.execute(query)
            counts = {row[0]: row[1] for row in result.all()}
            
            total = sum(counts.values())
            dropout_count = counts.get("dropped_out", 0)
            in_training = counts.get("in_training", 0)
            completed = counts.get("completed", 0)

            msg = f"Training Status: {in_training} in training, {completed} completed, {dropout_count} dropouts."
            return ToolResult(
                success=True,
                message=msg,
                data={
                    "status_counts": counts,
                    "REVEAL_DATA": f"TRAINING_STATS: Total({total}), Active({in_training}), Completed({completed}), Dropouts({dropout_count})"
                }
            )

        except Exception as e:
            logger.exception("Error in get_training_analytics tool")
            return ToolResult(success=False, message=str(e), error=str(e))


# ── DSR Operations ───────────────────────────────────────────────────────────

class GetDSROperationsTool(BaseTool):
    """
    Finds missing or pending DSR entries for the current day or a range.
    """
    definition = ToolDefinition(
        name="get_dsr_status",
        description="Check DSR submission status: find which users have not submitted their report for today.",
        category="training",
        is_read_only=True,
        parameters={
            "report_date": ToolParameterSchema(type="string", description="ISO date (YYYY-MM-DD), defaults to today")
        }
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            # ── RBAC ENFORCEMENT ──────────────────────────────────────────────
            # DSR compliance report is restricted to Admin, Manager, and Superuser.
            privileged = user.is_superuser or user.role in (UserRole.ADMIN, UserRole.MANAGER)
            if not privileged:
                return ToolResult(
                    success=False,
                    message="🔐 Access denied. DSR compliance reports are restricted to Admin and Manager roles.",
                    error="RBAC_DENIED"
                )
            # ─────────────────────────────────────────────────────────────────

            report_date_str = params.get("report_date")
            if report_date_str:
                report_date = date.fromisoformat(report_date_str)
            else:
                # Use IST today for business reporting
                now_ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
                report_date = now_ist.date()

            # Find users who DON'T have a submitted DSR for this date
            # 1. Subquery of users with DSRs
            subq = select(DSREntry.user_id).where(
                and_(DSREntry.report_date == report_date, DSREntry.status == DSRStatus.SUBMITTED)
            )
            
            # 2. Users NOT in that list (excluding superusers and inactive)
            query = select(User.full_name, User.email).where(
                and_(User.id.notin_(subq), User.is_active == True, User.is_superuser == False)
            )
            
            result = await db.execute(query)
            missing_users = [{"name": r.full_name, "email": r.email} for r in result.all()]

            msg = f"Found {len(missing_users)} users who have NOT submitted DSR for {report_date}."
            return ToolResult(
                success=True,
                message=msg,
                data={
                    "missing_users": missing_users,
                    "count": len(missing_users),
                    "REVEAL_DATA": f"PENDING_DSR_COUNT: {len(missing_users)} users missing for {report_date}"
                }
            )

        except Exception as e:
            logger.exception("Error in get_dsr_status tool")
            return ToolResult(success=False, message=str(e), error=str(e))


# ── Registration ─────────────────────────────────────────────────────────────

registry.register(GetUserPerformanceTool())
registry.register(GetTrainingAnalyticsTool())
registry.register(GetDSROperationsTool())
