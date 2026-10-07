"""AsM approval round 1 (2026-10-07) — Cube 7 correctness gates.

  1. Ballot validation (Enki, Thoth): a ballot ranks every valid theme exactly once. Comparing sets alone let
     [A, A, B, C] through as {A, B, C} — a double Borda share for A.
  2. Deterministic n_themes (Thoth): the Borda width is the longest ballot, not "the first ballot read".
  3. Bounded replay-hash feed (Odin, Enki, Pangu): the digest gets the exact bytes, in bounded batches.
  6. ranking_method (Enki): quadratic_borda reaches the pipeline with stakes, or is refused with a 400.
The Postgres-path parity (items 2, 4, 5) is in test_sql_tally_parity.py.
"""
from __future__ import annotations

import hashlib
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.cubes.cube7_ranking import ranking_aggregation as agg
from app.cubes.cube7_ranking.ranking_submission import submit_user_ranking


# ---------------------------------------------------------------------------
# 1. Ballot validation
# ---------------------------------------------------------------------------


def _stub_db(valid_ids):
    db = AsyncMock()
    db.flush = AsyncMock(); db.refresh = AsyncMock(); db.add = MagicMock()
    child = MagicMock(); child.all.return_value = [(t,) for t in valid_ids]
    dup = MagicMock(); dup.scalar_one_or_none.return_value = None
    queue = [child, dup]

    async def _execute(_stmt):
        return queue.pop(0) if queue else MagicMock()

    db.execute = _execute
    return db


VALID = [uuid.UUID(int=i) for i in range(1, 4)]


async def _submit(ids):
    return await submit_user_ranking(
        _stub_db(VALID), session_id=uuid.uuid4(), participant_id=uuid.uuid4(),
        ranked_theme_ids=ids, theme2_voting_level="theme2_3",
    )


@pytest.mark.asyncio
async def test_exact_ballot_accepted():
    ranking = await _submit([VALID[2], VALID[0], VALID[1]])
    assert ranking.ranked_theme_ids == [str(VALID[2]), str(VALID[0]), str(VALID[1])]


@pytest.mark.asyncio
async def test_duplicate_theme_refused():
    """[A, A, B, C] has the valid SET but ranks A twice."""
    with pytest.raises(ValueError, match="Duplicate theme IDs"):
        await _submit([VALID[0], VALID[0], VALID[1], VALID[2]])


@pytest.mark.asyncio
async def test_duplicate_with_missing_refused():
    """[A, A, B]: right length, a repeat and a missing theme."""
    with pytest.raises(ValueError, match="Duplicate theme IDs"):
        await _submit([VALID[0], VALID[0], VALID[1]])


@pytest.mark.asyncio
async def test_missing_theme_refused():
    with pytest.raises(ValueError, match="Theme ID mismatch"):
        await _submit([VALID[0], VALID[1]])


@pytest.mark.asyncio
async def test_extra_theme_refused():
    with pytest.raises(ValueError, match="Theme ID mismatch"):
        await _submit(VALID + [uuid.UUID(int=99)])


@pytest.mark.asyncio
async def test_unknown_theme_refused():
    with pytest.raises(ValueError, match="Theme ID mismatch"):
        await _submit([VALID[0], VALID[1], uuid.UUID(int=77)])


# ---------------------------------------------------------------------------
# 2. Deterministic n_themes
# ---------------------------------------------------------------------------


def test_ballot_width_is_order_independent():
    a, b = ["x", "y", "z"], ["y", "x"]
    assert agg._ballot_width([a, b]) == agg._ballot_width([b, a]) == 3
    assert agg._ballot_width([]) == 0


@pytest.mark.asyncio
async def test_python_tally_scores_do_not_depend_on_row_order():
    """Mixed-length ballots: the same scores whichever ballot the database returns first."""
    from types import SimpleNamespace

    rows = [SimpleNamespace(participant_id=f"p{i}", ranked_theme_ids=r)
            for i, r in enumerate([["a", "b"], ["b", "a", "c"], ["c", "a", "b"]])]

    async def tally(order):
        res = MagicMock(); res.scalars.return_value.all.return_value = order
        db = MagicMock(); db.execute = AsyncMock(return_value=res)
        return await agg.tally_rankings(db, uuid.UUID(int=1), 1, "seed", None, set())

    fwd, rev = await tally(rows), await tally(list(reversed(rows)))
    assert fwd["scores"] == rev["scores"] == {"a": 4.0, "b": 3.0, "c": 2.0}
    assert fwd["replay_hash"] == rev["replay_hash"]


