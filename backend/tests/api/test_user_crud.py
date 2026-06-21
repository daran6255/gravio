import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.core.security import get_password_hash


@pytest.fixture
async def sample_org_and_users(db_session: AsyncSession):
    # Setup test organization (we don't strictly need a real organization table row in SQLite if it's not checked by get_by_id in deps, but let's make it consistent)
    from app.models.organization import Organization
    org = Organization(name="Test Org", subscription_status="trial")
    db_session.add(org)
    await db_session.flush()

    # Admin user
    admin = User(
        email="admin@test.com",
        username="admin_test",
        full_name="Admin Test",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    # Developer user (verified)
    dev = User(
        email="dev@test.com",
        username="dev_test",
        full_name="Dev Test",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.DEVELOPER,
        is_active=True,
        is_verified=True,
    )
    # Marketing user (unverified)
    marketing = User(
        email="mktg@test.com",
        username="mktg_test",
        full_name="Marketing Test",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.MARKETING,
        is_active=True,
        is_verified=False,
    )
    db_session.add_all([admin, dev, marketing])
    await db_session.commit()
    await db_session.refresh(admin)
    await db_session.refresh(dev)
    await db_session.refresh(marketing)
    return org, admin, dev, marketing


@pytest.fixture
async def auth_admin_client(client: AsyncClient, sample_org_and_users) -> AsyncClient:
    _, admin, _, _ = sample_org_and_users
    # Generate login token for admin
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@test.com",
            "password": "password123",
        }
    )
    assert response.status_code == 200
    tokens = response.json()
    client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
    return client


@pytest.mark.anyio
async def test_update_user_details(auth_admin_client: AsyncClient, sample_org_and_users, db_session: AsyncSession):
    _, _, dev, _ = sample_org_and_users

    response = await auth_admin_client.put(
        f"/api/v1/users/{dev.public_id}",
        json={
            "full_name": "Updated Dev Name",
            "role": "manager"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Dev Name"
    assert data["role"] == "manager"

    # Verify db state
    await db_session.refresh(dev)
    assert dev.full_name == "Updated Dev Name"
    assert dev.role == UserRole.MANAGER


@pytest.mark.anyio
async def test_update_user_conflict(auth_admin_client: AsyncClient, sample_org_and_users):
    _, _, dev, marketing = sample_org_and_users

    # Attempt to change dev's username to marketing's username
    response = await auth_admin_client.put(
        f"/api/v1/users/{dev.public_id}",
        json={
            "username": marketing.username
        }
    )
    assert response.status_code == 409  # Conflict


@pytest.mark.anyio
async def test_delete_unverified_user(auth_admin_client: AsyncClient, sample_org_and_users, db_session: AsyncSession):
    _, _, _, marketing = sample_org_and_users

    response = await auth_admin_client.delete(f"/api/v1/users/{marketing.public_id}")
    assert response.status_code == 200

    # Verify deleted in db
    result = await db_session.execute(select(User).where(User.id == marketing.id))
    assert result.scalars().first() is None


@pytest.mark.anyio
async def test_delete_verified_user(auth_admin_client: AsyncClient, sample_org_and_users, db_session: AsyncSession):
    _, _, dev, _ = sample_org_and_users

    response = await auth_admin_client.delete(f"/api/v1/users/{dev.public_id}")
    assert response.status_code == 200

    # Verify deleted in db
    result = await db_session.execute(select(User).where(User.id == dev.id))
    assert result.scalars().first() is None


@pytest.mark.anyio
async def test_admin_cannot_delete_self(auth_admin_client: AsyncClient, sample_org_and_users):
    _, admin, _, _ = sample_org_and_users

    response = await auth_admin_client.delete(f"/api/v1/users/{admin.public_id}")
    assert response.status_code == 400
    assert "cannot delete your own account" in response.json()["error"]["message"]


@pytest.mark.anyio
async def test_bulk_delete_users(auth_admin_client: AsyncClient, sample_org_and_users, db_session: AsyncSession):
    _, admin, dev, marketing = sample_org_and_users

    # Attempt to bulk delete dev, marketing, and self (admin)
    response = await auth_admin_client.post(
        "/api/v1/users/bulk-delete",
        json={
            "public_ids": [str(dev.public_id), str(marketing.public_id), str(admin.public_id)]
        }
    )
    assert response.status_code == 200
    data = response.json()
    # It should successfully delete dev and marketing, but skip admin (self)
    assert data["deleted_count"] == 2

    # Verify dev and marketing are deleted
    result = await db_session.execute(select(User).where(User.id.in_([dev.id, marketing.id])))
    assert len(result.scalars().all()) == 0

    # Verify admin is NOT deleted
    result_admin = await db_session.execute(select(User).where(User.id == admin.id))
    assert result_admin.scalars().first() is not None
