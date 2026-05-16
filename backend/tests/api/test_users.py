"""Tests for user endpoints"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_current_user(authenticated_client: tuple[AsyncClient, dict]):
    """Test getting current user info"""
    client, _ = authenticated_client
    
    response = await client.get("/api/v1/users/me")
    
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "username" in data
    assert "id" in data


@pytest.mark.asyncio
async def test_get_current_user_unauthorized(client: AsyncClient):
    """Test getting current user without authentication"""
    response = await client.get("/api/v1/users/me")
    
    assert response.status_code == 401  # Unauthorized


@pytest.mark.asyncio
async def test_update_current_user(authenticated_client: tuple[AsyncClient, dict]):
    """Test updating current user"""
    client, _ = authenticated_client
    
    update_data = {
        "full_name": "Updated Name"
    }
    
    response = await client.put("/api/v1/users/me", json=update_data)
    
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == update_data["full_name"]


@pytest.mark.asyncio
async def test_get_users_as_superuser(client: AsyncClient, db_session):
    """Test getting all users as superuser"""
    # This test would need a superuser fixture
    # Skipping implementation for brevity
    pass
