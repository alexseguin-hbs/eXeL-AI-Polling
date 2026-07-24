"""Scoping REST API — router contract, auth gating, input validation, org isolation.

Service layer is patched (real CRUD needs a live DB); these lock the endpoint contract:
write endpoints require an elevated role (403 otherwise), inputs are validated (400),
a missing parent scope is 404, and every call is org-scoped to the authenticated user.
"""

import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from app.core.auth import CurrentUser, get_current_principal, get_current_user
from app.core.scoping_service import ScopeNotFound
from app.main import app


def _as(role: str) -> CurrentUser:
    return CurrentUser(user_id=f"{role}-1", email=f"{role}@x.com", role=role, permissions=[])


def _override(user: CurrentUser):
    async def _o():
        return user
    # Reads use get_current_principal (JWT OR API key); writes use get_current_user via
    # require_role — override both so the same principal drives every scoping endpoint.
    app.dependency_overrides[get_current_user] = _o
    app.dependency_overrides[get_current_principal] = _o


def _clear():
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_principal, None)


def _proj(**kw):
    base = dict(id=uuid.uuid4(), org_id="moderator-1", name="P", description=None,
                status="active", config={})
    base.update(kw)
    return SimpleNamespace(**base)


class TestAuthGating:
    @pytest.mark.asyncio
    async def test_create_project_forbidden_for_plain_user(self, client):
        _override(_as("user"))
        try:
            r = await client.post("/api/v1/scoping/projects", json={"name": "X"})
            assert r.status_code == 403
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_create_project_allowed_for_moderator(self, client):
        _override(_as("moderator"))
        try:
            with patch("app.core.scoping_router.svc.create_project",
                       new=AsyncMock(return_value=_proj(name="Checkout"))):
                r = await client.post("/api/v1/scoping/projects", json={"name": "Checkout"})
            assert r.status_code == 201
            assert r.json()["name"] == "Checkout" and r.json()["org_id"] == "moderator-1"
        finally:
            _clear()


class TestInputValidation:
    @pytest.mark.asyncio
    async def test_empty_name_rejected(self, client):
        _override(_as("admin"))
        try:
            r = await client.post("/api/v1/scoping/projects", json={"name": "   "})
            assert r.status_code == 400
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_bad_status_filter_rejected(self, client):
        _override(_as("moderator"))
        try:
            r = await client.get("/api/v1/scoping/projects?status=bogus")
            assert r.status_code == 400
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_non_uuid_path_422(self, client):
        _override(_as("moderator"))
        try:
            r = await client.post("/api/v1/scoping/projects/not-a-uuid/differentiators",
                                  json={"name": "d"})
            assert r.status_code == 422
        finally:
            _clear()


class TestHierarchyErrors:
    @pytest.mark.asyncio
    async def test_differentiator_missing_project_404(self, client):
        _override(_as("moderator"))
        try:
            with patch("app.core.scoping_router.svc.create_differentiator",
                       new=AsyncMock(side_effect=ScopeNotFound("no project"))):
                r = await client.post(
                    f"/api/v1/scoping/projects/{uuid.uuid4()}/differentiators",
                    json={"name": "d"})
            assert r.status_code == 404
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_specification_missing_differentiator_404(self, client):
        _override(_as("moderator"))
        try:
            with patch("app.core.scoping_router.svc.create_specification",
                       new=AsyncMock(side_effect=ScopeNotFound("no differentiator"))):
                r = await client.post(
                    f"/api/v1/scoping/differentiators/{uuid.uuid4()}/specifications",
                    json={"name": "s"})
            assert r.status_code == 404
        finally:
            _clear()


class TestOrgScoping:
    @pytest.mark.asyncio
    async def test_list_is_scoped_to_caller_org(self, client):
        _override(_as("moderator"))
        try:
            spy = AsyncMock(return_value=[])
            with patch("app.core.scoping_router.svc.list_projects", new=spy):
                r = await client.get("/api/v1/scoping/projects")
            assert r.status_code == 200 and r.json() == {"projects": []}
            # org_id passed to the service is the caller's user_id (v1 isolation)
            assert spy.await_args.kwargs["org_id"] == "moderator-1"
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_tree_scoped_and_404_on_foreign(self, client):
        _override(_as("moderator"))
        try:
            with patch("app.core.scoping_router.svc.get_scope_tree",
                       new=AsyncMock(side_effect=ScopeNotFound("foreign"))):
                r = await client.get(f"/api/v1/scoping/projects/{uuid.uuid4()}/tree")
            assert r.status_code == 404
        finally:
            _clear()
