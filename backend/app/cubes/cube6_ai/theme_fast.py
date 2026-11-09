"""Cube 6 Theme02 fast path — the monolith's semantics, scaled (CRS-09.08.01-.05, 2026-11-09).

The original notebook (eXeL-AI_Polling_v04.2.py) is the reference: Theme01 on the 33-word summary as
'Supporting Comments' / 'Risk & Concerns' / 'Neutral Comments' (owner's exact labels and order, 2026-11-09) with confidence (<65% → Neutral); shuffle each category
into samples of 10; 3 themes per sample (5-word name, 7-12 word description); pool → 9 → 6 → 3 with confidence; assign
every response a Theme2_9/6/3. Those outputs and prompts are kept. What changes is only HOW the work is scheduled:

  1. Delete the part — Theme01 classifies a batch of up to CLASSIFY_BATCH responses per call (JSON out) instead of one
     call per response; the same three labels, the same confidence rule. A batch whose JSON does not parse falls back
     to the original one-call-per-response prompt, so nothing is ever left unclassified.
  2. Parallel engines — every call goes through the MultiVendorSummarizer (xAI primary, OpenAI/Gemini hedge + failover,
     per-call timeouts), so a slow or failed vendor never blocks a round.
  3. Streaming — each sample-of-10 reports its themes the moment it finishes (`on_batch`), so the moderator sees themes
     forming (broadcast `theme_batch_progress`) long before the final 9/6/3.
  4. Hierarchical reduce — pooled themes are reduced in parallel chunks of REDUCE_CHUNK → 9 until one prompt fits, then
     9 → 6 → 3 as before. (The single-prompt reduce silently lost themes past the provider's 8,000-char input cap at
     large N; the tree keeps every sample's themes in play.)
  5. Telemetry — `convergence()` reports how the top-3 shares settle as samples of 10 accumulate.

Assignment by cosine similarity (embeddings cached once per run: theme labels + summaries) is the existing
`_assign_themes_embedding`; the LLM matcher stays the fallback when no embedding vendor answers.
"""
from __future__ import annotations

import asyncio
import json
import re
import time
from collections import Counter
from typing import Awaitable, Callable

import structlog

from app.cubes.cube6_ai.phase_b import (
    _CLASSIFY_INSTRUCTION,
    _CLASSIFY_PATTERN,
    _CONFIDENCE_THRESHOLD,
    _REDUCE_INSTRUCTION,
    _TYPE_MAP,
    THEME01_CATEGORIES,
    _generate_themes_for_group,
    _pad_themes_to_target,
    _parse_reduced_themes,
)
from app.cubes.cube6_ai.providers.base import SummarizationProvider

logger = structlog.get_logger(__name__)

CLASSIFY_BATCH = 20
REDUCE_CHUNK = 30
_GEN_MAX_CONCURRENT = 96

_BATCH_CLASSIFY_INSTRUCTION = (
    "If an input is not in English, translate it to English first. For EACH numbered input decide ONE of these three "
    "exact phrases: 'Supporting Comments' or 'Risk & Concerns' or 'Neutral Comments', and a confidence from 0 to 100. "
    'Reply with ONLY a JSON array, one object per input, in order: [{"i": 1, "theme": "...", "confidence": 87}, ...]'
)


def _apply_theme01(r: dict, theme01: str, confidence: int) -> None:
    theme01 = (theme01 or "").strip()
    if theme01 in ("Risk & Concerns", "Supporting Comments") and confidence < _CONFIDENCE_THRESHOLD:
        theme01 = "Neutral Comments"
    r["theme01"] = theme01
    r["theme01_confidence"] = confidence


def _parse_batch(reply: str, n: int) -> list[tuple[str, int]] | None:
    text = (reply or "").strip()
    m = re.search(r"\[.*\]", text, re.S)
    if not m:
        return None
    try:
        arr = json.loads(m.group(0))
    except (json.JSONDecodeError, TypeError):
        return None
    if not isinstance(arr, list) or len(arr) != n:
        return None
    out = []
    for obj in arr:
        if not isinstance(obj, dict):
            return None
        try:
            conf = int(float(obj.get("confidence", 0)))
        except (TypeError, ValueError):
            conf = 0
        out.append((str(obj.get("theme", "")), max(0, min(conf, 100))))
    return out


