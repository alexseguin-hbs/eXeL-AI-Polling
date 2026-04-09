# Cube 10 — Simulation Engine: Self-Evolving Governance Platform

## Plan Version: N=7 (2026-04-09)

> **Vision:** The SoI Trinity made manifest in code itself.
>
> ```
>              A.I. (◬)          S.I. (♡)          H.I. (웃)
>            ╔═══════╗         ╔═══════╗         ╔═══════╗
>            ║ CODE  ║         ║ VOTE  ║         ║ BUILD ║
>            ╚═══════╝         ╚═══════╝         ╚═══════╝
>           AI generates      Community          Humans craft
>          improvements       decides what       solutions with
>          from feedback      ships to prod      domain expertise
>                 ╲              │              ╱
>                   ╲            │            ╱
>                     ╲          │          ╱
>                       ◬───────♡───────웃
>                      THE SELF-EVOLVING PLATFORM
>                  "Where Shared Intention moves
>                   at the Speed of Thought"
> ```
>
> A live production system where **AI and humans compete** to improve the platform itself. Users submit code updates, the community votes with quadratic-weighted governance tokens, and winning implementations are **hot-swapped into the running system** — all governed by the same SoI Trinity token economics that powers polling.
>
> **This is the tool that unlocks 2525:** real-time application of tokenomics and contributions that rewards those who bolt on functionality to an existing tool base, working as an individual or team for payment. Every Cube is a neural pathway in a self-healing, self-evolving conscious system.

---

## Architecture Overview

```
                    ●─────●─────●
                    │ SIM │ RPL │ CHK │
                    ●─────●─────●
                    │ MTR │ FB  │ VER │
                    ●─────●─────●
                    │ BCK │ TRG │ APR │
                    ●─────●─────●

SIM = Simulation Runner        RPL = Replay Dataset
CHK = Checkout / Checkin       MTR = Metrics Compare
FB  = Feedback Loop (CENTER)   VER = Version Control
BCK = Backlog (from votes)     TRG = Triage (AI-assisted)
APR = ◬ ♡ 웃 Team Approval Gate
```

---

## The Core Loop: Unplug → Replace → Test → Vote → Deploy

### Phase 1: UNPLUG (Cube Checkout)
```
Developer/AI selects a Cube (1-9) to improve
    ↓
System creates isolated sandbox:
  - Git worktree branch: cube{N}/submission/{user_id}/{timestamp}
  - Snapshot of current Cube service.py + tests
  - Frozen input/output contract (function signatures locked)
  - Current N=5 baseline metrics captured
```

### Phase 2: REPLACE (Code Submission)
```
Developer writes replacement code for specific functions
    OR
AI generates improvement based on:
  - SSSES gap analysis
  - Performance profiling data
  - Community feedback themes
  - Token-weighted priority from backlog votes
    ↓
Submission must:
  - Pass ALL existing tests (backward compatible)
  - Maintain identical function signatures
  - Include new tests for any new behavior
  - Not reduce test coverage
```

### Phase 3: TEST (Automated Verification)
```
Simulation Runner executes:
  1. Existing test suite against new code
  2. Replay dataset (v04.1_5000.csv) comparison
  3. N=5 performance baseline measurement
  4. SSSES score recalculation
  5. Scale test (1M voter simulation for Cube 7)
    ↓
Metrics comparison:
  - Tests: must pass ≥ 100% of current
  - Duration: must not exceed 120% of current
  - SSSES: must not decrease on any pillar
  - Determinism: replay hash must match for identical inputs
```

### Phase 4: VOTE (Community Governance)
```
If automated tests pass:
  - Submission published to all session participants
  - Side-by-side comparison: current vs proposed metrics
  - Token-weighted voting opens (quadratic normalization)
  - Voting window: configurable (default 24h)
    ↓
Threshold: 66.6% supermajority required
  - Votes weighted by SoI Trinity tokens (♡ × quadratic)
  - Anti-sybil detection active (Cube 7 anomaly engine)
  - Minimum quorum: 10% of active token holders
```

