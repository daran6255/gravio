import pytest
from httpx import AsyncClient
from datetime import date as date_cls
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User, UserRole
from app.models.dsr_project import DSRProject
from app.models.dsr_activity import DSRActivity, DSRActivityStatus, activity_assignments
from app.core.security import get_password_hash, create_access_token
from app.api.deps import get_current_user

@pytest.mark.asyncio
async def test_project_visibility_by_role(client: AsyncClient, db_session: AsyncSession):
    # 1. Create Users
    admin_user = User(
        email="admin@test.com",
        username="admin",
        hashed_password=get_password_hash("testpass"),
        role=UserRole.ADMIN,
        is_active=True
    )
    trainer1 = User(
        email="trainer1@test.com",
        username="trainer1",
        hashed_password=get_password_hash("testpass"),
        role=UserRole.TRAINER,
        is_active=True
    )
    trainer2 = User(
        email="trainer2@test.com",
        username="trainer2",
        hashed_password=get_password_hash("testpass"),
        role=UserRole.TRAINER,
        is_active=True
    )
    db_session.add_all([admin_user, trainer1, trainer2])
    await db_session.commit()
    await db_session.refresh(admin_user)
    await db_session.refresh(trainer1)
    await db_session.refresh(trainer2)

    # 2. Create Projects
    project1 = DSRProject(
        name="Project Trainer 1 Owned",
        owner_id=trainer1.id,
        created_by=admin_user.id,
        is_active=True
    )
    project2 = DSRProject(
        name="Project Trainer 2 Owned",
        owner_id=trainer2.id,
        created_by=admin_user.id,
        is_active=True
    )
    db_session.add_all([project1, project2])
    await db_session.commit()
    await db_session.refresh(project1)
    await db_session.refresh(project2)

    # Helper to get token
    def get_token(user):
        return create_access_token(data={"sub": user.email})

    # Test Admin Visibility
    admin_token = get_token(admin_user)
    resp = await client.get("/api/v1/dsr/projects", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 2
    names = [i["name"] for i in items]
    assert "Project Trainer 1 Owned" in names
    assert "Project Trainer 2 Owned" in names

    # Test Trainer 1 Visibility (should only see project 1)
    t1_token = get_token(trainer1)
    resp = await client.get("/api/v1/dsr/projects", headers={"Authorization": f"Bearer {t1_token}"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["name"] == "Project Trainer 1 Owned"

    # 3. Test Assignment Visibility
    # Assign trainer 1 to an activity in project 2
    activity = DSRActivity(
        project_id=project2.id,
        name="Trainer 2 Activity but T1 assigned",
        start_date=date_cls(2024, 1, 1),
        end_date=date_cls(2024, 1, 31),
        status=DSRActivityStatus.PLANNED,
        is_active=True
    )
    db_session.add(activity)
    await db_session.commit()
    await db_session.refresh(activity)
    
    # Manual link in junction table
    await db_session.execute(
        activity_assignments.insert().values(activity_id=activity.id, user_id=trainer1.id)
    )
    await db_session.commit()

    # Now Trainer 1 should see BOTH projects
    resp = await client.get("/api/v1/dsr/projects", headers={"Authorization": f"Bearer {t1_token}"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 2
    names = [i["name"] for i in items]
    assert "Project Trainer 1 Owned" in names
    assert "Project Trainer 2 Owned" in names

    # 4. Test Single Project Access Check
    # Trainer 2 trying to access Project 1 (No access)
    t2_token = get_token(trainer2)
    resp = await client.get(f"/api/v1/dsr/projects/{project1.public_id}", headers={"Authorization": f"Bearer {t2_token}"})
    assert resp.status_code == 403

    # Trainer 1 trying to access Project 2 (Has access via assignment)
    resp = await client.get(f"/api/v1/dsr/projects/{project2.public_id}", headers={"Authorization": f"Bearer {t1_token}"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Project Trainer 2 Owned"

    # 5. Test Activity List Access Check
    # Trainer 2 trying to see activities of Project 1
    resp = await client.get(f"/api/v1/dsr/activities?project_public_id={project1.public_id}", headers={"Authorization": f"Bearer {t2_token}"})
    assert resp.status_code == 403

    # Trainer 1 trying to see activities of Project 2
    resp = await client.get(f"/api/v1/dsr/activities?project_public_id={project2.public_id}", headers={"Authorization": f"Bearer {t1_token}"})
    assert resp.status_code == 200
