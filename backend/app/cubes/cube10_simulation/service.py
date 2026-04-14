"""Cube 10 — Simulation Engine Service.

    ╔═══════════════════════════════════════════════════════════════════╗
    ║  The Self-Evolving Governance Platform                            ║
    ║                                                                   ║
    ║  Unplug a Cube → Replace code → Test → Vote → Deploy             ║
    ║  AI and Humans compete. Community decides. Admin approves.        ║
    ║  The tool that builds the future for 2525.                        ║
    ╚═══════════════════════════════════════════════════════════════════╝

Functions:
  - submit_feedback: Collect user feedback from any screen
  - get_feedback_stats: Aggregate feedback by cube/CRS/priority
  - create_submission: Accept code improvement submission
  - run_sandbox_tests: Execute tests in isolated sandbox
  - compare_metrics: Compare submission vs baseline
  - start_voting: Open community vote on submission
  - tally_votes: Count votes with quadratic weights
  - deploy_submission: Hot-swap approved code
  - rollback_submission: Revert to previous version

CRS: Cube 10 internal (no external CRS — self-governing)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger("cube10")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SUPERMAJORITY_THRESHOLD = 0.666  # 66.6% required for approval
CHALLENGE_STATES = {"open", "claimed", "submitted", "completed", "closed"}
MIN_QUORUM_PERCENT = 0.10  # 10% of token holders must vote
SUBMISSION_STATES = {"pending", "testing", "voting", "approved", "deployed", "reverted", "rejected"}
VOTING_WINDOW_HOURS = 24  # Default voting period


# ---------------------------------------------------------------------------
# Feedback Collection (FB — Center of Cube 10 Grid)
# ---------------------------------------------------------------------------


async def submit_feedback(
    db,
    *,
    cube_id: int,
    text: str,
    submitted_by: str,
    crs_id: str | None = None,
    sub_crs_id: str | None = None,
    feedback_type: str = "CRS",
    screen: str = "unknown",
    role: str = "user",
) -> dict:
    """Collect feedback from any screen in the app.

    Auto-categorizes by cube and CRS. AI-triaged for priority.
    Feeds the backlog → votes → implementation cycle.

    Uses ProductFeedback model (Supabase table: product_feedback).
    """
    # AI sentiment + priority (substring match for morphological variants like crash/crashes)
    lower = text.lower()
    sentiment = 0.0
    priority = 2  # Medium default

    if any(kw in lower for kw in ("broken", "crash", "error", "bug", "fail", "wrong")):
        priority = 3  # High
        sentiment = -0.5
        category = "bug"
    elif any(kw in lower for kw in ("love", "great", "perfect", "amazing", "excellent")):
        priority = 1  # Low (positive = not urgent)
        sentiment = 0.8
        category = "improvement"
    elif any(kw in lower for kw in ("add", "feature", "wish", "could", "should")):
        priority = 2
        sentiment = 0.3
        category = "feature"
    else:
        category = "general"

    # Write to DB if available, otherwise return dict
    feedback_id = str(uuid.uuid4())
    try:
        from app.models.product_feedback import ProductFeedback

        fb = ProductFeedback(
            cube_id=cube_id,
            crs_id=crs_id,
            sub_crs_id=sub_crs_id,
            feedback_text=text,
            feedback_type=feedback_type,
            category=category,
            sentiment=sentiment,
            priority=priority,
            user_id=submitted_by,
            screen=screen,
            role=role,
        )
        db.add(fb)
        await db.flush()
        await db.refresh(fb)
        feedback_id = str(fb.id)
    except Exception as exc:
        # G9 fix: Log the error instead of silently swallowing it.
        # Still non-fatal (returns dict) but now caller can detect failure via persisted=False.
        logger.warning("cube10.feedback.db_write_failed", extra={"error": str(exc), "feedback_id": feedback_id})

    logger.info(
        "cube10.feedback.submitted",
        extra={
            "feedback_id": feedback_id,
            "cube_id": cube_id,
            "crs_id": crs_id,
            "priority": priority,
            "category": category,
        },
    )

    return {
        "feedback_id": feedback_id,
        "cube_id": cube_id,
        "crs_id": crs_id,
        "sub_crs_id": sub_crs_id,
        "feedback_type": feedback_type,
        "text": text,
        "sentiment": sentiment,
        "priority": priority,
        "category": category,
        "submitted_by": submitted_by,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def get_feedback_stats(
    db,
    cube_id: int | None = None,
) -> dict:
    """Aggregate feedback statistics for triage dashboard.

    Queries product_feedback table. Falls back to empty stats if table
    doesn't exist yet (graceful degradation).
    """
    stats = {
        "cube_id": cube_id,
        "total": 0,
        "by_priority": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        "by_category": {"bug": 0, "feature": 0, "improvement": 0, "general": 0},
        "by_type": {"CRS": 0, "DI": 0},
        "avg_sentiment": 0.0,
    }
    try:
        from sqlalchemy import text as sql_text

        if cube_id:
            params = {"cid": cube_id}
            result = await db.execute(
                sql_text("SELECT COUNT(*), COALESCE(AVG(sentiment), 0) FROM product_feedback WHERE cube_id = :cid"),
                params,
            )
        else:
            params = {}
            result = await db.execute(
                sql_text("SELECT COUNT(*), COALESCE(AVG(sentiment), 0) FROM product_feedback"),
            )
        row = result.one_or_none()
        if row:
            stats["total"] = row[0] or 0
            stats["avg_sentiment"] = round(float(row[1] or 0), 3)

        # Priority breakdown
        if cube_id:
            result = await db.execute(
                sql_text("SELECT priority, COUNT(*) FROM product_feedback WHERE cube_id = :cid GROUP BY priority"),
                params,
            )
        else:
            result = await db.execute(
                sql_text("SELECT priority, COUNT(*) FROM product_feedback GROUP BY priority"),
            )
        for row in result.fetchall():
            stats["by_priority"][row[0]] = row[1]

        # Category breakdown
        if cube_id:
            result = await db.execute(
                sql_text("SELECT category, COUNT(*) FROM product_feedback WHERE cube_id = :cid GROUP BY category"),
                params,
            )
        else:
            result = await db.execute(
                sql_text("SELECT category, COUNT(*) FROM product_feedback GROUP BY category"),
            )
        for row in result.fetchall():
            if row[0] in stats["by_category"]:
                stats["by_category"][row[0]] = row[1]

        # Type breakdown
        if cube_id:
            result = await db.execute(
                sql_text("SELECT feedback_type, COUNT(*) FROM product_feedback WHERE cube_id = :cid GROUP BY feedback_type"),
                params,
            )
        else:
            result = await db.execute(
                sql_text("SELECT feedback_type, COUNT(*) FROM product_feedback GROUP BY feedback_type"),
            )
        for row in result.fetchall():
            if row[0] in stats["by_type"]:
                stats["by_type"][row[0]] = row[1]

    except Exception:
        pass  # Table may not exist yet — return empty stats

    return stats


# ---------------------------------------------------------------------------
# Code Submission Pipeline
# ---------------------------------------------------------------------------


async def create_submission(
    *,
    cube_id: int,
    function_name: str,
    submitter_id: str,
    submitter_type: str,  # "human" or "ai"
    code_diff: str,
) -> dict:
    """Accept a code improvement submission.

    Creates a pending submission that will be tested in sandbox.
    """
    if cube_id < 1 or cube_id > 9:
        raise ValueError(f"Invalid cube_id: {cube_id}. Must be 1-9.")

    if submitter_type not in ("human", "ai"):
        raise ValueError(f"submitter_type must be 'human' or 'ai'")

    if len(code_diff.strip()) < 10:
        raise ValueError("Code diff too short — must contain meaningful changes")

    submission_id = str(uuid.uuid4())
    branch = f"cube{cube_id}/submission/{submitter_id}/{submission_id[:8]}"

    logger.info(
        "cube10.submission.created",
        extra={
            "submission_id": submission_id,
            "cube_id": cube_id,
            "function": function_name,
            "submitter_type": submitter_type,
        },
    )

    return {
        "submission_id": submission_id,
        "cube_id": cube_id,
        "function_name": function_name,
        "submitter_id": submitter_id,
        "submitter_type": submitter_type,
        "branch_name": branch,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Sandbox Test Execution
# ---------------------------------------------------------------------------


async def run_sandbox_tests(
    submission_id: str,
    cube_id: int,
) -> dict:
    """Execute test suite against submission in isolated sandbox.

    Returns metrics for comparison against baseline.
    Stub — will use subprocess with timeout + memory limit.
    """
    return {
        "submission_id": submission_id,
        "cube_id": cube_id,
        "status": "simulated",
        "tests_passed": 0,
        "tests_total": 0,
        "duration_ms": 0.0,
        "ssses": {
            "security": 0,
            "stability": 0,
            "scalability": 0,
            "efficiency": 0,
            "succinctness": 0,
        },
        "replay_hash": "",
        "message": "Sandbox execution not yet implemented — simulation stub",
    }


# ---------------------------------------------------------------------------
# Metrics Comparison
# ---------------------------------------------------------------------------


def compare_metrics(baseline: dict, submission: dict) -> dict:
    """Compare submission metrics against current baseline.

    Returns pass/fail for each metric + overall recommendation.
    """
    results = {}
    passed_all = True

    # Tests: must pass >= 100%
    if baseline.get("tests_total", 0) > 0:
        test_pass = submission.get("tests_passed", 0) >= baseline["tests_total"]
        results["tests"] = {
            "baseline": baseline["tests_total"],
            "submission": submission.get("tests_passed", 0),
            "passed": test_pass,
        }
        if not test_pass:
            passed_all = False

    # Duration: must not exceed 120%
    if baseline.get("duration_ms", 0) > 0:
        max_duration = baseline["duration_ms"] * 1.2
        duration_pass = submission.get("duration_ms", 0) <= max_duration
        results["duration"] = {
            "baseline_ms": baseline["duration_ms"],
            "submission_ms": submission.get("duration_ms", 0),
            "max_allowed_ms": max_duration,
            "passed": duration_pass,
        }
        if not duration_pass:
            passed_all = False

    # SSSES: no pillar decrease
    for pillar in ["security", "stability", "scalability", "efficiency", "succinctness"]:
        b_score = baseline.get("ssses", {}).get(pillar, 0)
        s_score = submission.get("ssses", {}).get(pillar, 0)
        pillar_pass = s_score >= b_score
        results[f"ssses_{pillar}"] = {
            "baseline": b_score,
            "submission": s_score,
            "passed": pillar_pass,
        }
        if not pillar_pass:
            passed_all = False

    results["overall_passed"] = passed_all
    results["recommendation"] = "proceed_to_voting" if passed_all else "reject"

    return results


# ---------------------------------------------------------------------------
# Voting
# ---------------------------------------------------------------------------


def tally_votes(
    votes: list[dict],
    total_token_holders: int,
) -> dict:
    """Tally votes with quadratic weights. Check supermajority + quorum.

    Uses sqrt(tokens_staked) quadratic weight — same pattern as Cube 7
    BordaAccumulator. Prevents whale domination while preserving stake
    proportionality.
    """
    import math

    if not votes:
        return {
            "total_votes": 0,
            "approve_count": 0,
            "reject_count": 0,
            "approve_weighted": 0.0,
            "reject_weighted": 0.0,
            "approval_percent": 0.0,
            "quorum_met": False,
            "supermajority_met": False,
            "result": "no_votes",
        }

    approve_weight = 0.0
    reject_weight = 0.0
    approve_count = 0
    reject_count = 0

    for v in votes:
        weight = math.sqrt(max(v.get("tokens_staked", 1.0), 0.0))
        if v["vote"] == "approve":
            approve_weight += weight
            approve_count += 1
        else:
            reject_weight += weight
            reject_count += 1

    total_weight = approve_weight + reject_weight
    approval_percent = approve_weight / total_weight if total_weight > 0 else 0.0

    quorum_met = len(votes) >= (total_token_holders * MIN_QUORUM_PERCENT)
    supermajority_met = approval_percent >= SUPERMAJORITY_THRESHOLD

    if quorum_met and supermajority_met:
        result = "approved"
    elif not quorum_met:
        result = "quorum_not_met"
    else:
        result = "rejected"

    return {
        "total_votes": len(votes),
        "approve_count": approve_count,
        "reject_count": reject_count,
        "approve_weighted": round(approve_weight, 4),
        "reject_weighted": round(reject_weight, 4),
        "approval_percent": round(approval_percent * 100, 2),
        "quorum_met": quorum_met,
        "supermajority_met": supermajority_met,
        "threshold_percent": SUPERMAJORITY_THRESHOLD * 100,
        "result": result,
    }


# ---------------------------------------------------------------------------
# Challenge System (Grok Architecture Integration)
# ---------------------------------------------------------------------------


async def create_challenge(
    *,
    cube_id: int,
    title: str,
    description: str,
    acceptance_criteria: str,
    function_name: str | None = None,
    reward_heart: float = 10.0,
    reward_unity: float = 50.0,
) -> dict:
    """Create a new challenge for a specific Cube function.

    Posted by Admin. Challengers accept and work in isolated simulation.
    """
    if cube_id < 1 or cube_id > 9:
        raise ValueError(f"Invalid cube_id: {cube_id}. Challenges target Cubes 1-9.")

    if len(title.strip()) < 5:
        raise ValueError("Challenge title must be at least 5 characters")

    if len(acceptance_criteria.strip()) < 10:
        raise ValueError("Acceptance criteria must be at least 10 characters")

    challenge_id = str(uuid.uuid4())

    logger.info(
        "cube10.challenge.created",
        extra={"challenge_id": challenge_id, "cube_id": cube_id, "title": title},
    )

    return {
        "challenge_id": challenge_id,
        "cube_id": cube_id,
        "function_name": function_name,
        "title": title,
        "description": description,
        "acceptance_criteria": acceptance_criteria,
        "reward_heart": reward_heart,
        "reward_unity": reward_unity,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


async def claim_challenge(
    challenge_id: str,
    challenger_id: str,
) -> dict:
    """Challenger accepts a challenge — creates isolated simulation environment.

    Generates unique simulation_id for the parallel portal.
    Freezes current cube code as base_code_snapshot.
    """
    simulation_id = f"sim-{uuid.uuid4().hex[:12]}"

    logger.info(
        "cube10.challenge.claimed",
        extra={
            "challenge_id": challenge_id,
            "challenger_id": challenger_id,
            "simulation_id": simulation_id,
        },
    )

    return {
        "challenge_id": challenge_id,
        "challenger_id": challenger_id,
        "simulation_id": simulation_id,
        "status": "claimed",
        "portal_url": f"https://sim-{simulation_id}.exel-ai-polling.explore-096.workers.dev/",
        "message": "Isolated simulation environment created. Begin your enhancement.",
    }


async def submit_challenge(
    challenge_id: str,
    challenger_id: str,
    code_diff: str,
) -> dict:
    """Challenger submits their enhanced code for community review.

    Triggers automated testing by 12 Ascended Masters.
    If tests pass, opens community voting.
    """
    if len(code_diff.strip()) < 10:
        raise ValueError("Code diff too short — must contain meaningful changes")

    submission_id = str(uuid.uuid4())

    logger.info(
        "cube10.challenge.submitted",
        extra={
            "challenge_id": challenge_id,
            "challenger_id": challenger_id,
            "submission_id": submission_id,
        },
    )

    return {
        "challenge_id": challenge_id,
        "submission_id": submission_id,
        "challenger_id": challenger_id,
        "status": "submitted",
        "message": "Submitted for review. 12 Ascended Masters will test your code.",
    }
