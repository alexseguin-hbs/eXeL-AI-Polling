"""t186u (2026-11-09, CRS-09.08.02): no vendor preference — speed-weighted round-robin over ALL keyed vendors,
hedge to the fastest untried vendor, fixed order only after an error."""
import asyncio

import pytest

from app.cubes.cube6_ai.providers.base import AIProviderName, SummarizationProvider
from app.cubes.cube6_ai.providers import multi_vendor as mv


class _V(SummarizationProvider):
    def __init__(self, name, delay=0.0, exc=None):
        self.provider_name, self.delay, self.exc, self.calls = name, delay, exc, 0

    async def summarize(self, texts, instruction=""):
        self.calls += 1
        await asyncio.sleep(self.delay)
        if self.exc:
            raise self.exc
        return self.provider_name.value


@pytest.fixture(autouse=True)
def _reset():
    mv.reset_circuits()
    yield
    mv.reset_circuits()


def _many(s, n):
    async def go():
        return await asyncio.gather(*[s.summarize([str(i)], "k") for i in range(n)])
    return asyncio.run(go())


def test_equal_speed_vendors_share_calls():
    vs = [_V(AIProviderName.GROK), _V(AIProviderName.OPENAI), _V(AIProviderName.GEMINI)]
    s = mv.MultiVendorSummarizer(vs, hedge_after_s=None)
    out = _many(s, 30)
    assert {o: out.count(o) for o in set(out)} == {"grok": 10, "openai": 10, "gemini": 10}


def test_faster_vendor_gets_more_calls_after_warmup():
    fast, slow = _V(AIProviderName.OPENAI, delay=0.01), _V(AIProviderName.GROK, delay=0.04)
    s = mv.MultiVendorSummarizer([slow, fast], hedge_after_s=None)
    _many(s, 12)                                        # warm-up: both get p50 samples
    before = (fast.calls, slow.calls)
    for _ in range(40):
        asyncio.run(s.summarize(["x"], "k"))
    gained_fast, gained_slow = fast.calls - before[0], slow.calls - before[1]
    assert gained_fast > 2 * gained_slow > 0          # ~4x weight, slow still used (no preference, just speed)
    rows = {r["provider"]: r for r in mv.vendor_cost_rows(s)}
    assert rows["openai"]["p50_ms"] < rows["grok"]["p50_ms"] and rows["openai"]["served_ms"] > 0


def test_hedge_goes_to_fastest_untried_vendor():
    a, b, c = _V(AIProviderName.GROK, delay=1.0), _V(AIProviderName.OPENAI, delay=0.0), _V(AIProviderName.GEMINI, delay=0.0)
    for _ in range(3):
        mv._record_vendor_latency("gemini", 0.1)
        mv._record_vendor_latency("openai", 0.9)
        mv._record_vendor_latency("grok", 0.9)
    s = mv.MultiVendorSummarizer([a, b, c], hedge_after_s=0.02)
    mv._RR_CREDIT.update({"grok": 100.0})              # force first pick = grok (slow)
    assert asyncio.run(s.summarize(["x"], "k")) == "gemini"
    assert s.usage["gemini"]["hedges"] == 1 and b.calls == 0


def test_error_uses_fixed_order():
    a = _V(AIProviderName.OPENAI, exc=RuntimeError("boom"))
    b, c = _V(AIProviderName.GROK), _V(AIProviderName.GEMINI)
    s = mv.MultiVendorSummarizer([b, c, a], hedge_after_s=None)
    mv._RR_CREDIT.update({"openai": 100.0})
    assert asyncio.run(s.summarize(["x"], "k")) == "grok"   # after the error: list order (grok before gemini)


def test_primary_mode_kept_for_debugging():
    vs = [_V(AIProviderName.GROK), _V(AIProviderName.OPENAI)]
    s = mv.MultiVendorSummarizer(vs, hedge_after_s=None, mode="primary")
    assert set(_many(s, 6)) == {"grok"}
