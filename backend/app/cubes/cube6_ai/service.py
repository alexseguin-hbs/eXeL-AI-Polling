"""Cube 6 — AI Theme Pipeline: Live Summarization + Parallel Theming.

Two-phase architecture matching the monolith (eXeL-AI_Polling_v04.2.py):

PHASE A — Live Per-Response Summarization (during polling):
  Called by Cube 2 after each text/voice submission.
  Generates 333 -> 111 -> 33 word English summaries immediately.
  Stored in PostgreSQL (ResponseSummary) for instant moderator screen display.

PHASE B — Parallel Theme Pipeline (after moderator closes polling):
  1. Fetch all 33-word summaries from ResponseSummary (PostgreSQL)
  2. Classify Theme01 (Risk / Supporting / Neutral) — batch parallel
  3. Group by Theme01 into 3 partitions
  4. Marble sampling: shuffle each partition, slice into groups of 10
  5. Generate 3 themes per marble group — 10+ concurrent agents
  6. After ALL groups complete: merge all themes per partition
  7. Reduce to final 9 (statistically relevant) -> 6 -> 3
  8. Assign each response to 9/6/3 themes with confidence
  9. Store results in Postgres + compute replay hash

Target: Theme01 + Theme2 complete in <30 seconds for 1000 responses.
"""

import asyncio
import hashlib
import json
import logging
import math
import re
import uuid
from datetime import datetime, timezone

import numpy as np
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.cubes.cube6_ai.providers.base import EmbeddingProvider, SummarizationProvider
from app.cubes.cube6_ai.providers.factory import (
    get_embedding_provider,
    get_summarization_provider,
)
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.session import Session
from app.models.theme import Theme
from app.models.theme_sample import ThemeSample

logger = logging.getLogger(__name__)

# Theme01 categories (matches monolith)
THEME01_CATEGORIES = ["Risk & Concerns", "Supporting Comments", "Neutral Comments"]
_CONFIDENCE_THRESHOLD = 65  # <65% -> reclassify as Neutral (monolith line 127)

# --- Task A3: Per-session concurrency cap on Phase A ---
# Limits concurrent AI calls per session to prevent provider rate-limit cascade.
# Each worker enforces independently; Redis-backed global cap deferred to production scaling.
_PHASE_A_MAX_CONCURRENT = 10
_phase_a_semaphores: dict[uuid.UUID, asyncio.Semaphore] = {}


def _get_phase_a_semaphore(session_id: uuid.UUID) -> asyncio.Semaphore:
    """Return (or create) a per-session semaphore for Phase A concurrency."""
    if session_id not in _phase_a_semaphores:
        _phase_a_semaphores[session_id] = asyncio.Semaphore(_PHASE_A_MAX_CONCURRENT)
    return _phase_a_semaphores[session_id]


def release_phase_a_semaphore(session_id: uuid.UUID) -> None:
    """Clean up semaphore when session leaves polling (e.g. ranking transition)."""
    _phase_a_semaphores.pop(session_id, None)


# ═══════════════════════════════════════════════════════════════════
# PHASE A — Live Per-Response Summarization
# ═══════════════════════════════════════════════════════════════════

_SUMMARIZE_INSTRUCTION = (
    "You are a summarizer. {translate}"
    "Condense the text to approximately {target} words, preserving key points "
    "and meaning. Ensure the final summary is in English."
)


_SINGLE_PROMPT_INSTRUCTION = (
    "You are a summarizer. {translate}"
    "Given the following text, produce three summaries at different lengths. "
    "Return ONLY valid JSON with exactly these three keys:\n"
    '{{"summary_333": "~333 word summary", "summary_111": "~111 word summary", "summary_33": "~33 word summary"}}\n'
    "All summaries must be in English. Preserve key points and meaning."
)


async def summarize_single_response(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
    raw_text: str,
    language_code: str = "en",
    ai_provider: str = "openai",
    session_short_code: str = "",
) -> dict:
    """Generate 333 -> 111 -> 33 word summaries for a single response.

    Called by Cube 2 submit flow (fire-and-forget async task with retry).
    Stores summaries in PostgreSQL (response_summaries), then broadcasts
    summary_ready via Supabase.

    Task A0: Short-circuit if ≤33 words (BR-1).
    Task A1: Single structured prompt for all 3 tiers (<0.5s target).
    Task A5: Broadcast summary_ready after store.

    Returns: {"summary_333": str, "summary_111": str, "summary_33": str}
    """
    from app.core.supabase_broadcast import broadcast_event

    # --- Task A3: Per-session concurrency cap ---
    semaphore = _get_phase_a_semaphore(session_id)
    async with semaphore:
        return await _summarize_single_response_inner(
            db,
            session_id=session_id,
            response_id=response_id,
            raw_text=raw_text,
            language_code=language_code,
            ai_provider=ai_provider,
            session_short_code=session_short_code,
        )


