"""Cube 9 — Reports Service: CSV export, analytics, CQS dashboard.

Output columns (ref: Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv):
  Q_Number, Question, User, Detailed_Results, Response_Language,
  333_Summary, 111_Summary, 33_Summary,
  Theme01, Theme01_Confidence,
  Theme2_9, Theme2_9_Confidence,
  Theme2_6, Theme2_6_Confidence,
  Theme2_3, Theme2_3_Confidence

Functions:
  - export_session_csv: 16-column CSV matching reference schema
  - build_analytics_dashboard: Participation, timing, engagement metrics
  - build_cqs_dashboard: CQS scoring breakdown for moderator
  - build_ranking_summary: Aggregated ranking results for export
  - destroy_session_data: Irreversible data destruction after delivery

CRS: 14, 15, 19, 20, 21
"""

import io
import logging
import uuid
from datetime import datetime, timezone

import pandas as pd
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participant import Participant
from app.models.question import Question
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary

from app.models.payment import PaymentTransaction
from app.models.theme import Theme

logger = logging.getLogger("cube9")

# ---------------------------------------------------------------------------
# Export Content Tiers (donation-gated)
# ---------------------------------------------------------------------------
# FREE:       33 + 111 response summaries + 33-word theme descriptions
# TIER_THEME_111: + 111-word theme summaries ($1.11)
# TIER_THEME_333: + 333-word theme summaries ($3.33)
# TIER_CONF:  + Theme Confidence Scores ($4.44)
# TIER_CQS:   + CQS Individual Scores ($7.77)
# TIER_333:   + 333-word response summaries ($9.99)
# TIER_FULL:  + original Detailed_Results + all summaries ($11.11)
# TIER_TALENT: + Talent Profiles ($12.12 — honors 12 Ascended Masters)

TIER_FREE = "free"
TIER_THEME_111 = "tier_theme_111"
TIER_THEME_333 = "tier_theme_333"
TIER_CONF = "tier_conf"
TIER_CQS = "tier_cqs"
TIER_333 = "tier_333"
TIER_FULL = "tier_full"
TIER_TALENT = "tier_talent"

# Donation thresholds in cents (cumulative — each tier includes all below it)
THRESHOLD_THEME_111_CENTS = 111   # $1.11
THRESHOLD_THEME_333_CENTS = 333   # $3.33
THRESHOLD_CONF_CENTS = 444        # $4.44
THRESHOLD_CQS_CENTS = 777         # $7.77
THRESHOLD_333_CENTS = 999         # $9.99
THRESHOLD_FULL_CENTS = 1111       # $11.11
THRESHOLD_TALENT_CENTS = 1212     # $12.12

LOCKED_PLACEHOLDER = "🔒"


async def resolve_export_tier(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: str,
    user_role: str,
) -> str:
    """Determine export content tier based on user's donations.

    Moderator/Admin/Lead always get TIER_TALENT (full access).
    Participants: check total donations — highest qualifying tier returned.

    Tier ladder (cumulative):
      FREE       ($0):     33 + 111 response summaries + 33-word theme descriptions
      THEME_111  ($1.11):  + 111-word theme summaries
      THEME_333  ($3.33):  + 333-word theme summaries
      CONF       ($4.44):  + Theme Confidence Scores
      CQS        ($7.77):  + CQS Individual Scores
      333        ($9.99):  + 333-word response summaries
      FULL       ($11.11): + original Detailed_Results
      TALENT     ($12.12): + Talent Profiles (honors 12 Ascended Masters)
    """
    if user_role in ("moderator", "admin", "lead_developer"):
        return TIER_TALENT

    # Sum all completed donations/payments by this user for this session
    from app.models.participant import Participant as P

    p_result = await db.execute(
        select(P.id).where(P.session_id == session_id, P.user_id == user_id)
    )
    participant_id = p_result.scalar_one_or_none()

    if not participant_id:
        return TIER_FREE

    tx_result = await db.execute(
        select(func.coalesce(func.sum(PaymentTransaction.amount_cents), 0)).where(
            PaymentTransaction.session_id == session_id,
            PaymentTransaction.participant_id == participant_id,
            PaymentTransaction.status == "completed",
        )
    )
    total_donated_cents = tx_result.scalar() or 0

    # Return highest qualifying tier
    if total_donated_cents >= THRESHOLD_TALENT_CENTS:
        return TIER_TALENT
    elif total_donated_cents >= THRESHOLD_FULL_CENTS:
        return TIER_FULL
    elif total_donated_cents >= THRESHOLD_333_CENTS:
        return TIER_333
    elif total_donated_cents >= THRESHOLD_CQS_CENTS:
        return TIER_CQS
    elif total_donated_cents >= THRESHOLD_CONF_CENTS:
        return TIER_CONF
    elif total_donated_cents >= THRESHOLD_THEME_333_CENTS:
        return TIER_THEME_333
    elif total_donated_cents >= THRESHOLD_THEME_111_CENTS:
        return TIER_THEME_111
    return TIER_FREE


