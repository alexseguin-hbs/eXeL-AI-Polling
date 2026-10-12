# Claude Code notes · r.196 (2026-10-12) — RESTORE

**Asks (operator 2026-10-11, verbatim — `docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md`):**
"please review Drone-2525 / R-CORE AND recent revisions was messed up by Grok. I need help restoring functionality; attached is the last know version" ·
"There are 3 modes ( Train-Up where all targets pop up after getting hit / Train-Down where we have timer under stop light tonsee how fast to target all 3 /
and Qual that is just like army qual. i need Raster for each pose; all targets must have user Target, Approve, and fire / targets turn Amber when targeted
and after approved turn red" · "also R-Core history must match other modes" · "r.178 was the last working version before magazins and distorted targets
became a reoccuring issue" · "r.195 is soo beyond messed up as targets dont work" · "ensure magazines don't get distorted; heres correct ones" ·
"we wont use grok accept for testing your executed plan from here on out".

**Invariant (in the deck as a comment on `keepsMark`):** every standing target needs TARGET → APPROVE → FIRE from the person on the glass, in every mode;
a target is drawn at its true size and hit on that size; the served deck is a carried, hashed, registered revision; a red gate never ships.

## Environment (declared before the first edit)
Node 22.22.0 · npm 10.9.4 · `npm ci` in `frontend/` (exit 0) · Playwright from `frontend/node_modules`, Chromium `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` ·
Python 3 for the patcher (no PIL/numpy) · the three browser gates (`drone-deck-qa` both viewports, `drone-team-e2e`, `range-2525`) run locally before the push.

## Causes (what the record shows)
1. **r.166–r.195 never entered this register.** Thirty hand edits to `play.html` (no carried file, patch or hash; the register, README, `DECK_REV`, the
   domain JSON and `HASHES` all stopped at r.165). `deck-consistency`, `drone-playable` and `traceability` were red in CI on every `main` commit since
   `d6bcc160` (2026-10-08 23:53) and Cloudflare Workers Builds deployed each push anyway — so the site served r0.195 (`14a930d0`) with the gate red.
2. **QUAL 40 lost its fire gate.** r.169 (`b6487246`) made a hit drop the mark and a plate that just stood unmarked; `b2dfa80a` "Reinstate the r.166 range"
   restored the r.166 bytes wholesale and the fix went with it. At r.178 a plate that rose in a later engagement was already red — fireable without
   TARGET or APPROVE. The deck's own rows (`MARKS_ARE_REMEMBERED` `qualKept`) asserted that behaviour.
3. **Distorted targets.** r.180 (`2960980f`) made `silMesh` enlarge any plate drawn under 28 px (300 m at 1× ≈ 4.5× its size) while `plateRect` /
   `slotBoxes` / the hit test kept the true size — neighbouring lanes' plates bunched and overlapped at the left (shot 8), the box smaller than the drawing.
   The same edit stopped drawing the firing pits.
4. **The magazine row.** r.183–r.191 resized the cards five times ("52 by 72", "the drawing is 18 by 36", 60 px, 68 px …), scaling the 48:96 drawing
   unevenly; r.191 moved the count back beside RELOAD — away from the operator's picture.
5. **The picture ≠ the bytes.** Headless at 428×926, `af6f65e0` draws two 86×115 cards at left 8 / top 92 with the light above at top 42; the operator's
   r0.178 screenshots show RELOAD left, the count CENTRED, the light on the SAME row (~75 px), ~56×70 cards, RESTART at the right of the menu row.
   The bytes he saw were served by hand from a working copy that never reached git. **The picture is the master; `af6f65e0` is the code base.**
6. **R-CORE.** r.195 put a `position:fixed` badge over the picture and a five-row hand-typed list, separate from the shared ledger (r.199 carries the
   shared format onto this base; r.196 carries none of it).

## What a player meets (r.196)
- THE RANGE — the third option on the first two intro screens (operator: "'The Range' should be last (third option). dont say lane 21") — and the QR link `?range=21&role=turret&mode=train-up` opens the lane at once, in PRACTICE —
  TARGET, APPROVE and FIRE work the moment the lane shows (r.178 printed the link and read nothing).
- Every target, every mode: bullseye on a plate → TARGET (amber box) → APPROVE (red box) → FIRE → hit. In TRAIN UP the target comes back in 3 s
  unmarked; in TRAIN DOWN it stays down; in QUAL 40 the next engagement's plates stand unmarked. F on an unmarked or amber target is refused and
  spends no round.
- A marked target is drawn AMBER; only an approved one is RED — the silhouette, its glyph, its box and its caption read one phase (r.178 painted the plate red the moment it was marked; the box and the caption were already right).
- Plates at their true size at every range and zoom; the pits drawn.
- RELOAD at the left, the round count centred, the start light at the right, one row of 75 px; the magazine drawing 26×52 (exactly 1:2); green > 20,
  amber 6–20, red ≤ 5 (r.178); mode · lane · RESTART at the right; the strip above the row, the score line under it.

