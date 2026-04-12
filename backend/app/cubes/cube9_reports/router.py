"""Cube 9 — Reports, Export & Dashboards.

Endpoints:
  GET  /export/csv       — 16-column CSV download (CRS-14)
  GET  /analytics        — Participation + engagement metrics (CRS-19)
  GET  /cqs-dashboard    — CQS scoring breakdown (CRS-19.02)
  GET  /ranking-summary  — Aggregated ranking results (CRS-15)
  POST /destroy-data     — Irreversible data destruction (CRS-14.03)

Results access gating:
  Free: Moderator + Lead always; Users see results (donation prompt after)
  Moderator Paid: All participants (Moderator paid for everyone)
  Cost Split: Only participants with payment_status='paid' or 'lead_exempt'

Export content tiers (donation-gated):
  FREE:      33-word + 111-word summaries (always available)
  $9.99:     + 333-word summary unlocked
  $11.11+:   + original Detailed_Results + all summaries unlocked
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube9_reports import service
from app.models.participant import Participant
from app.models.session import Session

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 9 — Reports"])


# ---------------------------------------------------------------------------
# CRS-14: CSV Export
# ---------------------------------------------------------------------------


@router.get("/export/csv")
async def export_csv(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-14: Export session results to 16-column CSV download.

    Auth gating:
      Moderator/Admin/Lead: always allowed
      Participant: allowed if payment_status in ('paid', 'lead_exempt')
                   or session pricing_tier is 'free' or 'moderator_paid'
    """
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if user.role in ("moderator", "admin", "lead_developer"):
        if user.role == "moderator" and session.created_by != user.user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")
    else:
        if session.pricing_tier == "cost_split":
            p_result = await db.execute(
                select(Participant).where(
                    Participant.session_id == session_id,
                    Participant.user_id == user.user_id,
                )
            )
            participant = p_result.scalar_one_or_none()
            if not participant or participant.payment_status not in ("paid", "lead_exempt"):
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Payment required to access results",
                )

    # Resolve export content tier based on user's donations
    content_tier = await service.resolve_export_tier(
        db, session_id, user.user_id, user.role
    )

    # Auto-select: streaming for large sessions (>10K responses), pandas for small
    from sqlalchemy import func
    from app.models.response_meta import ResponseMeta as RM
    count_result = await db.execute(
        select(func.count()).select_from(RM).where(RM.session_id == session_id)
    )
    response_count = count_result.scalar() or 0

    filename = f"{session_id}_themes.csv"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "X-Download-Filename": filename,
        "X-Content-Tier": content_tier,
    }

    if response_count > 10_000:
        # Scale mode: streaming CSV (no full-memory DataFrame)
        return StreamingResponse(
            service.export_session_csv_streaming(db, session_id, content_tier),
            media_type="text/csv",
            headers=headers,
        )
    else:
        # Standard mode: pandas DataFrame (fast for small sessions)
        buf = await service.export_session_csv(db, session_id, content_tier)
        return StreamingResponse(buf, media_type="text/csv", headers=headers)


# ---------------------------------------------------------------------------
# CRS-19: Analytics Dashboard
# ---------------------------------------------------------------------------


