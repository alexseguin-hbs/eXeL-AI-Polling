#!/usr/bin/env python3
"""SIM-B revenue journey harness (WIP) — SIMULATED only, NO real Stripe charges.

Owner: SIM-B → paused 2026-11-09; payments worker absorbs journey checks.
Live targets: FE exel-ai-polling.explore-096.workers.dev,
  API exel-ai-polling-api.explore-096.workers.dev, Supabase ppgfjplawtlrfqpnszyb.

Journey (re-run after payments/voting/expert merges):
  1. Moderator creates poll for each pricing_tier: free | moderator_paid | cost_split
  2. Stripe Checkout create (stop at create / expire; never pay)
  3. Participants join (Cost Split: open unpaid → join → cost-split-checkout create+expire;
     join-after-payment uses existing verified synthetic-webhook path only)
  4. Submit Supporting Comments / Risk & Concerns / Neutral Comments inputs
  5. Live theming (session_type=simulation for scale; offline AI)
  6. Top-3 3/2/1 ranking per category + live tally (ranking_method=top3_points)
  7. Moderator decision (+ transparency when #1 not chosen)
  8. Expert opinion (probe; SKIP until expert-paytoview merges)
  9. Paid-view gate: summary_333/details locked before entitlement, unlocked after;
     free users never see paid content (LEAK = critical)
 10. Donation checkout includes poll_id metadata
 11. Concurrent join/submit at N=12, 48, 100

Evidence → /workspace/fleet/sim/JOURNEY.md + journey.json
Status  → /workspace/fleet/status/sim-b-journey.md
Reuse patterns from:
  /workspace/fleet/qa-launch/e2e_launch.py
  /workspace/fleet/qa-launch/e2e_launch_extended.py
  /workspace/w2_costsplit_verify.py
  /workspace/fleet/voting-live/proof/gaps/gaps_proof.py
"""
from __future__ import annotations

import datetime as dt
import json
import os
import sys
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from zoneinfo import ZoneInfo

import httpx

CST = ZoneInfo("America/Chicago")
BASE = "https://exel-ai-polling-api.explore-096.workers.dev/api/v1"
FE = "https://exel-ai-polling.explore-096.workers.dev"
TOK_PATH = Path("/workspace/research-exel/.secrets/proof_token")
OUT = Path("/workspace/fleet/sim")
OUT.mkdir(parents=True, exist_ok=True)
THEME01 = ("Supporting Comments", "Risk & Concerns", "Neutral Comments")
CONCURRENT_NS = (12, 48, 100)
TAG = uuid.uuid4().hex[:8]
ZONE_LABEL = "CST"


def now_cst() -> str:
    return dt.datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S") + f" {ZONE_LABEL}"


def load_token() -> str:
    return TOK_PATH.read_text().strip()


def scrub(s: str, tok: str) -> str:
    return s.replace(tok, "***PROOF_TOKEN***")


# WIP scaffold only — full runner not executed while SIM-B is PAUSED.
# Resume: implement sections below using proven helpers from e2e_launch + gaps_proof + w2_costsplit_verify.


def write_paused_stub(reason: str = "worker paused — 4-worker cap") -> Path:
    ev = {
        "worker": "SIM-B",
        "state": "PAUSED",
        "label": "SIMULATED revenue journey — WIP harness; do not share / do not pay",
        "started_at": now_cst(),
        "finished_at": now_cst(),
        "tag": TAG,
        "base": BASE,
        "fe": FE,
        "no_real_charges": True,
        "participants_label": "SIMULATED",
        "pause_reason": reason,
        "planned_steps": [
            "payment_matrix_3_tiers",
            "cost_split_join_and_share_checkout",
            "submit_theme01_categories",
            "live_theming",
            "top3_ranking_and_tally",
            "moderator_decision_transparency",
            "expert_opinion_probe",
            "paid_view_gate_leak_check",
            "donation_poll_id_metadata",
            "concurrent_12_48_100",
        ],
        "results_so_far": {
            "live_run": False,
            "note": "Harness scaffold committed; no live journey executed under this pause.",
            "inventory": {
                "payments_owner": "payments.md — Cost Split #38 live api-v1t; donate poll_id since #23",
                "voting_owner": "voting-gaps.md — top3 + decision #35 live verified 21/21",
                "expert_owner": "expert-paytoview.md — CRS-36/38/39 not live yet (probe → SKIP)",
                "qa_owner": "qa-launch.md — prior 41/41 E2E; extended in progress",
            },
        },
        "bugs": [],
        "leaks": [],
        "matrix": {},
    }
    raw = scrub(json.dumps(ev, indent=2), load_token() if TOK_PATH.exists() else "")
    (OUT / "journey.json").write_text(raw)
    md = [
        f"# SIM-B revenue journey — {ev['started_at']}",
        "",
        f"**State:** PAUSED ({reason})",
        "",
        "SIMULATED · no real charges · proof instance only",
        "",
        "## Results so far",
        "- Live journey run: **not started** (paused before first API call).",
        "- WIP harness: `scripts/sim/journey_sim_b.py`",
        "- Evidence stub: `/workspace/fleet/sim/journey.json`",
        "",
        "## Planned pass/fail matrix (empty until resume)",
        "| Step | free | moderator_paid | cost_split | Notes |",
        "|------|------|----------------|------------|-------|",
        "| create poll | — | — | — | |",
        "| checkout create (unpaid) | refuse | — | — | |",
        "| join | — | — | after open / after pay | |",
        "| Theme01 inputs | — | — | — | Supporting / Risk & Concerns / Neutral |",
        "| theming | — | — | — | |",
        "| top3 + tally | — | — | — | |",
        "| moderator decision | — | — | — | |",
        "| expert opinion | SKIP until merge | | | expert-paytoview |",
        "| paid-view gate (no leak) | — | — | — | CRITICAL |",
        "| donation poll_id meta | — | — | — | |",
        "| concurrent 12/48/100 | — | — | — | |",
        "",
        "## Exact next step on resume",
        "1. Implement runners reusing e2e_launch / gaps_proof / w2_costsplit_verify helpers.",
        "2. Run payment matrix + paid-view leak check first (revenue critical).",
        "3. Run free simulation lifecycle with top3 + decision.",
        "4. Concurrent joins at 12 → 48 → 100; record latency.",
        "5. Write JOURNEY.md; file bugs under owners' `SIM-B findings`; open PR; merge on green only.",
        "",
    ]
    (OUT / "JOURNEY.md").write_text("\n".join(md))
    print("PAUSED stub written", OUT / "JOURNEY.md")
    return OUT / "JOURNEY.md"


if __name__ == "__main__":
    if "--paused-stub" in sys.argv or True:
        # Default while PAUSED: write stub only, no live calls.
        write_paused_stub()
        sys.exit(0)
