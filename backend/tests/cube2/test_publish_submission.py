"""C2-2 lock: publish_submission_event emits a real broadcast on a distinct channel."""

import asyncio
import uuid

from app.cubes.cube2_text.service import publish_submission_event


def _run(coro):
    return asyncio.run(coro)


def test_broadcasts_response_submitted_on_distinct_channel(monkeypatch):
    calls = []

    async def _fake_broadcast(channel, event, payload):
        calls.append((channel, event, payload))
        return True

    # publish_submission_event imports broadcast_event lazily — patch it at the source.
    import app.core.supabase_broadcast as sb
    monkeypatch.setattr(sb, "broadcast_event", _fake_broadcast, raising=True)

    sid = uuid.uuid4()
    rid = uuid.uuid4()
    _run(publish_submission_event(sid, rid, "en", 128))

    assert len(calls) == 1
    channel, event, payload = calls[0]
    assert channel == f"session:{sid}:responses"  # NOT session:{short_code} → no Trinity collision
    assert event == "response_submitted"
    assert payload["response_id"] == str(rid)
    assert payload["char_count"] == 128


def test_broadcast_failure_is_swallowed(monkeypatch):
    async def _boom(channel, event, payload):
        raise RuntimeError("supabase down")

    import app.core.supabase_broadcast as sb
    monkeypatch.setattr(sb, "broadcast_event", _boom, raising=True)

    # Must NOT raise — a broadcast failure can never break a submission.
    _run(publish_submission_event(uuid.uuid4(), uuid.uuid4(), "en", 10))
