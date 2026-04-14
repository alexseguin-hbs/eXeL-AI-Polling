"""Cross-Cube Event Chain Verification.

    ╔═══════════════════════════════════════════════════════════════╗
    ║  Proves the full governance pipeline is connected:           ║
    ║                                                               ║
    ║  Cube 1 → 2/3 → 4 → 5 → 6 → 7 → 8 → 9                    ║
    ║  Session  Input  Collect  Gate  AI  Rank  Token  Report      ║
    ║                                                               ║
    ║  Every cube's service module is importable and callable.      ║
    ║  Every upstream→downstream dependency resolves.               ║
    ╚═══════════════════════════════════════════════════════════════╝
"""

import pytest


class TestCubeChainImports:
    """Every cube service imports and exposes key functions."""

    def test_cube1_session(self):
        from app.cubes.cube1_session.service import create_session, join_session
        assert callable(create_session)
        assert callable(join_session)

    def test_cube2_text(self):
        from app.cubes.cube2_text.service import submit_text_response
        assert callable(submit_text_response)

    def test_cube3_voice(self):
        from app.cubes.cube3_voice.service import submit_voice_response
        assert callable(submit_voice_response)

    def test_cube4_collector(self):
        from app.cubes.cube4_collector.service import get_collected_responses
        assert callable(get_collected_responses)

    def test_cube5_gateway(self):
        from app.cubes.cube5_gateway.service import (
            trigger_ai_pipeline,
            trigger_ranking_pipeline,
            trigger_cqs_scoring,
        )
        assert callable(trigger_ai_pipeline)
        assert callable(trigger_ranking_pipeline)
        assert callable(trigger_cqs_scoring)

    def test_cube6_ai(self):
        from app.cubes.cube6_ai.service import run_pipeline, score_cqs
        assert callable(run_pipeline)
        assert callable(score_cqs)

    def test_cube7_ranking(self):
        from app.cubes.cube7_ranking.service import (
            submit_user_ranking,
            aggregate_rankings,
            run_ranking_pipeline,
            emit_ranking_complete,
        )
        assert callable(submit_user_ranking)
        assert callable(aggregate_rankings)
        assert callable(run_ranking_pipeline)
        assert callable(emit_ranking_complete)

    def test_cube7_scale_engine(self):
        from app.cubes.cube7_ranking.scale_engine import (
            BordaAccumulator,
            SupabaseVoteAccumulator,
            broadcast_to_all_shards,
            sample_responses,
        )
        assert callable(sample_responses)

    def test_cube8_tokens(self):
        from app.cubes.cube8_tokens.service import (
            create_ledger_entry,
            transition_lifecycle_state,
            disburse_cqs_reward,
            check_velocity_cap,
        )
        assert callable(create_ledger_entry)
        assert callable(disburse_cqs_reward)

    def test_cube9_reports(self):
        from app.cubes.cube9_reports.service import (
            export_session_csv,
            build_analytics_dashboard,
            build_cqs_dashboard,
            distribute_results,
            announce_reward_winner,
        )
        assert callable(export_session_csv)
        assert callable(distribute_results)

    def test_sdk_core(self):
        from app.core.sdk import (
            success, error, emit, EventType,
            CUBE_REGISTRY, get_cube_registry,
        )
        assert callable(success)
        assert len(CUBE_REGISTRY) == 12

    def test_cube6_scale_pipeline(self):
        from app.cubes.cube6_ai.scale_pipeline import (
            ScalePipelineConfig,
            cochran_sample_size,
            ThemeLibrary,
        )
        assert callable(cochran_sample_size)


class TestCubeChainDependencies:
    """Verify upstream→downstream dependency links exist in code."""

    def test_cube5_imports_cube6(self):
        """Cube 5 gateway triggers Cube 6 AI pipeline."""
        import inspect
        from app.cubes.cube5_gateway import service
        src = inspect.getsource(service)
        assert "cube6_ai.service" in src

    def test_cube5_triggers_cube7(self):
        """Cube 5 gateway triggers Cube 7 ranking pipeline."""
        import inspect
        from app.cubes.cube5_gateway import service
        src = inspect.getsource(service)
        assert "trigger_ranking_pipeline" in src

    def test_cube7_triggers_cube5_cqs(self):
        """Cube 7 emit_ranking_complete triggers CQS via Cube 5."""
        import inspect
        from app.cubes.cube7_ranking import ranking_governance
        src = inspect.getsource(ranking_governance)
        assert "trigger_cqs_scoring" in src

    def test_cube8_uses_broadcast(self):
        """Cube 8 broadcasts token events."""
        import inspect
        from app.cubes.cube8_tokens import service
        src = inspect.getsource(service)
        assert "broadcast_event" in src

    def test_cube9_imports_all_models(self):
        """Cube 9 can access all upstream data models."""
        from app.cubes.cube9_reports.service import (
            ResponseMeta, ResponseSummary, Question, Participant,
        )
        assert ResponseMeta.__tablename__ == "response_meta"


class TestEventTypesCoverAllCubes:
    """Every cube has at least one typed event in SDK."""

    def test_all_cubes_have_events(self):
        from app.core.sdk import EventType
        values = [et.value for et in EventType]
        prefixes = ["session.", "input.", "collection.", "pipeline.",
                    "ai.", "ranking.", "tokens.", "report."]
        for prefix in prefixes:
            assert any(v.startswith(prefix) for v in values), \
                f"No event with prefix '{prefix}'"


class TestScaleConstants:
    """Verify scale-related constants are consistent across cubes."""

    def test_pipeline_timeouts(self):
        from app.cubes.cube5_gateway.service import (
            _PIPELINE_TIMEOUT_DEFAULT,
            _PIPELINE_TIMEOUT_SCALE,
            _SCALE_THRESHOLD,
        )
        assert _PIPELINE_TIMEOUT_DEFAULT == 300.0
        assert _PIPELINE_TIMEOUT_SCALE == 60.0
        assert _SCALE_THRESHOLD == 1000

    def test_scale_pipeline_budget(self):
        from app.cubes.cube6_ai.scale_pipeline import ScalePipelineConfig
        cfg = ScalePipelineConfig()
        assert cfg.total_budget <= 65.0  # Under 60s + 5s grace

    def test_borda_accumulator_exists(self):
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
        acc = BordaAccumulator(n_themes=3, seed="test")
        acc.add_vote(["A", "B", "C"], "p1")
        assert acc.voter_count == 1

    def test_streaming_csv_exists(self):
        from app.cubes.cube9_reports.service import export_session_csv_streaming
        import inspect
        assert inspect.isasyncgenfunction(export_session_csv_streaming)
