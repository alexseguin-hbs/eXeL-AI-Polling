"""Multi-vendor summarizer: primary-first load balancing, hedging, timeouts and failover (CRS-09.08.01, CRS-15.10).

2026-11-09 (owner t159u-t162u): xAI is the primary funded vendor; OpenAI and Gemini stay as fallbacks so a vendor
outage, a timeout, or an exhausted prepaid balance (HTTP 402/403/429) never stops Phase A or theming.

Per call:
  1. Vendor order = healthy vendors, primary first. If the primary already has `max_inflight` calls running, the
     least-loaded healthy vendor goes first instead (spill-over load balancing for large marble-batch fan-outs).
  2. The first vendor gets the call. If it has not answered after `hedge_after_s`, the next vendor is started in
     parallel ("hedge") and the first good answer wins; the loser is cancelled. A vendor error starts the next vendor
     immediately. Every attempt is bounded by `timeout_s`.
  3. A failing vendor opens a short circuit (3 consecutive failures → 30 s; auth/credit errors → 300 s) so later calls
     skip it — e.g. Gemini with low credits fails once, then stops being tried.

Prompts and parsing are untouched: every vendor receives the same (texts, instruction), so summary/theme semantics
are the caller's, unchanged. `usage` records calls/chars per vendor that actually served (or were billed for a
cancelled hedge's input), so the cost ledger prices each vendor at its own rate instead of the primary's.
"""

from __future__ import annotations

import asyncio
import time

import structlog

from app.cubes.cube6_ai.providers.base import AIProviderName, SummarizationProvider

logger = structlog.get_logger(__name__)

# Client-side pacing per vendor (requests/second) so a large fan-out stays under the vendor's RPM instead of
# collecting 429s. xAI team limit read from x-ratelimit-limit-requests on 2026-11-09: 1,800/min = 30 rps → pace at 28.
_VENDOR_RPS: dict[str, float] = {"grok": 28.0, "openai": 50.0, "gemini": 15.0, "claude": 15.0}
_NEXT_SLOT: dict[str, float] = {}


async def _pace(vendor: str) -> None:
    rps = _VENDOR_RPS.get(vendor)
    if not rps:
        return
    now = time.monotonic()
    slot = max(now, _NEXT_SLOT.get(vendor, 0.0))
    _NEXT_SLOT[vendor] = slot + 1.0 / rps
    if slot > now:
        await asyncio.sleep(slot - now)


# Circuit state is process-wide: one container serves many sessions, and a vendor that is out of credit is out for all.
_CB_FAILS: dict[str, int] = {}
_CB_OPEN_UNTIL: dict[str, float] = {}
_CB_THRESHOLD = 3
_CB_OPEN_S = 30.0
_CB_HARD_OPEN_S = 300.0  # 401/402/403: key or prepaid credit problem — no point retrying for a while


def _status_code(exc: BaseException) -> int | None:
    code = getattr(exc, "status_code", None) or getattr(exc, "code", None)
    try:
        return int(code) if code is not None else None
    except (TypeError, ValueError):
        return None


# Recent successful-call latencies per task kind (instruction prefix), so the hedge fires at ~p95 for THAT kind of
# call: a 1.5 s classify batch hedges early, a 4 s reduce does not hedge needlessly ("engine-out" tolerance).
_LAT: dict[str, list[float]] = {}
_LAT_KEEP = 64


def _kind(instruction: str) -> str:
    return (instruction or "")[:48]


def _record_latency(kind: str, seconds: float) -> None:
    xs = _LAT.setdefault(kind, [])
    xs.append(seconds)
    if len(xs) > _LAT_KEEP:
        del xs[0]


def hedge_delay(kind: str, default: float | None) -> float | None:
    if default is None:
        return None
    xs = sorted(_LAT.get(kind, []))
    if len(xs) < 5:
        return default
    p95 = xs[min(len(xs) - 1, int(0.95 * len(xs)))]
    return max(1.0, 1.1 * p95)


def circuit_open(vendor: str) -> bool:
    return _CB_OPEN_UNTIL.get(vendor, 0.0) > time.monotonic()


def _is_hard(exc: BaseException) -> bool:
    """Key/credit problems: retrying soon cannot help (401/402/403, or a 400 that says the key is invalid)."""
    code = _status_code(exc)
    if code in (401, 402, 403):
        return True
    msg = str(exc).lower()
    return code == 400 and ("api_key_invalid" in msg or "api key not valid" in msg or "credit" in msg)


