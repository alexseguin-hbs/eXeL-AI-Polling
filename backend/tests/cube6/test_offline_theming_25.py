"""C6-3/C6-5 — Slice-0 offline theming acceptance on 25 responses.

The operator's Slice-0 gate: the AI theming pipeline (Phase B) must run END-TO-END
on a realistic 25-response batch WITHOUT a billed provider (offline provider, C6-1)
AND be fully deterministic — CLAUDE.md's hard requirement: "Identical inputs MUST
yield identical themes." This composes the real Phase B helpers (classify → group →
marble-sample → generate → reduce) over 25 responses and proves byte-identical output
across repeated runs, the foundation the Cube-10 replay/verify surfaces build on.
"""

import asyncio
import json

import pytest

from app.cubes.cube6_ai import phase_b as pb
from app.cubes.cube6_ai.providers.factory import get_summarization_provider

# 25 realistic governance responses spanning support / risk / neutral sentiment.
_RESPONSES_25 = [
    "I really like this excellent tool it is valuable and effective for our team",
    "The mobile experience is frustrating and drag drop barely works a real concern",
    "This is a neutral observation about the current polling interface layout",
    "Great work the export feature is genuinely useful and well designed",
    "There is a risk that the analytics dashboard misleads users with unclear labels",
    "The onboarding flow is acceptable but could be clearer in places",
    "Fantastic performance the real time results appear instantly and reliably",
    "I am worried the branding is inconsistent across the different screens",
    "An average experience nothing stands out either positively or negatively",
    "Love the accessibility improvements they make the product much more inclusive",
    "The API rate limits are a problem when we run large batch imports",
    "Reasonable defaults overall though the settings panel feels a little dense",
    "Impressive scalability the system handled our thousand user session smoothly",
    "Concerned about data retention the deletion policy is not clearly explained",
    "Standard functionality that works as expected without surprises",
    "The theming clusters are insightful and helped us prioritize quickly",
    "Security worries the session codes seem easy to guess and reuse",
    "It is fine the voice input works but transcription is occasionally off",
    "Excellent governance features the audit log gives us real confidence",
    "Risk of manipulation the voting weights could be gamed by coordinated users",
    "Neutral take the color palette is inoffensive and readable enough",
    "Superb documentation the SDK examples made integration straightforward",
    "The cost estimates are confusing and I fear unexpected billing charges",
    "Adequate mobile layout though some touch targets are a bit small",
    "Wonderful collaboration the live feed keeps everyone perfectly in sync",
]


def _run(coro):
    return asyncio.run(coro)


def _fresh_summaries():
    return [
        {"response_id": f"r-{i:02d}", "summary_33": text}
        for i, text in enumerate(_RESPONSES_25)
    ]


async def _theme_25(seed: int = 42):
    """Run the real Phase B flow over 25 responses with the offline provider.

    Returns the reduced-theme structure (per category → 9/6/3 petals) — the
    theming artifact a consumer persists. No DB, no billed provider.
    """
    summarizer = get_summarization_provider("offline")
    classified = await pb._classify_theme01(summarizer, _fresh_summaries())
    bins = pb._group_by_theme01(classified)
    samples = await pb._parallel_marble_sample(bins, seed)
    generated = await pb._parallel_generate_themes(summarizer, samples)
    reduced = await pb._reduce_themes(summarizer, generated)
    return reduced


class TestOfflineTheming25:
    def test_runs_end_to_end_on_25_responses(self):
        reduced = _run(_theme_25())
        # Every Theme01 category is present with full 9/6/3 petal geometry (Flower of Life).
        assert set(reduced.keys()) == set(pb.THEME01_CATEGORIES)
        for cat, levels in reduced.items():
            assert set(levels.keys()) == {"9", "6", "3"}
            assert len(levels["9"]) == 9
            assert len(levels["6"]) == 6
            assert len(levels["3"]) == 3

    def test_all_25_classified_into_valid_categories(self):
        classified = _run(pb._classify_theme01(get_summarization_provider("offline"), _fresh_summaries()))
        assert len(classified) == 25
        assert all(r["theme01"] in pb.THEME01_CATEGORIES for r in classified)

    def test_determinism_identical_themes_across_runs(self):
        # CLAUDE.md hard requirement: identical inputs MUST yield identical themes.
        a = _run(_theme_25())
        b = _run(_theme_25())
        assert json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)

    def test_determinism_holds_across_five_runs(self):
        ref = json.dumps(_run(_theme_25()), sort_keys=True)
        for _ in range(4):
            assert json.dumps(_run(_theme_25()), sort_keys=True) == ref

    def test_seed_change_is_still_well_formed(self):
        # A different marble seed may reshuffle sampling but must still yield full geometry.
        reduced = _run(_theme_25(seed=7))
        for levels in reduced.values():
            assert len(levels["3"]) == 3 and len(levels["9"]) == 9
