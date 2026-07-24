"""§3 — deterministic 27-voxel sections + highlight (the single junction)."""
import pytest

from app.cubes.cube10_simulation.sections import (
    ALLOWED_SECTION_COUNTS,
    LEVELS,
    SECTION_KEYS,
    SECTIONS,
    _face_neighbors,
    partition,
    sections_for,
    segment_cells,
    voxel_highlight,
)

ALL_CUBES = list(range(1, 10))


def _is_face_connected(cells: list[int]) -> bool:
    """True iff the cells form ONE face-connected polycube (the Lego rule)."""
    if not cells:
        return True
    want = set(cells)
    seen = {cells[0]}
    stack = [cells[0]]
    while stack:
        cur = stack.pop()
        for nb in _face_neighbors(cur):
            if nb in want and nb not in seen:
                seen.add(nb)
                stack.append(nb)
    return seen == want


def _all_planar(groups: list[list[int]]) -> bool:
    """True iff every group is a flat axis-plane (a clean slab: all cells share x, y, or z)."""
    for g in groups:
        xs = {i % 3 for i in g}
        ys = {(i // 3) % 3 for i in g}
        zs = {i // 9 for i in g}
        if not (len(xs) == 1 or len(ys) == 1 or len(zs) == 1):
            return False
    return True


class TestSectionsMap:
    def test_all_9_cubes_have_4_sections(self):
        for c in ALL_CUBES:
            secs = SECTIONS[c]
            assert [s["key"] for s in secs] == list(SECTION_KEYS)
            assert all(s["label"] and s["functions"] for s in secs)


class TestVoxelHighlight:
    def test_partition_covers_all_27_at_level_9(self):
        # Whole cube at max level lights every mini-cube exactly once.
        for c in ALL_CUBES:
            assert voxel_highlight(c, 9, None) == list(range(27))

    def test_sections_partition_the_27(self):
        # The 4 sections at level 9 are disjoint and together cover 0..26.
        for c in ALL_CUBES:
            seen: list[int] = []
            for k in SECTION_KEYS:
                seen += voxel_highlight(c, 9, k)
            assert sorted(seen) == list(range(27))
            assert len(seen) == 27  # disjoint (no cell in two sections)

    def test_deterministic(self):
        for c in ALL_CUBES:
            for lvl in LEVELS:
                assert voxel_highlight(c, lvl, "B") == voxel_highlight(c, lvl, "B")

    def test_level_scales_density(self):
        # 3 ≤ 6 ≤ 9 lit cells for the whole cube (⅓ → ⅔ → all).
        for c in ALL_CUBES:
            n3 = len(voxel_highlight(c, 3, None))
            n6 = len(voxel_highlight(c, 6, None))
            n9 = len(voxel_highlight(c, 9, None))
            assert n3 <= n6 <= n9 == 27
            assert n3 == 9 and n6 == 18  # ceil(27*3/9), ceil(27*6/9)

    def test_sections_are_face_connected(self):
        # FX-I / Lego rule: every building block's mini-cubes must TOUCH (be a single
        # face-connected polycube) — not a scatter, so it could physically stack.
        for c in ALL_CUBES:
            for key in SECTION_KEYS:
                assert _is_face_connected(voxel_highlight(c, 9, key)), \
                    f"cube {c} section {key} is not face-connected"

    def test_sections_vary_per_cube(self):
        # FX-I: the 4-block pattern differs across cubes (per-cube variety restored).
        sigs = {tuple(voxel_highlight(c, 9, "A")) for c in ALL_CUBES}
        assert len(sigs) > 1

    def test_bad_level_and_section_raise(self):
        with pytest.raises(ValueError):
            voxel_highlight(1, 5, None)
        with pytest.raises(ValueError):
            voxel_highlight(1, 3, "Z")


class TestSegmentCells:
    def test_n3_is_the_three_levels(self):
        assert segment_cells(3, 0) == list(range(0, 9))    # Level 1
        assert segment_cells(3, 1) == list(range(9, 18))   # Level 2
        assert segment_cells(3, 2) == list(range(18, 27))  # Level 3

    def test_n27_is_singletons(self):
        assert [segment_cells(27, k) for k in range(27)] == [[k] for k in range(27)]

    @pytest.mark.parametrize("n", ALLOWED_SECTION_COUNTS)
    def test_slabs_partition_all_27_once(self, n):
        seen: list[int] = []
        for k in range(n):
            cells = segment_cells(n, k)
            assert cells == list(range(cells[0], cells[-1] + 1)) if cells else True  # contiguous
            seen += cells
        assert sorted(seen) == list(range(27))


class TestPartition:
    @pytest.mark.parametrize("n", ALLOWED_SECTION_COUNTS)
    def test_blocks_are_face_connected_and_cover(self, n):
        for c in ALL_CUBES:
            groups = partition(c, n)
            assert len(groups) == n
            seen: list[int] = []
            for g in groups:
                assert g, "empty block"
                assert _is_face_connected(g), f"cube {c} n={n} block not connected: {g}"
                seen += g
            assert sorted(seen) == list(range(27))  # disjoint + cover all 27

    def test_n27_singletons(self):
        assert partition(5, 27) == [[k] for k in range(27)]

    def test_n3_supports_clean_slabs_AND_irregular(self):
        # Operator: clean 3×3 slabs are valid, but "clean is not a need" — irregular
        # connected shapes are also valid. Across cubes we get BOTH (seeded style).
        planar = [_all_planar(partition(c, 3)) for c in range(1, 40)]
        assert any(planar), "no clean slab config appeared"
        assert any(not p for p in planar), "no irregular config appeared"
        for c in range(1, 40):  # every config is always face-connected + covers
            groups = partition(c, 3)
            assert sorted(x for g in groups for x in g) == list(range(27))
            for g in groups:
                assert _is_face_connected(g)

    def test_shapes_vary_across_cubes(self):
        assert len({tuple(tuple(g) for g in partition(c, 3)) for c in ALL_CUBES}) > 1

    def test_deterministic(self):
        assert partition(6, 4) == partition(6, 4)

    def test_four_block_pattern_varies_across_cubes(self):
        pats = {tuple(tuple(g) for g in partition(c, 4)) for c in ALL_CUBES}
        assert len(pats) > 1


class TestSectionsForCounts:
    @pytest.mark.parametrize("n", ALLOWED_SECTION_COUNTS)
    def test_sections_for_count(self, n):
        secs = sections_for(5, n)
        assert len(secs) == n
        merged: list[int] = []
        for s in secs:
            merged += s["highlight"]["9"]
        assert sorted(merged) == list(range(27))  # cover all 27 once

    def test_block_labels_and_real_functions(self):
        # FX-J: block-view sections are "Block k" and mirror the cube's REAL functions.
        secs = sections_for(5, 3)
        assert [s["label"] for s in secs] == ["Block 1", "Block 2", "Block 3"]
        real = {fn for s in SECTIONS[5] for fn in s["functions"]}
        distributed = {fn for s in secs for fn in s["functions"]}
        assert distributed == real  # every real function lands in exactly one block

    def test_default_is_curated_four(self):
        secs = sections_for(5)
        assert [s["key"] for s in secs] == list(SECTION_KEYS)


class TestDecimalCodesAndFoundationalBase:
    """Slice 2 — sections carry a decimal `code` ({cube}.{k+1}); block .1 is the
    FOUNDATION (earliest function) and anchors the voxel base (bottom z=0 layer)."""

    @pytest.mark.parametrize("n", [2, 3, 4, 6, 9])
    def test_codes_are_decimal_cube_dot_section(self, n):
        for c in ALL_CUBES:
            secs = sections_for(c, n)
            assert [s["code"] for s in secs] == [f"{c}.{k + 1}" for k in range(n)]

    @pytest.mark.parametrize("n", [2, 3, 6, 9])
    def test_block_one_holds_the_most_foundational_function(self, n):
        # .1 = block 0 = the earliest (most foundational) function in the cube's real order.
        for c in ALL_CUBES:
            allfns = [fn for s in SECTIONS[c] for fn in s["functions"]]
            secs = sections_for(c, n)
            assert secs[0]["functions"][0] == allfns[0]

    @pytest.mark.parametrize("n", [2, 3, 4, 6, 9, 27])
    def test_block_one_anchors_the_base_layer(self, n):
        # .1's cells include a base cell (z == 0, cells 0-8) — the foundation sits at bottom.
        for c in ALL_CUBES:
            secs = sections_for(c, n)
            base_cells = secs[0]["highlight"]["9"]
            assert any(cell // 9 == 0 for cell in base_cells), f"cube {c} n={n} .1 not at base"

    def test_curated_four_a_is_dot_one_and_foundational(self):
        for c in ALL_CUBES:
            secs = sections_for(c, 4)
            assert secs[0]["key"] == "A" and secs[0]["code"] == f"{c}.1"
            assert any(cell // 9 == 0 for cell in secs[0]["highlight"]["9"])


class TestSectionSSSES:
    """SP — per-block SSSES from real signals (5 pillars 0-100, deterministic)."""

    def test_five_pillars_in_range(self):
        from app.cubes.cube10_simulation.sections import _SSSES_PILLARS, section_ssses
        for c in ALL_CUBES:
            for s in sections_for(c, sections_for.__defaults__[0]):  # default 4
                r = section_ssses(c, s["functions"])
                assert set(_SSSES_PILLARS) <= set(r)
                assert all(0 <= r[p] <= 100 for p in _SSSES_PILLARS)
                assert r["notes"] and "measured" in r

    def test_measured_flag_and_real_efficiency(self):
        from app.cubes.cube10_simulation.sections import section_ssses
        est = section_ssses(2, ["validate_text_input"])                       # no metrics
        meas = section_ssses(2, ["validate_text_input"], duration_ms=50.0, row_count=5000, loc=40)
        assert est["measured"] is False and meas["measured"] is True
        assert meas["efficiency"] >= est["efficiency"]                        # high throughput scores well

    def test_deterministic(self):
        from app.cubes.cube10_simulation.sections import section_ssses
        a = section_ssses(7, ["aggregate_rankings"], duration_ms=42.0, row_count=300, loc=25)
        b = section_ssses(7, ["aggregate_rankings"], duration_ms=42.0, row_count=300, loc=25)
        assert a == b

    def test_sensitive_code_scores_lower_security(self):
        from app.cubes.cube10_simulation.sections import section_ssses
        assert section_ssses(2, ["scrub_pii"])["security"] < section_ssses(2, ["get_response_count"])["security"]


class TestSectionsFor:
    def test_sections_for_carries_per_level_highlight(self):
        secs = sections_for(5)
        assert len(secs) == 4
        for s in secs:
            assert set(s["highlight"].keys()) == {"3", "6", "9"}
            # highlight matches the pure fn (single source)
            assert s["highlight"]["9"] == voxel_highlight(5, 9, s["key"])

    def test_unknown_cube_returns_empty(self):
        assert sections_for(99) == []