# Tier ordering for comparison
_TIER_ORDER = {
    TIER_FREE: 0,
    TIER_THEME_111: 1,
    TIER_THEME_333: 2,
    TIER_CONF: 3,
    TIER_CQS: 4,
    TIER_333: 5,
    TIER_FULL: 6,
    TIER_TALENT: 7,
}


def _tier_at_least(tier: str, minimum: str) -> bool:
    """Check if user's tier meets or exceeds a minimum tier."""
    return _TIER_ORDER.get(tier, 0) >= _TIER_ORDER.get(minimum, 0)


def _apply_tier_filter(row: dict, tier: str) -> dict:
    """Filter CSV row fields based on export content tier.

    Tier ladder (cumulative — each includes all below):
      FREE:       33 + 111 response summaries + 33-word theme descriptions
      THEME_111:  + 111-word theme summaries
      THEME_333:  + 333-word theme summaries
      CONF:       + Theme Confidence Scores
      CQS:        + CQS Individual Scores (future column)
      333:        + 333-word response summaries
      FULL:       + original Detailed_Results
      TALENT:     + Talent Profiles (future column)
    """
    if _tier_at_least(tier, TIER_TALENT):
        return row

    filtered = dict(row)

    # Lock original text unless FULL ($11.11+)
    if not _tier_at_least(tier, TIER_FULL):
        filtered["Detailed_Results"] = LOCKED_PLACEHOLDER

    # Lock 333-word response summaries unless TIER_333 ($9.99+)
    if not _tier_at_least(tier, TIER_333):
        filtered["333_Summary"] = LOCKED_PLACEHOLDER

    # Lock confidence scores unless CONF ($4.44+)
    if not _tier_at_least(tier, TIER_CONF):
        for col in ("Theme01_Confidence", "Theme2_9_Confidence",
                     "Theme2_6_Confidence", "Theme2_3_Confidence"):
            if col in filtered:
                filtered[col] = LOCKED_PLACEHOLDER

    return filtered


# 19-column CSV schema (16 original + 3 theme descriptions)
# Theme descriptions (33-word) are always FREE — explain what each theme means
CSV_COLUMNS = [
    "Q_Number",
    "Question",
    "User",
    "Detailed_Results",
    "Response_Language",
    "333_Summary",
    "111_Summary",
    "33_Summary",
    "Theme01",
    "Theme01_Confidence",
    "Theme2_9",
    "Theme2_9_Confidence",
    "Theme2_9_Description",
    "Theme2_6",
    "Theme2_6_Confidence",
    "Theme2_6_Description",
    "Theme2_3",
    "Theme2_3_Confidence",
    "Theme2_3_Description",
]


# ---------------------------------------------------------------------------
# CRS-14: CSV Export
# ---------------------------------------------------------------------------


