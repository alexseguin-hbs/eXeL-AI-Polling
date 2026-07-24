"""Per-org API keys — model, service (hash-only storage, verify, revoke, expiry), router.

The full key is returned once and never stored (only a SHA-256 hash + display prefix).
authenticate resolves an active, non-expired key; revoked/expired/unknown keys resolve
to None. Router: management is JWT-role-gated, create returns the key once, listings redact.
"""

import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core import api_key_service as svc
from app.core.auth import CurrentUser, get_current_user
from app.main import app
from app.models.api_key import API_KEY_PREFIX, ApiKey


def _db():
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    return db


class TestModel:
    def test_table_and_columns(self):
        assert ApiKey.__tablename__ == "api_keys"
        for c in ("org_id", "key_prefix", "key_hash", "scopes", "is_active"):
            assert c in ApiKey.__table__.c
        assert ApiKey.__table__.c.key_hash.unique is True


class TestKeyGeneration:
    @pytest.mark.asyncio
    async def test_create_returns_full_key_and_stores_only_hash(self):
        rec, full = await svc.create_api_key(_db(), org_id="o1", name="CI", created_by="u1")
        assert full.startswith(API_KEY_PREFIX)
        assert rec.key_hash != full                      # never store the raw key
        assert len(rec.key_hash) == 64                   # sha256 hex
        assert full[:11] == rec.key_prefix               # prefix is a safe slice of the key
        assert rec.org_id == "o1" and rec.is_active is not False  # active (DB default True on insert)

    @pytest.mark.asyncio
    async def test_keys_are_unique(self):
        _, a = await svc.create_api_key(_db(), org_id="o", name="a", created_by="u")
        _, b = await svc.create_api_key(_db(), org_id="o", name="b", created_by="u")
        assert a != b


class TestAuthenticate:
    def _exec_returning(self, rec):
        db = _db()
        res = MagicMock()
        res.scalar_one_or_none.return_value = rec
        db.execute = AsyncMock(return_value=res)
        return db

    @pytest.mark.asyncio
    async def test_valid_key_resolves_and_stamps_last_used(self):
        rec = ApiKey(org_id="o", name="k", key_prefix="exel_x", key_hash="h",
                     is_active=True, created_by="u")
        db = self._exec_returning(rec)
        out = await svc.authenticate_api_key(db, f"{API_KEY_PREFIX}whatever")
        assert out is rec and rec.last_used_at is not None

    @pytest.mark.asyncio
    async def test_wrong_prefix_rejected_without_db(self):
        db = self._exec_returning(None)
        assert await svc.authenticate_api_key(db, "nope_123") is None
        db.execute.assert_not_called()   # short-circuits before any lookup

    @pytest.mark.asyncio
    async def test_revoked_key_rejected(self):
        rec = ApiKey(org_id="o", name="k", key_prefix="exel_x", key_hash="h",
                     is_active=False, created_by="u")
        out = await svc.authenticate_api_key(self._exec_returning(rec), f"{API_KEY_PREFIX}x")
        assert out is None

    @pytest.mark.asyncio
    async def test_expired_key_rejected(self):
        rec = ApiKey(org_id="o", name="k", key_prefix="exel_x", key_hash="h", is_active=True,
                     created_by="u", expires_at=datetime.now(timezone.utc) - timedelta(days=1))
        out = await svc.authenticate_api_key(self._exec_returning(rec), f"{API_KEY_PREFIX}x")
        assert out is None


# ── Router ────────────────────────────────────────────────────────────────
def _as(role):
    return CurrentUser(user_id=f"{role}-1", email=None, role=role, permissions=[])


def _override(u):
    async def _o():
        return u
    app.dependency_overrides[get_current_user] = _o


def _clear():
    app.dependency_overrides.pop(get_current_user, None)


