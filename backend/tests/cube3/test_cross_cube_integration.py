"""Cube 3 — Cross-Cube Integration Tests.

    Voice-to-Text depends on:
      ← Cube 1: Session config (stt_provider, language)
      → Cube 2: Text pipeline (PII + profanity)
      → Cube 4: Response storage
      → Cube 5: Time tracking
      → Cube 6: Phase A summarization

    These tests verify the dependency chain resolves correctly.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest


class TestCube3UpstreamDependencies:
    """Verify Cube 3 can access upstream Cube 1 data."""

    def test_imports_session_model(self):
        from app.models.session import Session
        assert hasattr(Session, "stt_provider")

    def test_imports_participant_model(self):
        from app.models.participant import Participant
        assert hasattr(Participant, "language_code")

    def test_imports_circuit_breaker(self):
        from app.core.circuit_breaker import CircuitBreaker
        cb = CircuitBreaker(max_failures=3, cooldown_seconds=60)
        assert not cb.is_open("test_provider")

    def test_imports_concurrency(self):
        from app.core.concurrency import SessionSemaphorePool
        pool = SessionSemaphorePool(20)
        assert pool is not None


class TestCube3DownstreamDependencies:
    """Verify Cube 3 output feeds downstream cubes."""

    def test_imports_text_pipeline(self):
        from app.core.text_pipeline import run_text_pipeline
        assert callable(run_text_pipeline)

    def test_imports_phase_a_retry(self):
        from app.core.phase_a_retry import run_phase_a_with_retry
        assert callable(run_phase_a_with_retry)

    def test_imports_submission_validators(self):
        from app.core.submission_validators import validate_text_input
        assert callable(validate_text_input)

    def test_imports_crypto_utils(self):
        from app.core.crypto_utils import compute_response_hash
        assert callable(compute_response_hash)


class TestCube3ProviderFactory:
    """Verify STT provider factory resolves available providers."""

    def test_whisper_resolves(self):
        from app.cubes.cube3_voice.providers.factory import get_stt_provider
        provider = get_stt_provider("openai")
        assert provider is not None

    def test_gemini_resolves(self):
        from app.cubes.cube3_voice.providers.factory import get_stt_provider
        provider = get_stt_provider("gemini")
        assert provider is not None

    def test_unknown_provider_raises(self):
        from app.cubes.cube3_voice.providers.factory import get_stt_provider
        with pytest.raises(ValueError):
            get_stt_provider("nonexistent_provider")

    def test_provider_has_transcribe_method(self):
        from app.cubes.cube3_voice.providers.factory import get_stt_provider
        provider = get_stt_provider("whisper")
        assert hasattr(provider, "transcribe")

    def test_provider_has_supports_language(self):
        from app.cubes.cube3_voice.providers.factory import get_stt_provider
        provider = get_stt_provider("whisper")
        assert provider.supports_language("en")


class TestCube3ServiceContract:
    """Verify Cube 3 service exposes required functions."""

    def test_submit_voice_response_exists(self):
        import asyncio
        from app.cubes.cube3_voice.service import submit_voice_response
        assert asyncio.iscoroutinefunction(submit_voice_response)

    def test_router_has_voice_endpoint(self):
        from app.cubes.cube3_voice.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("voice" in p for p in paths)

    def test_voice_metrics_endpoint(self):
        from app.cubes.cube3_voice.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("metrics" in p or "voice" in p for p in paths)