def _record_failure(vendor: str, exc: BaseException) -> None:
    _CB_FAILS[vendor] = _CB_FAILS.get(vendor, 0) + 1
    if _status_code(exc) == 429:  # rate limit: back off briefly, never a long open
        _CB_OPEN_UNTIL[vendor] = max(_CB_OPEN_UNTIL.get(vendor, 0.0), time.monotonic() + 1.0)
        return
    if _is_hard(exc):
        _CB_OPEN_UNTIL[vendor] = time.monotonic() + _CB_HARD_OPEN_S
    elif _CB_FAILS[vendor] >= _CB_THRESHOLD:
        _CB_OPEN_UNTIL[vendor] = time.monotonic() + _CB_OPEN_S


def _record_success(vendor: str) -> None:
    _CB_FAILS[vendor] = 0
    _CB_OPEN_UNTIL.pop(vendor, None)


def reset_circuits() -> None:
    """Tests only."""
    _CB_FAILS.clear()
    _CB_OPEN_UNTIL.clear()
    _LAT.clear()


class AllVendorsFailed(Exception):
    """Every vendor in one pass failed; `retryable` when any failure was a rate limit or a timeout."""

    def __init__(self, errors: list[BaseException]):
        super().__init__("all AI vendors failed: " + ", ".join(type(e).__name__ for e in errors))
        self.errors = errors
        self.retryable = any(_status_code(e) == 429 or isinstance(e, asyncio.TimeoutError) for e in errors)


