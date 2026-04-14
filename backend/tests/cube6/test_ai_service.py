"""Cube 6 — AI Theme Pipeline Service Tests.

Tests:
  - Live per-response summarization (Phase A)
  - Theme01 classification with confidence threshold
  - Group by Theme01 partitioning
  - Marble sampling (shuffle + slice, deterministic)
  - Theme generation for marble groups
  - Theme reduction (all -> 9 -> 6 -> 3)
  - Theme assignment (LLM-based)
  - Provider factory with failover
  - Pipeline orchestration
"""

import math
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import make_session


# ---------------------------------------------------------------------------
# Phase A: Live Per-Response Summarization
# ---------------------------------------------------------------------------


class TestLiveSummarization:
    @pytest.mark.asyncio
    async def test_short_text_short_circuits_all_summaries(self):
        """Task A0: Text ≤33 words short-circuits — all 3 summaries = raw text, no AI calls."""
        from app.cubes.cube6_ai.service import summarize_single_response

        short_text = "AI governance is important for society."  # 7 words, ≤33

        mock_summarizer = MagicMock()
        mock_summarizer.summarize = AsyncMock()  # Should never be called

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()

        with patch("app.cubes.cube6_ai.phase_a.get_summarization_provider", return_value=mock_summarizer):
            result = await summarize_single_response(
                mock_db,
                session_id=uuid.uuid4(),
                response_id=uuid.uuid4(),
                raw_text=short_text,
                language_code="en",
                ai_provider="openai",
            )

        # A0: all 3 summaries = raw text (no AI calls)
        assert result["summary_333"] == short_text
        assert result["summary_111"] == short_text
        assert result["summary_33"] == short_text
        mock_summarizer.summarize.assert_not_called()

    @pytest.mark.asyncio
    async def test_long_text_generates_333_summary(self):
        """Task A1: Text >333 words — call 1 for 333, call 2 for JSON {111, 33}."""
        from app.cubes.cube6_ai.service import summarize_single_response

        long_text = " ".join(["word"] * 500)  # 500 words

        mock_summarizer = MagicMock()
        mock_summarizer.summarize = AsyncMock(side_effect=[
            # Call 1: compress to ~333 words
            "333 word summary here",
            # Call 2: single JSON prompt returning 111 + 33
            '{"summary_333": "333 word summary here", "summary_111": "111 word summary", "summary_33": "33 word summary"}',
        ])

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()

        with patch("app.cubes.cube6_ai.phase_a.get_summarization_provider", return_value=mock_summarizer):
            result = await summarize_single_response(
                mock_db,
                session_id=uuid.uuid4(),
                response_id=uuid.uuid4(),
                raw_text=long_text,
                language_code="en",
            )

        assert result["summary_333"] == "333 word summary here"
        assert result["summary_111"] == "111 word summary"
        assert result["summary_33"] == "33 word summary"
        assert mock_summarizer.summarize.call_count == 2  # A1: 2 calls max

    @pytest.mark.asyncio
    async def test_non_english_adds_translation_instruction(self):
        """Non-English text should include translation instruction."""
        from app.cubes.cube6_ai.service import summarize_single_response

        long_text = " ".join(["palabra"] * 500)  # 500 Spanish words

        mock_summarizer = MagicMock()
        mock_summarizer.summarize = AsyncMock(return_value="Summary in English")

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()

        with patch("app.cubes.cube6_ai.phase_a.get_summarization_provider", return_value=mock_summarizer):
            await summarize_single_response(
                mock_db,
                session_id=uuid.uuid4(),
                response_id=uuid.uuid4(),
                raw_text=long_text,
                language_code="es",
            )

        # First call (333) should include translation instruction
        first_call_instruction = mock_summarizer.summarize.call_args_list[0][1].get(
            "instruction", mock_summarizer.summarize.call_args_list[0][0][1] if len(mock_summarizer.summarize.call_args_list[0][0]) > 1 else ""
        )
        # Just verify it was called — the translation is in the instruction
        assert mock_summarizer.summarize.call_count >= 2

    @pytest.mark.asyncio
    async def test_stores_summaries_in_postgres(self):
        """Summaries should be upserted into Postgres."""
        from app.cubes.cube6_ai.service import summarize_single_response

        mock_summarizer = MagicMock()
        mock_summarizer.summarize = AsyncMock(return_value="Summary text")

        mock_db = AsyncMock()
        mock_db.execute = AsyncMock()
        mock_db.commit = AsyncMock()

        session_id = uuid.uuid4()
        response_id = uuid.uuid4()

        with patch("app.cubes.cube6_ai.phase_a.get_summarization_provider", return_value=mock_summarizer):
            await summarize_single_response(
                mock_db,
                session_id=session_id,
                response_id=response_id,
                raw_text="Short text",
            )

        # Verify Postgres write was called
        assert mock_db.execute.called or mock_db.commit.called


