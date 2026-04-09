"""Cube 10 — Cross-Cube Integration Tests.

Cube 10 depends on ALL other cubes:
  ← C1: Session state machine pattern
  ← C2: Code validation (PII-like scanning)
  ← C5: Pipeline orchestration pattern
  ← C6: Marble Method for feedback theming
  ← C7: BordaAccumulator + quadratic voting
  ← C8: Token ledger for rewards
  ← C9: Analytics dashboard pattern
  ← SDK: Universal function registry
"""

import pytest


class TestCube10DependsOnCube7Voting:
    def test_quadratic_weights_importable(self):
        from app.cubes.cube7_ranking.service import _quadratic_weights
        weights = _quadratic_weights({"a": 100, "b": 25})
        assert abs(sum(weights.values()) - 1.0) < 1e-10

    def test_borda_accumulator_importable(self):
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
        acc = BordaAccumulator(n_themes=3, seed="test")
        acc.add_vote(["A", "B", "C"], "voter1")
        assert acc.voter_count == 1


class TestCube10DependsOnCube8Tokens:
    def test_lifecycle_states_importable(self):
        from app.cubes.cube8_tokens.service import LIFECYCLE_STATES
        assert "pending" in LIFECYCLE_STATES
        assert "approved" in LIFECYCLE_STATES

    def test_create_ledger_entry_importable(self):
        from app.cubes.cube8_tokens.service import create_ledger_entry
        assert callable(create_ledger_entry)


class TestCube10DependsOnSDK:
    def test_universal_registry_importable(self):
        from app.core.universal import get_registry
        funcs = get_registry()
        assert len(funcs) > 20

    def test_event_types_include_simulation(self):
        from app.core.sdk import CUBE_REGISTRY
        c10 = next(c for c in CUBE_REGISTRY if c.id == 10)
        assert "simulation.submission_created" in c10.events

    def test_error_codes_importable(self):
        from app.core.sdk import ErrorCode
        assert hasattr(ErrorCode, "UNAUTHORIZED")


class TestCube10ServiceFunctions:
    def test_all_functions_exist(self):
        from app.cubes.cube10_simulation import service
        funcs = ["submit_feedback", "get_feedback_stats", "create_submission",
                 "run_sandbox_tests", "compare_metrics", "tally_votes"]
        for fn in funcs:
            assert callable(getattr(service, fn)), f"Missing: {fn}"

    def test_constants(self):
        from app.cubes.cube10_simulation.service import (
            SUPERMAJORITY_THRESHOLD, MIN_QUORUM_PERCENT, SUBMISSION_STATES
        )
        assert SUPERMAJORITY_THRESHOLD == 0.666
        assert MIN_QUORUM_PERCENT == 0.10
        assert len(SUBMISSION_STATES) == 7


class TestCube10Router:
    def test_router_tag(self):
        from app.cubes.cube10_simulation.router import router
        assert "Cube 10 — Simulation" in router.tags

    def test_feedback_endpoint(self):
        from app.cubes.cube10_simulation.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("feedback" in p for p in paths)

    def test_submissions_endpoint(self):
        from app.cubes.cube10_simulation.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("submissions" in p for p in paths)