async def classify_theme01_batched(summarizer: SummarizationProvider, responses: list[dict],
                                   batch: int = CLASSIFY_BATCH) -> dict:
    """Theme01 for every response, `batch` per call. Returns stats {calls, batches, fallback_items}."""
    stats = {"batches": 0, "fallback_items": 0}
    if not responses:
        return stats
    chunks = [responses[i:i + batch] for i in range(0, len(responses), batch)]
    stats["batches"] = len(chunks)
    sem = asyncio.Semaphore(_GEN_MAX_CONCURRENT)

    async def one(chunk: list[dict]) -> None:
        body = "\n".join(f"{k + 1}. {r.get('summary_33', '')[:400]}" for k, r in enumerate(chunk))
        parsed = None
        async with sem:
            try:
                reply = await summarizer.summarize([f"INPUTS:\n{body}"], instruction=_BATCH_CLASSIFY_INSTRUCTION)
                parsed = _parse_batch(reply, len(chunk))
            except Exception as e:  # noqa: BLE001 — fall back below, never drop a response
                logger.warning("cube6.fast.classify_batch_failed", error=type(e).__name__)
        if parsed is not None:
            for r, (theme, conf) in zip(chunk, parsed):
                _apply_theme01(r, theme, conf)
            return
        # Fallback: the original per-response prompt for this chunk only.
        stats["fallback_items"] += len(chunk)
        items = [{"text": f"INPUT: {r['summary_33'][:2500]}", "instruction": _CLASSIFY_INSTRUCTION} for r in chunk]
        results = await summarizer.batch_summarize(items)
        for r, res in zip(chunk, results):
            m = _CLASSIFY_PATTERN.match(res or "")
            if m:
                _apply_theme01(r, m.group(1), int(m.group(2)))
            else:
                _apply_theme01(r, (res or "").strip(), 0)

    await asyncio.gather(*(one(c) for c in chunks))
    return stats


async def generate_themes_streaming(
    summarizer: SummarizationProvider,
    bin_samples: dict[str, list[list[dict]]],
    on_batch: Callable[[str, list[str], int, int, int], Awaitable[None] | None] | None = None,
) -> tuple[dict[str, list[str]], dict]:
    """3 themes per sample of 10, all samples concurrently; `on_batch(category, themes, done, total, covered)` fires as
    each finishes. Returns (themes by category, stats with first_batch_ms and coverage)."""
    all_themes: dict[str, list[str]] = {cat: [] for cat in THEME01_CATEGORIES}
    jobs = [(label, g) for label, groups in bin_samples.items() for g in groups if g]
    total_resp = sum(len(g) for _, g in jobs)
    stats = {"batches": len(jobs), "failed_batches": 0, "first_batch_ms": None, "covered_responses": 0,
             "total_responses": total_resp}
    if not jobs:
        stats["coverage_pct"] = 100.0
        return all_themes, stats
    sem = asyncio.Semaphore(_GEN_MAX_CONCURRENT)
    t0 = time.monotonic()
    done = 0

    async def one(label: str, group: list[dict]) -> None:
        nonlocal done
        async with sem:
            try:
                themes = await _generate_themes_for_group(summarizer, group, _TYPE_MAP.get(label, "NEUTRAL"))
            except Exception as e:  # noqa: BLE001
                stats["failed_batches"] += 1
                logger.warning("cube6.fast.theme_gen_failed", label=label, error=type(e).__name__)
                themes = []
        all_themes[label].extend(themes)
        done += 1
        if themes:
            stats["covered_responses"] += len(group)
            if stats["first_batch_ms"] is None:
                stats["first_batch_ms"] = round((time.monotonic() - t0) * 1000)
        if on_batch is not None:
            try:
                res = on_batch(label, themes, done, len(jobs), stats["covered_responses"])
                if asyncio.iscoroutine(res):
                    await res
            except Exception as e:  # noqa: BLE001 — a broadcast can never break theming
                logger.warning("cube6.fast.on_batch_failed", error=type(e).__name__)

    await asyncio.gather(*(one(label, g) for label, g in jobs))
    stats["coverage_pct"] = round(100.0 * stats["covered_responses"] / total_resp, 2) if total_resp else 100.0
    return all_themes, stats


async def _reduce_to(summarizer, themes: list[str], type_str: str, count: int) -> list[dict]:
    text = await summarizer.summarize(
        [f"Reduce these themes to {count}:\n" + "\n".join(themes)],
        instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=count),
    )
    return _parse_reduced_themes(text)