async def _summarize_single_response_inner(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
    raw_text: str,
    language_code: str = "en",
    ai_provider: str = "openai",
    session_short_code: str = "",
) -> dict:
    """Inner implementation — runs under per-session semaphore."""
    from app.core.supabase_broadcast import broadcast_event

    word_count = len(raw_text.split())

    # --- Task A0: Short-circuit ≤33 words (BR-1) ---
    # Text already at or below target summary length — no AI call needed.
    if word_count <= 33:
        summary_333 = raw_text
        summary_111 = raw_text
        summary_33 = raw_text
        logger.info(
            "cube6.phase_a.short_circuit",
            response_id=str(response_id),
            word_count=word_count,
        )
    else:
        # --- Task A1: Single structured prompt (2 round-trips max) ---
        summarizer = get_summarization_provider(ai_provider)

        translate = (
            "If the text is not in English, translate it to English first. "
            if language_code != "en"
            else ""
        )

        if word_count > 333:
            # Long text: first compress to ~333, then single prompt for 111+33
            summary_333 = await summarizer.summarize(
                [raw_text[:4000]],
                instruction=_SUMMARIZE_INSTRUCTION.format(translate=translate, target=333),
            )
            # Second call: 111 + 33 from the 333
            try:
                combined = await summarizer.summarize(
                    [summary_333],
                    instruction=_SINGLE_PROMPT_INSTRUCTION.format(translate=""),
                )
                parsed = json.loads(combined)
                summary_111 = parsed.get("summary_111", summary_333[:500])
                summary_33 = parsed.get("summary_33", " ".join(summary_333.split()[:33]))
            except (json.JSONDecodeError, TypeError):
                # Fallback: cascade if JSON parse fails
                summary_111 = await summarizer.summarize(
                    [summary_333],
                    instruction=_SUMMARIZE_INSTRUCTION.format(translate="", target=111),
                )
                summary_33 = await summarizer.summarize(
                    [summary_111],
                    instruction=_SUMMARIZE_INSTRUCTION.format(translate="", target=33),
                )
        else:
            # Medium text (34–333 words): single prompt for all 3 tiers
            try:
                combined = await summarizer.summarize(
                    [raw_text],
                    instruction=_SINGLE_PROMPT_INSTRUCTION.format(translate=translate),
                )
                parsed = json.loads(combined)
                summary_333 = parsed.get("summary_333", raw_text)
                summary_111 = parsed.get("summary_111", raw_text)
                summary_33 = parsed.get("summary_33", " ".join(raw_text.split()[:33]))
            except (json.JSONDecodeError, TypeError):
                # Fallback: cascade
                summary_333 = raw_text
                summary_111 = await summarizer.summarize(
                    [raw_text],
                    instruction=_SUMMARIZE_INSTRUCTION.format(translate=translate, target=111),
                )
                summary_33 = await summarizer.summarize(
                    [summary_111],
                    instruction=_SUMMARIZE_INSTRUCTION.format(translate="", target=33),
                )

    # Store in PostgreSQL (response_summaries) for immediate display
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from app.models.response_summary import ResponseSummary

    stmt = pg_insert(ResponseSummary).values(
        response_meta_id=response_id,
        session_id=session_id,
        provider=ai_provider,
        summary_333=summary_333,
        summary_111=summary_111,
        summary_33=summary_33,
    ).on_conflict_do_update(
        index_elements=["response_meta_id"],
        set_={
            "summary_333": summary_333,
            "summary_111": summary_111,
            "summary_33": summary_33,
            "provider": ai_provider,
        },
    )
    await db.execute(stmt)
    await db.commit()

    logger.info(
        "cube6.live_summary.completed",
        response_id=str(response_id),
        session_id=str(session_id),
        word_counts=f"333={len(summary_333.split())}, "
                     f"111={len(summary_111.split())}, "
                     f"33={len(summary_33.split())}",
    )

    # --- Task A5: Broadcast summary_ready via Supabase ---
    if session_short_code:
        await broadcast_event(
            channel=f"session:{session_short_code}",
            event="summary_ready",
            payload={
                "response_id": str(response_id),
                "summary_33": summary_33,
            },
        )

    return {
        "summary_333": summary_333,
        "summary_111": summary_111,
        "summary_33": summary_33,
    }


