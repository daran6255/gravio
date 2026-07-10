import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta

from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.models.timesheet import TimesheetStatus, TimesheetBillingType, HolidayType

@pytest.fixture
async def timesheet_test_data(db_session: AsyncSession):
    from app.models.organization import Organization
    org = Organization(name="Timesheet Org", subscription_status="trial")
    db_session.add(org)
    await db_session.flush()

    # Manager
    manager = User(
        email="manager@timetest.com",
        username="manager_time",
        full_name="Manager User",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.MANAGER,
        is_active=True,
        is_verified=True,
    )
    # Admin
    admin = User(
        email="admin@timetest.com",
        username="admin_time",
        full_name="Admin User",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    # Developer
    dev = User(
        email="developer@timetest.com",
        username="developer_time",
        full_name="Developer User",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.DEVELOPER,
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([manager, admin, dev])
    await db_session.commit()
    await db_session.refresh(manager)
    await db_session.refresh(admin)
    await db_session.refresh(dev)
    return org, manager, admin, dev

@pytest.fixture
async def auth_dev_client(client: AsyncClient, timesheet_test_data) -> AsyncClient:
    _, _, _, dev = timesheet_test_data
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "developer@timetest.com", "password": "password123"}
    )
    tokens = response.json()
    client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
    yield client

@pytest.fixture
async def auth_admin_client(client: AsyncClient, timesheet_test_data) -> AsyncClient:
    _, _, admin, _ = timesheet_test_data
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@timetest.com", "password": "password123"}
    )
    tokens = response.json()
    client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
    yield client


@pytest.mark.asyncio
async def test_timesheet_categories_crud(auth_dev_client: AsyncClient):
    # 1. Create personal category
    response = await auth_dev_client.post(
        "/api/v1/timesheets/categories",
        json={"name": "Standup Meeting", "color": "#FF5733"}
    )
    assert response.status_code == 201
    cat_data = response.json()
    assert cat_data["name"] == "Standup Meeting"
    assert cat_data["color"] == "#FF5733"
    category_id = cat_data["id"]

    # 2. Get my categories
    response = await auth_dev_client.get("/api/v1/timesheets/categories/my")
    assert response.status_code == 200
    my_cats = response.json()
    assert any(c["id"] == category_id for c in my_cats)

    # 3. Update category
    response = await auth_dev_client.patch(
        f"/api/v1/timesheets/categories/{category_id}",
        json={"name": "Standup and Sync"}
    )
    assert response.status_code == 200
    updated_cat = response.json()
    assert updated_cat["name"] == "Standup and Sync"

    # 4. Delete category
    response = await auth_dev_client.delete(f"/api/v1/timesheets/categories/{category_id}")
    assert response.status_code == 204

    # 5. Verify deleted
    response = await auth_dev_client.get("/api/v1/timesheets/categories/my")
    assert response.status_code == 200
    my_cats = response.json()
    assert not any(c["id"] == category_id for c in my_cats)


