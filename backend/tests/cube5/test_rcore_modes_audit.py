"""Cube 5 (5.1+5.2): shared execution-mode dispatch + real (guarded) CQS scoring +
AuditLog on the CQS trigger."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from app.cubes.cube5_gateway import service


def _run(coro):
    return asyncio.run(coro)


# --- 5.2 execution-mode dispatch (delegates to shared core.rcore) ---

def test_dispatch_pipeline_mode_automated_guardrail():
    ok = service.dispatch_pipeline_mode({"confidence": 0.8, "risk": 0.2}, mode="automated")
    assert ok["status"] == "accepted"
    held = service.dispatch_pipeline_mode({"confidence": 0.5, "risk": 0.1}, mode="automated")
    assert held["status"] == "held"


def test_dispatch_pipeline_mode_live_requires_human():
    assert service.dispatch_pipeline_mode({}, mode="live")["status"] == "pending"


# --- 5.1 real (guarded) CQS scoring + audit on trigger ---

def _mock_db():
    db = AsyncMock()
    added = []
    db.add = MagicMock(side_effect=lambda x: added.append(x))
    db.flush = AsyncMock()
    db.commit = AsyncMock()
    return db, added


def test_trigger_records_and_audits_without_label():
    db, added = _mock_db()
    with patch.object(service, "_create_trigger",
                      AsyncMock(return_value=MagicMock(id=uuid.uuid4()))):
        _run(service.trigger_cqs_scoring(db, uuid.uuid4(), "theme2-id-1", algorithm="quadratic_borda"))
    audit = [a for a in added if getattr(a, "action_type", None) == "pipeline.cqs_scoring_triggered"]
    assert len(audit) == 1
    assert audit[0].actor_role == "system"
    assert audit[0].after_state["algorithm"] == "quadratic_borda"


def test_trigger_invokes_real_scoring_when_label_present():
    db, _ = _mock_db()
    called = {}
    async def _fake_pipeline(_db, sid, label, level):
        called["label"] = label
        called["level"] = level
        return {"status": "completed", "winner": "r1"}
    with patch.object(service, "_create_trigger",
                      AsyncMock(return_value=MagicMock(id=uuid.uuid4()))), \
         patch("app.cubes.cube6_ai.cqs_engine.run_cqs_pipeline", _fake_pipeline):
        _run(service.trigger_cqs_scoring(
            db, uuid.uuid4(), "id", top_theme2_label="Risk & Concerns", theme_level="3"))
    assert called["label"] == "Risk & Concerns" and called["level"] == "3"


def test_scoring_failure_degrades_not_raises():
    db, _ = _mock_db()
    async def _boom(*_a, **_k):
        raise RuntimeError("no AI key")
    with patch.object(service, "_create_trigger",
                      AsyncMock(return_value=MagicMock(id=uuid.uuid4()))), \
         patch("app.cubes.cube6_ai.cqs_engine.run_cqs_pipeline", _boom):
        # Must NOT raise — degrades to trigger-only.
        t = _run(service.trigger_cqs_scoring(
            db, uuid.uuid4(), "id", top_theme2_label="X"))
    assert t is not None
