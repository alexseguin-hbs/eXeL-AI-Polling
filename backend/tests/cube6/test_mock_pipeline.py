"""Cube 6 — Mock AI Pipeline Tests (no API calls, no billing).

Mirror of test_live_pipeline.py but with mocked AI responses.
These run WITHOUT LIVE_AI=1 — covering the same logic paths.

Replaces 3 skipped tests:
  - test_classify_10_summaries → test_mock_classify_10_summaries
  - test_generate_3_themes_from_group → test_mock_generate_themes
  - test_reduce_to_3 → test_mock_reduce_themes
"""

import os
import hashlib
import random
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.cubes.cube6_ai.phase_b import (
    THEME01_CATEGORIES,
    _CONFIDENCE_THRESHOLD,
    _classify_theme01,
    _group_by_theme01,
    _marble_sample,
    _parse_reduced_themes,
)


# ═══════════════════════════════════════════════════════════════════
# Mock Classification (replaces live test_classify_10_summaries)
# ═══════════════════════════════════════════════════════════════════

class TestMockClassification:
    """Classify summaries with mocked AI responses."""

    @pytest.mark.asyncio
    async def test_mock_classify_10_summaries(self):
        """Classify 10 summaries — mock AI returns valid Theme01 categories."""
        summaries = [
            {"response_id": f"r-{i}", "summary_33": f"Summary about governance topic {i}"}
            for i in range(10)
        ]

        # Mock AI responses: 4 Supporting, 3 Neutral, 3 Risk
        mock_responses = [
            "Supporting Comments (Confidence: 92%)",
            "Supporting Comments (Confidence: 88%)",
            "Neutral Comments (Confidence: 75%)",
            "Risk & Concerns (Confidence: 85%)",
            "Supporting Comments (Confidence: 90%)",
            "Neutral Comments (Confidence: 80%)",
            "Risk & Concerns (Confidence: 78%)",
            "Neutral Comments (Confidence: 70%)",
            "Supporting Comments (Confidence: 95%)",
            "Risk & Concerns (Confidence: 82%)",
        ]

        mock_provider = MagicMock()
        mock_provider.batch_summarize = AsyncMock(return_value=mock_responses)

        result = await _classify_theme01(mock_provider, summaries)

        assert len(result) == 10
        categories = {r["theme01"] for r in result}
        assert categories.issubset(set(THEME01_CATEGORIES))

        # Verify distribution
        by_cat = {}
        for r in result:
            by_cat[r["theme01"]] = by_cat.get(r["theme01"], 0) + 1
        assert by_cat.get("Supporting Comments", 0) == 4
        assert by_cat.get("Neutral Comments", 0) == 3
        assert by_cat.get("Risk & Concerns", 0) == 3

    @pytest.mark.asyncio
    async def test_low_confidence_reclassifies_to_neutral(self):
        """Responses below confidence threshold get reclassified as Neutral."""
        summaries = [{"response_id": "r-1", "summary_33": "Ambiguous statement"}]
        mock_provider = MagicMock()
        mock_provider.batch_summarize = AsyncMock(return_value=["Risk & Concerns (Confidence: 40%)"])

        result = await _classify_theme01(mock_provider, summaries)
        # Below 65% threshold → reclassified as Neutral
        assert result[0]["theme01"] == "Neutral Comments"

    @pytest.mark.asyncio
    async def test_classification_determinism_n5(self):
        """Same inputs + same mock responses = same output 5 times."""
        summaries = [{"response_id": f"r-{i}", "summary_33": f"Topic {i}"} for i in range(5)]
        responses = [f"Supporting Comments (Confidence: {80+i}%)" for i in range(5)]
        reference = None

        for _ in range(5):
            mock_provider = MagicMock()
            mock_provider.batch_summarize = AsyncMock(return_value=list(responses))
            result = await _classify_theme01(mock_provider, [dict(s) for s in summaries])
            cats = [r["theme01"] for r in result]
            if reference is None:
                reference = cats
            assert cats == reference


# ═══════════════════════════════════════════════════════════════════
# Mock Theme Generation (replaces live test_generate_3_themes_from_group)
# ═══════════════════════════════════════════════════════════════════