## Gates (red first, then green)
- **r.178 bytes, the deck's own QA:** 209/213 — red `SYNC_DIRECT` (by construction) + `MARK_SURVIVES_THE_RETURN`, `MARKS_ARE_REMEMBERED`,
  `NO_RING_ON_A_DOWN_TARGET` (all three asserted the r.162 held mark that r.166 had retired).
- **`8f9b3540` (served r0.195):** `deck-consistency` 47/4 · `drone-playable` 111/4 · `traceability` 60/1.
- **r.196:** the deck's own QA 214/215 both orientations (only `SYNC_DIRECT`), `drone-playable` 122/0, `deck-consistency` 52/0, `drone-revisions`
  250/0, `traceability` 61/0, `range-2525` 118/0, `drone-team-e2e` 10/0, `rcore-revisions` 49/0, `drone-ledger` 25/0, `tsc` clean, `next build` green
  with the deck gates in `prebuild`.
- New rows: `EVERY_TARGET_NEEDS_TARGET_APPROVE_FIRE` (replaces `MARK_SURVIVES_THE_RETURN`), `MAG_ROW_ONE_LINE` (tops 152/152/152 · heights 75/75/75 ·
  count centre off 0.0 px · aspect 0.50/0.50 · clear of the strip · the score under the row), `PLATE_DRAWN_AT_TRUE_SIZE` (C-50 and C-300 at 1× and 3×:
  drawn = plate to the millimetre), `PHASE_COLOUR_FOLLOWS_THE_SLOT` (plain → amber on the mark → red on the approval → plain on release; a second mark leaves the first amber). Re-stated: `MARKS_ARE_REMEMBERED`, `NO_RING_ON_A_DOWN_TARGET`, `RANGE_MENU_ON_SCREEN`.
- `drone-playable` now also holds: one revision number in the file (the corner and only it); `roundOpen` ≡ `rangeArmed`; every image inline; the QR link and its reader name the same params; both magazine viewBoxes 48:96 unstretched; `phaseCol` is the one plate painter; `keepsMark` returns false; `rangeRelease` on the QUAL raise; no `<28` in `silMesh`; the one-row CSS; no fixed badge;
  `enterTheRange` + two `.toRange` buttons + the `?range=` reader; `prebuild` runs the deck gates.
- **The CI door:** `frontend/package.json` `prebuild` += `drone-revisions`, `deck-consistency`, `drone-playable` (no git needed — `traceability`
  stays in `test:ci` only, it calls `git cat-file`). Cloudflare runs `npm run build`, so a red deck gate fails the build and the site stays on the last
  green SHA.

- `traceability` now also holds: a Drone-2525 release row (rev ≥ 74) cites the commit whose play.html declares the revision it names; the ledger is canonically serialised. Verify Live also fetches the QR link (`play.html?range=21&role=turret&mode=train-up`) and requires the same deck.
- Fleet (2026-10-12, twelve lenses + synthesis, `docs/assessments/2026-10-12_drone2525_fleet12_restore.md`): every P0 class is in this revision; its P1 "amber while marked" (F08) too; F09/F14 go to r.197, F11/F15 to r.198, F12/F16/F17/F18 to r.199, F19/F20 later.

## Corrections on the record (append, never edit)
- Register: r.178 and r.195 carried after the fact with their shas; r.165's `shipped` placeholder filled (`4bb4a3f`); the r.196 section lists every
  uncarried hand edit by sha, the twice-used r.187–r.189, the stale `BUILD.revision`.
- Ledger: rev 60 `shipped` = `4bb4a3f`; rev 61 `commit` = `82b3c0bb`; rev 73 (decision) corrects revs 65–72's parent-commit citations and rev 72's
  "R-CORE now matches Vision-2525"; rev 74 = this release. `drone-ledger.gen.ts` regenerated by `scripts/gen-rcore-revisions.mjs` (it had been
  hand-copied in `44631941`).
- Domain JSON: 0.050 `shipped` filled; 0.051 = r.196.

## Owed (r.197–r.199 on this base)
- r.197 TRAIN DOWN: START raises the lane and opens the clock under the light; the clock stops at the last target; START and TIME as `decide()` rows.
- r.198 QUAL: the five TC 3-22.9 positions as 1983-style edge rasters with their words, one at a time, in a rounded square of the magazine's height,
  matched to the four magazines; the table ends cold.
- r.199 R-CORE on the range in the shared format, fed by `docs/traceability/drone-2525.ledger.json`; DD-01…DD-06 on the record.
- Open (defaults taken, reversible): TRAIN DOWN counts all 11 plates ("all 3" read as the three modes' targets) · the cold-range end kept · r.178's
  onclick reload (r.170's one-tap carried only if a touch test needs it) · pose stroke `T13.SI` · R-CORE strings in the deck English-only.

## Credit
Sensor Fusion (`frontend/app/SensorFusion-2525`) works and was built with the Grok bot (operator 2026-10-11). Untouched here.

Artefact commit `a18880d` · deck sha256 `aef96537d11a1a00cec97656fb1a7573f89a97122b963450f1d84bab1b5d48e6`.
