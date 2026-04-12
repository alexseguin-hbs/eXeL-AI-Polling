"""Cube 10 — Saved CSV Dataset Verification.

Verifies the 3 simulated use case CSVs + DEMO match the 19-column schema
and integrate with SavedUseCaseManager correctly.
"""

import os
from pathlib import Path

import pandas as pd
import pytest

from app.cubes.cube9_reports.service import CSV_COLUMNS
from app.cubes.cube10_simulation.saved_use_cases import (
    DEMO_DATASET,
    SavedUseCase,
    SavedUseCaseManager,
)

FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"
DEMO_PATH = Path("/home/alex/eXeL-AI-Polling/Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv")

DATASETS = [
    ("sim_use_case_1000.csv", 1000, "Q1 strategic priority"),
    ("sim_use_case_40000.csv", 40001, "Austin transportation"),
    ("sim_use_case_1111111.csv", 111112, "Humanity 2026"),
]


class TestDatasetFilesExist:
    def test_sim_1000_exists(self):
        assert (FIXTURES / "sim_use_case_1000.csv").exists()

    def test_sim_40000_exists(self):
        assert (FIXTURES / "sim_use_case_40000.csv").exists()

    def test_sim_1111111_exists(self):
        assert (FIXTURES / "sim_use_case_1111111.csv").exists()

    def test_demo_exists(self):
        assert DEMO_PATH.exists()


class TestDatasetSchema:
    """All datasets must have exactly 19 columns matching CSV_COLUMNS."""

    @pytest.mark.parametrize("fname,expected_rows,_", DATASETS)
    def test_column_count(self, fname, expected_rows, _):
        df = pd.read_csv(FIXTURES / fname)
        assert len(df.columns) == 19

    @pytest.mark.parametrize("fname,expected_rows,_", DATASETS)
    def test_column_names_match(self, fname, expected_rows, _):
        df = pd.read_csv(FIXTURES / fname)
        assert list(df.columns) == CSV_COLUMNS

    @pytest.mark.parametrize("fname,expected_rows,_", DATASETS)
    def test_row_count(self, fname, expected_rows, _):
        df = pd.read_csv(FIXTURES / fname)
        assert len(df) == expected_rows

    def test_demo_column_names(self):
        df = pd.read_csv(DEMO_PATH)
        assert list(df.columns) == CSV_COLUMNS

    def test_demo_row_count(self):
        df = pd.read_csv(DEMO_PATH)
        assert len(df) == 5000


class TestDatasetContent:
    """Verify realistic content in generated datasets."""

    @pytest.mark.parametrize("fname,_,__", DATASETS)
    def test_theme01_distribution(self, fname, _, __):
        df = pd.read_csv(FIXTURES / fname)
        dist = df["Theme01"].value_counts()
        for cat in ["Risk & Concerns", "Supporting Comments", "Neutral Comments"]:
            assert cat in dist.index, f"Missing {cat} in {fname}"
            assert dist[cat] > 50, f"Too few {cat} in {fname}: {dist[cat]}"

    @pytest.mark.parametrize("fname,_,__", DATASETS)
    def test_all_summaries_populated(self, fname, _, __):
        df = pd.read_csv(FIXTURES / fname)
        assert df["33_Summary"].notna().sum() == len(df)
        assert df["333_Summary"].notna().sum() == len(df)

    @pytest.mark.parametrize("fname,_,__", DATASETS)
    def test_confidence_format(self, fname, _, __):
        df = pd.read_csv(FIXTURES / fname)
        for val in df["Theme01_Confidence"].head(10):
            assert str(val).endswith("%")

    @pytest.mark.parametrize("fname,_,__", DATASETS)
    def test_multilingual(self, fname, _, __):
        df = pd.read_csv(FIXTURES / fname)
        langs = df["Response_Language"].unique()
        assert "en" in langs
        assert len(langs) >= 2, f"Only {langs} in {fname}"


class TestManagerIntegration:
    """SavedUseCaseManager with real CSV metadata."""

    def test_load_all_three_plus_demo(self):
        mgr = SavedUseCaseManager()
        cases = [
            SavedUseCase(id="case1", session_id="s1", session_code="SIM1000",
                        title="Q1 Strategy", response_count=1000,
                        participant_count=800, theme_count=9,
                        theme2_voting_level="theme2_3", ai_provider="openai"),
            SavedUseCase(id="case2", session_id="s2", session_code="SIM40K",
                        title="Austin Transit", response_count=40000,
                        participant_count=35000, theme_count=9,
                        theme2_voting_level="theme2_6", ai_provider="gemini"),
            SavedUseCase(id="case3", session_id="s3", session_code="SIM1M",
                        title="Humanity 2026", response_count=1111111,
                        participant_count=900000, theme_count=9,
                        theme2_voting_level="theme2_9", ai_provider="openai"),
        ]
        for c in cases:
            mgr.add_live_case(c)

        assert len(mgr.live_cases) == 3
        assert mgr.demo is not None
        assert mgr.total_responses == 5000 + 1000 + 40000 + 1111111

    def test_new_poll_drops_smallest(self):
        """The exact scenario: [1.1M, 40K, 1K] + 555K → drop 1K."""
        mgr = SavedUseCaseManager()
        mgr.add_live_case(SavedUseCase(
            id="c1", session_id="s1", session_code="S1",
            title="Small", response_count=1000,
            participant_count=800, theme_count=9,
            theme2_voting_level="theme2_3", ai_provider="openai"))
        mgr.add_live_case(SavedUseCase(
            id="c2", session_id="s2", session_code="S2",
            title="Medium", response_count=40000,
            participant_count=35000, theme_count=9,
            theme2_voting_level="theme2_3", ai_provider="openai"))
        mgr.add_live_case(SavedUseCase(
            id="c3", session_id="s3", session_code="S3",
            title="Large", response_count=1111111,
            participant_count=900000, theme_count=9,
            theme2_voting_level="theme2_3", ai_provider="openai"))

        # New poll: 444,444 users, 555,555 responses
        new = SavedUseCase(
            id="c4", session_id="s4", session_code="S4",
            title="New Live", response_count=555555,
            participant_count=444444, theme_count=9,
            theme2_voting_level="theme2_3", ai_provider="openai")
        dropped = mgr.add_live_case(new)

        assert dropped.response_count == 1000
        live = mgr.live_cases
        assert live[0].response_count == 1111111
        assert live[1].response_count == 555555
        assert live[2].response_count == 40000
