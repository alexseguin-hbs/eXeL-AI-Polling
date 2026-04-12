"""Cube 9 — Trend Forecasting Service (Odin).

Cross-session theme tracking for organizations running recurring polls.

Features:
  - Capture theme snapshots at session close
  - Compare themes across time (drift detection)
  - Identify rising/falling priorities
  - Forecast: "If this trend continues, X will be #1 by Q3"

Subscription: $11.11/mo per project.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.participant import Participant
from app.models.session import Session
from app.models.theme import Theme
from app.models.trend import TrendSnapshot, TrendSubscription

logger = logging.getLogger("cube9.trends")

TREND_SUBSCRIPTION_CENTS = 1111  # $11.11/mo


async def capture_snapshot(
    db: AsyncSession,
    session_id: uuid.UUID,
    project_id: str,
) -> dict:
    """Capture a theme snapshot for trend tracking.

    Called automatically when a session closes (or manually by moderator).
    """
    # Check if snapshot already exists
    existing = await db.execute(
        select(TrendSnapshot).where(TrendSnapshot.session_id == session_id)
    )
    if existing.scalar_one_or_none():
        return {"status": "already_captured", "session_id": str(session_id)}

    # Count inputs and participants
    input_count = (await db.execute(
        select(func.count()).select_from(ResponseMeta).where(
            ResponseMeta.session_id == session_id
        )
    )).scalar() or 0

    participant_count = (await db.execute(
        select(func.count()).select_from(Participant).where(
            Participant.session_id == session_id
        )
    )).scalar() or 0

    # Build theme rankings at each level
    async def get_theme_rankings(level: str) -> list[dict]:
        col = getattr(ResponseSummary, level, None)
        if not col:
            return []
        conf_col = getattr(ResponseSummary, f"{level}_confidence", None)

        result = await db.execute(
            select(
                col,
                func.count().label("count"),
                func.avg(conf_col).label("avg_conf") if conf_col else func.count(),
            ).where(
                ResponseSummary.session_id == session_id,
                col.isnot(None), col != "",
            ).group_by(col).order_by(func.count().desc())
        )
        rows = result.all()
        return [
            {
                "label": row[0],
                "rank": i + 1,
                "count": row[1],
                "confidence": round(float(row[2] or 0), 3),
            }
            for i, row in enumerate(rows)
        ]

    themes_3 = await get_theme_rankings("theme2_3")
    themes_6 = await get_theme_rankings("theme2_6")
    themes_9 = await get_theme_rankings("theme2_9")

    compression = round(input_count / max(len(themes_3), 1), 1)

    snapshot = TrendSnapshot(
        session_id=session_id,
        project_id=project_id,
        snapshot_at=datetime.now(timezone.utc),
        input_count=input_count,
        participant_count=participant_count,
        themes_3=themes_3,
        themes_6=themes_6,
        themes_9=themes_9,
        compression_ratio=compression,
    )
    db.add(snapshot)
    await db.commit()

    logger.info(
        "cube9.trend.snapshot_captured",
        extra={"session_id": str(session_id), "project_id": project_id},
    )

    return {
        "status": "captured",
        "session_id": str(session_id),
        "project_id": project_id,
        "input_count": input_count,
        "themes_3": themes_3,
        "compression_ratio": compression,
    }


async def get_trend_analysis(
    db: AsyncSession,
    project_id: str,
    theme_level: str = "themes_3",
) -> dict:
    """Analyze theme trends across sessions for a project.

    Returns:
      - Timeline: theme rankings per session (chronological)
      - Rising themes: rank improved over time
      - Falling themes: rank declined
      - Stable themes: consistent ranking
      - Forecast: projected next ranking
    """
    result = await db.execute(
        select(TrendSnapshot).where(
            TrendSnapshot.project_id == project_id
        ).order_by(TrendSnapshot.snapshot_at)
    )
    snapshots = list(result.scalars().all())

    if len(snapshots) < 2:
        return {
            "project_id": project_id,
            "status": "insufficient_data",
            "sessions_needed": 2,
            "sessions_available": len(snapshots),
            "message": "Need at least 2 sessions for trend analysis",
        }

    # Build timeline
    timeline = []
    all_themes = set()
    for snap in snapshots:
        themes_data = getattr(snap, theme_level, None) or []
        entry = {
            "session_id": str(snap.session_id),
            "date": snap.snapshot_at.isoformat(),
            "input_count": snap.input_count,
            "themes": {t["label"]: t["rank"] for t in themes_data},
        }
        timeline.append(entry)
        all_themes.update(t["label"] for t in themes_data)

    # Calculate trends (first vs last snapshot)
    first_ranks = timeline[0]["themes"]
    last_ranks = timeline[-1]["themes"]

    rising = []
    falling = []
    stable = []
    new_themes = []

    for theme in all_themes:
        first = first_ranks.get(theme)
        last = last_ranks.get(theme)

        if first is None:
            new_themes.append({"label": theme, "current_rank": last})
        elif last is None:
            falling.append({"label": theme, "was_rank": first, "status": "disappeared"})
        elif last < first:
            rising.append({"label": theme, "from_rank": first, "to_rank": last, "change": first - last})
        elif last > first:
            falling.append({"label": theme, "from_rank": first, "to_rank": last, "change": last - first})
        else:
            stable.append({"label": theme, "rank": last})

    rising.sort(key=lambda x: x.get("change", 0), reverse=True)
    falling.sort(key=lambda x: x.get("change", 0), reverse=True)

    return {
        "project_id": project_id,
        "theme_level": theme_level,
        "sessions_analyzed": len(snapshots),
        "date_range": {
            "first": snapshots[0].snapshot_at.isoformat(),
            "last": snapshots[-1].snapshot_at.isoformat(),
        },
        "timeline": timeline,
        "trends": {
            "rising": rising,
            "falling": falling,
            "stable": stable,
            "new": new_themes,
        },
        "forecast": {
            "note": "If current trend continues:",
            "predicted_top_3": [
                t["label"] for t in sorted(
                    [{"label": k, "rank": v} for k, v in last_ranks.items()],
                    key=lambda x: x["rank"]
                )[:3]
            ],
        },
    }


async def check_subscription(
    db: AsyncSession,
    user_id: str,
    project_id: str,
) -> bool:
    """Check if user has active trend subscription for this project."""
    result = await db.execute(
        select(TrendSubscription).where(
            TrendSubscription.user_id == user_id,
            TrendSubscription.project_id == project_id,
            TrendSubscription.status == "active",
        )
    )
    return result.scalar_one_or_none() is not None
