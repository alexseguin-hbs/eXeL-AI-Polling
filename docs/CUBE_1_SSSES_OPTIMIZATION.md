# Cube 1 — SSSES Optimization Ledger (living brainstorm)

> **Purpose (operator, 2026-07-21):** as we complete each Cube-1 CRS + sub-CRS, document candidate SSSES optimization
> solutions here so we can brainstorm optimization as we go, and showcase the updated metric. One row per pillar per CRS.
> **Scope:** Cube 1 (Session Join & QR) only. Pillars: **S**ecurity · **S**tability · **S**calability · **E**fficiency · **S**uccinctness.
> **Legend:** ✅ shipped this session · ◻ candidate (not yet built) · ⚠ needs live/interactive verification.

---

## Metric snapshot (shipped this session — the "current metric" per operator)
| Metric | Value | Source |
|--------|-------|--------|
| anonymity_mode default | **anonymous** (was identified) | `schemas/session.py`, `service.py` — `4246bbb` |
| anon_hash coverage | fires for **true-anon** (user_id=None) too — 64-hex SHA-256 | `4246bbb` |
| results export gate | login (matched user_id) **+ opt-in** required → 403; cost_split unpaid → 402 | `4246bbb` |
| $/min per-poll | `GET /sessions/{id}/metrics` — user + moderator + `dollars_per_min` | `2dd3742` |
| MoT cost control chart | default **91.25-day** window (131,400 min); baseline/actual/variance | `<this commit>` |
| per-min 웃 valuation | **$0.120833/min** at $7.25/hr default | CRS-19.06 |
| Cube-1 stand-alone SIM | deterministic harness — same seed → identical signature | `47c69df` |
| moderator-paid open gate | can't OPEN/POLL until is_paid → 402 | `f85ad17` |
| Cube-1 backend tests | **88 passed** (0 failed) | pytest cube1 |

---

## Per-CRS SSSES optimization candidates

### CRS-01 — Session create + link/QR  ·  CRS-01.01 config · 01.02 code+QR · 01.03 scoping (❌ MVP2)
- **Security** ◻ sign the QR payload (HMAC) so a tampered join URL is rejected (CRS-01.02 stretch = "animated/branded QR w/ embedded metadata" → carry a signed token).
- **Scalability** ◻ pre-generate a short-code pool (batch nanoid + bulk uniqueness check) so create_session doesn't round-trip the DB per attempt at burst.
- **Efficiency** ◻ generate the QR PNG lazily / cache by short_code (QR is deterministic per URL — memoize).
- **Stability** ◻ CRS-01.03 scoping (Project/Spec/Differentiator) needs `scoping_type`/`scoping_id` columns → migration (operator-applied); guard logic gateable now.
- **Succinctness** ✅ create_session is one function; kwargs dict already deduped.

### CRS-02 — Frictionless join  ·  02.01 anon · 02.02 flow · 02.03 lobby auto-advance
- **Security** ✅ anonymous-by-default; ◻ CRS-02.01 stretch = device fingerprint for soft identity without login (anti-sybil without friction).
- **Scalability** ◻ join_session is single-row; batch the presence broadcast (already fire-and-forget). ◻ short-code lookup is indexed — confirm `ix` on `short_code`.
- **Efficiency** ◻ the join re-fetches the session for participant_count — could return count from the write path instead of a second GET (frontend does this today).
- **Stability** ⚠ 4-layer cross-device sync (Broadcast/Presence/CF-KV/DB) is the LOCKED Trinity-Redundancy path — do not refactor without live verification.

### CRS-03 — Collision-free IDs  ·  03.01 UUID5 seeded · 03.02 8-char retry
- **Stability** ✅ deterministic UUID5 (same seed → same id) locked by the SIM harness (`47c69df`).
- **Security** ◻ CRS-03.01 stretch = SHA-256 signed session identity tokens; CRS-03.02 stretch = cryptographic entropy guarantee on the short code (nanoid is not seeded → not reproducible; acceptable as a uniqueness token, documented in the harness).
- **Efficiency** ◻ 5-attempt retry loop does N DB reads worst-case — the pre-generated pool (CRS-01) removes this.

