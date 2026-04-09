"""Cube 10 — Challenge System Tests.

Tests the Grok-designed Challenger architecture:
  - Challenge creation (Admin)
  - Challenge claim (Challenger gets simulation portal)
  - Challenge submission (enhanced code for review)
  - Validation rules
"""

import pytest

from app.cubes.cube10_simulation.service import (
    CHALLENGE_STATES,
    claim_challenge,
    create_challenge,
    submit_challenge,
)


class TestChallengeConstants:
    def test_challenge_states(self):
        assert "open" in CHALLENGE_STATES
        assert "claimed" in CHALLENGE_STATES
        assert "submitted" in CHALLENGE_STATES
        assert "completed" in CHALLENGE_STATES
        assert "closed" in CHALLENGE_STATES


class TestCreateChallenge:
    @pytest.mark.asyncio
    async def test_valid_challenge(self):
        result = await create_challenge(
            cube_id=7,
            title="Optimize Borda aggregation",
            description="Improve the Borda count algorithm for 10M voters",
            acceptance_criteria="Must pass all existing tests and handle 10M votes in <5s",
        )
        assert result["status"] == "open"
        assert result["cube_id"] == 7
        assert "challenge_id" in result

    @pytest.mark.asyncio
    async def test_invalid_cube_id(self):
        with pytest.raises(ValueError, match="Invalid cube_id"):
            await create_challenge(cube_id=0, title="Test", description="D",
                                  acceptance_criteria="Must pass tests")

    @pytest.mark.asyncio
    async def test_short_title_rejected(self):
        with pytest.raises(ValueError, match="title"):
            await create_challenge(cube_id=7, title="Hi", description="D",
                                  acceptance_criteria="Must pass all tests")

    @pytest.mark.asyncio
    async def test_short_criteria_rejected(self):
        with pytest.raises(ValueError, match="criteria"):
            await create_challenge(cube_id=7, title="Valid Title",
                                  description="D", acceptance_criteria="short")

    @pytest.mark.asyncio
    async def test_custom_rewards(self):
        result = await create_challenge(
            cube_id=6, title="AI Pipeline Speed",
            description="Optimize marble sampling",
            acceptance_criteria="Must complete in <30s for 1M responses",
            reward_heart=20.0, reward_unity=100.0,
        )
        assert result["reward_heart"] == 20.0
        assert result["reward_unity"] == 100.0


class TestClaimChallenge:
    @pytest.mark.asyncio
    async def test_claim_returns_portal_url(self):
        result = await claim_challenge("challenge-123", "dev-456")
        assert result["status"] == "claimed"
        assert "portal_url" in result
        assert "sim-" in result["portal_url"]
        assert result["simulation_id"].startswith("sim-")

    @pytest.mark.asyncio
    async def test_claim_returns_simulation_id(self):
        result = await claim_challenge("c1", "d1")
        assert len(result["simulation_id"]) > 10


class TestSubmitChallenge:
    @pytest.mark.asyncio
    async def test_valid_submission(self):
        result = await submit_challenge(
            "challenge-1", "dev-1",
            "def aggregate_rankings(): # optimized O(k) version with streaming"
        )
        assert result["status"] == "submitted"
        assert "submission_id" in result

    @pytest.mark.asyncio
    async def test_empty_diff_rejected(self):
        with pytest.raises(ValueError, match="too short"):
            await submit_challenge("c1", "d1", "   ")


class TestChallengeModel:
    def test_model_exists(self):
        from app.models.code_submission import Challenge
        assert Challenge.__tablename__ == "challenges"

    def test_columns(self):
        from app.models.code_submission import Challenge
        cols = [c.key for c in Challenge.__table__.columns]
        for col in ["cube_id", "title", "description", "acceptance_criteria",
                     "status", "claimed_by", "simulation_id", "reward_heart"]:
            assert col in cols, f"Missing: {col}"
