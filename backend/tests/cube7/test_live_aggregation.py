"""G3 — live 9-theme prioritization: debounced live tally while ranking is open; close finalizes.

Before: nothing in a real session ran the tally (only the Admin Console sim driver called /rankings/aggregate), so no
group ranking ever existed for the moderator or phones. Now each accepted ballot in a `ranking` session schedules one
coalesced live tally per window; the live run broadcasts ranking_complete {live: true} without the webhook / CQS, and
closing a ranking round runs the full (final) aggregation once.
"""
from __future__ import annotations

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.cubes.cube7_ranking import ranking_submission as rs
from app.cubes.cube7_ranking import ranking_governance as rg


class _FakeFactory:
    def __call__(self):
        return self

    async def __aenter__(self):
        return MagicMock()

    async def __aexit__(self, *a):
        return False


@pytest.mark.asyncio
async def test_ballots_in_one_window_coalesce_into_one_live_tally():
    sid = uuid.uuid4()
    runs = AsyncMock(return_value={"status": "ranking_live"})
    with patch.object(rs, "LIVE_AGGREGATE_INTERVAL_S", 0.05), patch.object(rs, "run_live_aggregation", runs), \
            patch("app.db.postgres.async_session_factory", _FakeFactory()):
        assert rs.schedule_live_aggregation(sid, "ABC12345", 1) is True
        assert rs.schedule_live_aggregation(sid, "ABC12345", 1) is False  # same window → same run
        assert rs.schedule_live_aggregation(sid, "ABC12345", 1) is False
        await asyncio.sleep(0.15)
        assert runs.await_count == 1
        # A ballot after the window schedules the next run (live keeps updating).
        assert rs.schedule_live_aggregation(sid, "ABC12345", 1) is True
        await asyncio.sleep(0.15)
        assert runs.await_count == 2
        # Another cycle is its own window.
        assert rs.schedule_live_aggregation(sid, "ABC12345", 2) is True
        await asyncio.sleep(0.15)
    assert runs.await_count == 3


def _db_with_session(status: str, cycle: int = 1):
    s = MagicMock(); s.status = status; s.current_cycle = cycle; s.seed = "seed"
    res = MagicMock(); res.scalar_one_or_none.return_value = s
    db = MagicMock(); db.execute = AsyncMock(return_value=res)
    return db


@pytest.mark.asyncio
@pytest.mark.parametrize("status", ["closed", "polling", "archived"])
async def test_live_tally_skips_when_round_not_open(status):
    pipe = AsyncMock()
    with patch.object(rg, "run_ranking_pipeline", pipe):
        assert await rs.run_live_aggregation(_db_with_session(status), uuid.uuid4(), "C", 1) is None
    pipe.assert_not_awaited()


@pytest.mark.asyncio
async def test_live_tally_skips_stale_cycle():
    pipe = AsyncMock()
    with patch.object(rg, "run_ranking_pipeline", pipe):
        assert await rs.run_live_aggregation(_db_with_session("ranking", cycle=2), uuid.uuid4(), "C", 1) is None
    pipe.assert_not_awaited()


@pytest.mark.asyncio
async def test_live_tally_runs_pipeline_in_live_mode():
    pipe = AsyncMock(return_value={"status": "ranking_live"})
    sid = uuid.uuid4()
    with patch.object(rg, "run_ranking_pipeline", pipe):
        out = await rs.run_live_aggregation(_db_with_session("ranking"), sid, "C", 1)
    assert out == {"status": "ranking_live"}
    kw = pipe.await_args.kwargs
    assert kw["live"] is True and kw["session_id"] == sid and kw["cycle_id"] == 1 and kw["seed"] == "seed"


def _emit_db():
    winner = MagicMock(); winner.theme_id = uuid.uuid4(); winner.algorithm = "borda_count"
    r_winner = MagicMock(); r_winner.scalar_one_or_none.return_value = winner
    r_label = MagicMock(); r_label.one_or_none.return_value = ("Top theme", None)
    r_count = MagicMock(); r_count.scalar.return_value = 5
    q = [r_winner, r_label, r_count]
    db = MagicMock(); db.execute = AsyncMock(side_effect=lambda *_a, **_k: q.pop(0) if q else MagicMock())
    return db


