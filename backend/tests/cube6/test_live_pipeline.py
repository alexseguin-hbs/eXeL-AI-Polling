"""Cube 6 — Live E2E Pipeline Test Against Real AI APIs.

    Uses the 5000-response CSV dataset and real OpenAI API to verify:
    1. Theme01 classification (Risk/Supporting/Neutral)
    2. Marble sampling (deterministic groups of 10)
    3. Theme generation (3 themes per group)
    4. Theme reduction (all → 9 → 6 → 3)

    Run with: LIVE_AI=1 pytest tests/cube6/test_live_pipeline.py -v -s

    Cost estimate: ~$0.05-0.10 per run (10 sample classifications + 3 reductions)
"""

import os
import sys
from pathlib import Path

import pandas as pd
import pytest

# Gate: skip unless LIVE_AI=1
_skip = pytest.mark.skipif(
    os.getenv("LIVE_AI", "") != "1",
    reason="Live AI pipeline tests require LIVE_AI=1 (calls real APIs with billing)",
)

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

CSV_PATH = "/home/alex/eXeL-AI-Polling/Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv"


@pytest.fixture(scope="module")
def csv_data():
    """Load the 5000-response reference dataset."""
    return pd.read_csv(CSV_PATH)


@pytest.fixture(scope="module")
def sample_summaries(csv_data):
    """10 random 33-word summaries for classification testing."""
    return csv_data["33_Summary"].dropna().sample(10, random_state=42).tolist()


# ═══════════════════════════════════════════════════════════════════
# Phase B Step 2: Theme01 Classification (Real API)
# ═══════════════════════════════════════════════════════════════════


class TestLiveClassification:
    """Classify 33-word summaries into Risk/Supporting/Neutral using real AI."""

    @_skip
    @pytest.mark.asyncio
    async def test_classify_10_summaries(self, sample_summaries):
        """Classify 10 summaries — each should return a valid Theme01 category."""
        from app.cubes.cube6_ai.providers.factory import get_summarization_provider

        provider = get_summarization_provider("openai")

        valid_categories = {"Risk & Concerns", "Supporting Comments", "Neutral Comments"}
        results = []

        for i, summary in enumerate(sample_summaries):
            instruction = (
                "Classify this text into exactly ONE category: "
                "'Risk & Concerns', 'Supporting Comments', or 'Neutral Comments'. "
                "Reply with ONLY the category name followed by confidence as XX%. "
                "Example: 'Risk & Concerns 85%'"
            )
            try:
                result = await provider.summarize(
                    [f"INPUT: {summary[:500]}"],
                    instruction=instruction,
                )
                # Parse category
                category = None
                for cat in valid_categories:
                    if cat.lower() in result.lower():
                        category = cat
                        break

                results.append({
                    "index": i,
                    "summary": summary[:80],
                    "raw_result": result.strip(),
                    "category": category,
                })
                print(f"  [{i+1}/10] {category or 'UNKNOWN'}: {result.strip()[:60]}")
            except Exception as e:
                print(f"  [{i+1}/10] ERROR: {e}")
                results.append({"index": i, "error": str(e)})

        # At least 80% should successfully classify
        classified = [r for r in results if r.get("category")]
        print(f"\n  Classified: {len(classified)}/10")
        assert len(classified) >= 8, f"Only {len(classified)}/10 classified"

        # All classified should be valid categories
        for r in classified:
            assert r["category"] in valid_categories


# ═══════════════════════════════════════════════════════════════════
# Phase B Step 4: Marble Sampling (Deterministic, No API)
# ═══════════════════════════════════════════════════════════════════


class TestLiveMarbleSampling:
    """Marble sampling on real 5000-response data."""

    def test_marble_sample_from_csv(self, csv_data):
        """Sample real data into groups of 10, verify determinism."""
        from app.cubes.cube6_ai.service import _marble_sample

        # Get Risk & Concerns responses
        risk_summaries = csv_data[csv_data["Theme01"] == "Risk & Concerns"]["33_Summary"].tolist()
        responses = [{"summary_33": s, "response_id": f"r{i}"} for i, s in enumerate(risk_summaries)]

        groups_1 = _marble_sample(responses, seed=42)
        groups_2 = _marble_sample(responses, seed=42)

        assert len(groups_1) == len(groups_2)
        assert len(groups_1) > 0

        # Same seed = same groups (deterministic)
        for g1, g2 in zip(groups_1, groups_2):
            ids_1 = [r["response_id"] for r in g1]
            ids_2 = [r["response_id"] for r in g2]
            assert ids_1 == ids_2

        # Each group has <= 10 items
        for g in groups_1:
            assert len(g) <= 10

        print(f"\n  Risk responses: {len(risk_summaries)}")
        print(f"  Marble groups: {len(groups_1)}")
        print(f"  Group sizes: {[len(g) for g in groups_1[:5]]}...")

    def test_all_three_bins(self, csv_data):
        """All 3 Theme01 categories produce marble groups."""
        from app.cubes.cube6_ai.service import _group_by_theme01, _parallel_marble_sample
        import asyncio

        responses = []
        for _, row in csv_data.iterrows():
            responses.append({
                "summary_33": row["33_Summary"],
                "theme01": row["Theme01"],
                "response_id": f"r{_}",
            })

        bins = _group_by_theme01(responses)

        for cat, items in bins.items():
            print(f"  {cat}: {len(items)} responses")
            assert len(items) > 0, f"Empty bin: {cat}"


