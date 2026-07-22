"""R6 + Q2 lock: Cube 7 qualification gateway — evidence-driven readiness scoring."""

from app.cubes.cube7_ranking.qualification import compute_readiness, project_readiness


def test_fully_qualified_is_ready():
    r = compute_readiness(
        ssses={"security": 100, "stability": 100, "scalability": 100,
               "efficiency": 100, "succinctness": 100},
        confidence=1.0, evidence_quality=1.0, consensus=1.0, risk=0.0,
        replay_verified=True, human_authority=True, simulation_passed=True,
    )
    assert r["readiness_score"] == 100.0
    assert r["ready"] is True
    assert r["blocking"] == []


def test_blocking_gate_prevents_ready_even_high_score():
    # High SSSES + confidence + evidence but no human authority → blocked, not ready.
    r = compute_readiness(
        ssses={p: 100 for p in ("security", "stability", "scalability", "efficiency", "succinctness")},
        confidence=1.0, evidence_quality=1.0,
        replay_verified=True, human_authority=False, simulation_passed=True,
    )
    assert r["ready"] is False
    assert "human_authority" in r["blocking"]


def test_highest_impact_points_at_biggest_weighted_gap():
    # Everything maxed except SSSES (weight 0.40) → SSSES is the highest-impact move.
    r = compute_readiness(
        ssses={p: 0 for p in ("security", "stability", "scalability", "efficiency", "succinctness")},
        confidence=1.0, evidence_quality=1.0,
        replay_verified=True, human_authority=True, simulation_passed=True,
    )
    assert r["highest_impact"] == "ssses"


def test_worst_case_is_zero_and_blocked():
    # True worst case: max risk (low_risk=0) + no evidence + no gates.
    r = compute_readiness(risk=1.0)
    assert r["readiness_score"] == 0.0
    assert r["ready"] is False
    assert set(r["blocking"]) == {"replay_verified", "human_authority", "simulation_passed"}


def test_q2_risk_and_consensus_affect_score():
    base = dict(ssses={p: 100 for p in ("security", "stability", "scalability",
                                        "efficiency", "succinctness")},
               confidence=1.0, evidence_quality=1.0,
               replay_verified=True, human_authority=True, simulation_passed=True)
    high = compute_readiness(**base, consensus=1.0, risk=0.0)
    low = compute_readiness(**base, consensus=0.0, risk=1.0)
    # consensus (0.10) + low_risk (0.10) = 20 points swing.
    assert round(high["readiness_score"] - low["readiness_score"], 1) == 20.0


def test_project_readiness_shows_delta_and_flip():
    current = dict(ssses={p: 100 for p in ("security", "stability", "scalability",
                                           "efficiency", "succinctness")},
                  confidence=1.0, evidence_quality=1.0, consensus=1.0, risk=0.0,
                  replay_verified=True, simulation_passed=True,
                  human_authority=False)  # one gate missing → not ready
    proj = project_readiness(current, {"human_authority": True})
    assert proj["current"]["ready"] is False
    assert proj["projected"]["ready"] is True
    assert proj["would_become_ready"] is True
    assert proj["delta"] > 0


def test_deterministic():
    kw = dict(ssses={"security": 80, "stability": 70, "scalability": 90,
                     "efficiency": 60, "succinctness": 75},
              confidence=0.8, evidence_quality=0.7,
              replay_verified=True, human_authority=False, simulation_passed=True)
    assert compute_readiness(**kw) == compute_readiness(**kw)


def test_factors_sum_to_readiness():
    r = compute_readiness(
        ssses={"security": 90, "stability": 80, "scalability": 70,
               "efficiency": 60, "succinctness": 50},
        confidence=0.5, evidence_quality=0.5,
        replay_verified=True, human_authority=True, simulation_passed=False,
    )
    assert abs(sum(r["factors"].values()) - r["readiness_score"]) < 1e-6
