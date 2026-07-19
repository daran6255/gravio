import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User, UserRole
from app.models.project import Project, ProjectTask, ProjectTaskStatus
from app.core.security import get_password_hash
from app.services.project import ProjectService


@pytest.fixture
async def project_test_data(db_session: AsyncSession):
    # Create test organization
    from app.models.organization import Organization
    org = Organization(name="Project Org", subscription_status="trial")
    db_session.add(org)
    await db_session.flush()

    # User with PM module access (PROJECT_COORDINATOR role has PM module access and status write permissions)
    pm_user = User(
        email="pm@projecttest.com",
        username="pm_user",
        full_name="PM User",
        hashed_password=get_password_hash("password123"),
        organization_id=org.id,
        role=UserRole.PROJECT_COORDINATOR,
        is_active=True,
        is_verified=True,
    )
    db_session.add(pm_user)
    await db_session.commit()
    await db_session.refresh(pm_user)
    return org, pm_user


@pytest.fixture
async def auth_pm_client(client: AsyncClient, project_test_data) -> AsyncClient:
    _, pm_user = project_test_data
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": pm_user.email,
            "password": "password123"
        }
    )
    token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.mark.asyncio
async def test_create_project_default_stages(auth_pm_client: AsyncClient, db_session: AsyncSession, project_test_data):
    org, pm_user = project_test_data
    
    # Create a project without template key or custom stages
    response = await auth_pm_client.post(
        "/api/v1/projects",
        json={
            "name": "Blank Project",
            "description": "A blank project",
            "currency": "USD",
            "status": "planning"
        }
    )
    assert response.status_code == 201
    proj_data = response.json()
    assert proj_data["name"] == "Blank Project"
    
    # Check that default stages were seeded
    proj_public_id = proj_data["public_id"]
    result = await db_session.execute(
        select(Project).where(Project.public_id == uuid.UUID(proj_public_id))
    )
    project = result.scalar_one()
    
    result_statuses = await db_session.execute(
        select(ProjectTaskStatus).where(ProjectTaskStatus.project_id == project.id).order_by(ProjectTaskStatus.order)
    )
    statuses = result_statuses.scalars().all()
    assert len(statuses) == 10  # DEFAULT_STAGE_PRESET length is 10
    assert statuses[0].name == "Planning"


@pytest.mark.asyncio
async def test_create_project_custom_stages(auth_pm_client: AsyncClient, db_session: AsyncSession, project_test_data):
    org, pm_user = project_test_data
    
    # Create a project with custom stages
    response = await auth_pm_client.post(
        "/api/v1/projects",
        json={
            "name": "Custom Stage Project",
            "description": "A project with custom stages",
            "currency": "USD",
            "status": "planning",
            "custom_stages": [
                {"name": "Stage A", "order": 0, "color": "#111111", "is_initial_status": True},
                {"name": "Stage B", "order": 1, "color": "#222222", "is_done_status": True}
            ]
        }
    )
    assert response.status_code == 201
    proj_data = response.json()
    proj_public_id = proj_data["public_id"]
    
    result = await db_session.execute(
        select(Project).where(Project.public_id == uuid.UUID(proj_public_id))
    )
    project = result.scalar_one()
    
    result_statuses = await db_session.execute(
        select(ProjectTaskStatus).where(ProjectTaskStatus.project_id == project.id).order_by(ProjectTaskStatus.order)
    )
    statuses = result_statuses.scalars().all()
    assert len(statuses) == 2
    assert statuses[0].name == "Stage A"
    assert statuses[0].is_initial_status is True
    assert statuses[1].name == "Stage B"
    assert statuses[1].is_done_status is True


