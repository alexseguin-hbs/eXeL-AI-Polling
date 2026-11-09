"""CRS-15.10 / CRS-09.08.01-.05 (2026-11-09): xAI primary + multi-vendor failover, Theme02 fast path."""
import asyncio
import json

import pytest

from app.cubes.cube6_ai.providers.base import AIProviderName, SummarizationProvider
from app.cubes.cube6_ai.providers import multi_vendor as mv
from app.cubes.cube6_ai import theme_fast as tf


class _V(SummarizationProvider):
    def __init__(self, name, reply="ok", delay=0.0, exc=None):
        self.provider_name = name
        self.reply, self.delay, self.exc, self.calls = reply, delay, exc, 0

    async def summarize(self, texts, instruction=""):
        self.calls += 1
        await asyncio.sleep(self.delay)
        if self.exc:
            raise self.exc
        return self.reply(texts, instruction) if callable(self.reply) else self.reply


class _Err(Exception):
    def __init__(self, code):
        super().__init__(f"http {code}")
        self.status_code = code


@pytest.fixture(autouse=True)
def _reset():
    mv.reset_circuits()
    yield
    mv.reset_circuits()


def _run(c):
    return asyncio.get_event_loop().run_until_complete(c) if False else asyncio.run(c)


def test_primary_serves_and_records_usage():
    g, o = _V(AIProviderName.GROK, "grok"), _V(AIProviderName.OPENAI, "oai")
    s = mv.MultiVendorSummarizer([g, o], hedge_after_s=None)
    assert _run(s.summarize(["x"], "i")) == "grok"
    assert o.calls == 0 and s.served_by() == ["grok"]
    rows = mv.vendor_cost_rows(s)
    assert rows[0]["provider"] == "grok" and rows[0]["estimated_cost_usd"] is not None


def test_credit_exhausted_fails_over_and_opens_circuit():
    g, o = _V(AIProviderName.GROK, exc=_Err(402)), _V(AIProviderName.OPENAI, "oai")
    s = mv.MultiVendorSummarizer([g, o], hedge_after_s=None)
    assert _run(s.summarize(["x"])) == "oai"
    assert mv.circuit_open("grok")
    assert _run(s.summarize(["y"])) == "oai" and g.calls == 1  # open circuit → grok skipped
    assert mv.dominant_vendor(s, "grok") == "openai"


def test_slow_primary_is_hedged():
    g, o = _V(AIProviderName.GROK, "slow", delay=1.0), _V(AIProviderName.OPENAI, "fast")
    s = mv.MultiVendorSummarizer([g, o], hedge_after_s=0.05)
    assert _run(s.summarize(["x"])) == "fast"
    assert s.usage["openai"]["hedges"] == 1 and s.usage["grok"]["cancelled"] == 1


def test_timeout_then_all_fail_raises():
    g = _V(AIProviderName.GROK, delay=1.0)
    gm = _V(AIProviderName.GEMINI, exc=_Err(429))
    s = mv.MultiVendorSummarizer([g, gm], timeout_s=0.05, hedge_after_s=None)
    with pytest.raises(Exception):
        _run(s.summarize(["x"]))


def test_factory_prefers_grok_and_wraps(monkeypatch):
    from app.cubes.cube6_ai.providers import factory

    assert factory._FAILOVER_ORDER[0] == AIProviderName.GROK
    assert factory._get_failover_chain("bogus")[0] == AIProviderName.GROK
    from app.config import settings

    monkeypatch.setattr(settings, "openai_api_key", "sk-test-not-real")
    monkeypatch.setattr(settings, "xai_api_key", "xai-test-not-real")
    monkeypatch.setattr(factory, "_has_api_key", lambda p: p in (AIProviderName.GROK, AIProviderName.OPENAI, AIProviderName.OFFLINE))
    s = factory.get_summarization_provider("grok")
    assert isinstance(s, mv.MultiVendorSummarizer) and s.vendor_names == ["grok", "openai"]
    assert factory.get_summarization_provider("offline").provider_name == AIProviderName.OFFLINE