# ═══════════════════════════════════════════════════════════════════
# PHASE B — Parallel Theme Pipeline (post-close)
# ═══════════════════════════════════════════════════════════════════


# ---------------------------------------------------------------------------
# Step 1: Fetch all 33-word summaries
# ---------------------------------------------------------------------------

async def _fetch_summaries(
    db: AsyncSession, session_id: uuid.UUID
) -> list[dict]:
    """Fetch all response metadata + pre-computed 33-word summaries.

    Summaries were generated live during polling (Phase A).
    This step just collects them for the theming pipeline.
    """
    result = await db.execute(
        select(ResponseMeta).where(ResponseMeta.session_id == session_id)
    )
    metas = list(result.scalars().all())

    responses = []
    for meta in metas:
        # Get pre-computed summary from PostgreSQL (ResponseSummary)
        summary_result = await db.execute(
            select(ResponseSummary).where(
                ResponseSummary.response_meta_id == meta.id,
            )
        )
        summary_row = summary_result.scalar_one_or_none()

        summary_33 = ""
        summary_111 = ""
        summary_333 = ""
        if summary_row:
            summary_33 = summary_row.summary_33 or ""
            summary_111 = summary_row.summary_111 or ""
            summary_333 = summary_row.summary_333 or ""

        # Fallback: if no summary exists, use raw text from ResponseMeta
        if not summary_33 and meta.raw_text:
            words = meta.raw_text.split()[:33]
            summary_33 = " ".join(words)

        responses.append({
            "id": str(meta.id),
            "participant_id": str(meta.participant_id) if meta.participant_id else None,
            "question_id": str(meta.question_id),
            "summary_33": summary_33,
            "summary_111": summary_111,
            "summary_333": summary_333,
        })

    return responses


# ---------------------------------------------------------------------------
# Step 2: Classify Theme01 (batch parallel)
# ---------------------------------------------------------------------------

_CLASSIFY_INSTRUCTION = (
    "You reply with the exact format: 'THEME (Confidence: XX%)' where THEME is "
    "ONE of these three exact phrases: 'Risk & Concerns' or 'Supporting Comments' "
    "or 'Neutral Comments', and XX is a number from 0 to 100 indicating your confidence."
)

_CLASSIFY_PATTERN = re.compile(r"(.+?)\s*\(Confidence:\s*(\d+)%\)")


async def _classify_theme01(
    summarizer: SummarizationProvider, responses: list[dict]
) -> list[dict]:
    """Classify 33-word summaries into Theme01 categories (batch)."""
    if not responses:
        return responses

    items = [
        {"text": f"INPUT: {r['summary_33'][:2500]}", "instruction": _CLASSIFY_INSTRUCTION}
        for r in responses
    ]
    results = await summarizer.batch_summarize(items)

    for i, r in enumerate(responses):
        match = _CLASSIFY_PATTERN.match(results[i])
        if match:
            theme01 = match.group(1).strip()
            confidence = int(match.group(2))
        else:
            theme01 = results[i].strip()
            confidence = 0

        # Apply <65% confidence -> Neutral rule (monolith line 127)
        if theme01 in ("Risk & Concerns", "Supporting Comments") and confidence < _CONFIDENCE_THRESHOLD:
            theme01 = "Neutral Comments"

        r["theme01"] = theme01
        r["theme01_confidence"] = confidence

    return responses


# ---------------------------------------------------------------------------
# Step 3: Group by Theme01
# ---------------------------------------------------------------------------

def _group_by_theme01(responses: list[dict]) -> dict[str, list[dict]]:
    """Split responses into bins by Theme01 label."""
    bins: dict[str, list[dict]] = {cat: [] for cat in THEME01_CATEGORIES}
    for r in responses:
        label = r.get("theme01", "Neutral Comments")
        if label not in bins:
            label = "Neutral Comments"
        bins[label].append(r)
    return bins


# ---------------------------------------------------------------------------
# Step 4: Marble Sampling (shuffle + slice — matches monolith)
# ---------------------------------------------------------------------------

def _marble_sample(
    items: list[dict], seed: int
) -> list[list[dict]]:
    """Shuffle partition and slice into non-overlapping groups of 10.

    Matches monolith algorithm (eXeL-AI_Polling_v04.2.py lines 141-147):
      df.sample(frac=1).reset_index(drop=True)  # shuffle
      groups = [df.iloc[i*10:(i+1)*10] for i in range(ceil(len/10))]

    Each response used exactly once. No replacement sampling.
    Uses deterministic numpy RandomState for reproducibility.
    """
    if not items:
        return []

    rng = np.random.RandomState(seed)
    indices = rng.permutation(len(items))  # Deterministic shuffle
    shuffled = [items[idx] for idx in indices]

    group_size = settings.sample_size  # 10
    n_groups = math.ceil(len(shuffled) / group_size)

    groups = []
    for i in range(n_groups):
        start = i * group_size
        end = min(start + group_size, len(shuffled))
        groups.append(shuffled[start:end])

    return groups