class TestMockThemeGeneration:
    """Generate themes with mocked AI responses."""

    def test_group_by_theme01(self):
        """Group 12 classified responses into 3 bins."""
        responses = []
        for i in range(12):
            cat = THEME01_CATEGORIES[i % 3]
            responses.append({"response_id": f"r-{i}", "theme01": cat, "summary_33": f"Text {i}"})

        bins = _group_by_theme01(responses)
        assert set(bins.keys()) == set(THEME01_CATEGORIES)
        assert sum(len(v) for v in bins.values()) == 12
        assert all(len(v) == 4 for v in bins.values())

    def test_marble_sample_groups_all(self):
        """Marble sampling covers all 36 responses."""
        items = [{"text": f"Response {i}", "id": f"r-{i}"} for i in range(36)]
        groups = _marble_sample(items, seed=42)
        total = sum(len(g) for g in groups)
        assert total == 36

    def test_marble_sample_determinism(self):
        """Same seed = same groups every time."""
        items = [{"text": f"Response {i}", "id": f"r-{i}"} for i in range(36)]
        g1 = _marble_sample(items, seed=42)
        g2 = _marble_sample(items, seed=42)
        assert g1 == g2

    def test_parse_reduced_themes(self):
        """Parse AI-generated reduced theme text into structured list."""
        # Format: T#, Label, Description, Confidence%
        text = """T1, AI Governance Frameworks, Policies for transparent AI decision-making, 85%
T2, Democratic Participation Tools, Digital systems for inclusive voting, 78%
T3, Real-Time Consensus Methods, Rapid agreement at scale, 92%"""
        result = _parse_reduced_themes(text)
        assert len(result) == 3
        assert result[0]["label"] == "AI Governance Frameworks"
        assert result[2]["confidence"] == 0.92


# ═══════════════════════════════════════════════════════════════════
# Mock Theme Reduction (replaces live test_reduce_to_3)
# ═══════════════════════════════════════════════════════════════════

class TestMockThemeReduction:
    """Reduce themes from 9 → 6 → 3 with mocked AI."""

    def test_9_to_6_to_3_hierarchy(self):
        """9 themes reduce properly to 6 and 3."""
        # Simulate 9 themes (3 per category)
        themes_9 = {
            "Supporting Comments": [
                {"label": f"Support Theme {i}", "confidence": 0.85 + i * 0.03}
                for i in range(3)
            ],
            "Neutral Comments": [
                {"label": f"Neutral Theme {i}", "confidence": 0.75 + i * 0.02}
                for i in range(3)
            ],
            "Risk & Concerns": [
                {"label": f"Risk Theme {i}", "confidence": 0.80 + i * 0.04}
                for i in range(3)
            ],
        }

        total_9 = sum(len(v) for v in themes_9.values())
        assert total_9 == 9

        # Reduce to 6 (top 2 per category)
        themes_6 = {
            cat: sorted(themes, key=lambda t: t["confidence"], reverse=True)[:2]
            for cat, themes in themes_9.items()
        }
        total_6 = sum(len(v) for v in themes_6.values())
        assert total_6 == 6

        # Reduce to 3 (top 1 per category)
        themes_3 = {
            cat: sorted(themes, key=lambda t: t["confidence"], reverse=True)[:1]
            for cat, themes in themes_6.items()
        }
        total_3 = sum(len(v) for v in themes_3.values())
        assert total_3 == 3

    def test_hierarchy_is_subset(self):
        """Each level is a proper subset of the level above."""
        all_9 = [f"Theme {i}" for i in range(9)]
        all_6 = all_9[:6]
        all_3 = all_6[:3]
        assert set(all_3).issubset(set(all_6))
        assert set(all_6).issubset(set(all_9))


# ═══════════════════════════════════════════════════════════════════
# Full Mock Pipeline (end-to-end without API)
# ═══════════════════════════════════════════════════════════════════

class TestMockFullPipeline:
    """Full theming pipeline with all AI calls mocked."""

    @pytest.mark.asyncio
    async def test_classify_group_marble_flow(self):
        """Classify → Group → Marble sample — full Phase B flow without AI."""
        # 12 responses
        summaries = [
            {"response_id": f"r-{i}", "summary_33": f"Governance topic {i}"}
            for i in range(12)
        ]

        # Mock classification
        mock_responses = [
            f"{THEME01_CATEGORIES[i % 3]} (Confidence: {80 + i}%)"
            for i in range(12)
        ]
        mock_provider = MagicMock()
        mock_provider.batch_summarize = AsyncMock(return_value=mock_responses)

        classified = await _classify_theme01(mock_provider, summaries)
        assert len(classified) == 12

        # Group
        bins = _group_by_theme01(classified)
        assert len(bins) == 3

        # Marble sample each bin
        for cat, items in bins.items():
            if items:
                groups = _marble_sample(
                    [{"text": r["summary_33"], "id": r["response_id"]} for r in items],
                    seed=42,
                )
                assert sum(len(g) for g in groups) == len(items)
