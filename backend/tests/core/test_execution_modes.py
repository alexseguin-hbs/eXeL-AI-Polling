"""Shared R-Core execution-mode dispatch — the build-once approver/automation gate
consumed by cubes 4/5/6/7/8. Pure + deterministic; automated gated by guardrail."""

import pytest

from app.core.rcore.execution_modes import (
    DEFAULT_MAX_RISK,
    DEFAULT_MIN_CONFIDENCE,
    EXECUTION_MODES,
    dispatch_execution_mode,
)


def _r(*, confidence=0.9, risk=0.1):
    return {"confidence": confidence, "risk": risk}


def test_seven_modes():
    assert EXECUTION_MODES == (
        "manual", "assisted", "semi_automated", "automated", "replay", "sandbox", "live",
    )


def test_invalid_mode_raises():
    with pytest.raises(ValueError):
        dispatch_execution_mode(_r(), mode="turbo")


def test_sandbox_and_replay():
    assert dispatch_execution_mode(_r(), mode="sandbox")["status"] == "sandboxed"
    assert dispatch_execution_mode(_r(), mode="replay", replay_match=True)["status"] == "verified"
    assert dispatch_execution_mode(_r(), mode="replay", replay_match=False)["status"] == "mismatch"
    assert dispatch_execution_mode(_r(), mode="replay", replay_match=None)["status"] == "pending"


@pytest.mark.parametrize("mode", ["manual", "assisted"])
def test_manual_assisted_need_approval(mode):
    assert dispatch_execution_mode(_r(), mode=mode)["status"] == "pending"
    assert dispatch_execution_mode(_r(), mode=mode, human_approved=True)["status"] == "accepted"


def test_semi_needs_selection():
    assert dispatch_execution_mode(_r(), mode="semi_automated")["status"] == "pending"
    assert dispatch_execution_mode(_r(), mode="semi_automated", human_selected=True)["status"] == "accepted"


def test_automated_guardrail():
    assert dispatch_execution_mode(_r(confidence=0.8, risk=0.2), mode="automated")["status"] == "accepted"
    assert dispatch_execution_mode(_r(confidence=0.9, risk=0.5), mode="automated")["status"] == "held"
    assert dispatch_execution_mode(_r(confidence=0.5, risk=0.0), mode="automated")["status"] == "held"


def test_custom_guardrail_thresholds():
    # A stricter caller can tighten the guardrail.
    r = _r(confidence=0.75, risk=0.25)
    assert dispatch_execution_mode(r, mode="automated", min_confidence=0.9)["status"] == "held"
    assert dispatch_execution_mode(r, mode="automated", max_risk=0.1)["status"] == "held"


def test_live_requires_human():
    assert dispatch_execution_mode(_r(), mode="live")["status"] == "pending"
    assert dispatch_execution_mode(_r(), mode="live", human_approved=True)["status"] == "accepted"


def test_defaults():
    assert DEFAULT_MAX_RISK == 0.30 and DEFAULT_MIN_CONFIDENCE == 0.70


def test_cube4_delegator_still_works():
    from app.cubes.cube4_collector.analysis import ANALYSIS_MODES, dispatch_analysis_mode
    assert ANALYSIS_MODES == EXECUTION_MODES
    out = dispatch_analysis_mode(_r(confidence=0.8, risk=0.2), mode="automated")
    assert out["status"] == "accepted"
