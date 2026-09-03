# Night Plan v3 — fix every gap-assessment item · 12-hour execution day
### Master of Thought, for the Thought Master · seed 2026.09.03 · revised by the Twelve until converged

**Inputs.** `docs/assessments/2026-09-02_gap_assessment.md` (five cells, every claim `file:line`-proven)
and `docs/assessments/2026-09-03_soi_session_vs_vision2525.md`. Nothing below is planned from
memory; each work package names the evidence it answers. **Two vocabularies, never confused:**
*planned* means the package text describes it; *built tonight* means it is committed and its gate
runs (Enlil, round 2).

**Ground rules that bind every package.** PERSIST FIRST (a decision is a file before it is a plan).
A new edition is an append, never an edit (`replay()` reads the last entry at or below a release).
Commit + push after each package; both branches; `ls-remote` proof; three-state deploy line on every
update. Rule 6: no UI removed or restyled without a ruling. NO REWORK: grep-verify before opening code.
Every package states its SSSES impact, its spiral trace (forward N→10, backward 10→N), and its
**One-look:** — the single command or glance that proves it done. `day-gate.mjs` reads those
One-look lines from this file and runs them (Pangu); a package with none cannot ship.

---

## 1 · The day in order

| # | Package | Answers | Est. | Why here |
|---|---|---|---|---|
| WP-01 | **Un-block the deploy pipeline** (+ step 0: retire dead doc paths, + write `day-gate.mjs`) | §I.1, §I.2 | 1.75h | Nothing else is safe to ship until we know whether the Action deploys or Cloudflare bypasses every guard. The acceptance gate is written HERE so it exists on the failure path (Asar). |
| WP-04 | **pytest in CI + parity gate + checkable results** | §I.3, defect 21 | 1.0h | The 2,399 tests must gate WP-02/03's backend edits, not follow them (Athena). |
| WP-02 | **Apply migration 035; one route** | §I.4, §V | 0.75h | *035 built tonight — nine tables, parity 0 orphans.* The route makes metering → billing reachable. |
| WP-03 | **Close CORS; widen rate limiting** | §I.5, §III | 1.0h | Real exposure today. |
| WP-05 | **One word-counter; sacred re-fit; hard gate — and a gate that runs** | §II.6–7 | 2.0h | Largest content task; the counter must be shared BEFORE anyone trims, and the gate must be invoked. |
| WP-06 | **Registers: generated facts, one refresh, drift gate** | §II.9–12 | 1.5h | Hand-copied numbers are the mechanism of the decay; generate them. |
| WP-07 | **`exec.*` into living-doc i18n** | §II.8 | 1.0h | 15 blocks × 32 languages — extraction + rebuild today; translation via the small-batch fleet. |
| WP-09 | **Mount the feedback router** | §V | 0.5h | Dead code that restores anonymous feedback; namespace the `/feedback` collision. |
| WP-11a | **Cube 10 `spiral_propagation`** | §IV | 0.25h | The simulator is the consumer of every other cube's dict; the day's backward trace needs it. |
| WP-12 | **Pod: rulings, persistence, budget gate** | soi-session assessment + rounds 1–2 | 1.0h | *Isolation, trust, continuity, revision, presence, lagged phone — built tonight, 62 assertions.* Day: rulings, `pod_sessions` hook, `budgetApprovedBy`. |
| WP-13 | **Acceptance — `day-gate.mjs` green** | Asar, Aset, Pangu | 0.25h | Runs after every package and on halt; the day is done when it is green or every red row names a ruling. |
| *stretch* WP-08 | Level-3 status surfaces (code half) | §VI | 0.35h | The doc half moved into WP-01 step 0. SSSES: Succinctness +5. Spiral: none (documentation). |
| *stretch* WP-10 | Lexicon gate (measured baseline + ratchet) + entry point | §III | 1.0h | `workspace-select.tsx` is the front door at 100% English. SSSES: Stability +10. Spiral: none. |
| *stretch* WP-11b | Spiral records for cubes 6/8/9 + SPIRAL_METRICS | §IV | 0.75h | SSSES: Succinctness +5. Spiral: this IS the record. |

