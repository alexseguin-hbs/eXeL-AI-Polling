"""Cube 7 — Qualification Gateway (R6): evidence-driven readiness scoring.

Memo (Master of Thought): "rankings become evidence-driven rather than score-driven …
an overall readiness score supported by SSSES pillar results, confidence, evidence
quality, replay history, Human Authority reviews, and simulation outcomes … explain
WHY a result achieved its position and identify the highest-impact improvement."

This is a PURE, deterministic scoring function — it consumes signals the platform
already produces (compare_metrics SSSES pillars, cqs_engine evidence quality,
verify_replay determinism, GovernanceOverride human authority, the sim verdict) and
folds them into ONE readiness score with a transparent factor breakdown, the blocking
gates, and the single highest-impact next improvement. No DB, no side effects.
"""

from __future__ import annotations

_PILLARS = ("security", "stability", "scalability", "efficiency", "succinctness")

# Factor weights (sum = 1.0). SSSES carries the most weight; the trust gates
# (replay / human authority / simulation) are smaller but are also hard blockers.
_WEIGHTS = {
    "ssses": 0.40,
    "confidence": 0.15,
    "evidence": 0.15,
    "replay_verified": 0.10,
    "human_authority": 0.10,
    "simulation_passed": 0.10,
}
# Gates that MUST be true to advance regardless of score (Thor's guardrail).
_BLOCKING_GATES = ("replay_verified", "human_authority", "simulation_passed")


def _clamp01(x: float) -> float:
    return 0.0 if x < 0 else 1.0 if x > 1 else x


def compute_readiness(
    *,
    ssses: dict[str, float] | None = None,
    confidence: float = 0.0,
    evidence_quality: float = 0.0,
    replay_verified: bool = False,
    human_authority: bool = False,
    simulation_passed: bool = False,
) -> dict:
    """Fold evidence signals into a 0-100 readiness score + a transparent breakdown.

    ssses           — per-pillar scores 0-100 (from compare_metrics); missing → 0.
    confidence      — 0-1 (theme/aggregation confidence).
    evidence_quality— 0-1 (CQS composite of the supporting responses).
    replay_verified / human_authority / simulation_passed — the three trust gates.

    Returns {readiness_score, factors, blocking, ready, highest_impact, explanation}.
    Deterministic + pure.
    """
    pillars = ssses or {}
    ssses_avg = sum(float(pillars.get(p, 0.0)) for p in _PILLARS) / len(_PILLARS)  # 0-100

    # Normalize every factor to 0-1, then weight.
    norm = {
        "ssses": _clamp01(ssses_avg / 100.0),
        "confidence": _clamp01(confidence),
        "evidence": _clamp01(evidence_quality),
        "replay_verified": 1.0 if replay_verified else 0.0,
        "human_authority": 1.0 if human_authority else 0.0,
        "simulation_passed": 1.0 if simulation_passed else 0.0,
    }
    factors = {k: round(_WEIGHTS[k] * v * 100.0, 2) for k, v in norm.items()}  # points of 100
    readiness = round(sum(factors.values()), 2)

    blocking = [g for g in _BLOCKING_GATES if not norm[g]]
    ready = readiness >= 80.0 and not blocking

    # Highest-impact improvement = the factor with the most unrealized weighted points
    # (weight × room-to-improve). This tells a team the single best next move.
    gaps = {k: round(_WEIGHTS[k] * (1.0 - v) * 100.0, 2) for k, v in norm.items()}
    highest_impact = max(gaps, key=lambda k: (gaps[k], k)) if any(gaps.values()) else None

    if ready:
        explanation = f"Ready — readiness {readiness}/100 with all trust gates satisfied."
    elif blocking:
        explanation = (
            f"Not ready — blocked on {', '.join(blocking)}. "
            f"Highest-impact next step: {highest_impact} (+{gaps.get(highest_impact, 0)} pts)."
        )
    else:
        explanation = (
            f"Not ready — readiness {readiness}/100 below the 80 bar. "
            f"Highest-impact next step: {highest_impact} (+{gaps.get(highest_impact, 0)} pts)."
        )

    return {
        "readiness_score": readiness,
        "factors": factors,
        "blocking": blocking,
        "ready": ready,
        "highest_impact": highest_impact,
        "explanation": explanation,
    }
