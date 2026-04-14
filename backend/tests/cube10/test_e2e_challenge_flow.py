"""Cube 10 — E2E Challenge Flow: Create → Claim → Submit → Test → Vote → Deploy.

Tests the complete lifecycle of a code challenge, simulating
both Admin and Challenger paths through the system.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime, timezone

import pytest


def _mock_db():
    """Mock AsyncSession for Cube 10 persistence (O8)."""
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    mock_ch = MagicMock()
    mock_ch.id = uuid.uuid4()
    mock_ch.cube_id = 7
    mock_ch.function_name = "test_fn"
    mock_ch.status = "open"
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_ch
    db.execute = AsyncMock(return_value=mock_result)
    async def _refresh(obj):
        if not hasattr(obj, "created_at") or obj.created_at is None:
            obj.created_at = datetime.now(timezone.utc)
        if not hasattr(obj, "id") or obj.id is None:
            obj.id = uuid.uuid4()
    db.refresh = AsyncMock(side_effect=_refresh)
    return db


from app.cubes.cube10_simulation.service import (
    SUPERMAJORITY_THRESHOLD,
    claim_challenge,
    compare_metrics,
    create_challenge,
    create_submission,
    submit_challenge,
    submit_feedback,
    tally_votes,
)


class TestFullChallengeLifecycle:
    """Simulate the complete challenge flow end-to-end."""

    @pytest.mark.asyncio
    async def test_complete_challenge_flow(self):
        """Admin creates challenge → Challenger claims → submits → metrics pass → votes approve → deploy."""

        # Step 1: Admin creates challenge for Cube 7 Borda optimization
        challenge = await create_challenge(_mock_db(), 
            cube_id=7,
            title="Optimize Borda aggregation for 10M voters",
            description="Current O(N) Borda scoring needs streaming accumulator for 10M+ scale",
            acceptance_criteria="Must pass all 164 existing Cube 7 tests AND handle 10M votes in <5s",
            function_name="aggregate_rankings",
            reward_heart=20.0,
            reward_unity=100.0,
        )
        assert challenge["status"] == "open"
        assert challenge["cube_id"] == 7
        challenge_id = challenge["challenge_id"]
        print(f"\n  Step 1: Challenge created: {challenge_id}")

        # Step 2: Challenger claims the challenge
        claim = await claim_challenge(_mock_db(), challenge_id, "challenger_alice")
        assert claim["status"] == "claimed"
        assert "sim-" in claim["simulation_id"]
        assert "workers.dev" in claim["portal_url"]
        print(f"  Step 2: Claimed by alice, portal: {claim['portal_url'][:60]}...")

        # Step 3: Challenger submits enhanced code
        submission = await submit_challenge(_mock_db(), 
            challenge_id,
            "challenger_alice",
            """
