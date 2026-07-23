"""§3 — Code SECTIONS (A/B/C/D) per cube + the deterministic 27-voxel highlight.

THE SINGLE JUNCTION (Krishna/Odin): the Cube-Architecture tile, the workbench voxel,
the levels strip, the I·F·O panel, replay-by-section, and every test READ this module.
No cube/section list is hardcoded beside it.

Model
-----
* A cube = 3×3×3 = **27 mini-cubes** (indices 0..26) — its permanent identity.
* Each cube's real ordered functions are bucketed into **4 code SECTIONS** (A/B/C/D),
  each in plain "grandma / middle-school" words.
* `voxel_highlight(cube_id, level, section)` is a PURE, deterministic function: it
  partitions the 27 cells across the 4 sections **seeded by cube_id** (so every cube
  shows a UNIQUE fingerprint, no randomness, no hand-artwork) and returns the lit set.
* `level` ∈ {3,6,9} — the operator's Theme-Level dial (reused from the live theme viz):
  it scales visual density (3 → ⅓ of the section's cells, 6 → ⅔, 9 → all), so turning
  the dial visibly reveals more of the worked slice — harmonized with the 3/6/9 flower.

Replay stores only {cube, level, section}; the picture regenerates from this — no
visual state is persisted, and the same (cube, level, section) always yields the same
sorted list of mini-cube indices.
"""
from __future__ import annotations

import hashlib
import math

# The 3/6/9 dial values (theme-level parity with the live viz).
LEVELS: tuple[int, ...] = (3, 6, 9)
SECTION_KEYS: tuple[str, ...] = ("A", "B", "C", "D")

# The dev may view the 27 mini-cubes at these granularities (FX-G). A section is a
# COHERENT contiguous slab (not a random scatter): 3 → the 3 levels, 4 → the curated
# function slabs, 9 → rows, 27 → each mini-cube is its own building block.
ALLOWED_SECTION_COUNTS: tuple[int, ...] = (3, 4, 9, 27)

# Per-cube code sections → real ordered functions, in plain words.
SECTIONS: dict[int, list[dict]] = {
    1: [
        {"key": "A", "label": "Make the session", "functions": ["create_session", "_generate_unique_short_code"]},
        {"key": "B", "label": "QR & join link", "functions": ["generate_qr_png", "join_session"]},
        {"key": "C", "label": "Fingerprint", "functions": ["_compute_replay_hash"]},
        {"key": "D", "label": "Open / close", "functions": ["transition_session"]},
    ],
    2: [
        {"key": "A", "label": "Clean & fit", "functions": ["validate_and_fit"]},
        {"key": "B", "label": "Find private info", "functions": ["detect_pii"]},
        {"key": "C", "label": "Hide it", "functions": ["scrub_pii"]},
        {"key": "D", "label": "Fingerprint", "functions": ["compute_response_hash"]},
    ],
    3: [
        {"key": "A", "label": "Listen (audio in)", "functions": ["submit_voice"]},
        {"key": "B", "label": "Turn speech to text", "functions": ["transcribe"]},
        {"key": "C", "label": "Backup provider", "functions": ["failover"]},
        {"key": "D", "label": "Send to text pipeline", "functions": ["to_text_pipeline"]},
    ],
    4: [
        {"key": "A", "label": "Gather answers", "functions": ["aggregate", "get_responses"]},
        {"key": "B", "label": "Who's here", "functions": ["track_presence", "get_presence"]},
        {"key": "C", "label": "Save it", "functions": ["persist"]},
        {"key": "D", "label": "Read the room", "functions": ["analyze_session"]},
    ],
    5: [
        {"key": "A", "label": "Count the time", "functions": ["calculate_tokens"]},
        {"key": "B", "label": "Kick off the AI", "functions": ["trigger_pipeline", "orchestrate_pipeline"]},
        {"key": "C", "label": "Cost per minute", "functions": ["mot_cost_control_chart"]},
        {"key": "D", "label": "Profit math", "functions": ["session_profit"]},
    ],
    6: [
        {"key": "A", "label": "Sort into buckets", "functions": ["classify", "run_theming"]},
        {"key": "B", "label": "Pick samples", "functions": ["marble_sample", "embed"]},
        {"key": "C", "label": "Write the summary", "functions": ["summarize", "reduce_themes"]},
        {"key": "D", "label": "Tag each answer", "functions": ["assign_theme"]},
    ],
    7: [
        {"key": "A", "label": "Score the votes", "functions": ["borda", "submit_ranking"]},
        {"key": "B", "label": "Stop cheating", "functions": ["anti_sybil"]},
        {"key": "C", "label": "Add it all up", "functions": ["aggregate_rankings"]},
        {"key": "D", "label": "Break ties & fingerprint", "functions": ["seeded_tiebreak"]},
    ],
    8: [
        {"key": "A", "label": "Dollars to tokens", "functions": ["dollars_to_hi_tokens"]},
        {"key": "B", "label": "Mint the tokens", "functions": ["mint"]},
        {"key": "C", "label": "Lifecycle", "functions": ["transition_lifecycle_state"]},
        {"key": "D", "label": "Fix mistakes", "functions": ["reverse_entry", "file_dispute"]},
    ],
    9: [
        {"key": "A", "label": "Build the CSV", "functions": ["export_csv", "build_csv"]},
        {"key": "B", "label": "Fingerprint the export", "functions": ["compute_export_hash"]},
        {"key": "C", "label": "Filter by tier", "functions": ["apply_tier_filter"]},
        {"key": "D", "label": "Hand out results", "functions": ["distribute_results"]},
    ],
}


