"""P1 — `top3_points` ranking method (original design, Round 2: per category, top 3 themes scored 3/2/1).

Additive: Borda stays the default; only a session with ranking_method="top3_points" uses it.
"""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import ValidationError

from app.cubes.cube7_ranking import ranking_aggregation as ra
from app.cubes.cube7_ranking import ranking_submission as rs
from app.schemas.ranking import RankingSubmit


def _ids(n):
    return [uuid.uuid4() for _ in range(n)]


# --- schema ---------------------------------------------------------------

def test_schema_accepts_top3_ballot_and_legacy_ballot():
    a, b, c = _ids(3)
    assert RankingSubmit(category_ballots={"support": [a, b, c]}).category_ballots["support"] == [a, b, c]
    assert RankingSubmit(ranked_theme_ids=[a, b]).ranked_theme_ids == [a, b]


@pytest.mark.parametrize("bad", [
    {},                                   # neither shape
    {"category_ballots": {}},             # no category
    {"category_ballots": {"support": []}},
    {"category_ballots": {"support": _ids(4)}},  # > 3 picks
    {"category_ballots": {"bogus": _ids(1)}},
])
def test_schema_rejects_bad_ballots(bad):
    with pytest.raises(ValidationError):
        RankingSubmit(**bad)


def test_schema_rejects_duplicates_within_and_across_categories():
    a, b = _ids(2)
    with pytest.raises(ValidationError):
        RankingSubmit(category_ballots={"support": [a, a]})
    with pytest.raises(ValidationError):
        RankingSubmit(category_ballots={"support": [a], "risk": [a, b]})
    with pytest.raises(ValidationError):
        RankingSubmit(ranked_theme_ids=[a], category_ballots={"support": [b]})


# --- scoring --------------------------------------------------------------

def test_points_are_3_2_1_per_category_and_votes_count_picks():
    s1, s2, s3, s4 = "s1", "s2", "s3", "s4"
    r1, r2 = "r1", "r2"
    ballots = [
        {"support": [s1, s2, s3], "risk": [r1, r2]},
        {"support": [s2, s1], "risk": [r2]},
        {"support": [s4]},
    ]
    scores, votes = ra._top3_points_scores(ballots)
    assert scores == {s1: 3 + 2, s2: 2 + 3, s3: 1, s4: 3, r1: 3, r2: 2 + 3}
    assert votes == {s1: 2, s2: 2, s3: 1, s4: 1, r1: 1, r2: 2}


def test_replay_hash_is_order_independent_and_method_pinned():
    b1 = {"support": ["a", "b"], "risk": ["c"]}
    b2 = {"risk": ["d"], "support": ["e"]}
    p = ra._replay_prefix("seed", ra.TOP3_POINTS, None, "9")
    assert ra._top3_replay_hash([b1, b2], p) == ra._top3_replay_hash([b2, dict(reversed(list(b1.items())))], p)
    assert ra._top3_replay_hash([b1], p) != ra._top3_replay_hash([b1], ra._replay_prefix("seed", "borda_count", None, "9"))
    assert ra._top3_replay_hash([{"support": ["a", "b"]}], p) != ra._top3_replay_hash([{"support": ["b", "a"]}], p)


def test_stored_shape_reader():
    assert ra._top3_category_ballots({"method": "top3_points", "category_ballots": {"support": ["x"]}}) == {"support": ["x"]}
    assert ra._top3_category_ballots(["x", "y"]) is None
    assert ra._top3_category_ballots({"ranked_theme_ids": ["x"]}) is None


@pytest.mark.asyncio
async def test_tally_rankings_top3_path_and_excludes_flagged():
    p_ok, p_bad, p_old = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    rows = []
    for pid, stored in [
        (p_ok, {"method": "top3_points", "category_ballots": {"support": ["a", "b", "c"]}, "ranked_theme_ids": ["a", "b", "c"]}),
        (p_bad, {"method": "top3_points", "category_ballots": {"support": ["c"]}, "ranked_theme_ids": ["c"]}),
        (p_old, ["a", "b", "c"]),  # a legacy Borda row is not a top-3 ballot → ignored
    ]:
        r = MagicMock(); r.participant_id = pid; r.ranked_theme_ids = stored; rows.append(r)
    res = MagicMock(); res.scalars.return_value.all.return_value = rows
    db = MagicMock(); db.execute = AsyncMock(return_value=res)
    t = await ra.tally_rankings(db, uuid.uuid4(), 1, "seed", None, {str(p_bad)}, None, "9", ranking_method=ra.TOP3_POINTS)
    assert t["algorithm"] == "top3_points"
    assert t["scores"] == {"a": 3, "b": 2, "c": 1}
    assert t["participant_count"] == 1 and t["excluded_count"] == 1


@pytest.mark.asyncio
async def test_top3_refuses_stakes():
    with pytest.raises(ValueError, match="participant_stakes"):
        await ra.tally_rankings(MagicMock(), uuid.uuid4(), 1, "s", {"p": 1.0}, set(), ranking_method=ra.TOP3_POINTS)


# --- submission -----------------------------------------------------------

