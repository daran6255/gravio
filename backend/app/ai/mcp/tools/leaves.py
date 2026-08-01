"""Leave tools — self-service leave for solo users and team members/managers.

Every write here goes through app/services/hr.py's existing module-level functions (not a
class -- imported as `hr_service`), the exact same functions the manual Leave Management UI
calls. In particular `approve_or_reject_leave_request` does NOT pre-check the caller's
authority itself: it hands manager_user_id/is_admin_override straight to
hr_service.approve_reject_leave_request and lets that function's own reporting-manager /
self-approval / admin-override checks (identical to what POST
/hr/leaves/requests/{public_id}/approve-reject enforces) be the sole source of truth. That
guarantees this tool can never be more permissive than the manual approve endpoint.
"""

from __future__ import annotations

import uuid
from datetime import date as date_type
from typing import TYPE_CHECKING, Any, Optional

from fastapi import HTTPException
from sqlalchemy import select

from app.ai.brain.schemas import ToolDefinition, ToolParameterSchema, ToolResult, ToolRiskTier
from app.ai.mcp.base_tool import BaseTool
from app.ai.mcp.registry import registry
from app.models.hr import HRLeaveType
from app.models.user import User, UserRole
from app.schemas.hr import LeaveApprovalRequest, LeaveRequestCreate, LeaveRequestResponse
from app.services import hr as hr_service

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

# Matches the exact set the manual approve/reject endpoint bypasses the reporting-manager
# check for (app/api/v1/endpoints/hr.py's HR_ADMIN_ROLES) -- a plain MANAGER isn't in this
# set, but still gets through hr_service's own reporting-manager check for their own direct
# reports, so this only controls how widely this tool *searches* for a candidate request.
HR_ADMIN_ROLES = {UserRole.ADMIN, UserRole.HR_ADMIN}

# Who can see the whole org's leave (vs. just their own + direct reports) for read-only
# lookups like who_is_on_leave -- matches the broader scoping SummarizeLeavePatternsTool
# already uses in hr.py, since visibility here carries lower stakes than the approve/reject
# authorization gate above.
ELEVATED_ROLES = {UserRole.ADMIN, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.HR_MANAGER}


async def _resolve_employee(db: "AsyncSession", organization_id: int, name: str) -> Optional[User]:
    result = await db.execute(
        select(User)
        .where(User.organization_id == organization_id, User.is_deleted.is_(False), User.full_name.ilike(f"%{name}%"))
        .limit(1)
    )
    return result.scalars().first()


async def _resolve_leave_type(db: "AsyncSession", organization_id: int, name: str) -> Optional[HRLeaveType]:
    types = await hr_service.list_leave_types(db, organization_id)
    lowered = name.strip().lower()
    for lt in types:
        if lowered in lt.name.lower() or lowered == lt.code.lower():
            return lt
    return None


def _overlaps(req: LeaveRequestResponse, from_date: Optional[date_type], to_date: Optional[date_type]) -> bool:
    """Whether a request's [from_date, to_date] overlaps the given range. A range with only
    one bound given is treated as a single day (that bound used for both ends)."""
    if from_date is None and to_date is None:
        return True
    lo = from_date or to_date
    hi = to_date or from_date
    return req.from_date <= hi and req.to_date >= lo


def _describe_request(req: LeaveRequestResponse) -> str:
    return f"{req.leave_type_name or 'leave'} {req.from_date.isoformat()}–{req.to_date.isoformat()} ({req.status})"


def _locate_request(
    candidates: list[LeaveRequestResponse], from_date: Optional[date_type], to_date: Optional[date_type],
) -> tuple[Optional[LeaveRequestResponse], Optional[ToolResult]]:
    matches = [r for r in candidates if _overlaps(r, from_date, to_date)]
    if not matches:
        return None, ToolResult(success=False, message="No matching leave request was found.", error="not_found")
    if len(matches) > 1:
        options = "; ".join(f"#{r.public_id}: {_describe_request(r)}" for r in matches)
        return None, ToolResult(
            success=False,
            message=f"Found {len(matches)} matching requests — which one did you mean? {options}",
            error="ambiguous",
            data={"candidates": [str(r.public_id) for r in matches]},
        )
    return matches[0], None


