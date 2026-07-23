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
from functools import lru_cache

# The 3/6/9 dial values (theme-level parity with the live viz).
LEVELS: tuple[int, ...] = (3, 6, 9)
SECTION_KEYS: tuple[str, ...] = ("A", "B", "C", "D")

# The dev may view the 27 mini-cubes at ANY granularity 2..27 (FX-J). Every block is a
# UNIQUE FACE-CONNECTED shape (side-by-side or stacked), varied per cube; 27 → each
# mini-cube is its own building block.
ALLOWED_SECTION_COUNTS: tuple[int, ...] = tuple(range(2, 28))

# Per-cube code sections → real ordered functions, in plain words.
SECTIONS: dict[int, list[dict]] = {
    1: [
        {"key": "A", "label": "Make the session", "functions": ["create_session", "_generate_unique_short_code"]},
        {"key": "B", "label": "QR & join link", "functions": ["generate_qr_png", "join_session"]},
        {"key": "C", "label": "Fingerprint", "functions": ["_compute_replay_hash"]},
        {"key": "D", "label": "Open / close", "functions": ["transition_session"]},
    ],
    2: [
        {"key": "A", "label": "Clean & fit", "functions": ["validate_text_input", "validate_and_fit_text_input"]},
        {"key": "B", "label": "Find private info", "functions": ["detect_pii", "detect_language"]},
        {"key": "C", "label": "Hide it", "functions": ["scrub_pii", "anonymize_response"]},
        {"key": "D", "label": "Fingerprint", "functions": ["compute_response_hash", "store_response"]},
    ],
    3: [
        {"key": "A", "label": "Listen (audio in)", "functions": ["submit_voice_response", "store_voice_response"]},
        {"key": "B", "label": "Turn speech to text", "functions": ["transcribe_audio", "handle_realtime_transcription"]},
        {"key": "C", "label": "Backup provider", "functions": ["select_stt_provider", "get_stt_provider_safe"]},
        {"key": "D", "label": "Send to text pipeline", "functions": ["run_text_pipeline"]},
    ],
    4: [
        {"key": "A", "label": "Gather answers", "functions": ["get_collected_responses", "get_response_count"]},
        {"key": "B", "label": "Who's here", "functions": ["get_session_presence", "update_presence"]},
        {"key": "C", "label": "Save it", "functions": ["create_desired_outcome", "record_confirmation"]},
        {"key": "D", "label": "Read the room", "functions": ["analyze_session", "synthesize_analysis"]},
    ],
    5: [
        {"key": "A", "label": "Count the time", "functions": ["calculate_tokens", "start_time_tracking"]},
        {"key": "B", "label": "Kick off the AI", "functions": ["trigger_ai_pipeline", "orchestrate_post_polling"]},
        {"key": "C", "label": "Cost per minute", "functions": ["mot_cost_control_chart", "dollars_per_min"]},
        {"key": "D", "label": "Profit math", "functions": ["session_profit"]},
    ],
    6: [
        {"key": "A", "label": "Sort into buckets", "functions": ["run_pipeline", "run_ai_theming"]},
        {"key": "B", "label": "Pick samples", "functions": ["sample_response_summaries", "select_centroid_representatives"]},
        {"key": "C", "label": "Write the summary", "functions": ["generate_summary_tiers", "truncate_to_words"]},
        {"key": "D", "label": "Tag each answer", "functions": ["_assign_themes_llm"]},
    ],
    7: [
        {"key": "A", "label": "Score the votes", "functions": ["aggregate_rankings", "submit_ranking"]},
        {"key": "B", "label": "Stop cheating", "functions": ["detect_voting_anomalies", "_apply_influence_cap"]},
        {"key": "C", "label": "Add it all up", "functions": ["_weighted_borda_scores", "_borda_scores"]},
        {"key": "D", "label": "Break ties & fingerprint", "functions": ["_seeded_tiebreak_key", "_compute_replay_hash"]},
    ],
    8: [
        {"key": "A", "label": "Dollars to tokens", "functions": ["dollars_to_hi_tokens", "resolve_human_rate"]},
        {"key": "B", "label": "Mint the tokens", "functions": ["create_ledger_entry", "dispatch_token_award"]},
        {"key": "C", "label": "Lifecycle", "functions": ["transition_lifecycle_state"]},
        {"key": "D", "label": "Fix mistakes", "functions": ["reverse_entry", "create_token_dispute"]},
    ],
    9: [
        {"key": "A", "label": "Build the CSV", "functions": ["export_session_csv", "export_csv"]},
        {"key": "B", "label": "Fingerprint the export", "functions": ["compute_export_hash", "verify_export_hash"]},
        {"key": "C", "label": "Filter by tier", "functions": ["_apply_tier_filter", "_tier_at_least"]},
        {"key": "D", "label": "Hand out results", "functions": ["distribute_results", "announce_reward_winner"]},
    ],
}


