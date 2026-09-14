"""Cube 7 — Living re-vote: submit_user_ranking replaces an open ballot in place.

Operator 2026-09-14 ("we need entire voting functionality working!" — live priorities
that re-aggregate). A participant who already voted in the open cycle may adjust their
ballot: with allow_revote=True the existing row is UPDATED (new order + timestamp) and
the submission count is unchanged; with allow_revote=False (default) a second submission
still raises, preserving one-ballot-per-cycle callers.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube7_ranking.ranking_submission import submit_user_ranking
from tests.conftest import seed_theme02_hierarchy


def _stub_db(*, valid_ids: list[uuid.UUID], prior_ranking=None):
    """Mock AsyncSession answering: (1) valid Theme02 ids, (2) existing-ballot lookup."""
    db = AsyncMock()
    db.commit = AsyncMock(); db.flush = AsyncMock(); db.refresh = AsyncMock(); db.add = MagicMock()

    child_result = MagicMock()
    child_result.all.return_value = [(tid,) for tid in valid_ids]
    dup_result = MagicMock()
    dup_result.scalar_one_or_none.return_value = prior_ranking
    count_result = MagicMock()
    count_result.scalar.return_value = 1

    queue = [child_result, dup_result, count_result]

    async def _execute(_stmt):
        return queue.pop(0) if queue else MagicMock()

    db.execute = _execute
    return db


@pytest.mark.asyncio
async def test_revote_replaces_ballot_in_place():
    """allow_revote=True updates the existing ballot's order + timestamp (no new row)."""
    sess_id = uuid.uuid4()
    _parent, kids = seed_theme02_hierarchy(sess_id, level="3", category="neutral")
    valid = [k.id for k in kids]

    # Prior ballot with the reverse order and an old timestamp.
    prior = MagicMock()
    prior.ranked_theme_ids = [str(t) for t in reversed(valid)]
    prior.submitted_at = datetime(2020, 1, 1, tzinfo=timezone.utc)

    db = _stub_db(valid_ids=valid, prior_ranking=prior)
    new_order = valid  # forward order now
    ranking = await submit_user_ranking(
        db,
        session_id=sess_id,
        participant_id=uuid.uuid4(),
        ranked_theme_ids=new_order,
        theme2_voting_level="theme2_3",
        allow_revote=True,
    )
    # Same object updated in place — never a second db.add.
    assert ranking is prior
    db.add.assert_not_called()
    assert prior.ranked_theme_ids == [str(t) for t in new_order]
    assert prior.submitted_at > datetime(2020, 1, 2, tzinfo=timezone.utc)


@pytest.mark.asyncio
async def test_second_submission_without_revote_still_raises():
    """Default allow_revote=False preserves one-ballot-per-cycle rejection."""
    sess_id = uuid.uuid4()
    _parent, kids = seed_theme02_hierarchy(sess_id, level="3", category="risk")
    valid = [k.id for k in kids]
    prior = MagicMock()

    db = _stub_db(valid_ids=valid, prior_ranking=prior)
    with pytest.raises(ValueError, match="already submitted"):
        await submit_user_ranking(
            db,
            session_id=sess_id,
            participant_id=uuid.uuid4(),
            ranked_theme_ids=valid,
            theme2_voting_level="theme2_3",
        )


@pytest.mark.asyncio
async def test_first_ballot_inserts_new_row():
    """No prior ballot → a new Ranking is added even with allow_revote=True."""
    sess_id = uuid.uuid4()
    _parent, kids = seed_theme02_hierarchy(sess_id, level="3", category="support")
    valid = [k.id for k in kids]

    db = _stub_db(valid_ids=valid, prior_ranking=None)
    ranking = await submit_user_ranking(
        db,
        session_id=sess_id,
        participant_id=uuid.uuid4(),
        ranked_theme_ids=valid,
        theme2_voting_level="theme2_3",
        allow_revote=True,
    )
    db.add.assert_called_once()
    assert ranking.ranked_theme_ids == [str(t) for t in valid]
