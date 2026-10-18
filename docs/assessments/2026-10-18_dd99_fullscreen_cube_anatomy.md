# DD-99 — the full-screen cube, measured: nothing is missing, and he still could not check

**His words (operator, 2026-10-18, with shot91):**

> Also full screen should have option to highlight 9.1-all sub blocks to make sure all 3x3x3 is not missing

**His follow-on rule (D-39, when asked how a hole should look — he rejected the premise):**

> the 3x blocks should always cover all 27 blocks, just like legos; shapes and now 3 sections cover 27 sub
> cubes within larger blocks is many (you must decide and ensure all 27 are filled each time

## The headline, in one line

**Nothing is missing — and he was still right to ask**, because the full-screen view gives him no way to
check, and the gate that would catch a future hole does not cover the block counts he actually sees.

Produced by a five-dimension read-only measurement (26 agents; every blocking claim put to three
independent refuters, one overturned and the correction carried below). Run `wf_4cbbfe4c-169`.
**LIVE is NOT MEASURED** — the sandbox proxy 403s every host, so this describes the code that builds the
page, never what his phone fetched.

---

# THE FULL-SCREEN CUBE — ANATOMY

> Measured at the repo working tree. **Tree note:** the task names HEAD `44fa9c36d`; actual HEAD is `276212ac6`. `git diff 44fa9c36d HEAD` is EMPTY for every file cited below (`cube-dev-sim.tsx`, `cube-voxel-3d.tsx`, `sim-sections.ts`, `mock-data.ts`, `sections.py`, `test_sections.py`, `sim-partition-parity.test.mjs`), so the line numbers hold at either commit. **LIVE is NOT MEASURED** — the sandbox proxy 403s every host, so nothing here is a statement about what your phone fetched, only about the code that builds it.

---

## 1. WHAT THE FULL-SCREEN CUBE IS TODAY

**Component.** It is the `voxelMax` pop-out inside `CubeDevSim` — `frontend/components/cube-dev-sim.tsx:347-362`. State at `:81`, opened by the ⤢ (Maximize2) button on the small cube at `:322-325`, closed at `:355`. The overlay itself is `:348`: `fixed inset-0 z-50 … bg-background/95 … backdrop-blur`. Mounted at `frontend/app/sim/page.tsx:119`; easter-egg gate expression at `app/sim/page.tsx:35` (redirect `:38-42`, bail `:73`).

**Your header** is `:350`: `CUBE {cube_id} · {name} · {nSections} BLOCKS`. That string exists nowhere else in the repo — the small cube's caption at `:331` is lowercase and carries no count, so the screenshot is unambiguously this overlay. `nSections = sections.length` (`:136`); Cube 9's 8 comes from `frontend/lib/mock-data.ts:993` `_DEF = {1:6, 2:8, 3:7, 4:8, 5:7, 6:7, 7:8, 8:7, 9:8}`, which mirrors the backend counting the cube's real functions (`backend/app/cubes/cube10_simulation/router.py:384-390`).

**Controls, exhaustively** (`:349-357` is the entire bar):
1. Explode / assemble — `:351-353`
2. Drag/zoom hint text — `:354`
3. Exit — `:355-356`
4. Camera gestures (orbit, pinch, wheel) — not buttons; `cube-voxel-3d.tsx:45-48`, `:145`

There is **no block selector and no ALL** anywhere in the overlay. The 9.1…9.8 chip strip exists — `cube-dev-sim.tsx:299-311` — but it is a static element and the overlay is `z-50`, so the overlay paints over it and swallows its taps. (Cause is stacking order, not source order.) **In full screen you cannot change the lit block at all; you must Exit first.** That is exactly the hole your ask names.

**What "lit" means.** One line decides it: `cube-voxel-3d.tsx:129` — `lit.has(i) ? ["ff","dd","bb",1] : rest`. The SIM passes no `rest`, so unlit cells take the default `REST_SEE_THROUGH = ["2e","1e","14",0.42]` (`:37`, `:41`). Effective face fills: **lit 100% / 86.7% / 73.3% · unlit 7.6% / 4.9% / 3.3%.** The 1px border is what survives — your "faint outlined grid."

**What is lit.** `litCells` is exactly ONE block — the selected one: `cube-dev-sim.tsx:131-134`, `new Set(activeSection?.highlight?.["9"] ?? [])`, `FULL = 9` at `:61`, `activeSection` at `:130`. Never a union. The same object feeds the small cube (`:321`) and the full-screen cube (`:359`).

**Two shapes, not one.** Assembled draws all 27 cells (`cube-voxel-3d.tsx:126`, hardcoded `i < 27`). Exploded draws **one uniform cube per BLOCK** (`:105-122`, `blockCell = cell * 1.7` at `:111`) — a 2-cell block and a 4-cell block render the same size. **Explode therefore cannot answer your question**; it cannot show a missing cell.

**Scope limit.** Only Cubes 1-9 have a SIM contract. The picker is `cubeGridOrder(1)` (`cube-dev-sim.tsx:280-281`), `/sim/cubes` serves ids 1-9, and anything else is refused `"cube_id must be 1-9"` (`mock-data.ts:1002-1003`; `router.py:189/442`). For Cubes 10-27 the pop-out never renders.

---

## 2. THE COVERAGE NUMBERS

**HEADLINE: nothing is missing. Every cube the SIM serves tiles all 27 cells exactly once — zero holes, zero duplicates, at every cube's live block count.**

| cube | blocks | distinct cells | unclaimed | double-claimed |
|---|---|---|---|---|
| 1 | 6 | 27 | 0 | 0 |
| 2 | 8 | 27 | 0 | 0 |
| 3 | 7 | 27 | 0 | 0 |
| 4 | 8 | 27 | 0 | 0 |
| 5 | 7 | 27 | 0 | 0 |
| 6 | 7 | 27 | 0 | 0 |
| 7 | 8 | 27 | 0 | 0 |
| 8 | 7 | 27 | 0 | 0 |
| **9** | **8** | **27** | **0** | **0** |
| 10-27 | — | — | — | — |

Cubes **10-27 have no SIM contract at all** (`sections.py:39-94` holds keys 1-9; `:292-293` returns `[]`; `mock-data.ts:788-807` the same). They are **absent, not holey** — there is no 3×3×3 there to prove whole, and your check cannot be run on them without first widening `/sim/cubes` and the Level-1-only picker.

**Cube 9's eight blocks** (identical in the Python and in the JS the LIVE mock renders):

| code | cells | n |
|---|---|---|
| 9.1 | 0, 1, 3, 4 | 4 |
| 9.2 | 2, 10, 11, 19 | 4 |
| 9.3 | 5, 7, 8 | 3 |
| 9.4 | 6, 15 | 2 |
| 9.5 | 9, 12, 18, 21 | 4 |
| 9.6 | 13, 20, 22, 23 | 4 |
| 9.7 | 14, 17, 26 | 3 |
| 9.8 | 16, 24, 25 | 3 |

4+4+3+2+4+4+3+3 = **27**, union = 0…26, missing `[]`.

Commands: `node --experimental-strip-types` over `partitionSections` (frontend/lib/sim-sections.ts) and `python3 -I` importing `sections_for` (backend). Swept **all 234 cases** (9 cubes × n=2..27): *coverage failures 0 · face-connectivity failures 0 · empty-block failures 0*, and **JS == Python in all 234**. A wider sweep of the partitioner alone (27 seeds × 26 counts = 676) was also clean on both sides.

**A small block is not a hole.** 9.4 owns two cells by design.

---

## 3. WHY CUBE 9 SHOWED THREE LIT CELLS

By design, exactly one block is lit at a time, and the other 23 cells are drawn at **7.6% top-face alpha** — that is the faint lattice, not emptiness. Your screenshot's lit block is **9.6**, proven by pixel: the lit faces are exactly `#4dabf7`, which is `BLOCK_PAL[5]` (`cube-voxel-3d.tsx:16-17`), 67,992 exact-match pixels and **zero** pixels of any other palette colour anywhere in the image; block index 5 → code `9.6`. 9.6 owns **four** cells, `[13, 20, 22, 23]` — and cell 13 is `(1,1,1)`, the fully enclosed centre of the 3×3×3, which can never show a face from any camera angle. So a four-cell block legitimately presents at most three visible faces. Nothing is missing.

Two honesty notes. The word "three" is the session's reading of the picture, not yours — your ask carries no number. And on the glass the blue actually resolves into **two joined masses** (connected regions of ~93k / 19k / 6.7k / 0.6k px), not three columns; **whether all four cells are painted is NOT MEASURED**, because the camera was dragged off its defaults and could not be reconstructed. Also: the default selection is `sections[0]` = 9.1 (`:116`), so 9.6 means a chip was tapped — by what route is not recoverable from the code.

---

## 4. WHAT YOUR CONTROL WOULD BE

**The smallest change: render the chip strip you already have inside the overlay, and give it one extra position.**

**REUSED — already exists, do not rebuild:**

| What | Where |
|---|---|
| The 9.1…9.8 chip strip itself (wrap layout, selected chip in SI, mono code label, compact style when >9 blocks) | `cube-dev-sim.tsx:299-311` |
| `sectionKey` / `setSectionKey` — component-scope state, settable from inside the overlay with no lifting | `:70`, written at `:302` |
| `litCells` — the ONE derivation feeding every cube instance (`:321`, `:359`, `:538`, `:543`). ALL is one branch here | `:131-134` |
| `sectionCodes` — the "9.1"…"9.8" labels, already computed and already passed into the full-screen cube | `:144`, passed at `:359` |
| `blockOf` — maps every covered cell to its block; its complement over 0…26 **is** the hole set, three lines, no new data | `:138-142` |
| The verdict line `— {litCells.size} cubes ON` | `:337-341` |
| The lit/unlit ternary + per-block colour — **no renderer change, no new prop** | `cube-voxel-3d.tsx:129-130` |
| `BLOCK_PAL` / `blockColor` — 27 distinct hues, so under ALL each sub-block already reads as its own colour | `cube-voxel-3d.tsx:16-26` |
| `REST_SOLID_ENOUGH` (43%/29%/20%) if unlit must stay readable; precedent caller already passes its own `rest` | `cube-voxel-3d.tsx:38`; `rcore-code-view.tsx:126-127` |
| Backend already means "whole cube" by `section=None` → `range(27)` — a naming to align with, not a call you need | `sections.py:219-232` |

**NEW — genuinely does not exist:**
1. **Extraction.** `:299-311` is literal inline JSX, not a function or component, so it cannot be rendered twice without being pulled out once. This is the only structural work.
2. **The ALL position** — one extra chip and one branch in `litCells`.
3. **A `data-*` hook on the overlay.** It has none (`data-sim-voxel` at `:320` is on the small cube), so `frontend/scripts/cube-sim-live-check.mjs` cannot reach it.
4. **Lexicon keys** for the new label, staged in `AFTER_FILL` (`lexicon-coverage.test.mjs:19`). Note the neighbours are already in debt: "Explode" and "Exit" are hardcoded English at `:335`, `:353`, `:356`.

**What ALL should light — the one real design decision.** Your semantics ("a cell still dark under ALL is a hole") means ALL = **the union of `sections[].highlight["9"]`**, so an unowned cell stays dark and reads as a gap. Measured consequence, stated plainly: that union is **always exactly 27 today**, for all nine cubes — so the control would be an always-green live assurance, not a bug-finder. The alternative, lighting all 27 unconditionally, gives the solid DD-93 lego picture but **cannot distinguish an owned cell from an unowned one**. These are two different instruments; you have not chosen between them and I have not guessed.

**Blocking limit either way:** in the assembled view with all 27 solid at opacity 1, **cell 13 (the centre) is enclosed by the other 26 and is never visible from any angle.** ALL proves the 26 outer cells. Explode is not the escape hatch — it collapses each block to one uniform cube.

**Gates that constrain the implementation (these go red if ignored):**
- `cube-sim-live.test.mjs:88` + `:93` — `default_sections` must equal the baked function count and `sections.length` must equal it. **ALL must be a UI position, never a 9th section in the contract.**
- `cube-sim-live.test.mjs:100` — section fields pinned to exactly `[key, code, label, functions, highlight, io]`. No new contract field.
- `cube-grid.test.mjs:68-70` — greps all of `cube-dev-sim.tsx` for `lg:grid-cols-9|sm:grid-cols-5`. Don't write a 9-across row with those classes.
- `rcore-code-record.test.mjs:326-330` — pins the `REST_SEE_THROUGH` literal **and** that it stays the default. Change *which cells are lit*, or pass a per-caller `rest`; do not retune the alpha.
- `ci-wiring.test.mjs:27/:35/:45` — a new npm script must be declared and wired.

---

## 5. WHAT A GATE WOULD HAVE TO HOLD

Three separate things, and they are in three different states.

**(a) The partition tiles 27 — GATED, Python side, completely.** `backend/tests/cube10/test_sections.py:123-133`: cubes 1-9 × every count 2..27, asserting `len(groups) == n`, `assert g, "empty block"`, face-connected, and `sorted(seen) == list(range(27))` (which proves no hole AND no overlap). Ship-blocking — `.github/workflows/deploy.yml:174`, with `:198-200` stating a red backend suite stops the deploy. *NOT MEASURED as a run:* no pytest and no venv in this container; the test body was reproduced by importing `sections.py` directly — 234 cases, 0 failures.

**(b) The JS mirror your phone actually renders — GATED, but NOT at the counts you see.** `MOCK_MODE` defaults true (`frontend/lib/api.ts:10`; no setter anywhere in the repo, and `deploy.yml:237-245` does not pass it), so the SIM is served by `mock-data.ts` → `sim-sections.ts`. The gate is `frontend/tests/sim-partition-parity.test.mjs` — and **both** of its assertions are pinned to n ∈ {2, 3, 4, 6, 9, 27}: the oracle loop at `:26-33` (fixture holds exactly 54 keys = 9 cubes × those 6 counts; `export_partition_oracle.py:16`) and the coverage/connectivity loop at `:50-55`. Live defaults are 6, 7, 8 — **only Cube 1 coincides. Cube 9 at n=8, the cube in your screenshot, has neither a parity lock nor a 27-coverage assertion.** It is correct today (measured above) but nothing would catch it breaking. Fix: widen `COUNTS` in `export_partition_oracle.py:16` and the list at `:50`; the fixture must be regenerated because `:33` asserts `entries === Object.keys(oracle).length`. Separately: **that oracle has no freshness gate** (the SSSES oracle does, `test_ssses_drift_alarm.py:30-37`) — it is fresh at HEAD, but by luck.

**(c) The thing your control actually shows — the LIT SET — has NO GATE AT ALL.** No test anywhere references `voxelMax` or the overlay (`grep -rn "voxelMax" --include=*.mjs` → zero test hits). `cube-sim-live.test.mjs:103` asserts only that *each block* lights ≥1 voxel — every block can be non-empty while the union is 25 or 29. And **a hole would be invisible even if it existed**: `cube-dev-sim.tsx:138-142` builds `blockOf` as `new Array(27).fill(0)`, so an unowned cell is painted in block 9.1's colour rather than showing as a gap (`cube-voxel-3d.tsx:127-130`). That is precisely why the dark/bright reading of an ALL position is the right instrument — it does not depend on `blockOf`.

**A DD-99 gate would have to hold:** for every cube at its **real default count**, the union of `highlight["9"]` across all sections equals 0…26 exactly once (that is the set ALL lights), plus a source/DOM assertion that the overlay renders `nSections + 1` positions and that the ALL position's lit size is 27. Natural host: `frontend/tests/sim-live-source.test.mjs` (`:12/:19/:26` already opens every cube at its real default), or extend `sim-partition-parity.test.mjs:50`. It would be **green at birth** — a guard, not a fix.

**Do not mistake this for a gate on it:** `frontend/tests/cube-partitions.test.mjs:21-32` does walk N=1..27 proving sum-to-27 and connectivity — but of `docs/vision-2525/reference/cube-partitions.js`, a different (boustrophedon) partitioner that no app code imports, and it is in `test:all`, **not** `test:ci`.

---

## 6. WHAT IS STILL NOT MEASURED

- **The LIVE site.** Proxy 403s every host. Everything above is repo-only. Deploy state: **UNVERIFIED** from here — https://exel-ai-polling.explore-096.workers.dev
- **Whether all four cells of 9.6 are painted on the glass.** The blue resolves into two joined masses; camera bearing/pitch/zoom were dragged off defaults and could not be fitted. Area (≈119k px vs a ~29k px single-cube silhouette) is closer to four than three, but that is support, not proof.
- **How you got to 9.6.** Default is 9.1; the route is not in the code.
- **Whether the overlay is scroll-locked or the chips are reachable by any gesture.** Established from the stacking rules and by reading `:348` — no runtime check was run.
- **Three test files could not be EXECUTED:** `cube-sim-live.test.mjs` and `sim-live-source.test.mjs` (frontend `node_modules` absent — `@supabase/supabase-js` missing) and the backend pytest suite. Their assertions are quoted from source, not from a green run. `sim-partition-parity` and `cube-partitions` **did** run (3/3 passed).
- **The degenerate case:** an empty `contract.sections` would render "0 BLOCKS" over a wholly faint lattice. Read, not run; no fixture exercises it.
- **Two decisions are yours and were not guessed:** (i) stepper (one position at a time) vs a strip with an extra ALL chip; (ii) whether an uncovered cell under ALL is shown as a dark cell, named in words, or both — i.e. which of the two instruments in §4 you want. Also open: whether the small inline cube gets the same control (you said "full screen").
- **One place a union under 27 is CORRECT and must not be asserted against:** the curated `count == 4` path, where levels 3 and 6 deliberately truncate each block (`sections.py:219-232`). It is unreachable from the current UI (defaults are 6/7/8, and `FULL = 9` is pinned at `cube-dev-sim.tsx:61`), but any "ALL must light 27" check must not be pointed at it.
- **A JS↔Python divergence the oracle cannot see:** at `count == 4` the backend scales `highlight` by level while the mock does not (`sections.py:230-232` vs `mock-data.ts:846`). Invisible today only because the UI reads level 9 exclusively.
- **Cosmetic:** the header separator the code emits is U+00B7 `·`; the task transcribes `-`. Whether your screenshot shows one or the other was not checked — no image was available to this pass.

---

## Per-dimension summaries and the gaps each one declared

### view  (refuted claims: 0)

The full-screen cube is the `voxelMax` pop-out inside CubeDevSim (frontend/components/cube-dev-sim.tsx:347-362); it draws a hardcoded 27 cells, lights exactly one block at a time (the selected section's `highlight["9"]`), and its only controls are Explode, Exit and camera gestures — there is no per-sub-block or ALL highlight anywhere, and the chip strip that would change the lit block is covered by the overlay. Measured against the real partition module the live mock path uses: nothing is missing — at every cube's default granularity the blocks cover all 27 cells exactly once (cube 9 x 8 = 4,4,3,2,4,4,3,3, missing []). What reads as "empty" in his screenshot is an unlit cell drawn at 7.6% top-face alpha (REST_SEE_THROUGH), and that value is pinned by a gate.

- NOT MEASURED: what the LIVE site serves. The sandbox proxy cannot fetch https://exel-ai-polling.explore-096.workers.dev, so every number above is from the repo at HEAD 44fa9c36d. MOCK_MODE defaults to true (frontend/lib/api.ts:10, `process.env.NEXT_PUBLIC_MOCK_MODE !== "false"`), so the mock path measured here is what a default deploy renders — but that the deploy is on this SHA is UNVERIFIED from here.
- NOT MEASURED: which block was selected in his screenshot. Three cells lit matches 9.3, 9.7 or 9.8 (all 3-cell blocks of cube 9); the code cannot say which chip he had tapped, and the screenshot was not available to this task.
- NOT MEASURED whether the overlay is scroll-locked or whether the chip strip is reachable by any gesture while full-screen; established only that the overlay is `fixed inset-0 z-50` with an opaque-ish background (cube-dev-sim.tsx:348), i.e. the chips are painted over. No runtime check was run.
- DEGENERATE CASE established by reading, not by running: if `contract.sections` is empty (sections_for returns [] for an unknown cube, backend sections.py:292-293), then nSections = 0, litCells is empty and blockOf is all zeros — the full-screen header would read "0 BLOCKS" over a wholly faint lattice. No fixture exercises this.
- His ask leaves two readings open that measurement cannot settle and that were NOT guessed here: whether "9.1-all" is a stepper (one position at a time, advancing) or a toggle strip with an extra ALL chip; and how a cell covered by no sub-block should be drawn under ALL (it currently cannot even be distinguished inside the component — see the blockOf fill(0) finding).

### data  (refuted claims: 1)

The SIM's blocks come from one deterministic partitioner that exists twice (backend `sections.py`, frontend `sim-sections.ts`), and the LIVE deploy runs the frontend copy because MOCK_MODE is the default and nothing overrides it. Measured over every cube the SIM serves: Cubes 1-9 each cover all 27 cells exactly once at their default block count, with zero unclaimed and zero double-claimed cells; I also ran all 676 (seed 1-27 x count 2-27) configurations on both implementations and found no hole or overlap anywhere. Cubes 10-27 have no SIM contract at all (0 blocks, all 27 cells unclaimed) — they are absent, not holey. The real exposure his ask points at is elsewhere: a hole, if one ever appeared, would be invisible, because `blockOf` defaults every unassigned cell to block 0 and it would render in block .1's colour instead of reading as a gap.

- NOT MEASURED: whether the live site at exel-ai-polling.explore-096.workers.dev serves HEAD 44fa9c36d. The sandbox proxy 403s every host, so I could not fetch it. Everything above is measured against the working tree at 44fa9c36d.
- NOT MEASURED: which block was selected in his screenshot. I did not see the image. Cube 9's block sizes are 4,4,3,2,4,4,3,3, so a picture with three solid cells is consistent with 9.3, 9.7 or 9.8 being selected — but I cannot read the colour or confirm which, and I will not guess.
- NOT MEASURED: whether his phone was showing MOCK_MODE or a backend-connected build. No env override exists in the repo, which makes MOCK_MODE the default for the static export, but I could not inspect the deployed bundle.
- There is a SECOND, unrelated 27-cell partitioner at docs/vision-2525/reference/cube-partitions.js (boustrophedon chop, even size distribution, gated by frontend/tests/cube-partitions.test.mjs for every N in 1..27). `grep -rn "cube-partitions"` over frontend/ and docs/ shows its only consumers are that test and docs/vision-2525/reference/explode-view.js:15 — no app code imports it. The SIM does not use it. Flagging it so it is not mistaken for the SIM's source.
- No backend contract JSON exists for the SIM sections — the task's hypothesis of a JSON contract the SIM reads is absent. Established by `find . -iname "*partition*"` (5 hits, all listed above, none a contract the app reads) and by tracing the only two code paths: router.py:432-483 serving sections_for, and mock-data.ts:836-872 serving _mockSections. The only JSON is frontend/tests/fixtures/sim-partition-oracle.json, which is a test fixture, not a runtime input.
- NOT MEASURED: the 3/6/9 level dial path is dead for the current defaults, so I did not chase it far. For completeness: at count==4 (the curated A/B/C/D path, sections.py:294-299 via voxel_highlight:219-232) levels 3 and 6 deliberately truncate each block, so cube 9 at count=4 lights only 11 cells at level 3 and 19 at level 6 — union < 27 BY DESIGN. That path is unreachable from the current UI because every cube's default count is 6, 7 or 8 and cube-dev-sim.tsx:74 pins FULL=9, but it is the one place in the codebase where a union under 27 is correct behaviour, and any 'ALL must light 27' assertion must not be pointed at it.

### why3  (refuted claims: 2)

The full-screen cube lights exactly one block — the currently selected one — never the union. For Cube 9 at its default 8 blocks the lit block in the operator's screenshot is **9.6**, not 9.1: the lit pixels are exactly `#4dabf7`, which is `BLOCK_PAL[5]` (67,992 exact-match pixels; zero pixels of any other block colour), and block index 5 is section code `9.6` with cells `[13,20,22,23]` — **four** cells, which render as one face-connected blue mass (one connected blue region of 92,903 px), so "three" is a count of visually separable columns, not of lit cells. Cause (a) is confirmed and (b) and (c) are eliminated: every one of the 234 cube×count partitions covers all 27 cells exactly once in both the Python and the JS implementation, so nothing is missing in the data — the "mostly empty lattice" is a render setting, the 23 unlit cells being drawn at 7.6% / 4.9% / 3.3% effective face alpha.

- No control of any kind for the block in the full-screen view. Established by reading the entire overlay JSX, frontend/components/cube-dev-sim.tsx:347-362 — it contains exactly four children: the header, Explode, the drag hint, Exit.
- No ALL / union position anywhere in the frontend. Established by grepping for every way an all-27 set could be built (`range(27)`, `Array.from({ length: 27 }`, `new Set(Array`) across frontend/lib and frontend/components — the only hits are inside lib/sim-sections.ts:92,124,125, which are the partitioner's own internals, not a lit set.
- No test covers the voxel render, the lit set, or the overlay. Established by `grep -rln "voxelMax|litCells|CubeVoxel3D|cubes ON|data-sim-voxel" frontend/tests/` → zero files. So nothing would catch a regression in what the operator is looking at.
- The mock↔backend parity oracle has no entry for count=8. Established by listing the keys of frontend/tests/fixtures/sim-partition-oracle.json: counts 2,3,4,6,9,27 only. Counts 6,7 and 8 are the real defaults (cubes 1-9 default to 6,8,7,8,7,7,8,7,8), so the granularity every operator actually sees is the one least covered — 7 and 8 are absent entirely.
- Per-cube N-block coverage is untested server-side. backend/tests/cube10/test_sections.py:161-169 hardcodes cube 5. I verified all 234 combos by hand above, but nothing in test:ci would catch a future regression for cube 9 × 8.
- NOT MEASURED: what the operator was looking at before he opened full-screen, i.e. whether he tapped 9.6 himself or arrived there some other way. The default selection is `sections[0]` (cube-dev-sim.tsx:116) = 9.1, and the screenshot is unambiguously 9.6, so a selection was made — but the route to it is not recoverable from the repo.
- NOT MEASURED: the camera bearing/pitch/zoom in the screenshot. `useRCoreGestures` starts at bearing -0.6 rad, pitch 60, zoom 1 (cube-voxel-3d.tsx:45-48) and is not persisted, so the exact on-screen cell positions cannot be reconstructed; the cell identification above rests on the palette colour and the partition data, not on reprojecting the geometry.
- Does the inline (non-full-screen) view differ? Only in three ways, all measured: it is 200px instead of filling the viewport (:321 vs :359), it sits above the section picker (:301-310) and the `{litCells.size} cubes ON` line (:340) which are visible there and covered in full-screen, and it is the only place a block can be changed. The LIT SET ITSELF IS IDENTICAL — same `litCells`, same `blockOf`, same default `rest`. So the inline view is equally dark; it is merely accompanied by the words that explain it.

### reuse  (refuted claims: 0)

The full-screen cube in his screenshot is the `voxelMax` overlay at frontend/components/cube-dev-sim.tsx:347-362; its header string at :350 renders exactly "CUBE 9 · Reports & Dashboards · 8 BLOCKS", and the overlay contains only Explode, a drag hint, Exit and the cube — the numbered section-chip strip lives at :299-311 in normal document flow and is covered by the `fixed inset-0 z-50` overlay, so in full screen there is no way to change the lit block at all. Almost every part the new control needs already exists and is shared: the chip strip markup, the `sectionKey`/`setSectionKey` state at component scope (:70), the `<cube>.<block>` code format (`f"{cube_id}.{k + 1}"`, backend sections.py:296/:314, JS mirror sim-sections.ts:161), the lit/unlit alpha tuples and a ready third token `REST_SOLID_ENOUGH` (cube-voxel-3d.tsx:38). Measured answer to his verification question: Cube 9 at 8 blocks covers all 27 cells disjointly (union = 0..26) — there is no hole; his three lit cells are block 9.3, which genuinely has only 3 cells.

- WOULD HAVE TO BE NEW — an ALL position. Nothing in the repo selects every block at once. Established by grepping all/none-toggle identifiers across frontend/components/2525-core/, architect-2525/, security-2525/ and cube-dev-sim.tsx: the single hit, rcore-revision-panel.tsx:99 `const [showAll, setShowAll] = useState(false)`, is never read or written anywhere in that file (grep 'showAll' returns line 99 only) — dead state, not a reusable toggle.
- WOULD HAVE TO BE NEW — any block-selection control inside the full-screen overlay. Lines 348-361 of cube-dev-sim.tsx contain exactly two interactive handlers, `setExploded` (:351) and `setVoxelMax(false)` (:355). There is no chip strip, no stepper, no keyboard handler in the overlay.
- WOULD HAVE TO BE NEW — per-cell differentiation of unlit cells in CubeVoxel3D. `rest` is one tuple for every cell not in `lit` (cube-voxel-3d.tsx:40-43 signature, :129 binary branch). Expressing covered-by-another-block as a third state needs a prop-shape change (a second Set, or `rest` as a function of cell index), touching a component with two live consumers (cube-dev-sim.tsx:321/:359/:538/:543 and rcore-code-view.tsx:126).
- WOULD HAVE TO BE NEW — shared markup for the chip strip. The strip at cube-dev-sim.tsx:299-311 is literal inline JSX inside CubeDevSim, not a function or component, so it cannot be rendered a second time inside the overlay without extraction. Established by reading lines 294-362 in full: no `function`/`const X = (...) =>` wraps it.
- WOULD HAVE TO BE NEW — a hole-detection readout. Nothing in the frontend computes the complement of `blockOf` or counts covered cells. `blockOf` is `new Array(27).fill(0)` (cube-dev-sim.tsx:139), so an uncovered cell is currently indistinguishable from a cell owned by block 0 — the data structure that would carry the answer actively erases it.
- WOULD HAVE TO BE NEW — a test hook and gate for the full-screen control. `grep -rn 'data-sim-section|data-sim-voxel|data-cube-sim-select'` across the repo returns no hit between cube-dev-sim.tsx:347 and :362; the overlay is untestable by frontend/scripts/cube-sim-live-check.mjs as it stands.
- WOULD HAVE TO BE NEW — lexicon keys for the control's labels, staged in frontend/tests/lexicon-coverage.test.mjs AFTER_FILL (:19) per the NO-TRANSLATION-FILL-BEFORE-ENGLISH-IS-FINAL rule. Note the adjacent precedent is itself non-compliant: "Explode" is hardcoded English at cube-dev-sim.tsx:335 and :353.
- NOT MEASURED — whether the LIVE workers.dev site serves /sim/* from the Python backend or from MOCK_MODE (frontend/lib/mock-data.ts:987 handleSimMock). I did not fetch the live site; the sandbox proxy 403s every host. It does not change the coverage finding, because frontend/tests/sim-partition-parity.test.mjs:23-33 locks the two partitions to one committed oracle, so both paths yield the same 27-cell tiling.
- NOT MEASURED — whether the operator's screenshot was taken with block 9.3 selected specifically. Three lit cells is consistent with 9.3 ([5,7,8]) and with no other Cube-9 block except 9.4 (2 cells) being smaller; I cannot read the selection state out of a PNG.
- NOT DECIDED BY HIM, and left open rather than guessed (recorded at docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md:2141-2145): whether the highlight STEPS (one block at a time, ALL as a position on the same control) or TOGGLES (each block independently, ALL as a shortcut); and whether an uncovered cell under ALL is drawn as a visible hole, named in words, or both. The step form is the smaller change and is the one the existing strip at cube-dev-sim.tsx:299-311 already implies.
- NOT DECIDED BY HIM — whether the small inline cube (cube-dev-sim.tsx:316-344) gets the same control. He said "full screen"; the record at the same doc:2138-2140 keeps this a separate call.

### gates  (refuted claims: 3)

Seven test files read the full-screen cube's files or its partition data. The decisive gate EXISTS, but on the Python side only: backend/tests/cube10/test_sections.py:123-133 proves, for all 9 cubes × every allowed count 2..27, that the blocks are non-empty, face-connected, disjoint and cover all 27 cells — and deploy.yml runs it as a ship-blocking step. The JavaScript mirror that actually renders the operator's screen (MOCK_MODE is the default, lib/api.ts:10) is NOT proven at the counts eight of the nine cubes open at: frontend/tests/sim-partition-parity.test.mjs:50 loops only n ∈ {2,3,4,6,9,27}, while the live defaults are 6,8,7,8,7,7,8,7,8 — Cube 9, the one he photographed, runs at n=8 and is covered by neither the coverage loop nor the 54-entry Python oracle. I measured all 234 JS cases (9 cubes × n=2..27): 0 coverage failures, 0 connectivity failures, 0 empty blocks, so a new gate would be green at birth.

- NOT MEASURED — I could not EXECUTE frontend/tests/cube-sim-live.test.mjs or frontend/tests/sim-live-source.test.mjs on this HEAD. frontend/node_modules is absent: importing lib/mock-data.ts dies with `ERR_MODULE_NOT_FOUND: Cannot find package '@supabase/supabase-js' imported from /home/user/eXeL-AI-Polling/frontend/lib/supabase.ts`, and `ls frontend/node_modules/@supabase` returns nothing. Every assertion I quote from those two files is read from source, not from a run; their current pass/fail state is unknown to me. (sim-partition-parity and cube-partitions DID run — they import nothing outside lib/ and docs/.)
- NOT MEASURED — I did not execute the backend pytest suite. `backend/tests/cube10/test_sections.py` is quoted from source; that it currently passes is inferred from the deploy workflow being the ship gate, not observed. Establishing it needs `cd backend && python -m pytest tests/cube10/test_sections.py -q`.
- NOT MEASURED — I did not call the LIVE backend endpoint. Coverage on the LIVE (non-mock) path is established by reading backend/app/cubes/cube10_simulation/sections.py:277-318 plus the Python unit test, not by an HTTP response. No backend is running in this container.
- NOT MEASURED — I did not probe the contract through handleMockRequest end-to-end (same node_modules gap). I measured the layer underneath it: partitionSections at each cube's default count, which _mockSections (frontend/lib/mock-data.ts:838, :854) passes straight into highlight {"3","6","9"} unchanged. The step from orderedPartition to the served highlight object is read, not executed.
- GENUINELY ABSENT — no gate, frontend or backend, asserts anything about the FULL-SCREEN overlay's lit set. `grep -rln "voxelMax" frontend/tests frontend/scripts` returns only tests/financial-surface.test.mjs, which matched on the unrelated token `Maximize2`. The pop-out at cube-dev-sim.tsx:347-362 has no data-* hook of its own (the `data-sim-voxel` attribute at :320 is on the inline cube, not the overlay), so there is nothing for a future gate to select on — a hook will have to be added with the feature.
- GENUINELY ABSENT — no gate proves the JS sections_for mirror equals the Python one at n=5, n=7 or n=8. The oracle fixture has 54 entries fixed by export_partition_oracle.py:16 `COUNTS = (2, 3, 4, 6, 9, 27)`, and eight of the nine live defaults (8,7,8,7,7,8,7,8) are outside it. Closing that specific gap — as opposed to the coverage gap — DOES require regenerating frontend/tests/fixtures/sim-partition-oracle.json from the Python, because sim-partition-parity.test.mjs:33 asserts `entries === Object.keys(oracle).length`.

