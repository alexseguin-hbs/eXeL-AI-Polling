"""AsM round 5 (Athena): after a re-open the ballot is the CURRENT cycle's themes, never cycle 1's beside them.

Themes are stored per cycle (phase_b `_replace_cycle_themes`) and a re-open keeps the earlier cycle's rows. Before
this, GET /themes and submit_user_ranking read every cycle, so a re-themed cycle 2 put 18 themes on a 9-theme ballot.
`ballot_cycle_clause` scopes both to exactly the session's current cycle (round 6: no fallback to an earlier one). Real Postgres
(the SQL-tally parity database); skipped when none is reachable — CI fails if it skips.
"""
from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

import pytest

from tests.cube7.test_sql_tally_parity import _engine, _reachable

pytestmark = pytest.mark.skipif(not _reachable(), reason="no local Postgres for the ballot-cycle proof")

_SESSION_SQL = (
    "insert into sessions (id, short_code, created_by, status, title, anonymity_mode, cycle_mode, max_cycles, "
    "current_cycle, ranking_mode, language, max_response_length, ai_provider, stt_provider, realtime_stt_enabled, "
    "realtime_stt_provider, allow_user_stt_choice, theme_id, session_type, polling_mode, polling_mode_type, "
    "timer_display_mode, pricing_tier, fee_amount_cents, estimated_cost_cents, cost_splitting_enabled, "
    "reward_enabled, reward_amount_cents, theme2_voting_level, live_feed_enabled, is_paid) values "
    "(:id, :code, 't', 'ranking', 't', 'anonymous', 'multi', 3, :cyc, 'auto', 'en', 3333, 'openai', 'whisper', "
    "false, 'none', false, 'exel-cyan', 'polling', 'live', 'live_interactive', 'countdown', 'free', 0, 0, "
    "false, false, 0, 'theme2_9', true, false)"
)
_THEME_SQL = (
    "insert into themes (id, session_id, cycle_id, label, summary, confidence, response_count, ai_provider, ai_model, "
    "parent_theme_id, cluster_metadata) values (:id, :s, :c, :l, 'x', 0.7, 1, 'offline', 'sim', :p, cast(:m as json))"
)


async def _themed_cycle(conn, sid, cycle):
    """One Risk parent + nine level-9 children for `cycle`; returns the children's ids."""
    from sqlalchemy import text

    parent = uuid.uuid4()
    await conn.execute(text(_THEME_SQL), {"id": parent, "s": sid, "c": cycle, "l": "Risk & Concerns", "p": None, "m": None})
    kids = [uuid.uuid4() for _ in range(9)]
    for i, k in enumerate(kids):
        await conn.execute(text(_THEME_SQL), {"id": k, "s": sid, "c": cycle, "l": f"c{cycle} theme {i}", "p": parent,
                                               "m": '{"level": "9"}'})
    return kids


def test_reopened_cycle_ballots_only_the_current_cycle():
    async def run():
        from sqlalchemy import text
        from sqlalchemy.ext.asyncio import AsyncSession

        from app.cubes.cube6_ai.pipeline import get_session_themes_enriched
        from app.cubes.cube7_ranking.ranking_submission import submit_user_ranking
        from app.models.participant import Participant

        eng = await _engine()
        sid = uuid.uuid4()
        async with eng.begin() as conn:
            await conn.execute(text(_SESSION_SQL), {"id": sid, "code": "CYC" + uuid.uuid4().hex[:5].upper(), "cyc": 1})
            c1 = await _themed_cycle(conn, sid, 1)
        async with AsyncSession(eng) as db:
            rows = await get_session_themes_enriched(db, sid, ballot_cycle_only=True)
            assert sorted(r["id"] for r in rows if r["theme_level"] == "9") == sorted(c1), "cycle 1 ballot = cycle 1"

        # Re-open (cycle 2), not re-themed yet: the ballot is EMPTY (the client waits) and no ballot is taken —
        # never cycle 1's themes while cycle 2's theming runs (Enki + Christo, round 6).
        async with eng.begin() as conn:
            await conn.execute(text("update sessions set current_cycle = 2 where id = :id"), {"id": sid})
        async with AsyncSession(eng) as db:
            rows = await get_session_themes_enriched(db, sid, ballot_cycle_only=True)
            assert rows == [], f"an un-themed re-opened round has no ballot yet (got {len(rows)})"
            early = Participant(session_id=sid, user_id=f"u:{uuid.uuid4()}", display_name="v", device_type="test",
                                joined_at=datetime.now(timezone.utc), is_active=True, language_code="en")
            db.add(early)
            await db.flush()
            with pytest.raises(ValueError, match="No (themes|Theme 01 parents)"):
                await submit_user_ranking(db, sid, early.id, c1, cycle_id=2, theme2_voting_level="theme2_9",
                                          theme01_category="risk")
            await db.rollback()

        # Cycle 2 themed: exactly cycle 2's nine — never 18.
        async with eng.begin() as conn:
            c2 = await _themed_cycle(conn, sid, 2)
        async with AsyncSession(eng) as db:
            nine = [r["id"] for r in await get_session_themes_enriched(db, sid, ballot_cycle_only=True) if r["theme_level"] == "9"]
            assert sorted(nine) == sorted(c2), f"cycle 2 ballot = cycle 2's nine (got {len(nine)})"
            every = await get_session_themes_enriched(db, sid)
            assert len([r for r in every if r["theme_level"] == "9"]) == 18, "history still keeps both cycles"

            async def voter():
                p = Participant(session_id=sid, user_id=f"u:{uuid.uuid4()}", display_name="v", device_type="test",
                                joined_at=datetime.now(timezone.utc), is_active=True, language_code="en")
                db.add(p)
                await db.flush()
                return p.id

            with pytest.raises(ValueError, match="mismatch"):
                await submit_user_ranking(db, sid, await voter(), c1, cycle_id=2, theme2_voting_level="theme2_9",
                                          theme01_category="risk")
            await db.rollback()
            ok = await submit_user_ranking(db, sid, await voter(), list(reversed(c2)), cycle_id=2,
                                           theme2_voting_level="theme2_9", theme01_category="risk")
            assert ok.cycle_id == 2
            await db.rollback()
        await eng.dispose()

    asyncio.run(run())