class TestRouter:
    @pytest.mark.asyncio
    async def test_create_forbidden_for_plain_user(self, client):
        _override(_as("user"))
        try:
            r = await client.post("/api/v1/api-keys", json={"name": "k"})
            assert r.status_code == 403
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_create_returns_key_once(self, client):
        _override(_as("moderator"))
        try:
            rec = SimpleNamespace(id=uuid.uuid4(), org_id="moderator-1", name="CI",
                                  key_prefix="exel_abc123", scopes="*", is_active=True,
                                  created_at=None, last_used_at=None)
            with patch("app.core.api_key_router.svc.create_api_key",
                       new=AsyncMock(return_value=(rec, "exel_SECRET_ONCE"))):
                r = await client.post("/api/v1/api-keys", json={"name": "CI"})
            assert r.status_code == 201
            body = r.json()
            assert body["api_key"] == "exel_SECRET_ONCE"    # shown once
            assert body["key_prefix"] == "exel_abc123"
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_list_redacts_secret(self, client):
        _override(_as("moderator"))
        try:
            rec = SimpleNamespace(id=uuid.uuid4(), org_id="moderator-1", name="CI",
                                  key_prefix="exel_abc123", scopes="*", is_active=True,
                                  created_at=None, last_used_at=None)
            with patch("app.core.api_key_router.svc.list_api_keys", new=AsyncMock(return_value=[rec])):
                r = await client.get("/api/v1/api-keys")
            assert r.status_code == 200
            k = r.json()["api_keys"][0]
            assert "api_key" not in k and "key_hash" not in k   # never leak the secret/hash
            assert k["key_prefix"] == "exel_abc123"
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_revoke_404_when_absent(self, client):
        _override(_as("admin"))
        try:
            with patch("app.core.api_key_router.svc.revoke_api_key", new=AsyncMock(return_value=False)):
                r = await client.delete(f"/api/v1/api-keys/{uuid.uuid4()}")
            assert r.status_code == 404
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_empty_name_400(self, client):
        _override(_as("moderator"))
        try:
            r = await client.post("/api/v1/api-keys", json={"name": "  "})
            assert r.status_code == 400
        finally:
            _clear()


class TestResolvePrincipal:
    """The additive dual-auth resolver: API key OR JWT → principal (get_current_user unchanged)."""

    @pytest.mark.asyncio
    async def test_api_key_resolves_to_org_principal(self):
        from app.core import auth

        key = ApiKey(org_id="org-42", name="k", key_prefix="exel_x", key_hash="h",
                     is_active=True, created_by="u", scopes="sessions:write,rankings:read")
        with patch.object(auth, "_dev_mode", False), \
             patch("app.core.api_key_service.authenticate_api_key", new=AsyncMock(return_value=key)):
            p = await auth.resolve_principal(f"{API_KEY_PREFIX}live", AsyncMock())
        assert p.user_id == "org-42" and p.role == "api_key"
        assert p.permissions == ["sessions:write", "rankings:read"]

    @pytest.mark.asyncio
    async def test_invalid_api_key_401(self):
        from fastapi import HTTPException
        from app.core import auth

        with patch.object(auth, "_dev_mode", False), \
             patch("app.core.api_key_service.authenticate_api_key", new=AsyncMock(return_value=None)):
            with pytest.raises(HTTPException) as ei:
                await auth.resolve_principal(f"{API_KEY_PREFIX}bad", AsyncMock())
        assert ei.value.status_code == 401

    @pytest.mark.asyncio
    async def test_non_key_token_falls_back_to_jwt(self):
        from app.core import auth

        sentinel = CurrentUser(user_id="jwt-user", email=None, role="user", permissions=[])
        with patch.object(auth, "_dev_mode", False), \
             patch("app.core.auth._decode_token", new=AsyncMock(return_value=sentinel)):
            p = await auth.resolve_principal("a.jwt.token", AsyncMock())
        assert p is sentinel   # non-exel_ token → JWT path

    @pytest.mark.asyncio
    async def test_missing_token_401(self):
        from fastapi import HTTPException
        from app.core import auth

        with patch.object(auth, "_dev_mode", False):
            with pytest.raises(HTTPException) as ei:
                await auth.resolve_principal(None, AsyncMock())
        assert ei.value.status_code == 401
