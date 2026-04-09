"""Health check + SDK discovery endpoint tests."""

import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_cubes_discovery(client):
    """SDK discovery: /api/v1/cubes returns all 9 cubes."""
    response = await client.get("/api/v1/cubes")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 9
    assert len(data["cubes"]) == 9

    # Verify cube IDs are 1-9
    ids = [c["id"] for c in data["cubes"]]
    assert ids == list(range(1, 10))

    # Every cube has required fields
    for cube in data["cubes"]:
        assert "name" in cube
        assert "endpoints" in cube
        assert "events" in cube
        assert "mvp" in cube
        assert "status" in cube
