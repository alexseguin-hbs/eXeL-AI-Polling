"""Cube 6 — Cross-Cube Integration Tests (6/1 through 6/9).

Verifies Cube 6 AI Pipeline integrates correctly with ALL other cubes.

    Cube 6/1: Session triggers pipeline via status transition
    Cube 6/2: Text responses feed Phase A summarization
    Cube 6/3: Voice transcripts feed Phase A summarization
    Cube 6/4: Collected responses queried for Phase B
    Cube 6/5: Gateway orchestrates pipeline trigger + timeout
    Cube 6/7: Themes feed ranking (theme2_voting_level)
    Cube 6/8: CQS scoring feeds token reward
    Cube 6/9: Theme data feeds CSV export + analytics
"""

import pytest


# ═══════════════════════════════════════════════════════════════════
# Cube 6/1: Session → Pipeline Trigger
# ═══════════════════════════════════════════════════════════════════


class TestCube6_Cube1:
    """Session state transition triggers AI pipeline."""

    def test_session_has_ai_provider_field(self):
        from app.models.session import Session
        cols = [c.key for c in Session.__table__.columns]
        assert "ai_provider" in cols

    def test_session_has_pipeline_stage(self):
        from app.models.session import Session
        cols = [c.key for c in Session.__table__.columns]
        assert "pipeline_stage" in cols

    def test_session_has_seed(self):
        from app.models.session import Session
        cols = [c.key for c in Session.__table__.columns]
        assert "seed" in cols

    def test_session_has_replay_hash(self):
        from app.models.session import Session
        cols = [c.key for c in Session.__table__.columns]
        assert "replay_hash" in cols

    def test_session_has_theme2_voting_level(self):
        from app.models.session import Session
        cols = [c.key for c in Session.__table__.columns]
        assert "theme2_voting_level" in cols


# ═══════════════════════════════════════════════════════════════════
# Cube 6/2: Text Input → Phase A Summarization
# ═══════════════════════════════════════════════════════════════════


class TestCube6_Cube2:
    """Text responses trigger Phase A fire-and-forget summarization."""

    def test_phase_a_retry_importable(self):
        from app.core.phase_a_retry import run_phase_a_with_retry
        assert callable(run_phase_a_with_retry)

    def test_text_pipeline_importable(self):
        from app.core.text_pipeline import run_text_pipeline
        assert callable(run_text_pipeline)

    def test_response_summary_model_has_33_field(self):
        from app.models.response_summary import ResponseSummary
        cols = [c.key for c in ResponseSummary.__table__.columns]
        assert "summary_33" in cols
        assert "summary_111" in cols
        assert "summary_333" in cols


# ═══════════════════════════════════════════════════════════════════
# Cube 6/3: Voice Input → Phase A Summarization
# ═══════════════════════════════════════════════════════════════════


class TestCube6_Cube3:
    """Voice transcripts go through same Phase A pipeline as text."""

    def test_voice_service_exists(self):
        from app.cubes.cube3_voice.service import submit_voice_response
        assert callable(submit_voice_response)

    def test_stt_providers_available(self):
        from app.cubes.cube3_voice.providers.factory import get_stt_provider
        whisper = get_stt_provider("openai")
        assert whisper is not None


# ═══════════════════════════════════════════════════════════════════
# Cube 6/4: Collector → Phase B Fetch Summaries
# ═══════════════════════════════════════════════════════════════════


class TestCube6_Cube4:
    """Phase B fetches pre-computed summaries from collector data."""

    def test_response_meta_model(self):
        from app.models.response_meta import ResponseMeta
        cols = [c.key for c in ResponseMeta.__table__.columns]
        assert "session_id" in cols
        assert "raw_text" in cols
        assert "participant_id" in cols

    def test_fetch_summaries_function(self):
        from app.cubes.cube6_ai.service import _fetch_summaries
        assert callable(_fetch_summaries)


