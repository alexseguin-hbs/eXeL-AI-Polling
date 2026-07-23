"""Cube 6 theming harness (Dev-Sim / Slice 0).

Runs the REAL phase_b theming engine — classify Theme 01 (Risk & Concerns /
Supporting Comments / Neutral Comments) → group → marble-sample → generate 3
themes/group → reduce all→9→6→3 → assign each response to a Theme 02 — on a set
of user responses, deterministically and OFFLINE (provider="offline", no billed
API). This is the "load user results and perform theming" test: it PRINTS the
Theme 01 counts + Theme 02 3/6/9 tables + a determinism signature, and returns a
structured result for pytest.

Note: this exercises the theming ENGINE at the phase_b function layer (the
"magic": classify → generate → assign each comment to one of 9). The DB
persistence step (run_pipeline's _store_results) is covered separately; the
themes here are identical to what the pipeline would store.

Run: `cd backend && .venv/bin/python -m app.cubes.cube10_simulation.harness_cube6`
"""

import asyncio
import hashlib
import json

from app.cubes.cube6_ai import phase_b as pb
from app.cubes.cube6_ai.centroid_summarizer import truncate_to_words
from app.cubes.cube6_ai.providers.factory import get_summarization_provider


# Self-contained default feedback so the Dev-Sim can run the harness app-side
# without depending on the test fixtures (tests/ is not importable from app/).
_DEFAULT_FEEDBACK: list[dict] = [
    {"persona": "Data Analyst", "text": "The clustering sometimes merges unrelated ideas — a real concern for accuracy."},
    {"persona": "Event Organizer", "text": "Mobile drag-and-drop ranking is frustrating and barely works on my phone."},
    {"persona": "Educator", "text": "I love how fast the themes appear — this is genuinely useful and effective."},
    {"persona": "Product Manager", "text": "Anonymity is great, but I worry the export format loses some nuance."},
    {"persona": "Developer", "text": "Clean API and the summaries are accurate; the tool is valuable for our workflow."},
    {"persona": "Participant", "text": "It was fine. Nothing stood out either way for me."},
]


def _seed_int(seed: str) -> int:
    return int(hashlib.md5(seed.encode()).hexdigest()[:8], 16)


def _live_labels(themes: list[dict]) -> list[dict]:
    """Non-empty Theme 02 slots (drop the padded is_empty placeholders)."""
    return [t for t in themes if t.get("label") and not t.get("is_empty")]


async def run_harness_cube6(
    feedback: list[dict] | None = None, seed: str = "lock", provider: str = "offline"
) -> dict:
    """Run the real phase_b theming engine on `feedback` (list of {persona, text}).

    `feedback` defaults to a small self-contained sample so the Dev-Sim can call
    run_harness_cube6() with no args (offline, deterministic).
    """
    if feedback is None:
        feedback = _DEFAULT_FEEDBACK
    summarizer = get_summarization_provider(provider)
    seed_i = _seed_int(seed)

    # Seed per-response summaries (Phase A output). Offline path themes on this text.
    responses = [
        {"response_id": f"r{i:03d}", "persona": f.get("persona", ""),
         "summary_33": truncate_to_words(f["text"], 60)}
        for i, f in enumerate(feedback)
    ]

    # Step 2-3: classify Theme 01 + group into the 3 buckets.
    responses = await pb._classify_theme01(summarizer, responses)
    bins = pb._group_by_theme01(responses)
    theme01_counts = {cat: len(bins[cat]) for cat in pb.THEME01_CATEGORIES}

    # Step 4-6: marble-sample → generate 3 themes/group → reduce all→9→6→3.
    bin_samples = await pb._parallel_marble_sample(bins, seed_i)
    all_themes = await pb._parallel_generate_themes(summarizer, bin_samples)
    reduced = await pb._reduce_themes(summarizer, all_themes)

    # Step 7: assign every response to a Theme 02 at each level.
    responses = await pb._assign_themes_llm(summarizer, responses, reduced)

    # Theme 02 tables (non-empty) + assignment coverage.
    theme02 = {
        cat: {
            lvl: [t["label"] for t in _live_labels(reduced.get(cat, {}).get(lvl, []))]
            for lvl in ("3", "6", "9")
        }
        for cat in pb.THEME01_CATEGORIES
    }
    assigned = sum(1 for r in responses if r.get("theme2_3"))

    # Determinism signature: hash the reduced structure + per-response theme2_3.
    sig_material = json.dumps(
        {
            "theme02": theme02,
            "assign": sorted((r["response_id"], r.get("theme2_3", "")) for r in responses),
        },
        sort_keys=True,
    )
    signature = hashlib.sha256(sig_material.encode()).hexdigest()

    return {
        "provider": provider,
        "seed": seed,
        "total_responses": len(responses),
        "theme01_counts": theme01_counts,
        "theme02": theme02,
        "assigned": assigned,
        "assignments": [
            {"persona": r["persona"], "theme01": r.get("theme01"), "theme2_3": r.get("theme2_3")}
            for r in responses
        ],
        # Deterministic structural metrics (pure harness — cost scales with work, not wall-clock)
        # so /sim/cube/6/run + _harness_to_metrics stop reporting zeros for Cube 6.
        "metrics": {
            "function_calls": len(responses),
            "db_execute_calls": 0,
            "wall_time_ms": float(len(responses)),
        },
        "determinism_signature": signature,
    }


def render(result: dict) -> str:
    """Human-readable Theme 01/02 table for the operator."""
    out: list[str] = []
    out.append("═" * 72)
    out.append(f"  CUBE 6 THEMING — {result['total_responses']} responses  ·  provider={result['provider']}  ·  seed={result['seed']}")
    out.append("═" * 72)
    out.append("  THEME 01 (buckets):")
    for cat, n in result["theme01_counts"].items():
        out.append(f"    · {cat:<22} {n:>3} responses")
    out.append(f"  Assigned a Theme 02: {result['assigned']}/{result['total_responses']}")
    out.append("─" * 72)
    for cat in result["theme02"]:
        out.append(f"  {cat} — Theme 02:")
        for lvl in ("3", "6", "9"):
            labels = result["theme02"][cat][lvl]
            out.append(f"    [{lvl}] " + (" · ".join(labels) if labels else "(none)"))
    out.append("─" * 72)
    out.append("  Sample assignments:")
    for a in result["assignments"][:8]:
        out.append(f"    · {a['persona'][:34]:<34} → {a['theme01']:<20} / {a['theme2_3']}")
    out.append("─" * 72)
    out.append(f"  Determinism signature: {result['determinism_signature']}")
    out.append("═" * 72)
    return "\n".join(out)


async def _main() -> None:
    from tests.fixtures.live_feedback_25 import LIVE_FEEDBACK_25
    result = await run_harness_cube6(LIVE_FEEDBACK_25)
    print(render(result))


if __name__ == "__main__":
    asyncio.run(_main())
