# Night Plan v1 — fix every gap-assessment item · 12-hour execution day
### Master of Thought, for the Thought Master · seed 2026.09.03 · revised by the Twelve until converged

**Inputs.** `docs/assessments/2026-09-02_gap_assessment.md` (five cells, every claim `file:line`-proven)
and `docs/assessments/2026-09-03_soi_session_vs_vision2525.md`. Nothing below is planned from
memory; each work package names the evidence it answers.

**Ground rules that bind every package.** PERSIST FIRST (a decision is a file before it is a plan).
A new edition is an append, never an edit (`replay()` reads the last entry at or below a release).
Commit + push after each package; both branches; `ls-remote` proof; three-state deploy line on every
update. Rule 6: no UI removed or restyled without a ruling. NO REWORK: grep-verify before opening code.
Every package states its SSSES impact and its spiral trace (forward N→10, backward 10→N).

---

## 1 · The day in order

| # | Package | Answers | Est. | Why here |
|---|---|---|---|---|
| WP-01 | **Un-block the deploy pipeline** | §I.1, §I.2 | 1.5h | Nothing else is safe to ship until we know whether the Action deploys or Cloudflare bypasses every guard. |
| WP-02 | **One migration, one route** | §I.4, §V | 1.0h | Four orphan tables + the unreachable usage-billing route = the platform's first revenue path. *Migration 035 drafted tonight.* |
| WP-03 | **Close CORS; widen rate limiting** | §I.5, §III | 1.0h | Real exposure today. |
| WP-04 | **pytest in CI + reproducible env** | §I.3 | 1.0h | 2,399 tests defend nothing until this. |
| WP-05 | **One word-counter; sacred re-fit; hard gate** | §II.6–7 | 2.0h | Largest content task; `_measure.mjs` must agree with the gate BEFORE anyone trims. |
| WP-06 | **Refresh the six registers + staleness gate** | §II.9–12 | 1.5h | Live prose claims currency; five registers are 106–209 releases stale. |
| WP-07 | **`exec.*` into living-doc i18n** | §II.8 | 1.0h | 15 blocks × 32 languages — extraction + rebuild today; translation via the small-batch fleet. |
| WP-08 | **Level-3 status surfaces** | §VI | 0.5h | Cube 23 "planned/0%", dead `/innovation` pointers, Manta/Drone/Celestial claims. |
| WP-09 | **Mount the feedback router** | §V | 0.5h | Dead code that restores anonymous feedback; namespace the `/feedback` collision. |
| WP-10 | **Lexicon gate (baseline + ratchet) + entry point** | §III | 1.0h | `workspace-select.tsx` is the product's front door at 100% English. |
| WP-11 | **Spiral records** | §IV | 1.0h | `spiral_propagation` for cubes 6/8/9/10; SPIRAL_METRICS 432 commits stale. |
| WP-12 | **Pod: rulings + persistence + budget gate** | soi-session assessment | 1.0h | 3-or-more ruling · Manta card · `pod_sessions` durable record · budget-approval step. *Sim + migration tonight.* |

Total ≈ 13h against a 12h day → **WP-01…09 + WP-12 are the committed day; WP-10/11 are the stretch.**
Each package is a separate commit with its own three-state line; the day halts at any red gate.

## 2 · Packages in detail

**WP-01 Un-block the pipeline.** Repoint 75 sites in `tests/innovation-time.test.mjs` +
`innovation-store-security.test.mjs:254` from `app/innovation/page.tsx` → `app/SoI-2525/page.tsx`;
same for `scripts/pdf-gate.mjs:275`, `scripts/slide-shots.mjs:88`, and assert the extracted block is
non-empty so neither gate can pass vacuously again. Run; triage the *real* failures behind the path
(the crash at `:3127` is a null from the dead file). **Operator first, in one look:** the Actions tab —
green since Aug 7 = Cloudflare bypasses the workflow; red = no Action deploy since Aug 7.
SSSES: Stability +30. Spiral: backward 10→1 (Cube 10 replay depends on this test running).

**WP-02 One migration, one route.** `supabase/migrations/035_orphan_tables_pod.sql` — `usage_records`,
`blockchain_records`, `arx_items`, `arx_transactions` + `pod_sessions`, each with RLS in the
`012_schema_alignment` pattern and the indexes the queries need (drafted tonight, applied by the
operator). Add `POST /sessions/{id}/payments/usage-billing` in `cube8_tokens/router.py` calling the
existing, tested `create_usage_billing_checkout`. SSSES: Security +10 (RLS), Scalability +10.
Spiral: forward 5→8→14 (metering → billing) closes.

**WP-03 CORS + rate limiting.** Replace `allow_origin_regex=".*\.pages\.dev"` with an explicit
preview allowlist (or drop credentials for regex origins). Router-level default limits for cubes
4–11; move `storage_uri` off `memory://` behind a flag so >1 worker is safe. SSSES: Security +20.

**WP-04 pytest in CI.** `requirements-dev.txt`; a `pytest backend/tests -q` job in `deploy.yml`
before Build; publish the junit artefact the "2,212 passed" claim rests on. SSSES: Stability +20.

