"""Usage metering — model, record/summarize service (metric whitelist, stable shape), router."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core import usage_service as svc
from app.core.auth import CurrentUser, get_current_principal, get_current_user
from app.main import app
from app.models.usage_record import USAGE_METRICS, UsageRecord


def _db():
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    return db


class TestModel:
    def test_table_columns(self):
        assert UsageRecord.__tablename__ == "usage_records"
        for c in ("org_id", "metric", "quantity", "cost_tokens", "occurred_at"):
            assert c in UsageRecord.__table__.c


class TestRecord:
    @pytest.mark.asyncio
    async def test_records_known_metric(self):
        rec = await svc.record_usage(_db(), org_id="o", metric="api_call", cost_tokens=0.5)
        assert rec.org_id == "o" and rec.metric == "api_call" and rec.cost_tokens == 0.5
        assert rec.occurred_at is not None

    @pytest.mark.asyncio
    async def test_unknown_metric_rejected(self):
        with pytest.raises(ValueError):
            await svc.record_usage(_db(), org_id="o", metric="mining_bitcoin")

    @pytest.mark.asyncio
    async def test_negative_quantity_clamped(self):
        rec = await svc.record_usage(_db(), org_id="o", metric="export", quantity=-3)
        assert rec.quantity == 0


class TestSummarize:
    def _db_rows(self, rows):
        db = _db()
        res = MagicMock()
        res.all.return_value = rows
        db.execute = AsyncMock(return_value=res)
        return db

    @pytest.mark.asyncio
    async def test_stable_shape_every_metric_present(self):
        db = self._db_rows([("api_call", 10, 5.0), ("export", 2, 1.98)])
        out = await svc.summarize_usage(db, org_id="o")
        # every declared metric appears (0 when unused) → stable billing shape
        assert set(out["by_metric"]) >= set(USAGE_METRICS)
        assert out["by_metric"]["api_call"] == {"quantity": 10, "cost_tokens": 5.0}
        assert out["by_metric"]["webhook_delivery"] == {"quantity": 0, "cost_tokens": 0.0}
        assert out["total_quantity"] == 12 and out["total_cost_tokens"] == 6.98

    @pytest.mark.asyncio
    async def test_empty_usage_is_zeroed(self):
        out = await svc.summarize_usage(self._db_rows([]), org_id="o")
        assert out["total_quantity"] == 0 and out["total_cost_tokens"] == 0.0
        assert all(v == {"quantity": 0, "cost_tokens": 0.0} for v in out["by_metric"].values())

    @pytest.mark.asyncio
    async def test_summary_carries_billable_cost(self):
        # ai_inference 10 × 0.50 ◬ = 5.0 ◬ = $0.005 (price table, not recorded cost_tokens)
        db = self._db_rows([("ai_inference", 10, 0.0)])
        out = await svc.summarize_usage(db, org_id="o")
        cost = out["cost"]
        assert cost["by_metric"]["ai_inference"]["cost_tokens"] == 5.0
        assert cost["billable_tokens"] == 5.0
        assert cost["estimated_usd"] == round(5.0 * svc.TOKEN_USD_RATE, 4)


class TestEstimateCost:
    def test_price_table_is_authoritative(self):
        # Two metrics priced independently of any recorded cost_tokens; totals sum.
        out = svc.estimate_cost({
            "api_call": {"quantity": 100},        # 100 × 0.01 = 1.0
            "webhook_delivery": {"quantity": 3},  #   3 × 0.99 = 2.97
        })
        assert out["by_metric"]["api_call"]["cost_tokens"] == 1.0
        assert out["by_metric"]["webhook_delivery"]["cost_tokens"] == 2.97
        assert out["billable_tokens"] == 3.97
        assert out["token_usd_rate"] == svc.TOKEN_USD_RATE

    def test_every_priced_metric_present_and_zeroed(self):
        out = svc.estimate_cost({})
        assert set(out["by_metric"]) == set(svc.USAGE_PRICES)
        assert out["billable_tokens"] == 0.0 and out["estimated_usd"] == 0.0
        assert all(v["cost_tokens"] == 0.0 for v in out["by_metric"].values())


# ── Router ──────────────────────────────────────────────────────────────
def _as(role):
    return CurrentUser(user_id=f"{role}-1", email=None, role=role, permissions=[])


def _override(u):
    async def _o():
        return u
    app.dependency_overrides[get_current_user] = _o
    app.dependency_overrides[get_current_principal] = _o


def _clear():
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_principal, None)


class TestRouter:
    @pytest.mark.asyncio
    async def test_usage_forbidden_for_plain_user(self, client):
        _override(_as("user"))
        try:
            r = await client.get("/api/v1/usage")
            assert r.status_code == 403
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_usage_scoped_to_caller_org(self, client):
        _override(_as("moderator"))
        try:
            spy = AsyncMock(return_value={"org_id": "moderator-1", "by_metric": {}, "total_quantity": 0})
            with patch("app.core.usage_router.svc.summarize_usage", new=spy):
                r = await client.get("/api/v1/usage")
            assert r.status_code == 200
            assert spy.await_args.kwargs["org_id"] == "moderator-1"
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_api_key_principal_can_read_own_usage(self, client):
        # Headless-API: an org's API key (role "api_key") reads its own metered usage.
        _override(_as("api_key"))
        try:
            spy = AsyncMock(return_value={"org_id": "api_key-1", "by_metric": {}, "total_quantity": 0})
            with patch("app.core.usage_router.svc.summarize_usage", new=spy):
                r = await client.get("/api/v1/usage")
            assert r.status_code == 200
            assert spy.await_args.kwargs["org_id"] == "api_key-1"
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_bad_date_400(self, client):
        _override(_as("admin"))
        try:
            r = await client.get("/api/v1/usage?start=not-a-date")
            assert r.status_code == 400
        finally:
            _clear()

    @pytest.mark.asyncio
    async def test_end_before_start_400(self, client):
        _override(_as("moderator"))
        try:
            r = await client.get("/api/v1/usage?start=2026-07-02T00:00:00&end=2026-07-01T00:00:00")
            assert r.status_code == 400
        finally:
            _clear()