### Phase 5: DEPLOY (Admin Approval Gate)
```
If 66.6% vote YES:
  - Submission queued for ADMIN review
  - Admin sees: diff, metrics delta, vote breakdown, SSSES impact
  - Admin can: APPROVE (deploy) or REVERT (keep current)
    ↓
On APPROVE:
  - Hot-swap: new code replaces old in running system
  - Old version preserved as rollback point
  - Token reward disbursed to contributor(s)
  - Announcement broadcast to all participants
    ↓
On REVERT:
  - Admin provides justification (mandatory, min 10 chars)
  - Community notified of revert + reason
  - Contributor tokens NOT penalized (good-faith protection)
```

---

## Feedback Loop (FB — Center of Cube 10 Grid)

The Feedback Loop collects from EVERY screen in the app:

| Screen | CRS | Feedback Source |
|--------|-----|----------------|
| Landing | CRS-01 | First impression, UX friction |
| Join | CRS-02 | Join flow, QR scan, code entry |
| Polling | CRS-07 | Response submission, voice input |
| Dashboard | CRS-06 | Moderator controls, live feed |
| Results | CRS-14 | Theme visualization, ranking |
| Ranking | CRS-11 | DnD experience, voting clarity |
| Settings | CRS-01 | Theme picker, language, config |
| SIM | CRS-25 | Simulation experience |

### Feedback Auto-Categorization
```python
class FeedbackEntry:
    cube_id: int          # 1-10 (which cube the user is on)
    crs_id: str           # CRS-## (parent requirement)
    sub_crs_id: str       # CRS-##.## (specific sub-requirement)
    feedback_type: str     # "CRS" (maps to existing) or "DI" (Design Idea — new)
    text: str             # User's feedback
    sentiment: float      # AI-detected sentiment (-1 to 1)
    priority: int         # AI-triaged priority (1-5)
    submitted_by: str     # User ID or anon_hash
    submitted_at: datetime
```

---

## Token Economics for Code Contributions

### Earning Tokens
| Action | ♡ (SI) | 웃 (HI) | ◬ (AI) |
|--------|:------:|:-------:|:------:|
| Submit code improvement | 5 | rate × hours | 25 |
| Code passes all tests | 3 | 0 | 15 |
| Community votes YES (66.6%+) | 10 | 0 | 50 |
| Admin APPROVES deployment | 20 | rate × review_hours | 100 |
| Code survives 7 days in production | 5 | 0 | 25 |

### AI vs HI Competition
```
When a Cube has an open improvement task:
  - Both AI and HI can submit solutions simultaneously
  - Same test suite, same metrics comparison, same voting threshold
  - Community votes on WHICH implementation is better
  - If AI wins: ◬ tokens awarded to the AI training pipeline
  - If HI wins: 웃 tokens awarded to the human developer
  - Winning implementation deployed regardless of source
```

---

## Database Tables (Cube 10)

### `code_submissions`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Submission ID |
| cube_id | INTEGER | Target cube (1-9) |
| function_name | VARCHAR(255) | Function being replaced |
| submitter_id | VARCHAR(255) | User ID or AI agent ID |
| submitter_type | ENUM | "human" / "ai" |
| code_diff | TEXT | Git-style diff of changes |
| branch_name | VARCHAR(255) | Git worktree branch |
| status | ENUM | "pending" / "testing" / "voting" / "approved" / "deployed" / "reverted" |
| created_at | TIMESTAMP | Submission time |

### `submission_metrics`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Metric record ID |
| submission_id | UUID (FK) | Code submission reference |
| tests_passed | INTEGER | Number of tests passed |
| tests_total | INTEGER | Total tests in suite |
| duration_ms | FLOAT | Test suite duration |
| ssses_security | FLOAT | Security score (0-100) |
| ssses_stability | FLOAT | Stability score |
| ssses_scalability | FLOAT | Scalability score |
| ssses_efficiency | FLOAT | Efficiency score |
| ssses_succinctness | FLOAT | Succinctness score |
| replay_hash | VARCHAR(64) | Determinism verification hash |
| baseline_comparison | JSONB | Delta vs current baseline |

### `submission_votes`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Vote ID |
| submission_id | UUID (FK) | Which submission |
| voter_id | VARCHAR(255) | Who voted |
| vote | ENUM | "approve" / "reject" |
| weight | FLOAT | Quadratic-normalized vote weight |
| tokens_staked | FLOAT | ♡ tokens staked for this vote |
| voted_at | TIMESTAMP | Vote timestamp |

