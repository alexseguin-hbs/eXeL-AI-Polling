"""Cube 6 — AI Theme Pipeline: Full 9-step orchestrator.

Pipeline mirrors the monolith (eXeL-AI_Polling_v04.2.py) but replaces
row-by-row API calls with batched operations and parallel sampling.

Steps:
  1. Fetch responses from Postgres + MongoDB
  2. Batch summarize (333 → 111 → 33 words)
  3. Primary classify (Theme01: Risk / Supporting / Neutral)
  4. Group by Theme01 into bins
  5. Parallel marble sampling (draw groups of 10, repeat 100x per bin)
  6. Secondary theme generation (3 themes per sample)
  7. Theme reduction (all → 9 → 6 → 3)
  8. Assign themes to all responses via embedding similarity
  9. Store results in Postgres + compute replay hash
"""

import asyncio
import hashlib
import json
import logging
import re
import uuid
from datetime import datetime, timezone

import numpy as np
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.cubes.cube6_ai.providers.base import EmbeddingProvider, SummarizationProvider
from app.cubes.cube6_ai.providers.factory import (
    get_embedding_provider,
    get_summarization_provider,
)
from app.models.response_meta import ResponseMeta
from app.models.session import Session
from app.models.theme import Theme
from app.models.theme_sample import ThemeSample

logger = logging.getLogger(__name__)

# Theme01 categories (matches monolith)
THEME01_CATEGORIES = ["Risk & Concerns", "Supporting Comments", "Neutral Comments"]
_CONFIDENCE_THRESHOLD = 65  # <65% → reclassify as Neutral (monolith line 127)


# ---------------------------------------------------------------------------
# Step 1: Fetch responses
# ---------------------------------------------------------------------------

async def _fetch_responses(
    db: AsyncSession, mongo_db: AsyncIOMotorDatabase, session_id: uuid.UUID
) -> list[dict]:
    """Query ResponseMeta from Postgres, raw text from MongoDB via mongo_ref."""
    result = await db.execute(
        select(ResponseMeta).where(ResponseMeta.session_id == session_id)
    )
    metas = list(result.scalars().all())

    responses = []
    for meta in metas:
        doc = await mongo_db.responses.find_one({"_id": meta.mongo_ref})
        raw_text = doc.get("text", "") if doc else ""
        language = doc.get("language", "English") if doc else "English"
        responses.append({
            "id": str(meta.id),
            "participant_id": str(meta.participant_id),
            "question_id": str(meta.question_id),
            "raw_text": raw_text,
            "language": language,
        })

    return responses


# ---------------------------------------------------------------------------
# Step 2: Batch summarize (333 → 111 → 33)
# ---------------------------------------------------------------------------

_SUMMARIZE_INSTRUCTION = (
    "You are a summarizer. {translate}"
    "Condense the text to approximately {target} words, preserving key points "
    "and meaning. Ensure the final summary is in English."
)


async def _batch_summarize(
    summarizer: SummarizationProvider, responses: list[dict]
) -> list[dict]:
    """Generate 333 → 111 → 33 word summaries for all responses (batched)."""

    def _count_words(text: str) -> int:
        return len(text.split())

    # 333-word summaries
    items_333 = []
    for r in responses:
        translate = (
            "If the text is not in English, translate it to English first. "
            if r.get("language", "English") != "English"
            else ""
        )
        word_count = _count_words(r["raw_text"])
        if word_count > 333:
            items_333.append({
                "text": r["raw_text"][:4000],
                "instruction": _SUMMARIZE_INSTRUCTION.format(
                    translate=translate, target=333
                ),
            })
        else:
            items_333.append({"text": r["raw_text"], "instruction": ""})

    results_333 = await summarizer.batch_summarize(items_333)

    # For items that were short enough, use the raw text as the 333 summary
    for i, r in enumerate(responses):
        if not items_333[i]["instruction"]:
            results_333[i] = r["raw_text"]

    # 111-word summaries (from 333)
    items_111 = [
        {
            "text": s333,
            "instruction": _SUMMARIZE_INSTRUCTION.format(translate="", target=111),
        }
        for s333 in results_333
    ]
    results_111 = await summarizer.batch_summarize(items_111)

    # 33-word summaries (from 111)
    items_33 = [
        {
            "text": s111,
            "instruction": _SUMMARIZE_INSTRUCTION.format(translate="", target=33),
        }
        for s111 in results_111
    ]
    results_33 = await summarizer.batch_summarize(items_33)

    # Attach summaries to response dicts
    for i, r in enumerate(responses):
        r["summary_333"] = results_333[i]
        r["summary_111"] = results_111[i]
        r["summary_33"] = results_33[i]

    return responses


