# Night Plan v4 (CONVERGED) — fix every gap-assessment item · 12-hour execution day
### Master of Thought, for the Thought Master · seed 2026.09.03 · revised by the Twelve until converged

**Inputs.** `docs/assessments/2026-09-02_gap_assessment.md` (five cells, every claim `file:line`-proven)
and `docs/assessments/2026-09-03_soi_session_vs_vision2525.md`. Nothing below is planned from
memory; each work package names the evidence it answers. **Two vocabularies, never confused:**
*planned* means the package text describes it; *built tonight* means it is committed and its gate
runs (Enlil).

**Ground rules that bind every package.** PERSIST FIRST (a decision is a file before it is a plan).
A new edition is an append, never an edit (`replay()` reads the last entry at or below a release) —
**this applies to dated assessments and archives too; the day never rewrites its own evidence
(Athena).** Commit + push after each package; both branches; `ls-remote` proof; three-state deploy
line on every update. Rule 6: no UI removed or restyled without a ruling. NO REWORK: grep-verify
before opening code. Every package states its SSSES impact, its spiral trace, and its **One-look**.

**The One-look grammar (Pangu) — `day-gate.mjs` is generated from these lines, so they are law:**
a line beginning `One-look (WP-NN):` at column 0; clauses split on `·`; a backticked clause is
executed and must exit 0; bare prose is printed **BLOCKED-ON-GLANCE** and never counts as PASS.
`day-gate.mjs` enumerates §1's table rows and FAILS any package ID with no matching line, skips its
own WP-13 row (self-reference, reported as the aggregate — Asar), sums SSSES per pillar from the
package lines and FAILS if §3's pillar rows do not name exactly the packages that score them (Aset),
and reads test tallies from the runners' own output, never from this file (Sofia, Enlil).

---

## 1 · The day in order

| # | Package | Answers | Est. | Why here |
|---|---|---|---|---|
| WP-01 | **Un-block the deploy pipeline** (+ step 0 dead doc paths, + `day-gate.mjs`) | §I.1, §I.2 | 1.75h | Nothing else is safe to ship until we know whether the Action deploys or Cloudflare bypasses every guard. The acceptance gate is written HERE so it exists on the failure path. |
| WP-04 | **pytest in CI + parity + hook activation + checkable results** | §I.3, defect 21 | 1.0h | The 2,399 tests must gate WP-02/03's backend edits, not follow them. A per-clone hook is a hope, not a gate — CI asserts it (Odin). |
| WP-02 | **Apply migration 035; one route** | §I.4, §V | 0.75h | *035 built tonight — nine tables, parity 0 orphans.* The route makes metering → billing reachable. |
| WP-03 | **Close CORS; widen rate limiting** | §I.5, §III | 1.0h | Real exposure today. |
| WP-05 | **One word-counter; sacred re-fit; hard gate — and a gate that runs** | §II.6–7 | 2.0h | Largest content task; the counter must be shared BEFORE anyone trims, and the gate must be invoked. |
| WP-06 | **Registers: generated facts, one refresh, drift gate** | §II.9–12 | 1.5h | Hand-copied numbers are the mechanism of the decay; generate them. |
| WP-07 | **`exec.*` into living-doc i18n** | §II.8 | 1.0h | 15 blocks × 32 languages — extraction + rebuild today; translation via the small-batch fleet. |
| WP-09 | **Mount the feedback router** | §V | 0.5h | Dead code that restores anonymous feedback; namespace the `/feedback` collision. |
| WP-11a | **Cube 10 `spiral_propagation`** | §IV | 0.25h | The simulator is the consumer of every other cube's dict; the day's backward trace needs it. |
| WP-12 | **Pod: rulings, persistence, budget gate, dissent path** | soi-session assessment + rounds 1–3 | 1.0h | *Isolation, trust, continuity, revision, presence, lagged phone, reload-at-any-phase — built tonight.* Day: rulings, `pod_sessions`, `budgetApprovedBy`, recorded dissent (Christo), overwritten-bit notice (Sofia). |
| WP-13 | **Acceptance — `day-gate.mjs` green** | Asar, Aset, Pangu | 0.25h | Runs after every package and on halt; the day is done when it is green or every red row names a ruling. |
| *stretch* WP-08 | Level-3 status surfaces (code half) | §VI | 0.35h | The doc half moved into WP-01 step 0. |
| *stretch* WP-10 | Lexicon gate (measured baseline + ratchet) + entry point | §III | 1.0h | `workspace-select.tsx` is the front door at 100% English. |
| *stretch* WP-11b | Spiral records for cubes 6/8/9 + SPIRAL_METRICS | §IV | 0.75h | |

