"""§4a — real dataset-replay for ALL 9 cubes (whole + section-scoped, deterministic)."""
import pytest

from app.cubes.cube10_simulation.saved_use_cases import (
    SavedUseCaseManager,
    replay_against_dataset,
)

ALL_CUBES = list(range(1, 10))


def _case():
    mgr = SavedUseCaseManager()
    return mgr.get_case("demo") or mgr.demo


class TestReplayAllCubes:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("cube_id", ALL_CUBES)
    async def test_whole_cube_replay_is_real(self, cube_id):
        r = await replay_against_dataset(_case(), cube_id, function_name="")
        assert r["status"] == "replayed"  # no more pending_dataset_replay
        assert r["replay_hash_match"] is True
        assert len(r["replay_hash"]) == 64
        assert r.get("scope") == "cube"

    @pytest.mark.asyncio
    @pytest.mark.parametrize("cube_id", ALL_CUBES)
    async def test_section_replay_is_block_scoped_and_distinct(self, cube_id):
        whole = await replay_against_dataset(_case(), cube_id, function_name="")
        block = await replay_against_dataset(_case(), cube_id, function_name="", section="B")
        assert block["status"] == "replayed"
        assert block["scope"] == "block"
        assert block["section"] == "B"
        assert len(block["replay_hash"]) == 64
        # A block-scoped replay hashes DISTINCTLY from the whole cube.
        assert block["replay_hash"] != whole["replay_hash"]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("cube_id", ALL_CUBES)
    async def test_deterministic_across_two_runs(self, cube_id):
        a = await replay_against_dataset(_case(), cube_id, function_name="", section="C")
        b = await replay_against_dataset(_case(), cube_id, function_name="", section="C")
        assert a["replay_hash"] == b["replay_hash"]