async def aggregate_rankings(db, session_id, cycle_id=1, seed=None):
    # Streaming Borda accumulator - O(K) instead of O(N)
    from app.cubes.cube7_ranking.scale_engine import BordaAccumulator
    acc = BordaAccumulator(n_themes=9, seed=seed or str(session_id))
    # Stream votes from DB cursor instead of loading all into memory
    async for ranking in stream_rankings(db, session_id, cycle_id):
        acc.add_vote(ranking.ranked_theme_ids, str(ranking.participant_id))
    return acc.aggregate()
            """,
        )
        assert submission["status"] == "submitted"
        submission_id = submission["submission_id"]
        print(f"  Step 3: Code submitted: {submission_id}")

        # Step 4: Automated testing (simulated — metrics comparison)
        baseline = {
            "tests_total": 164,
            "duration_ms": 3752,
            "ssses": {"security": 95, "stability": 97, "scalability": 88, "efficiency": 94, "succinctness": 93},
        }
        submission_metrics = {
            "tests_passed": 164,
            "duration_ms": 2100,  # Faster!
            "ssses": {"security": 95, "stability": 97, "scalability": 98, "efficiency": 96, "succinctness": 93},
        }
        comparison = compare_metrics(baseline, submission_metrics)
        assert comparison["overall_passed"] is True
        assert comparison["recommendation"] == "proceed_to_voting"
        print(f"  Step 4: Tests PASSED — proceed to voting")

        # Step 5: Community votes (12 Ascended Master agents + community)
        votes = [
            {"vote": "approve", "tokens_staked": 100},   # Enki
            {"vote": "approve", "tokens_staked": 50},    # Thor
            {"vote": "approve", "tokens_staked": 75},    # Krishna
            {"vote": "approve", "tokens_staked": 200},   # Odin
            {"vote": "approve", "tokens_staked": 30},    # Athena
            {"vote": "approve", "tokens_staked": 60},    # Thoth
            {"vote": "approve", "tokens_staked": 45},    # Sofia
            {"vote": "approve", "tokens_staked": 80},    # Aset
            {"vote": "reject", "tokens_staked": 150},    # Pangu (disagrees)
            {"vote": "approve", "tokens_staked": 40},    # Christo
            {"vote": "approve", "tokens_staked": 55},    # Enlil
            {"vote": "approve", "tokens_staked": 90},    # Asar
        ]
        tally = tally_votes(votes, total_token_holders=50)
        assert tally["quorum_met"] is True  # 12/50 = 24% > 10%
        assert tally["supermajority_met"] is True  # 11 approve vs 1 reject
        assert tally["result"] == "approved"
        print(f"  Step 5: Vote result: {tally['result']} ({tally['approval_percent']:.1f}%)")

        # Step 6: Admin deployment (simulated)
        print(f"  Step 6: Admin deploys — hot-swap to production ✓")
        print(f"\n  === FULL LIFECYCLE COMPLETE ===")
        print(f"  Challenge: Cube 7 Borda optimization")
        print(f"  Challenger: alice")
        print(f"  Tests: PASS (164/164, 44% faster)")
        print(f"  Vote: {tally['approval_percent']:.1f}% approved (supermajority)")
        print(f"  Reward: ♡20 + ◬100 tokens")


class TestChallengeRejectionPath:
    """Test the rejection path — code fails tests or community rejects."""

    @pytest.mark.asyncio
    async def test_metrics_fail_blocks_voting(self):
        """If tests fail, submission is rejected before voting."""
        baseline = {"tests_total": 164, "duration_ms": 3000, "ssses": {"security": 95, "stability": 97, "scalability": 88, "efficiency": 94, "succinctness": 93}}
        bad_submission = {"tests_passed": 150, "duration_ms": 5000, "ssses": {"security": 90, "stability": 95, "scalability": 85, "efficiency": 80, "succinctness": 90}}

        comparison = compare_metrics(baseline, bad_submission)
        assert comparison["overall_passed"] is False
        assert comparison["recommendation"] == "reject"

    @pytest.mark.asyncio
    async def test_community_rejects(self):
        """Community votes NO — submission rejected."""
        votes = [
            {"vote": "reject", "tokens_staked": 200},
            {"vote": "reject", "tokens_staked": 150},
            {"vote": "approve", "tokens_staked": 50},
        ]
        tally = tally_votes(votes, total_token_holders=10)
        assert tally["result"] == "rejected"


class TestAIvsHICompetition:
    """Both AI and human submit for same challenge — community picks winner."""

    @pytest.mark.asyncio
    async def test_dual_submission(self):
        """AI and human both submit — both valid."""
        challenge = await create_challenge(_mock_db(), 
            cube_id=6, title="Optimize marble sampling",
            description="Speed up marble sampling for 1M responses",
            acceptance_criteria="Must complete sampling in <2s for 1M responses",
        )

        ai_sub = await create_submission(_mock_db(), 
            cube_id=6, function_name="_marble_sample",
            submitter_id="ai_agent_opus", submitter_type="ai",
            code_diff="def _marble_sample(items, seed): # AI-optimized vectorized version..."
        )
        assert ai_sub["submitter_type"] == "ai"

        hi_sub = await create_submission(_mock_db(), 
            cube_id=6, function_name="_marble_sample",
            submitter_id="dev_alice", submitter_type="human",
            code_diff="def _marble_sample(items, seed): # Human-crafted parallel version..."
        )
        assert hi_sub["submitter_type"] == "human"

        # Both pass tests — community votes on which is better
        print(f"\n  AI submission: {ai_sub['submission_id'][:8]}")
        print(f"  HI submission: {hi_sub['submission_id'][:8]}")
        print(f"  Community decides which implementation ships!")


class TestFeedbackToChallengePipeline:
    """Feedback → triage → challenge creation flow."""

    @pytest.mark.asyncio
    async def test_bug_feedback_creates_high_priority(self):
        """Bug report becomes high-priority challenge material."""
        feedback = await submit_feedback(
            None,
            cube_id=7,
            text="Ranking crashes when more than 50,000 users vote simultaneously",
            submitted_by="user_bob",
        )
        assert feedback["priority"] == 3  # High (bug keyword)
        assert feedback["category"] == "bug"

        # Admin creates challenge from this feedback
        challenge = await create_challenge(_mock_db(), 
            cube_id=7,
            title="Fix ranking crash at 50K+ concurrent voters",
            description=f"Based on feedback: {feedback['text']}",
            acceptance_criteria="Must handle 100K concurrent voters without crash, verified by scale test",
        )
        assert challenge["status"] == "open"
        print(f"\n  Feedback → Challenge pipeline verified")
        print(f"  Bug report priority: {feedback['priority']}")
        print(f"  Challenge created: {challenge['challenge_id'][:8]}")
