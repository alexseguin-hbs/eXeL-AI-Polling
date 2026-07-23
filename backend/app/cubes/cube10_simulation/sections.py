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


def _cell_section(cube_id: int, cell: int) -> str:
    """Deterministically assign one of the 27 cells to a section (seeded by cube_id)."""
    h = int(hashlib.sha256(f"{cube_id}:{cell}".encode()).hexdigest(), 16)
    return SECTION_KEYS[h % 4]


def voxel_highlight(cube_id: int, level: int, section: str | None) -> list[int]:
    """Pure, deterministic lit set of mini-cube indices (0..26).

    section=None → the whole cube (all sections); otherwise just that section's cells.
    level ∈ {3,6,9} scales density: 3 → ⅓, 6 → ⅔, 9 → all of the eligible cells.
    Same (cube_id, level, section) → identical sorted list, every call.
    """
    if level not in LEVELS:
        raise ValueError(f"level must be one of {LEVELS}, got {level!r}")
    if section is not None and section not in SECTION_KEYS:
        raise ValueError(f"section must be one of {SECTION_KEYS} or None, got {section!r}")
    cells = [c for c in range(27) if section is None or _cell_section(cube_id, c) == section]
    n = math.ceil(len(cells) * level / 9) if cells else 0
    return sorted(cells)[:n]


def sections_for(cube_id: int) -> list[dict]:
    """The 4 sections for a cube, each with its per-level highlight sets.

    Returns [] for cubes with no section map (never raises) — the workbench then
    falls back to whole-cube scope.
    """
    out: list[dict] = []
    for s in SECTIONS.get(cube_id, []):
        out.append({
            "key": s["key"],
            "label": s["label"],
            "functions": s["functions"],
            "highlight": {str(lvl): voxel_highlight(cube_id, lvl, s["key"]) for lvl in LEVELS},
        })
    return out
