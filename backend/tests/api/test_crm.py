import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User, UserRole
from app.models.crm import CRMCompany, CRMContact, CRMLead, CRMDeal, CRMPipeline, CRMActivity, LeadStatus, DealStatus
from app.core.security import get_password_hash
from app.services.crm import CRMService


@pytest.fixture
async def crm_test_data(db_session: AsyncSession):
    # Create test organization
    from app.models.organization import Organization
    org = Organization(name="CRM Org", subscription_status="trial")
    db_session.add(org)
    await db_session.flush()

    # Seed default pipeline & stages
    await CRMService.seed_default_pipeline(db_session, org.id)

    # CRM-authorized user (Marketing role)
    marketing = User(
        email="marketing@crmtest.com",
        username="mktg_crm",
        full_name="Marketing User",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.MARKETING,
        is_active=True,
        is_verified=True,
    )
    
    # Non-authorized user (Developer role, which is not in require_crm_access)
    dev = User(
        email="dev@crmtest.com",
        username="dev_crm",
        full_name="Developer User",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.DEVELOPER,
        is_active=True,
        is_verified=True,
    )

    # Admin role — has CRM access plus pipeline management rights
    admin = User(
        email="admin@crmtest.com",
        username="admin_crm",
        full_name="Admin User",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.ADMIN,
        is_active=True,
        is_verified=True,
    )

    db_session.add_all([marketing, dev, admin])
    await db_session.commit()
    await db_session.refresh(marketing)
    await db_session.refresh(dev)
    await db_session.refresh(admin)
    return org, marketing, dev, admin


@pytest.fixture
async def auth_crm_client(client: AsyncClient, crm_test_data) -> AsyncClient:
    _, marketing, _, _ = crm_test_data
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "marketing@crmtest.com",
            "password": "password123",
        }
    )
    assert response.status_code == 200
    tokens = response.json()
    client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
    return client


@pytest.fixture
async def auth_no_crm_client(client: AsyncClient, crm_test_data) -> AsyncClient:
    _, _, dev, _ = crm_test_data
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "dev@crmtest.com",
            "password": "password123",
        }
    )
    assert response.status_code == 200
    tokens = response.json()
    # Create new client headers
    client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
    return client


@pytest.fixture
async def auth_admin_crm_client(client: AsyncClient, crm_test_data) -> AsyncClient:
    _, _, _, admin = crm_test_data
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@crmtest.com",
            "password": "password123",
        }
    )
    assert response.status_code == 200
    tokens = response.json()
    client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
    return client


@pytest.mark.anyio
async def test_crm_access_restricted(auth_no_crm_client: AsyncClient):
    # Developer user should get 403 Forbidden
    response = await auth_no_crm_client.get("/api/v1/crm/dashboard/stats")
    assert response.status_code == 403