@pytest.mark.asyncio
async def test_update_stages_and_reassign_tasks(auth_pm_client: AsyncClient, db_session: AsyncSession, project_test_data):
    org, pm_user = project_test_data
    
    # Create project with Stage A and Stage B
    response = await auth_pm_client.post(
        "/api/v1/projects",
        json={
            "name": "Reassignment Project",
            "currency": "USD",
            "custom_stages": [
                {"name": "Stage A", "order": 0, "color": "#111111", "is_initial_status": True},
                {"name": "Stage B", "order": 1, "color": "#222222", "is_done_status": True}
            ]
        }
    )
    proj_data = response.json()
    proj_public_id = proj_data["public_id"]
    
    result = await db_session.execute(select(Project).where(Project.public_id == uuid.UUID(proj_public_id)))
    project = result.scalar_one()
    
    # Get statuses
    result_statuses = await db_session.execute(
        select(ProjectTaskStatus).where(ProjectTaskStatus.project_id == project.id).order_by(ProjectTaskStatus.order)
    )
    statuses = result_statuses.scalars().all()
    stage_a_id = statuses[0].id
    stage_b_id = statuses[1].id
    
    # Create a task in Stage B
    task_response = await auth_pm_client.post(
        f"/api/v1/projects/{proj_public_id}/tasks",
        json={
            "title": "Task 1",
            "status_id": stage_b_id,
            "priority": "medium"
        }
    )
    assert task_response.status_code == 201
    task_id = task_response.json()["id"]
    
    # Update stages: delete Stage B, keep Stage A
    # Stage B is not in the list, so it will be deleted, and its tasks should move to Stage A (fallback).
    update_response = await auth_pm_client.patch(
        f"/api/v1/projects/{proj_public_id}/task-statuses",
        json={
            "statuses": [
                {"id": stage_a_id, "name": "Stage A", "order": 0, "color": "#111111", "is_initial_status": True}
            ]
        }
    )
    assert update_response.status_code == 200
    
    # Verify task was reassigned to Stage A
    db_session.expire_all()
    task_result = await db_session.execute(
        select(ProjectTask).where(ProjectTask.id == task_id)
    )
    task = task_result.scalar_one()
    assert task.status_id == stage_a_id


@pytest.mark.asyncio
async def test_add_task_comment(auth_pm_client: AsyncClient, db_session: AsyncSession, project_test_data):
    org, pm_user = project_test_data
    
    # 1. Create a project
    response = await auth_pm_client.post(
        "/api/v1/projects",
        json={
            "name": "Comment Project",
            "currency": "USD",
        }
    )
    proj_data = response.json()
    proj_public_id = proj_data["public_id"]
    
    # 2. Get initial status
    result = await db_session.execute(select(Project).where(Project.public_id == uuid.UUID(proj_public_id)))
    project = result.scalar_one()
    result_statuses = await db_session.execute(
        select(ProjectTaskStatus).where(ProjectTaskStatus.project_id == project.id).order_by(ProjectTaskStatus.order)
    )
    statuses = result_statuses.scalars().all()
    initial_status_id = statuses[0].id
    
    # 3. Create a task
    task_response = await auth_pm_client.post(
        f"/api/v1/projects/{proj_public_id}/tasks",
        json={
            "title": "Task with comments",
            "status_id": initial_status_id,
            "priority": "medium"
        }
    )
    assert task_response.status_code == 201
    task_data = task_response.json()
    task_public_id = task_data["public_id"]
    
    # 4. Post comment
    comment_response = await auth_pm_client.post(
        f"/api/v1/project-tasks/{task_public_id}/comments",
        json={
            "content": "This is a **test** comment with formatting."
        }
    )
    assert comment_response.status_code == 201
    comment_data = comment_response.json()
    assert comment_data["action"] == "comment"
    assert comment_data["new_value"] == "This is a **test** comment with formatting."
    assert comment_data["changed_by_user_id"] == pm_user.id
    
    # 5. Verify the comment appears in task history
    history_response = await auth_pm_client.get(
        f"/api/v1/project-tasks/{task_public_id}/history"
    )
    assert history_response.status_code == 200
    history_data = history_response.json()
    history_items = history_data["items"]
    # Check that the comment is in the items
    comment_entries = [item for item in history_items if item["action"] == "comment"]
    assert len(comment_entries) == 1
    assert comment_entries[0]["new_value"] == "This is a **test** comment with formatting."