@router.get("/analytics")
async def get_analytics(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-19: Participation, timing, engagement, token, ranking metrics."""
    return await service.build_analytics_dashboard(db, session_id)


# ---------------------------------------------------------------------------
# CRS-19.02: CQS Dashboard
# ---------------------------------------------------------------------------


@router.get("/cqs-dashboard")
async def get_cqs_dashboard(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-19.02: CQS scoring breakdown — composite scores, winner, top 50."""
    return await service.build_cqs_dashboard(db, session_id)


# ---------------------------------------------------------------------------
# CRS-15: Ranking Summary
# ---------------------------------------------------------------------------


@router.get("/ranking-summary")
async def get_ranking_summary(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-15: Aggregated ranking results with theme labels."""
    return await service.build_ranking_summary(db, session_id)


# ---------------------------------------------------------------------------
# CRS-14.03: Data Destruction
# ---------------------------------------------------------------------------


@router.get("/export/pdf")
async def export_pdf(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-14.02: PDF export (MVP2 — stub)."""
    return await service.generate_pdf_stub(db, session_id)


@router.get("/results/distribution")
async def get_results_distribution(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-14.05: Check who is eligible to receive results."""
    return await service.distribute_results(db, session_id)


@router.get("/results/reward")
async def get_reward_announcement(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-14.01: Get CQS reward winner details (Moderator/Admin only)."""
    from app.models.session import Session as SessionModel

    sess_result = await db.execute(
        select(SessionModel).where(SessionModel.id == session_id)
    )
    session_obj = sess_result.scalar_one_or_none()
    short_code = session_obj.short_code if session_obj else None

    return await service.announce_reward_winner(db, session_id, short_code)


@router.get("/export/content-tier")
async def get_content_tier(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Check user's export content tier based on donations.

    Returns tier, unlock flags, and thresholds for frontend gating.
    Cumulative: each tier includes all features below it.
    """
    tier = await service.resolve_export_tier(
        db, session_id, user.user_id, user.role
    )
    at_least = service._tier_at_least
    return {
        "content_tier": tier,
        "unlocked": {
            "summary_33": True,                                     # FREE
            "summary_111": True,                                    # FREE
            "theme_summary_33": True,                               # FREE
            "theme_summary_111": at_least(tier, "tier_theme_111"),  # $1.11
            "theme_summary_333": at_least(tier, "tier_theme_333"),  # $3.33
            "confidence_scores": at_least(tier, "tier_conf"),       # $4.44
            "cqs_scores": at_least(tier, "tier_cqs"),               # $7.77
            "summary_333": at_least(tier, "tier_333"),              # $9.99
            "detailed_results": at_least(tier, "tier_full"),        # $11.11
            "talent_profiles": at_least(tier, "tier_talent"),       # $12.12
        },
        "thresholds": {
            "tier_theme_111_cents": 111,
            "tier_theme_333_cents": 333,
            "tier_conf_cents": 444,
            "tier_cqs_cents": 777,
            "tier_333_cents": 999,
            "tier_full_cents": 1111,
            "tier_talent_cents": 1212,
        },
    }


@router.get("/compression-ratio")
async def get_compression_ratio(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """MoT: Governance compression ratio — FREE headline, $2.22 methodology.

    Shows "47,000 voices → 3 priorities" for free.
    Full methodology (pipeline, determinism, cost-per-input) gated at $2.22.
    """
    from app.cubes.cube9_reports.compression import build_compression_ratio

    # Moderator/Admin/Lead get full explanation free
    include_explanation = user.role in ("moderator", "admin", "lead_developer")

    if not include_explanation:
        # Check if user donated $2.22+
        tier = await service.resolve_export_tier(
            db, session_id, user.user_id, user.role
        )
        include_explanation = service._tier_at_least(tier, "tier_theme_333")

    return await build_compression_ratio(db, session_id, include_explanation)


@router.get("/replay/options")
async def get_replay_options(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Pangu: List available simulation replay configurations.

    Shows original config + 5 alternative replay options.
    Each replay costs $2.22 (222 cents).
    """
    from app.cubes.cube10_simulation.replay_service import list_replay_options
    return await list_replay_options(db, session_id)


@router.post("/replay/preview")
async def preview_replay(
    session_id: uuid.UUID,
    theme_count: int = 3,
    seed: int = 42,
    sample_rate: float = 1.0,
    ai_supplement_pct: int = 0,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Pangu: Preview simulation replay before executing.

    Dry run — shows expected output without AI calls.
    ai_supplement_pct: 0/11/22/33 — % of AI-generated brainstorm inputs to add.
    """
    from app.cubes.cube10_simulation.replay_service import ReplayConfig, preview_replay as preview
    config = ReplayConfig(theme_count=theme_count, seed=seed, sample_rate=sample_rate)
    result = await preview(db, session_id, config)
    if ai_supplement_pct > 0:
        # AI supplement pricing: 11%=$1.11, 22%=$2.22, 33%=$3.33
        supplement_cost = {11: 111, 22: 222, 33: 333}.get(ai_supplement_pct, ai_supplement_pct * 10)
        result["ai_supplement"] = {
            "percent": ai_supplement_pct,
            "description": f"AI generates {ai_supplement_pct}% additional brainstorm inputs (HI + AI hybrid)",
            "supplement_cost_cents": supplement_cost,
            "total_cost_cents": 222 + supplement_cost,
            "hi_tokens": f"{(222 + supplement_cost) / 100.0 / 7.25:.3f} 웃",
            "note": "Human + AI collaboration — AI generates novel perspectives to expand the solution space",
        }
    return result


@router.get("/trends")
async def get_trends(
    session_id: uuid.UUID,
    project_id: str,
    theme_level: str = "themes_3",
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Odin: Cross-session trend analysis ($11.11/mo subscription).

    Tracks how themes shift across sessions within a project.
    Requires active trend subscription.
    """
    from app.cubes.cube9_reports.trend_service import check_subscription, get_trend_analysis

    has_sub = await check_subscription(db, user.user_id, project_id)
    if not has_sub and user.role not in ("admin", "lead_developer"):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=402,
            detail="Trend forecasting requires $11.11/mo subscription. Contact admin.",
        )

    return await get_trend_analysis(db, project_id, theme_level)


@router.post("/trends/snapshot")
async def capture_trend_snapshot(
    session_id: uuid.UUID,
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Odin: Capture theme snapshot for trend tracking.

    Called when session closes. Records theme state for longitudinal analysis.
    """
    from app.cubes.cube9_reports.trend_service import capture_snapshot
    return await capture_snapshot(db, session_id, project_id)


@router.post("/destroy-data", status_code=200)
async def destroy_data(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin")),
):
    """CRS-14.03: Irreversible data destruction after results delivery.

    Admin-only. Nullifies raw text and summaries. Preserves session
    metadata, themes, and rankings for audit trail.

    WARNING: This action is IRREVERSIBLE.
    """
    return await service.destroy_session_export_data(
        db, session_id, destroyed_by=user.user_id
    )