@pytest.mark.asyncio
async def test_live_emit_broadcasts_but_skips_webhook_and_cqs():
    bc = AsyncMock(return_value=True); hook = AsyncMock(); cqs = AsyncMock()
    with patch("app.core.supabase_broadcast.broadcast_event", bc), \
            patch("app.cubes.cube5_gateway.webhook_service.deliver_event", hook), \
            patch("app.cubes.cube5_gateway.service.trigger_cqs_scoring", cqs):
        out = await rg.emit_ranking_complete(_emit_db(), uuid.uuid4(), "ABC12345", 1, live=True)
    assert bc.await_args.kwargs["event"] == "ranking_complete"
    payload = bc.await_args.kwargs["payload"]
    assert payload["live"] is True and payload["is_final"] is False and payload["participant_count"] == 5
    hook.assert_not_awaited(); cqs.assert_not_awaited()
    assert out["status"] == "ranking_live" and out["top_theme2_label"] == "Top theme"


@pytest.mark.asyncio
async def test_final_emit_still_fires_webhook_and_cqs():
    bc = AsyncMock(return_value=True); hook = AsyncMock(); cqs = AsyncMock()
    with patch("app.core.supabase_broadcast.broadcast_event", bc), \
            patch("app.cubes.cube5_gateway.webhook_service.deliver_event", hook), \
            patch("app.cubes.cube5_gateway.service.trigger_cqs_scoring", cqs):
        out = await rg.emit_ranking_complete(_emit_db(), uuid.uuid4(), "ABC12345", 1)
    assert bc.await_args.kwargs["payload"]["is_final"] is True
    hook.assert_awaited_once(); cqs.assert_awaited_once()
    assert out["status"] == "ranking_complete"


@pytest.mark.asyncio
async def test_closing_a_ranking_round_fires_final_aggregation():
    from app.cubes.cube1_session import router as r1

    sid = uuid.uuid4()
    sess = MagicMock(); sess.status = "ranking"
    updated = MagicMock(); updated.short_code = "ABC12345"; updated.seed = "s"; updated.current_cycle = 1
    fire = MagicMock()
    with patch.object(r1.service, "get_session_by_id", AsyncMock(return_value=sess)), \
            patch.object(r1.service, "verify_session_owner", MagicMock()), \
            patch.object(r1.service, "transition_session", AsyncMock(return_value=updated)), \
            patch.object(r1, "_return_session", AsyncMock(return_value="ok")), \
            patch.object(r1, "_fire_final_aggregation", fire):
        user = MagicMock(); user.user_id = "u"
        assert await r1._transition_and_return(MagicMock(), sid, "closed", user) == "ok"
    fire.assert_called_once_with(sid, "ABC12345", "s", 1)


@pytest.mark.asyncio
async def test_closing_from_polling_does_not_aggregate():
    from app.cubes.cube1_session import router as r1

    sess = MagicMock(); sess.status = "polling"
    fire = MagicMock()
    with patch.object(r1.service, "get_session_by_id", AsyncMock(return_value=sess)), \
            patch.object(r1.service, "verify_session_owner", MagicMock()), \
            patch.object(r1.service, "transition_session", AsyncMock(return_value=MagicMock())), \
            patch.object(r1, "_return_session", AsyncMock(return_value="ok")), \
            patch.object(r1, "_fire_final_aggregation", fire):
        await r1._transition_and_return(MagicMock(), uuid.uuid4(), "closed", MagicMock())
    fire.assert_not_called()


@pytest.mark.asyncio
async def test_final_aggregation_task_runs_full_pipeline_and_swallows_no_ballots():
    from app.cubes.cube1_session import router as r1

    pipe = AsyncMock(side_effect=ValueError("No rankings found"))
    with patch("app.cubes.cube7_ranking.service.run_ranking_pipeline", pipe), \
            patch("app.db.postgres.async_session_factory", _FakeFactory()):
        r1._fire_final_aggregation(uuid.uuid4(), "ABC12345", "s", 1)
        await asyncio.sleep(0.05)
    assert pipe.await_count == 1 and "live" not in pipe.await_args.kwargs


def test_aggregate_endpoint_live_flag_passes_through():
    from tests.cube7.test_asm_r1_correctness import _client, _url

    pipeline = AsyncMock(return_value={"status": "ranking_live"})
    client, p = _client(pipeline)
    with p:
        assert client.post(_url(), params={"live": "true"}).status_code == 200
        assert pipeline.await_args.kwargs["live"] is True
        assert client.post(_url()).status_code == 200
        assert pipeline.await_args.kwargs["live"] is False
