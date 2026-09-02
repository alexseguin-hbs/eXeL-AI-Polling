# Gap Assessment — Vision • 2525, Spiral, SSSES, Innovation-2525
### For the Thought Master, from the Master of Thought — 2026.09.02

**Method.** Five parallel assessment cells, each required to prove every claim with `file:line`
or command output, and explicitly forbidden from restating a CLAUDE.md figure as fact. Every
number below is measured against the working tree at `2db637e`, not asserted. Where a cell's
finding was severe, I re-verified it myself; those are marked **[verified]**.

**One-line summary.** The engineering is in better shape than its documentation, but the
*instruments* that are supposed to catch drift have been switched off — a red CI gate, a muted
word-count gate, five gates nothing invokes, and four tables with no migration. Almost nothing
here is "unbuilt"; it is "built and unconnected".

---

## I. Stop-the-line — the deploy pipeline

### 1. The only CI test gate has been red for ~26 days **[verified]**
`deploy.yml:71` runs `npm run test:innovation-time` immediately before Build and Deploy, with
no `continue-on-error`. I ran it: **exit 1**, dozens of `FAIL:` lines, then a hard crash
(`TypeError: Cannot read properties of null` — `innovation-time.test.mjs:3127`).

Cause: 75 assertions read `app/innovation/page.tsx`, which became an 11-line redirect stub on
**2026-08-07** (`242d7fc`) — 2½ hours after the test was last touched (`b136056`, 2026-08-06).

Two possibilities, distinguishable in one look at the Actions tab:
- Green runs since Aug 7 → Cloudflare Workers Builds is deploying directly and **every guard in
  the workflow is being bypassed** (envcheck, the test, the "Compiled successfully" assertion,
  and the "verify live site serves this SHA" step).
- Red/absent runs → the Action has not deployed since Aug 7, which is the exact failure the
  2026-07-29 AAR was written about, recurring.

**Action:** repoint the 75 sites + `innovation-store-security.test.mjs:254` to
`app/SoI-2525/page.tsx`, then triage the real assertion failures behind them.

### 2. Two release gates fail *silently* on the same dead path
`frontend/scripts/pdf-gate.mjs:275` and `frontend/scripts/slide-shots.mjs:88` both read
`app/innovation/page.tsx`. The latter falls back to `""`, so its aspect-drift lock has been
asserting **nothing**. The constant it wants now lives at `app/SoI-2525/page.tsx:1663`.
**Action:** repoint both; assert the extracted block is non-empty so it can never pass vacuously.

### 3. 2,399 backend tests gate nothing **[verified]**
No `pytest` anywhere in `.github/workflows/`. There is no `backend/.venv`, so the claimed
"2,212 passed, 0 failed" is **not reproducible from this repository**.
**Action:** add a `pytest backend/tests` job to `deploy.yml`; commit a `requirements-dev.txt`.

### 4. Four live tables have no migration **[verified]**
`usage_records`, `blockchain_records`, `arx_items`, `arx_transactions` are declared in models
and mounted in routers, but no `create table` exists for them under `supabase/migrations/`.
(Control: `payment_transactions` and `product_feedback` *do* have theirs — the check is sound.)
Eleven mounted endpoints and **all usage metering** would fail against the deployed schema.
**Action:** one migration creating all four with RLS, following the `012_schema_alignment.sql` pattern.

### 5. CORS lets any `*.pages.dev` site make credentialed calls **[verified]**
`backend/app/main.py:96-97` pairs `allow_origin_regex=r"https://.*\.pages\.dev"` with
`allow_credentials=True`. Any attacker-deployed Cloudflare Pages site qualifies.
**Action:** replace the regex with an explicit preview allowlist, or drop credentials for regex origins.

---

## II. Vision • 2525 — the document

**Healthy first:** the replay engine is sound — **9,504/9,504 runs identical across 288 releases**,
no collisions, no orphan ids. `dlrel2` 288 = `VMAX` 288. All four published copies share one md5.
Defect 27 (side-file registers) is closed and stays closed.

### 6. All three sacred totals are short, and the gate is muted
Measured by the gate itself: **brief 3,224** (−109) · **nose 9,786** (−213) · **paper 77,415** (−362).
`lv-gate-vision2525.mjs:1513-1515` uses `console.warn` rather than `fails.push` — soft since r151,
i.e. **137 releases**. The gate exits 0 while three constitutional numbers are wrong.

### 7. `_measure.mjs` contradicts the gate — and it is the tool used for the re-fit
`_measure.mjs:1` claims it "mirrors the gate's SACRED-TOTALS counter exactly." It does not: it
never adopted r272's "a dash is not a word" rule.