Committed day ≈ 11.0h; stretch ≈ 2.1h. One commit per package with its own three-state line; the
day halts at any red gate — and `day-gate.mjs` prints the table at the halt, so what was done is
never lost on the failure path.

## 2 · Packages in detail

**WP-01 Un-block the pipeline.** *Step 0 (Athena):* rewrite the ten `/innovation` and
`app/innovation/page.tsx` literals in `docs/**` to `/SoI-2525` — BEFORE the path-manifest gate exists,
or the gate goes red at hour 1.5 and halts everything behind it. *Step 1:* repoint 75 sites in
`tests/innovation-time.test.mjs` + `innovation-store-security.test.mjs:254` and the two gates
(`scripts/pdf-gate.mjs:275`, `scripts/slide-shots.mjs:88`); assert the extracted block is non-empty so
neither gate passes vacuously; triage the real failures behind the path. *Step 2 (Odin):* extend
`frontend/scripts/integrity-guard.mjs` (run by `prebuild`/`predev`, so unbypassable) with a path
manifest — every `app/**/page.tsx` literal in `frontend/scripts/*.mjs`, `frontend/tests/*.mjs` and
`../docs/**/*.md` (npm's cwd is `frontend`, so the docs arm needs `../docs` or it scans nothing) must
exist and not be a redirect stub; **assert ≥1 file matched** so an empty walk cannot pass. *Step 3
(Asar):* write `scripts/day-gate.mjs` now — it parses this file's `One-look:` lines, runs each, prints
PASS / FAIL / BLOCKED-ON-RULING with SHA and `ls-remote`, sums SSSES per pillar from the package lines
and FAILS if §3's pillar rows do not name exactly the packages that score them (Aset). At hour 0 it
exits non-zero — that is its own proof.
One-look: `npm run test:innovation-time` exits 0 · the Actions tab (green since Aug 7 = Cloudflare
bypasses the workflow; red = no Action deploy since Aug 7).
SSSES: Stability +30. Spiral: backward 10→1 (Cube 10 replay depends on this test running).

**WP-04 pytest in CI + parity + checkable results.** `requirements-dev.txt`; a `pytest backend/tests
-q --junitxml` job in `deploy.yml` before Build; in the same job, `working-directory: .` (the job
defaults pin `frontend`) run `node scripts/verify-migrations-vs-models.mjs` and assert it printed
≥1 model table (Odin). Then (Sofia) commit the run summary to `docs/ci/test-results/<sha>.json` and
expose one documented read-only URL per commit — defect 21, the registers' own answer to the
external reviewers' "the replay is checkable, the defects are not"; WP-06 cites it as closure.
One-look: CI green · `docs/ci/test-results/<HEAD sha>.json` exists.
SSSES: Stability +20, Security +5. Spiral: backward 10→1 (Cube 12 Verify's CI premise becomes real).

**WP-02 Apply 035; one route.** *Built tonight:* `supabase/migrations/035_orphan_tables_pod.sql` —
**nine** tables: the four from the assessment (`usage_records`, `blockchain_records`, `arx_items`,
`arx_transactions`), the four the new parity gate then found (`api_keys`, `projects`,
`differentiators`, `specifications` — the API-key and scoping features CLAUDE.md calls implemented),
and `pod_sessions`; every statement idempotent (Enki), RLS `service_role`-only in the
`012_schema_alignment` pattern, indexes on the query paths. `scripts/verify-migrations-vs-models.mjs`
now prints `0 orphan(s)` and runs in `.githooks/pre-commit`. *Day:* the operator applies 035; add
`POST /sessions/{id}/payments/usage-billing` in `cube8_tokens/router.py` calling the existing, tested
`create_usage_billing_checkout`.
One-look: `node scripts/verify-migrations-vs-models.mjs; echo $?` prints 0 · the route appears in
`/api/v1/docs`. SSSES: Security +10, Scalability +10. Spiral: forward 5→8→14 closes.

**WP-03 CORS + rate limiting.** Replace `allow_origin_regex=".*\.pages\.dev"` with an explicit preview
allowlist from an env var (ruling §6.3); router-level default limits for cubes 4–11; `storage_uri` off
`memory://` behind a flag. One-look: `test_cors.py` refuses a `*.pages.dev` origin with credentials
and admits the allowlisted preview. SSSES: Security +20. Spiral: none (perimeter).

**WP-05 Word counter → re-fit → hard gate that runs.** *Enlil:* `wcount` is a closure serialised
into `p.evaluate()` and the gate file has no exports — extract it to `scripts/lib/wcount.mjs`; both
`lv-gate` and `_measure.mjs` inject it via `p.evaluate(fn, src)` (recreate `_measure.mjs` — it is not
on disk). *Thoth:* the views overlap, so **author 362 words total, not 684:** 109 into `brief.*`, 213
into `paper.s1–s19` (scores nose AND paper), 40 into paper-only blocks; `nose.s0/c/close/author`
untouched; re-measure all three totals after every insertion. Counter-first `L(289,…)` supersedes
only. Then flip `lv-gate:1513-1515` to `fails.push` and **add `node scripts/lv-gate-vision2525.mjs` to
`deploy.yml` after Test — nothing invokes the gate today.** One-look: `_measure.mjs` and the gate
print the same three numbers, all exact. SSSES: Efficiency +10, Succinctness +15. Spiral: none.

**WP-06 Registers — generate, refresh, gate drift.** *Pangu:* the registers hand-copy numbers the gate
already computes (`lv-gate:1317-1342`). `scripts/registers-emit.mjs` emits the numeric spans from
those facts; the gate diffs generated vs shipped. Then one release superseding all six `open.*`
blocks: reconcile the two decision numberings (both kept as aliases), backfill or explain defect rows
13/14/21/22/30/32/35/36/45, fix the `defect 13/14` cross-refs, cite WP-04's results URL as defect
21's closure. One-look: gate prints `registers: generated == shipped`. SSSES: Stability +15.
Spiral: none.

**WP-07 exec.\* i18n.** Re-run `vision2525-i18n-extract.mjs` at r288 (187 ids); rebuild 32 pages;
translate the 15 `exec.*` blocks one language per commit; an untranslated block falls back to English
*with a visible notice*. One-look: manifest `blockCount: 187`; a rebuilt page's `I18N_MAP` carries
`exec.*`. SSSES: Stability +10. Spiral: none.

**WP-09 Feedback router.** `include_router(routers.feedback)` under a distinct prefix; keep Cube 10's
pair. One-look: `POST /feedback` without a token returns 201. SSSES: Stability +10. Spiral: forward
— FB at Cube 10's centre becomes real.

**WP-11a Cube 10 spiral record.** `backend/tests/cube10/test_e2e_flows.py` with a conforming
`CUBE10_TEST_METHOD` + `spiral_propagation`. One-look: the dict imports; both directions non-empty.
SSSES: Succinctness +5. Spiral: this IS the backward record.

**WP-12 Pod.** *Built tonight in `lib/pod-roster.ts` + `tests/soi-pod-sim.test.mjs` (62 assertions,
all green):* phases travel inside the `pod` envelope and a live poll on the same channel is proven
not to move, nor is the pod moved by the poll's frames (Krishna); the lead is pinned on the first
roster; `member` patches are own-seat only and may not carry witness bits; attestations are one
`attest` message setting only the reviewer's own index; the pod code is from `crypto.getRandomValues`
(Thor); **rosters carry a revision** — a newer one applies verbatim so clears, withdrawals and resets
propagate, an older one (a reloaded lead) merges and the joiners re-claim their chairs with the
revision they last saw (Enki); a stale phase can never rewind the pod and a held forward move lands
(Sofia); the pod counts its roster, not the channel's presence (Krishna); the witness floor is two
OTHERS and lives only in the library — the page imports it, and a four-seat pod proves it does not
scale with size (Christo). *Day:* rulings §6.1/§6.2/§6.6; `pod_sessions` persistence via the Cube 5
time-tracking hook; **`budgetApprovedBy` mirroring `witnessedBy` with the two-other-member rule until
§6.6 is ruled**, and the sim extended through approval → settle; remaining ~60 strings through `t()`.
One-look: `npm run test:soi-pod-sim` green; a closed pod has a `pod_sessions` row.
SSSES: Security +20, Stability +25. Spiral: forward pod→5→8→6→9; backward 10 replays a recorded pod.

**WP-13 Acceptance.** `scripts/day-gate.mjs` (written in WP-01, run after every package and on halt)
is green, or every red row names a ruling. One-look: `node scripts/day-gate.mjs` exits 0.
SSSES: Stability +10. Spiral: none (gate).

*Stretch.* **WP-08** Level-3 code half: `cube-status.tsx:96` Cube 23 real status; `MANIFEST.md` +
`derisk`; Manta/Drone *specified, unbuilt*; Celestial acknowledged; `Architect-2525` spelling; admit
`docs/**` to the manifest gate. **WP-10** `lexicon-gate.mjs --count` on HEAD writes
`docs/ci/lexicon-baseline.json {count, sha, scope}` — the baseline is measured, never typed (the
assessment's own cells disagreed, 217 vs 260); fail only on increase; wrap `workspace-select.tsx`.
**WP-11b** `spiral_propagation` for cubes 6/8/9; register `CUBE_7_METRICS_BASELINE.md`; fix Cube 1's
string-shaped dict and the `tests/cubeN` path in CLAUDE.md.

## 3 · SSSES test plan (each row names exactly the packages that score it — day-gate checks this)
- **Security** — WP-02, WP-03, WP-04, WP-12.
- **Stability** — WP-01, WP-04, WP-06, WP-07, WP-09, WP-12, WP-13, (stretch WP-10).
- **Scalability** — WP-02; and WP-03's limiter storage off `memory://` (scored under Security above).
- **Efficiency** — WP-05.
- **Succinctness** — WP-05, WP-11a, (stretch WP-08, WP-11b).

## 4 · SPIRAL test plan
Every package carries a forward and backward trace (or "none" with the reason). The reference
spiral is the pod: forward pod → Cube 5 → Cube 8 → Cube 6 → Cube 9 → Cube 10; backward — Cube 10
replays a recorded pod and reproduces the same settlement and synthesis. Tonight's simulation asserts
exactly that; WP-11a gives Cube 10 the record the ground rules demand.

## 5 · Tonight, autonomous — status
1. Plan persisted; **round 1 incorporated (12/12); round 2 incorporated (12/12)**; round 3 running.
2. **Pod simulation + SPIRAL test — built, 62 assertions green** (see WP-12).
3. **Supabase — built:** migration 035 (nine tables, idempotent, RLS, indexes);
   `verify-migrations-vs-models.mjs` at 0 orphans and in pre-commit.
4. Present at the 6-hour mark.

## 6 · Rulings only the operator can make
1. Pod size: promote `frame.pod` as *three or more* (per locked `unit.witness`) or amend the doctrine.
2. Manta-2525 in the pod: mark unbuilt, or replace.
3. CORS: explicit preview allowlist (env var) vs. dropping credentials for previews.
4. `exec.*` translation budget: all 32 languages today, or the top ten.
5. Sacred totals: re-fit to 3,333 / 9,999 / 77,777 as authored words, or retarget.
6. Who approves a pod's budget before 웃 settles — default proposed: the two other members.

## 7 · Revision log
- **v1** — seed from the two assessments (MoT).
- **v2** — round 1, 12/12 *incorporate* (see v2's log for the twelve changes).
- **v3** — round 2, 12/12 *incorporate*. *Built tonight:* Enki's roster revision + reset/withdrawal
  propagation · Thor's witness-array forgery closed (attestations one bit, `member` may not carry
  `witnessedBy`) · Krishna's poll→pod leak closed (presence from the roster; hostile frames asserted)
  · Sofia's lagged phone (stale phase never rewinds; held forward lands; reversed attestations
  converge on the lead's roster) · Christo's floor-from-the-library + four-seat pod · Enlil's four
  extra orphan tables in 035, parity at 0 · Odin's parity gate in pre-commit. *Planned into the
  day:* Asar's day-gate written in WP-01 and run on every package/halt · Aset's SSSES lines on
  WP-13 + stretch and §3 aligned to the packages with a pillar-sum check · Athena's step 0 (dead doc
  paths before the manifest gate) · Odin's `../docs` cwd + deploy.yml parity step · Pangu's day-gate
  parsing One-look lines · Thoth's measured lexicon baseline · Christo's `budgetApprovedBy`. Enlil's
  correction adopted: the log now distinguishes *planned* from *built*.