async def _parallel_marble_sample(
    bins: dict[str, list[dict]], seed: int
) -> dict[str, list[list[dict]]]:
    """Marble sample all 3 partitions in parallel using thread pool."""
    tasks = []
    bin_labels = sorted(bins.keys())  # Deterministic order

    for i, label in enumerate(bin_labels):
        bin_seed = seed + i
        tasks.append(
            asyncio.to_thread(_marble_sample, bins[label], bin_seed)
        )

    results = await asyncio.gather(*tasks)
    return {label: samples for label, samples in zip(bin_labels, results)}


# ---------------------------------------------------------------------------
# Step 5: Generate 3 themes per marble group (10+ concurrent agents)
# ---------------------------------------------------------------------------

_THEME_GEN_INSTRUCTION = (
    "You are an AI assistant expert at theming {type_str}-based polling questions. "
    "Generate 3 unique SUMMARY THEMES for the given {type_str} data. "
    "Each theme in 5 words, description 7-12 words without commas/punctuation. "
    "Themes distinct.\n\n"
    "Reply in format:\n"
    "T001, Theme Name 001, Description of Theme 1\n"
    "T002, Theme Name 002, Description of Theme 2\n"
    "T003, Theme Name 003, Description of Theme 3"
)

_TYPE_MAP = {
    "Risk & Concerns": "RISK",
    "Supporting Comments": "SUPPORT",
    "Neutral Comments": "NEUTRAL",
}


async def _generate_themes_for_group(
    summarizer: SummarizationProvider,
    group: list[dict],
    type_str: str,
) -> list[str]:
    """Generate 3 themes for a single marble group of ~10 responses.

    Returns list of theme name strings.
    """
    combined = "\n".join(r.get("summary_33", "") for r in group)
    instruction = _THEME_GEN_INSTRUCTION.format(type_str=type_str)

    result_text = await summarizer.summarize(
        [f"Generate ONLY 3 THEMES for this data. Theme: 5-words, "
         f"Description: 7-12 words no commas/punctuation.\n\nINPUT: {combined[:2500]}"],
        instruction=instruction,
    )

    # Parse theme names from response
    themes = []
    for line in result_text.strip().split("\n"):
        parts = line.split(",")
        if len(parts) >= 2:
            theme_name = parts[1].strip()
            if theme_name:
                themes.append(theme_name)

    return themes


async def _parallel_generate_themes(
    summarizer: SummarizationProvider,
    bin_samples: dict[str, list[list[dict]]],
) -> dict[str, list[str]]:
    """Generate 3 themes per marble group across all partitions.

    All groups processed concurrently — this is the 10+ agent parallelism.
    For a partition with 100 responses = 10 groups = 10 concurrent API calls.
    """
    all_themes: dict[str, list[str]] = {cat: [] for cat in THEME01_CATEGORIES}

    # Build list of all concurrent tasks
    tasks: list[tuple[str, asyncio.Task]] = []

    for label, groups in bin_samples.items():
        if not groups:
            continue
        type_str = _TYPE_MAP.get(label, "NEUTRAL")

        for group in groups:
            task = asyncio.create_task(
                _generate_themes_for_group(summarizer, group, type_str)
            )
            tasks.append((label, task))

    # Execute ALL groups concurrently (10+ agents)
    if tasks:
        await asyncio.gather(*(t for _, t in tasks))

    # Collect results
    for label, task in tasks:
        try:
            themes = task.result()
            all_themes[label].extend(themes)
        except Exception as e:
            logger.warning("cube6.theme_gen.group_failed", label=label, error=str(e))

    return all_themes


# ---------------------------------------------------------------------------
# Step 6: Reduce themes (all -> 9 -> 6 -> 3)
# ---------------------------------------------------------------------------

_REDUCE_INSTRUCTION = (
    "You are an AI expert at reducing {type_str} themes. Reduce the list to "
    "exactly {count} unique themes, each with a 5-word name and 7-12 word "
    "description (no commas/punctuation). Reply in CSV format with headers "
    "T_Number, Theme, T_Description, Confidence (XX%). "
    "Confidence is your certainty in the theme (70-100%). Ensure themes are distinct."
)