| | brief | nose | paper |
|---|---|---|---|
| `_measure.mjs` | 3,251 | 9,808 | **77,847 (over)** |
| gate | 3,224 | 9,786 | **77,415 (under)** |

An author trimming to satisfy `_measure.mjs` moves the gate **further from green**.
**Action:** share one counter between them before attempting the re-fit.

### 8. The Executive Summary view is untranslated in all 32 living-document editions
15 `exec.*` blocks are live at r288, but `vision2525.en.json` holds 172 ids and **zero** `exec.*`
keys; the manifest still says `release: 272`. Real coverage is **172/187 (92%)**. A German reader
opening the Executive Summary view inside `vision-2525.de.html` silently gets English.
*(The standalone exec-summary pages are unaffected — those are fully translated.)*

### 9. The defect register publishes 45 defects against 30 numbered rows
Defects 32, 35, 36, 30, 45, 21, 22 are named in live blocks with no register row; 33, 34, 37–40
appear nowhere. This is defect 43's exact shape, recurring.

### 10. Shipped prose cites defect numbers that do not resolve
`unit.witness` says "logged as defect 13"; `legal.ramp` says "defect 14". The register numbers
those same two faults **11** and **12**. A reader who checks fails — in a document whose thesis
is checkability.

### 11. Two conflicting decision registers run simultaneously
`open.decisions` numbers 1–9; `open.questions` carries a different D1–D13 table. D4 ≠ #4, and
D5–D10 have no counterpart. The White Paper tells the reader there is exactly one.

### 12. The registers claim to be current; five of six are 106–209 releases stale
`open.asks` r79 (209 behind) · `open.external` r79 (209) · `open.decisions` r129 (159) ·
`open.questions` r138 (150) · `open.defects` r138 (150) · `open.proposed` r182 (106).
The live prose promises "that they are current". Two measurable decay symptoms: the register
says "six of twenty sections in band" when the real figure is **13 of 20** (it *understates*
progress), and "twelve readings done" when the gate verifies **252**.