class MultiVendorSummarizer(SummarizationProvider):
    """Wraps an ordered list of SummarizationProviders (primary first)."""

    def __init__(
        self,
        vendors: list[SummarizationProvider],
        *,
        timeout_s: float = 20.0,
        hedge_after_s: float | None = 2.5,
        max_inflight: int = 48,
    ) -> None:
        if not vendors:
            raise ValueError("MultiVendorSummarizer needs at least one vendor")
        self._vendors = vendors
        self.provider_name: AIProviderName = vendors[0].provider_name  # the requested/primary vendor
        self.timeout_s = timeout_s
        self.hedge_after_s = hedge_after_s
        self.max_inflight = max(1, int(max_inflight))
        self._inflight: dict[str, int] = {v.provider_name.value: 0 for v in vendors}
        self.usage: dict[str, dict[str, int]] = {}

    @property
    def vendor_names(self) -> list[str]:
        return [v.provider_name.value for v in self._vendors]

    def served_by(self) -> list[str]:
        return sorted(k for k, u in self.usage.items() if u.get("served", 0))

    def _bump(self, vendor: str, key: str, n: int = 1) -> None:
        u = self.usage.setdefault(vendor, {"served": 0, "calls": 0, "input_chars": 0, "output_chars": 0,
                                           "failures": 0, "hedges": 0, "cancelled": 0})
        u[key] = u.get(key, 0) + n

    def _order(self) -> list[SummarizationProvider]:
        healthy = [v for v in self._vendors if not circuit_open(v.provider_name.value)]
        if not healthy:  # every circuit open: still try everything rather than fail without a call
            healthy = list(self._vendors)
        primary = healthy[0]
        if self._inflight.get(primary.provider_name.value, 0) >= self.max_inflight and len(healthy) > 1:
            spill = min(healthy[1:], key=lambda v: self._inflight.get(v.provider_name.value, 0))
            if self._inflight.get(spill.provider_name.value, 0) < self.max_inflight:
                return [spill] + [v for v in healthy if v is not spill]
        if len(healthy) == 1:  # one vendor: a hedge re-sends to the same vendor (tail latency is per request)
            return healthy + healthy
        return healthy

    async def _attempt(self, vendor: SummarizationProvider, texts: list[str], instruction: str) -> str:
        name = vendor.provider_name.value
        self._inflight[name] = self._inflight.get(name, 0) + 1
        try:
            await _pace(name)
            return await asyncio.wait_for(vendor.summarize(texts, instruction=instruction), timeout=self.timeout_s)
        finally:
            self._inflight[name] -= 1

    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        """One logical call; up to 3 rounds over the vendor list when every vendor was rate-limited/timed out."""
        last: BaseException | None = None
        for round_ in range(3):
            try:
                return await self._summarize_once(texts, instruction)
            except AllVendorsFailed as e:
                last = e.errors[-1] if e.errors else e
                if not e.retryable:
                    raise last
                await asyncio.sleep(0.5 * (2 ** round_))
        raise last  # type: ignore[misc]

    async def _summarize_once(self, texts: list[str], instruction: str = "") -> str:
        order = self._order()
        in_chars = len(instruction or "") + sum(len(t or "") for t in texts)
        pending: dict[asyncio.Task, str] = {}
        nxt = 0
        errors: list[BaseException] = []

        kind = _kind(instruction)
        hedge_after = hedge_delay(kind, self.hedge_after_s)
        started: dict[asyncio.Task, float] = {}

        def start_next(reason: str) -> bool:
            nonlocal nxt
            if nxt >= len(order):
                return False
            v = order[nxt]
            name = v.provider_name.value
            if reason == "hedge" and _NEXT_SLOT.get(name, 0.0) - time.monotonic() > 0.25:
                return False  # the vendor's pacing queue is backed up: a hedge there only adds cost, not speed
            nxt += 1
            if reason == "hedge":
                self._bump(name, "hedges")
            if nxt > 1:
                logger.info("cube6.provider.runtime_failover", to=name, reason=reason, primary=self.provider_name.value)
            task = asyncio.create_task(self._attempt(v, texts, instruction))
            pending[task] = name
            started[task] = time.monotonic()
            return True

        start_next("primary")
        try:
            while pending:
                can_hedge = hedge_after is not None and nxt < len(order) and len(pending) == 1
                done, _ = await asyncio.wait(
                    set(pending), timeout=hedge_after if can_hedge else None,
                    return_when=asyncio.FIRST_COMPLETED,
                )
                if not done:  # hedge window passed with no answer
                    if not start_next("hedge"):
                        hedge_after = None  # wait for the running call instead
                    continue
                for task in done:
                    name = pending.pop(task)
                    self._bump(name, "calls")
                    self._bump(name, "input_chars", in_chars)
                    exc = task.exception()
                    if exc is None:
                        out = task.result() or ""
                        self._bump(name, "served")
                        self._bump(name, "output_chars", len(out))
                        _record_success(name)
                        _record_latency(kind, time.monotonic() - started.get(task, time.monotonic()))
                        return out
                    errors.append(exc)
                    self._bump(name, "failures")
                    _record_failure(name, exc)
                    logger.warning("cube6.provider.call_failed", provider=name,
                                   error=type(exc).__name__, status=_status_code(exc))
                if not pending:
                    start_next("error")
            raise AllVendorsFailed(errors)
        finally:
            for task, name in pending.items():  # hedge losers: input is billed by the vendor even if we cancel
                task.cancel()
                self._bump(name, "cancelled")
                self._bump(name, "calls")
                self._bump(name, "input_chars", in_chars)


def vendor_cost_rows(summarizer) -> list[dict]:
    """Per-vendor cost rows for the ledger (each vendor priced at its own AI_COST_RATES entry; ~4 chars/token)."""
    from app.cubes.cube6_ai.providers.base import AICostTracker

    rows = []
    for vendor, u in sorted((getattr(summarizer, "usage", None) or {}).items()):
        if not u.get("calls"):
            continue
        t = AICostTracker(vendor)
        t.log_call(int(u.get("input_chars", 0)), int(u.get("output_chars", 0)))
        s = t.summary()
        rows.append({
            "provider": vendor, "total_calls": int(u["calls"]), "served": int(u.get("served", 0)),
            "failures": int(u.get("failures", 0)), "hedges": int(u.get("hedges", 0)),
            "total_input_chars": int(u.get("input_chars", 0)), "total_output_chars": int(u.get("output_chars", 0)),
            "estimated_cost_usd": s["estimated_cost_usd"], "rate_unknown": s["rate_unknown"],
        })
    return rows


def dominant_vendor(summarizer, default: str) -> str:
    """The vendor that served the most calls (what a summary/theme row records as its provider)."""
    usage = getattr(summarizer, "usage", None) or {}
    best = max(usage.items(), key=lambda kv: kv[1].get("served", 0), default=None)
    return best[0] if best and best[1].get("served", 0) else default
