# Drone-2525 operator deck — revision register (append-only, reviewed like the Vision-2525 whitepaper)

One entry per carried `drone-2525_r.NNN.html` from r.128 on. An entry is never edited; a correction of an earlier
claim is a NEW line under a later revision that names the claim it corrects. `frontend/tests/drone-revisions.test.mjs`
holds every carried file since r.128 to an entry whose sha256 matches the bytes, holds README HEAD to the last entry,
and refuses a register whose earlier entries changed: `chain` = sha256(previous chain | rev | sha256 | bytes), recomputed row by row.
Nomenclature `v.00.00_r.NNN`; skipped numbers are never invented. Sizes in bytes (`new Blob([html]).size`, never chars).

| rev | date | author | bytes | sha256 | shipped in | chain |
|---|---|---|---|---|---|---|
| r.128 | 2026-09-19 | Grok + eXeL AI | 211344 | 6c26f43c052d68027952b139626aecf1d4b3171e1204cac54fc89da8f102ec8c | d195781 (served) | fc7480650848100badc8d62dfa8e509b212536c2616f9b1b08d332db3f66647b |
| r.129 | 2026-09-19 | Claude Code | 215379 | 7b1e0e51a31aa79c92211ac385e781452cc1c3d24899c118d6976b83ed2e8c7e | 8a54271 | 0b9539d90e05709195f2ab913bea0c0b25ae1ef0fe54b4f21242e824ec31188e |
| r.130 | 2026-09-19 | Claude Code (AsM fleet, autonomous) | 231517 | ce034c5e5c52aff539321f8a8895965317b7d406b8d1fcdb5aaef978a5bee99e | a83e670 | 7ab4f6dee17afcdb97610353f954e0e5e0dcd77343d87c9626252a85068a0ef4 |

## r.128 — Grok + eXeL AI (blue/red revisions; the LOBBY)
- The Blizzard-style multiplayer lobby with a 6-digit team code + opaque seed id per team, rotate lock, roster,
  readiness, `canLaunch` refusal order; LIGHT-4 keyed codex; host SEQUENCER (sessionSeq, provisional events,
  Lamport clock, `sessionOrderKey`); the 50 m RANGE from r.122 (42 lanes, Alt-C silhouettes at true metres,
  PRACTICE UP / STAY / QUAL 40, ASM_QUAL40 fixture); WALLS/WATERS; in-file QA 55 rows.
- Served as the playable at `/drone-2525/play.html` byte-identical (R-CORE: the best solution ships regardless of
  which AI wrote it). Repo lifts (no rework): `lib/2525-core/lc4.ts`, `lobby.ts`, `random.ts`; proofs
  `tests/lobby-2525.test.mjs` (38), `tests/sequencer-2525.test.mjs` (13).
- Honest open items at r.128: two real phones for HOST/JOIN → same hash; endurance soak; 9v9 locked until
  1v1/3v3 qualify on live transport; the range had "no aim/ballistics test" (its own comment).

## r.129 — Claude Code (operator items of 2026-09-19)
- `phys` moves the body along the airframe heading instead of the pilot camera's forward (the camera folds the
  gimbal pan in), so a head panned behind no longer reverses the body; bullseye (rings + centre tick, T13.SI) on
  standing pops and doors; once HIT the T## slot clears with the box (keyed on the designation's own slot); in a
  LIVE room the red box needs two separate humans (decided by seated identity, because `applyWorld` rewrites a
  local designation to `how:'PEER'`). QA rows `BODY_FWD_PAN180`, `HIT_CLEARS_SLOT`, `LIVE_TWO_HUMANS`,
  `LIVE_PEER_APPROVES`; 59 rows, headless 58/59 (`SYNC_DIRECT` FAIL by design on one device).
- Repo: `tests/drone-playable.test.mjs` re-pointed (byte-identity, < 7.77 MB in bytes, the r.129 regexes).
- **Claim made at r.129 that r.130 corrects:** "forward-goes-reverse fixed at its class". It was not. r.129 fixed
  the pan-folding sub-case only; at pan 0 the body still moved AWAY from what the screen showed, because the
  camera vector and the projector disagreed by 180° (see r.130). The r.129 QA measured displacement along the
  vector, which was the wrong side of that disagreement.