# ---------------------------------------------------------------------------
# Step 3: Primary classify (Theme01)
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
    """Classify 33-word summaries into Theme01 categories."""
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

        # Apply <65% confidence → Neutral rule (monolith line 127)
        if theme01 in ("Risk & Concerns", "Supporting Comments") and confidence < _CONFIDENCE_THRESHOLD:
            theme01 = "Neutral Comments"

        r["theme01"] = theme01
        r["theme01_confidence"] = confidence

    return responses


# ---------------------------------------------------------------------------
# Step 4: Group by Theme01
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
# Step 5: Parallel marble sampling
# ---------------------------------------------------------------------------

async def _parallel_sample(
    bins: dict[str, list[dict]], seed: int
) -> dict[str, list[list[dict]]]:
    """Draw marble samples from each bin in parallel.

    Analogy: Pull 10 marbles from bowl, generate 3 themes, put marbles back.
    Repeat sample_count times per bin. ThreadPoolExecutor runs bins in parallel.

    Uses np.random.RandomState(seed) per bin for full determinism.
    """
    sample_count = settings.sample_count
    sample_size = settings.sample_size

    def _draw_samples(items: list[dict], bin_seed: int) -> list[list[dict]]:
        if not items:
            return []
        rng = np.random.RandomState(bin_seed)
        samples = []
        n = len(items)
        for _ in range(sample_count):
            indices = rng.choice(n, size=min(sample_size, n), replace=n < sample_size)
            samples.append([items[idx] for idx in indices])
        return samples

    tasks = []
    bin_labels = sorted(bins.keys())  # Deterministic order
    for i, label in enumerate(bin_labels):
        bin_seed = seed + i
        tasks.append(
            asyncio.to_thread(_draw_samples, bins[label], bin_seed)
        )

    results = await asyncio.gather(*tasks)
    return {label: samples for label, samples in zip(bin_labels, results)}


# ---------------------------------------------------------------------------
# Step 6: Secondary theme generation (3 per sample)
# ---------------------------------------------------------------------------

_SECONDARY_THEME_INSTRUCTION = (
    "You are an AI assistant expert at theming {type_str}-based polling questions. "
    "Generate 3 unique SUMMARY THEMES for the given {type_str} data. "
    "Each theme in 5 words, description 7-12 words without commas/punctuation. "
    "Themes distinct. Reply in format: T001, Theme Name, Description (one per line)."
)


async def _generate_secondary_themes(
    summarizer: SummarizationProvider,
    bin_samples: dict[str, list[list[dict]]],
) -> dict[str, list[str]]:
    """For each sample of 10 items, generate 3 secondary themes (batched)."""
    all_themes: dict[str, list[str]] = {cat: [] for cat in THEME01_CATEGORIES}

    for label, samples in bin_samples.items():
        if not samples:
            continue

        type_str = {
            "Risk & Concerns": "RISK",
            "Supporting Comments": "SUPPORT",
            "Neutral Comments": "NEUTRAL",
        }.get(label, "NEUTRAL")

        items = []
        for sample in samples:
            combined = "\n".join(r.get("summary_33", "") for r in sample)
            items.append({
                "text": combined[:2500],
                "instruction": _SECONDARY_THEME_INSTRUCTION.format(type_str=type_str),
            })

        results = await summarizer.batch_summarize(items)

        for result_text in results:
            # Parse theme names from response lines
            for line in result_text.strip().split("\n"):
                parts = line.split(",")
                if len(parts) >= 2:
                    theme_name = parts[1].strip()
                    if theme_name:
                        all_themes[label].append(theme_name)

    return all_themes