**WP-05 Word counter → re-fit → hard gate.** Make `_measure.mjs` import the gate's `wcount` (one
shared counter). Then author 109 / 213 / 362 words as counter-first `L(289,…)` supersedes (never edit
a shipped block); measure after each; flip `lv-gate:1513-1515` from `console.warn` to `fails.push`.
Gate ≈ 14 min; run once at the end. SSSES: Succinctness +15. This is the only package that touches
the living document's text — it is authored, not generated.

**WP-06 Registers.** One release (r289 or next) superseding all six `open.*` blocks with restated
states; reconcile the two decision numberings (keep both numbers as aliases); backfill or explain
defect rows 13/14/21/22/30/32/35/36/45; fix the `defect 13/14` cross-refs in `unit.witness`/`legal.ramp`.
Add a gate rule: fail when any `open.*` winner is >N releases behind VMAX, and when `stats.defects` ≠
rendered rows. SSSES: Stability +15.

**WP-07 exec.\* i18n.** Re-run `vision2525-i18n-extract.mjs` at r288 (187 ids); rebuild 32 pages;
translate the 15 `exec.*` blocks by the proven small-batch method (one language per commit).
SSSES: Stability +10. Spiral: none (documentation surface).

**WP-08 Level-3 surfaces.** `cube-status.tsx:96` Cube 23 → real status; six docs `/innovation` →
`/SoI-2525`; `MANIFEST.md` + `derisk`; Manta/Drone marked *specified, unbuilt*; Celestial acknowledged;
`Architect-2525` spelling. Pure documentation. SSSES: Succinctness +5.

**WP-09 Feedback router.** `include_router(routers.feedback)` under a distinct prefix; keep Cube 10's
pair; verify anonymous POST + GET list. SSSES: Stability +10. Spiral: FB at Cube 10's centre becomes real.

**WP-10 Lexicon gate.** `frontend/scripts/lexicon-gate.mjs`: count hardcoded JSX text; baseline at
today's 217; fail only on *increase* (ratchet). Wrap `workspace-select.tsx` (8 strings). Wire into
`.githooks/pre-commit` + `deploy.yml`. SSSES: Stability +10.

**WP-11 Spiral records.** `test_e2e_flows.py` with conforming `spiral_propagation` for cubes 6/8/9/10
(Cube 10 first — it is the consumer); register `CUBE_7_METRICS_BASELINE.md` in `SPIRAL_METRICS.md`;
fix Cube 1's string-shaped dict; fix the `tests/cubeN` path in CLAUDE.md.

**WP-12 Pod.** Ruling on three-or-more (roster already seats by index — a constant change); Manta card;
`pod_sessions` persistence via the Cube 5 time-tracking hook so "the clock is an event, not a claim"
is durably true; a budget-approval step before 웃 settles; remaining ~60 strings through `t()`.

## 3 · SSSES test plan (what proves each pillar)
- **Security** — WP-02 RLS present on all five new tables (grep `enable row level security` = 5);
  WP-03 a `*.pages.dev` origin is refused with credentials (curl assertion in `test_cors.py`).
- **Stability** — WP-01 `test:innovation-time` exits 0; WP-04 pytest green in CI; WP-06 gate PASS with
  the new register rules; the pod sim (tonight) converges three phones to one roster.
- **Scalability** — WP-03 limiter storage not `memory://` under `WORKERS>1`; pod channel reuse (no new
  Realtime channel).
- **Efficiency** — WP-05 one counter, measured once; gate runs once per release, not per edit.
- **Succinctness** — no new function >300 LOC; `pod-roster.ts` extracted pure (tonight).

## 4 · SPIRAL test plan
Every package carries a forward (N→10) and backward (10→N) trace in its commit. The **reference
spiral for the day is the pod**: forward — pod → Cube 5 time tracking → Cube 8 웃 → Cube 6 synthesis
→ Cube 9 receipt → Cube 10 replay; backward — Cube 10's harness replays a recorded pod and must
reproduce the same settlement and synthesis (determinism). Tonight's simulation is that harness.

## 5 · Tonight, autonomous
1. This plan persisted (repo + plan file), then **AsM round 1** (twelve × 111 words) → v2 → round 2 →
   … until a round adds no material change (cap 4).
2. **3-user pod simulation + SPIRAL test** — extract `lib/pod-roster.ts` (pure), an in-memory bus
   mirroring the Realtime channel (`self:false`), three simulated phones through join → agree →
   15-s timer (pass and fail) → active → record → audit → settle → synthesis; assert convergence and
   the API contract against `PodSynthesisRequest`.
3. **Supabase** — migration 035 drafted; indexes for the pod/feedback/usage paths; interaction tests.
4. Present at the 6-hour mark: final plan, revision log, sim results, migration, deploy state.

## 6 · Rulings only the operator can make
1. Pod size: promote `frame.pod` as *three or more* (per locked `unit.witness`) or amend the doctrine.
2. Manta-2525 in the pod: mark unbuilt, or replace.
3. CORS: explicit preview allowlist vs. dropping credentials for previews.
4. `exec.*` translation budget: all 32 languages today, or the top ten.
5. Sacred totals: re-fit to 3,333 / 9,999 / 77,777 as authored words, or retarget.

## 7 · Revision log
- **v1** — seed from the two assessments (MoT).