_THEME_LINE_PATTERN = re.compile(
    r"T?\d+\s*,\s*(.+?)\s*,\s*(.+?)\s*,\s*(\d+)%?"
)


def _parse_reduced_themes(text: str) -> list[dict]:
    """Parse reduced theme output into list of {label, description, confidence}."""
    themes = []
    for line in text.strip().split("\n"):
        match = _THEME_LINE_PATTERN.match(line.strip())
        if match:
            themes.append({
                "label": match.group(1).strip(),
                "description": match.group(2).strip(),
                "confidence": int(match.group(3)) / 100.0,
            })
    return themes


async def _reduce_themes(
    summarizer: SummarizationProvider,
    all_themes: dict[str, list[str]],
) -> dict[str, dict[str, list[dict]]]:
    """Reduce themes: all -> 9 (statistically relevant) -> 6 -> 3 per partition.

    Reduction runs per Theme01 category (Risk, Supporting, Neutral).
    Each step feeds ONLY theme names to the next (skip CSV headers).
    All 3 category reductions run concurrently.
    """

    async def _reduce_single_category(
        label: str, themes: list[str]
    ) -> dict[str, list[dict]]:
        if not themes:
            return {"9": [], "6": [], "3": []}

        type_str = _TYPE_MAP.get(label, "NEUTRAL")

        # All -> 9 (statistically relevant consolidation)
        themes_str = "\n".join(themes)
        text_9 = await summarizer.summarize(
            [f"Reduce these themes to 9:\n{themes_str}"],
            instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=9),
        )
        parsed_9 = _parse_reduced_themes(text_9)

        # 9 -> 6
        themes_9_str = "\n".join(t["label"] for t in parsed_9)
        text_6 = await summarizer.summarize(
            [f"Reduce these themes to 6:\n{themes_9_str}"],
            instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=6),
        )
        parsed_6 = _parse_reduced_themes(text_6)

        # 6 -> 3
        themes_6_str = "\n".join(t["label"] for t in parsed_6)
        text_3 = await summarizer.summarize(
            [f"Reduce these themes to 3:\n{themes_6_str}"],
            instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=3),
        )
        parsed_3 = _parse_reduced_themes(text_3)

        return {"9": parsed_9, "6": parsed_6, "3": parsed_3}

    # Run all 3 category reductions concurrently
    labels = sorted(all_themes.keys())
    tasks = [
        _reduce_single_category(label, all_themes[label])
        for label in labels
    ]
    results = await asyncio.gather(*tasks)

    return {label: result for label, result in zip(labels, results)}


# ---------------------------------------------------------------------------
# Step 7: Assign themes to all responses with confidence
# ---------------------------------------------------------------------------

_ASSIGN_INSTRUCTION = (
    "Choose the best fitting theme from this list for the input. "
    "Reply with 'THEME (Confidence: XX%)' where THEME is exactly one "
    "from the list, XX 70-100."
)


async def _assign_themes_llm(
    summarizer: SummarizationProvider,
    responses: list[dict],
    reduced: dict[str, dict[str, list[dict]]],
) -> list[dict]:
    """Assign themes to each response using LLM matching (monolith approach).

    For each response at each level (9/6/3), asks the LLM to pick
    the best-fitting theme from the response's Theme01 category list.
    All assignments processed as a batch for speed.
    """
    if not responses:
        return responses

    # Build assignment tasks for all responses at all 3 levels
    for level in ("9", "6", "3"):
        items = []
        for r in responses:
            category = r.get("theme01", "Neutral Comments")
            cat_themes = reduced.get(category, {}).get(level, [])

            if not cat_themes:
                r[f"theme2_{level}"] = ""
                r[f"theme2_{level}_confidence"] = 0
                continue

            themes_str = "\n".join(t["label"] for t in cat_themes)
            items.append({
                "text": f"List: {themes_str}\nInput: {r['summary_33'][:2500]}",
                "instruction": _ASSIGN_INSTRUCTION,
            })

        if not items:
            continue

        # Batch all assignments at this level
        results = await summarizer.batch_summarize(items)

        # Parse results back onto responses
        result_idx = 0
        for r in responses:
            category = r.get("theme01", "Neutral Comments")
            cat_themes = reduced.get(category, {}).get(level, [])

            if not cat_themes:
                continue

            result_text = results[result_idx]
            result_idx += 1

            match = _CLASSIFY_PATTERN.match(result_text)
            if match:
                theme_name = match.group(1).strip()
                confidence = int(match.group(2))
            else:
                # Fallback: pick first theme if parse fails
                theme_name = cat_themes[0]["label"] if cat_themes else ""
                confidence = 70

            r[f"theme2_{level}"] = theme_name
            r[f"theme2_{level}_confidence"] = confidence

    return responses