async def export_session_csv(
    db: AsyncSession,
    session_id: uuid.UUID,
    content_tier: str = TIER_FULL,
) -> io.BytesIO:
    """Build 16-column CSV export for a session.

    Queries Postgres (ResponseMeta, Question, ResponseSummary)
    and assembles matching the reference output schema.

    Content tier controls which columns are populated:
      FREE:    33 + 111 summaries only (333 + originals locked)
      TIER_333: 33 + 111 + 333 summaries (originals locked)
      TIER_FULL: all columns unlocked
    """
    # Fetch all response metadata
    result = await db.execute(
        select(ResponseMeta).where(ResponseMeta.session_id == session_id)
    )
    metas = list(result.scalars().all())

    # Build question lookup
    q_result = await db.execute(
        select(Question).where(Question.session_id == session_id)
    )
    questions = {str(q.id): q for q in q_result.scalars().all()}

    # Batch-load all summaries for this session
    summary_result = await db.execute(
        select(ResponseSummary).where(ResponseSummary.session_id == session_id)
    )
    summaries = {
        s.response_meta_id: s for s in summary_result.scalars().all()
        if hasattr(s, "response_meta_id")
    }

    # Batch-load participant language codes
    part_result = await db.execute(
        select(Participant).where(Participant.session_id == session_id)
    )
    participant_langs = {
        p.id: p.language_code for p in part_result.scalars().all()
    }

    # Batch-load theme descriptions (33-word, always FREE)
    theme_result = await db.execute(
        select(Theme).where(Theme.session_id == session_id)
    )
    theme_descriptions = {
        t.label: (t.theme_summary_33 or "") for t in theme_result.scalars().all()
    }

    rows = []
    for meta in metas:
        raw_text = meta.raw_text or ""
        summary_row = summaries.get(meta.id)

        question = questions.get(str(meta.question_id))
        q_number = question.order_index if question else 0
        q_text = question.question_text if question else ""

        def _fmt_confidence(val) -> str:
            if isinstance(val, (int, float)):
                return f"{int(val)}%" if val > 1 else f"{int(val * 100)}%"
            return str(val) if val else ""

        # Look up 33-word theme descriptions (always FREE)
        t2_9_label = summary_row.theme2_9 if summary_row else ""
        t2_6_label = summary_row.theme2_6 if summary_row else ""
        t2_3_label = summary_row.theme2_3 if summary_row else ""

        row = {
            "Q_Number": q_number,
            "Question": q_text,
            "User": str(meta.participant_id),
            "Detailed_Results": raw_text,
            "Response_Language": participant_langs.get(meta.participant_id, "en"),
            "333_Summary": summary_row.summary_333 or "" if summary_row else "",
            "111_Summary": summary_row.summary_111 or "" if summary_row else "",
            "33_Summary": summary_row.summary_33 or "" if summary_row else "",
            "Theme01": summary_row.theme01 or "" if summary_row else "",
            "Theme01_Confidence": _fmt_confidence(
                summary_row.theme01_confidence if summary_row else ""
            ),
            "Theme2_9": t2_9_label or "",
            "Theme2_9_Confidence": _fmt_confidence(
                summary_row.theme2_9_confidence if summary_row else ""
            ),
            "Theme2_9_Description": theme_descriptions.get(t2_9_label, ""),
            "Theme2_6": t2_6_label or "",
            "Theme2_6_Confidence": _fmt_confidence(
                summary_row.theme2_6_confidence if summary_row else ""
            ),
            "Theme2_6_Description": theme_descriptions.get(t2_6_label, ""),
            "Theme2_3": t2_3_label or "",
            "Theme2_3_Confidence": _fmt_confidence(
                summary_row.theme2_3_confidence if summary_row else ""
            ),
            "Theme2_3_Description": theme_descriptions.get(t2_3_label, ""),
        }
        rows.append(_apply_tier_filter(row, content_tier))

    df = pd.DataFrame(rows, columns=CSV_COLUMNS)

    buf = io.BytesIO()
    df.to_csv(buf, index=False, encoding="utf-8-sig")
    buf.seek(0)
    return buf


