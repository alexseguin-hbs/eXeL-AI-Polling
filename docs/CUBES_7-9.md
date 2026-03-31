# Cubes 7-9: Ranking, Tokens, Reports — Implementation Details

> **Parent doc:** See `CLAUDE.md` for system architecture, inter-cube dependencies, and infrastructure.

---

## Cube 7: SCAFFOLDED (stubs only)
- Models, schemas, and route stubs exist
- Service implementation pending

## Cube 9: PARTIALLY IMPLEMENTED
- CSV export service implemented (135 lines in service.py)
- 2 API endpoints (CSV export functional, analytics stub)
- Exporters package scaffolded (ready for CSV/PDF exporters)

---

## Cube 8 — Token Ledger: IMPLEMENTED
- `TokenService` (98 lines): session tokens query, user balance, disputes
- Router (72 lines): 4 API endpoints — total backend: 170 lines
- 웃 rate table: `core/hi_rates.py` (135 lines) — 59 jurisdictions (9 international + 50 US states)
- Rate lookup API: `GET /tokens/rates`, `GET /tokens/rates/lookup`
- Tests: `test_token_service.py` (241 lines, 19 tests)
- Files: `cubes/cube8_tokens/service.py`, `cubes/cube8_tokens/router.py`, `core/hi_rates.py`, `schemas/token.py`, `models/token_ledger.py`

---

## Cube 7 — Prioritization & Voting: SCAFFOLDED (Position 1,1,1 / MVP1-MVP3)

> **Grid position:** (1,1,1) — bottom-left of Level 1 grid
> **Spiral order:** 7th cube (bottom-left, after Cube 6 AI at bottom-center)
> **MVP scope:** MVP1 (basic ranking + aggregation), MVP2 (live WebSocket), MVP3 (governance overrides)

### Cube 7 — Overview

Cube 7 provides the ranking UI and backend aggregation engine. After Cube 6 generates AI themes, participants rank those themes by importance. The system deterministically aggregates all rankings into a final prioritized list. The #1 most-voted Theme2 cluster ID feeds into the CQS reward pipeline (Cube 5 -> Cube 6 -> Cube 8).

Key behaviors:
- **Theme2 voting level:** Users vote on themes at the granularity level the **Moderator selected** (`theme2_9`, `theme2_6`, or `theme2_3`). The ranking UI only shows the chosen level's themes.
- **Progressive theme reveal (paid tiers):** For paid sessions, themes appear one-by-one on the hosting PC screen as they are generated, creating engagement. Once all themes at the selected level are ready, voting opens.
- **CQS winner input:** After ranking completes, Cube 7 provides the #1 most-voted Theme2 cluster ID to Cube 5/6 for CQS reward selection -- the winner is the highest-CQS response within that cluster.

### Cube 7 — Current Implementation Status

**Backend stub:** `backend/app/cubes/cube7_ranking/router.py`
- 3 endpoints defined with `NotImplementedError`:
  - `POST /sessions/{session_id}/rankings` (CRS-11: submit ranking)
  - `GET /sessions/{session_id}/rankings/aggregate` (CRS-12: get aggregated rankings)
  - `POST /sessions/{session_id}/override` (CRS-22: governance override, MVP3)

**Schemas:** `backend/app/schemas/ranking.py`
- `RankingSubmit`: `ranked_theme_ids: list[uuid.UUID]`
- `RankingRead`: id, session_id, cycle_id, participant_id, ranked_theme_ids, submitted_at
- `AggregatedRankingRead`: id, session_id, cycle_id, theme_id, rank_position, score, vote_count, is_top_theme2, participant_count, algorithm, is_final, aggregated_at