class CheckLeaveBalanceTool(BaseTool):
    """Reports the current user's own leave balances."""

    definition = ToolDefinition(
        name="check_leave_balance",
        description=(
            "Reports the current user's leave balance by type (allocated, used, pending, and "
            "available = allocated - used - pending). Use for 'how many leave days do I have "
            "left' or 'what's my sick leave balance'."
        ),
        category="hr",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={
            "year": ToolParameterSchema(type="integer", description="Calendar year to check. Defaults to the current year."),
        },
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        year = int(params["year"]) if params.get("year") else date_type.today().year
        balances = await hr_service.get_user_balances(db, user.organization_id, user.id, year)
        if not balances:
            return ToolResult(success=True, message=f"No leave balances configured for {year}.", data={"balances": []})

        lines = []
        items = []
        for b in balances:
            available = b.allocated - b.used - b.pending
            lines.append(f"- {b.leave_type_name}: {available:g} available ({b.allocated:g} allocated, {b.used:g} used, {b.pending:g} pending)")
            items.append({
                "leave_type_id": b.leave_type_id,
                "leave_type_name": b.leave_type_name,
                "allocated": b.allocated,
                "used": b.used,
                "pending": b.pending,
                "available": available,
            })
        return ToolResult(success=True, message=f"Leave balance for {year}:\n" + "\n".join(lines), data={"balances": items})


class ListLeaveTypesTool(BaseTool):
    """Lists the organization's configured leave types."""

    definition = ToolDefinition(
        name="list_leave_types",
        description=(
            "Lists the organization's active leave types (name, code, whether it's paid). Use "
            "this to find the exact leave type name before calling apply_for_leave, since type "
            "names are org-configured and shouldn't be guessed."
        ),
        category="hr",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={},
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        types = await hr_service.list_leave_types(db, user.organization_id)
        items = [{"leave_type_id": t.id, "name": t.name, "code": t.code, "is_lop": t.is_lop} for t in types]
        names = ", ".join(t.name for t in types)
        return ToolResult(success=True, message=f"Leave types: {names}" if types else "No leave types configured.", data={"leave_types": items})


class ApplyForLeaveTool(BaseTool):
    """Files a new leave request for the current user."""

    definition = ToolDefinition(
        name="apply_for_leave",
        description=(
            "Applies for leave for the current user, going through the same overlap, "
            "working-days, blackout-date, and balance checks the manual Apply for Leave form "
            "uses. Use list_leave_types first if you don't already know the exact leave type "
            "name. Resolve relative dates ('tomorrow', 'next Monday') using the current date "
            "given in context."
        ),
        category="hr",
        is_read_only=False,
        risk_tier=ToolRiskTier.REVERSIBLE,
        parameters={
            "leave_type": ToolParameterSchema(type="string", description="Leave type name, e.g. 'Casual Leave' or 'Sick Leave'."),
            "from_date": ToolParameterSchema(type="string", description="First day of leave, YYYY-MM-DD."),
            "to_date": ToolParameterSchema(type="string", description="Last day of leave, YYYY-MM-DD (same as from_date for a single day)."),
            "is_half_day": ToolParameterSchema(type="boolean", description="Whether this is a half-day request.", default=False),
            "reason": ToolParameterSchema(type="string", description="Optional reason shared with the approver."),
        },
        required_parameters=["leave_type", "from_date", "to_date"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            from_date = date_type.fromisoformat(str(params["from_date"]))
            to_date = date_type.fromisoformat(str(params["to_date"]))
        except ValueError:
            return ToolResult(success=False, message="from_date/to_date must be in YYYY-MM-DD format.", error="invalid_date")

        leave_type = await _resolve_leave_type(db, user.organization_id, str(params["leave_type"]))
        if leave_type is None:
            return ToolResult(success=False, message=f"No leave type matching '{params['leave_type']}' was found. Use list_leave_types to see valid names.", error="not_found")

        payload = LeaveRequestCreate(
            leave_type_id=leave_type.id,
            from_date=from_date,
            to_date=to_date,
            is_half_day=bool(params.get("is_half_day", False)),
            reason=params.get("reason"),
        )
        try:
            req = await hr_service.create_leave_request(db, user.organization_id, user.id, payload)
        except HTTPException as e:
            return ToolResult(success=False, message=str(e.detail), error="request_failed")

        return ToolResult(
            success=True,
            message=f"Applied for {req.total_days:g} day(s) of {leave_type.name} from {req.from_date.isoformat()} to {req.to_date.isoformat()}, pending approval.",
            data={"request_id": str(req.public_id), "total_days": req.total_days, "status": req.status},
            records_affected=1,
        )


class ListMyLeaveRequestsTool(BaseTool):
    """Lists the current user's own leave requests."""

    definition = ToolDefinition(
        name="list_my_leave_requests",
        description=(
            "Lists the current user's own leave requests, optionally filtered by status. Use "
            "for 'what's the status of my leave request' or 'show my pending leave requests'."
        ),
        category="hr",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={
            "status": ToolParameterSchema(
                type="string", description="Filter by status.", enum=["pending", "approved", "rejected", "cancelled"],
            ),
        },
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        requests = await hr_service.list_leave_requests(
            db, user.organization_id, user_id=user.id, status_filter=params.get("status"),
        )
        if not requests:
            return ToolResult(success=True, message="No leave requests found.", data={"requests": []})

        lines = [f"- {_describe_request(r)}" for r in requests]
        items = [
            {
                "request_id": str(r.public_id),
                "leave_type_name": r.leave_type_name,
                "from_date": r.from_date.isoformat(),
                "to_date": r.to_date.isoformat(),
                "total_days": r.total_days,
                "status": r.status,
            }
            for r in requests
        ]
        return ToolResult(success=True, message="Your leave requests:\n" + "\n".join(lines), data={"requests": items})


class CancelLeaveRequestTool(BaseTool):
    """Cancels one of the current user's own leave requests."""

    definition = ToolDefinition(
        name="cancel_leave_request",
        description=(
            "Cancels a pending or approved leave request belonging to the current user (self "
            "only -- this never cancels someone else's leave). Locate it with request_id if "
            "known, otherwise with from_date/to_date. If more than one request matches, this "
            "returns an 'ambiguous' error listing the candidates -- ask which one rather than "
            "guessing."
        ),
        category="hr",
        is_read_only=False,
        risk_tier=ToolRiskTier.DESTRUCTIVE,
        parameters={
            "request_id": ToolParameterSchema(type="string", description="The leave request's exact id, if already known."),
            "from_date": ToolParameterSchema(type="string", description="First day of the leave to cancel, YYYY-MM-DD, if request_id isn't known."),
            "to_date": ToolParameterSchema(type="string", description="Last day of the leave to cancel, YYYY-MM-DD."),
        },
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        public_id: Optional[uuid.UUID] = None
        if params.get("request_id"):
            try:
                public_id = uuid.UUID(str(params["request_id"]))
            except ValueError:
                return ToolResult(success=False, message="request_id must be a valid id.", error="invalid_id")
        else:
            from_date = to_date = None
            try:
                if params.get("from_date"):
                    from_date = date_type.fromisoformat(str(params["from_date"]))
                if params.get("to_date"):
                    to_date = date_type.fromisoformat(str(params["to_date"]))
            except ValueError:
                return ToolResult(success=False, message="from_date/to_date must be in YYYY-MM-DD format.", error="invalid_date")

            if from_date is None and to_date is None:
                return ToolResult(success=False, message="Specify request_id, or from_date/to_date to locate the request.", error="missing_target")

            own_requests = await hr_service.list_leave_requests(db, user.organization_id, user_id=user.id)
            own_requests = [r for r in own_requests if r.status != "cancelled"]
            target, error = _locate_request(own_requests, from_date, to_date)
            if error is not None:
                return error
            public_id = target.public_id

        try:
            req = await hr_service.cancel_leave_request(db, user.organization_id, public_id, user.id)
        except HTTPException as e:
            return ToolResult(success=False, message=str(e.detail), error="request_failed")

        return ToolResult(
            success=True,
            message=f"Cancelled the {req.leave_type_name} request for {req.from_date.isoformat()} to {req.to_date.isoformat()}.",
            data={"request_id": str(req.public_id), "status": req.status},
            records_affected=1,
        )


class WhoIsOnLeaveTool(BaseTool):
    """Reports who's approved-on-leave within a date range."""

    definition = ToolDefinition(
        name="who_is_on_leave",
        description=(
            "Reports who has approved leave overlapping a date range. Defaults to today. Use "
            "for 'who's out this week' / 'is anyone on leave tomorrow'. Managers/HR see their "
            "team or the whole org by default; everyone else sees themselves plus their direct "
            "reports (if any)."
        ),
        category="hr",
        is_read_only=True,
        risk_tier=ToolRiskTier.READ_ONLY,
        parameters={
            "from_date": ToolParameterSchema(type="string", description="Range start, YYYY-MM-DD. Defaults to today."),
            "to_date": ToolParameterSchema(type="string", description="Range end, YYYY-MM-DD. Defaults to from_date."),
        },
        required_parameters=[],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        try:
            from_date = date_type.fromisoformat(str(params["from_date"])) if params.get("from_date") else date_type.today()
            to_date = date_type.fromisoformat(str(params["to_date"])) if params.get("to_date") else from_date
        except ValueError:
            return ToolResult(success=False, message="from_date/to_date must be in YYYY-MM-DD format.", error="invalid_date")

        elevated = user.is_superuser or user.role in ELEVATED_ROLES
        manager_user_id = None if elevated else user.id
        requests = await hr_service.list_leave_requests(
            db, user.organization_id, status_filter="approved", manager_user_id=manager_user_id,
        )
        # list_leave_requests scopes non-elevated callers to their direct reports only --
        # widen to include the caller themselves too, same as who_is_on_leave's own framing.
        if not elevated:
            own = await hr_service.list_leave_requests(db, user.organization_id, user_id=user.id, status_filter="approved")
            seen = {r.public_id for r in requests}
            requests += [r for r in own if r.public_id not in seen]

        on_leave = [r for r in requests if _overlaps(r, from_date, to_date)]
        if not on_leave:
            return ToolResult(success=True, message=f"No one is on approved leave between {from_date.isoformat()} and {to_date.isoformat()}.", data={"on_leave": []})

        lines = [f"- {r.employee_name}: {_describe_request(r)}" for r in on_leave]
        items = [
            {
                "employee_name": r.employee_name,
                "leave_type_name": r.leave_type_name,
                "from_date": r.from_date.isoformat(),
                "to_date": r.to_date.isoformat(),
            }
            for r in on_leave
        ]
        return ToolResult(success=True, message="On leave:\n" + "\n".join(lines), data={"on_leave": items})


class ApproveOrRejectLeaveRequestTool(BaseTool):
    """Approves or rejects a leave request. Manager/admin-only -- authorization is enforced
    entirely by hr_service.approve_reject_leave_request, never pre-checked here."""

    definition = ToolDefinition(
        name="approve_or_reject_leave_request",
        description=(
            "Approves or rejects a pending leave request. Only works for the caller's own "
            "direct reports, or if the caller is an admin/HR admin -- if the caller lacks "
            "authority over the request, this fails with a 'forbidden' error and nothing is "
            "changed; do not retry or attempt a workaround, just report the failure. Locate the "
            "request with request_id if known, otherwise with employee name and/or "
            "from_date/to_date."
        ),
        category="hr",
        is_read_only=False,
        risk_tier=ToolRiskTier.DESTRUCTIVE,
        parameters={
            "request_id": ToolParameterSchema(type="string", description="The leave request's exact id, if already known."),
            "employee": ToolParameterSchema(type="string", description="Employee name, if request_id isn't known."),
            "from_date": ToolParameterSchema(type="string", description="First day of the leave request, YYYY-MM-DD, if request_id isn't known."),
            "to_date": ToolParameterSchema(type="string", description="Last day of the leave request, YYYY-MM-DD."),
            "decision": ToolParameterSchema(type="string", description="'approved' or 'rejected'.", enum=["approved", "rejected"]),
            "manager_notes": ToolParameterSchema(type="string", description="Optional note shared with the employee."),
        },
        required_parameters=["decision"],
    )

    async def execute(self, params: dict[str, Any], db: "AsyncSession", user: "User") -> ToolResult:
        public_id: Optional[uuid.UUID] = None
        if params.get("request_id"):
            try:
                public_id = uuid.UUID(str(params["request_id"]))
            except ValueError:
                return ToolResult(success=False, message="request_id must be a valid id.", error="invalid_id")
        else:
            from_date = to_date = None
            try:
                if params.get("from_date"):
                    from_date = date_type.fromisoformat(str(params["from_date"]))
                if params.get("to_date"):
                    to_date = date_type.fromisoformat(str(params["to_date"]))
            except ValueError:
                return ToolResult(success=False, message="from_date/to_date must be in YYYY-MM-DD format.", error="invalid_date")

            employee_id = None
            if params.get("employee"):
                employee = await _resolve_employee(db, user.organization_id, str(params["employee"]))
                if employee is None:
                    return ToolResult(success=False, message=f"No employee matching '{params['employee']}' was found.", error="not_found")
                employee_id = employee.id

            elevated = user.is_superuser or user.role in HR_ADMIN_ROLES
            candidates = await hr_service.list_leave_requests(
                db, user.organization_id,
                user_id=employee_id,
                status_filter="pending",
                manager_user_id=None if elevated else user.id,
            )
            target, error = _locate_request(candidates, from_date, to_date)
            if error is not None:
                return error
            public_id = target.public_id

        payload = LeaveApprovalRequest(status=str(params["decision"]), manager_notes=params.get("manager_notes"))
        elevated = user.is_superuser or user.role in HR_ADMIN_ROLES
        try:
            req = await hr_service.approve_reject_leave_request(
                db, user.organization_id, public_id, manager_user_id=user.id, payload=payload, is_admin_override=elevated,
            )
        except HTTPException as e:
            error_code = "forbidden" if e.status_code == 403 else "request_failed"
            return ToolResult(success=False, message=str(e.detail), error=error_code)

        return ToolResult(
            success=True,
            message=f"{req.status.capitalize()} {req.employee_name}'s {req.leave_type_name} request for {req.from_date.isoformat()} to {req.to_date.isoformat()}.",
            data={"request_id": str(req.public_id), "status": req.status},
            records_affected=1,
        )


registry.register(CheckLeaveBalanceTool())
registry.register(ListLeaveTypesTool())
registry.register(ApplyForLeaveTool())
registry.register(ListMyLeaveRequestsTool())
registry.register(CancelLeaveRequestTool())
registry.register(WhoIsOnLeaveTool())
registry.register(ApproveOrRejectLeaveRequestTool())