def segment_cells(n: int, k: int) -> list[int]:
    """The COHERENT contiguous slab of cells for block k of an n-way split (FX-G).

    Cells are indexed z-major: cell = z*9 + y*3 + x, so 0-8 = Level 1, 9-17 = Level 2,
    18-26 = Level 3. Block k = the contiguous range [floor(k*27/n) .. floor((k+1)*27/n)).
    n=3 → the 3 levels exactly · n=9 → the 9 rows · n=27 → each mini-cube · n=4 → 4
    stacked slabs. Deterministic and the SAME coherent shape for every cube (operator:
    "not a random pattern; a building block is a segment, e.g. all of Level 1")."""
    lo = (k * 27) // n
    hi = ((k + 1) * 27) // n
    return list(range(lo, hi))


def voxel_highlight(cube_id: int, level: int, section: str | None) -> list[int]:
    """Pure, deterministic lit set of mini-cube indices (0..26).

    section=None → the whole cube; A/B/C/D → that curated function slab (a coherent
    contiguous segment, NOT a scatter). level ∈ {3,6,9} scales density within the
    eligible cells: 3 → ⅓, 6 → ⅔, 9 → all. Same (level, section) → identical list.
    (cube_id is accepted for signature stability but no longer seeds a scatter —
    sections are coherent slabs, identical across cubes.)
    """
    if level not in LEVELS:
        raise ValueError(f"level must be one of {LEVELS}, got {level!r}")
    if section is not None and section not in SECTION_KEYS:
        raise ValueError(f"section must be one of {SECTION_KEYS} or None, got {section!r}")
    cells = list(range(27)) if section is None else segment_cells(4, SECTION_KEYS.index(section))
    n = math.ceil(len(cells) * level / 9) if cells else 0
    return sorted(cells)[:n]


def _block_functions(cube_id: int, cells: list[int]) -> list[str]:
    """The curated function labels whose slab overlaps this block's cells (context)."""
    cellset = set(cells)
    fns: list[str] = []
    for i, s in enumerate(SECTIONS.get(cube_id, [])):
        if cellset & set(segment_cells(4, i)):
            fns.extend(s["functions"])
    return fns


def sections_for(cube_id: int, count: int = 4) -> list[dict]:
    """Sections for a cube at the requested granularity, each with its highlight sets.

    count == 4 → the curated function sections (A/B/C/D, real function labels).
    count in {3, 9, 27} → coherent block-segments ("Level k" for 3, else "Block k"),
    each carrying the curated functions its slab overlaps. Returns [] for an unknown
    cube (never raises) — the workbench falls back to whole-cube scope.
    """
    if cube_id not in SECTIONS:
        return []
    if count == 4:
        return [{
            "key": s["key"], "label": s["label"], "functions": s["functions"],
            "highlight": {str(lvl): voxel_highlight(cube_id, lvl, s["key"]) for lvl in LEVELS},
        } for s in SECTIONS[cube_id]]
    out: list[dict] = []
    for k in range(count):
        cells = segment_cells(count, k)
        label = f"Level {k + 1}" if count == 3 else f"Block {k + 1}"
        out.append({
            "key": f"B{k + 1}", "label": label, "functions": _block_functions(cube_id, cells),
            "highlight": {"3": cells, "6": cells, "9": cells},  # ON/OFF whole block
        })
    return out