async def _assign_themes_embedding(
    embedder: EmbeddingProvider,
    responses: list[dict],
    reduced: dict[str, dict[str, list[dict]]],
) -> list[dict]:
    """Assign themes to each response via cosine similarity (fast, no LLM calls).

    Alternative to LLM assignment — uses embedding similarity for speed.
    Better for large datasets (>500 responses) where LLM calls would be slow.
    """
    # Build theme label -> embedding lookup for each level
    all_theme_labels: list[str] = []
    label_to_info: dict[str, dict] = {}

    for category, levels in reduced.items():
        for level, themes in levels.items():
            for t in themes:
                key = f"{category}|{level}|{t['label']}"
                all_theme_labels.append(t["label"])
                label_to_info[key] = {
                    "category": category,
                    "level": level,
                    "label": t["label"],
                    "confidence": t["confidence"],
                }

    if not all_theme_labels:
        return responses

    # Embed all theme labels + all response summaries
    summary_texts = [r.get("summary_33", "") for r in responses]
    all_texts = all_theme_labels + summary_texts
    all_embeddings = await embedder.embed(all_texts)

    theme_embeddings = np.array(all_embeddings[: len(all_theme_labels)])
    response_embeddings = np.array(all_embeddings[len(all_theme_labels):])

    # For each response, find best match at each level for its Theme01 category
    for i, r in enumerate(responses):
        category = r.get("theme01", "Neutral Comments")
        cat_levels = reduced.get(category, {})

        for level in ("9", "6", "3"):
            themes = cat_levels.get(level, [])
            if not themes:
                r[f"theme2_{level}"] = ""
                r[f"theme2_{level}_confidence"] = 0
                continue

            best_label = ""
            best_confidence = 0.0
            best_sim = -1.0

            for j, (tl, info) in enumerate(label_to_info.items()):
                if info["category"] == category and info["level"] == level:
                    t_emb = theme_embeddings[j]
                    r_emb = response_embeddings[i]
                    dot = float(np.dot(t_emb, r_emb))
                    norm = float(np.linalg.norm(t_emb) * np.linalg.norm(r_emb))
                    sim = dot / norm if norm > 0 else 0.0
                    if sim > best_sim:
                        best_sim = sim
                        best_label = info["label"]
                        best_confidence = info["confidence"]

            r[f"theme2_{level}"] = best_label
            r[f"theme2_{level}_confidence"] = round(best_confidence * 100)

    return responses


# ---------------------------------------------------------------------------
# Step 8: Store results
# ---------------------------------------------------------------------------

