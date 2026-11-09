"""CRS-22.04 + S4 — router wiring for GET /rankings/live and POST /rankings/decision (no database)."""
from __future__ import annotations

import uuid

import pytest
from pydantic import ValidationError

from app.schemas.ranking import FinalDecisionSubmit


def test_decision_schema():
    tid = uuid.uuid4()
    assert FinalDecisionSubmit(theme_id=tid).reason is None
    assert FinalDecisionSubmit(theme_id=tid, reason="x" * 2000).reason
    with pytest.raises(ValidationError):
        FinalDecisionSubmit(theme_id=tid, reason="x" * 2001)
    with pytest.raises(ValidationError):
        FinalDecisionSubmit(reason="no theme")


def test_routes_and_guards_are_registered():
    from app.cubes.cube7_ranking.router import router

    paths = {(r.path, tuple(sorted(r.methods))) for r in router.routes if hasattr(r, "methods")}
    assert ("/sessions/{session_id}/rankings/live", ("GET",)) in paths
    assert ("/sessions/{session_id}/rankings/decision", ("POST",)) in paths
    dec = next(r for r in router.routes if getattr(r, "path", "").endswith("/rankings/decision"))
    # the decision is the session owner's (moderator/admin) — never a participant's
    assert any("require_session_owner" in repr(d.call) or "owner" in repr(d.call) for d in dec.dependant.dependencies)


async def test_live_read_needs_a_participant_token_or_login(client):
    sid = uuid.uuid4()
    r = await client.get(f"/api/v1/sessions/{sid}/rankings/live")
    assert r.status_code in (401, 403)
    r = await client.get(f"/api/v1/sessions/{sid}/rankings/live", headers={"X-Participant-Token": "forged"})
    assert r.status_code == 403