@pytest.mark.asyncio
async def test_org_holidays_crud(auth_admin_client: AsyncClient):
    # 1. Create holiday
    holiday_date = (date.today() + timedelta(days=2)).isoformat()
    response = await auth_admin_client.post(
        "/api/v1/holidays/",
        json={"name": "National Day", "holiday_date": holiday_date, "type": "public"}
    )
    assert response.status_code == 201
    hol_data = response.json()
    assert hol_data["name"] == "National Day"
    assert hol_data["holiday_date"] == holiday_date
    holiday_id = hol_data["id"]

    # 2. Check holiday
    response = await auth_admin_client.get(f"/api/v1/holidays/check?check_date={holiday_date}")
    assert response.status_code == 200
    check_data = response.json()
    assert check_data["is_holiday"] is True

    # 3. List holidays
    response = await auth_admin_client.get("/api/v1/holidays/")
    assert response.status_code == 200
    hols = response.json()
    assert any(h["id"] == holiday_id for h in hols)

    # 4. Delete holiday
    response = await auth_admin_client.delete(f"/api/v1/holidays/{holiday_id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_time_logging_validations(auth_dev_client: AsyncClient):
    # 1. Block future logging
    future_date = (date.today() + timedelta(days=5)).isoformat()
    response = await auth_dev_client.post(
        "/api/v1/timesheets/",
        json={"log_date": future_date, "hours": 8.0, "notes": "Future work"}
    )
    assert response.status_code == 400
    assert "Future time logging is blocked" in response.json()["error"]["message"]

    # 2. Check 24 hour cap on logging
    log_date = date.today().isoformat()
    # Log 12 hours
    response = await auth_dev_client.post(
        "/api/v1/timesheets/",
        json={"log_date": log_date, "hours": 12.0, "notes": "First chunk"}
    )
    assert response.status_code == 201
    log1_id = response.json()["id"]

    # Log 13 hours (total 25h, should fail)
    response = await auth_dev_client.post(
        "/api/v1/timesheets/",
        json={"log_date": log_date, "hours": 13.0, "notes": "Second chunk"}
    )
    assert response.status_code == 400
    assert "exceed the maximum limit of 24 hours" in response.json()["error"]["message"]

    # Clean up the test log
    await auth_dev_client.delete(f"/api/v1/timesheets/{log1_id}")


@pytest.mark.asyncio
async def test_weekly_timesheet_submission(auth_dev_client: AsyncClient, db_session, timesheet_test_data, client: AsyncClient):
    _, manager, admin, dev = timesheet_test_data
    
    # Get current user profile details to get manager status
    me_resp = await auth_dev_client.get("/api/v1/auth/me")
    assert me_resp.status_code == 200

    # Try to submit week without manager (should fail)
    monday = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    sunday = (date.today() + timedelta(days=6-date.today().weekday())).isoformat()

    # Log some time on monday
    log_resp = await auth_dev_client.post(
        "/api/v1/timesheets/",
        json={"log_date": monday, "hours": 8.0, "notes": "Standard day"}
    )
    assert log_resp.status_code == 201

    # Submit week
    submit_resp = await auth_dev_client.post(
        "/api/v1/timesheets/submit-week",
        json={"start_date": monday, "end_date": sunday}
    )
    # If reporting manager is not set, it should fail with 400
    assert submit_resp.status_code == 400
    assert "without an assigned Reporting Manager" in submit_resp.json()["error"]["message"]

    # Assign manager
    dev.reporting_manager_id = manager.id
    db_session.add(dev)
    await db_session.commit()

    # Submit week now (should succeed)
    submit_resp = await auth_dev_client.post(
        "/api/v1/timesheets/submit-week",
        json={"start_date": monday, "end_date": sunday}
    )
    assert submit_resp.status_code == 200

    # 1. Verify logging additional time on this SUBMITTED week fails
    tuesday = (date.today() - timedelta(days=date.today().weekday() - 1)).isoformat()
    fail_log_resp = await auth_dev_client.post(
        "/api/v1/timesheets/",
        json={"log_date": tuesday, "hours": 4.0, "notes": "Additional work"}
    )
    assert fail_log_resp.status_code == 400
    assert "already submitted or approved" in fail_log_resp.json()["error"]["message"]

    # 2. Login as manager to approve the timesheet
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "manager@timetest.com", "password": "password123"}
    )
    assert login_resp.status_code == 200
    manager_token = login_resp.json()["access_token"]
    
    auth_manager_headers = {"Authorization": f"Bearer {manager_token}"}
    approve_resp = await client.post(
        f"/api/v1/timesheets/users/{dev.id}/approve",
        headers=auth_manager_headers,
        json={"start_date": monday, "end_date": sunday}
    )
    assert approve_resp.status_code == 200

    # 3. Verify logging additional time on this APPROVED week fails
    fail_log_resp2 = await auth_dev_client.post(
        "/api/v1/timesheets/",
        json={"log_date": tuesday, "hours": 4.0, "notes": "Additional work"}
    )
    assert fail_log_resp2.status_code == 400
    assert "already submitted or approved" in fail_log_resp2.json()["error"]["message"]


@pytest.mark.asyncio
async def test_report_role_based_access(auth_dev_client: AsyncClient, timesheet_test_data, client: AsyncClient, db_session):
    _, manager, admin, dev = timesheet_test_data
    
    # Setup: developer reports to manager
    dev.reporting_manager_id = manager.id
    db_session.add(dev)
    await db_session.commit()

    monday = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    sunday = (date.today() + timedelta(days=6-date.today().weekday())).isoformat()

    # Log hours for developer
    await auth_dev_client.post(
        "/api/v1/timesheets/",
        json={"log_date": monday, "hours": 8.0, "notes": "Dev hours"}
    )

    # 1. Developer fetches report for their own ID (should succeed)
    resp = await auth_dev_client.get(
        f"/api/v1/timesheets/report?start_date={monday}&end_date={sunday}&user_id={dev.id}"
    )
    assert resp.status_code == 200
    assert len(resp.json()) > 0
    assert resp.json()[0]["user_id"] == dev.id

    # 2. Developer tries to fetch report for Manager's ID (should fail 403)
    resp = await auth_dev_client.get(
        f"/api/v1/timesheets/report?start_date={monday}&end_date={sunday}&user_id={manager.id}"
    )
    assert resp.status_code == 403

    # 3. Manager logs in
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "manager@timetest.com", "password": "password123"}
    )
    manager_token = login_resp.json()["access_token"]
    auth_manager_headers = {"Authorization": f"Bearer {manager_token}"}

    # 4. Manager fetches report for Dev ID (direct report, should succeed)
    resp = await client.get(
        f"/api/v1/timesheets/report?start_date={monday}&end_date={sunday}&user_id={dev.id}",
        headers=auth_manager_headers
    )
    assert resp.status_code == 200
    assert len(resp.json()) > 0

    # 5. Manager tries to fetch report for Admin ID (not direct report, should fail 403)
    resp = await client.get(
        f"/api/v1/timesheets/report?start_date={monday}&end_date={sunday}&user_id={admin.id}",
        headers=auth_manager_headers
    )
    assert resp.status_code == 403