async def _store_results(
    db: AsyncSession,
    session: Session,
    responses: list[dict],
    bin_samples: dict[str, list[list[dict]]],
    reduced: dict[str, dict[str, list[dict]]],
) -> str:
    """Write Theme + ThemeSample records to Postgres, update ResponseSummary.
    Returns replay_hash."""
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    provider_name = session.ai_provider or "openai"

    # Store themes at each reduction level
    for category, levels in reduced.items():
        # Create parent Theme01 record
        parent = Theme(
            session_id=session.id,
            cycle_id=session.current_cycle,
            label=category,
            summary=f"Primary classification: {category}",
            confidence=1.0,
            response_count=sum(
                1 for r in responses if r.get("theme01") == category
            ),
            ai_provider=provider_name,
            ai_model="pipeline",
        )
        db.add(parent)
        await db.flush()

        for level, themes in levels.items():
            for t in themes:
                child = Theme(
                    session_id=session.id,
                    cycle_id=session.current_cycle,
                    label=t["label"],
                    summary=t.get("description", ""),
                    confidence=t["confidence"],
                    response_count=sum(
                        1
                        for r in responses
                        if r.get(f"theme2_{level}") == t["label"]
                        and r.get("theme01") == category
                    ),
                    parent_theme_id=parent.id,
                    ai_provider=provider_name,
                    ai_model="pipeline",
                    cluster_metadata={"level": level},
                )
                db.add(child)

    # Store ThemeSample records (marble groups)
    for category, groups in bin_samples.items():
        for idx, group in enumerate(groups):
            response_ids = [r["id"] for r in group]
            ts = ThemeSample(
                session_id=session.id,
                theme01_label=category,
                sample_index=idx,
                response_ids=response_ids,
            )
            db.add(ts)

    # Update ResponseSummary with theme assignments for each response
    for r in responses:
        stmt = pg_insert(ResponseSummary).values(
            response_meta_id=uuid.UUID(r["id"]),
            session_id=session.id,
            provider=provider_name,
            theme01=r.get("theme01", ""),
            theme01_confidence=r.get("theme01_confidence", 0),
            theme2_9=r.get("theme2_9", ""),
            theme2_9_confidence=r.get("theme2_9_confidence", 0),
            theme2_6=r.get("theme2_6", ""),
            theme2_6_confidence=r.get("theme2_6_confidence", 0),
            theme2_3=r.get("theme2_3", ""),
            theme2_3_confidence=r.get("theme2_3_confidence", 0),
        ).on_conflict_do_update(
            index_elements=["response_meta_id"],
            set_={
                "theme01": r.get("theme01", ""),
                "theme01_confidence": r.get("theme01_confidence", 0),
                "theme2_9": r.get("theme2_9", ""),
                "theme2_9_confidence": r.get("theme2_9_confidence", 0),
                "theme2_6": r.get("theme2_6", ""),
                "theme2_6_confidence": r.get("theme2_6_confidence", 0),
                "theme2_3": r.get("theme2_3", ""),
                "theme2_3_confidence": r.get("theme2_3_confidence", 0),
            },
        )
        await db.execute(stmt)

    # Compute replay hash
    hash_input = {
        "session_id": str(session.id),
        "seed": session.seed,
        "response_count": len(responses),
        "ai_provider": provider_name,
        "sample_size": settings.sample_size,
        "themes": {
            cat: {level: [t["label"] for t in themes] for level, themes in levels.items()}
            for cat, levels in reduced.items()
        },
    }
    replay_hash = hashlib.sha256(
        json.dumps(hash_input, sort_keys=True).encode()
    ).hexdigest()

    session.replay_hash = replay_hash
    await db.commit()

    return replay_hash


# ═══════════════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════════════