**Still owed, from the registers themselves:** the Constitution (largest external ask, unwritten) ·
11 operator decisions, none ratified · 17 of 22 external review items open · defect 21 (a
read-only endpoint returning any commit's test result — the registers' own answer to "the replay
is checkable, the defects are not").

---

## III. SSSES — claimed vs actual

| Claim | Actual | |
|---|---|---|
| 1,488 test functions / 59 files | **2,399 / 151** | under-reported **[verified]** |
| 109 endpoints | **162** | under-reported |
| 702 lexicon keys | **1,310** | under-reported |
| 34 languages | **33** | over-reported |
| "zero hardcoded English in JSX" | **217–260 violations** | over-reported |
| Auth0 JWT · RBAC · security headers · RLS · `.env` hygiene | present as described | **TRUE** |
| backend functions < 300 LOC | 0 violations | **TRUE** |

**True where it matters most:** `t()` discipline is real in the polling core (dashboard 71 calls /
0 violations; session-view 51 / 0). The failures are confined to newer 2525 surfaces — worst is
`workspace-select.tsx`, the **product entry point**, 100% English with zero `t()` calls.

Other real gaps: rate limiting covers **15 of 162** endpoints and is `memory://` (per-process, so
defeated by >1 worker — directly against the 100k-concurrent target). Frontend violates the
<300 LOC rule 32×, including `session-view.tsx` (1,021 LOC) in the core path.

Weakest cube by evidence: **Cube 3 Voice** — lowest test density, and 17 of its 115 tests are
`skipif`-gated on live API keys, so real offline coverage is ~98.

---

## IV. Spiral protocol

**The spiral is real code, not prose** — 42 cross-cube import sites; the orchestrator genuinely
chains 5→6→7→CQS→11/9 with semaphores and timeouts, and `test_cross_cube_chain.py` asserts the
edges. Cube 7 is the model citizen: its `spiral_propagation` names functions that all resolve.
Notably, the stale "placeholder" comments in `cube5_gateway/service.py:15-16` **undersell working code**.

Gaps: cubes **6, 8, 9, 10 have no `spiral_propagation` at all** — including Cube 10, the simulator
that is supposed to *consume* every other cube's dict. `SPIRAL_METRICS.md` is **432 commits stale**
(last content 2026-04-14). Cubes 7–10 are being simulated without the N=5 baseline `CUBE_10.md:965`
requires. The Lexicon gate is declared MANDATORY with **zero automated enforcement**.

---

## V. Level 2 (cubes 10–18)

| Cube | State |
|---|---|
| 10 Simulation | **REAL** — 9 deterministic harnesses, SHA-256 signature equivalence, 778-LOC frontend wired to 8 endpoints |
| 11–13 Replay/Verify/Baseline | **SCAFFOLD** — determinism + baseline-compare real; `replay_service.py` only *previews*, never replays |
| 14 Payments | **REAL** — production-grade Stripe, idempotent webhooks, 114 tests — but see below |
| 15 Tokenization | **DOC-ONLY** — cross-chain conversion does not exist in any form |
| 16 Atlantis Accords | **REAL (frontend-only)** — 7 sections × 5 tiers × 33 languages, all 999-tier translations present |
| 17 Blockchain Quai/QI | **SCAFFOLD** — no `quais`, no `web3`, no `.sol`; submission commented out; its own README says "DO NOT CODE" |
| 18 ARX | **SCAFFOLD** — solid DB provenance registry; token ids from a local counter, not a chain |

**The highest value-per-line fix in the whole system:** `create_usage_billing_checkout` is real,
tested Stripe code that **no route calls** — it is unreachable over HTTP **[verified]**. Combined
with the missing `usage_records` migration (§I.4), one migration plus ~10 router lines converts an
already-built, already-tested metering stack into the platform's first revenue path.

Also: `backend/app/routers/feedback.py` — the full feedback trio incl. anonymous POST and the CRS
auto-tagger — is **never imported in `main.py`** **[verified]**. The mounted Cube-10 replacement
requires auth, so anonymous feedback (the stated point) is impossible on the live path.

---

## VI. Innovation-2525 (Level 3) — what needs updating

**1 of 9 cubes built (11%).** Only **Cube 23 De-Risk Gateway** exists (`frontend/lib/2525-core/derisk.ts`)
— and it is genuinely excellent: pure, deterministic, domain-neutral, with phase-skip made
*unexpressible* rather than merely forbidden, and a test that executes the engine rather than
grepping source. No code, schema, route or test exists for cubes **19, 20, 22, 25, 26, 27**.

Needs updating:
- **Cube 23 is shipped but every status surface says "planned / 0%"** (`cube-status.tsx:96`, CLAUDE.md).
- **`/innovation` retired to `/SoI-2525`** but 6 docs still route readers to the dead URL, and
  CLAUDE.md still names `app/innovation/page.tsx` as the Innovation app.
- **`MANIFEST.md` omits `derisk`** — the one module the core actually gained.
- **Manta-2525 and Drone-2525 do not exist** — no file anywhere — yet both are cited as live
  domains in `cube-status.tsx:80` and CLAUDE.md, and the framework calls their joint swarm "the
  substrate's most-complex validation".
- **Celestial-2525 is shipped** (routes, components, 33 language packs) and **no Level-3 doc
  acknowledges it**.
- The SoI-2525 app is large, real and well-tested — but it implements its own G1–G7 gate ladder
  and **never imports the substrate**; it is not the Level-3 surface it is assumed to be.
- `Architect-2525` vs `Architecture-2525` naming split; "Level 3" now means four different things.

**Healthy:** `cube-status.tsx`'s Level-3 grid is a byte-accurate rendering of the framework —
names, numbering and coordinates all match. Only the `status` field is stale.

---

## VII. Recommended order

1. **Un-block the pipeline** — repoint the dead test path, triage the failures, confirm whether
   the Action or Cloudflare is deploying. Nothing else is safe to ship until this is known.
2. **One migration** for the four orphan tables; **one route** for usage billing. Smallest change
   with the largest product consequence.
3. **Close the CORS hole**; widen rate limiting beyond 15 endpoints.
4. **Add `pytest` to CI** so the 2,399 tests defend something.
5. **Fix `_measure.mjs` to agree with the gate**, then do the 109/213/362-word re-fit and restore
   the hard sacred-totals gate.
6. **Refresh the six registers** in one release; add a gate that fails when a register falls more
   than N releases behind VMAX.
7. Extract `exec.*` into the living-document i18n and translate the 15 blocks.
8. Correct the Level-3 status surfaces (Cube 23), the dead `/innovation` pointers, and the
   Manta/Drone/Celestial claims.

## What I could not verify
- The live site or the GitHub Actions history — the sandbox proxy 403s every host.
- Backend test pass/fail counts — no venv, no pytest importable. All test figures are static counts.
- Whether shipped language pages were regenerated after the exec blocks landed (`docs/i18n/build/`
  is gitignored and holds only August artefacts).
