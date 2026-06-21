import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.services.onboarding_checks import (
    normalize_org_name,
    levenshtein_distance,
    check_org_name_availability,
    check_username_availability,
    check_email_availability,
)

@pytest.fixture
async def seed_checks_data(db_session: AsyncSession):
    # Seed Organizations
    org = Organization(
        name="Edzolo",
        subscription_status="trial",
    )
    org2 = Organization(
        name="WinVinaya Infosystems",
        subscription_status="trial",
    )
    db_session.add_all([org, org2])
    await db_session.flush()

    # Seed User
    user = User(
        email="jane@edzolo.com",
        username="janedoe",
        full_name="Jane Doe",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    return org

@pytest.mark.asyncio
async def test_normalize_org_name():
    assert normalize_org_name("Edzolo Technologies") == "edzolo"
    assert normalize_org_name("Edzolo Pvt Ltd") == "edzolo"
    assert normalize_org_name("Edzolo Inc.") == "edzolo"
    assert normalize_org_name("Edzolo Solutions Co.") == "edzolo"
    assert normalize_org_name("Acme Corp") == "acme"
    assert normalize_org_name("Microsoft") == "microsoft"

@pytest.mark.asyncio
async def test_levenshtein_distance():
    assert levenshtein_distance("edzolo", "edzola") == 1
    assert levenshtein_distance("edzolo", "edzoloo") == 1
    assert levenshtein_distance("edzolo", "edzolo") == 0
    assert levenshtein_distance("edzolo", "apple") == 5

@pytest.mark.asyncio
async def test_check_org_name_availability(db_session: AsyncSession, seed_checks_data):
    # Exact duplicate
    res = await check_org_name_availability(db_session, "Edzolo")
    assert res["available"] is False
    assert res["similarity"] == "exact"

    # Logical duplicate (suffix invariant)
    res = await check_org_name_availability(db_session, "Edzolo Technologies")
    assert res["available"] is False
    assert res["similarity"] == "logical"
    assert res["matched_name"] == "Edzolo"

    # Logical duplicate (WinVinaya vs WinVinaya Infosystems)
    res = await check_org_name_availability(db_session, "WinVinaya")
    assert res["available"] is False
    assert res["similarity"] == "logical"
    assert res["matched_name"] == "WinVinaya Infosystems"

    # Fuzzy duplicate (Levenshtein distance <= 1)
    res = await check_org_name_availability(db_session, "Edzola")
    assert res["available"] is False
    assert res["similarity"] == "fuzzy"
    assert res["matched_name"] == "Edzolo"

    # Unique name
    res = await check_org_name_availability(db_session, "UniqueCompany")
    assert res["available"] is True

@pytest.mark.asyncio
async def test_check_username_availability(db_session: AsyncSession, seed_checks_data):
    # Taken username
    res = await check_username_availability(db_session, "janedoe")
    assert res["available"] is False
    assert res["exists"] is True
    assert len(res["suggestions"]) == 3
    for sug in res["suggestions"]:
        assert sug.startswith("janedoe")

    # Invalid format
    res = await check_username_availability(db_session, "ab")
    assert res["available"] is False
    assert "format" in res["message"] or "characters" in res["message"]

    res = await check_username_availability(db_session, "Jane@Doe")
    assert res["available"] is False

    # Available username - should STILL return suggestions
    res = await check_username_availability(db_session, "available_user")
    assert res["available"] is True
    assert len(res["suggestions"]) == 3

@pytest.mark.asyncio
async def test_check_email_availability(db_session: AsyncSession, seed_checks_data):
    # Taken email
    res = await check_email_availability(db_session, "jane@edzolo.com")
    assert res["available"] is False
    assert res["exists"] is True

    # Invalid format
    res = await check_email_availability(db_session, "invalidemail")
    assert res["available"] is False

    # Available email
    res = await check_email_availability(db_session, "new_user@test.com")
    assert res["available"] is True

@pytest.mark.asyncio
async def test_api_checks_routes(client: AsyncClient, db_session: AsyncSession, seed_checks_data):
    # Test Org Check endpoint
    response = await client.get("/api/v1/onboard/check-org?name=Edzolo+Technologies")
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is False
    assert data["similarity"] == "logical"

    # Test Username Check endpoint
    response = await client.get("/api/v1/onboard/check-username?username=janedoe")
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is False
    assert len(data["suggestions"]) == 3

    # Test Email Check endpoint
    response = await client.get("/api/v1/onboard/check-email?email=jane@edzolo.com")
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is False
