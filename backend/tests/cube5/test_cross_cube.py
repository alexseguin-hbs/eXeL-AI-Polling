"""Cube 5 — Cross-Cube Dependency Verification.

Cube 5 (Gateway) is the CENTER — depends on everything:
  ← Cube 1: Session state machine triggers pipeline
  → Cube 6: AI theming pipeline
  → Cube 7: Ranking pipeline
  → Cube 8: Token calculation + ledger writes
  Core: hi_rates, concurrency, broadcast
"""

import pytest


class TestCube5Dependencies:
    """Every upstream/downstream dependency resolves."""

    def test_triggers_cube6(self):
        from app.cubes.cube5_gateway.service import trigger_ai_pipeline
        assert callable(trigger_ai_pipeline)

    def test_triggers_cube7(self):
        from app.cubes.cube5_gateway.service import trigger_ranking_pipeline
        assert callable(trigger_ranking_pipeline)

    def test_triggers_cqs(self):
        from app.cubes.cube5_gateway.service import trigger_cqs_scoring
        assert callable(trigger_cqs_scoring)

    def test_imports_hi_rates(self):
        from app.core.hi_rates import resolve_human_rate
        rate = resolve_human_rate("United States", "Texas")
        assert rate == 7.25

    def test_imports_concurrency(self):
        from app.core.concurrency import SessionSemaphorePool
        pool = SessionSemaphorePool(10)
        assert pool is not None

    def test_scale_constants_defined(self):
        from app.cubes.cube5_gateway.service import (
            _PIPELINE_TIMEOUT_DEFAULT,
            _PIPELINE_TIMEOUT_SCALE,
            _SCALE_THRESHOLD,
        )
        assert _PIPELINE_TIMEOUT_DEFAULT == 300.0
        assert _PIPELINE_TIMEOUT_SCALE == 60.0
        assert _SCALE_THRESHOLD == 1000

    def test_orchestrate_post_polling_exists(self):
        from app.cubes.cube5_gateway.service import orchestrate_post_polling
        import asyncio
        assert asyncio.iscoroutinefunction(orchestrate_post_polling)
