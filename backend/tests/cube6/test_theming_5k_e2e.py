"""Cube 6 B1 — full Phase B theming E2E on the real 5,000-response reference dataset.

C6-3/C6-5 proved the offline Phase B flow on 25 synthetic responses. B1 raises it to
SCALE + REAL DATA: run the actual theming pipeline (classify → group → marble-sample →
generate → reduce) over all 5,000 `33_Summary` texts from
`Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv`, with the offline provider
(no billed API), and prove it (a) completes on 5K, (b) classifies every row into a valid
Theme01 bin, (c) yields full 9/6/3 petal geometry per category, and (d) is deterministic
on real data (CLAUDE.md: identical inputs MUST yield identical themes).

Skips cleanly if the large CSV is absent (some CI images don't ship it), so it never
becomes a false red.
"""

import asyncio
import csv
import json
import os

import pytest

from app.cubes.cube6_ai import phase_b as pb
from app.cubes.cube6_ai.providers.factory import get_summarization_provider

_CSV_PATH = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "..",
    "Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv",
))

pytestmark = pytest.mark.skipif(
    not os.path.exists(_CSV_PATH),
    reason="5000-row reference CSV not present in this environment",
)


def _run(coro):
    return asyncio.run(coro)


def _load_summaries(limit: int = 0) -> list[dict]:
    """Load `33_Summary` texts from the reference CSV as phase_b response dicts."""
    rows: list[dict] = []
    with open(_CSV_PATH, newline="", encoding="utf-8") as f:
        for i, row in enumerate(csv.DictReader(f)):
            text = (row.get("33_Summary") or "").strip()
            if not text:
                continue
            rows.append({"response_id": f"r-{i:05d}", "summary_33": text})
            if limit and len(rows) >= limit:
                break
    return rows


async def _theme(responses: list[dict], seed: int = 42):
    """Real Phase B flow over the given responses with the offline provider (no DB, no API)."""
    summarizer = get_summarization_provider("offline")
    classified = await pb._classify_theme01(summarizer, [dict(r) for r in responses])
    bins = pb._group_by_theme01(classified)
    samples = await pb._parallel_marble_sample(bins, seed)
    generated = await pb._parallel_generate_themes(summarizer, samples)
    reduced = await pb._reduce_themes(summarizer, generated)
    return classified, reduced


@pytest.fixture(scope="module")
def summaries():
    rows = _load_summaries()
    assert len(rows) >= 4900, f"expected ~5000 summaries, got {len(rows)}"
    return rows


class TestTheming5kE2E:
    def test_pipeline_completes_and_classifies_all_5000(self, summaries):
        classified, reduced = _run(_theme(summaries))
        # Every real response landed in a valid Theme01 bin.
        assert len(classified) == len(summaries)
        assert all(r["theme01"] in pb.THEME01_CATEGORIES for r in classified)
        # Full Flower-of-Life geometry per category.
        assert set(reduced.keys()) == set(pb.THEME01_CATEGORIES)
        for levels in reduced.values():
            assert len(levels["9"]) == 9 and len(levels["6"]) == 6 and len(levels["3"]) == 3

    def test_all_three_categories_populated_on_real_data(self, summaries):
        classified, _ = _run(_theme(summaries))
        counts = {cat: 0 for cat in pb.THEME01_CATEGORIES}
        for r in classified:
            counts[r["theme01"]] += 1
        # Real governance data spans sentiment — every bin gets a meaningful share.
        for cat, n in counts.items():
            assert n > 0, f"no responses classified as {cat}"

    def test_determinism_on_real_5000(self, summaries):
        # The hard requirement, at scale on real data: identical inputs → identical themes.
        _, a = _run(_theme(summaries))
        _, b = _run(_theme(summaries))
        assert json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)
