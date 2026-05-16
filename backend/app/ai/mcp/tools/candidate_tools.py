"""
AI Engine — Candidate Tools
==========================

Tools for searching, counting, and analyzing candidate registrations.
"""

from __future__ import annotations

import logging
from typing import Any, TYPE_CHECKING

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.repositories.candidate_repository import CandidateRepository

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from app.models.user import User

logger = logging.getLogger(__name__)


# ── Search/Count Candidates ──────────────────────────────────────────────────

class SearchCandidatesTool(BaseTool):
    """
    Search for registered candidates or get registration statistics (counts).
    """
    definition = ToolDefinition(
        name="search_candidates",
        description="Search for registered candidates by name/email/phone, or get total registration counts and demographic breakdowns.",
        category="placement",
        is_read_only=True,
        parameters={
            "query": ToolParameterSchema(
                type="string", 
                description="Search term (name, email, phone, or city)"
            ),
            "include_stats": ToolParameterSchema(
                type="boolean",
                description="If true, returns overall statistics like total count, gender breakdown, etc.",
                default=False
            ),
            "limit": ToolParameterSchema(
                type="integer",
                description="Number of records to return (default 10)",
                default=10
            )
        },
        required_parameters=[]
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            repo = CandidateRepository(db)
            include_stats = params.get("include_stats", False)
            query = params.get("query")
            limit = params.get("limit", 10)

            result_data = {}
            message_parts = []

            # 1. Fetch Stats if requested
            if include_stats or not query:
                stats = await repo.get_stats()
                result_data["stats"] = stats
                message_parts.append(f"Total: {stats.get('total', 0)}")
                message_parts.append(f"Today: {stats.get('today_count', 0)}")

            # 2. Fetch records if query provided or as a preview
            candidates, total_matching = await repo.get_multi(
                search=query,
                limit=limit
            )
            
            result_data["candidates"] = [
                {
                    "id": c.id,
                    "name": c.name,
                    "city": c.city,
                    "gender": c.gender,
                    "email": c.email,
                    "phone": c.phone,
                    "created_at": str(c.created_at)
                }
                for c in candidates
            ]
            result_data["total_matching"] = total_matching

            if query:
                message_parts.append(f"Found {total_matching} candidates matching '{query}'.")
            
            # If we fetched stats, build a very explicit message
            if "stats" in result_data:
                s = result_data["stats"]
                message_parts.append(f"TOTAL_REGISTERED_CANDIDATES: {s.get('total', 0)}")
                message_parts.append(f"NEW_TODAY: {s.get('today_count', 0)}")
                message_parts.append(f"GENDER: Male({s.get('male', 0)}), Female({s.get('female', 0)}), Others({s.get('others', 0)})")
                
                # Add a high-priority summary for the LLM synthesis logic
                result_data["REVEAL_DATA"] = f"ACTUAL_CANDIDATE_COUNT: {s.get('total', 0)}"

            return ToolResult(
                success=True,
                message=" | ".join(message_parts) if message_parts else "Successfully retrieved candidate data.",
                data=result_data
            )

        except Exception as e:
            logger.exception("Error in search_candidates tool")
            return ToolResult(success=False, message=f"Failed to retrieve candidates: {str(e)}", error=str(e))


# ── Candidate Demographics & Analytics ──────────────────────────────────────

class GetCandidateAnalyticsTool(BaseTool):
    """
    Full demographic breakdown analytics for candidates.
    Handles education qualification, city, disability, experience, and screening distributions.
    Routes all 'how many X', 'breakdown', 'distribution' questions about candidates.
    """
    definition = ToolDefinition(
        name="get_candidate_analytics",
        description=(
            "Get detailed demographic breakdowns and analytics for registered candidates. "
            "Use this for: education/qualification breakdown, city/district/state distribution, "
            "disability type stats, work experience distribution, screening status distribution, "
            "gender breakdown, or any 'how many candidates are X' question."
        ),
        category="placement",
        is_read_only=True,
        parameters={
            "breakdown_type": ToolParameterSchema(
                type="string",
                description=(
                    "Type of breakdown to compute. One of: "
                    "'education' (qualification/degree levels), "
                    "'city' (top cities), "
                    "'state' (state distribution), "
                    "'disability' (disability type counts), "
                    "'experience' (experienced vs freshers), "
                    "'screening' (screening status distribution), "
                    "'gender' (male/female/others count), "
                    "'all' (all breakdowns at once)."
                ),
                default="all"
            ),
            "top_n": ToolParameterSchema(
                type="integer",
                description="Return top N items for city/state/education breakdowns (default 10).",
                default=10
            )
        },
        required_parameters=[]
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        from sqlalchemy import select, func, text
        from app.models.candidate import Candidate
        from app.models.candidate_screening import CandidateScreening
        from collections import Counter

        try:
            breakdown_type = (params.get("breakdown_type") or "all").lower()
            top_n = params.get("top_n", 10)
            result_data: dict[str, Any] = {}
            summary_parts: list[str] = []

            # ── Fetch all active candidates (lightweight columns only) ──────
            stmt = select(
                Candidate.gender,
                Candidate.city,
                Candidate.district,
                Candidate.state,
                Candidate.education_details,
                Candidate.work_experience,
                Candidate.disability_details,
            ).where(Candidate.is_deleted == False)
            rows = (await db.execute(stmt)).all()

            do_all = breakdown_type == "all"

            # ── Gender ───────────────────────────────────────────────────────
            if do_all or breakdown_type == "gender":
                gender_counter: Counter = Counter()
                for r in rows:
                    g = (r.gender or "Unknown").strip().title()
                    gender_counter[g] += 1
                result_data["gender"] = dict(gender_counter.most_common())
                summary_parts.append(
                    "Gender: " + ", ".join(f"{k}({v})" for k, v in gender_counter.most_common())
                )

            # ── Education / Qualification ─────────────────────────────────
            if do_all or breakdown_type == "education":
                edu_counter: Counter = Counter()
                for r in rows:
                    ed = r.education_details or {}
                    degrees = ed.get("degrees") or []
                    if not isinstance(degrees, list):
                        degrees = [degrees]
                    if degrees:
                        for deg in degrees:
                            level = None
                            if isinstance(deg, dict):
                                # Try common keys: degree_name, degree, level, qualification
                                level = (
                                    deg.get("degree_name")
                                    or deg.get("degree")
                                    or deg.get("level")
                                    or deg.get("qualification")
                                    or deg.get("course")
                                )
                            elif isinstance(deg, str):
                                level = deg
                            if level:
                                edu_counter[str(level).strip()] += 1
                    else:
                        edu_counter["Not Provided"] += 1

                top_edu = edu_counter.most_common(top_n)
                result_data["education_breakdown"] = dict(top_edu)
                summary_parts.append(
                    "Education: " + ", ".join(f"{k}({v})" for k, v in top_edu)
                )

            # ── City Distribution ─────────────────────────────────────────
            if do_all or breakdown_type == "city":
                city_counter: Counter = Counter(
                    (r.city or "Unknown").strip().title() for r in rows
                )
                top_cities = city_counter.most_common(top_n)
                result_data["city_breakdown"] = dict(top_cities)
                summary_parts.append(
                    "Top Cities: " + ", ".join(f"{k}({v})" for k, v in top_cities)
                )

            # ── State Distribution ────────────────────────────────────────
            if do_all or breakdown_type == "state":
                state_counter: Counter = Counter(
                    (r.state or "Unknown").strip().title() for r in rows
                )
                top_states = state_counter.most_common(top_n)
                result_data["state_breakdown"] = dict(top_states)
                summary_parts.append(
                    "Top States: " + ", ".join(f"{k}({v})" for k, v in top_states)
                )

            # ── Disability ────────────────────────────────────────────────
            if do_all or breakdown_type == "disability":
                dis_counter: Counter = Counter()
                for r in rows:
                    dd = r.disability_details or {}
                    is_disabled = str(dd.get("is_disabled", "false")).lower() == "true"
                    if is_disabled:
                        dtype = dd.get("disability_type") or "Unspecified"
                        dis_counter[str(dtype).strip()] += 1
                    else:
                        dis_counter["No Disability"] += 1
                result_data["disability_breakdown"] = dict(dis_counter.most_common())
                summary_parts.append(
                    "Disability: " + ", ".join(f"{k}({v})" for k, v in dis_counter.most_common())
                )

            # ── Work Experience ───────────────────────────────────────────
            if do_all or breakdown_type == "experience":
                exp_counter: Counter = Counter()
                for r in rows:
                    we = r.work_experience or {}
                    is_exp = str(we.get("is_experienced", "false")).lower() == "true"
                    exp_counter["Experienced" if is_exp else "Fresher"] += 1
                result_data["experience_breakdown"] = dict(exp_counter)
                summary_parts.append(
                    "Experience: " + ", ".join(f"{k}({v})" for k, v in exp_counter.items())
                )

            # ── Screening Status ──────────────────────────────────────────
            if do_all or breakdown_type == "screening":
                sc_stmt = select(
                    CandidateScreening.status,
                    func.count(CandidateScreening.id)
                ).group_by(CandidateScreening.status)
                sc_rows = (await db.execute(sc_stmt)).all()
                sc_counter: dict = {}
                for status, cnt in sc_rows:
                    key = status if status else "Pending/In Progress"
                    sc_counter[key] = sc_counter.get(key, 0) + cnt
                not_screened = len(rows) - sum(sc_counter.values())
                if not_screened > 0:
                    sc_counter["Not Screened"] = not_screened
                result_data["screening_breakdown"] = sc_counter
                summary_parts.append(
                    "Screening: " + ", ".join(f"{k}({v})" for k, v in sc_counter.items())
                )

            total = len(rows)
            result_data["total_candidates"] = total
            reveal = f"CANDIDATE_ANALYTICS ({total} total): " + " | ".join(summary_parts)

            return ToolResult(
                success=True,
                message=f"Analytics for {total} candidates — " + "; ".join(summary_parts),
                data={**result_data, "REVEAL_DATA": reveal}
            )

        except Exception as e:
            logger.exception("Error in get_candidate_analytics tool")
            return ToolResult(success=False, message=f"Analytics failed: {str(e)}", error=str(e))


# ── Registration ─────────────────────────────────────────────────────────────

registry.register(SearchCandidatesTool())
registry.register(GetCandidateAnalyticsTool())