## r.130 — Claude Code, AsM fleet in autonomous mode (operator 2026-09-19: "make sure range with turrets actually works")
- **Found on the served r.129 by a read-only probe before any change:** from the pit, looking downrange, the projector
  culled all ten silhouettes; every aimed shot 50–300 m was a MISS; LOCK named a buoy; turned 180° the plates appeared.
  Cause, the class: `camOf` said forward = (sin yaw, −cos yaw) while `proj` draws forward = (−sin yaw, cos yaw). The
  same disagreement made QUAD/VTOL move AWAY from the point on screen under left-stick forward (59.4 → 68.3 m).
- **One forward basis** (`fwdOf`/`rightOf`/`yawTo`, derived from the projector): `camOf`, `lockOn`, `phys`, all five aim
  sites and the QA read it. The range pit parks at yaw 0 and faces its plates. QA `PROJ_FWD_AGREES`,
  `FWD_IS_WHAT_YOU_SEE_{D1Q,D1,R2}` (distance to the point at screen centre DECREASES under L-up — the invariant in
  picture terms), `RANGE_SEES_PLATES` 10/10, `RANGE_LOCK_PLATE`.
- **Pop-ups per lane at various distances:** plates DOWN by default; `rangeTick` raises one at a time per lane in a
  seeded per-lane order (`mulberry32(2525+lane)`), for 3 s at 50 m … 8 s at 300 m (FM 3-22.9 record fire, see
  `docs/drone-2525/RANGE_QUALIFICATION_RESEARCH.md`), 1.5 s gap. Hit → falls; lapsed → drops.
- **Three modes, the operator's names, on the existing `rangeMode`:** TRAINING · RESET (`bounce`, a downed target
  comes back on its next exposure) · TRAINING · DOWN (`stay`, stays down until RESET) · QUAL · 40 (`qual40`, timed
  tables I/II/III = 20/10/10 exposures; a lapsed exposure is an UNFIRED MISS round; 23/30/36). QA
  `MODE_RESET_RETURNS`, `MODE_DOWN_STAYS`, `MODE_QUAL_TIMED`.
- **Scale-true hit test:** a silhouette is hit when the pip sits inside its projected outline (CIRCLE inside the aiming
  circle, else SILHOUETTE), 6 px floor shown on the HUD; the old constant 32 px rule is gone for plates. QA
  `RANGE_HIT_50`, `RANGE_HIT_300`, `RANGE_MISS_300_OFF20` (the old rule scored it a hit), `RANGE_HIT_50_OFF10`.
  None of these rows use `simDirect`.
- **Sheet 9127 layout:** 50 F · 100 F ×3 (C-100C new) · 150 E ×2 · 200 E ×2 · 250 left · 300 right; table III cap
  covers C-100C. QA `ALTC_LAYOUT`.
- **Latent deck defect fixed at the class:** the reducer rebuilt every designation as `kind:'obj'` and dropped WHO
  marked it — so at CH0 `fireN` routed a designated plate down the bull-ring path (shooting BULL-1), and the r.129
  identity-based two-humans rule could never see a peer's identity. Now `kind:kindOfRef(target)` and
  `by:row.peerId`. Exposed silhouettes get a hairline screen bracket + seconds left; a turret never locks a buoy;
  the map prints every 7th lane label plus the seated lane ±2 (the label soup is gone).
- **Two render defects of r.128/r.129 the probe exposed, fixed at the class:** `bullseye()` (r.129) referenced `draw()`'s
  local `segs` from top level and threw on every frame; the loop's `try/catch` hid it, so nothing after the doors —
  pops, silhouettes, T-boxes, the HUD — was ever drawn while '0 page errors' stayed green. Now `segs` is passed in,
  the loop RECORDS a render exception (`state.drawErr`), and a deferred QA row `DRAW_COMPLETES` reads whether frames
  ran to their last line. And at MoT 1.1 the 42-lane range wire (601 segments) spent the whole 280-segment budget
  before any silhouette was drawn (r.128 too): the lane's exposed silhouettes now take the budget first and pit boxes
  draw only for the seated lane ±1 at MoT 1.
- In-file QA 75 rows, headless **74/75** (`SYNC_DIRECT` FAIL by design on one device), 0 page errors, 60 fps.
  Repo gates: `range-2525` (64), `drone-playable` (33, re-pointed), `drone-revisions` (this register).
- **Corrects r.129:** "forward-goes-reverse fixed at its class" — r.129 fixed only the pan-folding sub-case; the class
  was the basis disagreement above. Still open, honest: two real phones for HOST/JOIN → one hash; endurance soak;
  a perf run (SSSES Scalability/Efficiency stay unmeasured until it exists).
