"""Cube 7 — Readiness Profile (Q3): the R-Core production gatherer.

Memo (Master of Thought): every CRS/session gets a readiness profile answering
"why is it scored where it is, what evidence backs it, what are the risks, which
pillar is weak, what's the highest-impact next move, and is it ready to advance."

`readiness_profile` GATHERS the REAL session signals — SSSES (metrics triad),
confidence (AggregatedRanking.confidence_avg), consensus (anti-sybil anomalies),
replay-verified (verify_replay), human-authority (GovernanceOverride presence),
simulation (challenge verdict, caller-supplied), risk (thin-data/low-confidence) —
and feeds them into the PURE `compute_readiness` / `project_readiness` (Q2). Each
gather is guarded so a single missing source degrades the profile rather than 500-ing.

Honest scope: there is no per-pillar SSSES MEASUREMENT engine yet, so the `ssses`
input is an evidence-derived PROXY from the metrics triad (flagged
`ssses_basis="evidence_proxy"`) unless the caller passes real audited pillar scores.
Real-DB E2E is mock-tested (JSONB-on-SQLite blocks a full DB round-trip).
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.cubes.cube7_ranking import metrics as ranking_metrics
from app.cubes.cube7_ranking.qualification import compute_readiness, project_readiness

logger = structlog.get_logger(__name__)


def _clamp01(x: float) -> float:
    return 0.0 if x < 0 else 1.0 if x > 1 else x


def _evidence_proxy_ssses(system: dict, outcome: dict, consensus: float) -> dict:
    """Evidence-derived SSSES pillar PROXY (0-100) from the real metrics triad.

    NOT a code-audit score — a transparent map from measurable evidence to pillars,
    the honest default until a real SSSES measurement engine lands. Overridable by a
    caller passing audited pillar scores.
      security     — anti-sybil cleanliness (consensus, i.e. absence of anomalies)
      stability    — determinism ready (aggregator algorithm persisted → replayable)
      scalability  — submission volume reaching a working threshold (50)
      efficiency   — a final aggregation exists (pipeline completed)
      succinctness — a winner was determined (result is a single clear outcome)
    """
    submissions = int(system.get("ranking_submissions", 0) or 0)
    return {
        "security": round(_clamp01(consensus) * 100, 2),
        "stability": 100.0 if outcome.get("determinism_ready") else 0.0,
        "scalability": round(min(submissions / 50.0, 1.0) * 100, 2),
        "efficiency": 100.0 if system.get("has_final_aggregation") else 0.0,
        "succinctness": 100.0 if outcome.get("winner_determined") else 0.0,
    }


async def _safe(coro, default):
    try:
        return await coro
    except Exception as exc:  # noqa: BLE001 — a missing source degrades, never fails
        logger.warning("cube7.readiness.source_unavailable", error=str(exc))
        return default


async def readiness_profile(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    cycle_id: int = 1,
    source_crs: str | None = None,
    ssses: dict | None = None,
    simulation_passed: bool = False,
) -> dict:
    """Compose the real session signals into the memo's readiness answer object.

    `ssses` — optional audited per-pillar scores (0-100); when omitted an evidence
    proxy is derived from the metrics triad. `simulation_passed` — the challenge
    verdict (no persistent per-session store yet, so caller-supplied; defaults False).
    """
    from app.cubes.cube7_ranking.ranking_governance import (
        detect_voting_anomalies,
        verify_replay,
    )

    # 1. SSSES metrics triad (System / User / Outcome) — the evidence base.
    m = await _safe(
        ranking_metrics.get_all_metrics(db, session_id),
        {"system": {}, "user": {}, "outcome": {}},
    )
    system, user, outcome = m.get("system", {}), m.get("user", {}), m.get("outcome", {})

    # 2. Confidence — top-theme aggregation confidence.
    confidence = _clamp01(float(outcome.get("top_theme_confidence", 0.0) or 0.0))

    # 3. Consensus — anti-sybil cleanliness (fewer anomalies → higher agreement).
    anomalies = await _safe(detect_voting_anomalies(db, session_id, cycle_id), [])
    consensus = _clamp01(1.0 - 0.25 * len(anomalies)) if anomalies else 1.0

    # 4. Replay — independently recomputed order matches (match is True/False/None).
    replay = await _safe(verify_replay(db, session_id, cycle_id), {"match": None})
    replay_verified = replay.get("match") is True

    # 5. Human authority — a GovernanceOverride was recorded (a human reviewed/acted).
    human_authority = int(system.get("governance_overrides", 0) or 0) > 0

    # 6. Risk (0-1, higher = worse) — thin data + low confidence raise it.
    submissions = int(system.get("ranking_submissions", 0) or 0)
    sparse = 1.0 if submissions < 10 else (0.5 if submissions < 30 else 0.0)
    risk = round(_clamp01(0.5 * (1.0 - confidence) + 0.5 * sparse), 4)

    # 7. SSSES pillars — audited scores if supplied, else the evidence proxy.
    ssses_basis = "audited" if ssses else "evidence_proxy"
    pillars = ssses or _evidence_proxy_ssses(system, outcome, consensus)

    readiness = compute_readiness(
        ssses=pillars,
        confidence=confidence,
        evidence_quality=confidence,  # top-theme confidence is the evidence quality proxy
        consensus=consensus,
        risk=risk,
        replay_verified=replay_verified,
        human_authority=human_authority,
        simulation_passed=simulation_passed,
    )

    return {
        "session_id": str(session_id),
        "source_crs": source_crs,
        "readiness": readiness,
        "signals": {
            "confidence": confidence,
            "consensus": consensus,
            "risk": risk,
            "replay_verified": replay_verified,
            "replay_match": replay.get("match"),
            "human_authority": human_authority,
            "simulation_passed": simulation_passed,
            "anomaly_count": len(anomalies),
            "ranking_submissions": submissions,
        },
        "ssses": {"basis": ssses_basis, "pillars": pillars},
        "metrics": {"system": system, "user": user, "outcome": outcome},
        "why": readiness["explanation"],
        "highest_impact": readiness["highest_impact"],
        "blocking": readiness["blocking"],
        "ready_to_advance": readiness["ready"],
    }


async def project_session_readiness(
    db: AsyncSession,
    session_id: uuid.UUID,
    planned_deltas: dict,
    *,
    cycle_id: int = 1,
    ssses: dict | None = None,
    simulation_passed: bool = False,
) -> dict:
    """Current vs PROJECTED readiness for a session given planned signal improvements.

    Reconstructs the current compute_readiness kwargs from the gathered profile, then
    reuses the pure `project_readiness` (Q2). Honest scope: a current+deltas projection,
    not a statistical forecast.
    """
    profile = await readiness_profile(
        db, session_id, cycle_id=cycle_id, ssses=ssses, simulation_passed=simulation_passed,
    )
    s = profile["signals"]
    current = {
        "ssses": profile["ssses"]["pillars"],
        "confidence": s["confidence"],
        "evidence_quality": s["confidence"],
        "consensus": s["consensus"],
        "risk": s["risk"],
        "replay_verified": s["replay_verified"],
        "human_authority": s["human_authority"],
        "simulation_passed": s["simulation_passed"],
    }
    return project_readiness(current, planned_deltas)