# ---------------------------------------------------------------------------
# Step 7: Theme reduction (all → 9 → 6 → 3)
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
    """Reduce themes: all → 9 → 6 → 3 per Theme01 category."""
    reduced: dict[str, dict[str, list[dict]]] = {}

    for label, themes in all_themes.items():
        if not themes:
            reduced[label] = {"9": [], "6": [], "3": []}
            continue

        type_str = {
            "Risk & Concerns": "RISK",
            "Supporting Comments": "SUPPORT",
            "Neutral Comments": "NEUTRAL",
        }.get(label, "NEUTRAL")

        # All → 9
        themes_str = "\n".join(themes)
        text_9 = await summarizer.summarize(
            [f"Reduce these themes to 9:\n{themes_str}"],
            instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=9),
        )
        parsed_9 = _parse_reduced_themes(text_9)

        # 9 → 6
        themes_9_str = "\n".join(t["label"] for t in parsed_9)
        text_6 = await summarizer.summarize(
            [f"Reduce these themes to 6:\n{themes_9_str}"],
            instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=6),
        )
        parsed_6 = _parse_reduced_themes(text_6)

        # 6 → 3
        themes_6_str = "\n".join(t["label"] for t in parsed_6)
        text_3 = await summarizer.summarize(
            [f"Reduce these themes to 3:\n{themes_6_str}"],
            instruction=_REDUCE_INSTRUCTION.format(type_str=type_str, count=3),
        )
        parsed_3 = _parse_reduced_themes(text_3)

        reduced[label] = {"9": parsed_9, "6": parsed_6, "3": parsed_3}

    return reduced


# ---------------------------------------------------------------------------
# Step 8: Assign themes to all responses
# ---------------------------------------------------------------------------

async def _assign_themes(
    embedder: EmbeddingProvider,
    responses: list[dict],
    reduced: dict[str, dict[str, list[dict]]],
) -> list[dict]:
    """Assign reduced themes to each response via cosine similarity."""

    # Build theme label → embedding lookup for each level
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
    response_embeddings = np.array(all_embeddings[len(all_theme_labels) :])

    # For each response, find best match at each level for its Theme01 category
    for i, r in enumerate(responses):
        category = r.get("theme01", "Neutral Comments")
        cat_levels = reduced.get(category, {})

        for level in ("9", "6", "3"):
            themes = cat_levels.get(level, [])
            if not themes:
                r[f"theme2_{level}"] = ""
                r[f"theme2_{level}_confidence"] = 0.0
                continue

            # Get indices of theme embeddings for this category+level
            best_label = ""
            best_confidence = 0.0
            best_sim = -1.0

            for j, (tl, info) in enumerate(label_to_info.items()):
                if info["category"] == category and info["level"] == level:
                    # Cosine similarity
                    t_emb = theme_embeddings[j]
                    r_emb = response_embeddings[i]
                    dot = np.dot(t_emb, r_emb)
                    norm = np.linalg.norm(t_emb) * np.linalg.norm(r_emb)
                    sim = dot / norm if norm > 0 else 0.0
                    if sim > best_sim:
                        best_sim = sim
                        best_label = info["label"]
                        best_confidence = info["confidence"]

            r[f"theme2_{level}"] = best_label
            r[f"theme2_{level}_confidence"] = best_confidence

    return responses


# ---------------------------------------------------------------------------
# Step 9: Store results
# ---------------------------------------------------------------------------