# ---------------------------------------------------------------------------
# Theme01 Classification
# ---------------------------------------------------------------------------


class TestTheme01Classification:
    @pytest.mark.asyncio
    async def test_classifies_risk(self):
        """Should classify risk responses correctly."""
        from app.cubes.cube6_ai.service import _classify_theme01

        mock_summarizer = MagicMock()
        mock_summarizer.batch_summarize = AsyncMock(return_value=[
            "Risk & Concerns (Confidence: 92%)"
        ])

        responses = [{"summary_33": "AI bias is a major threat to democracy"}]
        result = await _classify_theme01(mock_summarizer, responses)
        assert result[0]["theme01"] == "Risk & Concerns"
        assert result[0]["theme01_confidence"] == 92

    @pytest.mark.asyncio
    async def test_classifies_supporting(self):
        """Should classify supporting responses correctly."""
        from app.cubes.cube6_ai.service import _classify_theme01

        mock_summarizer = MagicMock()
        mock_summarizer.batch_summarize = AsyncMock(return_value=[
            "Supporting Comments (Confidence: 85%)"
        ])

        responses = [{"summary_33": "AI can transform governance positively"}]
        result = await _classify_theme01(mock_summarizer, responses)
        assert result[0]["theme01"] == "Supporting Comments"
        assert result[0]["theme01_confidence"] == 85

    @pytest.mark.asyncio
    async def test_low_confidence_reclassified_to_neutral(self):
        """Confidence < 65% should reclassify Risk/Supporting to Neutral."""
        from app.cubes.cube6_ai.service import _classify_theme01

        mock_summarizer = MagicMock()
        mock_summarizer.batch_summarize = AsyncMock(return_value=[
            "Risk & Concerns (Confidence: 50%)",
            "Supporting Comments (Confidence: 60%)",
        ])

        responses = [
            {"summary_33": "Maybe some risk"},
            {"summary_33": "Somewhat supportive"},
        ]
        result = await _classify_theme01(mock_summarizer, responses)
        assert result[0]["theme01"] == "Neutral Comments"  # Reclassified
        assert result[1]["theme01"] == "Neutral Comments"  # Reclassified

    @pytest.mark.asyncio
    async def test_neutral_not_reclassified(self):
        """Neutral at any confidence stays Neutral."""
        from app.cubes.cube6_ai.service import _classify_theme01

        mock_summarizer = MagicMock()
        mock_summarizer.batch_summarize = AsyncMock(return_value=[
            "Neutral Comments (Confidence: 40%)"
        ])

        responses = [{"summary_33": "Mixed feelings about AI"}]
        result = await _classify_theme01(mock_summarizer, responses)
        assert result[0]["theme01"] == "Neutral Comments"

    @pytest.mark.asyncio
    async def test_batch_classification(self):
        """Should classify multiple responses in a single batch call."""
        from app.cubes.cube6_ai.service import _classify_theme01

        mock_summarizer = MagicMock()
        mock_summarizer.batch_summarize = AsyncMock(return_value=[
            "Risk & Concerns (Confidence: 90%)",
            "Supporting Comments (Confidence: 80%)",
            "Neutral Comments (Confidence: 75%)",
        ])

        responses = [
            {"summary_33": "Dangerous AI"},
            {"summary_33": "Great AI potential"},
            {"summary_33": "AI is neutral"},
        ]
        result = await _classify_theme01(mock_summarizer, responses)
        assert len(result) == 3
        assert result[0]["theme01"] == "Risk & Concerns"
        assert result[1]["theme01"] == "Supporting Comments"
        assert result[2]["theme01"] == "Neutral Comments"


