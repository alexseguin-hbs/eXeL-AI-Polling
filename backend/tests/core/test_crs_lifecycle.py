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
    is_simulation_ready,
    next_states,
)


def test_states_ordered():
    assert CRS_STATES == ("draft", "review", "approved", "simulation_ready")


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
    assert next_states("simulation_ready") == ("approved",)
    assert next_states("bogus") == ()


def test_every_state_has_a_transition_entry():
    for s in CRS_STATES:
        assert s in CRS_TRANSITIONS
