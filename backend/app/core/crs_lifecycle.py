"""CRS lifecycle — the "Foundation of Truth" state machine (R-CORE / Cube 2).

Thought-Master directive: a CRS (Cube Requirement Spec) must progress
Draft → Review → Approved → Simulation-Ready before any simulation, ranking,
automation, or reporting may run against it. No downstream process executes from
a draft or partially-defined requirement.

This module is the PURE contract (mirrors models/session.py SESSION_TRANSITIONS):
states, allowed transitions, and the simulation gate. The persisted CRSRecord +
migration (owner/justification/confidence/replay/SSSES-observation columns) layer
on top — this state machine is what they enforce. Deterministic, no I/O.
"""

from __future__ import annotations

# Ordered lifecycle (memo 2026-07-21 extension). `simulation_ready` remains the
# MID-lifecycle gate that unlocks the Cube-10 simulation / challenge loop; a CRS
# then progresses through qualification → certification → publication → replay-enabled.
CRS_STATES: tuple[str, ...] = (
    "draft", "review", "approved", "simulation_ready",
    "qualified", "certified", "published", "replay_enabled",
)

# Forward + backward transitions. A requirement can always be sent back a step so
# Human Authority can withdraw a decision; it can never skip a step forward.
CRS_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "draft": ("review",),
    "review": ("approved", "draft"),
    "approved": ("simulation_ready", "review"),
    "simulation_ready": ("qualified", "approved"),
    "qualified": ("certified", "simulation_ready"),
    "certified": ("published", "qualified"),
    "published": ("replay_enabled", "certified"),
    "replay_enabled": ("published",),
}

# The state at which downstream simulation/ranking/automation is permitted. It is
# MID-lifecycle now (4 qualification states follow), so this stays pinned here.
SIMULATION_READY_STATE = "simulation_ready"

# The state at which a CRS is fully qualified to advance to production use.
QUALIFIED_STATE = "qualified"


def is_qualified(state: str) -> bool:
    """True once a CRS has passed qualification (qualified or any later state)."""
    if state not in CRS_STATES:
        return False
    return CRS_STATES.index(state) >= CRS_STATES.index(QUALIFIED_STATE)


class CRSLifecycleError(Exception):
    """Raised on an illegal CRS transition or a simulation attempt before ready."""


def is_valid_state(state: str) -> bool:
    return state in CRS_STATES


def can_transition(current: str, target: str) -> bool:
    """True iff `current` → `target` is an allowed CRS transition."""
    return target in CRS_TRANSITIONS.get(current, ())


def next_states(current: str) -> tuple[str, ...]:
    """The states reachable from `current` in one step (empty if unknown/terminal)."""
    return CRS_TRANSITIONS.get(current, ())


def assert_transition(current: str, target: str) -> None:
    """Raise CRSLifecycleError unless `current` → `target` is allowed."""
    if not is_valid_state(current) or not is_valid_state(target):
        raise CRSLifecycleError(f"Unknown CRS state in transition {current!r} → {target!r}")
    if not can_transition(current, target):
        raise CRSLifecycleError(
            f"Illegal CRS transition {current!r} → {target!r}. "
            f"Allowed from {current!r}: {list(next_states(current))}"
        )


def is_simulation_ready(state: str) -> bool:
    """The gate: simulation/ranking/automation may run ONLY when the CRS is ready."""
    return state == SIMULATION_READY_STATE


def assert_simulation_allowed(state: str) -> None:
    """Raise CRSLifecycleError unless the CRS has reached Simulation-Ready.

    This is the enforcement hook the Cube-10 challenge loop / harness calls before
    running a candidate — "simulation only after (Cube 2) completion" made literal.
    """
    if not is_simulation_ready(state):
        raise CRSLifecycleError(
            f"Simulation blocked — CRS is in state {state!r}, not "
            f"{SIMULATION_READY_STATE!r}. Approve the requirement first "
            "(Draft → Review → Approved → Simulation-Ready)."
        )