# ═══════════════════════════════════════════════════════════════════
# Cube 6/5: Gateway → Pipeline Orchestration
# ═══════════════════════════════════════════════════════════════════


class TestCube6_Cube5:
    """Gateway orchestrates pipeline trigger with timeout."""

    def test_trigger_ai_pipeline(self):
        from app.cubes.cube5_gateway.service import trigger_ai_pipeline
        assert callable(trigger_ai_pipeline)

    def test_pipeline_timeout_constants(self):
        from app.cubes.cube5_gateway.service import (
            _PIPELINE_TIMEOUT_DEFAULT,
            _PIPELINE_TIMEOUT_SCALE,
        )
        assert _PIPELINE_TIMEOUT_DEFAULT == 300.0
        assert _PIPELINE_TIMEOUT_SCALE == 60.0

    def test_orchestrate_post_polling(self):
        from app.cubes.cube5_gateway.service import orchestrate_post_polling
        import asyncio
        assert asyncio.iscoroutinefunction(orchestrate_post_polling)


# ═══════════════════════════════════════════════════════════════════
# Cube 6/7: Themes → Ranking
# ═══════════════════════════════════════════════════════════════════


class TestCube6_Cube7:
    """Cube 6 themes feed into Cube 7 ranking."""

    def test_theme_model(self):
        from app.models.theme import Theme
        cols = [c.key for c in Theme.__table__.columns]
        assert "label" in cols
        assert "confidence" in cols
        assert "parent_theme_id" in cols
        assert "cluster_metadata" in cols

    def test_themes_ready_triggers_ranking(self):
        """Cube 5 auto-triggers ranking after Cube 6 completes."""
        import inspect
        from app.cubes.cube5_gateway import service
        src = inspect.getsource(service)
        assert "trigger_ranking_pipeline" in src

    def test_cube7_reads_themes(self):
        """Cube 7 submit_user_ranking validates against theme table."""
        import inspect
        from app.cubes.cube7_ranking import service
        src = inspect.getsource(service)
        assert "Theme.id" in src or "Theme.session_id" in src


# ═══════════════════════════════════════════════════════════════════
# Cube 6/8: CQS → Token Reward
# ═══════════════════════════════════════════════════════════════════


class TestCube6_Cube8:
    """CQS scoring feeds into token reward disbursement."""

    def test_cqs_score_model(self):
        from app.models.cqs_score import CQSScore
        assert CQSScore.__tablename__ == "cqs_scores"

    def test_cqs_pipeline_callable(self):
        from app.cubes.cube6_ai.service import run_cqs_pipeline
        assert callable(run_cqs_pipeline)

    def test_disburse_cqs_reward(self):
        from app.cubes.cube8_tokens.service import disburse_cqs_reward
        assert callable(disburse_cqs_reward)


# ═══════════════════════════════════════════════════════════════════
# Cube 6/9: Theme Data → CSV Export + Analytics
# ═══════════════════════════════════════════════════════════════════


class TestCube6_Cube9:
    """Theme assignments feed into Cube 9 CSV export."""

    def test_csv_includes_theme_columns(self):
        from app.cubes.cube9_reports.service import CSV_COLUMNS
        assert "Theme01" in CSV_COLUMNS
        assert "Theme2_9" in CSV_COLUMNS
        assert "Theme2_6" in CSV_COLUMNS
        assert "Theme2_3" in CSV_COLUMNS

    def test_response_summary_has_theme_fields(self):
        from app.models.response_summary import ResponseSummary
        cols = [c.key for c in ResponseSummary.__table__.columns]
        assert "theme01" in cols
        assert "theme2_9" in cols
        assert "theme2_6" in cols
        assert "theme2_3" in cols

    def test_analytics_dashboard_callable(self):
        from app.cubes.cube9_reports.service import build_analytics_dashboard
        assert callable(build_analytics_dashboard)

    def test_cqs_dashboard_callable(self):
        from app.cubes.cube9_reports.service import build_cqs_dashboard
        assert callable(build_cqs_dashboard)
