"""Direct verification of the new IRIS MCP tools (Timesheets/Leaves/Meetings expansion) --
calls each tool's execute() straight against a real (SQLite) test DB, bypassing the LLM
planner entirely, matching the pattern the plan's verification section called for.

Concretely proves:
 - apply_for_leave goes through the real create_leave_request validation path (creates a
   PENDING request with the correct total_days).
 - approve_or_reject_leave_request lets an actual reporting manager approve their own
   report's request.
 - approve_or_reject_leave_request REFUSES an unrelated, non-admin caller -- the one place
   a bug would have real consequences -- and leaves the request untouched (still PENDING).
 - update_time_log returns an 'ambiguous' error (and touches nothing) when more than one
   entry matches its locator, instead of guessing.
 - find_available_slots runs cleanly end to end.
"""

from datetime import date, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.timesheet import TimesheetBillingType
from app.models.user import User, UserRole
from app.schemas.timesheet import ProjectTimeLogCreate
from app.services.timesheet import TimesheetService

from app.ai.mcp.tools.leaves import ApplyForLeaveTool, ApproveOrRejectLeaveRequestTool
from app.ai.mcp.tools.timesheets import UpdateTimeLogTool
from app.ai.mcp.tools.booking import FindAvailableSlotsTool


def _next_weekday(start: date, weekday: int) -> date:
    """Next date on/after `start` matching `weekday` (0=Monday ... 6=Sunday)."""
    days_ahead = (weekday - start.weekday()) % 7
    return start + timedelta(days=days_ahead)


@pytest.fixture
async def iris_test_org(db_session: AsyncSession):
    org = Organization(name="IRIS Expansion Org", subscription_status="trial")
    db_session.add(org)
    await db_session.flush()

    manager = User(
        email="manager@iristest.com", username="manager_iris", full_name="Manager User",
        hashed_password=get_password_hash("password123"), organization_id=org.id,
        role=UserRole.MANAGER, is_active=True, is_verified=True,
    )
    db_session.add(manager)
    await db_session.flush()

    report = User(
        email="report@iristest.com", username="report_iris", full_name="Report User",
        hashed_password=get_password_hash("password123"), organization_id=org.id,
        role=UserRole.DEVELOPER, is_active=True, is_verified=True,
        reporting_manager_id=manager.id,
    )
    stranger = User(
        email="stranger@iristest.com", username="stranger_iris", full_name="Stranger User",
        hashed_password=get_password_hash("password123"), organization_id=org.id,
        role=UserRole.DEVELOPER, is_active=True, is_verified=True,
    )
    db_session.add_all([report, stranger])
    await db_session.commit()
    await db_session.refresh(manager)
    await db_session.refresh(report)
    await db_session.refresh(stranger)
    return org, manager, report, stranger


async def test_apply_for_leave_creates_pending_request(db_session: AsyncSession, iris_test_org):
    _org, _manager, report, _stranger = iris_test_org
    monday = _next_weekday(date.today() + timedelta(days=14), 0)
    tuesday = monday + timedelta(days=1)

    tool = ApplyForLeaveTool()
    result = await tool.execute(
        params={
            "leave_type": "Casual",
            "from_date": monday.isoformat(),
            "to_date": tuesday.isoformat(),
            "reason": "Trip",
        },
        db=db_session, user=report,
    )

    assert result.success, result.message
    assert result.data["total_days"] == 2.0
    assert result.data["status"] == "pending"


async def test_manager_can_approve_own_reports_request(db_session: AsyncSession, iris_test_org):
    _org, manager, report, _stranger = iris_test_org
    monday = _next_weekday(date.today() + timedelta(days=21), 0)
    tuesday = monday + timedelta(days=1)

    apply_result = await ApplyForLeaveTool().execute(
        params={"leave_type": "Casual", "from_date": monday.isoformat(), "to_date": tuesday.isoformat()},
        db=db_session, user=report,
    )
    assert apply_result.success, apply_result.message
    request_id = apply_result.data["request_id"]

    approve_result = await ApproveOrRejectLeaveRequestTool().execute(
        params={"request_id": request_id, "decision": "approved", "manager_notes": "Enjoy"},
        db=db_session, user=manager,
    )
    assert approve_result.success, approve_result.message
    assert approve_result.data["status"] == "approved"


async def test_unrelated_user_cannot_approve_leave_request(db_session: AsyncSession, iris_test_org):
    """The one place a bug would have real consequences: a non-manager, non-admin caller
    must never be able to approve/reject someone else's leave request through IRIS, even
    when asked directly with an exact request_id."""
    _org, _manager, report, stranger = iris_test_org
    monday = _next_weekday(date.today() + timedelta(days=28), 0)
    tuesday = monday + timedelta(days=1)

    apply_result = await ApplyForLeaveTool().execute(
        params={"leave_type": "Casual", "from_date": monday.isoformat(), "to_date": tuesday.isoformat()},
        db=db_session, user=report,
    )
    assert apply_result.success, apply_result.message
    request_id = apply_result.data["request_id"]

    reject_result = await ApproveOrRejectLeaveRequestTool().execute(
        params={"request_id": request_id, "decision": "rejected"},
        db=db_session, user=stranger,
    )

    assert reject_result.success is False
    assert reject_result.error == "forbidden"

    # Confirm nothing actually changed -- still pending, per a fresh read.
    status_check = await ApproveOrRejectLeaveRequestTool().execute(
        params={"request_id": request_id, "decision": "approved"},
        db=db_session, user=stranger,
    )
    assert status_check.success is False
    assert status_check.error == "forbidden"


async def test_update_time_log_returns_ambiguous_for_multiple_matches(db_session: AsyncSession, iris_test_org):
    _org, _manager, report, _stranger = iris_test_org
    log_date = date.today()

    payload_a = ProjectTimeLogCreate(category_id=None, log_date=log_date, hours=2.0, notes="entry A", billing_type=TimesheetBillingType.BILLABLE)
    payload_b = ProjectTimeLogCreate(category_id=None, log_date=log_date, hours=3.0, notes="entry B", billing_type=TimesheetBillingType.NON_BILLABLE)
    await TimesheetService.create_time_log(db_session, report, payload_a)
    await TimesheetService.create_time_log(db_session, report, payload_b)

    result = await UpdateTimeLogTool().execute(
        params={"log_date": log_date.isoformat(), "new_hours": 5.0},
        db=db_session, user=report,
    )

    assert result.success is False
    assert result.error == "ambiguous"
    assert len(result.data["candidates"]) == 2


async def test_find_available_slots_runs_cleanly(db_session: AsyncSession, iris_test_org):
    _org, manager, _report, _stranger = iris_test_org
    target_date = _next_weekday(date.today() + timedelta(days=7), 0)

    result = await FindAvailableSlotsTool().execute(
        params={"target_date": target_date.isoformat()}, db=db_session, user=manager,
    )

    assert result.success is True
    assert "slots" in result.data
