"""HWR H2 — rotor metrics triad (System/User/Outcome) + audit-on-coalesce."""

import uuid
from unittest.mock import MagicMock

from app.core.rcore.write_rotor import RotorRing, audit_coalesce, rotor_metrics
from app.models.audit_log import AuditLog


def _ring(n=120):
    ring = RotorRing(seed="m")
    for i in range(n):
        ring.write({"id": f"r{i}"}, key="sess")
    return ring


def test_metrics_triad_shape_and_values():
    ring = _ring(120)
    result = ring.read_all()
    m = rotor_metrics(ring, result, distinct_writers=40)
    assert m["component"] == "hex_write_rotor"
    assert m["system"]["faces"] == 6
    assert m["system"]["writes_absorbed"] == 120
    assert sum(m["system"]["face_counts"]) == 120
    assert 0.0 < m["system"]["balance"] <= 1.0
    assert m["user"]["distinct_writers"] == 40
    assert m["outcome"]["coalesced_count"] == 120  # unique records
    assert m["outcome"]["dedup_removed"] == 0
    assert len(m["outcome"]["replay_hash"]) == 64


def test_metrics_reports_dedup_in_outcome():
    ring = RotorRing(seed="m")
    ring.write({"id": "dup"}, key="s")
    ring.write({"id": "dup"}, key="s")  # same content → dedups on coalesce
    m = rotor_metrics(ring, ring.read_all())
    assert m["system"]["writes_absorbed"] == 2
    assert m["outcome"]["coalesced_count"] == 1
    assert m["outcome"]["dedup_removed"] == 1


def test_audit_coalesce_writes_one_row():
    db = MagicMock()
    coalesced = _ring(30).read_all()
    entry = audit_coalesce(db, session_id=uuid.uuid4(), actor_id="system:hub", coalesced=coalesced)
    db.add.assert_called_once()
    assert isinstance(entry, AuditLog)
    assert entry.action_type == "hwr.coalesce"
    assert entry.object_type == "hex_write_rotor"
    assert entry.object_id == coalesced["replay_hash"]
    assert entry.after_state["coalesced_count"] == 30
