"""Cube 7 — Prioritization & Voting: Re-export Facade.

Re-exports all public functions from split sub-modules so that ALL
existing imports continue to work unchanged.

Sub-modules (G13 split, 2026-04-14):
  ranking_submission.py   — Submit user ranking + broadcast progress
  ranking_aggregation.py  — Borda count + quadratic weights + aggregation
  ranking_governance.py   — Live rankings, overrides, anomaly detection

"Never remove functionality from one version to the next, only add." — MoT
"""

# Submission
from app.cubes.cube7_ranking.ranking_submission import (  # noqa: F401
    submit_user_ranking,
    _broadcast_ranking_progress,
)

# Aggregation
from app.cubes.cube7_ranking.ranking_aggregation import (  # noqa: F401
    _quadratic_weights,
    _apply_influence_cap,
    _borda_scores,
    _weighted_borda_scores,
    _seeded_tiebreak_key,
    _compute_replay_hash,
    aggregate_rankings,
    identify_top_theme2,
)

# Governance
from app.cubes.cube7_ranking.ranking_governance import (  # noqa: F401
    apply_governance_override,
    detect_voting_anomalies,
    emit_ranking_complete,
    get_emerging_patterns,
    get_governance_overrides,
    get_live_rankings,
    get_personal_vs_group_rank,
    get_ranking_progress,
    run_ranking_pipeline,
    verify_replay,
)

# Constants (re-export for tests)
from app.cubes.cube7_ranking.ranking_submission import (  # noqa: F401
    _ANOMALY_WINDOW_SEC,
    _ANOMALY_MIN_DUPLICATES,
    _MAX_SUBMISSIONS_PER_MINUTE,
    _INFLUENCE_CAP,
    _MIN_JUSTIFICATION_LEN,
)