def test_grok_pins_non_reasoning_model():
    from app.cubes.cube6_ai.providers import grok_provider

    assert grok_provider.summarization_model() == "grok-4.20-0309-non-reasoning"


def test_grok_rates_match_official_price():
    from app.cubes.cube6_ai.providers.base import AI_COST_RATES
    from app.cubes.cube8_tokens.cost_ledger import THEME_RATES_USD_PER_1K

    assert AI_COST_RATES["grok"]["summary_per_1k_input"] == 0.00125
    assert AI_COST_RATES["grok"]["summary_per_1k_output"] == 0.0025
    assert str(THEME_RATES_USD_PER_1K["grok"]["summary_per_1k_input"]) == "0.00125"


def _batch_reply(texts, instruction):
    body = texts[0]
    n = sum(1 for line in body.splitlines() if line[:1].isdigit())
    out = []
    for k in range(n):
        out.append({"i": k + 1, "theme": ["Supporting Comments", "Risk & Concerns"][k % 2], "confidence": 50 + 20 * (k % 2)})
    return json.dumps(out)


def test_batched_theme01_keeps_labels_and_65_rule():
    rs = [{"summary_33": f"text {i}"} for i in range(45)]
    v = _V(AIProviderName.GROK, _batch_reply)
    st = _run(tf.classify_theme01_batched(v, rs, batch=20))
    assert st["batches"] == 3 and v.calls == 3 and st["fallback_items"] == 0
    # even k: Supporting @50% → Neutral (<65); odd k: Risk @70% stays
    assert rs[0]["theme01"] == "Neutral Comments" and rs[1]["theme01"] == "Risk & Concerns"


def test_batched_theme01_bad_json_falls_back_per_item():
    rs = [{"summary_33": "a"}, {"summary_33": "b"}]
    v = _V(AIProviderName.GROK, "Supporting Comments (Confidence: 90%)")
    st = _run(tf.classify_theme01_batched(v, rs, batch=20))
    assert st["fallback_items"] == 2 and all(r["theme01"] == "Supporting Comments" for r in rs)


def test_streaming_generation_full_coverage_and_events():
    groups = {"Supporting Comments": [[{"summary_33": "s"}] * 10, [{"summary_33": "s"}] * 3], "Risk & Concerns": [],
              "Neutral Comments": [[{"summary_33": "n"}] * 10]}
    v = _V(AIProviderName.GROK, "T001, Alpha Theme, d\nT002, Beta Theme, d\nT003, Gamma Theme, d")
    seen = []
    themes, st = _run(tf.generate_themes_streaming(v, groups, lambda *a: seen.append(a)))
    assert st["coverage_pct"] == 100.0 and st["batches"] == 3 and len(seen) == 3
    assert len(themes["Supporting Comments"]) == 6 and st["first_batch_ms"] is not None


def test_tree_reduce_chunks_large_pools():
    def reply(texts, instruction):
        return "\n".join(f"T{i}, Theme {i}, desc, 90%" for i in range(1, 10))

    v = _V(AIProviderName.GROK, reply)
    pool = {"Supporting Comments": [f"t{i}" for i in range(95)], "Risk & Concerns": [], "Neutral Comments": ["x"]}
    red, st = _run(tf.reduce_themes_tree(v, pool, chunk=30))  # tree rounds get names-only replies
    assert st["tree_rounds"]["Supporting Comments"] >= 1
    assert [len(red["Supporting Comments"][k]) for k in ("9", "6", "3")] == [9, 6, 3]
    assert red["Risk & Concerns"]["3"][0]["is_empty"]


def test_convergence_reports_stability():
    g = [[{"theme2_3": "A"}] * 7 + [{"theme2_3": "B"}] * 3 for _ in range(10)]
    rep = tf.convergence({"Supporting Comments": g})
    c = rep["Supporting Comments"]
    assert c["final_top3"][0]["label"] == "A" and c["top1_stable_from_sample"] == 1
    assert c["shares_within_tol_from_sample"] == 1
