# Night Plan v2 — fix every gap-assessment item · 12-hour execution day
### Master of Thought, for the Thought Master · seed 2026.09.03 · revised by the Twelve until converged

**Inputs.** `docs/assessments/2026-09-02_gap_assessment.md` (five cells, every claim `file:line`-proven)
and `docs/assessments/2026-09-03_soi_session_vs_vision2525.md`. Nothing below is planned from
memory; each work package names the evidence it answers.

**Ground rules that bind every package.** PERSIST FIRST (a decision is a file before it is a plan).
A new edition is an append, never an edit (`replay()` reads the last entry at or below a release).
Commit + push after each package; both branches; `ls-remote` proof; three-state deploy line on every
update. Rule 6: no UI removed or restyled without a ruling. NO REWORK: grep-verify before opening code.
**Every package states its SSSES impact, its spiral trace (forward N→10, backward 10→N), and its
one-look check — the single command or glance that proves it done (Asar, Aset).**

---

## 1 · The day in order (Athena's reorder: the test gate lands before the day's backend edits)

| # | Package | Answers | Est. | Why here |
|---|---|---|---|---|
| WP-01 | **Un-block the deploy pipeline** | §I.1, §I.2 | 1.5h | Nothing else is safe to ship until we know whether the Action deploys or Cloudflare bypasses every guard. |
| WP-04 | **pytest in CI + reproducible env + checkable results** | §I.3, defect 21 | 1.0h | The 2,399 tests must gate WP-02/03's backend edits, not follow them. |
| WP-02 | **One migration, one route** | §I.4, §V | 1.0h | Four orphan tables + the unreachable usage-billing route = the platform's first revenue path. *Migration 035 drafted tonight.* |
| WP-03 | **Close CORS; widen rate limiting** | §I.5, §III | 1.0h | Real exposure today. |
| WP-05 | **One word-counter; sacred re-fit; hard gate — and a gate that runs** | §II.6–7 | 2.0h | Largest content task; the counter must be shared BEFORE anyone trims, and the gate must actually be invoked. |
| WP-06 | **Registers: generated facts, one refresh, drift gate** | §II.9–12 | 1.5h | Hand-copied numbers are the mechanism of the decay; generate them. |
| WP-07 | **`exec.*` into living-doc i18n** | §II.8 | 1.0h | 15 blocks × 32 languages — extraction + rebuild today; translation via the small-batch fleet. |
| WP-09 | **Mount the feedback router** | §V | 0.5h | Dead code that restores anonymous feedback; namespace the `/feedback` collision. |
| WP-11a | **Cube 10 `spiral_propagation`** | §IV | 0.25h | The simulator is the consumer of every other cube's dict; the day's backward trace needs it. |
| WP-12 | **Pod: channel isolation, trust, continuity, rulings, persistence** | soi-session assessment + round 1 | 1.0h | *Isolation/trust/continuity landed tonight in the pure module + sim.* Day: rulings, `pod_sessions`, budget gate. |
| WP-13 | **Acceptance — `scripts/day-gate.mjs`** | Asar | 0.5h | One table: every package PASS / FAIL / BLOCKED-ON-RULING with its check, SHA and `ls-remote`. Last, always. |
| *stretch* WP-08 | Level-3 status surfaces | §VI | 0.5h | Pure documentation — demoted to fund WP-11a (Athena). |
| *stretch* WP-10 | Lexicon gate (baseline + ratchet) + entry point | §III | 1.0h | `workspace-select.tsx` is the front door at 100% English. |
| *stretch* WP-11b | Spiral records for cubes 6/8/9 + SPIRAL_METRICS | §IV | 0.75h | |

Committed day ≈ 11.25h; stretch ≈ 2.25h. Each package is one commit with its own three-state line;
the day halts at any red gate. **Path hygiene (Odin) is not a package — it is a gate wired in WP-01.**

## 2 · Packages in detail