### CRS-04 — Validate access  ·  04.01 expiry 410 · 04.02 invalid-state · 04.03 state machine
- **Stability** ✅ 6-state machine (`SESSION_TRANSITIONS`) + the transition matrix locked by the harness.
- **Security** ✅ payment-open gate added (moderator_paid can't open until paid, `f85ad17`).
- **Scalability** ◻ CRS-04.03 stretch = automated state transitions on timer expiry for static polls (a scheduler/worker) — the first taste of Cube-10 autonomy.
- **Efficiency** ◻ replay_hash on close queries all ResponseMeta ids — at 1M responses stream/aggregate the hash incrementally rather than load ids.

### CRS-05 — Anonymity modes  ·  05.01 anonymous · 05.02 identified · 05.03 pseudonymous
- **Security** ✅ anon_hash now fires for true-anon (real gap closed); ◻ 05.03 pseudonymous is stored (both ids) but no UI/flow — candidate for a compliance-audit surface. ◻ rotate the session salt so anon_hash can't be correlated across sessions (already session-scoped via HMAC key = session_id ✅).
- **Succinctness** ✅ one `anonymize_user_id` path, mode-branched.
- **Stability** ◻ 05.02/05.03 stretch = post-session reveal opt-in / configurable pseudonymity window.

### CRS-06 — Open/close polling  ·  06.01 start gate · 06.02 stop→Cube 6
- **Stability** ✅ `validate_session_for_submission` shared by Cubes 2/3/4 (one gate).
- **Scalability** ◻ 06.02 stop→Cube 6 Phase B is fire-and-forget background task — confirm back-pressure at burst (Cube 5 semaphore exists).
- **Efficiency** ◻ 06.01 stretch = time-based auto-open on moderator schedule; 06.02 stretch = graceful 5s drain (accept in-flight submissions after close).

### CRS-19.06 — SoI $/min + MoT cost control chart (NEW this session)
- **Efficiency** ✅ single SQL aggregate (SUM/COUNT) + one endpoint; pure math for $/min + MoT.
- **Scalability** ✅ MoT control LIMITS now real for a PROJECT/BUSINESS via `mot_cost_series([burn_rates], window)` — SPC chart, centerline = mean, UCL/LCL = mean ± 3σ (LCL floored 0), out-of-control count (cost anomalies). Single-poll `mot` still reports None limits (a lone point can't have limits — honest). The per-quarter rollup that FEEDS the series needs project scoping (CRS-01.03, migration) to auto-collect across a project's sessions.
- **Stability** ◻ moderator active-min = poll wall-clock (proxy, no migration) — a first-class moderator TimeEntry (actor_role column) would be exact but needs a migration.
- **Security** ✅ 웃 valuation is independent of `human_enabled` (valuation ≠ payout); payout stays 0 pre-treasury.

---

## Next-set review (per operator: "review plan for next set, stop to optimize if needed")
- **Highest-value verifiable next Cube-1 slices:** (1) CRS-01.02 signed-QR HMAC (Security, gateable pure); (2) short-code
  pool pre-generation (Scalability/Efficiency, gateable); (3) CRS-04.03 static-poll auto-transition scheduler (backend,
  gateable) — a bridge to Cube-10 autonomy. (4) CRS-01.03 scoping columns + guard (needs migration — operator-applied).
- **Deferred (needs live session):** the join-flow Auth0 login-on-opt-in + real participant results view (frontend,
  touches sacred `session-view.tsx`); the $/min + MoT dashboard PANEL + HUD wiring.
- **Optimize-if-needed flag:** none blocking — each shipped slice is gated + reversible; the MoT control-limits gap and the
  moderator-time-proxy are documented, not hidden.
