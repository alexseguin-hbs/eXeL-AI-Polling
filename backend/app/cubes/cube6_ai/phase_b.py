"""Cube 6 Phase B — Parallel Theme Pipeline (after moderator closes polling).

Challenger I/O Specification (checkout boundary):
  IN:  db (AsyncSession), session_id (UUID), summarizer (SummarizationProvider)
  OUT: responses (list[dict] with theme01/theme2_9/6/3), replay_hash (str)

Pipeline Steps (each is a standalone function with defined I/O):
  Step 1: _fetch_summaries(db, session_id) → list[dict]           (CRS-11.01)
  Step 2: _classify_theme01(summarizer, responses) → list[dict]   (CRS-11.02)
  Step 3: _group_by_theme01(responses) → dict[str, list]          (CRS-11.03)
  Step 4: _marble_sample(items, seed) → list[list[dict]]          (CRS-11.04)
  Step 5: _generate_themes_for_group(summarizer, group) → list    (CRS-12.01)
  Step 6: _reduce_themes(summarizer, themes) → dict hierarchy     (CRS-12.02)
  Step 7: _assign_themes_llm/embedding(responses, reduced) → list (CRS-13.01)
  Step 8: _store_results(db, session, responses, ...) → hash      (CRS-13.02)

Split from service.py for Succinctness (O7 gap fix, 2026-04-13).
G22: I/O boundaries documented for Challenger checkout (2026-04-14).
"""
import asyncio
import hashlib
import html
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


# ---------------------------------------------------------------------------
# Step 1: Fetch all 33-word summaries
# ---------------------------------------------------------------------------

async def _fetch_summaries(
    db: AsyncSession, session_id: uuid.UUID
) -> list[dict]:
    """Fetch all response metadata + pre-computed 33-word summaries.

    Summaries were generated live during polling (Phase A).
    C6-1: Only fetches responses where PII has been scrubbed (via TextResponse join).
    Batch-loads summaries to avoid N+1 query pattern.
    """
    from app.models.text_response import TextResponse

    # Fetch response metas — C6-1: exclude responses with unresolved PII
    result = await db.execute(
        select(ResponseMeta)
        .outerjoin(TextResponse, TextResponse.response_meta_id == ResponseMeta.id)
        .where(
            ResponseMeta.session_id == session_id,
            # C6-1: PII gate — exclude responses where PII was detected but NOT scrubbed
            ~(
                (TextResponse.pii_detected.is_(True))
                & (TextResponse.pii_scrubbed_text.is_(None))
            ),
        )
    )
    metas = list(result.scalars().all())

    if not metas:
        return []

    # Batch-load summaries (1 query instead of N)
    meta_ids = [m.id for m in metas]
    summary_result = await db.execute(
        select(ResponseSummary).where(
            ResponseSummary.response_meta_id.in_(meta_ids),
        )
    )
    summary_map = {s.response_meta_id: s for s in summary_result.scalars().all()}

    responses = []
    for meta in metas:
        summary_row = summary_map.get(meta.id)

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
    "If the input is not in English, translate it to English first. "
    "Then reply with the exact format: 'THEME (Confidence: XX%)' where THEME is "
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

    # Parse theme names from response — sanitize to prevent XSS
    themes = []
    for line in result_text.strip().split("\n"):
        parts = line.split(",")
        if len(parts) >= 2:
            theme_name = html.escape(parts[1].strip())
            if theme_name:
                themes.append(theme_name)

    return themes


_PHASE_B_MAX_CONCURRENT = 50  # Global cap on concurrent theme generation API calls