**WP-01 Un-block the pipeline.** Repoint 75 sites in `tests/innovation-time.test.mjs` +
`innovation-store-security.test.mjs:254` and the two gates (`scripts/pdf-gate.mjs:275`,
`scripts/slide-shots.mjs:88`) from `app/innovation/page.tsx` → `app/SoI-2525/page.tsx`; assert the
extracted block is non-empty so neither gate can pass vacuously. Triage the real failures behind the
path (the crash at `:3127` is a null from the dead file). **Odin's gate, so this class cannot recur a
sixth time:** extend `frontend/scripts/integrity-guard.mjs` (already run by `prebuild`/`predev`, so
unbypassable) with a path manifest — every `app/**/page.tsx` literal in `frontend/scripts/*.mjs`,
`frontend/tests/*.mjs` and `docs/**/*.md` must exist and must not be a redirect stub.
One-look: the Actions tab — green since Aug 7 = Cloudflare bypasses the workflow; red = no Action
deploy since Aug 7 — then `npm run test:innovation-time` exits 0.
SSSES: Stability +30. Spiral: backward 10→1 (Cube 10 replay depends on this test running).

**WP-04 pytest in CI + checkable results.** `requirements-dev.txt`; a `pytest backend/tests -q
--junitxml` job in `deploy.yml` before Build; **then (Sofia) commit the run summary to
`docs/ci/test-results/<sha>.json` and expose one documented read-only URL per commit** — this is
defect 21 ("a read-only endpoint returning the test result for any commit"), the registers' own answer
to the external reviewers' "the replay is checkable, the defects are not". WP-06 cites the URL as its
closure. One-look: the CI job is green and `docs/ci/test-results/<sha>.json` exists for HEAD.
SSSES: Stability +20, Security +5 (no secrets in the artefact). Spiral: backward 10→1 (Cube 12 Verify's
CI-gating premise becomes real).

**WP-02 One migration, one route.** `supabase/migrations/035_orphan_tables_pod.sql` — `usage_records`,
`blockchain_records`, `arx_items`, `arx_transactions` + `pod_sessions`, each with RLS in the
`012_schema_alignment` pattern (`service_role`-only until a user policy is ruled) and the indexes the
queries need (drafted tonight, applied by the operator; guarded `if not exists` so a second apply is a
no-op — Enki). Add `POST /sessions/{id}/payments/usage-billing` in `cube8_tokens/router.py` calling the
existing, tested `create_usage_billing_checkout`. One-look: `scripts/verify-migrations-vs-models.mjs`
prints 0 orphans; the route appears in `/api/v1/docs`. SSSES: Security +10, Scalability +10.
Spiral: forward 5→8→14 (metering → billing) closes.

**WP-03 CORS + rate limiting.** Replace `allow_origin_regex=".*\.pages\.dev"` with an explicit preview
allowlist from an env var (ruling §6.3); router-level default limits for cubes 4–11; `storage_uri` off
`memory://` behind a flag so >1 worker is safe. One-look: `test_cors.py` refuses a `*.pages.dev`
origin with credentials and admits the allowlisted preview. SSSES: Security +20. Spiral: none
(perimeter).

**WP-05 Word counter → re-fit → hard gate that runs.** *Enlil:* `wcount` is a closure serialised into
`p.evaluate()` and the gate file has no exports — it cannot be imported. Extract it to
`scripts/lib/wcount.mjs`; both `lv-gate` and `_measure.mjs` inject it via `p.evaluate(fn, src)`.
*Thoth:* the views overlap — WP_ORDER carries all eight `brief.*` blocks and `paper.s1–s19`, which NOSE
also counts — so the deficits are NOT independent budgets. **Author 362 words total, not 684:** 109 into
`brief.*`, 213 into `paper.s1–s19` (scores nose AND paper), 40 into paper-only blocks (`mot.*`,
`front.*`, `close.synthesis`); `nose.s0/c/close/author` untouched; **re-measure all three totals after
every insertion, never one.** Counter-first `L(289,…)` supersedes only. Then flip `lv-gate:1513-1515`
to `fails.push` — **and add `node scripts/lv-gate-vision2525.mjs` to `deploy.yml` after Test, because
today nothing invokes the gate at all.** One-look: `_measure.mjs` and the gate print the same three
numbers, all exact. SSSES: Efficiency +10, Succinctness +15. Spiral: none (document).

