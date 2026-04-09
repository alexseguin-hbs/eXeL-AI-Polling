"""Cube 4 — Cross-Cube Dependency Verification.

Cube 4 (Collector) depends on:
  ← Cube 1: Session, Participant
  ← Cube 2/3: ResponseMeta (text/voice input)
  → Cube 5: Gateway time tracking
  → Cube 6: Phase A summarization trigger
  → Cube 9: CSV export data source
"""

import pytest


class TestCube4Dependencies:
    """Every upstream/downstream dependency resolves."""

    def test_imports_session(self):
        from app.models.session import Session
        assert Session.__tablename__ == "sessions"

    def test_imports_participant(self):
        from app.models.participant import Participant
        assert Participant.__tablename__ == "participants"

    def test_imports_response_meta(self):
        from app.models.response_meta import ResponseMeta
        assert ResponseMeta.__tablename__ == "response_meta"

    def test_imports_redis_presence(self):
        from app.core.redis_presence import set_presence, get_presence
        assert callable(set_presence)

    def test_imports_crypto_utils(self):
        from app.core.crypto_utils import compute_anon_hash
        assert callable(compute_anon_hash)

    def test_service_exists(self):
        from app.cubes.cube4_collector.service import get_collected_responses
        assert callable(get_collected_responses)

    def test_router_has_responses_endpoint(self):
        from app.cubes.cube4_collector.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("collected" in p for p in paths)

    def test_router_has_presence_endpoint(self):
        from app.cubes.cube4_collector.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("presence" in p for p in paths)