async def _parallel_generate_themes(
    summarizer: SummarizationProvider,
    bin_samples: dict[str, list[list[dict]]],
) -> dict[str, list[str]]:
    """Generate 3 themes per marble group across all partitions.

    Groups processed with capped concurrency (max 50 concurrent API calls)
    to prevent provider rate-limit exhaustion at scale (500+ groups).
    """
    all_themes: dict[str, list[str]] = {cat: [] for cat in THEME01_CATEGORIES}
    semaphore = asyncio.Semaphore(_PHASE_B_MAX_CONCURRENT)

    async def _capped_generate(group: list[dict], type_str: str) -> list[str]:
        async with semaphore:
            return await _generate_themes_for_group(summarizer, group, type_str)

    # Build list of all concurrent tasks
    tasks: list[tuple[str, asyncio.Task]] = []

    for label, groups in bin_samples.items():
        if not groups:
            continue
        type_str = _TYPE_MAP.get(label, "NEUTRAL")

        for group in groups:
            task = asyncio.create_task(
                _capped_generate(group, type_str)
            )
            tasks.append((label, task))

    # Execute with concurrency cap (50 concurrent max)
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
                "label": html.escape(match.group(1).strip()),
                "description": html.escape(match.group(2).strip()),
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
        try:
            themes_str = "\n".join(themes)
            text_9 = await summarizer.summarize(
                [f"Reduce these themes to 9:\n{themes_str}"],
                instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=9),
            )
            parsed_9 = _parse_reduced_themes(text_9)
        except Exception as e:
            logger.warning("cube6.reduce.9_failed", label=label, error=str(e))
            parsed_9 = [{"label": t, "description": "", "confidence": 0.7} for t in themes[:9]]

        # 9 -> 6
        try:
            themes_9_str = "\n".join(t["label"] for t in parsed_9)
            text_6 = await summarizer.summarize(
                [f"Reduce these themes to 6:\n{themes_9_str}"],
                instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=6),
            )
            parsed_6 = _parse_reduced_themes(text_6)
        except Exception as e:
            logger.warning("cube6.reduce.6_failed", label=label, error=str(e))
            parsed_6 = parsed_9[:6]

        # 6 -> 3
        try:
            themes_6_str = "\n".join(t["label"] for t in parsed_6)
            text_3 = await summarizer.summarize(
                [f"Reduce these themes to 3:\n{themes_6_str}"],
                instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=3),
            )
            parsed_3 = _parse_reduced_themes(text_3)
        except Exception as e:
            logger.warning("cube6.reduce.3_failed", label=label, error=str(e))
            parsed_3 = parsed_6[:3]

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

        # C6-5/C6-6 fix: Build list of responses that were actually queued,
        # then zip with results to avoid index tracking mismatch
        queued_responses = [
            r for r in responses
            if reduced.get(r.get("theme01", "Neutral Comments"), {}).get(level, [])
        ]
        if len(results) != len(queued_responses):
            logger.warning(
                "cube6.assign.count_mismatch",
                level=level,
                expected=len(queued_responses),
                got=len(results),
            )

        for r, result_text in zip(queued_responses, results):
            category = r.get("theme01", "Neutral Comments")
            cat_themes = reduced.get(category, {}).get(level, [])

            match = _CLASSIFY_PATTERN.match(result_text)
            if match:
                theme_name = match.group(1).strip()
                confidence = int(match.group(2))
            else:
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

    # Embed theme labels + response summaries in batches (O9: 1M-scale support)
    # Batch size 1000 keeps API calls manageable while allowing parallel processing.
    _EMBED_BATCH_SIZE = 1000

    summary_texts = [r.get("summary_33", "") for r in responses]
    all_texts = all_theme_labels + summary_texts

    if len(all_texts) <= _EMBED_BATCH_SIZE:
        # Small dataset — single API call
        all_embeddings = await embedder.embed(all_texts)
    else:
        # Large dataset — batch into chunks of _EMBED_BATCH_SIZE
        all_embeddings = []
        for batch_start in range(0, len(all_texts), _EMBED_BATCH_SIZE):
            batch = all_texts[batch_start : batch_start + _EMBED_BATCH_SIZE]
            batch_embeddings = await embedder.embed(batch)
            all_embeddings.extend(batch_embeddings)

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

    # C6-4: Update ResponseSummary with theme assignments — error handling + rollback
    try:
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

    except Exception as e:
        await db.rollback()
        logger.error("cube6.store_results.failed", error=str(e), session_id=str(session.id))
        raise

    return replay_hash