async def _store_results(
    db: AsyncSession,
    session: Session,
    responses: list[dict],
    bin_samples: dict[str, list[list[dict]]],
    reduced: dict[str, dict[str, list[dict]]],
    mongo_db: AsyncIOMotorDatabase,
) -> str:
    """Write Theme + ThemeSample records to Postgres, summaries to MongoDB.
    Returns replay_hash."""

    # Store themes at each reduction level
    theme_records: dict[str, dict[str, uuid.UUID]] = {}  # "category|level|label" → theme.id

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
            ai_provider=session.ai_provider,
            ai_model="gpt-4o-mini",
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
                    ai_provider=session.ai_provider,
                    ai_model="gpt-4o-mini",
                    cluster_metadata={"level": level},
                )
                db.add(child)
                await db.flush()
                theme_records[f"{category}|{level}|{t['label']}"] = child.id

    # Store ThemeSample records
    for category, samples in bin_samples.items():
        for idx, sample_group in enumerate(samples):
            response_ids = [r["id"] for r in sample_group]
            ts = ThemeSample(
                session_id=session.id,
                theme01_label=category,
                sample_index=idx,
                response_ids=response_ids,
            )
            db.add(ts)

    # Store summaries in MongoDB
    for r in responses:
        await mongo_db.summaries.update_one(
            {"response_id": r["id"], "session_id": str(session.id)},
            {
                "$set": {
                    "summary_333": r.get("summary_333", ""),
                    "summary_111": r.get("summary_111", ""),
                    "summary_33": r.get("summary_33", ""),
                    "theme01": r.get("theme01", ""),
                    "theme01_confidence": r.get("theme01_confidence", 0),
                    "theme2_9": r.get("theme2_9", ""),
                    "theme2_9_confidence": r.get("theme2_9_confidence", 0),
                    "theme2_6": r.get("theme2_6", ""),
                    "theme2_6_confidence": r.get("theme2_6_confidence", 0),
                    "theme2_3": r.get("theme2_3", ""),
                    "theme2_3_confidence": r.get("theme2_3_confidence", 0),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
            upsert=True,
        )

    # Compute replay hash
    hash_input = {
        "session_id": str(session.id),
        "seed": session.seed,
        "response_count": len(responses),
        "ai_provider": session.ai_provider,
        "sample_count": settings.sample_count,
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


# ---------------------------------------------------------------------------
# Public API: run_pipeline / get_session_themes
# ---------------------------------------------------------------------------

async def run_pipeline(
    db: AsyncSession,
    mongo_db: AsyncIOMotorDatabase,
    session_id: uuid.UUID,
    seed: str | None = None,
) -> dict:
    """Execute the full 9-step AI theme pipeline for a session."""
    # Load session
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise ValueError(f"Session {session_id} not found")

    effective_seed = seed or session.seed or str(session_id)
    # Convert seed string to integer for numpy
    seed_int = int(hashlib.md5(effective_seed.encode()).hexdigest()[:8], 16)

    provider_name = session.ai_provider or "openai"
    embedder = get_embedding_provider(provider_name)
    summarizer = get_summarization_provider(provider_name)

    logger.info("Step 1: Fetching responses for session %s", session_id)
    responses = await _fetch_responses(db, mongo_db, session_id)
    if not responses:
        return {
            "session_id": str(session_id),
            "status": "completed",
            "total_responses": 0,
            "message": "No responses to process",
        }

    logger.info("Step 2: Batch summarizing %d responses", len(responses))
    responses = await _batch_summarize(summarizer, responses)

    logger.info("Step 3: Classifying Theme01")
    responses = await _classify_theme01(summarizer, responses)

    logger.info("Step 4: Grouping by Theme01")
    bins = _group_by_theme01(responses)
    bin_counts = {k: len(v) for k, v in bins.items()}

    logger.info("Step 5: Parallel marble sampling (seed=%d)", seed_int)
    bin_samples = await _parallel_sample(bins, seed_int)

    logger.info("Step 6: Generating secondary themes")
    all_secondary_themes = await _generate_secondary_themes(summarizer, bin_samples)

    logger.info("Step 7: Reducing themes (9 → 6 → 3)")
    reduced = await _reduce_themes(summarizer, all_secondary_themes)

    logger.info("Step 8: Assigning themes to all responses")
    responses = await _assign_themes(embedder, responses, reduced)

    logger.info("Step 9: Storing results")
    replay_hash = await _store_results(
        db, session, responses, bin_samples, reduced, mongo_db
    )

    return {
        "session_id": str(session_id),
        "status": "completed",
        "total_responses": len(responses),
        "bins": bin_counts,
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