def segment_cells(n: int, k: int) -> list[int]:
    """The contiguous INDEX slab for block k of an n-way split (kept as a utility).
    NOTE: index-contiguous is NOT face-connected in 3D — the workbench uses the
    face-connected `partition` below (the Lego rule). Cells are z-major:
    cell = z*9 + y*3 + x, so 0-8 = Level 1, 9-17 = Level 2, 18-26 = Level 3."""
    lo = (k * 27) // n
    hi = ((k + 1) * 27) // n
    return list(range(lo, hi))


def _cell_xyz(i: int) -> tuple[int, int, int]:
    return (i % 3, (i // 3) % 3, i // 9)


def _face_neighbors(i: int) -> list[int]:
    """The face-adjacent cells of cell i in the 3×3×3 (share a whole face)."""
    x, y, z = _cell_xyz(i)
    out: list[int] = []
    for dx, dy, dz in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)):
        nx, ny, nz = x + dx, y + dy, z + dz
        if 0 <= nx < 3 and 0 <= ny < 3 and 0 <= nz < 3:
            out.append(nz * 9 + ny * 3 + nx)
    return out


def _seeded_order(cube_id: int) -> list[int]:
    """A deterministic permutation of 0..26 seeded by cube_id (per-cube variety)."""
    return sorted(range(27), key=lambda c: hashlib.sha256(f"{cube_id}:{c}".encode()).hexdigest())


@lru_cache(maxsize=1024)
def partition(cube_id: int, n: int) -> list[list[int]]:
    """Split the 27 mini-cubes into n FACE-CONNECTED building blocks (the Lego rule:
    a block's cubes always touch — side-by-side OR stacked — so it could physically
    stack into a unique shape).

    Supports ANY n in 2..27. n≥27 → each mini-cube is its own block. Otherwise: seeded
    multi-source region-growing — n seeds from a cube_id-seeded order, each region grows
    round-robin by claiming an unassigned FACE-neighbor → connected + balanced + a UNIQUE
    pattern per (cube, n). @lru_cache keeps every config "saved in memory" (deterministic,
    reproduced identically)."""
    if n <= 1:
        return [list(range(27))]
    if n >= 27:
        return [[i] for i in range(27)]
    order = _seeded_order(cube_id)
    pos = {c: i for i, c in enumerate(order)}
    seeds = order[:n]
    owner = {s: k for k, s in enumerate(seeds)}
    members: list[list[int]] = [[s] for s in seeds]
    assigned = set(seeds)
    remaining = 27 - n
    while remaining > 0:
        progressed = False
        for k in range(n):
            cands = {nb for m in members[k] for nb in _face_neighbors(m) if nb not in assigned}
            if cands:
                nb = min(cands, key=lambda c: pos[c])   # deterministic pick
                owner[nb] = k
                assigned.add(nb)
                members[k].append(nb)
                remaining -= 1
                progressed = True
                if remaining == 0:
                    break
        if not progressed:  # safety net — impossible in a fully face-connected 3×3×3
            for c in range(27):
                if c not in assigned:
                    owner[c] = pos[c] % n
                    assigned.add(c)
            remaining = 0
    return [sorted(c for c in range(27) if owner[c] == k) for k in range(n)]


def voxel_highlight(cube_id: int, level: int, section: str | None) -> list[int]:
    """Pure, deterministic lit set of mini-cube indices (0..26).

    section=None → the whole cube; A/B/C/D → that curated function block — a
    FACE-CONNECTED polycube (the Lego rule), varied per cube. level ∈ {3,6,9} scales
    density within the eligible cells: 3 → ⅓, 6 → ⅔, 9 → all."""
    if level not in LEVELS:
        raise ValueError(f"level must be one of {LEVELS}, got {level!r}")
    if section is not None and section not in SECTION_KEYS:
        raise ValueError(f"section must be one of {SECTION_KEYS} or None, got {section!r}")
    cells = list(range(27)) if section is None else partition(cube_id, 4)[SECTION_KEYS.index(section)]
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
    """Sections for a cube at the requested granularity (any count 2..27), each with
    its highlight sets and the REAL functions it maps to.

    count == 4 → the curated function sections (A/B/C/D, real function labels).
    other counts → N face-connected block-segments ("Block k"); the cube's real
    functions are distributed round-robin across the blocks so every count mirrors the
    actual LIVE code. Returns [] for an unknown cube (never raises).
    """
    if cube_id not in SECTIONS:
        return []
    if count == 4:
        return [{
            "key": s["key"], "label": s["label"], "functions": s["functions"],
            "highlight": {str(lvl): voxel_highlight(cube_id, lvl, s["key"]) for lvl in LEVELS},
        } for s in SECTIONS[cube_id]]
    out: list[dict] = []
    blocks = partition(cube_id, count)
    # Distribute the cube's REAL functions across the N blocks round-robin, so every
    # count's building blocks mirror the actual LIVE code (FX-J). Blocks past the
    # function count are honestly empty/structural.
    allfns = [fn for s in SECTIONS.get(cube_id, []) for fn in s["functions"]]
    for k in range(count):
        cells = blocks[k]
        fns = [allfns[j] for j in range(len(allfns)) if j % count == k]
        out.append({
            "key": f"B{k + 1}", "label": f"Block {k + 1}", "functions": fns,
            "highlight": {"3": cells, "6": cells, "9": cells},  # ON/OFF whole block
        })
    return out
