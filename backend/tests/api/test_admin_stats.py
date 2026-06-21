import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.core.security import get_password_hash
from datetime import datetime, timezone, timedelta

@pytest.fixture
async def sample_admin_data(db_session: AsyncSession):
    # Create Organizations
    org1 = Organization(
        name="Org One",
        subscription_status="trial",
        trial_expires_at=datetime.now(timezone.utc) + timedelta(days=15),
    )
    org2 = Organization(
        name="Org Two",
        subscription_status="trial",
        trial_expires_at=datetime.now(timezone.utc) - timedelta(days=1), # Expired trial
    )
    db_session.add_all([org1, org2])
    await db_session.flush()

    # Create Superuser
    superuser = User(
        email="superuser@test.com",
        username="superuser",
        full_name="Super User",
        hashed_password=get_password_hash("superpassword"),
        is_superuser=True,
        is_active=True,
        is_verified=True,
    )
    # Create Org Admin (non-superuser)
    org_admin = User(
        email="orgadmin@test.com",
        username="orgadmin",
        full_name="Org Admin",
        hashed_password=get_password_hash("password123"),
        organization_id=org1.id,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    # Create Org User
    org_user = User(
        email="orguser@test.com",
        username="orguser",
        full_name="Org User",
        hashed_password=get_password_hash("password123"),
        organization_id=org1.id,
        role=UserRole.DEVELOPER,
        is_active=True,
        is_verified=True,
    )
    db_session.add_all([superuser, org_admin, org_user])
    await db_session.commit()
    
    await db_session.refresh(org1)
    await db_session.refresh(org2)
    await db_session.refresh(superuser)
    await db_session.refresh(org_admin)
    await db_session.refresh(org_user)
    
    return org1, org2, superuser, org_admin, org_user

@pytest.fixture
async def auth_superuser_client(client: AsyncClient, sample_admin_data) -> AsyncClient:
    _, _, superuser, _, _ = sample_admin_data
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "superuser@test.com",
            "password": "superpassword",
        }
    )
    assert response.status_code == 200
    tokens = response.json()
    client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
    return client

@pytest.fixture
async def auth_org_admin_client(client: AsyncClient, sample_admin_data) -> AsyncClient:
    _, _, _, org_admin, _ = sample_admin_data
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "orgadmin@test.com",
            "password": "password123",
        }
    )
    assert response.status_code == 200
    tokens = response.json()
    client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
    return client

@pytest.mark.anyio
async def test_get_admin_stats_as_superuser(auth_superuser_client: AsyncClient):
    response = await auth_superuser_client.get("/api/v1/admin/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_organizations"] == 2
    assert data["active_trials"] == 1
    assert data["total_users"] == 2 # org_admin and org_user (superuser doesn't belong to any org)
    assert data["avg_users_per_org"] == 1.0 # 2 users / 2 orgs = 1.0

@pytest.mark.anyio
async def test_get_admin_stats_denied_for_non_superuser(auth_org_admin_client: AsyncClient):
    response = await auth_org_admin_client.get("/api/v1/admin/stats")
    assert response.status_code == 403

@pytest.mark.anyio
async def test_get_organization_users_as_superuser(auth_superuser_client: AsyncClient, sample_admin_data):
    org1, _, _, _, _ = sample_admin_data
    response = await auth_superuser_client.get(f"/api/v1/admin/organizations/{org1.public_id}/users")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    items = data["items"]
    usernames = [u["username"] for u in items]
    assert "orgadmin" in usernames
    assert "orguser" in usernames

@pytest.mark.anyio
async def test_get_organization_users_denied_for_non_superuser(auth_org_admin_client: AsyncClient, sample_admin_data):
    org1, _, _, _, _ = sample_admin_data
    response = await auth_org_admin_client.get(f"/api/v1/admin/organizations/{org1.public_id}/users")
    assert response.status_code == 403
