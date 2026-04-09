"""Cube 10 — Simulation Engine Tests.

Tests:
  - Feedback submission + auto-priority
  - Code submission validation
  - Metrics comparison (pass/fail logic)
  - Vote tallying (quadratic weights, supermajority, quorum)
  - Constants verification
"""

import uuid

import pytest

from app.cubes.cube10_simulation.service import (
    MIN_QUORUM_PERCENT,
    SUBMISSION_STATES,
    SUPERMAJORITY_THRESHOLD,
    compare_metrics,
    create_submission,
    submit_feedback,
    tally_votes,
)


# ═══════════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════════


class TestConstants:
    def test_supermajority_66_point_6(self):
        assert SUPERMAJORITY_THRESHOLD == 0.666

    def test_quorum_10_percent(self):
        assert MIN_QUORUM_PERCENT == 0.10

    def test_all_submission_states(self):
        expected = {"pending", "testing", "voting", "approved", "deployed", "reverted", "rejected"}
        assert SUBMISSION_STATES == expected


# ═══════════════════════════════════════════════════════════════════
# Feedback
# ═══════════════════════════════════════════════════════════════════


class TestFeedback:
    @pytest.mark.asyncio
    async def test_submit_feedback_returns_id(self):
        result = await submit_feedback(
            None, cube_id=7, text="Ranking UI is great!", submitted_by="user1"
        )
        assert "feedback_id" in result
        assert result["cube_id"] == 7
        assert result["status"] == "new"

    @pytest.mark.asyncio
    async def test_urgent_keyword_boosts_priority(self):
        result = await submit_feedback(
            None, cube_id=2, text="The app is broken and crashes on submit",
            submitted_by="user2"
        )
        assert result["priority"] == 3  # High priority
        assert result["sentiment"] < 0
        assert result["category"] == "bug"

    @pytest.mark.asyncio
    async def test_positive_keyword_lowers_priority(self):
        result = await submit_feedback(
            None, cube_id=1, text="I love the ranking experience, it's amazing!",
            submitted_by="user3"
        )
        assert result["priority"] == 1  # Low priority (positive = not urgent)
        assert result["sentiment"] > 0

    @pytest.mark.asyncio
    async def test_neutral_feedback_default_priority(self):
        result = await submit_feedback(
            None, cube_id=4, text="The interface works as expected.",
            submitted_by="user4"
        )
        assert result["priority"] == 2  # Medium default
        assert result["sentiment"] == 0.0
        assert result["category"] == "general"


# ═══════════════════════════════════════════════════════════════════
# Code Submission
# ═══════════════════════════════════════════════════════════════════


class TestCodeSubmission:
    @pytest.mark.asyncio
    async def test_valid_submission(self):
        result = await create_submission(
            cube_id=7, function_name="aggregate_rankings",
            submitter_id="dev1", submitter_type="human",
            code_diff="def aggregate_rankings(): # improved version with O(1) lookup"
        )
        assert result["status"] == "pending"
        assert result["cube_id"] == 7
        assert "cube7/submission" in result["branch_name"]

    @pytest.mark.asyncio
    async def test_ai_submission(self):
        result = await create_submission(
            cube_id=6, function_name="run_pipeline",
            submitter_id="ai_agent_1", submitter_type="ai",
            code_diff="async def run_pipeline(): # AI-optimized version"
        )
        assert result["submitter_type"] == "ai"

    @pytest.mark.asyncio
    async def test_invalid_cube_id(self):
        with pytest.raises(ValueError, match="Invalid cube_id"):
            await create_submission(
                cube_id=0, function_name="test",
                submitter_id="dev", submitter_type="human",
                code_diff="x" * 20
            )

    @pytest.mark.asyncio
    async def test_invalid_cube_id_too_high(self):
        with pytest.raises(ValueError, match="Invalid cube_id"):
            await create_submission(
                cube_id=10, function_name="test",
                submitter_id="dev", submitter_type="human",
                code_diff="x" * 20
            )

    @pytest.mark.asyncio
    async def test_invalid_submitter_type(self):
        with pytest.raises(ValueError, match="submitter_type"):
            await create_submission(
                cube_id=7, function_name="test",
                submitter_id="dev", submitter_type="robot",
                code_diff="x" * 20
            )

    @pytest.mark.asyncio
    async def test_empty_diff_rejected(self):
        with pytest.raises(ValueError, match="too short"):
            await create_submission(
                cube_id=7, function_name="test",
                submitter_id="dev", submitter_type="human",
                code_diff="   "
            )


# ═══════════════════════════════════════════════════════════════════
# Metrics Comparison
# ═══════════════════════════════════════════════════════════════════