async def run_pipeline(
    db: AsyncSession,
    session_id: uuid.UUID,
    seed: str | None = None,
    *,
    use_embedding_assignment: bool = False,
) -> dict:
    """Execute the full parallel theming pipeline for a session.

    Called after moderator closes polling. Summaries already exist
    from Phase A (live per-response summarization during polling).

    Args:
        use_embedding_assignment: If True, use cosine similarity for theme
            assignment (faster). If False, use LLM matching (monolith approach).
    """
    import time
    start_time = time.monotonic()

    # Load session
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise ValueError(f"Session {session_id} not found")

    # Task B5: Track pipeline stage for recovery + status endpoint
    session.pipeline_stage = "starting"

    effective_seed = seed or session.seed or str(session_id)
    seed_int = int(hashlib.md5(effective_seed.encode()).hexdigest()[:8], 16)

    provider_name = session.ai_provider or "openai"
    summarizer = get_summarization_provider(provider_name)

    logger.info("cube6.pipeline.start", session_id=str(session_id))

    # Step 1: Fetch pre-computed 33-word summaries
    logger.info("Step 1: Fetching pre-computed summaries")
    responses = await _fetch_summaries(db, session_id)
    if not responses:
        return {
            "session_id": str(session_id),
            "status": "completed",
            "total_responses": 0,
            "message": "No responses to process",
            "duration_sec": round(time.monotonic() - start_time, 2),
        }

    # Task B5: Wrap pipeline in try/except for failure recovery.
    # On failure: store partial results, set pipeline_stage to error stage.
    # Moderator can re-trigger POST /ai/run which is idempotent.
    try:
        # Step 2: Classify Theme01 (batch parallel)
        session.pipeline_stage = "classifying"
        logger.info("Step 2: Classifying Theme01 for %d responses", len(responses))
        responses = await _classify_theme01(summarizer, responses)

        # Step 3: Group by Theme01
        session.pipeline_stage = "grouping"
        logger.info("Step 3: Grouping by Theme01")
        bins = _group_by_theme01(responses)
        bin_counts = {k: len(v) for k, v in bins.items()}

        # Step 4: Marble sampling (shuffle + slice)
        session.pipeline_stage = "sampling"
        logger.info("Step 4: Marble sampling (seed=%d)", seed_int)
        bin_samples = await _parallel_marble_sample(bins, seed_int)
        group_counts = {k: len(v) for k, v in bin_samples.items()}

        # Step 5: Generate 3 themes per marble group (10+ concurrent agents)
        session.pipeline_stage = "generating"
        logger.info("Step 5: Generating themes (%s groups total)",
                    sum(group_counts.values()))
        all_themes = await _parallel_generate_themes(summarizer, bin_samples)
        theme_counts = {k: len(v) for k, v in all_themes.items()}

        # Step 6: Reduce all -> 9 -> 6 -> 3 (concurrent per category)
        session.pipeline_stage = "reducing"
        logger.info("Step 6: Reducing themes (all->9->6->3)")
        reduced = await _reduce_themes(summarizer, all_themes)

        # Step 7: Assign themes to all responses
        session.pipeline_stage = "assigning"
        logger.info("Step 7: Assigning themes to all responses")
        if use_embedding_assignment:
            embedder = get_embedding_provider(provider_name)
            responses = await _assign_themes_embedding(embedder, responses, reduced)
        else:
            responses = await _assign_themes_llm(summarizer, responses, reduced)

        # Step 8: Store results
        session.pipeline_stage = "storing"
        logger.info("Step 8: Storing results")
        replay_hash = await _store_results(
            db, session, responses, bin_samples, reduced
        )

        session.pipeline_stage = "completed"

    except Exception as exc:
        # Task B5: On failure, mark session with error stage for status endpoint
        failed_stage = getattr(session, "pipeline_stage", "unknown")
        session.pipeline_stage = f"error:{failed_stage}"
        try:
            await db.commit()
        except Exception:
            pass
        logger.error(
            "cube6.pipeline.failed",
            session_id=str(session_id),
            stage=failed_stage,
            error=str(exc),
        )
        return {
            "session_id": str(session_id),
            "status": "error",
            "stage": failed_stage,
            "error": str(exc),
            "duration_sec": round(time.monotonic() - start_time, 2),
        }

    duration = round(time.monotonic() - start_time, 2)
    logger.info(
        "cube6.pipeline.completed",
        session_id=str(session_id),
        total_responses=len(responses),
        duration_sec=duration,
    )

    # --- Task B4: Broadcast themes_ready after full pipeline success ---
    # Gate: only fires on full success (not partial). Dashboard transitions
    # to results view on receipt.
    try:
        from app.core.supabase_broadcast import broadcast_event

        theme_count = sum(
            len(levels.get("3", []))
            for levels in reduced.values()
        )
        await broadcast_event(
            channel=f"session:{session.short_code}",
            event="themes_ready",
            payload={
                "session_id": str(session_id),
                "theme_count": theme_count,
                "total_responses": len(responses),
                "replay_hash": replay_hash,
                "duration_sec": duration,
            },
        )
        logger.info(
            "cube6.themes_ready.broadcast",
            session_id=str(session_id),
            theme_count=theme_count,
        )
    except Exception as exc:
        # Non-fatal — results are stored even if broadcast fails
        logger.warning(
            "cube6.themes_ready.broadcast_failed",
            session_id=str(session_id),
            error=str(exc),
        )

    return {
        "session_id": str(session_id),
        "status": "completed",
        "total_responses": len(responses),
        "bins": bin_counts,
        "marble_groups": group_counts,
        "candidate_themes": theme_counts,
        "themes_9": {
            cat: [t["label"] for t in levels.get("9", [])]
            for cat, levels in reduced.items()
        },
        "themes_6": {
            cat: [t["label"] for t in levels.get("6", [])]
            for cat, levels in reduced.items()
        },
        "themes_3": {
            cat: [t["label"] for t in levels.get("3", [])]
            for cat, levels in reduced.items()
        },
        "replay_hash": replay_hash,
        "duration_sec": duration,
    }


async def get_pipeline_status(
    db: AsyncSession, session_id: uuid.UUID
) -> dict:
    """Task B5: Return current pipeline stage + error info for status endpoint."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise ValueError(f"Session {session_id} not found")

    stage = getattr(session, "pipeline_stage", None) or "not_started"
    is_error = stage.startswith("error:")

    # Count stored themes to show progress
    theme_result = await db.execute(
        select(func.count(Theme.id)).where(Theme.session_id == session_id)
    )
    theme_count = theme_result.scalar() or 0

    return {
        "session_id": str(session_id),
        "stage": stage.replace("error:", "") if is_error else stage,
        "status": "error" if is_error else ("completed" if stage == "completed" else "running"),
        "theme_count": theme_count,
        "replay_hash": session.replay_hash,
    }


async def get_session_themes(
    db: AsyncSession, session_id: uuid.UUID
) -> list[Theme]:
    """Return all Theme records for a session."""
    result = await db.execute(
        select(Theme)
        .where(Theme.session_id == session_id)
        .order_by(Theme.created_at)
    )
    return list(result.scalars().all())
