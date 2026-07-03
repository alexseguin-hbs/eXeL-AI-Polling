"""Cube 7 — Category Filter: submit_user_ranking respects theme01_category.

Step 4 (2026-07-03) — the moderator's Theme 01 category selection
(risk/support/neutral) narrows the ranking pool to Theme 02 children
whose parent Theme 01 maps to that category. This test module verifies
the WireGuard-style filter at the input boundary.
"""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube7_ranking.ranking_submission import submit_user_ranking
from tests.conftest import seed_theme02_hierarchy


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _stub_db_for_submit(
    *,
    all_parents: list[MagicMock],
    theme02_ids_for_query: list[uuid.UUID],
    existing_ranking_id: uuid.UUID | None = None,
):
    """Build a mock AsyncSession that answers the three queries in order:

      1. parent lookup (when a category filter is set)
      2. valid Theme02 id lookup (level + optional parent-allowlist)
      3. duplicate-submission lookup

    `theme02_ids_for_query` is what the DB "returns" for query #2 — the
    caller controls which subset (matches the parent allowlist).
    """
    db = AsyncMock()
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.add = MagicMock()

    # Query 1 result — parents
    parent_result = MagicMock()
    parent_result.all.return_value = [(p.id, p.label) for p in all_parents]

    # Query 2 result — filtered Theme02 ids
    child_result = MagicMock()
    child_result.all.return_value = [(tid,) for tid in theme02_ids_for_query]

    # Query 3 result — duplicate check
    dup_result = MagicMock()
    dup_result.scalar_one_or_none.return_value = existing_ranking_id

    # Query 4 (only fires when broadcast runs) — submission count
    count_result = MagicMock()
    count_result.scalar.return_value = 1

    call_queue = [parent_result, child_result, dup_result, count_result]

    async def _execute(_stmt):
        return call_queue.pop(0) if call_queue else MagicMock()

    db.execute = _execute
    return db


# ---------------------------------------------------------------------------
# Category filter behavior
# ---------------------------------------------------------------------------


class TestCategoryFilterHappyPath:
    """When category matches parent, only that slice is voteable."""

    @pytest.mark.asyncio
    async def test_risk_category_accepts_risk_children(self):
        """Risk-only ranking accepts exactly the 3 Risk Theme02 children."""
        sess_id = uuid.uuid4()
        risk_parent, risk_kids = seed_theme02_hierarchy(
            sess_id, level="3", category="risk"
        )
        support_parent, support_kids = seed_theme02_hierarchy(
            sess_id, level="3", category="support"
        )

        db = _stub_db_for_submit(
            all_parents=[risk_parent, support_parent],
            theme02_ids_for_query=[k.id for k in risk_kids],
        )

        ranked = [k.id for k in risk_kids]
        ranking = await submit_user_ranking(
            db,
            session_id=sess_id,
            participant_id=uuid.uuid4(),
            ranked_theme_ids=ranked,
            theme2_voting_level="theme2_3",
            theme01_category="risk",
        )
        assert ranking.ranked_theme_ids == [str(t) for t in ranked]

    @pytest.mark.asyncio
    async def test_support_category_at_level_6(self):
        """Support category with level 6 accepts 6 children."""
        sess_id = uuid.uuid4()
        parent, kids = seed_theme02_hierarchy(
            sess_id, level="6", category="support"
        )
        db = _stub_db_for_submit(
            all_parents=[parent],
            theme02_ids_for_query=[k.id for k in kids],
        )
        ranked = [k.id for k in kids]
        ranking = await submit_user_ranking(
            db,
            session_id=sess_id,
            participant_id=uuid.uuid4(),
            ranked_theme_ids=ranked,
            theme2_voting_level="theme2_6",
            theme01_category="support",
        )
        assert len(ranking.ranked_theme_ids) == 6

    @pytest.mark.asyncio
    async def test_neutral_category_at_level_9(self):
        """Neutral category with level 9 accepts 9 children."""
        sess_id = uuid.uuid4()
        parent, kids = seed_theme02_hierarchy(
            sess_id, level="9", category="neutral"
        )
        db = _stub_db_for_submit(
            all_parents=[parent],
            theme02_ids_for_query=[k.id for k in kids],
        )
        ranked = [k.id for k in kids]
        ranking = await submit_user_ranking(
            db,
            session_id=sess_id,
            participant_id=uuid.uuid4(),
            ranked_theme_ids=ranked,
            theme2_voting_level="theme2_9",
            theme01_category="neutral",
        )
        assert len(ranking.ranked_theme_ids) == 9