**WP-06 Registers — generate, refresh, gate drift.** *Pangu:* the mechanism of the decay is that the
registers hand-copy numbers the gate already computes (`lv-gate:1317-1342` derives `statsDefects`,
band membership, readings). Add `scripts/registers-emit.mjs` that reads those computed facts and emits
the registers' numeric spans; the gate diffs generated vs shipped text, not just release age. Then one
release superseding all six `open.*` blocks: reconcile the two decision numberings (both numbers kept
as aliases), backfill or explain defect rows 13/14/21/22/30/32/35/36/45, fix the `defect 13/14`
cross-refs in `unit.witness`/`legal.ramp`, and cite WP-04's results URL as defect 21's closure. One-look:
gate prints `registers: generated == shipped`. SSSES: Stability +15. Spiral: none (document).

**WP-07 exec.\* i18n.** Re-run `vision2525-i18n-extract.mjs` at r288 (187 ids); rebuild 32 pages;
translate the 15 `exec.*` blocks by the proven small-batch method (one language per commit); an
untranslated block falls back to English *with a visible notice*, never silently (Enki). One-look:
manifest `blockCount: 187`; a rebuilt page's `I18N_MAP` carries `exec.*`. SSSES: Stability +10.
Spiral: none (documentation surface).

**WP-09 Feedback router.** `include_router(routers.feedback)` under a distinct prefix; keep Cube 10's
pair; verify anonymous POST + GET list. One-look: `POST /feedback` without a token returns 201.
SSSES: Stability +10. Spiral: forward — FB at Cube 10's centre becomes real.

