"""Cube 10 — Saved Use Case Manager: Top 3 + DEMO.

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║  The Memory of Governance: We keep the 3 largest live polls       ║
    ║  + the DEMO dataset. When a 4th arrives, the smallest drops.     ║
    ║                                                                   ║
    ║  Example:                                                         ║
    ║    Slot 1: 1,111,111 responses (Poll "Global Climate Action")    ║
    ║    Slot 2:    40,000 responses (Poll "Austin City Planning")     ║
    ║    Slot 3:     1,000 responses (Poll "Team Retrospective")       ║
    ║    DEMO:       5,000 responses (v04.1_5000.csv — permanent)      ║
    ║                                                                   ║
    ║  New poll arrives: 444,444 users, 555,555 responses              ║
    ║    → Drop Slot 3 (1,000 is smallest)                             ║
    ║    → Insert new poll as Slot 3 (or re-sort by size)              ║
    ║                                                                   ║
    ║  These saved datasets power:                                      ║
    ║    - Cube 10 simulation replays (test new code against real data)║
    ║    - SSSES baseline verification at scale                         ║
    ║    - Determinism proofs (replay hash must match)                  ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("cube10.saved_cases")

# Maximum saved live use cases (excluding DEMO which is permanent)
MAX_SAVED_LIVE_CASES = 3

# DEMO dataset is permanent and never dropped
DEMO_DATASET = {
    "id": "demo_v04.1_5000",
    "name": "AI Governance Demo (v04.1)",
    "session_code": "PAST0001",
    "response_count": 5000,
    "file": "Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv",
    "is_demo": True,
    "is_permanent": True,
    "created_at": "2026-03-29T00:00:00Z",
}


@dataclass
class SavedUseCase:
    """A saved polling session dataset for simulation replay."""

    id: str
    session_id: str
    session_code: str
    title: str
    response_count: int
    participant_count: int
    theme_count: int
    theme2_voting_level: str
    ai_provider: str
    replay_hash: str | None = None
    snapshot_path: str | None = None  # Path to exported CSV/JSON
    is_demo: bool = False
    is_permanent: bool = False
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "session_code": self.session_code,
            "title": self.title,
            "response_count": self.response_count,
            "participant_count": self.participant_count,
            "theme_count": self.theme_count,
            "theme2_voting_level": self.theme2_voting_level,
            "ai_provider": self.ai_provider,
            "replay_hash": self.replay_hash,
            "is_demo": self.is_demo,
            "is_permanent": self.is_permanent,
            "created_at": self.created_at,
        }


@dataclass
class SavedUseCaseManager:
    """Manages the top 3 saved use cases + permanent DEMO.

    Rules:
      1. DEMO dataset is ALWAYS preserved (is_permanent=True)
      2. Maximum 3 live saved cases at any time
      3. When a 4th live case arrives, the smallest is dropped
      4. Cases are sorted by response_count DESC (largest first)
    """

    cases: list[SavedUseCase] = field(default_factory=list)

    def __post_init__(self):
        # Ensure DEMO is always present
        if not any(c.is_demo for c in self.cases):
            self.cases.append(SavedUseCase(
                id=DEMO_DATASET["id"],
                session_id="b2c3d4e5-f6a7-8901-bcde-222222222222",
                session_code=DEMO_DATASET["session_code"],
                title=DEMO_DATASET["name"],
                response_count=DEMO_DATASET["response_count"],
                participant_count=5000,
                theme_count=9,
                theme2_voting_level="theme2_9",
                ai_provider="openai",
                is_demo=True,
                is_permanent=True,
                created_at=DEMO_DATASET["created_at"],
            ))

    @property
    def live_cases(self) -> list[SavedUseCase]:
        """Non-demo, non-permanent cases sorted by response_count DESC."""
        return sorted(
            [c for c in self.cases if not c.is_permanent],
            key=lambda c: c.response_count,
            reverse=True,
        )

    @property
    def demo(self) -> SavedUseCase | None:
        """The permanent DEMO dataset."""
        return next((c for c in self.cases if c.is_demo), None)

    @property
    def all_sorted(self) -> list[SavedUseCase]:
        """All cases sorted: DEMO first, then live by response_count DESC."""
        demo = [c for c in self.cases if c.is_demo]
        live = sorted(
            [c for c in self.cases if not c.is_demo],
            key=lambda c: c.response_count,
            reverse=True,
        )
        return demo + live

    def add_live_case(self, case: SavedUseCase) -> SavedUseCase | None:
        """Add a new live use case. Returns the dropped case if limit exceeded.

        If already at MAX_SAVED_LIVE_CASES, drops the smallest live case
        (by response_count) to make room — but ONLY if the new case is
        larger than the smallest. Otherwise rejects the new case.
        """
        if case.is_permanent or case.is_demo:
            self.cases.append(case)
            return None

        live = self.live_cases

        if len(live) < MAX_SAVED_LIVE_CASES:
            # Room available — just add
            self.cases.append(case)
            logger.info(
                "cube10.saved_cases.added",
                extra={
                    "case_id": case.id,
                    "responses": case.response_count,
                    "slot": len(live) + 1,
                },
            )
            return None

        # At capacity — check if new case is bigger than smallest
        smallest = min(live, key=lambda c: c.response_count)

        if case.response_count <= smallest.response_count:
            logger.info(
                "cube10.saved_cases.rejected",
                extra={
                    "case_id": case.id,
                    "responses": case.response_count,
                    "smallest_existing": smallest.response_count,
                },
            )
            return case  # Rejected — return the rejected case

        # Drop smallest, add new
        self.cases.remove(smallest)
        self.cases.append(case)

        logger.info(
            "cube10.saved_cases.replaced",
            extra={
                "dropped_id": smallest.id,
                "dropped_responses": smallest.response_count,
                "new_id": case.id,
                "new_responses": case.response_count,
            },
        )
        return smallest  # Return the dropped case

    def get_case(self, case_id: str) -> SavedUseCase | None:
        """Retrieve a specific saved case by ID."""
        return next((c for c in self.cases if c.id == case_id), None)

    def get_by_session_code(self, code: str) -> SavedUseCase | None:
        """Retrieve by session short code."""
        return next((c for c in self.cases if c.session_code == code), None)

    @property
    def total_responses(self) -> int:
        """Total responses across all saved cases."""
        return sum(c.response_count for c in self.cases)

    def to_dict(self) -> dict:
        return {
            "total_cases": len(self.cases),
            "total_responses": self.total_responses,
            "max_live_cases": MAX_SAVED_LIVE_CASES,
            "demo": self.demo.to_dict() if self.demo else None,
            "live_cases": [c.to_dict() for c in self.live_cases],
        }


# ---------------------------------------------------------------------------
# Simulation Replay
# ---------------------------------------------------------------------------


async def replay_against_dataset(
    case: SavedUseCase,
    cube_id: int,
    function_name: str,
) -> dict:
    """Run simulation replay of a specific function against a saved dataset.

    This is the core of Cube 10: test new code against real production data.
    Returns metrics for comparison against baseline.
    """
    import time

    start = time.monotonic()

    # Stub — will load saved dataset and run through pipeline
    result = {
        "case_id": case.id,
        "response_count": case.response_count,
        "cube_id": cube_id,
        "function_name": function_name,
        "status": "simulated",
        "duration_ms": round((time.monotonic() - start) * 1000, 2),
        "replay_hash_match": True,  # Will verify against stored hash
    }

    logger.info(
        "cube10.replay.completed",
        extra=result,
    )

    return result