**Frontend SIM stub:** Cube 7 ranking is simulated in the Easter Egg SIM (click-to-rank UI with #1/#2/#3 badges in `session-view.tsx`).

### Cube 7 — Requirements.txt Specification

#### Data Tables

**Table: `user_rankings`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Ranking record ID |
| session_id | UUID (FK->sessions) | Session reference |
| cycle_id | INTEGER | Deep dive round (1 = initial, 2-3 = follow-up). ORM: `cycle_id` |
| participant_id | UUID (FK->participants) | Who submitted ranking |
| ranked_theme_ids | JSON | Ordered array of theme_ids (1st = most important) |
| submitted_at | TIMESTAMP | When ranking was submitted |

**ORM implementation note:** The `Ranking` model (`models/ranking.py`) uses `__tablename__ = "user_rankings"` and `cycle_id` (not `cycle_number`). Unique constraint: `(session_id, cycle_id, participant_id)`.

**Table: `aggregated_rankings`** (one row per theme per cycle — enables indexed `is_top_theme2` queries)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Aggregation record ID |
| session_id | UUID (FK->sessions) | Session reference |
| cycle_id | INTEGER | Deep dive round (ORM: `cycle_id`, aligned with `user_rankings`) |
| theme_id | UUID (FK->themes) | Theme being ranked |
| rank_position | INTEGER | Final aggregated rank (1 = top) |
| score | FLOAT | Aggregated score (deterministic algorithm) |
| vote_count | INTEGER | How many participants ranked this theme |
| is_top_theme2 | BOOLEAN | Whether this is the #1 most-voted Theme2 |
| participant_count | INTEGER | How many participants submitted rankings |
| algorithm | VARCHAR(50) | Aggregation algorithm used (default: `borda_count`) |
| is_final | BOOLEAN | Whether aggregation is finalized |
| aggregated_at | TIMESTAMP | When aggregation ran |

**ORM implementation note:** The `AggregatedRanking` model (`models/ranking.py`) now stores per-theme rows matching this spec. Previous JSON-blob schema replaced 2026-03-30. Indexes: `(session_id, cycle_id)`, `(session_id, is_top_theme2)`. Unique constraint: `(session_id, cycle_id, theme_id)`.

**Table: `governance_overrides`** (MVP3)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Override record ID |
| session_id | UUID (FK->sessions) | Session reference |
| theme_id | UUID (FK->themes) | Theme being overridden |
| original_rank | INTEGER | Rank before override |
| new_rank | INTEGER | Rank after override |
| overridden_by | UUID (FK->users) | Lead/Developer who applied override |
| justification | TEXT | Required justification text |
| created_at | TIMESTAMP | When override was applied |

#### Inputs
| Input | Source | Description |
|-------|--------|-------------|
| Theme list | Cube 6 | Themes with labels, confidence, counts for ranking UI |
| User rankings | User UI | Each participant's ordered ranking of themes |
| Ranking trigger | Cube 5 | Signal to start aggregation after ranking window closes |
| Governance override | Lead/Developer UI (MVP3) | Override with justification |
| Theme2 voting level | Cube 1 (session config) | Moderator-selected granularity: `theme2_9`, `theme2_6`, or `theme2_3` |
| Session ranking mode | Cube 1 (session config) | `auto` / `manual` / `live` -- determines aggregation behavior |

#### Outputs
| Output | Destination | Description |
|--------|-------------|-------------|
| Aggregated rankings | Frontend, Cube 9 | Final ranked theme list with scores |
| #1 Theme2 cluster ID | Cube 5 -> Cube 6 | Top-voted Theme2 for CQS eligibility |
| Ranking complete event | Cube 5 | Signal that ranking is finalized |
| Override audit entry | Cube 8 (audit), Cube 9 | Override record for audit trail |
| Live ranking updates | Frontend (MVP2 WebSocket) | Real-time ranking state changes pushed to all participants |

#### Functions (8 total)
| Function | Description | MVP | Status |
|----------|-------------|-----|--------|
| `submit_user_ranking()` | Records a participant's theme ranking order. Validates theme IDs exist and belong to the session's selected Theme2 level. | 1 | Stub |
| `aggregate_rankings()` | Deterministic aggregation algorithm (median-based stable scoring). Must produce identical results for identical inputs. Uses Borda count with tie-breaking by submission order. | 1 | Stub |
| `identify_top_theme2()` | Finds the #1 most-voted Theme2 cluster from aggregated results. Sets `is_top_theme2=True` on the winning theme's aggregated_ranking record. | 1 | Stub |
| `apply_governance_override()` | Lead/Developer overrides a theme's rank with mandatory justification. Creates governance_overrides record and updates aggregated_rankings. Triggers audit log entry in Cube 8. | 3 | Not implemented |
| `validate_override_permission()` | Checks RBAC -- only Lead/Developer role can override. Returns 403 Forbidden for other roles. | 3 | Not implemented |
| `emit_ranking_complete()` | Notifies Cube 5 that rankings are finalized. Fires `ranking_aggregation` pipeline trigger completion. Sends #1 Theme2 ID for CQS scoring. | 1 | Not implemented |
| `get_live_rankings()` | Returns current ranking state for real-time display. MVP1: HTTP polling. MVP2: WebSocket push with <500ms latency. | 1/2 | Not implemented |
| `detect_voting_anomalies()` | Anti-sybil detection: flags suspicious voting patterns (e.g., identical rankings from multiple participants, rapid-fire submissions, coordinated block voting). Anomalies logged to audit trail. | 2 | Not implemented |

#### UI/UX Translation Strings (17 keys)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube7.ranking.title` | "Rank the Themes" | Ranking page header |
| `cube7.ranking.instructions` | "Drag themes to rank them by importance (most important first)" | Instructions for desktop/laptop |
| `cube7.ranking.tap_instructions` | "Tap to select your ranking order" | Mobile touch instructions |
| `cube7.ranking.submit` | "Submit Ranking" | Submit button |
| `cube7.ranking.submitted` | "Ranking submitted!" | Success confirmation |
| `cube7.ranking.waiting` | "Waiting for others to rank..." | Waiting state while other participants complete |
| `cube7.ranking.results_title` | "Ranked Priorities" | Results header after aggregation |
| `cube7.ranking.rank_label` | "#{rank}" | Rank position display (e.g., "#1", "#2") |
| `cube7.ranking.votes` | "{count} votes" | Vote count per theme |
| `cube7.ranking.score` | "Score: {score}" | Aggregated score display |
| `cube7.ranking.top_theme` | "Top Priority" | Badge for #1 theme |
| `cube7.ranking.override_applied` | "Ranking adjusted by Lead" | Override notice (MVP3) |
| `cube7.ranking.override_justification` | "Reason: {text}" | Override justification display (MVP3) |
| `cube7.ranking.no_rankings_yet` | "No rankings submitted yet" | Empty state |
| `cube7.ranking.themes_generating` | "Generating themes..." | Progressive theme reveal loading |
| `cube7.ranking.theme_revealed` | "New theme discovered!" | Progressive reveal notification (paid tiers) |
| `cube7.ranking.voting_opens_soon` | "Voting opens when all themes are ready" | Pre-voting state |

### Cube 7 — CRS Traceability

> **CRS Alignment Note:** Cube 7 owns CRS-11 (ranking), CRS-12 (deterministic aggregation), CRS-13 (Lead review), CRS-16/17 (live ranking — MVP2), and CRS-22 (governance override — MVP3). Requirements.txt is canonical. See SSSES Plan at end of this doc.

| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|
| CRS-11 | CRS-11.IN.SRS.011 | CRS-11.OUT.SRS.011 | **Stub** | 1 | User ranks themes after poll closes | Ranking interface responds within 200ms; deterministic ordering of themes presented to user | Weighted and multi-criteria ranking with drag-drop reorder |
| CRS-11.01 | — | — | **Stub** | 1 | Ranking UI displays Theme2 hierarchy (9/6/3) for participant voting after `themes_ready` event | Theme cards rendered with label + response count + confidence | Drag-drop reorder on desktop; tap-to-reorder on mobile (44px touch targets) |
| CRS-11.02 | — | — | **Stub** | 1 | Vote submission validated against session `theme2_voting_level` (9/6/3) | `submit_user_ranking()` validates theme IDs exist and belong to session | Multi-criteria weighted ranking with slider inputs |
| CRS-11.03 | — | — | **Not implemented** | 1 | `identify_top_theme2()` finds #1 most-voted cluster; sets `is_top_theme2=True` → triggers CQS scoring via Cube 5 | Top theme identified within 1s of final vote | Automatic tie-detection with visual consensus indicator |
| CRS-11.04 | — | — | **Not implemented** | 1 | `emit_ranking_complete()` notifies Cube 5 with finalized rankings + #1 Theme2 ID for CQS pipeline | Event fires within 500ms of aggregation complete | Ranking summary broadcast to all participants via Supabase |
| CRS-12 | CRS-12.IN.WRS.012 | CRS-12.OUT.WRS.012 | **Stub** | 1 | System aggregates rankings deterministically | Compute final rankings within 3 seconds for up to 100,000 participants; identical inputs yield identical outputs | AI-assisted consensus scoring with confidence intervals |
| CRS-12.01 | — | — | **Stub** | 1 | Borda count aggregation with seeded tie-breaking; `random_state` pinned per session | Identical inputs + same seed = identical rankings (verified via replay hash) | Condorcet method comparison report alongside Borda results |
| CRS-12.02 | — | — | **Not implemented** | 1 | Quadratic vote normalization: `weight = sqrt(tokens_staked)` — prevents high-token manipulation | Weight damping applied before aggregation; audit log records raw vs damped weights | Configurable damping function per session |
| CRS-12.03 | — | — | **Not implemented** | 2 | Live ranking updates pushed via Supabase Broadcast as votes arrive | <500ms latency from vote to all connected dashboards | Animated rank transitions with convergence indicator |
| CRS-12.04 | — | — | **Not implemented** | 2 | Anti-sybil detection: `detect_voting_anomalies()` flags identical rankings from multiple participants, rapid-fire submissions, coordinated block voting | Anomalies logged to audit trail; flagged votes excluded from aggregation | ML-based anomaly scoring with configurable sensitivity |
| CRS-13 | CRS-13.IN.SRS.013 | CRS-13.OUT.SRS.013 | **Stub** | 1 | Lead reviews ranked priorities with metadata | Display vote counts, submission timestamps, and confidence scores for each theme | Historical trend comparisons across sessions within same scoping context |
| CRS-13.01 | — | — | **Stub** | 1 | Results view shows ranked themes with response counts, confidence averages, supporting response samples | Vote counts + confidence per theme displayed in descending rank order | Historical trend overlay from prior sessions in same scoping context |
| CRS-13.02 | — | — | **Not implemented** | 1 | CQS winner highlighted for Moderator (hidden from participants); composite score breakdown shown | CQS visible to Moderator + Lead only; 6-metric breakdown in detail view | CQS leaderboard for top N contributors (opt-in visibility) |
| CRS-13.03 | — | — | **Not implemented** | 1 | Replay hash (SHA-256 of inputs + parameters) displayed for governance audit; verifiable determinism | Hash matches expected value for identical input set | One-click replay verification that re-runs aggregation and compares |
| CRS-16 | CRS-16.IN.SRS.016 | CRS-16.OUT.SRS.016 | **Not implemented** | 2 | Moderator enables live prioritization during active session | Live ranking sync latency under 500ms via WebSocket; participants see updates without page refresh | Visual consensus alerts, animated transitions, and convergence indicators |
| CRS-16.01 | — | — | **Not implemented** | 2 | Live ranking widget visible to Moderator during active polling; updates as responses arrive | Emerging theme patterns shown before polling closes | Real-time confidence indicator per emerging theme |
| CRS-17 | CRS-17.IN.WRS.017 | CRS-17.OUT.WRS.017 | **Not implemented** | 2 | User sees real-time ranking updates as others vote | End-to-end update latency under 1 second from submission to all connected clients | Collaborative ranking tools with participant grouping and delegation |
| CRS-17.01 | — | — | **Not implemented** | 2 | Live ranking leaderboard pushed via Supabase Broadcast as votes are tallied | Participant sees personal rank vs group rank (if enabled by Moderator) | Animated rank change transitions |
| CRS-22 | CRS-22.IN.SRS.022 | CRS-22.OUT.SRS.022 | **Not implemented** | 3 | Lead overrides rankings with documented justification | Justification required and logged for every override; full audit trail with original vs. new rank | Bias detection on overrides, peer review workflow, override impact analysis |
| CRS-22.01 | — | — | **Not implemented** | 3 | Override UI requires mandatory justification text; logged to immutable audit trail | Original ranking preserved; override shown as delta with actor + timestamp | Peer review workflow: override requires second Lead approval |
| CRS-22.02 | — | — | **Not implemented** | 3 | `validate_override_permission()` checks RBAC — only Lead/Developer can override; returns 403 for other roles | 100% RBAC enforcement on override endpoint | Role escalation request workflow for edge cases |

### Cube 7 — DesignMatrix VOC (Voice of Customer)

| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-11 | Ability to influence outcomes, not just comment | "Ranking feels more meaningful than voting yes/no -- I can actually express priorities." |
| CRS-12 | Confidence that results are objective and consistent | "We need the same inputs to produce the same outputs every time. No randomness in results." |
| CRS-13 | Context behind decisions, not just final numbers | "Leaders need defensible rationale for choices -- metadata and audit trails are essential." |
| CRS-16 | Faster decision-making during live meetings | "We want decisions before the meeting ends. Live updates keep momentum going." |
| CRS-17 | Immediate feedback that my input matters | "Live updates increase engagement and trust -- people stay invested when they see impact." |
| CRS-22 | Balance between group input and leadership responsibility | "Leaders must own final decisions but group input provides legitimacy and buy-in." |

### Cube 7 — Architectural Constraints

- **Determinism:** Aggregation algorithm must be fully reproducible. Same set of rankings -> same aggregated result. Seeded tie-breaking for identical scores.
- **Anti-sybil:** Voting anomaly detection must flag coordinated voting patterns without blocking legitimate rapid submissions.
- **Governance damping:** Quadratic vote normalization applies -- `weight = sqrt(tokens_staked)` -- to prevent manipulation by high-token holders.
- **Progressive reveal:** Theme2 themes appear one-by-one on the hosting PC (paid tiers only) via WebSocket push from Cube 6. Voting only opens after all themes at the selected level are ready.
- **Responsive ranking UI:** Must support drag-drop on desktop/laptop AND tap-to-reorder on phone/tablet. Touch targets >= 44px for accessibility.

### Cube 7 — Simulation Requirements (Cube 10 Isolation)

> In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs and compares output metrics against the existing implementation baseline.

#### Input/Output Simulation Modes

| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| Theme list (labels, confidence, counts) | Input | Cube 6 (AI) | **SIMULATED** | 3 fixture themes per poll from SIM data (Opportunity & Innovation 92%, Risk & Concerns 88%, Balanced/Hybrid 85%) |
| User rankings (ordered theme IDs) | Input | User UI | **SIMULATED** | 7 AI user rankings + 1 HI user ranking from canned SIM data; deterministic ordering per AI persona |
| Ranking trigger signal | Input | Cube 5 (Gateway) | **SIMULATED** | Mock pipeline trigger fires immediately (no async wait) |
| Governance override (justification + new rank) | Input | Lead/Developer UI (MVP3) | **SIMULATED** | Fixture override: Lead moves theme #3 to #1 with canned justification text |
| Theme2 voting level | Input | Cube 1 (session config) | **SIMULATED** | Mock session config with `theme2_voting_level` set to `theme2_3` (default), `theme2_6`, or `theme2_9` |
| Session ranking mode | Input | Cube 1 (session config) | **SIMULATED** | Mock session config with `ranking_mode` = `auto` (default) |
| Aggregated rankings | Output | Frontend, Cube 9 | **SIMULATED** | Written to mock store; verified against expected deterministic output |
| #1 Theme2 cluster ID | Output | Cube 5 -> Cube 6 | **SIMULATED** | Mock event emitted; verified that correct theme ID is selected |
| Ranking complete event | Output | Cube 5 | **SIMULATED** | Mock pipeline trigger completion; verified event fires |
| Override audit entry | Output | Cube 8, Cube 9 | **SIMULATED** | Written to mock audit log; verified fields present |
| Live ranking updates | Output | Frontend (WebSocket) | **SIMULATED** | Mock WebSocket messages; verified payload shape and latency |

#### Function Simulation Modes

| Function | Sim Mode | Simulation Behavior |
|----------|----------|---------------------|
| `submit_user_ranking()` | **SIMULATED** | Stores ranking in mock data store; validates theme IDs against fixture theme list; rejects invalid/duplicate submissions |
| `aggregate_rankings()` | **BOTH** | Math is identical in sim and production -- Borda count with seeded tie-breaking. Sim uses 8 canned rankings (7 AI + 1 HI); production uses live DB query |
| `identify_top_theme2()` | **BOTH** | Deterministic selection from aggregated results. Sim verifies correct theme wins given canned ranking distribution |
| `apply_governance_override()` | **SIMULATED** | Stores override in mock governance_overrides table; validates RBAC from mock user role; creates mock audit entry |
| `validate_override_permission()` | **SIMULATED** | Checks mock user role (Lead/Developer = allowed, Moderator/User = 403). No real Auth0 call |
| `emit_ranking_complete()` | **SIMULATED** | Fires mock event to Cube 5; verifies #1 Theme2 ID is included in payload |
| `get_live_rankings()` | **SIMULATED** | Returns current mock ranking state; simulates WebSocket push with <500ms latency check |
| `detect_voting_anomalies()` | **SIMULATED** | Runs anomaly detection on canned rankings; fixture includes 1 coordinated-voting pattern for validation |

#### Canned Test Data

- **3 themes per poll:** From SIM data files (`frontend/lib/sim-data/poll-{1-4}-*.ts`):
  - Poll 1: Feature Requests / Performance & Security / Integration Needs
  - Poll 2: Growth Initiatives / Customer Retention / Team Culture
  - Poll 3: Opportunity & Innovation / Risk & Concerns / Balanced Approach
  - Poll 4: Collaboration Tools / Process Innovation / Culture & Mindset
- **8 user rankings per poll:** 7 AI users (deterministic preferences per persona) + 1 HI user (manual input or fixture default)
  - AI User 1 (Opportunity-leaning): ranks Opportunity > Balanced > Risk
  - AI User 2 (Risk-focused): ranks Risk > Balanced > Opportunity
  - AI User 3 (Balanced): ranks Balanced > Opportunity > Risk
  - AI User 4 (Opportunity-leaning): ranks Opportunity > Risk > Balanced
  - AI User 5 (Risk-focused): ranks Risk > Opportunity > Balanced
  - AI User 6 (Opportunity-leaning): ranks Opportunity > Balanced > Risk
  - AI User 7 (Balanced): ranks Balanced > Risk > Opportunity
  - HI User (fixture default): ranks Opportunity > Risk > Balanced
- **Governance override fixtures:** 1 override scenario (Lead moves #3 theme to #1 with justification "Strategic priority alignment")
- **Quadratic vote normalization test cases:** 5 fixtures with varying token stakes (1, 4, 9, 16, 25 tokens) producing weights (1.0, 2.0, 3.0, 4.0, 5.0)
- **Anomaly detection fixtures:** 1 coordinated voting pattern (3 users submit identical rankings within 2 seconds)

#### Simulation Pass Criteria

- **100% test pass rate:** All existing unit + E2E tests must pass
- **No spiral metric regressions:** Backend duration, TypeScript errors, bundle sizes must not increase
- **Ranking determinism:** Identical canned inputs must produce identical aggregated rankings across N=5 runs (std dev = 0)
- **Governance weight fairness:** Quadratic normalization must produce `weight = sqrt(tokens_staked)` for all test cases
- **Anti-sybil detection:** Coordinated voting fixture must be flagged; legitimate rapid submissions must NOT be flagged
- **User code challenge:** Submitted replacement code must EXCEED existing metrics (faster aggregation, better anomaly detection rate, or lower false-positive rate)

#### Spiral Test Reference

No spiral metrics recorded yet -- **PENDING implementation**. Baseline (N=5+) required before Cube 10 isolation testing is enabled. Current status: 3 API endpoint stubs defined, 0 tests. Spiral baseline will be established during Cube 7 full implementation.

### Cube 7 — Traceability

- Scoping: via `session_id` (see Shared Core -- Cross-Cutting Scoping Inheritance)
- `governance_overrides` creates audit trail linking override to actor, justification, and original/new rank
- `is_top_theme2` flag on aggregated rankings directly feeds CQS reward pipeline (Cube 5 -> Cube 6 -> Cube 8)
- All ranking data exportable via Cube 9 with full session scoping
- Override events logged in Cube 8 token ledger for governance accountability

### Cube 7 — Files

| File | Lines | Purpose |
|------|-------|---------|
| `backend/app/cubes/cube7_ranking/router.py` | 25 | 3 API endpoint stubs (submit, aggregate, override) |
| `backend/app/cubes/cube7_ranking/__init__.py` | - | Package init |
| `backend/app/schemas/ranking.py` | 35 | Pydantic schemas (RankingSubmit, RankingRead, AggregatedRankingRead) |

### Cube 7 — Downstream/Upstream Dependencies

| Direction | Cube | Dependency |
|-----------|------|------------|
| **Upstream (receives from)** | Cube 6 (AI) | Theme list with labels, confidence, counts, exemplars |
| **Upstream (receives from)** | Cube 5 (Gateway) | Ranking pipeline trigger signal |
| **Upstream (receives from)** | Cube 1 (Session) | Session config: ranking_mode, theme2_voting_level |
| **Downstream (sends to)** | Cube 5 (Gateway) | Ranking complete event + #1 Theme2 cluster ID |
| **Downstream (sends to)** | Cube 8 (Tokens) | Override audit entries for governance trail |
| **Downstream (sends to)** | Cube 9 (Reports) | Aggregated rankings for export/analytics |
| **Downstream (sends to)** | Frontend | Live ranking state for display |

---

## Cube 8 — Token Reward Calculator & Governance/Audit: PARTIALLY IMPLEMENTED (Position 1,1,2 / MVP1-MVP3)

> **Grid position:** (1,1,2) -- left of Level 1 grid
> **Spiral order:** 8th cube (left, after Cube 7 Ranking at bottom-left)
> **MVP scope:** MVP1 (basic token calc), MVP3 (full governance, payments, talent, execution separation)

### Cube 8 — Overview

Cube 8 manages the complete SoI Trinity Token lifecycle: the append-only ledger, payment processing, gamified rewards, talent profiles, and ideation/execution separation enforcement. It is the financial and governance backbone of the platform.

Key responsibilities:
- **SoI Trinity Tokens:** ♡ (Shared Intent -- time-based), 웃 (Human Intelligence -- jurisdiction min-wage), ◬ (Artificial Intelligence -- 5x multiplier)
- **Method-aware calculation:** Ledger entries tagged with `distribution_method` (polling / peer_volunteer / team_collaboration) and `desired_outcome_id`
- **Outcome tracking:** Each ledger entry records outcome status (achieved / partial / not achieved)
- **Gamified reward payout:** Receives CQS winner from Cube 5 -> disburses Moderator-funded bonus via Stripe/GPay/ApplePay
- **Payment processing:** Moderator session fees, participant cost-split payments, reward payouts
- **Talent profiles:** Built from CQS scores + participation history for project-level talent recommendations
- **Execution separation:** Enforces ideation/execution firewall per scoping context

### Cube 8 — Current Implementation Status

**Backend service:** `backend/app/cubes/cube8_tokens/service.py` (98 lines)
- `get_session_tokens()` -- query all ledger entries for a session
- `get_user_token_balance()` -- aggregated ♡/웃/◬ balance for user in session
- `create_dispute()` -- file a dispute against a ledger entry

**Backend router:** `backend/app/cubes/cube8_tokens/router.py` (72 lines)
- `GET /sessions/{session_id}/tokens` -- session token ledger (CRS-25)
- `POST /tokens/dispute` -- file dispute (CRS-33)
- `GET /tokens/rates` -- full 웃 rate table (59 jurisdictions)
- `GET /tokens/rates/lookup` -- lookup rate by country/state

**Total backend:** 170 lines (service 98 + router 72)

**Tests:** `backend/tests/cube8/test_token_service.py` (241 lines, 19 tests)

**Models:** `backend/app/models/token_ledger.py` (53 lines)
- `TokenLedger` ORM: session_id, user_id, anon_hash, cube_id, action_type, delta_heart, delta_human, delta_unity, lifecycle_state, reason, reference_id, version_id
- `TokenDispute` ORM: ledger_entry_id, flagged_by, reason, evidence, status, resolution_notes, resolved_by, resolved_at

**Schemas:** `backend/app/schemas/token.py` (38 lines)
- `TokenLedgerRead`: serializes with `♡`, `웃`, `◬` field aliases
- `TokenDisputeCreate`, `TokenDisputeRead`

**Core rates:** `backend/app/core/hi_rates.py`
- 59 jurisdictions: 9 international ($0.34-$3.02/hr) + 50 US states ($7.25-$16.28/hr)
- `resolve_human_rate(country, state)` and `get_all_rates()`

### Cube 8 — Requirements.txt Specification

#### Data Tables (6 total)

**Table: `token_ledger`** (Append-Only -- no mutations, only new entries)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Ledger entry ID (auto-generated) |
| session_id | UUID (FK->sessions) | Session reference |
| participant_id | UUID (FK->participants) | Token recipient |
| cube_id | INTEGER | Which cube generated this entry (1-10) |
| action_type | ENUM | `login` / `responding` / `ranking` / `reviewing` / `peer_volunteer` / `team_collaboration` / `reward_payout` |
| distribution_method | ENUM | `polling` / `peer_volunteer` / `team_collaboration` |
| delta_si | INTEGER | ♡ tokens awarded (ceil of active minutes) |
| delta_hi | FLOAT | 웃 tokens awarded (jurisdiction rate * minutes / 60) |
| delta_ai | INTEGER | ◬ tokens awarded (5x ♡ default multiplier) |
| desired_outcome_id | UUID (FK->desired_outcomes, nullable) | Linked outcome record (Methods 2 & 3) |
| outcome_status | ENUM | `achieved` / `partially_achieved` / `not_achieved` / `n_a` |
| lifecycle_state | ENUM | `simulated` / `pending` / `approved` / `finalized` / `reversed` |
| reason | TEXT | Rationale for this entry (human-readable) |
| version_id | VARCHAR(50) | Cube version + dependency graph hash for audit lineage |
| created_at | TIMESTAMP | Entry creation timestamp (append-only, immutable) |

**Current ORM implementation note:** The existing `TokenLedger` model uses `delta_heart`, `delta_human`, `delta_unity` column names (mapped to ♡, 웃, ◬ via Pydantic serialization aliases). The spec uses `delta_si`, `delta_hi`, `delta_ai`. Both refer to the same tokens. The `user_id`/`anon_hash` fields in the current model correspond to the spec's `participant_id`.

**Table: `payment_transactions`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Transaction ID |
| session_id | UUID (FK->sessions) | Session reference |
| participant_id | UUID (FK->participants, nullable) | Participant (null for Moderator fee) |
| transaction_type | ENUM | `moderator_fee` / `cost_split` / `reward_payout` |
| provider | ENUM | `stripe` / `google_pay` / `apple_pay` |
| amount_cents | INTEGER | Amount in cents (USD) |
| currency | VARCHAR(3) | Currency code (e.g., `USD`) |
| provider_transaction_id | VARCHAR(255) | Stripe/GPay/ApplePay external reference ID |
| status | ENUM | `pending` / `completed` / `failed` / `refunded` |
| created_at | TIMESTAMP | Transaction timestamp |

**Table: `reward_payouts`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Payout record ID |
| session_id | UUID (FK->sessions) | Session reference |
| winner_participant_id | UUID (FK->participants) | CQS winner |
| cqs_score_id | UUID (FK->cqs_scores) | Winning CQS record from Cube 6 |
| reward_amount_cents | INTEGER | Payout amount in cents |
| payment_transaction_id | UUID (FK->payment_transactions) | Payment reference for the disbursement |
| status | ENUM | `pending` / `disbursed` / `failed` |
| created_at | TIMESTAMP | When payout was initiated |

**Table: `token_disputes`** (Implemented)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Dispute ID |
| ledger_entry_id | UUID (FK->token_ledger) | Disputed ledger entry |
| flagged_by | UUID (FK->users) | Who raised dispute |
| reason | TEXT | Dispute reason (required) |
| evidence | TEXT (nullable) | Supporting evidence |
| status | ENUM | `open` / `under_review` / `resolved` / `rejected` |
| resolution_notes | TEXT (nullable) | Resolution details |
| resolved_by | UUID (FK->users, nullable) | Who resolved |
| created_at | TIMESTAMP | When filed |
| resolved_at | TIMESTAMP (nullable) | When resolved |

**Table: `talent_profiles`** (Project Mode -- Talent Recommendation)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Talent profile ID |
| user_id | UUID (FK->users) | User reference |
| skills | JSONB | Array of skill tags (derived from CQS scores, session participation, role history) |
| avg_cqs_composite | FLOAT | Average CQS composite score across all sessions |
| total_si_earned | INTEGER | Total ♡ earned lifetime |
| session_count | INTEGER | Total sessions participated in |
| top_theme_categories | JSONB | Theme categories the user excels in (from Cube 6 assignments) |
| role_history | JSONB | Array of roles held across sessions (`technology` / `creative` / `business_value`) |
| is_available | BOOLEAN | Whether user opts into the talent pool |
| updated_at | TIMESTAMP | Last profile update |

**Table: `execution_separation_log`** (Anti-Corruption: Ideation != Execution)
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Log entry ID |
| scoping_id | UUID | Project/Differentiator/Specification ID |
| scoping_type | ENUM | `project` / `specification` / `product_differentiator` |
| ideation_participant_ids | JSONB | Array of user_ids who participated in ideation/polling |
| blocked_from_execution | BOOLEAN | True = these users cannot be on execution team |
| enforcement_level | ENUM | `hard_block` / `soft_warn` -- Hard = system prevents; Soft = system warns but allows |
| created_at | TIMESTAMP | When rule was established |

#### Inputs
| Input | Source | Description |
|-------|--------|-------------|
| Time entries | Cube 5 | Completed time tracking data with durations and action types |
| CQS winner | Cube 5 -> Cube 6 | Winner participant_id + CQS score for reward disbursement |
| Payment events | Cube 1 (join), Moderator | Stripe/GPay/ApplePay payment confirmations |
| Jurisdiction rate | Shared core (`hi_rates.py`) | 웃 rate per participant's jurisdiction |
| Token dispute | User UI | Dispute filing on a specific ledger entry |
| Override event | Cube 7 | Governance override affecting token attribution |
| Desired outcome result | Cube 4 / Cube 5 | Outcome status for Methods 2 & 3 |
| Session config | Cube 1 | Pricing tier, fee amount, cost splitting, reward amount, CQS weights |

#### Outputs
| Output | Destination | Description |
|--------|-------------|-------------|
| Ledger entries | Cube 9 (Reports), Audit | Append-only token records with full metadata |
| Token balances | Frontend, Cube 9 | Per-user ♡/웃/◬ totals across sessions |
| Payment confirmations | Cube 1 (join flow), Frontend | Payment success/failure status |
| Reward payout confirmation | Cube 5 -> Frontend | Reward disbursed notification |
| Talent profile updates | Cube 9 (Talent dashboard) | Updated skills, CQS averages, availability |
| Execution separation check | Cube 1, Cube 5 | Block/warn if ideation member attempts to join execution team |
| Dispute status | Frontend, Moderator dashboard | Dispute resolution updates |

#### Functions (14 total)
| Function | Description | MVP | Status |
|----------|-------------|-----|--------|
| `create_ledger_entry()` | Append-only write to token_ledger with all metadata (session, participant, cube, action, method, outcome, version). Immutable after creation. | 1 | Partial (via Cube 5 time tracking) |
| `calculate_session_tokens()` | Computes ♡/웃/◬ for all participants in a session. ♡ = ceil(active_minutes), 웃 = minutes * (jurisdiction_rate / 60), ◬ = ♡ * 5. | 1 | Partial (in Cube 5 service) |
| `process_moderator_fee()` | Handles Moderator session fee via Stripe/GPay/ApplePay. Creates `moderator_fee` payment_transaction. | 1 | Not implemented |
| `process_cost_split_payment()` | Handles participant cost-split payment. Dynamically calculates per-user fee = fee_amount / participant_count. Creates `cost_split` payment_transaction. | 1 | Not implemented |
| `disburse_reward()` | Pays CQS winner the gamified bonus amount via Stripe. Creates `reward_payout` record + payment_transaction. Notifies Cube 9 for announcement. | 1 | Not implemented |
| `get_user_balance()` | Returns total ♡/웃/◬ across all sessions for a user. Filters by lifecycle_state in (pending, approved, finalized). | 1 | Implemented |
| `file_dispute()` | Creates a dispute on a ledger entry. Validates entry exists. Sets status = `open`. | 3 | Implemented |
| `resolve_dispute()` | Admin/Lead resolves dispute with notes. Transitions status to `resolved` or `rejected`. Records resolved_by and resolved_at. | 3 | Not implemented |
| `transition_lifecycle_state()` | Moves ledger entry through simulated -> pending -> approved -> finalized (+ reversed). Validates legal state transitions. | 3 | Not implemented |
| `update_talent_profile()` | Updates user's talent profile from CQS scores, role history, SI earned. Called after each session completion. | 3 | Not implemented |
| `recommend_talent()` | Queries talent_profiles for users matching skill/theme criteria for a project. Returns ranked recommendations with match scores. | 3 | Not implemented |
| `check_execution_separation()` | Verifies a user was NOT in the ideation/polling team before allowing them on execution team. Returns block/warn based on enforcement_level. | 3 | Not implemented |
| `log_execution_separation()` | Records ideation participants list per scoping_id for enforcement. Called when session closes. | 3 | Not implemented |
| `get_jurisdiction_rate()` | Looks up 웃 rate for a participant's jurisdiction from `hi_rates.py`. Returns hourly rate + per-minute rate. | 1 | Implemented |

#### UI/UX Translation Strings (17 keys)
| String Key | English Default | Context |
|------------|----------------|---------|
| `cube8.tokens.balance` | "Your Tokens" | Token balance header |
| `cube8.tokens.si_total` | "♡ {count}" | SI total display |
| `cube8.tokens.hi_total` | "웃 ${amount}" | HI total display (with currency) |
| `cube8.tokens.ai_total` | "◬ {count}" | AI total display |
| `cube8.payment.processing` | "Processing payment..." | Payment loading state |
| `cube8.payment.success` | "Payment successful" | Payment confirmation |
| `cube8.payment.failed` | "Payment failed -- please try again" | Payment error |
| `cube8.payment.choose_method` | "Choose payment method" | Payment method selector (Stripe/GPay/ApplePay) |
| `cube8.dispute.file` | "Dispute this entry" | Dispute button on ledger entry |
| `cube8.dispute.reason` | "Why are you disputing?" | Dispute reason prompt |
| `cube8.dispute.submitted` | "Dispute submitted for review" | Dispute confirmation |
| `cube8.dispute.resolved` | "Dispute resolved" | Resolution notice |
| `cube8.talent.available` | "I'm available for projects" | Opt-in toggle label for talent pool |
| `cube8.talent.skills` | "Your skills" | Skills display header on talent profile |
| `cube8.talent.recommended` | "Recommended for this project" | Talent recommendation badge |
| `cube8.separation.blocked` | "You participated in the ideation phase and cannot join the execution team for this project" | Hard block message (execution separation) |
| `cube8.separation.warning` | "Note: You participated in ideation for this project. Joining execution may pose a conflict of interest." | Soft warning (execution separation) |

### Cube 8 — CRS Traceability

> **CRS Alignment Note:** Cube 8 owns CRS-25 (token calculation), CRS-24 (governance/audit), CRS-32–34 (attribution/disputes/lifecycle), CRS-35 (token policy). CRS-18/19 shared with Cube 5. Requirements.txt is canonical.

| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|
| CRS-18 | CRS-18.IN.SRS.018 | CRS-18.OUT.SRS.018 | **Not implemented** | 2 | System supports real-time token updates via WebSockets | Token balance updates pushed within 500ms of earning | Real-time token velocity monitoring and alerts |
| CRS-18.01 | — | — | **Not implemented** | 2 | Token HUD updates via Supabase Broadcast after each `create_ledger_entry()` | ♡/웃/◬ values pushed to frontend within 500ms of ledger write | Animated token counter with earning breakdown |
| CRS-19 | CRS-19.IN.SRS.019 | CRS-19.OUT.SRS.019 | **Not implemented** | 2 | System tracks engagement metrics including token distribution | Token distribution per session queryable within 1 second | Cross-session token analytics and trend reporting |
| CRS-19.01 | — | — | **Not implemented** | 2 | Token distribution analytics: per-session totals, per-participant breakdown, method breakdown (M1/M2/M3) | Query response <1s for sessions up to 100K participants | Cross-session trend charts in Moderator analytics view |
| CRS-24 | CRS-24.IN.SRS.024 | CRS-24.OUT.SRS.024 | **Partial** | 3 | System enforces governance + audit logging + RBAC on token operations | Every token mutation logged with actor, timestamp, version_id, and justification | Full governance weight damping, quadratic normalization, and velocity caps |
| CRS-24.01 | — | — | **Partial** | 3 | Append-only audit trail: every token state transition logged with actor + timestamp | Audit entries immutable after creation; no UPDATE/DELETE on audit table | Tamper-evident hash chain linking all audit entries |
| CRS-24.02 | — | — | **Not implemented** | 3 | RBAC enforcement on all token endpoints: Moderator (session), Admin (org-wide), Lead (review) | 403 on unauthorized token operations; role checked at route level | Fine-grained permission matrix per token operation type |
| CRS-24.03 | — | — | **Not implemented** | 3 | Anti-manipulation: governance weight damping, velocity caps on token accumulation | Anomaly detection on token earning rate per participant | Automatic freeze on anomalous accounts pending Admin review |
| CRS-25 | CRS-25.IN.SRS.025 | CRS-25.OUT.SRS.025 | **Partial** | 3 | System calculates and assigns Trinity Tokens (♡, 웃, ◬) accurately | ♡ = ceil(minutes), 웃 = jurisdiction rate, ◬ = 5x ♡; ledger entry per action | Multi-method ledger with outcome tracking, desired_outcome_id linkage |
| CRS-25.01 | — | — | **Partial** (in Cube 5) | 1 | ♡ = ceil(active_minutes); 웃 = minutes × (jurisdiction_rate / 60); ◬ = 5 × ♡ | Token values within $0.01 precision; verified against 59 jurisdiction rates | Configurable multiplier per session (Moderator override) |
| CRS-25.02 | — | — | **Implemented** | 1 | 59-jurisdiction rate table: 9 international + 50 US states; rate resolved at join | `get_jurisdiction_rate()` returns $/hr + $/min for any jurisdiction code | Rate auto-update from external data source |
| CRS-25.03 | — | — | **Partial** (in Cube 5) | 1 | Append-only token ledger: every entry has action_type, cube_id, participant_id, timestamp | No UPDATE/DELETE on `token_ledger` table; only INSERT | Merkle tree hash per ledger batch for tamper evidence |
| CRS-25.04 | — | — | **Not implemented** | 3 | Methods 2 & 3: desired_outcome_id linkage on ledger entries; outcome status tracked | Ledger entry references outcome achievement for accountability | Outcome-weighted token bonuses (achieved > partial > not_achieved) |
| CRS-25.05 | — | — | **Not implemented** | 3 | Execution separation: `check_execution_separation()` blocks ideation participants from execution team per scoping_id | 100% enforcement on execution role assignment | Configurable enforcement level (block/warn/log) |
| CRS-25.06 | — | — | **Not implemented** | 3 | Talent profile: `update_talent_profile()` builds from CQS scores + role history + ♡ earned per session | Profile updated after each session completion | Talent recommendation engine with match scoring |
| CRS-32 | CRS-32.IN.SRS.032 | CRS-32.OUT.SRS.032 | **Partial** | 3 | System attributes tokens to actions/cubes/timestamps transparently | Every ledger entry includes cube_id, action_type, version_id | Full dependency graph hash per entry for reproducibility |
| CRS-32.01 | — | — | **Partial** | 3 | Token attribution: `cube_id`, `action_type`, `participant_id`, `session_id`, `created_at` on every ledger entry | Full attribution chain queryable per participant | Attribution visible in Pixelated Token metadata (Cube 9) |
| CRS-33 | CRS-33.IN.SRS.033 | CRS-33.OUT.SRS.033 | **Implemented** | 3 | User or Lead/Developer can flag/dispute token calculations | Dispute filed with reason, linked to specific ledger entry, status tracked | Evidence attachment, admin review workflow, SLA for resolution |
| CRS-33.01 | — | — | **Implemented** | 3 | `file_dispute()` creates dispute record with reason + linked ledger_entry_id; status `open` | Dispute ID returned; status trackable via API | Dispute notification pushed to Admin dashboard |
| CRS-33.02 | — | — | **Not implemented** | 3 | `resolve_dispute()` Admin/Lead resolves with notes; transitions to `resolved` or `rejected` | Resolution logged with `resolved_by`, `resolved_at`, notes | SLA enforcement: auto-escalate if unresolved after 72h |
| CRS-34 | CRS-34.IN.SRS.034 | CRS-34.OUT.SRS.034 | **Partial** | 3 | System assigns token lifecycle states correctly | simulated -> pending -> approved -> finalized (+ reversed); valid transitions enforced | Automated approval for routine entries, manual review for anomalies |
| CRS-34.01 | — | — | **Partial** | 3 | `transition_lifecycle_state()` enforces valid transitions only; invalid transitions return 409 | State machine: simulated → pending → approved → finalized; + reversed at any stage | Batch approval for routine entries matching criteria |
| CRS-34.02 | — | — | **Not implemented** | 3 | Reversed tokens: equal negative ledger entry created (no deletions from ledger) | Reversal preserves audit trail; net balance reflects reversal | Reversal reason + evidence attached to negative entry |
| CRS-35 | CRS-35.IN.SRS.035 | CRS-35.OUT.SRS.035 | **Not implemented** | 3 | Business Owner sees standardized token definitions + valuation rules per session | Per-session token rules displayed: multipliers, methods, jurisdiction rates | Configurable token policies per organization with override audit |
| CRS-35.01 | — | — | **Not implemented** | 3 | Session-level token config: `hi_enabled`, `hi_rate_override`, `ai_multiplier`, CQS bonus pool amount | Token config visible on session detail page for Admin | Org-level default token policy inherited by all sessions |
| CRS-35.02 | — | — | **Not implemented** | 3 | Token summary dashboard: total ♡/웃/◬ per session, per participant, per action type — exportable | Dashboard loads <2s for sessions up to 100K participants | Cross-session comparison charts with trend lines |

### Cube 8 — DesignMatrix VOC (Voice of Customer)

| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-18 | See token earnings in real time during participation | "Watching my tokens grow as I contribute keeps me engaged and motivated." |
| CRS-19 | Understand how token distribution works across the session | "I want to see how my contribution compares to the group average." |
| CRS-24 | Trust that the system is fair and auditable | "If I can't audit the token calculations, I won't trust the system." |
| CRS-25 | Receive fair compensation for my time and contributions | "1 minute = 1 token makes sense. The jurisdiction-based wage rate is a game changer for global teams." |
| CRS-32 | Transparency in how tokens are attributed to specific actions | "I want to see exactly which actions earned me which tokens, with timestamps." |
| CRS-33 | Ability to challenge incorrect token calculations | "Mistakes happen -- I need a dispute process that's fair and responsive." |
| CRS-34 | Confidence that token states are managed correctly | "Simulated tokens should never be confused with finalized ones. Clear state labels matter." |
| CRS-35 | Clear rules for what tokens mean in business terms | "Business stakeholders need to understand token economics before approving budgets." |

### Cube 8 — Architectural Constraints

- **Append-only ledger:** No mutations to existing entries. Corrections are made by appending a new `reversed` entry that negates the original.
- **Lifecycle state machine:** Only valid transitions: simulated -> pending -> approved -> finalized. Reversed can be applied to pending/approved/finalized. No backward transitions otherwise.
- **Treasury-backed 웃 redemption:** 웃 tokens only redeemable against available treasury balance. `hi_enabled=False` pre-treasury.
- **Token velocity caps:** Limit transfer/redemption speed to prevent gaming (max N tokens per hour).
- **Version-locked entries:** Every ledger entry references `version_id` = cube version + dependency graph hash for full audit lineage.
- **Execution separation enforcement:** Ideation team members blocked from execution roles per `scoping_id`. `hard_block` prevents join; `soft_warn` allows with logged warning.

### Cube 8 — Simulation Requirements (Cube 10 Isolation)

> In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs and compares output metrics against the existing implementation baseline.

#### Input/Output Simulation Modes

| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| Time entries (durations, action types) | Input | Cube 5 (Gateway) | **SIMULATED** | Mock TimeEntry records: 8 users x 3 actions each (login, responding, ranking) with realistic durations (1-15 min) |
| CQS winner (participant_id + score) | Input | Cube 5 -> Cube 6 | **SIMULATED** | Fixture CQS winner with composite score 0.87 and 6-metric breakdown |
| Payment events (Stripe/GPay/ApplePay) | Input | Cube 1 (join), Moderator | **SIMULATED** | No real Stripe/GPay/ApplePay calls; mock payment_transactions with `status=completed` |
| Jurisdiction rate | Input | Shared core (`hi_rates.py`) | **LIVE** | Real `hi_rates.py` lookup -- 59 jurisdictions loaded in sim; `resolve_human_rate()` called with real data |
| Token dispute | Input | User UI | **SIMULATED** | Mock dispute filing with canned reason + evidence text |
| Override event | Input | Cube 7 (Ranking) | **SIMULATED** | Mock governance override audit entry from Cube 7 fixture |
| Desired outcome result | Input | Cube 4 / Cube 5 | **SIMULATED** | Mock outcome records: 2 achieved, 1 partially_achieved, 1 not_achieved |
| Session config (pricing, fees, reward) | Input | Cube 1 (Session) | **SIMULATED** | Mock session with pricing_tier=paid, fee_amount_cents=10000, reward_amount_cents=2500, cost_splitting_enabled=true |
| Pipeline completion events | Input | Cube 5 (Gateway) | **SIMULATED** | Mock pipeline triggers: ai_theming=completed, ranking_aggregation=completed, cqs_scoring=completed |
| Ledger entries | Output | Cube 9, Audit | **SIMULATED** | Written to mock append-only store; verified immutability (no mutations) |
| Token balances | Output | Frontend, Cube 9 | **SIMULATED** | Computed from mock ledger; verified ♡/웃/◬ totals match expected values |
| Payment confirmations | Output | Cube 1, Frontend | **SIMULATED** | Mock payment status returned; no real payment provider webhook |
| Reward payout confirmation | Output | Cube 5 -> Frontend | **SIMULATED** | Mock disbursement event; verified winner ID + amount match CQS fixture |
| Talent profile updates | Output | Cube 9 | **SIMULATED** | Written to mock talent_profiles store; verified skill aggregation |
| Execution separation check | Output | Cube 1, Cube 5 | **SIMULATED** | Mock block/warn result based on fixture ideation participant list |
| Dispute status | Output | Frontend, Moderator | **SIMULATED** | Mock dispute lifecycle: open -> under_review -> resolved |

#### Function Simulation Modes

| Function | Sim Mode | Simulation Behavior |
|----------|----------|---------------------|
| `create_ledger_entry()` | **SIMULATED** | Appends to mock in-memory ledger (array); enforces append-only constraint (no updates/deletes); validates all required fields present |
| `calculate_session_tokens()` | **BOTH** | Math is identical -- ♡ = ceil(active_minutes), 웃 = minutes * (jurisdiction_rate / 60), ◬ = ♡ * 5. Sim uses mock time entries; production uses DB query. Jurisdiction rates are LIVE from `hi_rates.py` |
| `process_moderator_fee()` | **SIMULATED** | Creates mock payment_transaction with `transaction_type=moderator_fee`, `status=completed`; no real Stripe API call |
| `process_cost_split_payment()` | **SIMULATED** | Calculates per-user fee = fee_amount / participant_count using mock data; creates mock cost_split transaction; verifies dynamic recalculation as participants change |
| `disburse_reward()` | **SIMULATED** | Creates mock reward_payout record linked to CQS fixture winner; mock payment_transaction for disbursement; no real Stripe transfer |
| `get_user_balance()` | **BOTH** | Aggregation logic identical -- sums delta_si/delta_hi/delta_ai filtered by lifecycle_state. Sim reads mock ledger; production reads Postgres |
| `file_dispute()` | **SIMULATED** | Creates mock dispute with `status=open`; validates ledger entry exists in mock store |
| `resolve_dispute()` | **SIMULATED** | Transitions mock dispute to resolved/rejected; records resolution_notes + resolved_by; validates legal state transitions |
| `transition_lifecycle_state()` | **SIMULATED** | Validates state machine (simulated -> pending -> approved -> finalized + reversed); rejects illegal transitions; all on mock data |
| `update_talent_profile()` | **SIMULATED** | Computes skill tags + avg_cqs_composite from mock session history; writes to mock talent_profiles store |
| `recommend_talent()` | **SIMULATED** | Queries mock talent_profiles matching skill/theme criteria; returns ranked recommendations with mock match scores |
| `check_execution_separation()` | **SIMULATED** | Checks mock execution_separation_log for ideation participants; returns block (hard_block) or warn (soft_warn) based on fixture enforcement_level |
| `log_execution_separation()` | **SIMULATED** | Records ideation participant IDs to mock execution_separation_log per scoping_id |
| `get_jurisdiction_rate()` | **LIVE** | Real `hi_rates.py` lookup -- no mocking needed. Returns actual hourly rate + per-minute rate for given country/state |

#### Canned Test Data

- **Mock token ledger entries (all lifecycle states):**
  - 8 `login` entries (1 per user, lifecycle=finalized, ♡=1, 웃=0, ◬=5)
  - 8 `responding` entries (lifecycle=approved, ♡=3-7 range, 웃=jurisdiction-dependent, ◬=15-35)
  - 8 `ranking` entries (lifecycle=pending, ♡=1-3 range, 웃=jurisdiction-dependent, ◬=5-15)
  - 1 `reward_payout` entry (lifecycle=finalized, ♡=0, 웃=$25.00 equivalent, ◬=0)
  - 1 `reversed` entry (correcting a duplicate login)
  - 1 `simulated` entry (from Cube 10 preview run)
- **Mock payment transactions:**
  - 1 `moderator_fee` (Stripe, $100.00, status=completed)
  - 6 `cost_split` (Stripe, $12.50 each at 8 users, status=completed)
  - 1 `cost_split` (status=failed, for error handling test)
  - 1 `reward_payout` ($25.00, status=disbursed)
- **Mock reward payouts:**
  - 1 CQS winner: participant_id=fixture_user_4, cqs_score=0.87, reward_amount_cents=2500, status=disbursed
- **59 jurisdiction rate fixtures:** Full `hi_rates.py` table (LIVE data, not mocked):
  - International: Nigeria $0.34, Nepal $0.41, Cambodia $1.04, Mexico $1.43, Thailand $1.61, Brazil $1.68, Honduras $1.78, Colombia $1.81, Chile $3.02
  - US range: $7.25 (TX, AL, GA...) to $16.28 (WA)
- **Mock dispute resolution flows:**
  - Flow 1: open -> under_review -> resolved (valid dispute, correction ledger entry appended)
  - Flow 2: open -> under_review -> rejected (invalid dispute, no correction)
  - Flow 3: open -> resolved (fast-track resolution by admin)
- **Mock talent profiles:** 4 profiles with varying CQS averages (0.45, 0.62, 0.78, 0.87), skill tags, and role history
- **Mock execution separation:** 1 scoping_id with 3 ideation participants blocked from execution (hard_block)

#### Simulation Pass Criteria

- **100% test pass rate:** All existing 19 unit tests must pass; no regressions
- **No spiral metric regressions:** Backend duration, TypeScript errors, bundle sizes must not increase
- **Ledger immutability:** No mutations to existing mock ledger entries allowed; corrections only via new `reversed` entries. Verified by checksumming ledger state before/after operations
- **Token calculation accuracy:** ♡ = ceil(minutes) exact, 웃 = minutes * (rate/60) within $0.01 precision, ◬ = ♡ * 5 exact. Verified against 8 fixture users across 3 jurisdiction tiers
- **Lifecycle state integrity:** Only valid transitions accepted (simulated -> pending -> approved -> finalized + reversed). All 5 illegal transitions (e.g., finalized -> pending) must be rejected with appropriate error
- **Payment simulation safety:** Zero real API calls to Stripe/GPay/ApplePay during simulation. Verified by mock transport layer assertion
- **User code challenge:** Submitted replacement code must EXCEED existing metrics (faster token calculation, better dispute resolution workflow, or more accurate talent matching)

#### Spiral Test Reference

Partial tests exist -- **19 tests** (Cube 8 token service unit tests). Full spiral baseline (N=5+) **PENDING**. Current test coverage includes: session token query, user balance aggregation, dispute creation, jurisdiction rate lookup. Missing coverage: payment processing, reward disbursement, talent profiles, execution separation, lifecycle transitions. Full spiral baseline will be established when remaining Cube 8 functions are implemented.

### Cube 8 — 웃 Rate Table ($/hr)

| Range | Jurisdictions |
|-------|---------------|
| $0.34-$1.04 | Nigeria, Nepal, Cambodia |
| $1.43-$3.02 | Mexico, Thailand, Brazil, Honduras, Colombia, Chile |
| $7.25 | TX, AL, GA, ID, IN, IA, KS, KY, LA, MS, NH, NC, ND, OK, PA, SC, TN, UT, WI, WY |
| $8.75-$12.30 | WV, MI, OH, MT, MN, AR, SD, AK, NE, NV, NM, VA, MO |
| $13.00-$16.28 | FL, VT, HI, RI, ME, CO, AZ, OR, DE, IL, MD, MA, NY, NJ, CT, CA, WA |

API: `GET /tokens/rates` (full table) | `GET /tokens/rates/lookup?country=US&state=California`

### Cube 8 — Traceability

- Scoping: via `session_id` (see Shared Core -- Cross-Cutting Scoping Inheritance)
- `payment_transactions` track all money flow per session with provider reference
- `talent_profiles` aggregated from all session participation -- queryable by scoping context
- `execution_separation_log` enforces ideation/execution separation per `scoping_id` -- prevents corruption where the team that ideated/polled also executes
- Every ledger entry references `version_id` (cube version + dependency hash) for full audit lineage
- `reward_payouts` links CQS score -> payment transaction -> winner participant for end-to-end reward traceability

### Cube 8 — Files

| File | Lines | Purpose |
|------|-------|---------|
| `backend/app/cubes/cube8_tokens/service.py` | 98 | Ledger queries + dispute creation |
| `backend/app/cubes/cube8_tokens/router.py` | 72 | 4 API endpoints (tokens, dispute, rates, rates lookup) |
| `backend/app/models/token_ledger.py` | 53 | TokenLedger + TokenDispute ORM models |
| `backend/app/schemas/token.py` | 38 | Pydantic schemas with ♡/웃/◬ serialization aliases |
| `backend/app/core/hi_rates.py` | 135 | 59-jurisdiction 웃 rate table + lookup functions |
| `backend/tests/cube8/test_token_service.py` | 241 | 19 unit tests (session tokens, balance, disputes, rates) |

### Cube 8 — Downstream/Upstream Dependencies

| Direction | Cube | Dependency |
|-----------|------|------------|
| **Upstream (receives from)** | Cube 5 (Gateway) | Time entries with durations, token calculation triggers |
| **Upstream (receives from)** | Cube 5 -> Cube 6 | CQS winner participant_id + score for reward payout |
| **Upstream (receives from)** | Cube 1 (Session) | Payment events, session config (pricing, fees, reward) |
| **Upstream (receives from)** | Cube 7 (Ranking) | Governance override events for audit trail |
| **Upstream (receives from)** | Cube 4 (Collector) | Desired outcome results (Methods 2 & 3) |
| **Downstream (sends to)** | Cube 9 (Reports) | Ledger entries, token balances, talent profiles |
| **Downstream (sends to)** | Cube 1 (Session) | Payment confirmation, execution separation check |
| **Downstream (sends to)** | Frontend | Token balances, payment status, dispute status |

---

## Cube 9 — Reports, Export & Dashboards: PARTIALLY IMPLEMENTED (Position 1,1,3 / MVP1-MVP3)

> **Note:** Cube 9 is NOT a stub -- it has real implementation (135 lines in service.py, 38 lines in router.py, 173 lines total). CSV export is functional.

> **Grid position:** (1,1,3) -- top-left of Level 1 grid
> **Spiral order:** 9th cube (top-left, final cube in Layer 1 spiral)
> **MVP scope:** MVP1 (CSV export), MVP2 (PDF, analytics), MVP3 (Pixelated Tokens, CQS dashboard, talent)

### Cube 9 — Overview

Cube 9 is the reporting and export layer. It consumes data from all other cubes and produces exports, dashboards, Pixelated Token images, and talent recommendations. It also handles results distribution (only paying + Lead-exempt users receive results) and data destruction after token image delivery.

Key responsibilities:
- **CSV/PDF export:** 15-column schema matching the reference output format
- **Pixelated Tokens:** Self-contained, value-carrying images with encoded pixel borders and center QR
- **Results distribution:** Only users who opted in AND paid (or are Lead/Developer exempt) receive polling results
- **CQS dashboard (Moderator-only):** Per-response CQS scores, distribution, reward winner details
- **Reward announcement:** Winner notified privately; other users see generic "a participant won" message
- **Talent recommendation:** In project mode, recommends talent based on CQS + skills, with execution separation enforcement
- **Data destruction:** After Pixelated Token delivery, user token data is purged from the system

### Cube 9 — Current Implementation Status

**Backend service:** `backend/app/cubes/cube9_reports/service.py` (135 lines)
- `export_session_csv()` -- builds 15-column CSV from PostgreSQL (ResponseMeta, ResponseSummary, Question, themes)
- `export_session_csv_to_file()` -- writes CSV to filesystem
- CSV columns: Q_Number, Question, User, Detailed_Results, 333_Summary, 111_Summary, 33_Summary, Theme01, Theme01_Confidence, Theme2_9, Theme2_9_Confidence, Theme2_6, Theme2_6_Confidence, Theme2_3, Theme2_3_Confidence

**Backend router:** `backend/app/cubes/cube9_reports/router.py` (38 lines)
- `GET /sessions/{session_id}/export/csv` -- CRS-14: CSV download as StreamingResponse
- `GET /sessions/{session_id}/analytics` -- CRS-19: stub (`NotImplementedError`)

**Total backend:** 173 lines (service 135 + router 38)

**Exporters package:** `backend/app/cubes/cube9_reports/exporters/` -- scaffolded (empty `__init__.py`, ready for CSV/PDF exporter modules)

### Cube 9 — Requirements.txt Specification

#### Data Tables (4 total)

**Table: `exports`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Export record ID |
| session_id | UUID (FK->sessions) | Session reference |
| export_type | ENUM | `csv` / `pdf` / `pixelated_token` / `full_package` |
| format | VARCHAR(10) | File format (`csv`, `pdf`, `png`, `json`) |
| file_url | TEXT | Stored file location (S3/local path) |
| requested_by | UUID (FK->users) | Who requested export |
| created_at | TIMESTAMP | When generated |

**Table: `pixelated_tokens`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Pixelated token ID |
| session_id | UUID (FK->sessions) | Session reference |
| participant_id | UUID (FK->participants) | Token owner |
| image_data | BYTEA | Generated image binary (PNG) |
| top_pixel_data | JSONB | Encoded data in top pixel line |
| encoding_version | INTEGER | Pixel encoding scheme version |
| qr_payload | TEXT | QR code embedded data (verification URL) |
| delivered | BOOLEAN | Whether image has been delivered to user |
| delivery_method | ENUM (nullable) | `download` / `sms` / `email` |
| delivered_at | TIMESTAMP (nullable) | When delivered |
| data_destroyed | BOOLEAN | Whether token data was purged post-delivery |
| created_at | TIMESTAMP | When generated |

**Table: `results_distribution`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Distribution record ID |
| session_id | UUID (FK->sessions) | Session reference |
| participant_id | UUID (FK->participants) | Recipient |
| distribution_type | ENUM | `polling_results` / `full_package` / `pixelated_token` |
| delivery_method | ENUM | `in_app` / `email` / `sms` / `download` |
| delivered | BOOLEAN | Whether delivered successfully |
| delivered_at | TIMESTAMP (nullable) | When delivered |

**Table: `talent_recommendations`**
| Variable | Type | Description |
|----------|------|-------------|
| id | UUID (PK) | Recommendation ID |
| scoping_id | UUID | Project/Differentiator/Specification this recommendation is for |
| scoping_type | ENUM | `project` / `specification` / `product_differentiator` |
| recommended_user_id | UUID (FK->users) | Recommended talent |
| match_reason | TEXT | Why this talent was recommended (skills, CQS, theme expertise) |
| match_score | FLOAT | Recommendation confidence (0.0-1.0) |
| is_eligible | BOOLEAN | False if user was on ideation team (execution separation enforced) |
| created_at | TIMESTAMP | When recommended |

### Cube 9 — Pixelated Tokens Image Format Specification

A self-contained, value-carrying image that encodes a user's earned tokens. The image is the user's proof of token ownership -- after delivery, the server purges the data.

#### Image Structure (bordered frame around center QR)

```
+---[TOP PIXEL LINE: color-encoded data]---+
|L|                                       |R|
|E|                                       |I|
|F|                                       |G|
|T|         CENTER: QR CODE              |H|
| |       (scan for verification)         |T|
|V|                                       |V|
|E|                                       |E|
|R|                                       |R|
|T|                                       |T|
+--[BOTTOM PIXEL LINE: mirror of top]-----+
```

- **Top pixel line:** Row of colored pixels. Color and position of each pixel encodes one character. Encoded data includes:
  - Session Name
  - Session ID
  - Date and Time
  - ♡ (SI) earned
  - ◬ (AI) earned
  - 웃 (HI) earned
  - User hash (anonymized)
  - Project ID
  - Encoding version

- **Bottom pixel line:** **Mirror/reverse of top line** -- DNA-style integrity check. Top read forward and bottom read backward must match to confirm authenticity. Mismatch = tampered/invalid image.

- **Left vertical pixels:** Encryption key (first half) -- required to decode the top/bottom pixel data.

- **Right vertical pixels:** Encryption key (second half) -- combined with left vertical to form the full decryption key.

- **Center:** QR code for quick scan/verification and token data retrieval.

- **Pixel encoding scheme:** Versioned color-to-character mapping. Each pixel = one encoded character. Color + position = value. The `encoding_version` field allows the scheme to evolve without breaking old tokens.

#### Delivery & Data Destruction

- **Delivery methods (user chooses one):**
  - Download directly from app
  - Send via SMS/text
  - Send via email

- **Data destruction:** After the Pixelated Token image is delivered to the user, **the user's token data is destroyed from the system**. The token value lives in the image itself, not on the server. Privacy-by-design.

- **Implication:** Users are responsible for safekeeping their Pixelated Token image. Lost image = lost token proof.

- **Token independence:** ♡, ◬, and 웃 track value independently with no dependency on any cryptocurrency. Blockchain integrations can be layered on later.

### Cube 9 — Inputs

| Input | Source | Description |
|-------|--------|-------------|
| Session data | All cubes | Complete session: responses, themes, rankings, tokens, time entries |
| Payment status | Cube 8 | Who paid / who is Lead-exempt -- for results distribution eligibility |
| CQS scores | Cube 6 | All scores for Moderator CQS dashboard |
| Token ledger | Cube 8 | Token data for Pixelated Token image generation |
| Talent profiles | Cube 8 | Talent pool for recommendations |
| Execution separation log | Cube 8 | Ideation team members to flag as ineligible for execution |
| Results opt-in flags | Cube 1 (participants) | Who clicked "Yes" for results |
| Export request | User UI / Auto-trigger | Request for CSV/PDF/Pixelated Token generation |
| Session config | Cube 1 | Pricing tier, reward settings, live feed settings |

### Cube 9 — Outputs

| Output | Destination | Description |
|--------|-------------|-------------|
| CSV/PDF export files | User download / email / SMS | Session results in 15-column format |
| Pixelated Token images | User download / email / SMS | Self-contained token proof images |
| Results distribution records | Audit | Who received what, when, via what method |
| CQS dashboard data | Moderator UI | Scores, distribution, winner details |
| Talent recommendations | Moderator / Project owner UI | Recommended talent with eligibility flags |
| Analytics dashboard data | Moderator UI | Participation, completion, timing analytics |
| Data destruction confirmation | Audit | Confirmation that token data was purged post-delivery |
| Reward announcement | Frontend | Winner notification + generic announcement to all |

### Cube 9 — Functions (14 total)

| Function | Description | MVP | Status |
|----------|-------------|-----|--------|
| `generate_csv_export()` | Produces CSV matching the 15-column target output schema. Queries PostgreSQL (ResponseMeta, ResponseSummary, Question, themes). | 1 | Implemented |
| `generate_pdf_export()` | Produces formatted PDF report with themes, rankings, and analytics. Includes charts and summaries. | 2 | Not implemented |
| `generate_pixelated_token()` | Creates Pixelated Token image: encodes token data in pixel borders, generates center QR code, assembles final PNG. | 3 | Not implemented |
| `encode_pixel_line()` | Encodes data string into a row of colored pixels using versioned color-to-character mapping scheme. | 3 | Not implemented |
| `mirror_pixel_line()` | Creates reversed bottom pixel line from top pixel line (DNA-style integrity check). | 3 | Not implemented |
| `generate_encryption_keys()` | Creates left/right vertical pixel encryption key halves. Combined key required to decode top/bottom data. | 3 | Not implemented |
| `distribute_results()` | Delivers results to all eligible participants (paid + Lead-exempt). Checks results_opt_in + payment_status. Creates results_distribution records. | 1 | Not implemented |
| `deliver_pixelated_token()` | Sends token image via chosen method (download/SMS/email). Updates delivered flag and timestamp. | 3 | Not implemented |
| `destroy_token_data()` | Purges token data from system after image delivery. Sets data_destroyed = True. Irreversible. | 3 | Not implemented |
| `build_cqs_dashboard()` | Aggregates CQS data for Moderator dashboard: per-response scores (all 6 metrics + composite), score distribution, winner details. Hidden from regular users. | 1 | Not implemented |
| `announce_reward_winner()` | Sends private winner notification (full CQS breakdown) + generic "a participant won the bonus" to all other users. No CQS details exposed to non-winners. | 1 | Not implemented |
| `recommend_talent_for_project()` | Queries talent profiles, filters by execution separation (ideation members ineligible), returns ranked recommendations with match scores and reasons. | 3 | Not implemented |
| `flag_ideation_members()` | Marks ideation team members as ineligible for execution recommendations. Reads from execution_separation_log. | 3 | Not implemented |
| `build_analytics_dashboard()` | Aggregates participation, timing, completion, and engagement metrics for Moderator analytics view. | 2 | Not implemented |

### Cube 9 — UI/UX Translation Strings (26 keys)

| String Key | English Default | Context |
|------------|----------------|---------|
| `cube9.export.csv` | "Export CSV" | CSV export button |
| `cube9.export.pdf` | "Export PDF" | PDF export button |
| `cube9.export.generating` | "Generating export..." | Export loading state |
| `cube9.export.ready` | "Your export is ready" | Export complete notification |
| `cube9.export.download` | "Download" | Download button |
| `cube9.pixelated.generating` | "Creating your Pixelated Token..." | Token image generation loading |
| `cube9.pixelated.ready` | "Your token image is ready" | Token image complete |
| `cube9.pixelated.delivery_prompt` | "How would you like to receive your token?" | Delivery method selection prompt |
| `cube9.pixelated.download` | "Download" | Download delivery option |
| `cube9.pixelated.sms` | "Send via text" | SMS delivery option |
| `cube9.pixelated.email` | "Send via email" | Email delivery option |
| `cube9.pixelated.warning` | "Important: Save this image -- your token data will be removed from our system after delivery" | Data destruction warning (must be acknowledged) |
| `cube9.results.title` | "Session Results" | Results page header |
| `cube9.results.restricted` | "Pay to access full results" | Non-paying user restriction message |
| `cube9.reward.winner` | "Congratulations! You won the contribution bonus!" | Winner private notification |
| `cube9.reward.announced` | "A participant won the contribution bonus!" | General announcement (no CQS details) |
| `cube9.cqs.dashboard_title` | "Contribution Quality Scores" | Moderator CQS dashboard header |
| `cube9.talent.title` | "Recommended Talent" | Talent recommendation dashboard header |
| `cube9.talent.match_score` | "Match: {percent}%" | Talent match confidence display |
| `cube9.talent.ineligible` | "Participated in ideation -- not eligible for execution" | Execution separation flag |
| `cube9.talent.available` | "Available" | Talent availability badge |
| `cube9.analytics.title` | "Session Analytics" | Analytics dashboard header |
| `cube9.feedback.prompt` | "How can we make this better?" | System-prompted feedback (links to Cube 10) |
| `cube9.export.methods_2_3` | "Full session export" | Methods 2 & 3 full content package export |
| `cube9.results.lead_exempt` | "Lead/Developer access -- complimentary" | Lead exemption indicator |
| `cube9.results.paid_access` | "Results included with your payment" | Paid user results access confirmation |

### Cube 9 — CRS Traceability

> **CRS Alignment Note:** Cube 9 owns CRS-14 (export), CRS-19 (analytics dashboard, shared with Cube 5/8), CRS-20/21 (deep dive reports — MVP3). CRS-15 (voice export) shared with Cube 3. Requirements.txt is canonical.

| CRS | Design Input ID | Design Output ID | Status | MVP | User Story | Specification Target | Stretch Target |
|-----|----------------|-----------------|--------|-----|------------|---------------------|---------------|
| CRS-14 | CRS-14.IN.SRS.014 | CRS-14.OUT.SRS.014 | **Implemented** | 1 | System exports session results to CSV | CSV matches 15-column schema; generated within 5 seconds for 10,000 responses | PDF export with charts, masked vs full export options |
| CRS-14.01 | — | — | **Implemented** | 1 | `generate_csv_export()` produces 15-column Web_Results CSV: 5 input + 3 summaries + 8 theme/confidence fields | Schema matches `Updated_Web_Results_With_Themes_And_Summaries_v03.csv` exactly | Streaming CSV for >100K responses (chunked write) |
| CRS-14.02 | — | — | **Not implemented** | 2 | `generate_pdf_export()` produces formatted PDF with themes, rankings, charts, CQS scores | PDF generated <10s for 10K responses; includes theme distribution charts | Branded PDF with org logo + custom cover page |
| CRS-14.03 | — | — | **Not implemented** | 3 | `destroy_token_data()` Moderator-triggered secure wipe of all session data with audit log entry | Irreversible; `data_destroyed = True` on session record; audit entry created | Scheduled auto-destruction after configurable retention period |
| CRS-14.04 | — | — | **Not implemented** | 3 | Pixelated Token image: `generate_pixelated_token()` encodes token data in pixel borders, QR center | DNA-style integrity: top/bottom pixel lines mirror; left/right keys required to decode | Animated token reveal with Seed of Life branding |
| CRS-14.05 | — | — | **Not implemented** | 1 | `distribute_results()` delivers to eligible participants (paid + Lead-exempt); checks `results_opt_in` + `payment_status` | Results gating enforced: unpaid non-Lead users excluded | Tiered results: basic (free) vs full (paid) export levels |
| CRS-15 | CRS-15.IN.WRS.015 | CRS-15.OUT.WRS.015 | **Not implemented** | 2 | Export includes voice transcripts with STT metadata | Voice responses included in CSV with transcript text and confidence scores | Audio playback links in PDF export |
| CRS-15.01 | — | — | **Not implemented** | 2 | Voice responses included in CSV with `source_type: voice`, transcript text, STT provider, confidence score | All voice responses appear alongside text responses in unified export | Per-provider accuracy comparison report |
| CRS-19 | CRS-19.IN.SRS.019 | CRS-19.OUT.SRS.019 | **Stub** | 2 | System tracks and displays engagement analytics | Participation rate, completion rate, time-to-decision, token distribution | Cross-session trend analytics, cohort analysis, predictive engagement |
| CRS-19.01 | — | — | **Stub** | 2 | `build_analytics_dashboard()` aggregates participation, timing, completion, engagement metrics | Moderator analytics view loads <2s; includes response rate chart, completion funnel | Predictive engagement scoring based on historical session patterns |
| CRS-19.02 | — | — | **Not implemented** | 2 | `build_cqs_dashboard()` shows per-response CQS scores (6 metrics + composite), distribution, winner | CQS visible to Moderator only; score distribution histogram | CQS trend tracking across sessions for talent development |
| CRS-20 | CRS-20.IN.SRS.020 | CRS-20.OUT.SRS.020 | **Not implemented** | 3 | Reports include deep dive cycle context | Multi-round reports preserve question lineage and theme evolution | Cycle-over-cycle comparison visualizations |
| CRS-20.01 | — | — | **Not implemented** | 3 | Multi-round export preserves parent→child session chain with question lineage | Each cycle's responses, themes, rankings in separate export sections | Interactive cycle tree navigator in analytics UI |
| CRS-21 | CRS-21.IN.SRS.021 | CRS-21.OUT.SRS.021 | **Not implemented** | 3 | Export preserves full context across deep dive rounds | Each cycle's responses, themes, and rankings included in export | Interactive deep-dive explorer in analytics dashboard |
| CRS-21.01 | — | — | **Not implemented** | 3 | Cross-cycle context: parent theme label + confidence shown alongside child cycle data in export | Full lineage chain from root session to deepest cycle in single export | Divergence analysis: how themes evolved across cycles |

### Cube 9 — DesignMatrix VOC (Voice of Customer)

| CRS | Customer Need | VOC Comment |
|-----|---------------|-------------|
| CRS-14 | Get results out of the system in a usable format | "I need a CSV I can drop into Excel and share with stakeholders immediately." |
| CRS-15 | Voice contributions included in final results | "If people spoke their responses, those need to show up in the export too." |
| CRS-19 | Understand session engagement and participation health | "I want to know if people dropped off, how long they spent, and what drove engagement." |
| CRS-20 | Deep dive results maintain narrative continuity | "Multi-round sessions need reports that tell the full story, not just the last round." |
| CRS-21 | Full audit trail for governance and compliance | "Our legal team needs to see every input, every ranking, every override in one package." |
| (Pixelated Token) | Own my token proof independently from the platform | "I love that my token value lives in my image, not on someone else's server." |
| (Talent) | Find the right people for execution based on ideation quality | "CQS scores tell us who thinks best about this problem. Let's hire them for the build." |
| (Results Distribution) | Only paying users get results -- fair value exchange | "If I paid to participate, I expect to receive the results. If I didn't, I don't." |

### Cube 9 — Architectural Constraints

- **15-column CSV schema:** Must match the reference output format exactly (see `Updated_Web_Results_With_Themes_And_Summaries_v03 (1).csv`).
- **Results distribution gating:** Only participants where `results_opt_in = True AND (payment_status = 'paid' OR payment_status = 'lead_exempt')` receive results.
- **Pixelated Token data destruction:** After image delivery, `destroy_token_data()` purges token records. This is irreversible. User must acknowledge the warning before delivery.
- **CQS visibility:** CQS scores visible ONLY to Moderators and system. Never exposed to regular users. Winner notification does not include CQS breakdown for other users.
- **Execution separation in talent:** `talent_recommendations` with `is_eligible = False` are shown to Moderators with a clear ineligibility flag but not filtered out (Moderator can see who was in ideation for context).
- **Methods 2 & 3 auto-export:** All participants automatically receive a full content package (meeting purpose, desired outcome, time logged, results, ♡ earned) attached to Project ID on session completion.

### Cube 9 — Simulation Requirements (Cube 10 Isolation)

> In Cube 10, users can isolate this cube and submit replacement code for specific functions. The simulation runs the user's code against the same canned inputs and compares output metrics against the existing implementation baseline.

#### Input/Output Simulation Modes

| Variable | Direction | Source/Dest | Sim Mode | Notes |
|----------|-----------|-------------|----------|-------|
| Session data (responses, themes, rankings, tokens) | Input | All cubes | **SIMULATED** | Complete mock session dataset: 8 users, 7 AI responses + 1 HI response, 3 themes, aggregated rankings, token ledger |
| Payment status (who paid / Lead-exempt) | Input | Cube 8 | **SIMULATED** | Mock payment records: 5 paid, 1 Lead-exempt, 2 unpaid. Used for results distribution gating |
| CQS scores (all responses) | Input | Cube 6 | **SIMULATED** | Mock CQS data: 8 responses with 6-metric breakdown (Insight, Depth, Future Impact, Originality, Actionability, Relevance) + composite score |
| Token ledger (for Pixelated Token generation) | Input | Cube 8 | **SIMULATED** | Mock ledger entries per participant: ♡ earned, 웃 earned, ◬ earned, session metadata |
| Talent profiles | Input | Cube 8 | **SIMULATED** | 4 mock talent profiles with skills, CQS averages, role history, availability |
| Execution separation log | Input | Cube 8 | **SIMULATED** | Mock log: 3 ideation participants flagged as ineligible for execution team |
| Results opt-in flags | Input | Cube 1 (participants) | **SIMULATED** | Mock participant records: 6 opted in, 2 opted out |
| Export request | Input | User UI / Auto-trigger | **SIMULATED** | Mock export request with format type (csv/pdf/pixelated_token) and requester ID |
| Session config (pricing, reward, live feed) | Input | Cube 1 | **SIMULATED** | Mock session config: pricing_tier=paid, reward_enabled=true, reward_amount_cents=2500 |
| Aggregated rankings | Input | Cube 7 | **SIMULATED** | Mock ranking results: 3 themes in final order with scores, vote counts, and is_top_theme2 flag |
| Token balances | Input | Cube 8 | **SIMULATED** | Mock per-user token totals: ♡ range 5-22, 웃 range $0.57-$4.07, ◬ range 25-110 |
| Export format config | Input | System | **SIMULATED** | Mock export settings: 15-column CSV schema, PDF template selection, Pixelated Token encoding version |
| Pixelated Token generation params | Input | System | **SIMULATED** | Mock params: session name, session ID, date/time, ♡/◬/웃 values, user hash, project ID, encoding_version=1 |
| CSV/PDF export files | Output | User download | **BOTH** | Real CSV/PDF generated from mock data; file content verified against 15-column schema |
| Pixelated Token images | Output | User download | **BOTH** | Real PNG image generated from mock token data; pixel encoding + QR verified |
| Results distribution records | Output | Audit | **SIMULATED** | Written to mock distribution store; verified gating logic (paid + Lead-exempt only) |
| CQS dashboard data | Output | Moderator UI | **SIMULATED** | Mock dashboard payload; verified CQS visibility rules (Moderator-only, hidden from users) |
| Talent recommendations | Output | Moderator UI | **SIMULATED** | Mock recommendations with match scores; verified execution separation enforcement |
| Analytics dashboard data | Output | Moderator UI | **SIMULATED** | Mock analytics: participation rate, completion rate, time-to-decision |
| Data destruction confirmation | Output | Audit | **SIMULATED** | Mock destruction record; verified all token data purged from mock store after delivery |
| Reward announcement | Output | Frontend | **SIMULATED** | Mock winner notification (private) + generic announcement (public); verified CQS details NOT exposed to non-winners |

#### Function Simulation Modes

| Function | Sim Mode | Simulation Behavior |
|----------|----------|---------------------|
| `generate_csv_export()` | **BOTH** | Generates real CSV from mock data. Queries mock PostgreSQL (ResponseMeta, ResponseSummary, Question, themes). Output file verified against 15-column schema with exact column names and data types |
| `generate_pdf_export()` | **BOTH** | Generates real PDF from mock data. Layout, charts, and summaries rendered from mock session dataset. File size and page count verified |
| `generate_pixelated_token()` | **BOTH** | Generates real PNG image from mock token data. Encodes pixel borders (top/bottom/left/right), generates center QR code, assembles final image. Pixel integrity verified |
| `encode_pixel_line()` | **BOTH** | Real encoding logic -- converts mock data string to colored pixel row using versioned color-to-character mapping. Output pixel count = input character count verified |
| `mirror_pixel_line()` | **BOTH** | Real mirroring logic -- reverses top pixel line to produce bottom line. DNA-style integrity: forward top must match reversed bottom. Verified with assertion |
| `generate_encryption_keys()` | **BOTH** | Real key generation -- produces left/right vertical pixel halves. Combined key required to decode top/bottom data. Round-trip encode/decode verified |
| `distribute_results()` | **SIMULATED** | No real email/SMS delivery. Checks mock participant records for results_opt_in + payment_status. Creates mock results_distribution records. Verifies: 5 paid + 1 Lead-exempt = 6 deliveries; 2 unpaid + opted-out = 0 deliveries |
| `deliver_pixelated_token()` | **SIMULATED** | No real SMS/email. Records mock delivery with method (download/sms/email) + timestamp. Sets delivered=true on mock pixelated_tokens record |
| `destroy_token_data()` | **SIMULATED** | Purges token data from mock store (not real DB). Sets data_destroyed=true. Verifies: token data inaccessible after destruction; operation is irreversible; confirmation record created |
| `build_cqs_dashboard()` | **SIMULATED** | Aggregates mock CQS data for dashboard payload. Verifies: all 6 metrics present per response, composite score computed correctly, winner highlighted, CQS details hidden from non-Moderator roles |
| `announce_reward_winner()` | **SIMULATED** | Creates 2 mock notifications: private winner message (full CQS breakdown) + generic public message ("a participant won the bonus"). Verifies: CQS details NOT in public message |
| `recommend_talent_for_project()` | **SIMULATED** | Queries mock talent_profiles, filters by execution separation (3 ideation members marked ineligible), returns ranked recommendations with match scores. Verifies: ineligible members flagged but still visible to Moderator |
| `flag_ideation_members()` | **SIMULATED** | Reads mock execution_separation_log, marks 3 ideation participants as is_eligible=false in mock talent_recommendations |
| `build_analytics_dashboard()` | **SIMULATED** | Computes mock analytics: participation rate (8/8 = 100%), completion rate (7/8 = 87.5%), avg time-to-decision, token distribution summary |

#### Canned Test Data

- **Mock export data (15-column CSV format):** 8 response rows matching the reference schema (`Updated_Web_Results_With_Themes_And_Summaries_v03 (1).csv`):
  - Q_Number: 1 (all same question for single-poll session)
  - Question: "What are the most important considerations for AI governance in our organization?"
  - User: 7 AI user hashes + 1 HI user hash
  - Detailed_Results: Full response text (50-200 words each)
  - 333_Summary / 111_Summary / 33_Summary: Pre-computed summaries from Cube 6 fixtures
  - Theme01: Risk & Concerns (2), Supporting Comments (3), Neutral Comments (3)
  - Theme01_Confidence: Range 67%-95%
  - Theme2_9 / Theme2_6 / Theme2_3: Assigned themes with confidence scores from Cube 6 fixtures
- **Mock pixelated token parameters (per user):**
  - Session Name: "AI Governance Poll"
  - Session ID: fixture UUID
  - Date/Time: 2026-03-01T14:30:00Z
  - ♡ values: [5, 7, 3, 12, 8, 6, 9, 22]
  - ◬ values: [25, 35, 15, 60, 40, 30, 45, 110]
  - 웃 values: [$0.60, $0.85, $0.36, $1.45, $0.97, $0.73, $1.09, $2.66] (TX jurisdiction)
  - User hashes: 8 unique SHA-256 hashes
  - Project ID: fixture UUID
  - Encoding version: 1
- **Mock results distribution lists:**
  - Eligible (6): 5 paid + 1 Lead-exempt -- receive polling results
  - Ineligible (2): 1 unpaid + opted out, 1 unpaid + opted in but no payment -- no results
- **Mock talent profiles with CQS scores:**
  - Profile 1: avg_cqs=0.87, skills=["strategic_thinking", "risk_analysis"], roles=["business_value"], is_available=true
  - Profile 2: avg_cqs=0.78, skills=["technical_architecture", "security"], roles=["technology"], is_available=true
  - Profile 3: avg_cqs=0.62, skills=["communication", "facilitation"], roles=["creative"], is_available=false
  - Profile 4: avg_cqs=0.45, skills=["data_analysis"], roles=["technology", "creative"], is_available=true, is_eligible=false (ideation participant)
- **Mock CQS dashboard data:** 8 responses scored across 6 metrics:
  - Insight (20%): range 0.4-0.95
  - Depth (15%): range 0.3-0.90
  - Future Impact (25%): range 0.5-0.92
  - Originality (15%): range 0.3-0.88
  - Actionability (15%): range 0.4-0.85
  - Relevance (10%): range 0.6-0.95
  - Composite: range 0.45-0.87
  - Winner: participant_id=fixture_user_4 (composite=0.87)
- **Mock reward announcement:** Winner (private): "Congratulations! You won the $25.00 contribution bonus! Your CQS score: 0.87." Public: "A participant won the contribution bonus!"

#### Simulation Pass Criteria

- **100% test pass rate:** All existing tests must pass; no regressions in any cube
- **No spiral metric regressions:** Backend duration, TypeScript errors, bundle sizes must not increase
- **Export format compliance (15-column schema match):** Generated CSV must have exactly 15 columns in the exact order specified. Column names must match reference file character-for-character. All 8 fixture rows must be present with non-empty values for all columns
- **Pixelated Token integrity (top/bottom DNA match):** Top pixel line read forward must exactly equal bottom pixel line read backward. Left + right vertical pixels must combine to form a valid decryption key. QR code must scan to valid verification URL. Encoding version must be present and match expected value
- **Data destruction completeness:** After `destroy_token_data()` runs on mock store: all token ledger entries for the target participant must be inaccessible. `data_destroyed` flag must be `true`. Subsequent `get_user_balance()` must return zeros. Destruction must be irreversible (re-running destroy on already-destroyed data must be a no-op)
- **Results distribution gating:** Exactly 6 of 8 fixture participants receive results (5 paid + 1 Lead-exempt). Zero results delivered to unpaid/opted-out users. Verified by mock distribution record count
- **CQS visibility enforcement:** CQS scores must NOT appear in any response payload accessible to non-Moderator roles. Winner notification to non-winners must NOT contain CQS breakdown
- **User code challenge:** Submitted replacement code must EXCEED existing metrics (faster export generation, better pixel encoding efficiency, more accurate talent matching, or improved data destruction verification)

#### Spiral Test Reference

No spiral metrics recorded yet -- **PENDING implementation**. Baseline (N=5+) required before Cube 10 isolation testing is enabled. Current status: CSV export implemented (135 lines in service.py, 38 lines in router.py, 173 lines total), analytics stub defined, 0 dedicated Cube 9 tests. Spiral baseline will be established during Cube 9 full implementation (PDF export, Pixelated Tokens, results distribution, CQS dashboard, talent recommendations, data destruction).

### Cube 9 — Target Output Schema (15-Column CSV)

The AI pipeline produces output matching this schema (reference: `Updated_Web_Results_With_Themes_And_Summaries_v03 (1).csv`):

| Column | Type | Description |
|--------|------|-------------|
| Q_Number | INTEGER | Question identifier / order index |
| Question | TEXT | The polling question text |
| User | VARCHAR | User identifier (participant_id or anon hash) |
| Detailed_Results | TEXT | Raw response text in original language |
| 333_Summary | TEXT | ~333-word summary (translated to English if needed) |
| 111_Summary | TEXT | ~111-word summary |
| 33_Summary | TEXT | ~33-word summary |
| Theme01 | TEXT | Primary classification: Risk & Concerns / Supporting Comments / Neutral Comments |
| Theme01_Confidence | VARCHAR | Confidence % (< 65% -> reclassify as Neutral) |
| Theme2_9 | TEXT | Sub-theme from 9-theme reduced set |
| Theme2_9_Confidence | VARCHAR | Confidence % |
| Theme2_6 | TEXT | Sub-theme from 6-theme reduced set |
| Theme2_6_Confidence | VARCHAR | Confidence % |
| Theme2_3 | TEXT | Sub-theme from 3-theme reduced set |
| Theme2_3_Confidence | VARCHAR | Confidence % |

### Cube 9 — Traceability

- Scoping: via `session_id` (see Shared Core -- Cross-Cutting Scoping Inheritance)
- `talent_recommendations` directly reference `scoping_id` and `scoping_type` for project-level talent matching
- `execution_separation` enforced per `scoping_id` -- ideation team members automatically flagged as ineligible in talent recommendations
- Pixelated Token images encode scoping context (Project ID) in pixel data for external verifiability
- Results distribution audited: who received, when, via what method -- full chain from opt-in to delivery
- Export records link to `requested_by` user for accountability

### Cube 9 — Files

| File | Lines | Purpose |
|------|-------|---------|
| `backend/app/cubes/cube9_reports/service.py` | 135 | CSV export (15-column schema from PostgreSQL: ResponseMeta + ResponseSummary) |
| `backend/app/cubes/cube9_reports/router.py` | 38 | 2 API endpoints (CSV export, analytics stub) |
| `backend/app/cubes/cube9_reports/exporters/__init__.py` | - | Exporters package (scaffolded, ready for CSV/PDF exporter modules) |

### Cube 9 — Downstream/Upstream Dependencies

| Direction | Cube | Dependency |
|-----------|------|------------|
| **Upstream (receives from)** | Cube 1 (Session) | Session config, participant records, results opt-in flags |
| **Upstream (receives from)** | Cube 2 (Text) | Text responses with clean_text and response_hash |
| **Upstream (receives from)** | Cube 3 (Voice) | Voice transcripts with STT metadata |
| **Upstream (receives from)** | Cube 4 (Collector) | Aggregated response set with language tags |
| **Upstream (receives from)** | Cube 5 (Gateway) | Time entries, pipeline status |
| **Upstream (receives from)** | Cube 6 (AI) | Themes, summaries (333/111/33), CQS scores |
| **Upstream (receives from)** | Cube 7 (Ranking) | Aggregated rankings, governance overrides |
| **Upstream (receives from)** | Cube 8 (Tokens) | Token ledger, payment status, talent profiles, execution separation |
| **Downstream (sends to)** | Frontend | Export files, dashboards, analytics, reward announcements |
| **Downstream (sends to)** | Cube 10 (Simulation) | Replay datasets, metric baselines for simulation comparison |
| **Downstream (sends to)** | External (User) | Pixelated Token images (delivered then data destroyed) |

---

## Cross-Cube Integration: Cubes 7-8-9 Pipeline

The three cubes in positions (1,1,1), (1,1,2), and (1,1,3) form the final stage of the Level 1 spiral -- the **Ranking -> Tokens -> Reports** pipeline:

```
Cube 6 (AI Themes)
       |
       v
Cube 7 (Ranking) ---> #1 Theme2 ID ---> Cube 5 (Gateway)
       |                                       |
       |                                       v
       |                              Cube 6 (CQS Scoring)
       |                                       |
       v                                       v
Cube 8 (Tokens) <--- CQS Winner --- Cube 5 (Gateway)
       |
       v
Cube 9 (Reports) ---> CSV/PDF/Pixelated Tokens ---> User
```

### Pipeline Flow

1. **Cube 7:** Users rank themes at Moderator-selected level (theme2_9/6/3). System aggregates deterministically. Identifies #1 Theme2.
2. **Cube 5:** Receives ranking complete event. Fires CQS scoring trigger with #1 Theme2 ID to Cube 6.
3. **Cube 6:** Scores ONLY responses in #1 Theme2 with >95% confidence. Returns CQS winner to Cube 5.
4. **Cube 5:** Fires reward payout trigger to Cube 8 with winner participant_id + CQS score.
5. **Cube 8:** Disburses reward via Stripe. Creates ledger entries. Updates talent profiles.
6. **Cube 9:** Generates exports (CSV/PDF). Distributes results to eligible participants. Creates Pixelated Tokens. Announces reward winner. Destroys token data post-delivery.

### Shared Scoping

All three cubes inherit scoping context from `sessions.scoping_type` + `sessions.scoping_id` via `session_id`. This enables:
- Filtering rankings/tokens/reports by Project, Specification, or Product Differentiator
- Cross-session analytics within the same scoping context
- Talent recommendations scoped to specific projects
- Execution separation enforcement per scoping boundary

---

## SSSES Plan — Cubes 7–9: Rank → Reward → Report

> **Scope:** Full pipeline from ranking (CRS-11→13, 16-17, 22 / Cube 7) through token management (CRS-18-19, 24-25, 32-35 / Cube 8) to export and analytics (CRS-14, 19-21 / Cube 9).
> **Dependency:** Cubes 7-9 cannot reach 100/100 until Cubes 1-6 pipeline is complete — specifically Task C5-4 (Cube 6→7 trigger chain) and Phase B verification (Task B1).

### SSSES Scores — Current State (2026-03-30)

> Evidence-based assessment from code review. Cube 7 is scaffolded (stubs only). Cube 8 has 3/14 functions + 19 tests. Cube 9 has 1/14 functions + 0 tests.

| Cube | Security | Stability | Scalability | Efficiency | Succinctness | Overall |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **7 Ranking** | 20 | 10 | 15 | 15 | 50 | **22** |
| **8 Tokens** | 45 | 40 | 35 | 45 | 60 | **45** |
| **9 Reports** | 30 | 15 | 20 | 25 | 55 | **29** |

---

### SSSES Audit (2026-03-30) — Per-Cube Findings

#### Cube 7 — Prioritization & Voting (SCAFFOLDED)

| Pillar | Score | Evidence |
|--------|:---:|---|
| Security | 20 | No auth on ranking endpoints (stubs return `NotImplementedError`). No anti-sybil detection. No RBAC on override endpoint. Governance override endpoint does not exist yet. |
| Stability | 10 | Zero functions implemented. Zero tests. All 8 functions are stubs. No ranking aggregation logic exists. `emit_ranking_complete()` not wired — Cube 5 never receives ranking result. |
| Scalability | 15 | Data tables (`user_rankings`, `aggregated_rankings`, `governance_overrides`) are well-defined with correct indexes. No code to test at scale. |
| Efficiency | 15 | Schema design is correct (Borda count fields, sort_order, replay_hash). No implementation to measure performance. |
| Succinctness | 50 | Clean stub structure. Router has 3 endpoints with clear `NotImplementedError` responses. Schemas and models are well-typed. Good foundation for implementation. |

#### Cube 8 — Token Reward Calculator (PARTIAL)

| Pillar | Score | Evidence |
|--------|:---:|---|
| Security | 45 | `file_dispute()` implemented with validation. `get_jurisdiction_rate()` uses hardcoded `hi_rates.py` (no injection risk). Missing: RBAC on token endpoints, governance weight damping, anti-manipulation detection. |
| Stability | 40 | 19 tests pass. `get_user_balance()` and `file_dispute()` are stable. Missing: `transition_lifecycle_state()` (partial), `resolve_dispute()`, all payment functions, reward disbursement, talent profiles. 11/14 functions not implemented. |
| Scalability | 35 | 59-jurisdiction rate table is O(1) lookup. Token ledger is append-only (no UPDATE contention). Missing: batch token operations, WebSocket push for token updates. |
| Efficiency | 45 | `calculate_session_tokens()` is fast (pure math + dict lookup, in Cube 5). Ledger writes are single inserts. Missing: batch ledger writes for bulk session close. |
| Succinctness | 60 | 98-line service is clean. 72-line router. 241 lines of tests. Good structure. Missing functions inflate the gap between spec (14 functions) and implementation (3). |

#### Cube 9 — Reports, Export & Dashboards (PARTIAL)

| Pillar | Score | Evidence |
|--------|:---:|---|
| Security | 30 | CSV export has no auth gate — any user with session_id can download. No results distribution gating (paid + Lead-exempt). No data destruction. Pixelated Token encoding not implemented. |
| Stability | 15 | `generate_csv_export()` works but has 0 dedicated tests. No PDF. No Pixelated Tokens. No analytics dashboard. No CQS dashboard. 1/14 functions implemented. |
| Scalability | 20 | CSV export untested at scale (5000+ responses). No streaming/chunked export. PDF generation not implemented — will be CPU-heavy at scale. |
| Efficiency | 25 | CSV function queries PostgreSQL per export — no caching. Export re-generates on every request. |
| Succinctness | 55 | 135-line service. 38-line router. Clean structure. Missing functions create large gap: 13/14 functions not implemented. |

---

### Gap Analysis — Cubes 7–9

#### GAP C7-1 — All Ranking Logic Missing *(Stability −60)*
**Root cause:** `submit_user_ranking()`, `aggregate_rankings()`, `identify_top_theme2()` are all stubs returning `NotImplementedError`. Zero ranking functionality exists.
**Impact:** After themes are ready (Cube 6 Phase B), there is no way for participants to rank them. The pipeline stops.
**Fix:** Implement core ranking: `submit_user_ranking()` (validate + store), `aggregate_rankings()` (Borda count, seeded), `identify_top_theme2()` (top-voted cluster).

#### GAP C7-2 — Ranking Complete Event Not Wired *(Stability −15)*
**Root cause:** `emit_ranking_complete()` does not exist. After aggregation, Cube 5 is never notified. CQS scoring trigger (Cube 6) never fires.
**Impact:** The pipeline chain Cube 7 → Cube 5 → Cube 6 (CQS) → Cube 8 (reward) is completely broken.
**Fix:** Implement `emit_ranking_complete()` → calls Cube 5 `trigger_cqs_scoring()` with `top_theme2_id`.

#### GAP C7-3 — No Anti-Sybil on Voting *(Security −30)*
**Root cause:** `detect_voting_anomalies()` not implemented. No defense against coordinated block voting, rapid-fire submissions, or identical rankings from multiple accounts.
**Fix:** Implement anomaly detection: flag identical ranking patterns, enforce minimum time between votes, rate-limit per participant.

#### GAP C8-1 — Payment Processing Not Implemented *(Stability −20)*
**Root cause:** `process_moderator_fee()`, `process_cost_split_payment()`, `disburse_reward()` are all stubs. No Stripe integration. CQS winner cannot receive reward.
**Fix:** Implement Stripe checkout flow (Moderator fee → cost split → reward payout). Gate on MVP phase (MVP1 = Moderator pays only).

#### GAP C8-2 — Token Lifecycle Transitions Incomplete *(Stability −15)*
**Root cause:** `transition_lifecycle_state()` is partial. Valid transitions (simulated→pending→approved→finalized→reversed) not fully enforced. No reversed token negative entry logic.
**Fix:** Complete state machine with validation. Implement reversed = negative ledger entry (no deletions).

#### GAP C8-3 — Talent Profile + Execution Separation Missing *(Stability −10)*
**Root cause:** `update_talent_profile()`, `recommend_talent()`, `check_execution_separation()`, `log_execution_separation()` — all 4 not implemented. Ideation/execution separation not enforced.
**Fix:** Implement all 4 functions. Wire `log_execution_separation()` call from session close. MVP3 scope.

#### GAP C9-1 — CSV Export Has No Auth Gate *(Security −20)*
**Root cause:** `GET /api/v1/sessions/{id}/export/csv` endpoint does not check if requesting user is Moderator, paid participant, or Lead. Any authenticated user can export.
**Fix:** Add auth gate: Moderator always; Lead/Developer always; Participant only if `results_opt_in = True` AND (`payment_status = 'paid'` OR `cost_splitting_enabled = False`).

#### GAP C9-2 — Zero Dedicated Tests *(Stability −15)*
**Root cause:** CSV export function works but has 0 tests verifying 15-column schema, edge cases (empty session, 0 summaries, 0 themes), or performance.
**Fix:** Add test suite: schema validation, empty session, mixed text+voice, 15-column completeness, >1000 response performance.

#### GAP C9-3 — Results Distribution Not Implemented *(Stability −15)*
**Root cause:** `distribute_results()` not implemented. Eligible participants never receive results. No notification of session completion.
**Fix:** Implement results distribution with gating: check `results_opt_in`, `payment_status`, Lead exemption. Create `results_distribution` records.

---

### Upstream Dependencies — What Cubes 7–9 Need from Cubes 1–6

| Dependency | Source | Cube 7-9 Impact | Status |
|---|---|---|---|
| **C5-4** Cube 6→7 trigger chain | Cube 5 | Cube 7 cannot start ranking until Phase B trigger fires | **NOT WIRED** |
| **B4** `themes_ready` broadcast | Cube 6 | Ranking UI cannot display themes until dashboard receives event | **NOT IMPLEMENTED** |
| **B1** Phase B E2E verification | Cube 6 | Theme records must exist in Postgres for Cube 7 to query | **NOT VERIFIED** |
| **CQS scores** from Cube 6 | Cube 6 | Cube 8 reward disbursement depends on CQS winner ID | **NOT IMPLEMENTED** (CRS-14.01/14.02 in CUBES_4-6.md) |
| **Time tracking** from Cube 5 | Cube 5 | Token calculation depends on Cube 5 `stop_time_tracking()` ledger entries | **IMPLEMENTED** |
| **Core broadcast infra** C6-7 | Cube 6 | Live ranking updates (CRS-16/17) need `supabase_broadcast.py` | **EXISTS** (97 lines, httpx) — A5 (`summary_ready`) WIRED; B4/Cube 7 not wired |

---

### Projected SSSES Scores After All Tasks (Cubes 7–9)

> **Conditional:** Projected scores assume all Cubes 1-6 prerequisites are complete (C5-4, B1, B4, C6-7).

| Cube | Pillar | Before | After | Key Tasks |
|------|--------|:---:|:---:|---|
| **7 Ranking** | Security | 20 | 90 | C7-3 (anti-sybil), CRS-22.01–22.02 |
| | Stability | 10 | 95 | C7-1 (core ranking), C7-2 (emit event), full test suite |
| | Scalability | 15 | 85 | Borda count optimized for 100K participants |
| | Efficiency | 15 | 90 | Aggregation <3s for 100K; indexed queries |
| | Succinctness | 50 | 90 | 8 functions implemented, clean single-responsibility |
| | **Overall** | **22** | **90** | |
| **8 Tokens** | Security | 45 | 90 | CRS-24.02 (RBAC), CRS-24.03 (anti-manipulation) |
| | Stability | 40 | 90 | C8-1 (payments), C8-2 (lifecycle), full test suite |
| | Scalability | 35 | 85 | Batch ledger writes, WebSocket push (CRS-18.01) |
| | Efficiency | 45 | 90 | Batch operations, cached balance queries |
| | Succinctness | 60 | 90 | 14 functions implemented, clean separation |
| | **Overall** | **45** | **89** | |
| **9 Reports** | Security | 30 | 90 | C9-1 (auth gate), CRS-14.03 (data destruction) |
| | Stability | 15 | 90 | C9-2 (tests), C9-3 (distribution), PDF, Pixelated Tokens |
| | Scalability | 20 | 85 | Streaming CSV, chunked PDF |
| | Efficiency | 25 | 85 | Cached exports, incremental regeneration |
| | Succinctness | 55 | 90 | 14 functions implemented, clean separation |
| | **Overall** | **29** | **88** | |

---

## Final SSSES Gap Analysis + Spiral Test — Cubes 1–9 (2026-03-30)

> **Scope:** Full forward spiral (Cube 1→9) and backward spiral (Cube 9→1) assessing all remaining gaps needed to reach production-ready SSSES 100/100. Includes scale architecture for 1M concurrent users with <2s auto-theming and <0.5s per-response summarization targets.

### Current SSSES Scores — All Cubes

| Cube | Security | Stability | Scalability | Efficiency | Succinctness | Overall | Status |
|------|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 1 Session | 100 | 100 | 100 | 100 | 100 | **100** | Production-ready |
| 2 Text | 75 | 40 | 50 | 55 | 65 | **57** | Phase A gaps |
| 3 Voice | 70 | 40 | 50 | 55 | 65 | **56** | Phase A gaps |
| 4 Collector | 70 | 65 | 75 | 70 | 80 | **72** | Storage error handling |
| 5 Gateway | 80 | 75 | 80 | 85 | 90 | **82** | Timeout + chain gaps |
| 6 AI Pipeline | 70 | 40 | 55 | 55 | 70 | **58** | Broadcast + scale gaps |
| 7 Ranking | 20 | 10 | 15 | 15 | 50 | **22** | Scaffolded only |
| 8 Tokens | 45 | 40 | 35 | 45 | 60 | **45** | Partial |
| 9 Reports | 30 | 15 | 20 | 25 | 55 | **29** | Partial |
| **System** | — | — | — | — | — | **58 avg** | |

---

### Spiral Test — Forward (Cube 1 → 9)

```
Cube 1 ──[session create + join]──► Cube 2 ──[text submit]──► Cube 3 ──[voice submit]──►
  │                                    │                          │
  │ ✓ WIRED: state machine,           │ ✓ WIRED: PII pipeline    │ ✓ WIRED: STT → Cube 2
  │   QR, join, presence              │ ✗ GAP: summary_33 not    │ ✗ GAP: voice path PII
  │ ✓ 100/100 SSSES                   │   in broadcast payload   │   gate unverified (A7)
  │                                    │ ✗ GAP: Phase A fire-     │
  │                                    │   and-forget silent (A2) │
  ▼                                    ▼                          ▼
Cube 4 ──[aggregate responses]──► Cube 5 ──[orchestrate]──► Cube 6 ──[Phase A + B]──►
  │                                    │                          │
  │ ✓ WIRED: dual storage             │ ✓ WIRED: polling→ranking │ ◐ C6-7: broadcast.py EXISTS
  │ ✗ GAP: storage no error            │   triggers Phase B       │   A5 WIRED; B4 not yet
  │   handling (C4-3)                  │ ✗ GAP: no pipeline       │ ✗ GAP: 3 seq AI calls (A1)
  │ ✗ GAP: M2/M3 not implemented      │   timeout (C5-3)         │ ✗ GAP: no concurrency cap
  │                                    │ ✗ GAP: Cube 6→7 chain   │   (A3)
  │                                    │   NOT WIRED (C5-4)       │ ✓ A5: summary_ready WIRED
  │                                    │                          │ ✗ GAP: B4 themes_ready
  ▼                                    ▼                          ▼
Cube 7 ──[rank themes]──► Cube 8 ──[tokens + rewards]──► Cube 9 ──[export + report]──►
  │                          │                               │
  │ ✗ GAP: ALL ranking       │ ✗ GAP: payment not           │ ✗ GAP: CSV no auth gate
  │   logic is stubs (C7-1)  │   implemented (C8-1)          │   (C9-1)
  │ ✗ GAP: ranking_complete  │ ✗ GAP: lifecycle transitions  │ ✗ GAP: 0 tests (C9-2)
  │   event not wired (C7-2) │   incomplete (C8-2)           │ ✗ GAP: results distribution
  │ ✗ GAP: no anti-sybil     │ ✗ GAP: talent + execution     │   not implemented (C9-3)
  │   (C7-3)                 │   separation missing (C8-3)   │
  │                          │                               │
  ▼                          ▼                               ▼
  PIPELINE TERMINATES        PIPELINE TERMINATES             END
```

**Forward Spiral Verdict:** Pipeline is wired Cube 1→2→3→4→5→6 (with gaps). **Chain breaks at Cube 6→7** (C5-4). Cubes 7→8→9 are isolated stubs with no upstream trigger.

---

### Spiral Test — Backward (Cube 9 → 1)

| Link | Direction | What It Needs | Status | Blocking Gap |
|------|-----------|---------------|--------|---|
| 9 → 8 | Reward winner announcement | CQS winner ID + score from Cube 8 | **NOT WIRED** | Cube 8 `disburse_reward()` not implemented |
| 9 → 7 | Ranked themes for export | Final rankings from `aggregated_rankings` table | **NOT WIRED** | Cube 7 `aggregate_rankings()` is stub |
| 9 → 6 | Theme data for CSV/PDF | Theme01 + Theme2_9/6/3 from Postgres `themes` table | **SCHEMA READY** | Phase B must complete first (Task B1) |
| 8 → 7 | CQS trigger with top_theme2_id | Cube 7 `emit_ranking_complete()` → Cube 5 → Cube 6 CQS | **NOT WIRED** | C7-2 + C5-4 |
| 8 → 5 | Time tracking ledger entries | Cube 5 `stop_time_tracking()` creates entries | **WIRED** | Working |
| 7 → 6 | Theme records for ranking UI | Cube 6 Phase B stores themes in Postgres | **SCHEMA READY** | Phase B verification (B1) |
| 7 → 5 | `themes_ready` event to start ranking | Cube 5 should trigger Cube 7 after Phase B | **NOT WIRED** | C5-4 |
| 6 → 5 | Pipeline status updates | `update_pipeline_status()` called from background task | **LOOSELY WIRED** | Error propagation broken (C5-1) |
| 6 → 4 | Response fetch for Phase B | `get_response_set()` from Cube 4 | **WIRED** | PII guard missing (C6-1) |
| 6 → 2/3 | Phase A fire-and-forget | `summarize_single_response()` from Cube 2 submit | **WIRED** | Broadcast IMPLEMENTED (A5), no retry (A2) |
| 5 → 1 | State machine hook | `_transition_and_return()` calls orchestrator | **WIRED** | Tight coupling (tech debt) |

**Backward Spiral Verdict:** Data schemas are ready for Cubes 7→8→9. The primary blockers are: (1) C5-4 (Cube 6→7 chain), (2) C7-1 (ranking implementation), (3) B4 (`themes_ready` broadcast not wired). C6-7 broadcast infrastructure EXISTS and A5 is WIRED.

---

### Scale Architecture — 1M Concurrent Users

#### Target Performance Envelope

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| **Phase A: Summarize** (per response) | **<0.5s** | ~3–5s (3 sequential API calls) | Task A1: single prompt → <0.5s; Task A0: ≤33 words = 0s |
| **Phase B: Auto-theme** (full pipeline) | **<2s** for 1M inputs | Unknown (never tested >28 responses) | Statistical sampling + parallel batch + streaming |
| **Concurrent users** | 1,000,000 stable | ~100 tested (Cube 1 live session) | Horizontal scaling architecture |
| **Vote submission latency** | <200ms | N/A (stubs) | Cube 7 implementation with indexed queries |
| **Live ranking update** | <500ms | N/A (stubs) | Supabase Broadcast (same infra as Cube 1) |

#### Phase A Scale Strategy — <0.5s Summarization

```
Response submitted → Cube 2 PII pipeline (~50ms)
  │
  ▼ [asyncio.create_task — fire-and-forget]
  ├── BR-1: if word_count ≤ 33 → summary_33 = clean_text (0ms, 0 API calls)
  ├── Task A0: short-circuit check
  │
  ├── Task A1: single structured prompt → JSON {summary_333, summary_111, summary_33}
  │     Target: 1 API call, <500ms with gpt-4o-mini / gemini-2.0-flash
  │
  ├── Task A3: asyncio.Semaphore(10) per session → max 10 concurrent Phase A
  │     At 1M users: 100K sessions × 10 concurrent = 1M parallel Phase A tasks
  │     Worker fleet: horizontal scale via Kubernetes pod autoscaling
  │
  └── Task A5: broadcast summary_ready → Moderator dashboard (<100ms after store)
```

**Key insight:** Phase A is embarrassingly parallel — each response is independent. At 1M concurrent users across ~10K sessions, each session has ~100 responses. With Semaphore(10), each session processes 10 at a time. Across 10K sessions on horizontally scaled workers, effective parallelism is 100K+.

#### Phase B Scale Strategy — <2s Auto-Theming for 1M Inputs

```
Moderator clicks Stop Polling → Cube 5 fires run_pipeline()
  │
  ▼ Step 1: Statistical sampling (NEW — not in current code)
  │  For N > 10,000 responses: sample K = min(N, 10,000) responses
  │  Stratified by language_code to preserve distribution
  │  Remaining N-K responses assigned to themes via embedding cosine (no LLM)
  │
  ▼ Step 2: Classify Theme01 — 1 batch API call (~200ms)
  │  K responses classified as Risk/Supporting/Neutral in single batch
  │  <65% confidence → reclassify as Neutral (monolith parity)
  │
  ▼ Step 3: Marble sample — CPU only (~10ms)
  │  K/10 groups of 10, deterministic seed, parallel across 3 categories
  │
  ▼ Step 4: Generate themes — ceil(K/10) concurrent API calls (~500ms)
  │  10+ asyncio agents per category, all 3 categories parallel
  │  For K=10,000: 1,000 groups → 1,000 concurrent calls
  │  With Semaphore(50): 20 batches × ~25ms each = ~500ms
  │
  ▼ Step 5: Reduce themes — 9 API calls (~300ms)
  │  all→9→6→3 per category, 3 categories parallel = 3 sequential × 3 parallel
  │
  ▼ Step 6: Assign themes — embedding cosine (1 API call + math)
  │  For ALL N responses (not just sample): embed all summary_33 + theme labels
  │  1 batch embedding call (~300ms for 1M short texts via batch API)
  │  Cosine similarity is pure NumPy — <100ms for 1M × 27 comparisons
  │
  ▼ Step 7: Store results — batch PostgreSQL (~200ms)
  │
  Total: ~200 + 10 + 500 + 300 + 300 + 100 + 200 = ~1,610ms ≈ <2s ✓
```

**Critical scale decisions:**
1. **Statistical sampling (Step 1):** Theme generation uses a representative sample, not all N. Themes are stable at K=10,000 (law of large numbers). Assignment uses ALL N via fast embedding cosine.
2. **Embedding assignment over LLM (Step 6):** Embedding cosine is O(N × T) where T=27 themes — pure NumPy, no API latency per response. LLM assignment would be 3N API calls (3 levels × N responses) — infeasible at 1M.
3. **Batch embedding API:** OpenAI/Gemini batch endpoints accept 2048+ texts per call. 1M summary_33 texts (each ~33 words) = ~500 batch calls at 2000/batch = ~300ms parallel.
4. **Pre-computed embeddings:** During Phase A, embed each `summary_33` as it's generated and cache in the `response_summaries` table (PostgreSQL). Phase B Step 6 only embeds theme labels (27 texts) and reads cached response embeddings.

#### Voting Architecture — 3/6/9 Theme Selection

**Monolith parity (from eXeL-AI_Polling_v04.2.py):**
- Themes generated per Theme01 category: Risk, Supporting, Neutral
- Each category independently reduced: all → 9 → 6 → 3
- Moderator selects voting level at session creation: `session.theme2_voting_level` (3, 6, or 9)

**Voting specification:**

| Category | Voting Priority | Themes Available | Moderator Action |
|----------|:---:|:---:|---|
| **Risk & Concerns** | **Primary** | 3, 6, or 9 (Moderator selects) | Participants rank Risk themes first |
| **Supporting Comments** | **Secondary** | 3, 6, or 9 (same level as Risk) | Participants rank Supporting themes second |
| **Neutral Comments** | **Deprioritized** | Available but not ranked by default | Neutral themes shown for context but excluded from ranking unless Moderator explicitly enables. Neutral typically contains random/throwaway comments that don't belong to Risk or Supporting. |

**Voting flow:**
1. Phase B completes → `themes_ready` broadcast (Task B4) → Dashboard transitions to ranking view
2. Ranking view shows Theme2 cards grouped by category (Risk first, Supporting second)
3. Participant assigns priority order within each category (drag-drop desktop / tap-reorder mobile)
4. `submit_user_ranking()` validates theme IDs against `session.theme2_voting_level`
5. `aggregate_rankings()` runs Borda count per category independently
6. `identify_top_theme2()` finds #1 across all categories → triggers CQS
7. `emit_ranking_complete()` → Cube 5 → Cube 6 CQS → Cube 8 reward

**Neutral deprioritization rule:**
- Confidence < 65% → reclassified as Neutral (monolith parity, already implemented in Phase B)
- Neutral themes displayed in "Other Comments" section below Risk + Supporting
- Neutral themes NOT included in default ranking unless Moderator enables `session.include_neutral_ranking = True`
- CQS scoring never applies to Neutral-classified responses (only #1 Theme2 from Risk or Supporting)

---

### Remaining Gaps — Priority Order for 100/100

#### PHASE 1 — Infrastructure (unblocks everything)

| # | Task | Cube | SSSES Impact | Status |
|---|------|------|---|---|
| 1 | **C6-7** ~~Create~~ Wire `core/supabase_broadcast.py` to A5/B4 calls | 6 | Stability +20 | EXISTS — wiring pending |
| 2 | **C6-8/A4** Add `summary_33` to `ResponseRead` schema | 6 | Efficiency +10 | BLOCKER |
| 3 | **C6-1** PII guard in `run_pipeline()` | 6 | Security +15 | |
| 4 | **A7** PII log assertion for text + voice paths | 2, 3 | Security +25 | |
| 5 | **C4-4** Fix anonymization collision | 4 | Security +5 | |

#### PHASE 2 — Live Feed (Moderator sees responses + summaries)

| # | Task | Cube | SSSES Impact | Status |
|---|------|------|---|---|
| 6 | **A0** Short-circuit ≤33 words | 6 | Efficiency +5 | |
| 7 | **A1** Single-prompt summarization (<0.5s target) | 6 | Efficiency +20 | |
| 8 | **A2** Retry with exponential backoff | 6 | Stability +25 | |
| 9 | **A5** Backend Supabase broadcast (`summary_ready`) | 6 | Stability +20 | |
| 10 | **A6** Dashboard `summary_ready` listener | 1 | Stability +10 | |

#### PHASE 3 — Resilience + Scale

| # | Task | Cube | SSSES Impact | Status |
|---|------|------|---|---|
| 11 | **A3** Per-session Semaphore(10) | 6 | Scalability +30 | |
| 12 | **C5-3** Pipeline timeout (300s) | 5 | Scalability +15 | |
| 13 | **C6-4** AI API call timeout (30s) | 6 | Scalability +15 | |
| 14 | **C5-1** Pipeline error propagation | 5 | Stability +15 | |
| 15 | **C5-2** Moderator-scoped route guard | 5 | Security +10 | |
| 16 | **C4-3** PostgreSQL storage error handling | 4 | Stability +10 | |

#### PHASE 4 — Phase B Theming + Downstream Chain

| # | Task | Cube | SSSES Impact | Status |
|---|------|------|---|---|
| 17 | **B2** Monolith parity check | 6 | Stability +10 | |
| 18 | **B1** Phase B E2E verification | 6 | Stability +20 | |
| 19 | **B3** Parallel batch verify at scale | 6 | Scalability +20 | |
| 20 | **C6-5** Partial failure handling | 6 | Stability +10 | |
| 21 | **C6-6** Fix index mismatch | 6 | Stability +5 | |
| 22 | **B4** `themes_ready` broadcast | 6 | Stability +10 | |
| 23 | **B5** Phase B recovery + status endpoint | 6 | Stability +15 | |
| 24 | **C5-4** Wire Cube 6→7 trigger chain | 5 | Stability +10 | |

#### PHASE 5 — Ranking (Cube 7)

| # | Task | Cube | SSSES Impact | Status |
|---|------|------|---|---|
| 25 | **C7-1** Implement core ranking (submit + aggregate + identify_top) | 7 | Stability +60 | |
| 26 | **C7-2** Wire `emit_ranking_complete()` → Cube 5 CQS trigger | 7 | Stability +15 | |
| 27 | **C7-3** Anti-sybil voting anomaly detection | 7 | Security +30 | |
| 28 | Ranking UI: 3/6/9 theme cards, Risk first, Supporting second, Neutral deprioritized | 7 | Stability +10 | |

#### PHASE 6 — Tokens + Rewards (Cube 8)

| # | Task | Cube | SSSES Impact | Status |
|---|------|------|---|---|
| 29 | **C8-1** Stripe payment integration | 8 | Stability +20 | |
| 30 | **C8-2** Complete lifecycle state machine | 8 | Stability +15 | |
| 31 | **C8-3** Talent profiles + execution separation | 8 | Stability +10 | |

#### PHASE 7 — Reports + Export (Cube 9)

| # | Task | Cube | SSSES Impact | Status |
|---|------|------|---|---|
| 32 | **C9-1** CSV export auth gate | 9 | Security +20 | |
| 33 | **C9-2** Test suite (15-column schema, edge cases, performance) | 9 | Stability +15 | |
| 34 | **C9-3** Results distribution with gating | 9 | Stability +15 | |

#### PHASE 8 — Scale (1M Target)

| # | Task | Cube | SSSES Impact | Status |
|---|------|------|---|---|
| 35 | **S1** Statistical sampling in Phase B (K=10,000 cap) | 6 | Scalability +20 | NEW |
| 36 | **S2** Pre-compute embeddings during Phase A (cache in response_summaries table) | 6 | Efficiency +15 | NEW |
| 37 | **S3** Batch embedding API for Phase B assignment | 6 | Scalability +15 | NEW |
| 38 | **S4** Streaming CSV export for >100K responses | 9 | Scalability +10 | NEW |
| 39 | **S5** Kubernetes HPA config for embedding worker fleet | Infra | Scalability +10 | NEW |
| 40 | **S6** Redis-backed global Semaphore (cross-worker) | 6 | Scalability +10 | NEW |

---

### API Call Budget — At Scale

| Scale | Phase A (per response) | Phase B (total) | Total API Calls |
|-------|:---:|:---:|:---:|
| **100 responses** | 100 (1 call each after A1) | ~23 | **123** |
| **1,000 responses** | 1,000 | ~113 | **1,113** |
| **10,000 responses** | 10,000 | ~1,013 | **11,013** |
| **100,000 responses** | 100,000 | ~1,013 (sampled at K=10K) | **101,013** |
| **1,000,000 responses** | 1,000,000 | ~1,013 (sampled at K=10K) | **1,001,013** |

> Phase A call count = N (1 per response after Task A1 consolidation; minus short-circuit A0 responses).
> Phase B call count = ceil(K/10) + 9 (reduction) + 1 (batch embed) + 1 (classify) ≈ K/10 + 11.
> At K=10,000 sample cap: Phase B = 1,000 + 11 + 1 + 1 = **1,013 calls**.

---

### Projected SSSES Scores — All Cubes After All Phases

| Cube | Before | After | Delta |
|------|:---:|:---:|:---:|
| 1 Session | 100 | 100 | 0 |
| 2 Text | 57 | 100 | +43 |
| 3 Voice | 56 | 100 | +44 |
| 4 Collector | 72 | 90 | +18 |
| 5 Gateway | 82 | 95 | +13 |
| 6 AI Pipeline | 58 | 98 | +40 |
| 7 Ranking | 22 | 92 | +70 |
| 8 Tokens | 45 | 90 | +45 |
| 9 Reports | 29 | 90 | +61 |
| **System Average** | **58** | **95** | **+37** |

> Full 100/100 across all cubes requires completing all 40 tasks (Phases 1-8). Cubes 4 and 7-9 max at ~90 because some MVP3 features (deep dives, talent profiles, Pixelated Tokens) are deferred.
