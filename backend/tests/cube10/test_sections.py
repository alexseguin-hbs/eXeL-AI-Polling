"""§3 — deterministic 27-voxel sections + highlight (the single junction)."""
import pytest

from app.cubes.cube10_simulation.sections import (
    LEVELS,
    SECTION_KEYS,
    SECTIONS,
    sections_for,
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

    def test_unique_fingerprint_per_cube(self):
        # No two cubes share the same section-A cell set (unique visual signature).
        sigs = {c: tuple(voxel_highlight(c, 9, "A")) for c in ALL_CUBES}
        assert len(set(sigs.values())) == len(ALL_CUBES)

    def test_bad_level_and_section_raise(self):
        with pytest.raises(ValueError):
            voxel_highlight(1, 5, None)
        with pytest.raises(ValueError):
            voxel_highlight(1, 3, "Z")


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