# ---------------------------------------------------------------------------
# 3. Bounded replay-hash feed
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("count", [1, 2, 3, 7, 100, 4097])
@pytest.mark.parametrize("first", [True, False])
def test_feed_repeated_bytes_identical(count, first):
    joined = ",".join(str(uuid.UUID(int=i)) for i in range(9))
    want = hashlib.sha256(b"P:")
    want.update((("" if first else "|") + "|".join([joined] * count)).encode())
    got = hashlib.sha256(b"P:")
    with patch.object(agg, "_HASH_FEED_BYTES", 1000):  # force many small batches
        agg._feed_repeated(got, joined, count, first)
    assert got.hexdigest() == want.hexdigest()


def test_feed_repeated_never_hands_over_more_than_the_bound():
    joined = "a" * 332
    sizes = []

    class Probe:
        def update(self, b):
            sizes.append(len(b))

    agg._feed_repeated(Probe(), joined, 1_000_000, True)
    assert max(sizes) <= agg._HASH_FEED_BYTES
    assert sum(sizes) == 1_000_000 * 333 - 1


# ---------------------------------------------------------------------------
# 6. ranking_method reaches the pipeline
# ---------------------------------------------------------------------------


def _client(pipeline):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.core.dependencies import get_db
    from app.cubes.cube7_ranking import router as r

    app = FastAPI()
    app.include_router(r.router, prefix="/api/v1")
    session = MagicMock(); session.short_code = "ABC12345"; session.seed = "s"; session.current_cycle = 1
    res = MagicMock(); res.scalar_one_or_none.return_value = session
    db = MagicMock(); db.execute = AsyncMock(return_value=res)

    async def _db():
        yield db

    app.dependency_overrides[get_db] = _db
    for route in r.router.routes:  # bypass the session-owner auth dependency for this unit
        if getattr(route, "path", "").endswith("/rankings/aggregate"):
            for dep in route.dependant.dependencies:
                if dep.name == "user":
                    app.dependency_overrides[dep.call] = lambda: MagicMock()
    return TestClient(app), patch.object(r.service, "run_ranking_pipeline", pipeline)


def _url():
    return f"/api/v1/sessions/{uuid.uuid4()}/rankings/aggregate"


def test_quadratic_without_stakes_refused_400():
    pipeline = AsyncMock(return_value={"status": "ranking_complete"})
    client, p = _client(pipeline)
    with p:
        resp = client.post(_url(), params={"ranking_method": "quadratic_borda"})
    assert resp.status_code == 400 and "participant_stakes" in resp.json()["detail"]
    pipeline.assert_not_awaited()


def test_quadratic_with_stakes_passes_them_through():
    pipeline = AsyncMock(return_value={"status": "ranking_complete"})
    client, p = _client(pipeline)
    pid = str(uuid.uuid4())
    with p:
        resp = client.post(_url(), params={"ranking_method": "quadratic_borda"},
                           json={"participant_stakes": {pid: 9.0}})
    assert resp.status_code == 200
    assert pipeline.await_args.kwargs["participant_stakes"] == {pid: 9.0}


def test_borda_count_runs_unweighted_even_with_stakes():
    pipeline = AsyncMock(return_value={"status": "ranking_complete"})
    client, p = _client(pipeline)
    with p:
        resp = client.post(_url(), json={"participant_stakes": {str(uuid.uuid4()): 4.0}})
    assert resp.status_code == 200
    assert pipeline.await_args.kwargs["participant_stakes"] is None


def test_negative_stake_refused():
    pipeline = AsyncMock(return_value={})
    client, p = _client(pipeline)
    with p:
        resp = client.post(_url(), params={"ranking_method": "quadratic_borda"},
                           json={"participant_stakes": {str(uuid.uuid4()): -1.0}})
    assert resp.status_code == 422
    pipeline.assert_not_awaited()
