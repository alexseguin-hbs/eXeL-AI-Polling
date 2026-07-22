"""A3 — Cube 4 execution-mode dispatch (7 modes). The SAME analysis runs in every
mode; only the approver / automation changes. Pure + deterministic (mirrors the
challenge_loop tier gate). Automated auto-accepts ONLY inside the risk/confidence
guardrail; live always requires human authority."""

import pytest

from app.cubes.cube4_collector.analysis import (
    ANALYSIS_MODES,
    dispatch_analysis_mode,
    synthesize_analysis,
)


def _result(*, confidence=0.9, risk=0.1):
    # Minimal synthesized-shape object; dispatch only reads confidence + risk.
    return {"confidence": confidence, "risk": risk}


def test_all_seven_modes_registered():
    assert ANALYSIS_MODES == (
        "manual", "assisted", "semi_automated", "automated", "replay", "sandbox", "live",
    )


def test_invalid_mode_raises():
    with pytest.raises(ValueError):
        dispatch_analysis_mode(_result(), mode="turbo")


def test_sandbox_is_isolated_never_live():
    out = dispatch_analysis_mode(_result(), mode="sandbox")
    assert out["status"] == "sandboxed"


@pytest.mark.parametrize("match,status", [(True, "verified"), (False, "mismatch"), (None, "pending")])
def test_replay_reproducibility(match, status):
    out = dispatch_analysis_mode(_result(), mode="replay", replay_match=match)
    assert out["status"] == status


@pytest.mark.parametrize("mode", ["manual", "assisted"])
def test_manual_and_assisted_need_human_approval(mode):
    assert dispatch_analysis_mode(_result(), mode=mode, human_approved=False)["status"] == "pending"
    assert dispatch_analysis_mode(_result(), mode=mode, human_approved=True)["status"] == "accepted"


def test_semi_automated_needs_human_selection():
    assert dispatch_analysis_mode(_result(), mode="semi_automated", human_selected=False)["status"] == "pending"
    assert dispatch_analysis_mode(_result(), mode="semi_automated", human_selected=True)["status"] == "accepted"


def test_automated_accepts_only_inside_guardrail():
    # Inside the guardrail (risk <= 0.30, confidence >= 0.70) → accepted, no human.
    ok = dispatch_analysis_mode(_result(confidence=0.8, risk=0.2), mode="automated")
    assert ok["status"] == "accepted"
    # High risk → held even though automated.
    held_risk = dispatch_analysis_mode(_result(confidence=0.9, risk=0.5), mode="automated")
    assert held_risk["status"] == "held"
    # Low confidence → held even at zero risk.
    held_conf = dispatch_analysis_mode(_result(confidence=0.5, risk=0.0), mode="automated")
    assert held_conf["status"] == "held"


def test_live_requires_human_authority():
    assert dispatch_analysis_mode(_result(), mode="live", human_approved=False)["status"] == "pending"
    assert dispatch_analysis_mode(_result(), mode="live", human_approved=True)["status"] == "accepted"


def test_deterministic():
    r = _result(confidence=0.75, risk=0.25)
    assert dispatch_analysis_mode(r, mode="automated") == dispatch_analysis_mode(r, mode="automated")


def test_integrates_with_real_synthesized_result():
    # A real synthesized analysis object flows straight into dispatch.
    analysis = synthesize_analysis(
        analytics={"total_responses": 500, "unique_participants": 300,
                   "summary_coverage": 95, "top_theme": "mobile"},
        emerging={"convergence_score": 0.9, "emerging_leader": "mobile"},
        cqs=[{"composite_cqs": 0.85}],
    )
    out = dispatch_analysis_mode(analysis, mode="automated")
    assert out["mode"] == "automated"
    assert out["status"] in ("accepted", "held")
