"""Cube 4 — Analytical Intelligence layer (R-CORE analysis result).

Memo (Master of Thought): Cube 4 should never simply calculate results — it should
explain WHY outcomes occur, surface opportunities, quantify uncertainty, and stay
reproducible via Replay. Every analysis becomes an R-CORE object carrying source
CRS, inputs, confidence, evidence quality, Human-Authority status, replay history,
SSSES observations, risk, recommended actions, alternative scenarios, and version.

Design: `synthesize_analysis` is PURE + deterministic — it consumes the descriptive
outputs the platform already produces (Cube 9 analytics dashboard + trends +
compression, Cube 6 CQS, Cube 7 emerging patterns) and folds them into the one
R-CORE result object, with the "explain why / risk / recommendations / scenarios"
synthesis on top. `analyze_session` is the thin orchestrator that gathers those
inputs (reuse, no new analytics math) and calls the pure synthesizer.
"""

from __future__ import annotations

import uuid

_ANALYSIS_VERSION = "1.0.0"

# A3: execution modes now live in the SHARED R-Core substrate (build-once/consume-many).
# Cube 4 re-exports ANALYSIS_MODES + delegates dispatch_analysis_mode for back-compat.
from app.core.rcore.execution_modes import EXECUTION_MODES as ANALYSIS_MODES
from app.core.rcore.execution_modes import dispatch_execution_mode


def dispatch_analysis_mode(
    result: dict,
    *,
    mode: str,
    human_approved: bool = False,
    human_selected: bool = False,
    replay_match: bool | None = None,
) -> dict:
    """Route a synthesized analysis through an execution mode (shared R-Core gate).

    Thin delegator to core.rcore.execution_modes.dispatch_execution_mode — the SAME
    analysis runs in every mode, only the approver/automation changes. Kept as a named
    Cube-4 entry point for back-compat; the logic is the shared build-once gate.
    """
    return dispatch_execution_mode(
        result, mode=mode, human_approved=human_approved,
        human_selected=human_selected, replay_match=replay_match,
    )


def _clamp01(x: float) -> float:
    return 0.0 if x < 0 else 1.0 if x > 1 else x


def synthesize_analysis(
    *,
    analytics: dict | None = None,
    trends: dict | None = None,
    compression: dict | None = None,
    cqs: list[dict] | None = None,
    emerging: dict | None = None,
    source_crs: str | None = None,
    replay_hash: str | None = None,
    human_authority_status: str = "unreviewed",
    version: str = _ANALYSIS_VERSION,
) -> dict:
    """Fold descriptive analytics into ONE R-CORE analytical-result object (pure).

    Inputs are read defensively (`.get`) so this never couples tightly to the exact
    dashboard key set. Returns the memo's R-CORE object with explainable confidence,
    quantified risk, recommended actions, and alternative scenarios.
    """
    analytics = analytics or {}
    trends = trends or {}
    compression = compression or {}
    cqs = cqs or []
    emerging = emerging or {}

    total = int(analytics.get("total_responses", 0) or 0)
    participants = int(analytics.get("unique_participants", 0) or 0)
    coverage = _clamp01(float(analytics.get("summary_coverage", 0.0) or 0.0) / 100.0
                        if analytics.get("summary_coverage", 0) > 1
                        else float(analytics.get("summary_coverage", 0.0) or 0.0))
    convergence = _clamp01(float(emerging.get("convergence_score", 0.0) or 0.0))

    # Evidence quality = average CQS composite (0-1), else summary coverage as a proxy.
    composites = [float(c.get("composite_cqs", 0.0) or 0.0) for c in cqs if isinstance(c, dict)]
    evidence_quality = round(_clamp01(sum(composites) / len(composites)), 4) if composites else round(coverage, 4)

    # Confidence = weighted(coverage, convergence, evidence) — how trustworthy the read is.
    confidence = round(_clamp01(0.4 * coverage + 0.3 * convergence + 0.3 * evidence_quality), 4)

    # Risk (0-1, higher = worse): thin data, low convergence, and falling themes raise risk.
    falling = trends.get("falling") or trends.get("themes", {}).get("falling") or []
    sparse = 1.0 if total < 10 else (0.5 if total < 30 else 0.0)
    risk = round(_clamp01(0.5 * (1.0 - convergence) + 0.3 * sparse + 0.2 * min(len(falling) / 3.0, 1.0)), 4)

    # SSSES observations — honest notes derived from the signals (not fabricated scores).
    ssses_observations = {
        "stability": "convergent" if convergence >= 0.6 else "still settling",
        "scalability": f"{total} responses / {participants} contributors",
        "efficiency": f"{compression.get('overall_ratio', 'n/a')} compression",
    }

    # Recommended actions — rule-based, explainable.
    actions: list[str] = []
    if total < 30:
        actions.append("Collect more responses — sample is thin (confidence-limited).")
    if convergence < 0.6:
        actions.append("Extend the polling window — themes have not converged.")
    if evidence_quality < 0.5:
        actions.append("Prompt for more detailed input — evidence quality is low.")
    if falling:
        actions.append(f"Investigate {len(falling)} declining theme(s) before they drop out.")
    if not actions:
        actions.append("Ready to advance — data is sufficient, convergent, and well-evidenced.")

    # Alternative scenarios — the trend forecast vs the current leader.
    forecast_top = (trends.get("forecast") or {}).get("predicted_top_3") or []
    current_top = analytics.get("top_theme") or (emerging.get("emerging_leader"))
    scenarios = [
        {"name": "current", "top": current_top},
        {"name": "projected", "top": forecast_top[0] if forecast_top else current_top,
         "basis": "trend forecast"},
    ]

    return {
        "cube": "cube4_collector",
        "source_crs": source_crs,
        "inputs": {"total_responses": total, "unique_participants": participants},
        "confidence": confidence,
        "evidence_quality": evidence_quality,
        "human_authority_status": human_authority_status,
        "replay_hash": replay_hash,
        "ssses_observations": ssses_observations,
        "risk": risk,
        "recommended_actions": actions,
        "alternative_scenarios": scenarios,
        "version": version,
        "explanation": (
            f"Confidence {confidence} from coverage {round(coverage,2)}, convergence "
            f"{round(convergence,2)}, evidence {evidence_quality}; risk {risk}. "
            f"Top action: {actions[0]}"
        ),
    }


async def analyze_session(db, session_id: uuid.UUID, *, source_crs: str | None = None) -> dict:
    """Orchestrate the R-CORE analysis for a session by REUSING existing engines.

    Gathers Cube 9 analytics + trends + compression and Cube 7 emerging patterns
    (no new analytics math), then calls the pure synthesizer. Each gather is guarded
    so a single missing source degrades gracefully rather than failing the analysis.
    """
    from app.cubes.cube9_reports import service as reports
    from app.cubes.cube9_reports import compression as comp
    from app.cubes.cube7_ranking.ranking_governance import get_emerging_patterns

    async def _safe(coro, default):
        try:
            return await coro
        except Exception:  # noqa: BLE001 — a missing source degrades, never fails
            return default

    analytics = await _safe(reports.build_analytics_dashboard(db, session_id), {})
    compression = await _safe(comp.build_compression_ratio(db, session_id), {})
    emerging = await _safe(get_emerging_patterns(db, session_id), {})

    return synthesize_analysis(
        analytics=analytics, compression=compression, emerging=emerging,
        source_crs=source_crs,
    )
