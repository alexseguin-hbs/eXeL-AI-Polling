"""Cube 6 — CQS Scoring Engine: Content Quality Score (post-ranking).

Scores responses in the #1 most-voted Theme2 cluster for CQS reward.
6 metrics: Insight, Depth, Future Impact, Originality, Actionability, Relevance.
Weighted composite determines winner with deterministic tie-breaking.

Called by Cube 5 after Cube 7 ranking identifies top Theme2 cluster.
"""

import hashlib
import html
import json
import logging
import uuid

import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.cubes.cube6_ai.providers.factory import get_summarization_provider
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.session import Session

logger = logging.getLogger(__name__)

_CQS_INSTRUCTION = (
    "You are an expert evaluator of polling response quality. "
    "Score the following response on these 6 metrics (0-100 each):\n"
    "1. Insight — depth of understanding demonstrated\n"
    "2. Depth — thoroughness and comprehensiveness\n"
    "3. Future Impact — forward-looking value and long-term implications\n"
    "4. Originality — novelty and uniqueness of perspective\n"
    "5. Actionability — practical applicability and implementation clarity\n"
    "6. Relevance — alignment with the question context\n\n"
    "Reply with ONLY valid JSON:\n"
    '{{"insight": 85, "depth": 70, "future_impact": 90, "originality": 75, "actionability": 80, "relevance": 95}}\n'
    "All values must be integers 0-100."
)

_CQS_METRICS = ("insight", "depth", "future_impact", "originality", "actionability", "relevance")


async def score_cqs(
    db: AsyncSession,
    session_id: uuid.UUID,
    top_theme2_label: str,
    theme_level: str = "3",
) -> list[dict]:
    """Score responses in the #1 most-voted Theme2 cluster for CQS reward.

    Filters to responses assigned to top_theme2_label at the given level
    with >95% confidence. Calls AI provider for 6-metric scoring.
    Stores results in cqs_scores table.

    Returns list of scored response dicts.
    """
    from app.models.cqs_score import CQSScore, DEFAULT_CQS_WEIGHTS

    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise ValueError(f"Session {session_id} not found")

    provider_name = session.ai_provider or "openai"
    summarizer = get_summarization_provider(provider_name)
    weights = session.cqs_weights or DEFAULT_CQS_WEIGHTS

    level_field = f"theme2_{theme_level}"
    conf_field = f"theme2_{theme_level}_confidence"

    summaries_result = await db.execute(
        select(ResponseSummary).where(
            ResponseSummary.session_id == session_id,
        )
    )
    all_summaries = list(summaries_result.scalars().all())

    eligible = []
    for s in all_summaries:
        theme_val = getattr(s, level_field, None)
        conf_val = getattr(s, conf_field, None) or 0
        if theme_val == top_theme2_label and conf_val >= 95:
            eligible.append(s)

    if not eligible:
        logger.info(
            "cube6.cqs.no_eligible",
            session_id=str(session_id),
            top_theme=top_theme2_label,
        )
        return []

    meta_ids = [s.response_meta_id for s in eligible]
    meta_result = await db.execute(
        select(ResponseMeta).where(ResponseMeta.id.in_(meta_ids))
    )
    meta_map = {m.id: m.participant_id for m in meta_result.scalars().all()}

    safe_theme_label = html.escape(top_theme2_label)

    scored: list[dict] = []
    _CQS_BATCH_SIZE = 100
    items = []
    for s in eligible:
        text = s.summary_333 or s.summary_111 or s.summary_33 or ""
        items.append({
            "text": f"Response: {text[:3000]}",
            "instruction": _CQS_INSTRUCTION,
        })

    results: list[str] = []
    for chunk_start in range(0, len(items), _CQS_BATCH_SIZE):
        chunk = items[chunk_start:chunk_start + _CQS_BATCH_SIZE]
        chunk_results = await summarizer.batch_summarize(chunk)
        results.extend(chunk_results)

    for s, result_text in zip(eligible, results):
        try:
            scores = json.loads(result_text)
        except (json.JSONDecodeError, TypeError):
            scores = {m: 50 for m in _CQS_METRICS}

        composite = sum(
            scores.get(m, 50) * weights.get(m, DEFAULT_CQS_WEIGHTS[m])
            for m in _CQS_METRICS
        )

        cqs = CQSScore(
            session_id=session_id,
            response_id=s.response_meta_id,
            participant_id=meta_map.get(s.response_meta_id, s.response_meta_id),
            theme2_cluster_label=safe_theme_label,
            theme_confidence=(getattr(s, conf_field, 0) or 0) / 100.0,
            insight_score=float(scores.get("insight", 50)),
            depth_score=float(scores.get("depth", 50)),
            future_impact_score=float(scores.get("future_impact", 50)),
            originality_score=float(scores.get("originality", 50)),
            actionability_score=float(scores.get("actionability", 50)),
            relevance_score=float(scores.get("relevance", 50)),
            composite_cqs=round(composite, 2),
            is_winner=False,
            provider=provider_name,
        )
        db.add(cqs)
        scored.append({
            "response_id": str(s.response_meta_id),
            "composite_cqs": round(composite, 2),
            "scores": {m: scores.get(m, 50) for m in _CQS_METRICS},
        })

    await db.commit()

    logger.info(
        "cube6.cqs.scored",
        session_id=str(session_id),
        eligible_count=len(eligible),
        top_theme=top_theme2_label,
    )

    return scored


def select_cqs_winner(
    scored: list[dict],
    seed: int,
) -> str | None:
    """Select CQS winner from scored responses. Deterministic tie-breaking.

    Returns response_id of winner, or None if no eligible responses.
    Pure function — does not touch DB (caller marks is_winner).
    """
    if not scored:
        return None

    ranked = sorted(scored, key=lambda x: x["composite_cqs"], reverse=True)
    top_score = ranked[0]["composite_cqs"]
    tied = [r for r in ranked if r["composite_cqs"] == top_score]

    if len(tied) == 1:
        return tied[0]["response_id"]

    rng = np.random.RandomState(seed)
    winner_idx = rng.randint(0, len(tied))
    return tied[winner_idx]["response_id"]


async def run_cqs_pipeline(
    db: AsyncSession,
    session_id: uuid.UUID,
    top_theme2_label: str,
    theme_level: str = "3",
    seed: str | None = None,
) -> dict:
    """Full CQS pipeline: score eligible responses + select winner.

    Called by Cube 5 after Cube 7 ranking identifies top Theme2 cluster.
    """
    from app.models.cqs_score import CQSScore

    scored = await score_cqs(db, session_id, top_theme2_label, theme_level)

    if not scored:
        return {
            "session_id": str(session_id),
            "status": "no_eligible",
            "winner": None,
        }

    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    effective_seed = seed or (session.seed if session else str(session_id))
    seed_int = int(hashlib.md5(effective_seed.encode()).hexdigest()[:8], 16)

    winner_id = select_cqs_winner(scored, seed_int)

    if winner_id:
        cqs_result = await db.execute(
            select(CQSScore).where(
                CQSScore.session_id == session_id,
                CQSScore.response_id == uuid.UUID(winner_id),
            )
        )
        winner_record = cqs_result.scalar_one_or_none()
        if winner_record:
            winner_record.is_winner = True
            await db.commit()

    logger.info(
        "cube6.cqs.winner_selected",
        session_id=str(session_id),
        winner_response_id=winner_id,
        total_scored=len(scored),
    )

    return {
        "session_id": str(session_id),
        "status": "completed",
        "total_scored": len(scored),
        "winner_response_id": winner_id,
        "scores": scored,
    }
