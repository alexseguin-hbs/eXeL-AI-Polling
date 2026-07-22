"""Cube 9 R-Core finish — verify-export (activates compute_export_hash) + exec-mode gate
+ AuditLog on irreversible destruction."""

import asyncio
import io
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from app.cubes.cube9_reports import service
from app.models.audit_log import AuditLog


def _run(coro):
    return asyncio.run(coro)


# --- exec-mode dispatch (shared gate) ---

def test_dispatch_report_mode_automated_guardrail():
    ok = service.dispatch_report_mode({"confidence": 0.8, "risk": 0.2}, mode="automated")
    assert ok["status"] == "accepted"


def test_destroy_routed_live_requires_human():
    # Irreversible destroy → live mode → requires human authority (permanent gate).
    assert service.dispatch_report_mode({}, mode="live")["status"] == "pending"
    assert service.dispatch_report_mode({}, mode="live", human_approved=True)["status"] == "accepted"


# --- verify_export activates the dormant governance hash ---

def test_verify_export_recomputes_hash():
    csv_bytes = b"Q_Number,User\nQ-0001,user_0001\n"
    with patch.object(service, "export_session_csv",
                      AsyncMock(return_value=io.BytesIO(csv_bytes))):
        out = _run(service.verify_export(AsyncMock(), uuid.uuid4()))
    assert len(out["export_hash"]) == 64
    assert out["deterministic"] is True
    # Reproducible: same bytes → same hash as compute_export_hash directly.
    assert out["export_hash"] == service.compute_export_hash(csv_bytes)


def test_verify_endpoint_registered():
    from app.cubes.cube9_reports.router import router
    paths = {r.path for r in router.routes if hasattr(r, "path")}
    assert any(p.endswith("/export/verify") for p in paths)


# --- AuditLog on the irreversible destruction ---

def test_destroy_writes_audit_row():
    entry_holder = []
    db = AsyncMock()
    db.add = MagicMock(side_effect=lambda x: entry_holder.append(x))
    db.commit = AsyncMock()
    # count queries → 12 responses, 12 summaries; update queries → no-op
    scalar_result = MagicMock()
    scalar_result.scalar.return_value = 12
    db.execute = AsyncMock(return_value=scalar_result)

    _run(service.destroy_session_export_data(db, uuid.uuid4(), destroyed_by="mod-9"))
    audit = [a for a in entry_holder if getattr(a, "action_type", None) == "reports.data_destroyed"]
    assert len(audit) == 1
    a = audit[0]
    assert isinstance(a, AuditLog)
    assert a.actor_id == "mod-9" and a.actor_role == "moderator"
    assert a.after_state["responses_destroyed"] == 12
