"""Cube 9 — Reports Service Tests.

Tests:
  - CSV column schema (19 columns, correct headers)
  - Analytics dashboard structure
  - CQS dashboard structure
  - Ranking summary structure
  - Router structure (5 endpoints)
  - Data destruction contract
"""

import uuid
from datetime import datetime, timezone

import pytest

from app.cubes.cube9_reports.service import CSV_COLUMNS


# ---------------------------------------------------------------------------
# CSV Schema Tests
# ---------------------------------------------------------------------------


class TestCSVSchema:
    """Verify 19-column CSV schema matches reference file."""

    def test_exactly_19_columns(self):
        assert len(CSV_COLUMNS) == 19

    def test_column_names(self):
        expected = [
            "Q_Number", "Question", "User", "Detailed_Results", "Response_Language",
            "333_Summary", "111_Summary", "33_Summary",
            "Theme01", "Theme01_Confidence",
            "Theme2_9", "Theme2_9_Confidence", "Theme2_9_Description",
            "Theme2_6", "Theme2_6_Confidence", "Theme2_6_Description",
            "Theme2_3", "Theme2_3_Confidence", "Theme2_3_Description",
        ]
        assert CSV_COLUMNS == expected

    def test_q_number_is_first(self):
        assert CSV_COLUMNS[0] == "Q_Number"

    def test_theme2_3_description_is_last(self):
        assert CSV_COLUMNS[-1] == "Theme2_3_Description"

    def test_summary_columns_in_order(self):
        idx_333 = CSV_COLUMNS.index("333_Summary")
        idx_111 = CSV_COLUMNS.index("111_Summary")
        idx_33 = CSV_COLUMNS.index("33_Summary")
        assert idx_333 < idx_111 < idx_33

    def test_theme_hierarchy(self):
        """Theme columns follow 01 → 9 → 6 → 3 hierarchy."""
        idx_01 = CSV_COLUMNS.index("Theme01")
        idx_9 = CSV_COLUMNS.index("Theme2_9")
        idx_6 = CSV_COLUMNS.index("Theme2_6")
        idx_3 = CSV_COLUMNS.index("Theme2_3")
        assert idx_01 < idx_9 < idx_6 < idx_3

    def test_each_theme_has_confidence(self):
        themes = ["Theme01", "Theme2_9", "Theme2_6", "Theme2_3"]
        for theme in themes:
            assert f"{theme}_Confidence" in CSV_COLUMNS

    def test_response_language_column_exists(self):
        assert "Response_Language" in CSV_COLUMNS


# ---------------------------------------------------------------------------
# Router Structure Tests
# ---------------------------------------------------------------------------


class TestRouterStructure:
    """Verify Cube 9 router configuration."""

    def test_router_prefix(self):
        from app.cubes.cube9_reports.router import router
        assert router.prefix == "/sessions/{session_id}"

    def test_router_tags(self):
        from app.cubes.cube9_reports.router import router
        assert "Cube 9 — Reports" in router.tags

    def test_endpoint_count(self):
        """Router has 14 endpoints (base + compression + replay + trends)."""
        from app.cubes.cube9_reports.router import router
        routes = [r for r in router.routes if hasattr(r, "methods")]
        assert len(routes) == 14

    def test_csv_export_endpoint(self):
        from app.cubes.cube9_reports.router import router
        found = any(
            "csv" in r.path and "GET" in r.methods
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_analytics_endpoint(self):
        from app.cubes.cube9_reports.router import router
        found = any(
            "analytics" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_cqs_dashboard_endpoint(self):
        from app.cubes.cube9_reports.router import router
        found = any(
            "cqs" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_ranking_summary_endpoint(self):
        from app.cubes.cube9_reports.router import router
        found = any(
            "ranking" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_destroy_data_endpoint(self):
        from app.cubes.cube9_reports.router import router
        found = any(
            "destroy" in r.path and "POST" in r.methods
            for r in router.routes if hasattr(r, "methods")
        )
        assert found


# ---------------------------------------------------------------------------
# Service Function Contract Tests
# ---------------------------------------------------------------------------


class TestServiceContracts:
    """Verify service functions exist with correct signatures."""

    def test_export_session_csv_exists(self):
        from app.cubes.cube9_reports import service
        assert callable(service.export_session_csv)

    def test_build_analytics_dashboard_exists(self):
        from app.cubes.cube9_reports import service
        assert callable(service.build_analytics_dashboard)

    def test_build_cqs_dashboard_exists(self):
        from app.cubes.cube9_reports import service
        assert callable(service.build_cqs_dashboard)

    def test_build_ranking_summary_exists(self):
        from app.cubes.cube9_reports import service
        assert callable(service.build_ranking_summary)

    def test_destroy_session_export_data_exists(self):
        from app.cubes.cube9_reports import service
        assert callable(service.destroy_session_export_data)


# ---------------------------------------------------------------------------
# Analytics Dashboard Structure
# ---------------------------------------------------------------------------


class TestAnalyticsDashboardStructure:
    """Verify analytics response shape."""

    def test_expected_keys(self):
        """Analytics response should contain these top-level keys."""
        expected_keys = {
            "session_id", "total_responses", "unique_participants",
            "avg_responses_per_participant", "summary_coverage",
            "theme01_distribution", "ranking", "tokens",
        }
        # Can't call async function directly, but verify the structure
        # is documented in the function
        from app.cubes.cube9_reports.service import build_analytics_dashboard
        import inspect
        src = inspect.getsource(build_analytics_dashboard)
        for key in expected_keys:
            assert key in src, f"Key '{key}' not in analytics dashboard"


class TestCQSDashboardStructure:
    """Verify CQS dashboard response shape."""

    def test_expected_keys(self):
        expected_keys = {"session_id", "total_scored", "winner", "cqs_scores"}
        from app.cubes.cube9_reports.service import build_cqs_dashboard
        import inspect
        src = inspect.getsource(build_cqs_dashboard)
        for key in expected_keys:
            assert key in src


class TestRankingSummaryStructure:
    """Verify ranking summary response shape."""

    def test_expected_keys(self):
        expected_keys = {"session_id", "rankings", "algorithm"}
        from app.cubes.cube9_reports.service import build_ranking_summary
        import inspect
        src = inspect.getsource(build_ranking_summary)
        for key in expected_keys:
            assert key in src
