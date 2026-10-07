"""Addendum 4 (AsM round 1, Krishna + Aset): a simulation session never silently calls a paid AI provider.

Phase A (cube6 phase_a) and /ai/run (cube6 pipeline) resolve the provider through `provider_for_session`: a
session_type == "simulation" runs on the deterministic OFFLINE provider unless an HI-approved cost estimate is
recorded (`ai_cost_approval`, the hook the later Offline / Batch / Realtime selector fills).
"""
from __future__ import annotations

import inspect
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube6_ai import phase_a, pipeline
from app.cubes.cube6_ai.providers import factory
from app.cubes.cube6_ai.providers.offline_provider import OfflineSummarization


def _session(kind, provider="openai", approval=None):
    return SimpleNamespace(id=uuid.uuid4(), session_type=kind, ai_provider=provider, ai_cost_approval=approval)


@pytest.mark.parametrize("provider", ["openai", "grok", "gemini", "claude"])
def test_simulation_session_resolves_to_offline(provider):
    s = _session("simulation", provider)
    assert factory.provider_for_session(s) == "offline"
    assert factory.provider_for_session(s, requested=provider) == "offline"
    assert isinstance(factory.get_session_summarization_provider(s), OfflineSummarization)


def test_real_session_keeps_its_provider():
    for kind in ("polling", "peer_volunteer", "team_collaboration"):
        assert factory.provider_for_session(_session(kind, "gemini")) == "gemini"


def test_only_an_hi_approved_estimate_lifts_the_guard():
    assert factory.provider_for_session(_session("simulation", approval={"estimate_usd": 1.2})) == "offline"
    assert factory.provider_for_session(_session("simulation", approval={"approved_by": "hi"})) == "offline"
    approved = {"method": "batch", "estimate_usd": 1.2, "approved_by": "operator"}
    assert factory.provider_for_session(_session("simulation", approval=approved)) == "openai"


@pytest.mark.asyncio
async def test_phase_a_resolves_offline_for_a_simulation_session():
    s = _session("simulation", "openai")
    result = MagicMock()
    result.scalar_one_or_none.return_value = s
    db = MagicMock()
    db.execute = AsyncMock(return_value=result)
    assert await phase_a.resolve_phase_a_provider(db, s.id, "openai") == "offline"
    db.execute.reset_mock()  # cached: the next response in the same session does not query again
    assert await phase_a.resolve_phase_a_provider(db, s.id, "openai") == "offline"
    db.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_phase_a_keeps_a_real_sessions_provider():
    s = _session("polling", "gemini")
    result = MagicMock()
    result.scalar_one_or_none.return_value = s
    db = MagicMock()
    db.execute = AsyncMock(return_value=result)
    assert await phase_a.resolve_phase_a_provider(db, s.id, "gemini") == "gemini"


def test_both_ai_paths_go_through_the_guard():
    """Phase A and the theming pipeline both resolve via the session guard (never session.ai_provider directly)."""
    assert "resolve_phase_a_provider(db, session_id, ai_provider)" in inspect.getsource(
        phase_a._summarize_single_response_inner
    )
    src = inspect.getsource(pipeline.run_pipeline)
    assert "provider_for_session(session)" in src
    assert "provider_name = session.ai_provider" not in src