class TestCategoryFilterRejection:
    """Wrong-category / cross-category submissions must be rejected."""

    @pytest.mark.asyncio
    async def test_cross_category_ids_rejected(self):
        """Submitting Support ids when moderator picked Risk is rejected."""
        sess_id = uuid.uuid4()
        risk_parent, risk_kids = seed_theme02_hierarchy(
            sess_id, level="3", category="risk"
        )
        support_parent, support_kids = seed_theme02_hierarchy(
            sess_id, level="3", category="support"
        )

        # DB narrows to risk_kids because category=risk
        db = _stub_db_for_submit(
            all_parents=[risk_parent, support_parent],
            theme02_ids_for_query=[k.id for k in risk_kids],
        )

        with pytest.raises(ValueError, match="Theme ID mismatch"):
            await submit_user_ranking(
                db,
                session_id=sess_id,
                participant_id=uuid.uuid4(),
                ranked_theme_ids=[k.id for k in support_kids],
                theme2_voting_level="theme2_3",
                theme01_category="risk",
            )

    @pytest.mark.asyncio
    async def test_missing_category_parent_raises_informative_error(self):
        """If no Theme 01 parent matches the category, we raise with hint."""
        sess_id = uuid.uuid4()
        # Only support parents exist — user asks for risk
        support_parent, _ = seed_theme02_hierarchy(
            sess_id, level="3", category="support"
        )
        db = _stub_db_for_submit(
            all_parents=[support_parent],
            theme02_ids_for_query=[],  # not consulted
        )

        with pytest.raises(ValueError, match="risk"):
            await submit_user_ranking(
                db,
                session_id=sess_id,
                participant_id=uuid.uuid4(),
                ranked_theme_ids=[uuid.uuid4() for _ in range(3)],
                theme2_voting_level="theme2_3",
                theme01_category="risk",
            )

    @pytest.mark.asyncio
    async def test_no_themes_at_level_error_mentions_category(self):
        """When parents match but level has no children, error mentions category."""
        sess_id = uuid.uuid4()
        risk_parent, _ = seed_theme02_hierarchy(
            sess_id, level="3", category="risk"
        )
        db = _stub_db_for_submit(
            all_parents=[risk_parent],
            theme02_ids_for_query=[],  # no level-6 children exist
        )
        with pytest.raises(ValueError, match=r"category=risk"):
            await submit_user_ranking(
                db,
                session_id=sess_id,
                participant_id=uuid.uuid4(),
                ranked_theme_ids=[uuid.uuid4() for _ in range(6)],
                theme2_voting_level="theme2_6",
                theme01_category="risk",
            )


class TestCategoryFilterBackwardsCompatible:
    """theme01_category=None keeps pre-Step-4 behavior."""

    @pytest.mark.asyncio
    async def test_no_category_all_themes_valid(self):
        """Unspecified category → no parent lookup, all-level themes valid."""
        sess_id = uuid.uuid4()
        _, kids = seed_theme02_hierarchy(sess_id, level="3", category="risk")

        db = AsyncMock()
        db.commit = AsyncMock()
        db.flush = AsyncMock()
        db.refresh = AsyncMock()
        db.add = MagicMock()

        # Only 2 queries fire when category is None: theme id lookup, dup check
        child_result = MagicMock()
        child_result.all.return_value = [(k.id,) for k in kids]
        dup_result = MagicMock()
        dup_result.scalar_one_or_none.return_value = None
        count_result = MagicMock()
        count_result.scalar.return_value = 1

        call_queue = [child_result, dup_result, count_result]

        async def _execute(_stmt):
            return call_queue.pop(0) if call_queue else MagicMock()

        db.execute = _execute

        ranking = await submit_user_ranking(
            db,
            session_id=sess_id,
            participant_id=uuid.uuid4(),
            ranked_theme_ids=[k.id for k in kids],
            theme2_voting_level="theme2_3",
            theme01_category=None,
        )
        assert ranking is not None


class TestCategoryFilterParentMapping:
    """The parent → category resolver must honor Cube 6 canonical labels."""

    @pytest.mark.asyncio
    async def test_risk_synonym_parent_still_resolves(self):
        """Parent labeled with a Risk synonym (e.g. 'Business Risks') resolves."""
        sess_id = uuid.uuid4()

        # Manually build a parent with a non-canonical but Risk-flavored label
        from tests.conftest import make_theme

        odd_parent = make_theme(
            session_id=sess_id, label="Business Risks", parent=None, level=None
        )
        children = [
            make_theme(session_id=sess_id, label=f"Risk Sub {i}",
                       parent=odd_parent, level="3")
            for i in range(3)
        ]

        db = _stub_db_for_submit(
            all_parents=[odd_parent],
            theme02_ids_for_query=[c.id for c in children],
        )
        ranking = await submit_user_ranking(
            db,
            session_id=sess_id,
            participant_id=uuid.uuid4(),
            ranked_theme_ids=[c.id for c in children],
            theme2_voting_level="theme2_3",
            theme01_category="risk",
        )
        assert len(ranking.ranked_theme_ids) == 3
