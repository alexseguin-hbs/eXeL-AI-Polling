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
        {"key": "A", "label": "Hours to tokens", "functions": ["hours_to_hi_tokens", "resolve_human_rate"]},
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


def _slab_axis(cube_id: int) -> int:
    """A deterministic axis 0/1/2 per cube — so a cube's clean slab/column split is X, Y,
    or Z (operator: layers OR vertical planes are both valid; vary the orientation)."""
    return int(hashlib.sha256(f"{cube_id}:axis".encode()).hexdigest(), 16) % 3


def _axis_slabs(cube_id: int, n: int) -> list[list[int]]:
    """Clean axis-aligned connected blocks (operator's preferred examples):
    n=3 → 3 planar slabs of 9 (e.g. Level 1/2/3, OR 3 vertical planes) along a seeded
    axis; n=9 → 9 columns of 3 (fix the other two coords) along a seeded axis."""
    axis = _slab_axis(cube_id)
    if n == 3:
        groups: list[list[int]] = [[], [], []]
        for i in range(27):
            groups[_cell_xyz(i)[axis]].append(i)
        return groups
    # n == 9 → collapse along the axis; the other-two-coord pair keys a column of 3.
    cols: dict[tuple[int, int, int], list[int]] = {}
    keys: list[tuple[int, int, int]] = []
    for i in range(27):
        c = list(_cell_xyz(i))
        c[axis] = 0
        key = (c[0], c[1], c[2])
        if key not in cols:
            cols[key] = []
            keys.append(key)
        cols[key].append(i)
    return [cols[k] for k in keys]


@lru_cache(maxsize=1024)
def partition(cube_id: int, n: int) -> list[list[int]]:
    """Split the 27 mini-cubes into n FACE-CONNECTED building blocks (the Lego rule:
    a block's cubes always touch — side-by-side OR stacked — so it could physically
    stack into a shape).

    Supports ANY n in 2..27. n≥27 → each mini-cube. n=3 → 3 clean planar slabs
    (layers or vertical planes, seeded axis); n=9 → 9 columns (seeded axis) — the
    operator's preferred clean examples. Every other n → seeded multi-source
    region-growing (any connected shape, unique per cube). @lru_cache keeps every
    config "saved in memory" (deterministic, reproduced identically)."""
    if n <= 1:
        return [list(range(27))]
    if n >= 27:
        return [[i] for i in range(27)]
    # For counts that CAN form clean axis slabs (3, 9), seeded-choose per cube between a
    # clean slab/column split and an IRREGULAR region-grown shape — clean is not required
    # (operator: "clean tab is not a need; 3 bottom cubes + a stacked middle cube + a
    # branch toward center is also possible"). Both are valid connected building blocks.
    if n in (3, 9):
        style = int(hashlib.sha256(f"{cube_id}:style".encode()).hexdigest(), 16) % 2
        if style == 0:
            return _axis_slabs(cube_id, n)
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