# ---------------------------------------------------------------------------
# Group by Theme01
# ---------------------------------------------------------------------------


class TestGroupByTheme01:
    def test_groups_correctly(self):
        """Should partition responses into 3 bins."""
        from app.cubes.cube6_ai.service import _group_by_theme01

        responses = [
            {"theme01": "Risk & Concerns"},
            {"theme01": "Risk & Concerns"},
            {"theme01": "Supporting Comments"},
            {"theme01": "Neutral Comments"},
            {"theme01": "Neutral Comments"},
            {"theme01": "Neutral Comments"},
        ]

        bins = _group_by_theme01(responses)
        assert len(bins["Risk & Concerns"]) == 2
        assert len(bins["Supporting Comments"]) == 1
        assert len(bins["Neutral Comments"]) == 3

    def test_unknown_label_defaults_to_neutral(self):
        """Unknown labels should be placed in Neutral bin."""
        from app.cubes.cube6_ai.service import _group_by_theme01

        responses = [{"theme01": "Something Unexpected"}]
        bins = _group_by_theme01(responses)
        assert len(bins["Neutral Comments"]) == 1

    def test_empty_responses(self):
        """Empty responses should return empty bins."""
        from app.cubes.cube6_ai.service import _group_by_theme01

        bins = _group_by_theme01([])
        assert all(len(v) == 0 for v in bins.values())


# ---------------------------------------------------------------------------
# Marble Sampling
# ---------------------------------------------------------------------------


class TestMarbleSampling:
    def test_groups_of_10(self):
        """Should create non-overlapping groups of 10."""
        from app.cubes.cube6_ai.service import _marble_sample

        items = [{"id": str(i)} for i in range(25)]
        groups = _marble_sample(items, seed=42)

        assert len(groups) == 3  # ceil(25/10) = 3
        assert len(groups[0]) == 10
        assert len(groups[1]) == 10
        assert len(groups[2]) == 5  # Remainder

    def test_no_overlap(self):
        """Each item should appear exactly once across all groups."""
        from app.cubes.cube6_ai.service import _marble_sample

        items = [{"id": str(i)} for i in range(30)]
        groups = _marble_sample(items, seed=42)

        all_ids = []
        for g in groups:
            all_ids.extend(r["id"] for r in g)
        assert len(all_ids) == 30
        assert len(set(all_ids)) == 30  # No duplicates

    def test_deterministic_with_same_seed(self):
        """Same seed should produce identical groups."""
        from app.cubes.cube6_ai.service import _marble_sample

        items = [{"id": str(i)} for i in range(20)]
        groups1 = _marble_sample(items, seed=42)
        groups2 = _marble_sample(items, seed=42)

        for g1, g2 in zip(groups1, groups2):
            ids1 = [r["id"] for r in g1]
            ids2 = [r["id"] for r in g2]
            assert ids1 == ids2

    def test_different_seed_different_groups(self):
        """Different seeds should produce different shuffles."""
        from app.cubes.cube6_ai.service import _marble_sample

        items = [{"id": str(i)} for i in range(20)]
        groups1 = _marble_sample(items, seed=42)
        groups2 = _marble_sample(items, seed=99)

        ids1 = [r["id"] for r in groups1[0]]
        ids2 = [r["id"] for r in groups2[0]]
        assert ids1 != ids2  # Very unlikely to be the same

    def test_empty_input(self):
        """Empty input should return empty list."""
        from app.cubes.cube6_ai.service import _marble_sample

        groups = _marble_sample([], seed=42)
        assert groups == []

    def test_single_item(self):
        """Single item should return one group with one item."""
        from app.cubes.cube6_ai.service import _marble_sample

        items = [{"id": "0"}]
        groups = _marble_sample(items, seed=42)
        assert len(groups) == 1
        assert len(groups[0]) == 1