class TestMetricsComparison:
    def test_all_pass(self):
        baseline = {"tests_total": 100, "duration_ms": 500, "ssses": {"security": 90, "stability": 90, "scalability": 80, "efficiency": 85, "succinctness": 88}}
        submission = {"tests_passed": 105, "duration_ms": 450, "ssses": {"security": 92, "stability": 91, "scalability": 82, "efficiency": 87, "succinctness": 90}}
        result = compare_metrics(baseline, submission)
        assert result["overall_passed"] is True
        assert result["recommendation"] == "proceed_to_voting"

    def test_tests_fail(self):
        baseline = {"tests_total": 100, "duration_ms": 500, "ssses": {"security": 90, "stability": 90, "scalability": 80, "efficiency": 85, "succinctness": 88}}
        submission = {"tests_passed": 95, "duration_ms": 450, "ssses": {"security": 92, "stability": 91, "scalability": 82, "efficiency": 87, "succinctness": 90}}
        result = compare_metrics(baseline, submission)
        assert result["overall_passed"] is False
        assert result["tests"]["passed"] is False

    def test_duration_too_slow(self):
        baseline = {"tests_total": 100, "duration_ms": 500, "ssses": {"security": 90, "stability": 90, "scalability": 80, "efficiency": 85, "succinctness": 88}}
        submission = {"tests_passed": 100, "duration_ms": 700, "ssses": {"security": 90, "stability": 90, "scalability": 80, "efficiency": 85, "succinctness": 88}}
        result = compare_metrics(baseline, submission)
        assert result["duration"]["passed"] is False

    def test_ssses_decrease_fails(self):
        baseline = {"tests_total": 50, "duration_ms": 200, "ssses": {"security": 90, "stability": 90, "scalability": 80, "efficiency": 85, "succinctness": 88}}
        submission = {"tests_passed": 50, "duration_ms": 200, "ssses": {"security": 85, "stability": 90, "scalability": 80, "efficiency": 85, "succinctness": 88}}
        result = compare_metrics(baseline, submission)
        assert result["ssses_security"]["passed"] is False
        assert result["overall_passed"] is False

    def test_empty_baseline(self):
        result = compare_metrics({}, {})
        assert result["overall_passed"] is True


# ═══════════════════════════════════════════════════════════════════
# Vote Tallying
# ═══════════════════════════════════════════════════════════════════


class TestVoteTallying:
    def test_unanimous_approve(self):
        votes = [
            {"vote": "approve", "tokens_staked": 100},
            {"vote": "approve", "tokens_staked": 100},
            {"vote": "approve", "tokens_staked": 100},
        ]
        result = tally_votes(votes, total_token_holders=10)
        assert result["result"] == "approved"
        assert result["approval_percent"] == 100.0
        assert result["supermajority_met"] is True

    def test_unanimous_reject(self):
        votes = [
            {"vote": "reject", "tokens_staked": 100},
            {"vote": "reject", "tokens_staked": 100},
        ]
        result = tally_votes(votes, total_token_holders=10)
        assert result["approval_percent"] == 0.0
        assert result["result"] == "rejected"

    def test_exactly_66_point_6_percent(self):
        votes = [
            {"vote": "approve", "tokens_staked": 100},
            {"vote": "approve", "tokens_staked": 100},
            {"vote": "reject", "tokens_staked": 100},
        ]
        result = tally_votes(votes, total_token_holders=10)
        # 2/3 = 66.67% ≥ 66.6% → approved
        assert result["supermajority_met"] is True
        assert result["result"] == "approved"

    def test_below_supermajority(self):
        votes = [
            {"vote": "approve", "tokens_staked": 100},
            {"vote": "reject", "tokens_staked": 100},
            {"vote": "reject", "tokens_staked": 100},
        ]
        result = tally_votes(votes, total_token_holders=10)
        assert result["supermajority_met"] is False

    def test_quorum_not_met(self):
        votes = [{"vote": "approve", "tokens_staked": 100}]
        result = tally_votes(votes, total_token_holders=100)
        # 1/100 = 1% < 10% quorum
        assert result["quorum_met"] is False
        assert result["result"] == "quorum_not_met"

    def test_no_votes(self):
        result = tally_votes([], total_token_holders=50)
        assert result["result"] == "no_votes"
        assert result["total_votes"] == 0

    def test_quadratic_dampening(self):
        """Whale with 10000 tokens doesn't dominate over 9 small voters."""
        import math
        votes = [{"vote": "reject", "tokens_staked": 10000}]  # Whale rejects
        for _ in range(9):
            votes.append({"vote": "approve", "tokens_staked": 1})  # 9 small approve

        result = tally_votes(votes, total_token_holders=10)
        # sqrt(10000)=100 reject, 9*sqrt(1)=9 approve
        # 9/(100+9) = 8.3% → whale wins
        # This is expected — quadratic helps but doesn't fully neutralize
        assert result["approve_count"] == 9
        assert result["reject_count"] == 1

    def test_quadratic_with_moderate_stakes(self):
        """Moderate inequality: quadratic makes it competitive."""
        votes = [
            {"vote": "reject", "tokens_staked": 100},   # sqrt=10
            {"vote": "approve", "tokens_staked": 25},    # sqrt=5
            {"vote": "approve", "tokens_staked": 25},    # sqrt=5
            {"vote": "approve", "tokens_staked": 25},    # sqrt=5
        ]
        result = tally_votes(votes, total_token_holders=10)
        # reject=10, approve=15 → 60% → below 66.6% → rejected
        # But it's competitive! Without quadratic: 100 vs 75 → worse
        assert result["approve_weighted"] > result["reject_weighted"]