async def reduce_themes_tree(summarizer, all_themes: dict[str, list[str]], chunk: int = REDUCE_CHUNK) -> tuple[dict, dict]:
    """all → (parallel chunks of `chunk` → 9, repeated) → 9 → 6 → 3 per category, categories concurrent.
    Same prompts, parser, padding and fallbacks as phase_b._reduce_themes."""
    stats = {"tree_rounds": {}}

    async def one(label: str, themes: list[str]) -> dict[str, list[dict]]:
        if not themes:
            return {"9": _pad_themes_to_target([], 9), "6": _pad_themes_to_target([], 6), "3": _pad_themes_to_target([], 3)}
        type_str = _TYPE_MAP.get(label, "NEUTRAL")
        pool, rounds = list(themes), 0
        while len(pool) > chunk:
            rounds += 1
            parts = [pool[i:i + chunk] for i in range(0, len(pool), chunk)]

            async def red(part: list[str]) -> list[str]:
                try:
                    return [t["label"] for t in await _reduce_to(summarizer, part, type_str, 9)] or part[:9]
                except Exception:  # noqa: BLE001
                    return part[:9]

            nxt = [t for res in await asyncio.gather(*(red(p) for p in parts)) for t in res]
            if len(nxt) >= len(pool):  # no progress — never loop forever
                pool = nxt[:chunk]
                break
            pool = nxt
        stats["tree_rounds"][label] = rounds
        try:
            p9 = await _reduce_to(summarizer, pool, type_str, 9)
        except Exception as e:  # noqa: BLE001
            logger.warning("cube6.reduce.9_failed", label=label, error=str(e))
            p9 = []
        if not p9:
            p9 = [{"label": t, "description": "", "confidence": 0.7} for t in pool[:9]]
        try:
            p6 = await _reduce_to(summarizer, [t["label"] for t in p9], type_str, 6) or p9[:6]
        except Exception as e:  # noqa: BLE001
            logger.warning("cube6.reduce.6_failed", label=label, error=str(e))
            p6 = p9[:6]
        try:
            p3 = await _reduce_to(summarizer, [t["label"] for t in p6], type_str, 3) or p6[:3]
        except Exception as e:  # noqa: BLE001
            logger.warning("cube6.reduce.3_failed", label=label, error=str(e))
            p3 = p6[:3]
        return {"9": _pad_themes_to_target(p9, 9), "6": _pad_themes_to_target(p6, 6), "3": _pad_themes_to_target(p3, 3)}

    labels = sorted(all_themes.keys())
    results = await asyncio.gather(*(one(lb, all_themes[lb]) for lb in labels))
    return dict(zip(labels, results)), stats


def convergence(bin_samples: dict[str, list[list[dict]]], level: str = "3", tol: float = 0.05) -> dict:
    """How theme shares settle as random samples of 10 accumulate (per Theme01 category).

    For each prefix of k samples (in the random draw order) compute each level-`level` theme's share among those
    responses and compare to the final share over all samples. Reports, per category: samples, the final top-3 with
    shares, the first k after which the top-1 label never changes, the first k after which every share stays within
    `tol` of final, and a few checkpoints. Assignment uses the final themes, so this measures SAMPLING stability of
    proportions, not label drift — reported as such."""
    out: dict[str, dict] = {}
    for cat, groups in bin_samples.items():
        groups = [g for g in groups if g]
        if not groups:
            continue
        final = Counter(r.get(f"theme2_{level}", "") for g in groups for r in g)
        n_final = sum(final.values()) or 1
        fshare = {k: v / n_final for k, v in final.items()}
        top_final = [k for k, _ in final.most_common(3)]
        cum: Counter = Counter()
        n = 0
        top1_hist, maxdev_hist, checkpoints = [], [], []
        marks = {1, 2, 3, 5, 10, 20, 50, 100, 200, 500, len(groups)}
        for k, g in enumerate(groups, 1):
            for r in g:
                cum[r.get(f"theme2_{level}", "")] += 1
                n += 1
            share = {key: cum.get(key, 0) / n for key in fshare}
            dev = max(abs(share[key] - fshare[key]) for key in fshare)
            top1 = cum.most_common(1)[0][0]
            top1_hist.append(top1)
            maxdev_hist.append(dev)
            if k in marks:
                checkpoints.append({"samples": k, "responses": n, "top3": [x for x, _ in cum.most_common(3)],
                                    "max_share_dev_pts": round(100 * dev, 1)})

        def stable_from(pred) -> int | None:
            first = None
            for i, ok in enumerate(pred, 1):
                if ok and first is None:
                    first = i
                elif not ok:
                    first = None
            return first

        out[cat] = {
            "samples": len(groups),
            "responses": n_final,
            "final_top3": [{"label": k, "share_pct": round(100 * fshare[k], 1)} for k in top_final],
            "top1_stable_from_sample": stable_from([t == top_final[0] for t in top1_hist]),
            "shares_within_tol_from_sample": stable_from([d <= tol for d in maxdev_hist]),
            "tol_pts": round(100 * tol, 1),
            "checkpoints": checkpoints,
        }
    return out