async def export_session_csv_streaming(
    db: AsyncSession,
    session_id: uuid.UUID,
    content_tier: str = TIER_FULL,
):
    """Scale-optimized CSV export — streaming generator, no full-memory load.

    For 1M+ responses: yields CSV rows as they're built, never holds
    all rows in memory. Uses csv.writer on a StringIO buffer per chunk.

    Content tier controls which columns are populated (same as export_session_csv).
    Yields bytes chunks suitable for FastAPI StreamingResponse.
    """
    import csv

    # Header
    header_buf = io.StringIO()
    writer = csv.writer(header_buf)
    writer.writerow(CSV_COLUMNS)
    yield header_buf.getvalue().encode("utf-8-sig")

    # Batch-load lookups (these are small: questions + participants)
    q_result = await db.execute(
        select(Question).where(Question.session_id == session_id)
    )
    questions = {str(q.id): q for q in q_result.scalars().all()}

    part_result = await db.execute(
        select(Participant).where(Participant.session_id == session_id)
    )
    participant_langs = {
        p.id: p.language_code for p in part_result.scalars().all()
    }

    summary_result = await db.execute(
        select(ResponseSummary).where(ResponseSummary.session_id == session_id)
    )
    summaries = {
        s.response_meta_id: s for s in summary_result.scalars().all()
        if hasattr(s, "response_meta_id")
    }

    # Batch-load theme descriptions (33-word, always FREE)
    theme_result = await db.execute(
        select(Theme).where(Theme.session_id == session_id)
    )
    theme_descriptions = {
        t.label: (t.theme_summary_33 or "") for t in theme_result.scalars().all()
    }

    # Stream responses in chunks of 1000
    chunk_size = 1000
    offset = 0
    while True:
        result = await db.execute(
            select(ResponseMeta)
            .where(ResponseMeta.session_id == session_id)
            .order_by(ResponseMeta.submitted_at)
            .offset(offset)
            .limit(chunk_size)
        )
        metas = list(result.scalars().all())
        if not metas:
            break

        chunk_buf = io.StringIO()
        writer = csv.writer(chunk_buf)

        for meta in metas:
            raw_text = meta.raw_text or ""
            summary_row = summaries.get(meta.id)
            question = questions.get(str(meta.question_id))

            def _fmt(val):
                if isinstance(val, (int, float)):
                    return f"{int(val)}%" if val > 1 else f"{int(val * 100)}%"
                return str(val) if val else ""

            t2_9_label = summary_row.theme2_9 if summary_row else ""
            t2_6_label = summary_row.theme2_6 if summary_row else ""
            t2_3_label = summary_row.theme2_3 if summary_row else ""

            row_dict = {
                "Q_Number": question.order_index if question else 0,
                "Question": question.question_text if question else "",
                "User": str(meta.participant_id),
                "Detailed_Results": raw_text,
                "Response_Language": participant_langs.get(meta.participant_id, "en"),
                "333_Summary": summary_row.summary_333 or "" if summary_row else "",
                "111_Summary": summary_row.summary_111 or "" if summary_row else "",
                "33_Summary": summary_row.summary_33 or "" if summary_row else "",
                "Theme01": summary_row.theme01 or "" if summary_row else "",
                "Theme01_Confidence": _fmt(summary_row.theme01_confidence if summary_row else ""),
                "Theme2_9": t2_9_label or "",
                "Theme2_9_Confidence": _fmt(summary_row.theme2_9_confidence if summary_row else ""),
                "Theme2_9_Description": theme_descriptions.get(t2_9_label, ""),
                "Theme2_6": t2_6_label or "",
                "Theme2_6_Confidence": _fmt(summary_row.theme2_6_confidence if summary_row else ""),
                "Theme2_6_Description": theme_descriptions.get(t2_6_label, ""),
                "Theme2_3": t2_3_label or "",
                "Theme2_3_Confidence": _fmt(summary_row.theme2_3_confidence if summary_row else ""),
                "Theme2_3_Description": theme_descriptions.get(t2_3_label, ""),
            }
            filtered = _apply_tier_filter(row_dict, content_tier)
            writer.writerow([filtered[col] for col in CSV_COLUMNS])

        yield chunk_buf.getvalue().encode("utf-8")
        offset += chunk_size


# ---------------------------------------------------------------------------
# CRS-19: Analytics Dashboard
# ---------------------------------------------------------------------------