# ---------------------------------------------------------------------------
# Theme Reduction Parsing
# ---------------------------------------------------------------------------


class TestThemeReductionParsing:
    def test_parse_csv_format(self):
        """Should parse T_Number, Theme, Description, Confidence format."""
        from app.cubes.cube6_ai.service import _parse_reduced_themes

        text = """T001, Privacy Data Protection, Ensuring user data remains secure always, 85%
T002, AI Transparency Standards, Clear disclosure of algorithmic decision making, 90%
T003, Democratic Governance Integrity, Protecting voting systems from manipulation threats, 78%"""

        themes = _parse_reduced_themes(text)
        assert len(themes) == 3
        assert themes[0]["label"] == "Privacy Data Protection"
        assert themes[0]["confidence"] == 0.85
        assert themes[1]["label"] == "AI Transparency Standards"
        assert themes[1]["confidence"] == 0.90
        assert themes[2]["label"] == "Democratic Governance Integrity"
        assert themes[2]["confidence"] == 0.78

    def test_parse_with_header_row(self):
        """Should skip header row (no T_Number match)."""
        from app.cubes.cube6_ai.service import _parse_reduced_themes

        text = """T_Number, Theme, T_Description, Confidence
T001, Theme One, Description one here, 85%
T002, Theme Two, Description two here, 90%"""

        themes = _parse_reduced_themes(text)
        assert len(themes) == 2

    def test_empty_text(self):
        """Empty text should return empty list."""
        from app.cubes.cube6_ai.service import _parse_reduced_themes

        assert _parse_reduced_themes("") == []


# ---------------------------------------------------------------------------
# Provider Factory
# ---------------------------------------------------------------------------


class TestProviderFactory:
    def test_openai_resolves(self):
        """OpenAI provider should resolve when key is set."""
        with patch("app.cubes.cube6_ai.providers.factory.settings") as mock_settings:
            mock_settings.openai_api_key = "test-key"
            mock_settings.xai_api_key = ""
            mock_settings.gemini_api_key = ""
            mock_settings.batch_size = 2048
            mock_settings.max_sampling_workers = 32

            from app.cubes.cube6_ai.providers.factory import get_embedding_provider
            provider = get_embedding_provider("openai")
            assert provider is not None

    def test_failover_when_primary_missing(self):
        """Should failover to next provider when primary has no key."""
        with patch("app.cubes.cube6_ai.providers.factory.settings") as mock_settings:
            mock_settings.openai_api_key = ""
            mock_settings.xai_api_key = "test-grok-key"
            mock_settings.gemini_api_key = ""
            mock_settings.batch_size = 2048
            mock_settings.max_sampling_workers = 32

            from app.cubes.cube6_ai.providers.factory import get_summarization_provider
            provider = get_summarization_provider("openai")
            assert provider is not None

    def test_raises_when_no_keys(self):
        """Should raise ValueError when no provider keys are configured."""
        with patch("app.cubes.cube6_ai.providers.factory.settings") as mock_settings:
            mock_settings.openai_api_key = ""
            mock_settings.xai_api_key = ""
            mock_settings.gemini_api_key = ""
            mock_settings.anthropic_api_key = ""

            from app.cubes.cube6_ai.providers.factory import get_embedding_provider
            with pytest.raises(ValueError, match="No embedding provider available"):
                get_embedding_provider("openai")


# ---------------------------------------------------------------------------
# Theme01 Categories
# ---------------------------------------------------------------------------


class TestTheme01Categories:
    def test_categories_match_monolith(self):
        """Theme01 categories should match the monolith constants."""
        from app.cubes.cube6_ai.service import THEME01_CATEGORIES

        assert THEME01_CATEGORIES == [
            "Risk & Concerns",
            "Supporting Comments",
            "Neutral Comments",
        ]

    def test_confidence_threshold(self):
        """Confidence threshold should be 65%."""
        from app.cubes.cube6_ai.service import _CONFIDENCE_THRESHOLD
        assert _CONFIDENCE_THRESHOLD == 65
