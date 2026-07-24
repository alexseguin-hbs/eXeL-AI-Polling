"""Webhook event fan-out locks — the built webhook infra now has producers.

safe_deliver_webhook (reuse helper) + the session_closed (Cube 1) and
payment_received (Cube 8) producers wire deliver_event fire-and-forget.
"""

import asyncio
import inspect
import uuid
from unittest.mock import AsyncMock, patch


def _run(coro):
    return asyncio.run(coro)


def test_safe_deliver_webhook_swallows_errors():
    """The reuse helper never propagates a delivery failure."""
    import app.cubes.cube5_gateway.webhook_service as ws

    with patch.object(ws, "deliver_event", new=AsyncMock(side_effect=RuntimeError("boom"))):
        # Must NOT raise.
        _run(ws.safe_deliver_webhook(AsyncMock(), uuid.uuid4(), "session_closed", {}))


def test_safe_deliver_webhook_calls_deliver_event():
    import app.cubes.cube5_gateway.webhook_service as ws

    called = {}

    async def _fake(db, sid, ev, payload):
        called["ev"] = ev
        return []

    with patch.object(ws, "deliver_event", new=_fake):
        _run(ws.safe_deliver_webhook(AsyncMock(), uuid.uuid4(), "payment_received", {"a": 1}))
    assert called["ev"] == "payment_received"


def test_session_closed_producer_wired():
    from app.cubes.cube1_session.service import transition_session

    src = inspect.getsource(transition_session)
    assert "safe_deliver_webhook" in src
    assert '"session_closed"' in src
    # Only fires on the terminal closed state, after commit.
    assert 'new_status == "closed"' in src


def test_payment_received_producer_wired():
    from app.cubes.cube8_tokens.payment_service import _fire_payment_received

    src = inspect.getsource(_fire_payment_received)
    assert "safe_deliver_webhook" in src
    assert '"payment_received"' in src
    # Only session-scoped payments fire.
    assert "session_id" in src


def test_export_ready_producer_wired():
    """The last of the 5 declared events now has an emit site (Cube 9 CSV export)."""
    from app.cubes.cube9_reports.router import export_csv

    src = inspect.getsource(export_csv)
    assert "safe_deliver_webhook" in src
    assert '"export_ready"' in src
    # Fire-and-forget: a webhook must never break the download.
    assert "never let a webhook affect the export" in src


def test_all_five_declared_events_have_producers():
    """No declared webhook event may be dead (registerable but never fired)."""
    import inspect as _i

    from app.models.webhook import VALID_EVENT_TYPES
    from app.cubes.cube1_session.service import transition_session
    from app.cubes.cube6_ai.pipeline import run_pipeline
    from app.cubes.cube7_ranking.ranking_governance import emit_ranking_complete
    from app.cubes.cube8_tokens.payment_service import _fire_payment_received
    from app.cubes.cube9_reports.router import export_csv

    producers_src = "\n".join(
        _i.getsource(f) for f in (
            transition_session, run_pipeline, emit_ranking_complete,
            _fire_payment_received, export_csv,
        )
    )
    for ev in VALID_EVENT_TYPES:
        assert f'"{ev}"' in producers_src, f"event {ev!r} has no producer/emit site"
