"""Cube 10 — Saved Use Case Manager Tests.

Tests the top-3 + DEMO dataset retention policy:
  - DEMO always present and permanent
  - Max 3 live cases, sorted by response_count
  - New larger case drops the smallest
  - New smaller case rejected
  - Edge cases: empty, 1, 2, 3, 4+ cases
"""

import uuid

import pytest

from app.cubes.cube10_simulation.saved_use_cases import (
    DEMO_DATASET,
    MAX_SAVED_LIVE_CASES,
    SavedUseCase,
    SavedUseCaseManager,
)


def _make_case(response_count: int, **kwargs) -> SavedUseCase:
    return SavedUseCase(
        id=kwargs.get("id", str(uuid.uuid4())),
        session_id=str(uuid.uuid4()),
        session_code=kwargs.get("session_code", f"CODE{response_count}"),
        title=kwargs.get("title", f"Poll with {response_count} responses"),
        response_count=response_count,
        participant_count=kwargs.get("participant_count", response_count),
        theme_count=kwargs.get("theme_count", 9),
        theme2_voting_level="theme2_3",
        ai_provider="openai",
        **{k: v for k, v in kwargs.items() if k not in
           ("id", "session_code", "title", "participant_count", "theme_count")},
    )


class TestDemoAlwaysPresent:
    """DEMO dataset is permanent and always present."""

    def test_empty_manager_has_demo(self):
        mgr = SavedUseCaseManager()
        assert mgr.demo is not None
        assert mgr.demo.is_demo
        assert mgr.demo.is_permanent
        assert mgr.demo.response_count == 5000

    def test_demo_not_in_live_cases(self):
        mgr = SavedUseCaseManager()
        assert len(mgr.live_cases) == 0  # DEMO not counted as live

    def test_demo_session_code(self):
        mgr = SavedUseCaseManager()
        assert mgr.demo.session_code == "PAST0001"


class TestAddLiveCases:
    """Adding live cases up to MAX_SAVED_LIVE_CASES."""

    def test_add_first_case(self):
        mgr = SavedUseCaseManager()
        case = _make_case(1000)
        dropped = mgr.add_live_case(case)
        assert dropped is None
        assert len(mgr.live_cases) == 1

    def test_add_three_cases(self):
        mgr = SavedUseCaseManager()
        for count in [1000, 40000, 1111111]:
            mgr.add_live_case(_make_case(count))
        assert len(mgr.live_cases) == 3

    def test_live_cases_sorted_desc(self):
        mgr = SavedUseCaseManager()
        mgr.add_live_case(_make_case(1000))
        mgr.add_live_case(_make_case(1111111))
        mgr.add_live_case(_make_case(40000))
        live = mgr.live_cases
        assert live[0].response_count == 1111111
        assert live[1].response_count == 40000
        assert live[2].response_count == 1000

    def test_all_sorted_demo_first(self):
        mgr = SavedUseCaseManager()
        mgr.add_live_case(_make_case(500))
        all_cases = mgr.all_sorted
        assert all_cases[0].is_demo  # DEMO always first


class TestDropSmallest:
    """When 4th case arrives, smallest live case drops."""

    def test_4th_case_drops_smallest(self):
        """The exact scenario from the spec:
        Slot 1: 1,111,111 | Slot 2: 40,000 | Slot 3: 1,000
        New: 555,555 → Drop 1,000 (smallest)
        """
        mgr = SavedUseCaseManager()
        mgr.add_live_case(_make_case(1000, title="Team Retro"))
        mgr.add_live_case(_make_case(40000, title="Austin City"))
        mgr.add_live_case(_make_case(1111111, title="Global Climate"))

        # New poll: 444,444 users with 555,555 responses
        new_case = _make_case(555555, title="New Live Poll")
        dropped = mgr.add_live_case(new_case)

        assert dropped is not None
        assert dropped.response_count == 1000  # Smallest dropped
        assert dropped.title == "Team Retro"
        assert len(mgr.live_cases) == 3

        # Verify new ordering
        live = mgr.live_cases
        assert live[0].response_count == 1111111
        assert live[1].response_count == 555555
        assert live[2].response_count == 40000

    def test_smaller_than_all_rejected(self):
        """New case smaller than all existing → rejected."""
        mgr = SavedUseCaseManager()
        mgr.add_live_case(_make_case(10000))
        mgr.add_live_case(_make_case(20000))
        mgr.add_live_case(_make_case(30000))

        tiny = _make_case(500, title="Tiny Poll")
        rejected = mgr.add_live_case(tiny)

        assert rejected is not None
        assert rejected.title == "Tiny Poll"
        assert len(mgr.live_cases) == 3  # Unchanged

    def test_equal_size_rejected(self):
        """New case equal to smallest → rejected (must be strictly larger)."""
        mgr = SavedUseCaseManager()
        mgr.add_live_case(_make_case(1000))
        mgr.add_live_case(_make_case(2000))
        mgr.add_live_case(_make_case(3000))

        equal = _make_case(1000, title="Same Size")
        rejected = mgr.add_live_case(equal)
        assert rejected is not None

    def test_demo_never_dropped(self):
        """DEMO is never dropped regardless of live case changes."""
        mgr = SavedUseCaseManager()
        for count in [100000, 200000, 300000]:
            mgr.add_live_case(_make_case(count))

        mgr.add_live_case(_make_case(400000))  # Triggers drop
        assert mgr.demo is not None  # DEMO still there
        assert mgr.demo.response_count == 5000


class TestTotalResponses:
    """Total response count across all saved cases."""

    def test_demo_only(self):
        mgr = SavedUseCaseManager()
        assert mgr.total_responses == 5000

    def test_with_live_cases(self):
        mgr = SavedUseCaseManager()
        mgr.add_live_case(_make_case(1000))
        mgr.add_live_case(_make_case(40000))
        assert mgr.total_responses == 5000 + 1000 + 40000


class TestLookup:
    """Retrieve cases by ID or session code."""

    def test_get_demo_by_code(self):
        mgr = SavedUseCaseManager()
        case = mgr.get_by_session_code("PAST0001")
        assert case is not None
        assert case.is_demo

    def test_get_live_by_code(self):
        mgr = SavedUseCaseManager()
        mgr.add_live_case(_make_case(5000, session_code="LIVE001"))
        case = mgr.get_by_session_code("LIVE001")
        assert case is not None
        assert case.response_count == 5000

    def test_get_nonexistent(self):
        mgr = SavedUseCaseManager()
        assert mgr.get_by_session_code("NOPE") is None


class TestSerialization:
    """to_dict() for API responses."""

    def test_manager_to_dict(self):
        mgr = SavedUseCaseManager()
        mgr.add_live_case(_make_case(1000))
        d = mgr.to_dict()
        assert d["total_cases"] == 2  # 1 live + DEMO
        assert d["max_live_cases"] == 3
        assert d["demo"]["response_count"] == 5000
        assert len(d["live_cases"]) == 1

    def test_case_to_dict(self):
        case = _make_case(42000, title="Test Poll")
        d = case.to_dict()
        assert d["response_count"] == 42000
        assert d["title"] == "Test Poll"
        assert d["is_demo"] is False


class TestConstants:
    """Verify system constants."""

    def test_max_saved_live_cases(self):
        assert MAX_SAVED_LIVE_CASES == 3

    def test_demo_dataset_config(self):
        assert DEMO_DATASET["response_count"] == 5000
        assert DEMO_DATASET["session_code"] == "PAST0001"
        assert DEMO_DATASET["is_permanent"] is True
