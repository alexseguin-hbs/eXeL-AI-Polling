"""Cube 7: the ranking_complete WEBHOOK actually fires (was built but never called).

Source-guard lock — emit_ranking_complete must wire webhook_service.deliver_event for
the "ranking_complete" event, fire-and-forget (a webhook failure never breaks ranking).
"""

import inspect

from app.cubes.cube7_ranking.ranking_governance import emit_ranking_complete


def test_emit_wires_deliver_event_for_ranking_complete():
    src = inspect.getsource(emit_ranking_complete)
    assert "deliver_event" in src
    assert '"ranking_complete"' in src


def test_webhook_call_is_fire_and_forget():
    """The deliver_event call is guarded so a webhook failure can't break ranking."""
    src = inspect.getsource(emit_ranking_complete)
    # The webhook block logs on failure rather than propagating.
    assert "cube7.ranking_complete.webhook_failed" in src


def test_deliver_event_signature_matches_call():
    from app.cubes.cube5_gateway.webhook_service import deliver_event

    params = list(inspect.signature(deliver_event).parameters)
    # deliver_event(db, session_id, event_type, payload)
    assert params[:4] == ["db", "session_id", "event_type", "payload"]