**WP-11a Cube 10 spiral record.** `backend/tests/cube10/test_e2e_flows.py` with a conforming
`CUBE10_TEST_METHOD` + `spiral_propagation` (Cube 10 is the consumer of every other cube's dict).
One-look: the dict imports and both directions are non-empty. SSSES: Succinctness +5. Spiral: this IS
the backward record.

**WP-12 Pod.** *Landed tonight in `lib/pod-roster.ts` + `tests/soi-pod-sim.test.mjs`:* phases travel
inside the `pod` envelope, never as bare `status` (Krishna — a live poll on the same channel is proven
not to move); the lead is pinned on first roster and forged rosters/phases/attestations are dropped;
the pod code comes from `crypto.getRandomValues` (Thor); an incoming roster merges so a reloaded lead
cannot erase names, hours or start times, and joiners re-claim their chairs (Enki). *Day:* rulings
§6.1/§6.2/§6.6; `pod_sessions` persistence via the Cube 5 time-tracking hook so "the clock is an event,
not a claim" is durably true; **the budget-approval step as two-other-member approval mirroring
`isWitnessed` until §6.6 is ruled (Christo)**, and the sim extended through approval → settle; remaining
~60 strings through `t()`. One-look: `npm run test:soi-pod-sim` green; a closed pod has a row.
SSSES: Security +15, Stability +20. Spiral: forward pod→5→8→6→9; backward 10 replays a recorded pod.

**WP-13 Acceptance.** `scripts/day-gate.mjs` prints one table — a row per package with PASS / FAIL /
BLOCKED-ON-RULING, its one-look command, its commit SHA and `ls-remote` proof — then one closing
three-state deploy line. The day is done when this table is green or every red row names a ruling.

*Stretch.* **WP-08** Level-3 surfaces (Cube 23 real status; six `/innovation` → `/SoI-2525` docs;
`MANIFEST.md` + `derisk`; Manta/Drone *specified, unbuilt*; Celestial acknowledged; `Architect-2525`
spelling). **WP-10** `lexicon-gate.mjs` baselined at 217, failing only on increase; wrap
`workspace-select.tsx`. **WP-11b** `spiral_propagation` for cubes 6/8/9; register
`CUBE_7_METRICS_BASELINE.md`; fix Cube 1's string-shaped dict and the `tests/cubeN` path in CLAUDE.md.

## 3 · SSSES test plan (what proves each pillar)
- **Security** — WP-02: five new tables each carry `enable row level security` + a policy (parity
  script); WP-03: `test_cors.py`; WP-12: impostor roster/phase/attestation dropped (sim).
- **Stability** — WP-01: `test:innovation-time` exits 0 and the path-manifest gate passes; WP-04:
  pytest green in CI with a committed result file; WP-06: gate `registers: generated == shipped`; WP-12:
  three phones converge, lead reload loses nothing (sim).
- **Scalability** — WP-03: limiter storage not `memory://` under `WORKERS>1`; WP-12: pod rides the
  existing channel (no new Realtime channel) and a live poll on it never moves.
- **Efficiency** — WP-05: one counter, three totals re-measured per insertion, the 14-min gate run once.
- **Succinctness** — no new function >300 LOC; `pod-roster.ts` is pure and page-free.

## 4 · SPIRAL test plan
Every package carries a forward (N→10) and backward (10→N) trace in its commit (or states "none"
with the reason). The **reference spiral for the day is the pod**: forward — pod → Cube 5 time
tracking → Cube 8 웃 → Cube 6 synthesis → Cube 9 receipt → Cube 10 replay; backward — Cube 10 replays
a recorded pod and must reproduce the same settlement and synthesis. Tonight's simulation asserts
exactly that, and WP-11a gives Cube 10 the record the ground rules demand.

## 5 · Tonight, autonomous
1. Plan persisted; **round 1 of the Twelve incorporated in full** (all twelve: incorporate); round 2 on
   this v2; rounds continue until one adds no material change (cap 4).
2. **3-user pod simulation + SPIRAL test** — `lib/pod-roster.ts` (pure), an in-memory bus mirroring
   the channel (`self:false`), three phones + a refused fourth + an impostor + a reloading lead + a live
   poll listener; join → agree → 15-s timer (pass and fail) → active → record → audit → settle →
   synthesis; convergence and the `PodSynthesisRequest` contract asserted.
3. **Supabase** — migration 035 (idempotent, RLS, indexes) + `scripts/verify-migrations-vs-models.mjs`
   so an orphan table can never ship silently again.
4. Present at the 6-hour mark: final plan, revision log, sim results, migration, deploy state.

## 6 · Rulings only the operator can make
1. Pod size: promote `frame.pod` as *three or more* (per locked `unit.witness`) or amend the doctrine.
2. Manta-2525 in the pod: mark unbuilt, or replace.
3. CORS: explicit preview allowlist (env var) vs. dropping credentials for previews.
4. `exec.*` translation budget: all 32 languages today, or the top ten.
5. Sacred totals: re-fit to 3,333 / 9,999 / 77,777 as authored words, or retarget.
6. **Who approves a pod's budget before 웃 settles** (Christo): default proposed = the two other members,
   mirroring the witness floor, so no one approves their own hours.

## 7 · Revision log
- **v1** — seed from the two assessments (MoT).
- **v2** — round 1, twelve of twelve *incorporate*: Asar → WP-13 acceptance table + one-look check on
  every package · Aset → SSSES + spiral line on every package, WP-05 scored Efficiency+Succinctness ·
  Athena → order WP-01/04/02/03, WP-11 split (Cube 10 committed), WP-08 to stretch · Christo → budget
  approver ruling §6.6, two-other-member default, sim through approval · Enki → roster merge + lead-reload
  sim, idempotent migration, visible fallback notice · Enlil → `wcount` extracted and injected, lv-gate
  added to deploy.yml · Krishna → phases inside the pod envelope, channel-isolation proven · Odin →
  path-manifest gate in `integrity-guard.mjs` · Pangu → registers generated from the gate's facts, drift
  gate · Sofia → committed test results per commit, defect 21 closed · Thor → pinned lead, sender checks,
  random pod code, impostor sim · Thoth → 362 words total across overlapping views, re-measure all three.