# ═══════════════════════════════════════════════════════════════════
# Phase B Step 5: Theme Generation (Real API, 1 group)
# ═══════════════════════════════════════════════════════════════════


class TestLiveThemeGeneration:
    """Generate themes from a single marble group using real AI."""

    @_skip
    @pytest.mark.asyncio
    async def test_generate_3_themes_from_group(self, csv_data):
        """Take 10 real summaries, generate 3 candidate themes."""
        from app.cubes.cube6_ai.providers.factory import get_summarization_provider
        from app.cubes.cube6_ai.service import _generate_themes_for_group

        provider = get_summarization_provider("openai")

        # Build a group of 10 real responses
        risk_summaries = csv_data[csv_data["Theme01"] == "Risk & Concerns"]["33_Summary"].head(10).tolist()
        group = [{"summary_33": s} for s in risk_summaries]

        themes = await _generate_themes_for_group(provider, group, "RISK")

        print(f"\n  Generated themes ({len(themes)}):")
        for t in themes:
            print(f"    - {t}")

        assert len(themes) >= 1, "Should generate at least 1 theme"
        assert len(themes) <= 5, f"Too many themes: {len(themes)}"


# ═══════════════════════════════════════════════════════════════════
# Phase B Step 6: Theme Reduction (Real API)
# ═══════════════════════════════════════════════════════════════════


class TestLiveThemeReduction:
    """Reduce themes using real AI: many → 9 → 6 → 3."""

    @_skip
    @pytest.mark.asyncio
    async def test_reduce_to_3(self):
        """Take 12 candidate themes, reduce to 3."""
        from app.cubes.cube6_ai.providers.factory import get_summarization_provider

        provider = get_summarization_provider("openai")

        candidates = [
            "Privacy Protection Imperatives",
            "Algorithmic Bias Risks",
            "Regulatory Framework Needs",
            "Security Vulnerability Concerns",
            "Data Sovereignty Issues",
            "Transparency Demands",
            "Employment Displacement Fears",
            "Accountability Gap",
            "Digital Divide Deepening",
            "Surveillance Expansion Risks",
            "Consent Erosion",
            "Democratic Process Threats",
        ]

        instruction = (
            "You are an AI expert at reducing RISK themes. Reduce this list to "
            "exactly 3 unique themes, each with a 5-word name and 7-12 word "
            "description. Reply in CSV format: T_Number, Theme, T_Description, Confidence (XX%)."
        )

        themes_str = "\n".join(candidates)
        result = await provider.summarize(
            [f"Reduce these themes to 3:\n{themes_str}"],
            instruction=instruction,
        )

        print(f"\n  Reduction result:\n{result}")

        # Should contain at least 1 line with comma-separated values
        lines = [l for l in result.strip().split("\n") if "," in l]
        assert len(lines) >= 2, f"Expected 3 reduced themes, got {len(lines)} lines"


# ═══════════════════════════════════════════════════════════════════
# CSV Data Integrity (Always runs, no API)
# ═══════════════════════════════════════════════════════════════════


class TestCSVDataIntegrity:
    """Verify the 5000 CSV is valid for pipeline processing."""

    def test_5000_rows(self, csv_data):
        assert len(csv_data) == 5000

    def test_all_33_summaries_present(self, csv_data):
        assert csv_data["33_Summary"].notna().sum() == 5000

    def test_theme01_all_three_categories(self, csv_data):
        cats = set(csv_data["Theme01"].unique())
        assert "Risk & Concerns" in cats
        assert "Supporting Comments" in cats
        assert "Neutral Comments" in cats

    def test_theme01_confidence_present(self, csv_data):
        assert csv_data["Theme01_Confidence"].notna().sum() > 4900

    def test_theme2_hierarchy_complete(self, csv_data):
        for col in ["Theme2_9", "Theme2_6", "Theme2_3"]:
            assert csv_data[col].notna().sum() > 4000, f"{col} has too many nulls"

    def test_response_language_present(self, csv_data):
        assert "Response_Language" in csv_data.columns
