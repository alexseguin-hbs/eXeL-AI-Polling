"""R5: CRS lifecycle state machine — the Foundation-of-Truth gate.

Draft → Review → Approved → Simulation-Ready before any simulation runs.
"""

import pytest

from app.core.crs_lifecycle import (
    CRS_STATES,
    CRS_TRANSITIONS,
    CRSLifecycleError,
    assert_simulation_allowed,
    assert_transition,
    can_transition,
    is_qualified,
    is_simulation_ready,
    next_states,
)


def test_states_ordered():
    assert CRS_STATES == (
        "draft", "review", "approved", "simulation_ready",
        "qualified", "certified", "published", "replay_enabled",
    )


def test_qualification_path_stepwise():
    # The memo extension: sim-ready → qualified → certified → published → replay-enabled.
    assert can_transition("simulation_ready", "qualified")
    assert can_transition("qualified", "certified")
    assert can_transition("certified", "published")
    assert can_transition("published", "replay_enabled")
    # never skip forward
    assert not can_transition("simulation_ready", "certified")
    assert not can_transition("qualified", "published")
    # step back for human withdrawal
    assert can_transition("qualified", "simulation_ready")
    assert can_transition("replay_enabled", "published")


def test_is_qualified():
    for s in ("draft", "review", "approved", "simulation_ready"):
        assert is_qualified(s) is False
    for s in ("qualified", "certified", "published", "replay_enabled"):
        assert is_qualified(s) is True
    assert is_qualified("bogus") is False


def test_sim_gate_stays_mid_lifecycle():
    # Simulation is unlocked at simulation_ready even though 4 states follow it.
    assert is_simulation_ready("simulation_ready") is True
    for s in ("qualified", "certified", "published", "replay_enabled"):
        assert is_simulation_ready(s) is False  # gate is pinned mid-lifecycle


def test_forward_path_is_stepwise():
    assert can_transition("draft", "review")
    assert can_transition("review", "approved")
    assert can_transition("approved", "simulation_ready")
    # never skip a step forward
    assert not can_transition("draft", "approved")
    assert not can_transition("draft", "simulation_ready")
    assert not can_transition("review", "simulation_ready")


def test_can_step_back_for_human_withdrawal():
    assert can_transition("review", "draft")
    assert can_transition("approved", "review")
    assert can_transition("simulation_ready", "approved")


def test_assert_transition_raises_on_illegal():
    with pytest.raises(CRSLifecycleError):
        assert_transition("draft", "simulation_ready")
    with pytest.raises(CRSLifecycleError):
        assert_transition("draft", "bogus")
    # legal transition does not raise
    assert_transition("approved", "simulation_ready")


def test_simulation_gate():
    assert is_simulation_ready("simulation_ready") is True
    for s in ("draft", "review", "approved"):
        assert is_simulation_ready(s) is False
        with pytest.raises(CRSLifecycleError):
            assert_simulation_allowed(s)
    assert_simulation_allowed("simulation_ready")  # the only allowed state


def test_next_states():
    assert next_states("draft") == ("review",)
    assert next_states("simulation_ready") == ("qualified", "approved")
    assert next_states("replay_enabled") == ("published",)
    assert next_states("bogus") == ()


def test_every_state_has_a_transition_entry():
    for s in CRS_STATES:
        assert s in CRS_TRANSITIONS
