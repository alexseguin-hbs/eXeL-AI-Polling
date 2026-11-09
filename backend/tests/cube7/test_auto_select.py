"""CRS-36 Round 1 variable auto-select — pure helpers + submit gate."""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.cubes.cube7_ranking import auto_select as a36
from app.cubes.cube7_ranking import ranking_aggregation as ra
from app.cubes.cube7_ranking import ranking_submission as rs


def test_selected_count_n_wins_then_percent_then_all():
    assert a36.selected_count(10, 40.0, 4) == 4
    assert a36.selected_count(10, 40.0, None) == 4
    assert a36.selected_count(10, None, 3) == 3
    assert a36.selected_count(10, None, None) == 10
    assert a36.selected_count(0, 40.0, 4) == 0
    assert a36.selected_count(3, 40.0, None) == 2  # ceil(1.2) = 2


def test_validate_config_ranges():
    a36.validate_auto_select_config(None, None)
    a36.validate_auto_select_config(40.0, 4)
    with pytest.raises(ValueError):
        a36.validate_auto_select_config(0, None)
    with pytest.raises(ValueError):
        a36.validate_auto_select_config(101, None)
    with pytest.raises(ValueError):
        a36.validate_auto_select_config(None, 0)


def test_replay_token_off_is_none_configured_changes_hash():
    assert a36.auto_select_replay_token(None, None, None) is None
    t1 = a36.auto_select_replay_token(40.0, 4, {"support": ["a"], "risk": [], "neutral": []})
    t2 = a36.auto_select_replay_token(50.0, 4, {"support": ["a"], "risk": [], "neutral": []})
    assert t1 and t2 and t1 != t2
    p1 = ra._replay_prefix("seed", "top3_points", None, "9")
    p2 = ra._replay_prefix("seed", "top3_points", None, "9", t1)
    assert p1 != p2
    assert t1 in p2


def test_pick_top_stable():
    ids = [uuid.uuid4() for _ in range(10)]
    assert a36.pick_top(ids, 40.0, 4) == ids[:4]
    assert a36.pick_top(ids, None, None) == ids


def test_enforce_rejects_outside_shortlist():
    session = MagicMock()
    session.auto_select_percent = 40.0
    session.auto_select_n = 4
    a, b, c = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    session.auto_select_theme_ids = {"support": [str(a), str(b)]}
    a36.enforce_auto_select_subset(session, "support", [a])
    with pytest.raises(ValueError, match="not auto-selected"):
        a36.enforce_auto_select_subset(session, "support", [c])


def test_enforce_noop_when_round1_off():
    session = MagicMock()
    session.auto_select_percent = None
    session.auto_select_n = None
    session.auto_select_theme_ids = None
    a36.enforce_auto_select_subset(session, "support", [uuid.uuid4()])


@pytest.mark.asyncio
async def test_submit_top3_respects_auto_select_gate():
    sup = [uuid.uuid4() for _ in range(9)]
    valid = {"support": set(sup)}
    session = MagicMock()
    session.auto_select_percent = 40.0
    session.auto_select_n = 4
    session.auto_select_theme_ids = {"support": [str(x) for x in sup[:4]]}
    db = MagicMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    res = MagicMock()
    res.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=res)
    with patch.object(rs, "valid_theme_ids_by_category", AsyncMock(return_value=valid)):
        ok = await rs.submit_top3_ballot(
            db, uuid.uuid4(), uuid.uuid4(), {"support": sup[:3]}, session=session
        )
        assert ok is not None
        with pytest.raises(ValueError, match="not auto-selected"):
            await rs.submit_top3_ballot(
                db, uuid.uuid4(), uuid.uuid4(), {"support": [sup[8]]}, session=session
            )