### `deployment_log`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Deployment ID |
| submission_id | UUID (FK) | Deployed submission |
| deployed_by | VARCHAR(255) | Admin who approved |
| previous_version_hash | VARCHAR(64) | Git hash before deployment |
| new_version_hash | VARCHAR(64) | Git hash after deployment |
| rollback_available | BOOLEAN | Whether rollback is possible |
| deployed_at | TIMESTAMP | Deployment time |
| reverted_at | TIMESTAMP | If reverted, when |
| revert_reason | TEXT | Admin justification for revert |

### `product_feedback`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Feedback ID |
| cube_id | INTEGER | Which cube (1-10) |
| crs_id | VARCHAR(20) | CRS requirement reference |
| sub_crs_id | VARCHAR(20) | Sub-CRS reference |
| feedback_type | ENUM | "CRS" / "DI" (Design Idea) |
| text | TEXT | Feedback content |
| sentiment | FLOAT | AI-detected sentiment (-1 to 1) |
| priority | INTEGER | AI-triaged priority (1-5) |
| submitted_by | VARCHAR(255) | User ID |
| status | ENUM | "new" / "triaged" / "backlog" / "in_progress" / "resolved" |
| created_at | TIMESTAMP | Submission time |

---

## Code Security Pipeline (N=2 Addition)

Before any submission enters testing, it passes through a security scan:

```
Submission code
    ↓ Stage 1: Static Analysis
    - No hardcoded secrets (API keys, passwords, tokens)
    - No eval()/exec() or dynamic code execution
    - No network calls outside approved endpoints
    - No file system access outside sandbox
    ↓ Stage 2: Dependency Check
    - No new dependencies added without review
    - All imports resolve against existing requirements.txt
    - No version downgrades on security-critical packages
    ↓ Stage 3: Signature Lock
    - Function signatures MUST match current contract
    - Return types MUST match current contract
    - Universal Function Registry enforces I/O compatibility
    ↓ Stage 4: Test Isolation
    - Code runs in sandboxed subprocess (no main process access)
    - 60-second timeout per test suite
    - Memory limit: 512MB per submission
    - Network disabled during test execution
```

## Hot-Swap Mechanism (N=2 Addition)

The hot-swap works because of the Universal Function Registry:

```python
# core/universal.py already maps every function:
UniversalFunction("aggregate_rankings", cube=7, ...)

# Hot-swap replaces the implementation behind the same interface:
# Before: cube7_ranking.service.aggregate_rankings → v1 code
# After:  cube7_ranking.service.aggregate_rankings → v2 code
# Contract (function signature + I/O) NEVER changes

# Rollback: restore v1 code, restart workers
# Zero downtime: new requests hit new code, in-flight complete on old
```

## Lessons from N=1 Forward Sweep (Cubes 1→9)

### Cube 1 → Cube 10 Lesson: State Machine
Session state machine (draft→open→polling→ranking→closed→archived) is the model for submission lifecycle (pending→testing→voting→approved→deployed→reverted).

### Cube 2 → Cube 10 Lesson: Validation Pipeline
Text pipeline (PII + profanity + language detection) applies to code submissions too — scan for secrets, malicious code, license violations.

### Cube 3 → Cube 10 Lesson: Provider Abstraction
Multi-provider pattern (Whisper/Gemini/AWS) maps to multi-AI-agent pattern — different AI models can compete to generate improvements.

### Cube 4 → Cube 10 Lesson: Collection + Presence
Feedback collection from every screen mirrors response collection. Presence tracking shows who's actively reviewing submissions.

### Cube 5 → Cube 10 Lesson: Pipeline Orchestration
Background task pattern (asyncio.create_task with timeout + error handling) is the execution model for running test suites against submissions.

### Cube 6 → Cube 10 Lesson: Marble Method for Feedback
Apply the same Theme01 → marble sample → reduce pattern to FEEDBACK: categorize feedback into Risk/Supporting/Neutral, sample, generate improvement themes, reduce to actionable backlog items.

### Cube 7 → Cube 10 Lesson: Voting at Scale
BordaAccumulator (1M votes in 1.06s) directly powers the submission voting system. Quadratic weights prevent whale manipulation. Anti-sybil prevents coordinated voting.

### Cube 8 → Cube 10 Lesson: Token Rewards
Append-only ledger, lifecycle state machine, velocity caps — all apply to code contribution rewards. CQS scoring evaluates contribution quality.

