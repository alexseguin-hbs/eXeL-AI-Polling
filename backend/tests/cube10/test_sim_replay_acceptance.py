"""§9 — sim_replay ACCEPTANCE: the R-Core self-test.

Playing the sim back over all 9 cubes must prove the R-Core operations hold:
  (1) determinism — every (cube, section) replay_hash reproduces bit-for-bit across runs;
  (2) real — no cube returns pending_dataset_replay (all replay for real);
  (3) block scope — each of the 4 sections hashes DISTINCTLY from the whole cube and
      from every other section (the seeded voxel partition made observable);
  (4) shape — every replay_hash is 64-hex.
This is the platform proving itself by replaying itself.
"""
import pytest

from app.cubes.cube10_simulation.saved_use_cases import (
    SavedUseCaseManager,
    replay_against_dataset,
)
from app.cubes.cube10_simulation.sections import SECTION_KEYS

ALL_CUBES = list(range(1, 10))


def _case():
    mgr = SavedUseCaseManager()
    return mgr.get_case("demo") or mgr.demo


class TestSimReplayAcceptance:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("cube_id", ALL_CUBES)
    async def test_r_core_replay_holds(self, cube_id):
        # (2) real + (4) shape for the whole cube
        whole1 = await replay_against_dataset(_case(), cube_id, function_name="")
        whole2 = await replay_against_dataset(_case(), cube_id, function_name="")
        assert whole1["status"] == "replayed"
        assert len(whole1["replay_hash"]) == 64
        # (1) determinism
        assert whole1["replay_hash"] == whole2["replay_hash"]

        # Each section: real, 64-hex, deterministic, distinct from whole.
        seen = {whole1["replay_hash"]}
        for key in SECTION_KEYS:
            a = await replay_against_dataset(_case(), cube_id, function_name="", section=key)
            b = await replay_against_dataset(_case(), cube_id, function_name="", section=key)
            assert a["status"] == "replayed"
            assert len(a["replay_hash"]) == 64
            assert a["replay_hash"] == b["replay_hash"]            # (1) determinism
            assert a["scope"] == "block"                            # (3) block scope
            assert a["replay_hash"] not in seen                     # (3) distinct
            seen.add(a["replay_hash"])
        # whole + 4 sections = 5 distinct hashes
        assert len(seen) == 1 + len(SECTION_KEYS)
