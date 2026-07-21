"""Lock the offline deterministic Cube 6 provider (C6-1).

Guarantees the offline provider (a) resolves via the factory with NO API key,
(b) emits output that phase_b's real parsers accept for every task type, and
(c) is fully deterministic — the foundation for CI E2E + the operator's theming
test running without a billed provider.
"""

import asyncio

import pytest

from app.cubes.cube6_ai import phase_b as pb
from app.cubes.cube6_ai.providers.base import AIProviderName
from app.cubes.cube6_ai.providers.factory import (
    get_embedding_provider,
    get_summarization_provider,
)


def _run(coro):
    return asyncio.run(coro)


def test_offline_resolves_without_key():
    s = get_summarization_provider("offline")
    e = get_embedding_provider("offline")
    assert s.provider_name == AIProviderName.OFFLINE
    assert e.provider_name == AIProviderName.OFFLINE


def test_offline_not_in_default_failover():
    # Odin's guardrail: OFFLINE must never be a silent prod fallback.
    from app.cubes.cube6_ai.providers.factory import _FAILOVER_ORDER
    assert AIProviderName.OFFLINE not in _FAILOVER_ORDER


def test_classify_output_parses_and_is_correct():
    s = get_summarization_provider("offline")
    risk = _run(s.summarize(
        ["INPUT: The mobile experience is frustrating and drag-drop barely works, a real concern."],
        instruction=pb._CLASSIFY_INSTRUCTION,
    ))
    m = pb._CLASSIFY_PATTERN.match(risk)
    assert m and m.group(1).strip() == "Risk & Concerns" and int(m.group(2)) >= pb._CONFIDENCE_THRESHOLD

    support = _run(s.summarize(
        ["INPUT: I really like and appreciate this excellent, valuable, effective tool."],
        instruction=pb._CLASSIFY_INSTRUCTION,
    ))
    assert pb._CLASSIFY_PATTERN.match(support).group(1).strip() == "Supporting Comments"


def test_theme_gen_output_parses_to_three():
    s = get_summarization_provider("offline")
    out = _run(s.summarize(
        ["Generate ONLY 3 THEMES... INPUT: mobile mobile export analytics analytics branding branding branding"],
        instruction=pb._THEME_GEN_INSTRUCTION.format(type_str="RISK"),
    ))
    names = [ln.split(",")[1].strip() for ln in out.split("\n") if len(ln.split(",")) >= 2]
    assert len(names) == 3 and all(names)


def test_reduce_output_parses_to_count():
    s = get_summarization_provider("offline")
    out = _run(s.summarize(
        ["Reduce these themes to 3:\nMobile Focus\nExport Focus\nBranding Focus\nApi Focus"],
        instruction=pb._REDUCE_INSTRUCTION.format(type_str="RISK", count=3),
    ))
    parsed = pb._parse_reduced_themes(out)
    assert len(parsed) == 3 and all(p["label"] for p in parsed)


def test_assign_output_parses():
    s = get_summarization_provider("offline")
    out = _run(s.summarize(
        ["List: Mobile Focus\nExport Focus\nInput: the mobile drag drop is broken"],
        instruction=pb._ASSIGN_INSTRUCTION,
    ))
    m = pb._CLASSIFY_PATTERN.match(out)
    assert m and m.group(1).strip() in ("Mobile Focus", "Export Focus")


def test_deterministic_repeatable():
    s = get_summarization_provider("offline")
    e = get_embedding_provider("offline")
    a = _run(s.summarize(["INPUT: mobile is a concern and a problem"], instruction=pb._CLASSIFY_INSTRUCTION))
    b = _run(s.summarize(["INPUT: mobile is a concern and a problem"], instruction=pb._CLASSIFY_INSTRUCTION))
    assert a == b
    assert _run(e.embed(["x"])) == _run(e.embed(["x"]))


def test_c6_2_graceful_fallback_to_offline_in_dev(monkeypatch):
    """C6-2: with no key, non-production degrades to OFFLINE (pipeline never crashes)."""
    from app.cubes.cube6_ai.providers import factory
    from app.config import settings

    # No key for any real provider → the normal resolver raises.
    monkeypatch.setattr(factory, "_has_api_key", lambda p: p == AIProviderName.OFFLINE)
    monkeypatch.setattr(settings, "environment", "development")

    prov = factory.get_summarization_provider_or_offline("openai")
    assert prov.provider_name == AIProviderName.OFFLINE


def test_c6_2_production_still_raises_without_key(monkeypatch):
    """C6-2 guardrail (Odin): production must NOT silently ship stub themes."""
    from app.cubes.cube6_ai.providers import factory
    from app.config import settings

    monkeypatch.setattr(factory, "_has_api_key", lambda p: p == AIProviderName.OFFLINE)
    monkeypatch.setattr(settings, "environment", "production")

    with pytest.raises(ValueError):
        factory.get_summarization_provider_or_offline("openai")