Committed day = 11.00h; stretch = 2.10h (Thoth, verified against the rows). One commit per package
with its own three-state line; the day halts at any red gate — and `day-gate.mjs` prints the table
at the halt, so what was done is never lost on the failure path.

## 2 · Packages in detail

**WP-01 Un-block the pipeline.** *Step 0 (Athena, scoped):* the retired `/innovation` and
`app/innovation/page.tsx` literals number **26 across 9 `.md` files**, five of them in
`docs/assessments/2026-09-02_gap_assessment.md` — which is evidence this plan cites and must not be
edited. Rewrite **live docs only** (walkthrough, specs, framing, intake); leave dated assessments and
archives verbatim. *Step 1:* repoint 75 sites in `tests/innovation-time.test.mjs` +
`innovation-store-security.test.mjs:254` and the two gates (`scripts/pdf-gate.mjs:275`,
`scripts/slide-shots.mjs:88`); assert the extracted block is non-empty; triage the real failures behind
the path. *Step 2 (Odin):* extend `frontend/scripts/integrity-guard.mjs` (run by `prebuild`/`predev`,
unbypassable) with a path manifest — every `app/**/page.tsx` literal in `frontend/scripts/*.mjs`,
`frontend/tests/*.mjs` and `../docs/**/*.md` (npm's cwd is `frontend`) must exist and not be a
redirect stub — **skipping `docs/assessments/**` and dated archives** so the gate never reds on
history; assert ≥1 file matched. *Step 3:* write `scripts/day-gate.mjs` per the grammar above. At
hour 0 it exits non-zero — that is its own proof.
One-look (WP-01): `cd frontend && npm run test:innovation-time` · `node scripts/day-gate.mjs --self-test` · the Actions tab: green since Aug 7 means Cloudflare bypasses the workflow, red means no Action deploy since Aug 7
SSSES: Stability +30. Spiral: backward 10→1 (Cube 10 replay depends on this test running).

**WP-04 pytest in CI + parity + hook activation + checkable results.** `requirements-dev.txt`; a
`pytest backend/tests -q --junitxml` job in `deploy.yml` before Build. In the same job, with
`working-directory: .`: run `node scripts/verify-migrations-vs-models.mjs` and assert it printed ≥1
model table (Odin); **assert `git config core.hooksPath` is `.githooks` and the hook is executable**
— tonight's clone had lost both to a container reset, so the chain that "ran" on a commit had not
(Odin, round 3). Then (Sofia) commit the run summary to `docs/ci/test-results/<sha>.json` and expose
one documented read-only URL per commit — defect 21; WP-06 cites it as closure.
One-look (WP-04): CI green on HEAD · `test -f docs/ci/test-results/$(git rev-parse HEAD).json`
SSSES: Stability +20, Security +5. Spiral: backward 10→1 (Cube 12 Verify's CI premise becomes real).

**WP-02 Apply 035; one route.** *Built tonight:* `supabase/migrations/035_orphan_tables_pod.sql` —
**nine** tables: the assessment's four (`usage_records`, `blockchain_records`, `arx_items`,
`arx_transactions`), the four the new parity gate then found (`api_keys`, `projects`,
`differentiators`, `specifications` — the API-key and scoping features CLAUDE.md calls implemented,
with the FK chain), and `pod_sessions`; idempotent (Enki); RLS `service_role`-only; indexes on the
query paths. `scripts/verify-migrations-vs-models.mjs` prints `0 orphan(s)` and runs in pre-commit.
*Day:* the operator applies 035; add `POST /sessions/{id}/payments/usage-billing` in
`cube8_tokens/router.py` calling the existing, tested `create_usage_billing_checkout`.
One-look (WP-02): `node scripts/verify-migrations-vs-models.mjs` · the route appears in `/api/v1/docs`
SSSES: Security +10, Scalability +10. Spiral: forward 5→8→14 closes.

**WP-03 CORS + rate limiting.** Replace `allow_origin_regex=".*\.pages\.dev"` with an explicit preview
allowlist from an env var (ruling §6.3); router-level default limits for cubes 4–11; `storage_uri` off
`memory://` behind a flag.
One-look (WP-03): `cd backend && pytest tests/test_cors.py -q`
SSSES: Security +20. Spiral: none (perimeter).

**WP-05 Word counter → re-fit → hard gate that runs.** *Enlil:* `wcount` is a closure serialised into
`p.evaluate()` and the gate file has no exports — extract it to `scripts/lib/wcount.mjs`; both
`lv-gate` and a recreated `_measure.mjs` inject it via `p.evaluate(fn, src)`. *Thoth:* the views
overlap — **author 362 words total, not 684:** 109 into `brief.*`, 213 into `paper.s1–s19` (scores
nose AND paper), 40 into paper-only blocks; re-measure all three totals after every insertion.
Counter-first `L(289,…)` supersedes only. Then flip `lv-gate:1513-1515` to `fails.push` and add
`node scripts/lv-gate-vision2525.mjs` to `deploy.yml` after Test — nothing invokes the gate today.
One-look (WP-05): `node _measure.mjs` · `node scripts/lv-gate-vision2525.mjs` (both print 3,333 · 9,999 · 77,777)
SSSES: Efficiency +10, Succinctness +15. Spiral: none (document).

**WP-06 Registers — generate, refresh, gate drift.** *Pangu:* `scripts/registers-emit.mjs` emits the
registers' numeric spans from the gate's computed facts (`lv-gate:1317-1342`); the gate diffs
generated vs shipped. Then one release superseding all six `open.*` blocks: reconcile the two
decision numberings (both kept as aliases), backfill or explain defect rows 13/14/21/22/30/32/35/36/45,
fix the `defect 13/14` cross-refs, cite WP-04's results URL as defect 21's closure.
One-look (WP-06): `node scripts/registers-emit.mjs --check`
SSSES: Stability +15. Spiral: none (document).

**WP-07 exec.\* i18n.** Re-run `vision2525-i18n-extract.mjs` at r288 (187 ids); rebuild 32 pages;
translate the 15 `exec.*` blocks one language per commit; an untranslated block falls back to English
*with a visible notice*.
One-look (WP-07): `grep -c '"blockCount": 187' docs/i18n/vision2525.manifest.json`
SSSES: Stability +10. Spiral: none (documentation surface).

**WP-09 Feedback router.** `include_router(routers.feedback)` under a distinct prefix; keep Cube 10's pair.
One-look (WP-09): `cd backend && pytest tests/test_feedback_router.py -q` (anonymous POST → 201)
SSSES: Stability +10. Spiral: forward — FB at Cube 10's centre becomes real.

**WP-11a Cube 10 spiral record.** `backend/tests/cube10/test_e2e_flows.py` with a conforming
`CUBE10_TEST_METHOD` + `spiral_propagation`.
One-look (WP-11a): `cd backend && python -c "from tests.cube10.test_e2e_flows import CUBE10_TEST_METHOD as m; assert m['spiral_propagation']['forward'] and m['spiral_propagation']['backward']"`
SSSES: Succinctness +5. Spiral: this IS the backward record.

**WP-12 Pod.** *Built tonight in `lib/pod-roster.ts` + `tests/soi-pod-sim.test.mjs` (the suite prints
its own tally; day-gate reads it):* phases inside the `pod` envelope, a live poll on the same channel
proven not to move nor to move the pod (Krishna); lead pinned on first roster; `member` patches own-
seat only and never carrying witness bits; attestations one `attest` message per reviewer index;
`claim` refuses seat 0 and out-of-range seats and caps a forged revision (Thor); rosters carry a
revision — newer applies verbatim, older (a reloaded lead) merges, keeps the later phase and the known
seats, and the claimants carry the lead forward to the pod's real phase (Enki); a stale phase never
rewinds, a held forward move lands, reversed attestations converge on the lead's roster (Sofia); the
pod counts its roster, not the channel (Krishna); the witness floor is two OTHERS and lives only in
the library (Christo); code from `crypto.getRandomValues`. *Day:* rulings §6.1/§6.2/§6.6;
`pod_sessions` via the Cube 5 time-tracking hook; `budgetApprovedBy` with the two-other-member rule
until §6.6 is ruled; **a recorded-dissent settle path** — one refusal or one departed phone must
not freeze the pod forever with Reset as the only exit (Christo); **the reviewer's phone shows when
its own attestation was overwritten by the roster** — convergence without notice is not trust
(Sofia); remaining ~60 strings through `t()`.
One-look (WP-12): `cd frontend && npm run test:soi-pod-sim` · a closed pod has a `pod_sessions` row
SSSES: Security +20, Stability +25. Spiral: forward pod→5→8→6→9; backward 10 replays a recorded pod.

**WP-13 Acceptance.** `scripts/day-gate.mjs` (written in WP-01, run after every package and on halt)
is green, or every red row names a ruling.
One-look (WP-13): `node scripts/day-gate.mjs`
SSSES: Stability +10. Spiral: none (gate).

*Stretch.* **WP-08** Level-3 code half: `cube-status.tsx:96` Cube 23 real status; `MANIFEST.md` +
`derisk`; Manta/Drone *specified, unbuilt*; Celestial acknowledged; `Architect-2525` spelling.
One-look (WP-08): `grep -q '"in_progress"' frontend/components/cube-status.tsx` (Cube 23 row)
SSSES: Succinctness +5. Spiral: none.
**WP-10** `lexicon-gate.mjs --count` on HEAD writes `docs/ci/lexicon-baseline.json {count, sha,
scope}` — measured, never typed (the assessment's own cells disagreed, 217 vs 260); fail only on
increase; wrap `workspace-select.tsx`.
One-look (WP-10): `test -f docs/ci/lexicon-baseline.json` · `node frontend/scripts/lexicon-gate.mjs` (Thoth)
SSSES: Stability +10. Spiral: none.
**WP-11b** `spiral_propagation` for cubes 6/8/9; register `CUBE_7_METRICS_BASELINE.md`; fix Cube 1's
string-shaped dict and the `tests/cubeN` path in CLAUDE.md.
One-look (WP-11b): `grep -l spiral_propagation backend/tests/cube6/test_e2e_flows.py backend/tests/cube8/test_e2e_flows.py backend/tests/cube9/test_e2e_flows.py`
SSSES: Succinctness +5. Spiral: this IS the record.

## 3 · SSSES test plan (each row names exactly the packages that score it — day-gate checks this)
- **Security** — WP-02, WP-03, WP-04, WP-12.
- **Stability** — WP-01, WP-04, WP-06, WP-07, WP-09, WP-12, WP-13, (stretch WP-10).
- **Scalability** — WP-02.
- **Efficiency** — WP-05.
- **Succinctness** — WP-05, WP-11a, (stretch WP-08, WP-11b).

*Footnote (Aset):* WP-03's move of limiter storage off `memory://` is a scalability outcome, but
WP-03 scores it under Security; it is not listed above so the pillar check stays exact.

## 4 · SPIRAL test plan
Every package carries a forward and backward trace (or "none" with the reason). The reference
spiral is the pod: forward pod → Cube 5 → Cube 8 → Cube 6 → Cube 9 → Cube 10; backward — Cube 10
replays a recorded pod and reproduces the same settlement and synthesis. Tonight's simulation asserts
exactly that; WP-11a gives Cube 10 the record the ground rules demand.

## 5 · Tonight, autonomous — final status
1. Plan persisted; **rounds 1, 2 and 3 of the Twelve incorporated, twelve of twelve each; round 3
   returned CONVERGED from every Master with one final line — all twelve folded in here. Converged.**
2. **Pod simulation + SPIRAL test — built and green** (see WP-12; the suite prints its tally).
3. **Supabase — built:** migration 035 (nine tables, idempotent, RLS, indexes);
   `verify-migrations-vs-models.mjs` at 0 orphans, in pre-commit; `core.hooksPath` repaired on this
   clone and the full chain run by hand — green.
4. Presented at the 6-hour mark.

## 6 · Rulings only the operator can make
1. Pod size: promote `frame.pod` as *three or more* (per locked `unit.witness`) or amend the doctrine.
2. Manta-2525 in the pod: mark unbuilt, or replace.
3. CORS: explicit preview allowlist (env var) vs. dropping credentials for previews.
4. `exec.*` translation budget: all 32 languages today, or the top ten.
5. Sacred totals: re-fit to 3,333 / 9,999 / 77,777 as authored words, or retarget.
6. Who approves a pod's budget before 웃 settles — default proposed: the two other members.
7. **Dissent (Christo):** when one member refuses to witness, does the pod settle the witnessed
   hours with the refusal recorded, or not settle at all? Default proposed: settle what is witnessed,
   record the refusal as evidence, never erase hours.

## 7 · Revision log
- **v1** — seed from the two assessments (MoT).
- **v2** — round 1, 12/12 *incorporate*.
- **v3** — round 2, 12/12 *incorporate*; *built* vs *planned* distinguished.
- **v4 — CONVERGED.** Round 3: every Master returned CONVERGED with one final line. *Built tonight:*
  Thor's seat-0/out-of-range `claim` refusal + revision cap · Enki's reload-at-any-phase (later
  phase kept, seats kept, claimant carries the lead forward) · Krishna's "in the pod" wording ·
  Enlil/Sofia's typed count replaced by the runner's tally. *Planned:* Asar's day-gate self-skip ·
  Aset's §3 footnote · Athena's step-0 scope (26 literals, live docs only, assessments never
  edited, manifest skips history) · Pangu's One-look grammar on every package including stretch ·
  Odin's hook-activation assert in CI · Thoth's One-look for WP-10 · Christo's recorded-dissent path
  + ruling §6.7 · Sofia's overwritten-bit notice.