@pytest.mark.anyio
async def test_crm_complete_lifecycle(auth_crm_client: AsyncClient, db_session: AsyncSession):
    # 1. Check dashboard stats initially
    response = await auth_crm_client.get("/api/v1/crm/dashboard/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_active_leads"] == 0
    assert stats["total_deal_value"] == 0.0

    # 2. Check default pipeline seeding
    response = await auth_crm_client.get("/api/v1/crm/pipelines")
    assert response.status_code == 200
    pipelines = response.json()
    assert len(pipelines) > 0
    default_pipeline = pipelines[0]
    assert default_pipeline["is_default"] is True
    assert len(default_pipeline["stages"]) == 7

    new_stage = default_pipeline["stages"][0]
    assert new_stage["name"] == "New"

    # 3. Create Company
    response = await auth_crm_client.post(
        "/api/v1/crm/companies",
        json={
            "name": "Acme Corp",
            "industry": "Technology",
            "website": "https://acme.org",
            "phone": "555-0199",
            "email": "info@acme.org",
            "size": "medium",
            "status": "prospect",
        }
    )
    assert response.status_code == 201
    company_data = response.json()
    assert company_data["name"] == "Acme Corp"
    company_id = company_data["id"]
    company_public_id = company_data["public_id"]

    # 4. Create Contact linked to Company
    response = await auth_crm_client.post(
        "/api/v1/crm/contacts",
        json={
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@acme.org",
            "phone": "555-0200",
            "company_id": company_id,
            "job_title": "Purchasing Manager",
        }
    )
    assert response.status_code == 201
    contact_data = response.json()
    assert contact_data["first_name"] == "John"
    assert contact_data["company_id"] == company_id
    contact_id = contact_data["id"]
    contact_public_id = contact_data["public_id"]

    # 5. Create Lead
    response = await auth_crm_client.post(
        "/api/v1/crm/leads",
        json={
            "title": "Software redesign deal",
            "contact_id": contact_id,
            "company_id": company_id,
            "source": "website",
            "estimated_value": 15000.0,
            "currency": "USD",
            "description": "Needs standard Vite+FastAPI setup.",
        }
    )
    assert response.status_code == 201
    lead_data = response.json()
    assert lead_data["title"] == "Software redesign deal"
    lead_public_id = lead_data["public_id"]
    lead_id = lead_data["id"]

    # Check lead list
    response = await auth_crm_client.get("/api/v1/crm/leads")
    assert response.status_code == 200
    leads_list = response.json()
    assert leads_list["total"] == 1
    assert leads_list["items"][0]["title"] == "Software redesign deal"

    # Check dashboard shows active lead
    response = await auth_crm_client.get("/api/v1/crm/dashboard/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_active_leads"] == 1

    # 6. Convert Lead to Deal
    response = await auth_crm_client.post(
        f"/api/v1/crm/leads/{lead_public_id}/convert",
        json={
            "pipeline_id": default_pipeline["id"],
            "stage_id": new_stage["id"],
            "deal_title": "Acme - Enterprise Redesign Project",
            "value": 18000.0,
        }
    )
    assert response.status_code == 200
    deal_data = response.json()
    assert deal_data["title"] == "Acme - Enterprise Redesign Project"
    assert deal_data["value"] == 18000.0
    assert deal_data["lead_id"] == lead_id
    deal_public_id = deal_data["public_id"]
    deal_id = deal_data["id"]

    # Verify lead status updated to converted
    response = await auth_crm_client.get(f"/api/v1/crm/leads/{lead_public_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "converted"

    # Verify dashboard stats show deal value
    response = await auth_crm_client.get("/api/v1/crm/dashboard/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_active_leads"] == 0  # converted lead is not active
    assert stats["total_deal_value"] == 18000.0

    # 7. Create Activity (Task) against Deal
    response = await auth_crm_client.post(
        "/api/v1/crm/activities",
        json={
            "type": "task",
            "subject": "Follow up on proposal",
            "entity_type": "deal",
            "entity_id": deal_id,
            "description": "Send email follow up.",
        }
    )
    assert response.status_code == 201
    act_data = response.json()
    assert act_data["subject"] == "Follow up on proposal"
    act_public_id = act_data["public_id"]

    # List activities
    response = await auth_crm_client.get(
        "/api/v1/crm/activities",
        params={"entity_type": "deal", "entity_id": deal_id}
    )
    assert response.status_code == 200
    act_list = response.json()
    assert act_list["total"] == 1
    assert act_list["items"][0]["subject"] == "Follow up on proposal"

    # Update Activity to complete
    response = await auth_crm_client.patch(
        f"/api/v1/crm/activities/{act_public_id}",
        json={"is_completed": True, "outcome": "Proposal sent via email."}
    )
    assert response.status_code == 200
    assert response.json()["is_completed"] is True
    assert response.json()["outcome"] == "Proposal sent via email."

    # Update Deal stage (move on Kanban)
    proposal_stage = default_pipeline["stages"][3]  # Proposal Sent
    response = await auth_crm_client.patch(
        f"/api/v1/crm/deals/{deal_public_id}",
        json={"stage_id": proposal_stage["id"]}
    )
    assert response.status_code == 200
    updated_deal = response.json()
    assert updated_deal["stage_id"] == proposal_stage["id"]
    assert updated_deal["probability"] == proposal_stage["probability"]

    # Delete Deal
    response = await auth_crm_client.delete(f"/api/v1/crm/deals/{deal_public_id}")
    assert response.status_code == 204

    # Verify deleted
    response = await auth_crm_client.get(f"/api/v1/crm/deals/{deal_public_id}")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_list_deals_filters_by_company_and_contact(auth_crm_client: AsyncClient):
    """Deals list must support narrowing to a single company/contact for detail-page widgets."""
    response = await auth_crm_client.post("/api/v1/crm/companies", json={"name": "Initech"})
    assert response.status_code == 201
    company_id = response.json()["id"]

    response = await auth_crm_client.post(
        "/api/v1/crm/contacts", json={"first_name": "Peter", "company_id": company_id}
    )
    assert response.status_code == 201
    contact_id = response.json()["id"]

    response = await auth_crm_client.get("/api/v1/crm/pipelines")
    pipeline = response.json()[0]

    response = await auth_crm_client.post(
        "/api/v1/crm/deals",
        json={
            "title": "Initech Deal",
            "company_id": company_id,
            "contact_id": contact_id,
            "pipeline_id": pipeline["id"],
            "stage_id": pipeline["stages"][0]["id"],
        },
    )
    assert response.status_code == 201

    # An unrelated deal that should not show up in either filtered result
    response = await auth_crm_client.post(
        "/api/v1/crm/deals",
        json={
            "title": "Unrelated Deal",
            "pipeline_id": pipeline["id"],
            "stage_id": pipeline["stages"][0]["id"],
        },
    )
    assert response.status_code == 201

    response = await auth_crm_client.get("/api/v1/crm/deals", params={"company_id": company_id})
    assert response.status_code == 200
    by_company = response.json()
    assert by_company["total"] == 1
    assert by_company["items"][0]["title"] == "Initech Deal"

    response = await auth_crm_client.get("/api/v1/crm/deals", params={"contact_id": contact_id})
    assert response.status_code == 200
    by_contact = response.json()
    assert by_contact["total"] == 1
    assert by_contact["items"][0]["title"] == "Initech Deal"


@pytest.mark.anyio
async def test_update_deal_rejects_cross_org_stage(auth_crm_client: AsyncClient, db_session: AsyncSession):
    """A deal must not be movable to a pipeline stage owned by a different organization."""
    from app.models.organization import Organization

    # Seed a second organization with its own pipeline/stage
    other_org = Organization(name="Other Org", subscription_status="trial")
    db_session.add(other_org)
    await db_session.flush()
    other_pipeline = await CRMService.seed_default_pipeline(db_session, other_org.id)
    await db_session.commit()

    from app.models.crm import CRMPipelineStage
    stage_result = await db_session.execute(
        select(CRMPipelineStage)
        .where(CRMPipelineStage.pipeline_id == other_pipeline.id)
        .order_by(CRMPipelineStage.order)
    )
    other_stage_id = stage_result.scalars().first().id

    # Set up a company/lead/deal in the authenticated org
    response = await auth_crm_client.post(
        "/api/v1/crm/companies", json={"name": "Globex"}
    )
    assert response.status_code == 201

    response = await auth_crm_client.get("/api/v1/crm/pipelines")
    own_pipeline = response.json()[0]

    response = await auth_crm_client.post(
        "/api/v1/crm/deals",
        json={
            "title": "Own Org Deal",
            "pipeline_id": own_pipeline["id"],
            "stage_id": own_pipeline["stages"][0]["id"],
        },
    )
    assert response.status_code == 201
    deal_public_id = response.json()["public_id"]

    # Attempt to move the deal to a stage belonging to the other organization
    response = await auth_crm_client.patch(
        f"/api/v1/crm/deals/{deal_public_id}",
        json={"stage_id": other_stage_id},
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_pipeline_management_requires_admin_or_manager(auth_crm_client: AsyncClient):
    # Marketing role has CRM access but not pipeline management rights
    response = await auth_crm_client.post(
        "/api/v1/crm/pipelines",
        json={"name": "Partnerships", "stages": []},
    )
    assert response.status_code == 403


@pytest.mark.anyio
async def test_create_pipeline_with_stages(auth_admin_crm_client: AsyncClient):
    response = await auth_admin_crm_client.post(
        "/api/v1/crm/pipelines",
        json={
            "name": "Partnerships",
            "stages": [
                {"name": "Outreach", "order": 0, "probability": 10},
                {"name": "Signed", "order": 1, "probability": 100, "is_won_stage": True},
            ],
        },
    )
    assert response.status_code == 201
    pipeline = response.json()
    assert pipeline["name"] == "Partnerships"
    assert len(pipeline["stages"]) == 2
    assert pipeline["stages"][1]["is_won_stage"] is True


@pytest.mark.anyio
async def test_update_pipeline_stages_add_edit_reorder_delete(auth_admin_crm_client: AsyncClient):
    response = await auth_admin_crm_client.get("/api/v1/crm/pipelines")
    pipeline = response.json()[0]
    stages = pipeline["stages"]
    assert len(stages) == 7  # default seeded pipeline

    keep_stage = stages[0]
    rename_stage = stages[1]

    # Keep stage 0 unchanged, rename+reprobability stage 1, drop the rest, add one new stage.
    response = await auth_admin_crm_client.patch(
        f"/api/v1/crm/pipelines/{pipeline['id']}/stages",
        json={
            "stages": [
                {
                    "id": keep_stage["id"],
                    "name": keep_stage["name"],
                    "order": 0,
                    "probability": keep_stage["probability"],
                    "color": keep_stage["color"],
                },
                {
                    "id": rename_stage["id"],
                    "name": "Renamed Stage",
                    "order": 1,
                    "probability": 55,
                    "color": "#123456",
                },
                {"name": "Brand New Stage", "order": 2, "probability": 80},
            ]
        },
    )
    assert response.status_code == 200
    updated = response.json()
    assert len(updated["stages"]) == 3
    names = {s["name"] for s in updated["stages"]}
    assert names == {keep_stage["name"], "Renamed Stage", "Brand New Stage"}
    renamed = next(s for s in updated["stages"] if s["name"] == "Renamed Stage")
    assert renamed["probability"] == 55
    assert renamed["id"] == rename_stage["id"]


@pytest.mark.anyio
async def test_delete_stage_with_active_deal_is_rejected(auth_admin_crm_client: AsyncClient):
    response = await auth_admin_crm_client.get("/api/v1/crm/pipelines")
    pipeline = response.json()[0]
    occupied_stage = pipeline["stages"][0]
    untouched_stage = pipeline["stages"][1]

    response = await auth_admin_crm_client.post(
        "/api/v1/crm/deals",
        json={
            "title": "Deal blocking stage deletion",
            "pipeline_id": pipeline["id"],
            "stage_id": occupied_stage["id"],
        },
    )
    assert response.status_code == 201

    # Try to update stages without including the occupied stage -> should be rejected, not silently dropped
    response = await auth_admin_crm_client.patch(
        f"/api/v1/crm/pipelines/{pipeline['id']}/stages",
        json={"stages": [untouched_stage]},
    )
    assert response.status_code == 409

    # Pipeline must still have all its original stages since the operation was rolled back
    response = await auth_admin_crm_client.get("/api/v1/crm/pipelines")
    pipeline_after = next(p for p in response.json() if p["id"] == pipeline["id"])
    assert len(pipeline_after["stages"]) == len(pipeline["stages"])


@pytest.mark.anyio
async def test_dashboard_stats_include_conversion_rate_and_my_tasks(
    auth_crm_client: AsyncClient, crm_test_data
):
    _, marketing, _, _ = crm_test_data

    # One lead converts, one stays open -> 50% conversion rate
    response = await auth_crm_client.post("/api/v1/crm/leads", json={"title": "Lead A"})
    lead_a = response.json()
    response = await auth_crm_client.post("/api/v1/crm/leads", json={"title": "Lead B"})
    assert response.status_code == 201

    response = await auth_crm_client.get("/api/v1/crm/pipelines")
    pipeline = response.json()[0]
    response = await auth_crm_client.post(
        f"/api/v1/crm/leads/{lead_a['public_id']}/convert",
        json={"pipeline_id": pipeline["id"], "stage_id": pipeline["stages"][0]["id"]},
    )
    assert response.status_code == 200

    # A task owned by the requesting user should surface in "my tasks"
    response = await auth_crm_client.post(
        "/api/v1/crm/activities",
        json={
            "type": "task",
            "subject": "Call back prospect",
            "entity_type": "lead",
            "entity_id": lead_a["id"],
            "owner_id": marketing.id,
        },
    )
    assert response.status_code == 201

    response = await auth_crm_client.get("/api/v1/crm/dashboard/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["conversion_rate"] == 50.0
    assert len(stats["my_tasks"]) == 1
    assert stats["my_tasks"][0]["subject"] == "Call back prospect"


@pytest.mark.anyio
async def test_list_owners_endpoint(auth_crm_client: AsyncClient, crm_test_data):
    org, marketing, dev, admin = crm_test_data

    response = await auth_crm_client.get("/api/v1/crm/owners")
    assert response.status_code == 200
    owners = response.json()
    owner_ids = {o["id"] for o in owners}
    # All active org users are assignable, regardless of CRM access (e.g. dev)
    assert {marketing.id, dev.id, admin.id} <= owner_ids


@pytest.mark.anyio
async def test_bulk_update_leads_requires_admin_or_manager(auth_crm_client: AsyncClient):
    response = await auth_crm_client.post("/api/v1/crm/leads", json={"title": "Bulk Target"})
    lead_public_id = response.json()["public_id"]

    response = await auth_crm_client.patch(
        "/api/v1/crm/leads/bulk",
        json={"public_ids": [lead_public_id], "status": "qualified"},
    )
    assert response.status_code == 403


@pytest.mark.anyio
async def test_bulk_update_leads_reassigns_owner_and_status(
    auth_admin_crm_client: AsyncClient, crm_test_data
):
    _, marketing, _, admin = crm_test_data

    response = await auth_admin_crm_client.post("/api/v1/crm/leads", json={"title": "Lead One"})
    lead_one = response.json()["public_id"]
    response = await auth_admin_crm_client.post("/api/v1/crm/leads", json={"title": "Lead Two"})
    lead_two = response.json()["public_id"]

    response = await auth_admin_crm_client.patch(
        "/api/v1/crm/leads/bulk",
        json={"public_ids": [lead_one, lead_two], "owner_id": marketing.id, "status": "qualified"},
    )
    assert response.status_code == 200
    updated = response.json()
    assert len(updated) == 2
    assert all(l["owner_id"] == marketing.id for l in updated)
    assert all(l["status"] == "qualified" for l in updated)

    # An unknown public_id mixed into the batch must reject the whole request, not partially apply
    response = await auth_admin_crm_client.patch(
        "/api/v1/crm/leads/bulk",
        json={"public_ids": [lead_one, str(uuid.uuid4())], "status": "contacted"},
    )
    assert response.status_code == 404


@pytest.mark.anyio
async def test_activities_feed_filters_by_type_and_date(auth_crm_client: AsyncClient):
    response = await auth_crm_client.post("/api/v1/crm/companies", json={"name": "FilterCo"})
    company_id = response.json()["id"]

    await auth_crm_client.post(
        "/api/v1/crm/activities",
        json={"type": "note", "subject": "A note", "entity_type": "company", "entity_id": company_id},
    )
    await auth_crm_client.post(
        "/api/v1/crm/activities",
        json={"type": "call", "subject": "A call", "entity_type": "company", "entity_id": company_id},
    )

    response = await auth_crm_client.get("/api/v1/crm/activities", params={"type": "call"})
    assert response.status_code == 200
    result = response.json()
    assert result["total"] == 1
    assert result["items"][0]["subject"] == "A call"

    # date_from in the far future should exclude everything just logged
    response = await auth_crm_client.get(
        "/api/v1/crm/activities", params={"date_from": "2999-01-01T00:00:00Z"}
    )
    assert response.status_code == 200
    assert response.json()["total"] == 0


@pytest.mark.anyio
async def test_crm_search_across_entities(auth_crm_client: AsyncClient):
    response = await auth_crm_client.post(
        "/api/v1/crm/companies", json={"name": "Zentron Industries"}
    )
    assert response.status_code == 201

    response = await auth_crm_client.post(
        "/api/v1/crm/contacts", json={"first_name": "Zentron", "last_name": "Rep"}
    )
    assert response.status_code == 201

    response = await auth_crm_client.post("/api/v1/crm/leads", json={"title": "Zentron expansion deal"})
    assert response.status_code == 201

    response = await auth_crm_client.get("/api/v1/crm/pipelines")
    pipeline = response.json()[0]
    response = await auth_crm_client.post(
        "/api/v1/crm/deals",
        json={
            "title": "Zentron renewal",
            "pipeline_id": pipeline["id"],
            "stage_id": pipeline["stages"][0]["id"],
        },
    )
    assert response.status_code == 201

    response = await auth_crm_client.get("/api/v1/crm/search", params={"q": "Zentron"})
    assert response.status_code == 200
    results = response.json()
    assert len(results["companies"]) == 1
    assert len(results["contacts"]) == 1
    assert len(results["leads"]) == 1
    assert len(results["deals"]) == 1
