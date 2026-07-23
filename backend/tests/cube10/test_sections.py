"""§3 — deterministic 27-voxel sections + highlight (the single junction)."""
import pytest

from app.cubes.cube10_simulation.sections import (
    ALLOWED_SECTION_COUNTS,
    LEVELS,
    SECTION_KEYS,
    SECTIONS,
    sections_for,
    segment_cells,
    voxel_highlight,
)

ALL_CUBES = list(range(1, 10))


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

    def test_sections_are_coherent_contiguous_slabs(self):
        # FX-G: a section is a COHERENT contiguous segment, the SAME shape for every
        # cube (operator: "not a random pattern; a building block is a segment").
        for c in ALL_CUBES:
            for k, key in enumerate(SECTION_KEYS):
                cells = voxel_highlight(c, 9, key)
                assert cells == list(range(cells[0], cells[-1] + 1))  # contiguous
                assert cells == segment_cells(4, k)                    # same across cubes

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


class TestSectionsForCounts:
    @pytest.mark.parametrize("n", ALLOWED_SECTION_COUNTS)
    def test_sections_for_count(self, n):
        secs = sections_for(5, n)
        assert len(secs) == n
        merged: list[int] = []
        for s in secs:
            merged += s["highlight"]["9"]
        assert sorted(merged) == list(range(27))  # cover all 27 once

    def test_n3_labels_are_levels(self):
        assert [s["label"] for s in sections_for(5, 3)] == ["Level 1", "Level 2", "Level 3"]

    def test_default_is_curated_four(self):
        secs = sections_for(5)
        assert [s["key"] for s in secs] == list(SECTION_KEYS)


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
