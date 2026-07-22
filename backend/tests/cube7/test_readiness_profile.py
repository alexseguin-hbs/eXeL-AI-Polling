"""Q3 — Cube 7 readiness_profile: the real-DB gatherer folding session signals into
the pure compute_readiness. Mock-tested (JSONB-on-SQLite blocks full DB E2E); the
gather sources are patched so the composition + guards are exercised deterministically."""

import asyncio
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.cubes.cube7_ranking import readiness as R


def _run(coro):
    return asyncio.run(coro)


_METRICS_STRONG = {
    "cube": "cube7_ranking",
    "system": {"ranking_submissions": 120, "has_final_aggregation": True,
               "governance_overrides": 1, "algorithm": "quadratic_borda"},
    "user": {"unique_rankers": 40},
    "outcome": {"winner_determined": True, "top_theme_confidence": 0.9,
                "determinism_ready": True},
}
_METRICS_THIN = {
    "cube": "cube7_ranking",
    "system": {"ranking_submissions": 3, "has_final_aggregation": False,
               "governance_overrides": 0},
    "user": {"unique_rankers": 2},
    "outcome": {"winner_determined": False, "top_theme_confidence": 0.2,
                "determinism_ready": False},
}


def _patched(metrics, *, replay_match, anomalies):
    return (
        patch.object(R.ranking_metrics, "get_all_metrics", AsyncMock(return_value=metrics)),
        patch("app.cubes.cube7_ranking.ranking_governance.verify_replay",
              AsyncMock(return_value={"match": replay_match, "replay_hash": "a" * 64})),
        patch("app.cubes.cube7_ranking.ranking_governance.detect_voting_anomalies",
              AsyncMock(return_value=anomalies)),
    )


def test_strong_session_is_ready():
    # All three trust gates satisfied — replay verified, human authority present,
    # simulation passed (caller-supplied) → ready to advance.
    p1, p2, p3 = _patched(_METRICS_STRONG, replay_match=True, anomalies=[])
    with p1, p2, p3:
        prof = _run(R.readiness_profile(AsyncMock(), uuid.uuid4(), simulation_passed=True))
    assert prof["ready_to_advance"] is True
    assert prof["blocking"] == []
    assert prof["signals"]["replay_verified"] is True
    assert prof["signals"]["human_authority"] is True  # governance override present
    assert prof["ssses"]["basis"] == "evidence_proxy"


def test_strong_session_without_sim_is_blocked_on_simulation():
    # Same strong session but no sim pass → the simulation gate blocks advancement.
    p1, p2, p3 = _patched(_METRICS_STRONG, replay_match=True, anomalies=[])
    with p1, p2, p3:
        prof = _run(R.readiness_profile(AsyncMock(), uuid.uuid4()))
    assert prof["ready_to_advance"] is False
    assert prof["blocking"] == ["simulation_passed"]


def test_thin_session_blocked_and_risky():
    p1, p2, p3 = _patched(_METRICS_THIN, replay_match=None, anomalies=[])
    with p1, p2, p3:
        prof = _run(R.readiness_profile(AsyncMock(), uuid.uuid4()))
    assert prof["ready_to_advance"] is False
    # No replay-verified, no human authority, no sim → all three gates block.
    assert set(prof["blocking"]) == {"replay_verified", "human_authority", "simulation_passed"}
    assert prof["signals"]["risk"] > 0.5
    assert prof["highest_impact"] is not None


def test_anomalies_lower_consensus():
    p1, p2, p3 = _patched(_METRICS_STRONG, replay_match=True,
                          anomalies=[{"type": "identical_ranking_burst"}])
    with p1, p2, p3:
        prof = _run(R.readiness_profile(AsyncMock(), uuid.uuid4()))
    assert prof["signals"]["anomaly_count"] == 1
    assert prof["signals"]["consensus"] == 0.75  # 1 - 0.25*1


def test_audited_ssses_overrides_proxy():
    audited = {p: 100 for p in ("security", "stability", "scalability",
                                "efficiency", "succinctness")}
    p1, p2, p3 = _patched(_METRICS_STRONG, replay_match=True, anomalies=[])
    with p1, p2, p3:
        prof = _run(R.readiness_profile(AsyncMock(), uuid.uuid4(), ssses=audited))
    assert prof["ssses"]["basis"] == "audited"
    assert prof["ssses"]["pillars"] == audited


def test_source_error_degrades_not_fails():
    # get_all_metrics raises → _safe default {}; profile still returns (guarded).
    with patch.object(R.ranking_metrics, "get_all_metrics",
                      AsyncMock(side_effect=RuntimeError("db down"))), \
         patch("app.cubes.cube7_ranking.ranking_governance.verify_replay",
               AsyncMock(return_value={"match": None})), \
         patch("app.cubes.cube7_ranking.ranking_governance.detect_voting_anomalies",
               AsyncMock(return_value=[])):
        prof = _run(R.readiness_profile(AsyncMock(), uuid.uuid4()))
    assert prof["ready_to_advance"] is False
    assert "readiness" in prof


def test_project_session_readiness_flip():
    # Strong but no human authority → adding it should flip readiness.
    metrics = {**_METRICS_STRONG,
               "system": {**_METRICS_STRONG["system"], "governance_overrides": 0}}
    p1, p2, p3 = _patched(metrics, replay_match=True, anomalies=[])
    with p1, p2, p3:
        proj = _run(R.project_session_readiness(
            AsyncMock(), uuid.uuid4(),
            {"human_authority": True, "simulation_passed": True},
        ))
    assert proj["current"]["ready"] is False
    assert proj["would_become_ready"] is True
    assert proj["delta"] > 0