def _sub_db(valid_by_cat, prior=None):
    db = MagicMock(); db.add = MagicMock(); db.flush = AsyncMock(); db.refresh = AsyncMock()
    res = MagicMock(); res.scalar_one_or_none.return_value = prior
    db.execute = AsyncMock(return_value=res)
    return db


@pytest.mark.asyncio
async def test_submit_top3_validates_subset_per_category_and_stores_shape():
    sup, risk = _ids(9), _ids(9)
    valid = {"support": set(sup), "risk": set(risk)}
    db = _sub_db(valid)
    with patch.object(rs, "valid_theme_ids_by_category", AsyncMock(return_value=valid)):
        r = await rs.submit_top3_ballot(db, uuid.uuid4(), uuid.uuid4(), {"risk": [risk[4]], "support": sup[:3]})
    stored = r.ranked_theme_ids
    assert stored["method"] == "top3_points"
    assert list(stored["category_ballots"]) == ["support", "risk"]  # canonical order
    assert stored["category_ballots"]["support"] == [str(t) for t in sup[:3]]
    assert stored["ranked_theme_ids"] == [str(t) for t in sup[:3]] + [str(risk[4])]
    db.add.assert_called_once()


@pytest.mark.asyncio
async def test_submit_top3_rejects_theme_from_another_category_and_empty_category():
    sup, risk = _ids(3), _ids(3)
    valid = {"support": set(sup), "risk": set(risk)}
    with patch.object(rs, "valid_theme_ids_by_category", AsyncMock(return_value=valid)):
        with pytest.raises(ValueError, match="mismatch in support"):
            await rs.submit_top3_ballot(_sub_db(valid), uuid.uuid4(), uuid.uuid4(), {"support": [risk[0]]})
        with pytest.raises(ValueError, match="no themes"):
            await rs.submit_top3_ballot(_sub_db(valid), uuid.uuid4(), uuid.uuid4(), {"neutral": [sup[0]]})


@pytest.mark.asyncio
async def test_submit_top3_revote_replaces_whole_ballot():
    sup = _ids(9)
    valid = {"support": set(sup)}
    prior = MagicMock(); prior.ranked_theme_ids = {"method": "top3_points", "category_ballots": {"support": [str(sup[8])]}}
    db = _sub_db(valid, prior=prior)
    with patch.object(rs, "valid_theme_ids_by_category", AsyncMock(return_value=valid)):
        r = await rs.submit_top3_ballot(db, uuid.uuid4(), uuid.uuid4(), {"support": sup[:2]}, allow_revote=True)
    assert r is prior and prior.ranked_theme_ids["category_ballots"] == {"support": [str(sup[0]), str(sup[1])]}
    db.add.assert_not_called()
    db2 = _sub_db(valid, prior=MagicMock())
    with patch.object(rs, "valid_theme_ids_by_category", AsyncMock(return_value=valid)):
        with pytest.raises(ValueError, match="already submitted"):
            await rs.submit_top3_ballot(db2, uuid.uuid4(), uuid.uuid4(), {"support": sup[:1]})


# --- router method resolution ---------------------------------------------

def _agg_client(session_method):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    from app.core.dependencies import get_db
    from app.cubes.cube7_ranking import router as r

    app = FastAPI()
    app.include_router(r.router, prefix="/api/v1")
    session = MagicMock(); session.short_code = "ABC12345"; session.seed = "s"; session.current_cycle = 1
    session.ranking_method = session_method
    res = MagicMock(); res.scalar_one_or_none.return_value = session
    db = MagicMock(); db.execute = AsyncMock(return_value=res)

    async def _db():
        yield db

    app.dependency_overrides[get_db] = _db
    for route in r.router.routes:
        if getattr(route, "path", "").endswith("/rankings/aggregate"):
            for dep in route.dependant.dependencies:
                if dep.name == "user":
                    app.dependency_overrides[dep.call] = lambda: MagicMock()
    pipeline = AsyncMock(return_value={"status": "ranking_complete"})
    return TestClient(app), patch.object(r.service, "run_ranking_pipeline", pipeline), pipeline


def _url():
    return f"/api/v1/sessions/{uuid.uuid4()}/rankings/aggregate"


def test_aggregate_defaults_to_session_method():
    c, p, pipe = _agg_client("top3_points")
    with p:
        assert c.post(_url()).status_code == 200
    assert pipe.await_args.kwargs["ranking_method"] == "top3_points"


def test_aggregate_borda_default_unchanged_for_legacy_session():
    c, p, pipe = _agg_client(None)
    with p:
        assert c.post(_url()).status_code == 200
    assert pipe.await_args.kwargs["ranking_method"] is None
    assert pipe.await_args.kwargs["participant_stakes"] is None


@pytest.mark.parametrize("session_method,requested", [("top3_points", "borda_count"), (None, "top3_points")])
def test_aggregate_refuses_method_that_does_not_match_ballots(session_method, requested):
    c, p, pipe = _agg_client(session_method)
    with p:
        r = c.post(_url(), params={"ranking_method": requested})
    assert r.status_code == 400
    pipe.assert_not_awaited()
