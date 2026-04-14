"""Cube 6 — AI Theme Pipeline: Re-export Facade.

This module re-exports all public functions from the split sub-modules
so that ALL existing imports continue to work unchanged:

  from app.cubes.cube6_ai.service import summarize_single_response  # Phase A
  from app.cubes.cube6_ai.service import _marble_sample              # Phase B
  from app.cubes.cube6_ai.service import run_pipeline                # Pipeline

Sub-modules (O7 split, 2026-04-13):
  phase_a.py   — Live per-response summarization (during polling)
  phase_b.py   — Parallel theme pipeline (after polling closes)
  pipeline.py  — Public API orchestration (run_pipeline, status, themes)

"Never remove functionality from one version to the next, only add." — MoT
"""

# Phase A — Live summarization
from app.cubes.cube6_ai.phase_a import (  # noqa: F401
    THEME01_CATEGORIES,
    _CONFIDENCE_THRESHOLD,
    _PHASE_A_MAX_CONCURRENT,
    _PHASE_A_MAX_SESSIONS,
    _get_phase_a_semaphore,
    _summarize_single_response_inner,
    release_phase_a_semaphore,
    summarize_single_response,
)

# Re-export provider factories so test mocks targeting service.py still resolve
from app.cubes.cube6_ai.providers.factory import (  # noqa: F401
    get_embedding_provider,
    get_summarization_provider,
)

# Phase B — Theme pipeline
from app.cubes.cube6_ai.phase_b import (  # noqa: F401
    _assign_themes_embedding,
    _assign_themes_llm,
    _CLASSIFY_PATTERN,
    _classify_theme01,
    _fetch_summaries,
    _generate_themes_for_group,
    _group_by_theme01,
    _marble_sample,
    _parallel_generate_themes,
    _parallel_marble_sample,
    _parse_reduced_themes,
    _reduce_themes,
    _store_results,
)

# Pipeline orchestration
from app.cubes.cube6_ai.pipeline import (  # noqa: F401
    get_pipeline_status,
    get_session_themes,
    run_pipeline,
)

# CQS pipeline (from existing cqs_engine.py)
from app.cubes.cube6_ai.cqs_engine import run_cqs_pipeline  # noqa: F401

# Also expose the function that score_cqs references
try:
    from app.cubes.cube6_ai.cqs_engine import score_cqs  # noqa: F401
except ImportError:
    pass