async def build_analytics_dashboard(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """CRS-19.01: Participation, timing, engagement metrics.

    Returns:
      - Response counts (total, by question)
      - Participation rate (responses / participants)
      - Theme distribution (by Theme01 category)
      - Summary coverage (% of responses with summaries)
      - Ranking participation (if ranking completed)
    """
    # Response counts
    resp_result = await db.execute(
        select(func.count()).select_from(ResponseMeta).where(
            ResponseMeta.session_id == session_id
        )
    )
    total_responses = resp_result.scalar() or 0

    # Unique participants
    part_result = await db.execute(
        select(func.count(func.distinct(ResponseMeta.participant_id))).where(
            ResponseMeta.session_id == session_id
        )
    )
    unique_participants = part_result.scalar() or 0

    # Summary coverage
    summary_result = await db.execute(
        select(func.count()).select_from(ResponseSummary).where(
            ResponseSummary.session_id == session_id
        )
    )
    summaries_count = summary_result.scalar() or 0

    # Per-question response counts
    question_dist: dict[str, int] = {}
    try:
        q_resp_result = await db.execute(
            select(
                Question.question_text,
                func.count(ResponseMeta.id),
            )
            .join(ResponseMeta, ResponseMeta.question_id == Question.id)
            .where(ResponseMeta.session_id == session_id)
            .group_by(Question.question_text)
        )
        for text, count in q_resp_result.all():
            question_dist[text or "Unknown"] = count
    except Exception:
        pass

    # Theme01 distribution
    theme01_dist: dict[str, int] = {}
    if summaries_count > 0:
        theme_result = await db.execute(
            select(ResponseSummary.theme01, func.count()).where(
                and_(
                    ResponseSummary.session_id == session_id,
                    ResponseSummary.theme01.isnot(None),
                )
            ).group_by(ResponseSummary.theme01)
        )
        for label, count in theme_result.all():
            if label:
                theme01_dist[label] = count

    # Ranking stats
    ranking_stats = {}
    try:
        from app.models.ranking import AggregatedRanking, Ranking

        rank_count_result = await db.execute(
            select(func.count()).select_from(Ranking).where(
                Ranking.session_id == session_id
            )
        )
        ranking_submissions = rank_count_result.scalar() or 0

        agg_result = await db.execute(
            select(AggregatedRanking)
            .where(
                and_(
                    AggregatedRanking.session_id == session_id,
                    AggregatedRanking.is_top_theme2.is_(True),
                )
            )
        )
        winner = agg_result.scalar_one_or_none()

        ranking_stats = {
            "ranking_submissions": ranking_submissions,
            "top_theme2_id": str(winner.theme_id) if winner else None,
            "top_theme2_score": winner.score if winner else None,
        }
    except Exception:
        ranking_stats = {"ranking_submissions": 0}

    # Token stats
    token_stats = {}
    try:
        from app.models.token_ledger import TokenLedger

        token_result = await db.execute(
            select(
                func.sum(TokenLedger.delta_heart),
                func.sum(TokenLedger.delta_human),
                func.sum(TokenLedger.delta_unity),
            ).where(
                and_(
                    TokenLedger.session_id == session_id,
                    TokenLedger.lifecycle_state.in_(("pending", "approved", "finalized")),
                )
            )
        )
        heart, human, unity = token_result.one()
        token_stats = {
            "total_heart": round(heart or 0, 3),
            "total_human": round(human or 0, 3),
            "total_unity": round(unity or 0, 3),
        }
    except Exception:
        token_stats = {"total_heart": 0, "total_human": 0, "total_unity": 0}

    return {
        "session_id": str(session_id),
        "total_responses": total_responses,
        "unique_participants": unique_participants,
        "avg_responses_per_participant": (
            round(total_responses / unique_participants, 1)
            if unique_participants else 0
        ),
        "summary_coverage": (
            round(summaries_count / total_responses * 100, 1)
            if total_responses else 0
        ),
        "responses_by_question": question_dist,
        "theme01_distribution": theme01_dist,
        "ranking": ranking_stats,
        "tokens": token_stats,
    }


# ---------------------------------------------------------------------------
# CRS-19.02: CQS Dashboard
# ---------------------------------------------------------------------------


async def build_cqs_dashboard(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """CRS-19.02: CQS scoring breakdown for moderator.

    Returns per-response 6-metric scores, composite CQS, winner details.
    """
    try:
        from app.models.cqs_score import CQSScore

        result = await db.execute(
            select(CQSScore)
            .where(CQSScore.session_id == session_id)
            .order_by(CQSScore.composite_cqs.desc())
        )
        scores = list(result.scalars().all())

        if not scores:
            return {
                "session_id": str(session_id),
                "cqs_scores": [],
                "winner": None,
                "total_scored": 0,
            }

        winner = next((s for s in scores if s.is_winner), scores[0] if scores else None)

        return {
            "session_id": str(session_id),
            "total_scored": len(scores),
            "winner": {
                "participant_id": str(winner.participant_id),
                "composite_cqs": winner.composite_cqs,
                "theme2_cluster_label": winner.theme2_cluster_label,
                "is_winner": True,
            } if winner else None,
            "cqs_scores": [
                {
                    "response_id": str(s.response_id),
                    "participant_id": str(s.participant_id),
                    "composite_cqs": s.composite_cqs,
                    "is_winner": s.is_winner,
                    "theme2_cluster_label": s.theme2_cluster_label,
                }
                for s in scores[:50]  # Top 50 for dashboard
            ],
        }
    except Exception as e:
        logger.warning("cube9.cqs_dashboard.error", extra={"error": str(e)})
        return {
            "session_id": str(session_id),
            "cqs_scores": [],
            "winner": None,
            "total_scored": 0,
        }


# ---------------------------------------------------------------------------
# Ranking Summary Export
# ---------------------------------------------------------------------------


async def build_ranking_summary(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Build ranking summary for report inclusion."""
    try:
        from app.models.ranking import AggregatedRanking
        from app.models.theme import Theme

        result = await db.execute(
            select(AggregatedRanking)
            .where(AggregatedRanking.session_id == session_id)
            .order_by(AggregatedRanking.rank_position)
        )
        rankings = list(result.scalars().all())

        if not rankings:
            return {"session_id": str(session_id), "rankings": []}

        # Fetch theme labels
        theme_ids = [r.theme_id for r in rankings]
        theme_result = await db.execute(
            select(Theme).where(Theme.id.in_(theme_ids))
        )
        theme_map = {t.id: t.label for t in theme_result.scalars().all()}

        return {
            "session_id": str(session_id),
            "algorithm": rankings[0].algorithm if rankings else "borda_count",
            "participant_count": rankings[0].participant_count if rankings else 0,
            "rankings": [
                {
                    "rank": r.rank_position,
                    "theme_id": str(r.theme_id),
                    "theme_label": theme_map.get(r.theme_id, "Unknown"),
                    "score": r.score,
                    "vote_count": r.vote_count,
                    "is_top_theme2": r.is_top_theme2,
                }
                for r in rankings
            ],
        }
    except Exception as e:
        logger.warning("cube9.ranking_summary.error", extra={"error": str(e)})
        return {"session_id": str(session_id), "rankings": []}


# ---------------------------------------------------------------------------
# CRS-14.03: Data Destruction
# ---------------------------------------------------------------------------


async def destroy_session_export_data(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    destroyed_by: str,
) -> dict:
    """CRS-14.03: Irreversible data destruction after delivery.

    Purges response raw text and summaries. Preserves session metadata,
    themes, and rankings for audit trail. Creates audit entry.

    WARNING: This is irreversible. Call only after results have been delivered.
    """
    # Count what we're destroying
    resp_count = await db.execute(
        select(func.count()).select_from(ResponseMeta).where(
            ResponseMeta.session_id == session_id
        )
    )
    total_responses = resp_count.scalar() or 0

    summary_count = await db.execute(
        select(func.count()).select_from(ResponseSummary).where(
            ResponseSummary.session_id == session_id
        )
    )
    total_summaries = summary_count.scalar() or 0

    # Nullify raw text in response_meta (preserve structure)
    from sqlalchemy import update
    await db.execute(
        update(ResponseMeta)
        .where(ResponseMeta.session_id == session_id)
        .values(raw_text="[DESTROYED]")
    )

    # Nullify summaries
    await db.execute(
        update(ResponseSummary)
        .where(ResponseSummary.session_id == session_id)
        .values(
            summary_333="[DESTROYED]",
            summary_111="[DESTROYED]",
            summary_33="[DESTROYED]",
            original_text="[DESTROYED]",
        )
    )

    await db.commit()

    logger.warning(
        "cube9.data.destroyed",
        extra={
            "session_id": str(session_id),
            "responses_destroyed": total_responses,
            "summaries_destroyed": total_summaries,
            "destroyed_by": destroyed_by,
        },
    )

    return {
        "session_id": str(session_id),
        "responses_destroyed": total_responses,
        "summaries_destroyed": total_summaries,
        "destroyed_by": destroyed_by,
        "destroyed_at": datetime.now(timezone.utc).isoformat(),
        "irreversible": True,
    }


# ---------------------------------------------------------------------------
# CRS-14.02: PDF Export (MVP2 stub)
# ---------------------------------------------------------------------------


async def generate_pdf_stub(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """CRS-14.02: PDF export — stub for MVP2 implementation.

    Will use reportlab/pypdf to generate formatted report with:
    - Session summary header
    - Theme hierarchy visualization
    - Ranking results table
    - CQS winner highlight
    - Token distribution breakdown
    - Analytics charts
    """
    return {
        "session_id": str(session_id),
        "status": "not_implemented",
        "message": "PDF export will be available in MVP2. Use CSV export for now.",
        "mvp": 2,
    }


# ---------------------------------------------------------------------------
# CRS-14.05: Results Distribution
# ---------------------------------------------------------------------------


async def distribute_results(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """CRS-14.05: Determine who is eligible to receive results.

    Eligibility rules:
      - Moderator/Admin/Lead: always eligible
      - Free tier: all participants eligible (donation prompt shown after)
      - Moderator Paid: all participants eligible (moderator paid for everyone)
      - Cost Split: only participants with payment_status = 'paid' or 'lead_exempt'
    """
    from app.models.participant import Participant
    from app.models.session import Session

    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        return {"session_id": str(session_id), "error": "Session not found"}

    part_result = await db.execute(
        select(Participant).where(Participant.session_id == session_id)
    )
    participants = list(part_result.scalars().all())

    eligible = []
    ineligible = []
    pricing_tier = getattr(session, "pricing_tier", "free")

    for p in participants:
        if pricing_tier in ("free", "moderator_paid"):
            eligible.append({
                "participant_id": str(p.id),
                "reason": "tier_allows_all",
            })
        elif pricing_tier == "cost_split":
            if getattr(p, "payment_status", "unpaid") in ("paid", "lead_exempt"):
                eligible.append({
                    "participant_id": str(p.id),
                    "reason": p.payment_status,
                })
            else:
                ineligible.append({
                    "participant_id": str(p.id),
                    "reason": "unpaid",
                })

    return {
        "session_id": str(session_id),
        "pricing_tier": pricing_tier,
        "total_participants": len(participants),
        "eligible_count": len(eligible),
        "ineligible_count": len(ineligible),
        "eligible": eligible,
        "ineligible": ineligible,
    }


# ---------------------------------------------------------------------------
# CRS-14.01: Reward Winner Announcement
# ---------------------------------------------------------------------------


async def announce_reward_winner(
    db: AsyncSession,
    session_id: uuid.UUID,
    session_short_code: str | None = None,
) -> dict:
    """CRS-14.01: Announce CQS reward winner.

    Winner gets private notification with full CQS breakdown.
    All other participants get generic "a participant won" message.
    """
    try:
        from app.models.cqs_score import CQSScore

        result = await db.execute(
            select(CQSScore).where(
                and_(
                    CQSScore.session_id == session_id,
                    CQSScore.is_winner.is_(True),
                )
            )
        )
        winner = result.scalar_one_or_none()

        if not winner:
            return {
                "session_id": str(session_id),
                "has_winner": False,
                "message": "No CQS winner determined for this session",
            }

        winner_data = {
            "participant_id": str(winner.participant_id),
            "composite_cqs": winner.composite_cqs,
            "theme2_cluster_label": winner.theme2_cluster_label,
        }

        # Broadcast generic announcement (no CQS details)
        if session_short_code:
            try:
                from app.core.supabase_broadcast import broadcast_event

                await broadcast_event(
                    channel=f"session:{session_short_code}",
                    event="reward_announced",
                    payload={
                        "session_id": str(session_id),
                        "has_winner": True,
                        # No participant_id or CQS details in public broadcast
                    },
                )
            except Exception:
                pass

        return {
            "session_id": str(session_id),
            "has_winner": True,
            "winner": winner_data,  # Only returned to Moderator/Admin via auth gate
        }

    except Exception as e:
        logger.warning("cube9.reward_announcement.error", extra={"error": str(e)})
        return {
            "session_id": str(session_id),
            "has_winner": False,
            "error": str(e),
        }