def _ordered_partition(cube_id: int, n: int) -> list[list[int]]:
    """`partition()` blocks reordered BASE-FIRST: the block sitting lowest (smallest
    min-z, then smallest cell index) is index 0, so the most foundational code — which
    `sections_for` assigns to block 0 — visibly anchors the bottom horizontal layer
    (operator: "the more foundational code takes the horizontal .1 base position").
    Deterministic; preserves coverage + face-connectivity (only the order changes)."""
    blocks = partition(cube_id, n)
    return sorted(blocks, key=lambda b: (min(i // 9 for i in b), b[0]))


def voxel_highlight(cube_id: int, level: int, section: str | None) -> list[int]:
    """Pure, deterministic lit set of mini-cube indices (0..26).

    section=None → the whole cube; A/B/C/D → that curated function block — a
    FACE-CONNECTED polycube (the Lego rule), varied per cube, mapped BASE-FIRST so A
    (the most foundational curated section) anchors the bottom layer. level ∈ {3,6,9}
    scales density within the eligible cells: 3 → ⅓, 6 → ⅔, 9 → all."""
    if level not in LEVELS:
        raise ValueError(f"level must be one of {LEVELS}, got {level!r}")
    if section is not None and section not in SECTION_KEYS:
        raise ValueError(f"section must be one of {SECTION_KEYS} or None, got {section!r}")
    cells = list(range(27)) if section is None else _ordered_partition(cube_id, 4)[SECTION_KEYS.index(section)]
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


_SSSES_PILLARS = ("security", "stability", "scalability", "efficiency", "succinctness")


def section_ssses(cube_id: int, fns: list[str], *, duration_ms: float = 0.0,
                  row_count: int = 0, loc: int = 0) -> dict:
    """SSSES score (0-100 per pillar) for ONE building block, from REAL per-block signals:
    Efficiency + Succinctness come from a genuine measurement when provided (section-scoped
    replay throughput + actual source LOC); the rest from the block's real function set.
    Pure + deterministic: same inputs → same scores. `measured` flags when real metrics fed it.
    """
    j = " ".join(fns).lower()
    sensitive = any(k in j for k in ("auth", "pii", "secret", "token", "password", "scrub"))
    security = 80 if sensitive else 96                       # sensitive code = more scrutiny
    stability = min(100, 84 + (16 if any(("hash" in f or "verify" in f or "replay" in f) for f in fns) else 0))
    scalability = min(100, 80 + (20 if any(k in j for k in ("batch", "stream", "aggregate", "bulk", "borda", "scale")) else 0))
    if duration_ms > 0 and row_count > 0:                    # REAL throughput → efficiency
        rps = row_count / (duration_ms / 1000.0)
        efficiency = max(40, min(100, round(52 + 12 * math.log10(max(1.0, rps)))))
    else:
        efficiency = max(55, 100 - max(0, len(fns) - 1) * 8)
    succinctness = max(50, 100 - loc // 12) if loc else max(60, 100 - max(0, len(fns) - 2) * 6)
    measured = bool(duration_ms > 0 and row_count > 0)
    notes = [
        f"{len(fns)} live fn(s)" + (f" · {loc} LOC" if loc else ""),
        "handles sensitive data" if sensitive else "no secret surface",
        (f"measured {row_count} rows in {duration_ms:.0f}ms" if measured else "efficiency estimated (run to measure)"),
    ]
    return {p: v for p, v in zip(_SSSES_PILLARS, (security, stability, scalability, efficiency, succinctness))} | {
        "measured": measured, "notes": notes,
    }


def sections_for(cube_id: int, count: int = 4) -> list[dict]:
    """Sections for a cube at the requested granularity (any count 2..27), each with
    its highlight sets, a decimal `code` (``{cube}.{k+1}`` — e.g. ``2.1 … 2.8``), and
    the REAL functions it maps to.

    The `code` replaces the confusing ``L#·KEY`` display (which collided with the Level
    tiers L1=Cubes 1-9 / L2=10-18 / L3=19-27). Section ``.1`` is the FOUNDATION: it holds
    the earliest (most foundational) functions and anchors the voxel's base layer.

    count == 4 → the curated function sections (A/B/C/D, real labels), base-first so A→.1.
    other counts → N face-connected block-segments; the cube's real functions are
    distributed CONTIGUOUSLY foundational-first (block 0/.1 = earliest functions), so
    every count mirrors the actual LIVE code with the base holding the foundation. Blocks
    past the function count are honestly empty/structural. Returns [] for an unknown cube.
    """
    if cube_id not in SECTIONS:
        return []
    if count == 4:
        return [{
            "key": s["key"], "code": f"{cube_id}.{k + 1}", "label": s["label"],
            "functions": s["functions"],
            "highlight": {str(lvl): voxel_highlight(cube_id, lvl, s["key"]) for lvl in LEVELS},
        } for k, s in enumerate(SECTIONS[cube_id])]
    out: list[dict] = []
    blocks = _ordered_partition(cube_id, count)  # base-first: block 0 anchors the bottom
    # Distribute the cube's REAL functions across the N blocks in CONTIGUOUS chunks in
    # foundational order (SECTIONS lists base/setup first), so block 0 (.1) holds the most
    # foundational code and later blocks hold downstream code — every count mirrors the
    # actual LIVE code (FX-J). Blocks past the function count are honestly empty/structural.
    allfns = [fn for s in SECTIONS.get(cube_id, []) for fn in s["functions"]]
    total = len(allfns)
    # Assign function j to block floor(j*count/total): contiguous runs, foundational-first,
    # and block 0 (.1) always holds allfns[0] even when count > total (later blocks empty).
    for k in range(count):
        cells = blocks[k]
        fns = [allfns[j] for j in range(total) if (j * count) // total == k]
        out.append({
            "key": f"B{k + 1}", "code": f"{cube_id}.{k + 1}", "label": f"Block {k + 1}",
            "functions": fns,
            "highlight": {"3": cells, "6": cells, "9": cells},  # ON/OFF whole block
        })
    return out