### Cube 9 → Cube 10 Lesson: Results + Analytics
Submission metrics dashboard mirrors session analytics. CSV export of voting results. CQS leaderboard for top contributors.

---

## Implementation Phases

### Phase A: Feedback Collection (MVP1)
- POST /feedback endpoint (any authenticated user)
- Auto-categorize: cube_id + crs_id + sentiment + priority
- GET /feedback (admin) + GET /feedback/stats (admin)
- Feedback icon on every screen

### Phase B: Submission Pipeline (MVP2)
- Code submission upload (diff format)
- Automated test execution in isolated sandbox
- Metrics comparison against baseline
- SSSES recalculation

### Phase C: Voting + Deployment (MVP3)
- Token-weighted community voting
- 66.6% supermajority threshold
- Admin approval gate with revert capability
- Hot-swap deployment

### Phase D: AI Competition (Future)
- AI agents generate improvements from feedback themes
- Side-by-side AI vs HI comparison
- Community selects winner
- Self-evolving platform

---

## Dependencies on Other Cubes

| Cube | Dependency | Direction |
|------|-----------|-----------|
| 1 | Session state machine pattern | Cube 10 ← Cube 1 |
| 2 | Code validation pipeline (secrets scan) | Cube 10 ← Cube 2 |
| 5 | Background task orchestration | Cube 10 ← Cube 5 |
| 6 | Marble Method for feedback theming | Cube 10 ← Cube 6 |
| 7 | BordaAccumulator for voting | Cube 10 ← Cube 7 |
| 7 | Quadratic weights + anti-sybil | Cube 10 ← Cube 7 |
| 8 | Token ledger for contributor rewards | Cube 10 ← Cube 8 |
| 8 | Lifecycle state machine for submissions | Cube 10 ← Cube 8 |
| 9 | Metrics dashboard + analytics | Cube 10 ← Cube 9 |
| SDK | Universal function registry for hot-swap | Cube 10 ← SDK |

---

## Changelog

| N | Direction | Additions |
|---|-----------|-----------|
| 1 | Forward 1→9 | Initial architecture: 5-phase lifecycle, 4 tables, token economics, feedback loop |
| 1 | Backward 9→1 | Verified all 9 cubes expose required functions for Cube 10 integration |
| 2 | Forward 1→9 | Code security pipeline (4-stage static analysis), hot-swap mechanism via Universal Function Registry |
| 2 | Backward 9→1 | Cube 10 service scaffolded: feedback, submissions, sandbox tests, metrics comparison, vote tallying (26 tests) |
| 3 | Forward 1→9 | Router (6 endpoints), SDK registry (10 cubes), OpenAPI tags, main.py registration |
| 3 | Backward 9→1 | Cross-cube integration tests (12 tests): C7 voting, C8 tokens, SDK registry, service contracts, router structure |
| 4 | Forward 1→9 | +23 lexicon keys (submission/voting/deployment), SoI Trinity vision framing (◬ CODE + ♡ VOTE + 웃 BUILD) |
| 4 | Backward 9→1 | SSSES.md + CLAUDE.md updated: Cube 10 at SSSES 64, 867 total tests |
| 5 | Forward 1→9 | submit_feedback() wired to ProductFeedback model, auto-category (bug/feature/improvement/general) |
| 6 | Forward 1→9 | DB models: CodeSubmission, SubmissionVote, DeploymentLog (3 Supabase tables) |
| 7 | Forward 1→9 | Plan updated to N=7, implementation status current |

## Current Implementation Status

| Component | Status | Lines | Tests |
|-----------|--------|------:|------:|
| service.py | Feedback + submissions + voting logic | 340 | 26 |
| router.py | 6 endpoints registered at /api/v1 | 115 | — |
| models/code_submission.py | CodeSubmission, SubmissionVote, DeploymentLog | 80 | — |
| models/product_feedback.py | ProductFeedback (already existed) | 69 | — |
| cross-cube tests | All 10 cube dependencies verified | — | 12 |
| CUBE_10_PLAN.md | Architecture document (N=7) | 500+ | — |
| **Total** | | **604** | **38** |

*Plan evolves with each SPIRAL cycle. Refinements accumulate — nothing is deleted, only enhanced.*
