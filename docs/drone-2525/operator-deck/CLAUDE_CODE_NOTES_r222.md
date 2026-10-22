# Drone-2525 r.222 — CRS-CL.H01 THE GLASS HALF: hits and misses shown on the lawn (2026-10-21)

**Artefact commit 24388d3 · carried `drone-2525_r.222.html` sha256 4cd1bed6e2f8fd3caca02590cf02e47489a652b0e53f0bde4849f9dc0ef7e22a.**

## His words (verbatim, 2026-10-21)
> r.222. About 90 minutes. CRS-CL.H01, the glass half only. Hits and misses are already stored. #phScore on the
> lawn still reads BLU 0 · RED 0 because that line is gated to the Range. In capPaintLawn, write HIT n · MISS n
> from the counts already in capIntroRows. The Range score stays as it is. Pass: a lawn Train Down does not read
> BLU 0 · RED 0. The Range score is unchanged. If it already shows HIT and MISS, ship nothing and go on.

Measured before building: it does NOT already show — `hudScore` (play.html ~2691) sends the lawn into the
`'BLU '+(state.blu|0)+' · RED '+(state.red|0)` else branch. So the revision is needed.

## What changed — one writer, `capPaintScore()`, called by the FREE `capPaintLawn` and re-asserted before paint
`capPaintScore()` (hoisted at the end of the deck's first script) writes `#phScore` on the lawn — and its full-screen
mirror `#magStrip` — to `'HIT '+(c.hits|0)+' · MISS '+(c.misses|0)`, where
`c = state.capRun ? capIntroRows(state.capRun) : {hits:0,misses:0}` (0 · 0 when no run has started, so no stale count
from a previous run). `capPaintLawn` calls it every frame after `hudScore` — `phys` calls `hudScore()` and then
`paintCues()`, which tail-calls `capPaintLawn` — so the HIT/MISS text wins `hudScore`'s `BLU/RED` else branch, the same
mechanism r.197 already uses for `#startWord`/`#startTime`. A lawn-owned `MutationObserver` on `#phScore` (installed
once, in the append zone) re-asserts the writer as a microtask whenever anything else writes the strip while
`capIntro()`; microtasks run before rendering, so no BLU/RED frame reaches paint, paused or not; the writer writes only
when the text differs, so it never loops. `hudScore` is not edited — its `BLU n · RED n` line is the off-Range else branch and stays as it is (on the Range
`hudScore` prints `MODE · HIT n · MISS n`); no new control, no new row.

**Why the frame painter alone was not enough — the twelve at play (2026-10-21).** The first cut was the one line in
`capPaintLawn`. Twelve AsM seats then played the cut through the real UI and two of them found paint paths the frame
painter cannot reach: **Aset** — `hudMag` runs at the TOP of `hudScore` and copies `#phScore` into `#magStrip`
*before* `hudScore` overwrites it, so after an event-time `hudScore()` (the hit) the full-screen mirror painted
`BLU 1200 · RED 0` for one frame (measured after every rAF, i.e. what reaches paint); **Krishna** — PAUSE (CONTROLS)
stops `phys`, so no frame painter runs, and a FIRE while paused let `applyHit`'s `hudScore()` leave `BLU 1450 · RED 0`
on the glass until unpause (screenshot). Krishna's proposed fix — ending `hudScore` with a call — is forbidden by the
brief ("do not edit hudScore"); the class fix inside the constraint is the observer: the lawn's writer wins every
write of the strip before paint. Measured on the final cut: 0 BLU frames across a full play (full screen and normal),
a FIRE while paused (through the real PAUSE control) reads `HIT 1 · MISS 0`, and the boot row's paused leg is green.
Two more seats (Asar, Athena, Enlil) found a CHAIN fault, not a deck fault: the rehearsal's ship commit on a tree that
lacked node_modules had staged the step-0 `node_modules` *symlink* (`.gitignore`'s `node_modules/` matches
directories only); the chain now un-stages it and refuses the ship if any node_modules path is tracked. Not in r.222:
tightening `.gitignore` itself (outside this revision's one change; one line, not fixed).

## Unchanged, asserted
- The Range score line in `hudScore` (`chNum()===0 ? …range… : BLU/RED`) is byte-for-byte untouched — the gate
  checks `('BLU '+(state.blu|0)+' · RED '+(state.red|0))` is still present.
- No new control, no new row on the glass, no station moved.
- TRAIN UP, TRAIN DOWN, QUAL 40 (refused on the lawn) and the Sentinel cue are unchanged.
- The Range is untouched (r0.221): range-frozen 100 definitions, 0 moved; both Range play-throughs byte-identical.

## The gate, red first
`LAWN_SHOWS_HIT_MISS`. On r.221 it is red (the lawn strip reads `BLU 0 · RED 0`). On the cut it is green: a lawn
TRAIN DOWN strip reads `HIT n · MISS n`, never BLU/RED. `redfirst/r222.md`.

## Played on the real UI (manual evidence, 428×926, the cut served from the rehearsal tree)
Driven only by clicks and selects — the intro's THE RANGE, MORE, the scenario select → the Capital, the mode select →
TRAIN DOWN, START, TARGET, APPROVE, FIRE, then the scenario select → the Range — 15 checks, all ok, 0 page errors:
entry `HIT 0 · MISS 0` (never BLU/RED) · Train Up shows no timer (time "", no CSTART/CTIME since entry) · QUAL 40 refused
(`QUAL 40 IS TRAINING · ON THE RANGE`, the select snaps back) · Train Down armed (START) · START opens the clock (TIME
0:00.0) · a FIRE before the cue is refused (`HOLD BEFORE_CUE`, magazine 30/30, `CUE · NOT NAMED · WAIT FOR SENTINEL`) ·
the Sentinel names it (`SENTINEL · 1800 · ONE TRACK`) · FIRE → `HIT · UAV-1 · DOWN`, CTIME {ms 2133, hits 1, misses 0,
rounds 1} · the strip reads `HIT 1 · MISS 0` · the glass at ALL DOWN: word ALL DOWN, time 0:02.1, strip HIT 1 · MISS 0,
magazine 29 · the magazine matches the rounds (30→29 = 1) · back on the Range: `TRAIN UP · HIT 0 · MISS 0`, rangeHit 0,
rangeMiss 0, lane 21, mode TRAIN UP — the lawn hit did not bleed into the Range. One harness note: a REFUSED pick cannot
be driven through Playwright's `selectOption` (the deck snaps the select back inside its own change handler, which is
the behaviour under test), so the QUAL 40 refusal is dispatched as a real `change` event and read in the same task.
The twelve AsM seats played the same run themselves (`play12.workflow.js`) before the push.

## The per-revision gate, before the push (his order: the twelve, then SSSES three attempts, then one spiral)
- **Twelve seats, one pass, on the diff** (Aset, Asar, Athena, Christo, Enki, Enlil, Krishna, Odin, Pangu, Sofia,
  Thoth, Thor; ≤80 words each): **12/12 SHIP** on the line; the synthesis' one FIX FIRST was the chain's
  node_modules symlink (closed in the chain, above).
- **Twelve seats at play** — he asked that the twelve play the game; each seat ran the real-UI harness under its own
  tag and judged from its lens. Cut 1 (the one line): 12/12 played and passed the 15 checks; FIX FIRST on two faults
  the harness could not see — the full-screen mirror (Aset) and PAUSE-then-FIRE (Krishna). Cut 2 (the mirror
  written): the synthesis reproduced PAUSE-then-FIRE there, verified it gone on cut 3, SHIP covering cut 3. **Cut 3
  (the writer and the observer): 12 played, 12 passed, 12 SHIP, no fault** — Krishna sampled 9,266 frames with no
  BLU/RED; the four items raised were each shown to be identical on the shipped r.221 bytes (above, "Outside").
- **SSSES, three attempts** on the final line (Security · Stability · Scalability · Efficiency · Succinctness):
  attempt 1 as built 95 · 82 · 79 · 80 · 74 (lowest succinctness); attempt 2 dropped the dead `typeof` guard on the
  hoisted call → 76; attempt 3 cut the call-site comment that repeated the banner → 78; **the judge kept attempt 3**
  (each change raised the lowest pillar with the pass line, the Range and the glass unchanged). Named and not
  changed by the attempts: scalability is capped by `capIntroRows` scanning every event since `e0`, twice per lawn
  frame — a later revision's class. Attempt 3 also caught a false sentence in the banner (fixed: the BLU/RED line is
  the off-Range else branch; the Range prints `MODE · HIT n · MISS n`).
- **One spiral.** Forward (the line → the record → the glass → the magazine → the next press): the line holds; the
  record holds within a run (every round spent on the lawn is exactly one HIT or MISS row with the track's id, and a
  real MISS was proven through the real FIRE button — 36 px off: `MISS:UAV-1`, strip `HIT 0 · MISS 1`, magazine 29);
  the glass holds while frames run; **the first place truth is lost is the magazine** — the strip counts one run and
  the magazine counts the session, from different zeros (below, "Outside"). Backward (the cue → the three presses →
  the one track → the four numbers): the first untrue assumption is that the cue comes before the three presses — it
  holds back FIRE only, by r.220's own design. **The closer kept no change**: the worst finding is older than r.222
  and whether a lawn START refills the magazine is the operator's call; the second is a doctrine choice (r.220).
  Both reported, neither fixed, per the brief.

## Not here, stated
- The foil wireframe for the air track — r.223.
- The four numbers (hits, misses, rounds, time) staying on screen after the run ends — r.224.

## Outside this revision — one line each, found by the twelve at play, not fixed (his rule)
- At 428×926 the strip's hit digit sits under the RELOAD card's magazine picture (`IMG#magInk`); readable, and the
  same box held `BLU 1200` on r.221 — moving it is a layout change and his call (Christo, Pangu, Sofia, Enki).
- Back on the Range after the lawn, `#rngMode` still reads TRAIN DOWN while the Range plays TRAIN UP — `capChrome`
  never resets the select on the way out; r.219 behaviour (Christo, Thor).
- The full-screen mirror `#magStrip` lags `#phScore` by one frame on every change of the RANGE strip too —
  `hudMag`'s copy-before-write is Range-wide and older than r.222; r.222 removed only the BLU/RED instance on the lawn.
- `.gitignore`'s `node_modules/` matches directories, not a symlink; the chain refuses the class, the ignore rule is
  untouched here.
- **From the spiral's backward leg (cue → three presses → one track → four numbers), each older than r.222:**
  TARGET and APPROVE are accepted before the Sentinel names the track — only FIRE is held (`capCueHold`'s one call
  site is `fireN`); r.220 chose this ("TARGET and APPROVE are not gated") and his brief says "Sentinel names it
  before Fire counts" · a lawn UAV hit still books `blu += 250` and a `SCORE 'BLU n · RED n'` row on the record
  (`fireN`'s uav branch) — r.222 is the glass, not the record · the boot self-test's own CUE / CTIME / TIME rows and
  its `blu` precede the player's rows in `state.decisions`/`state.events` (the lawn QA rows restore units, clock and
  magazine but not events, decisions or `blu`), which is why the first lawn hit read `BLU 1200` before r.222 · the
  fixed 2 s cue is ~94 % of a 2.1 s Introductory CTIME, so the time barely separates shooters at this level · a
  lawn MISS can only land in the 32–48 px band (`fireOnIt` accepts 48 px, `applyHit` scores under 32) · in a room a
  peer SNAPSHOT replaces `state.events`, which would move `capIntroRows`' `e0` — solo only today.
- **From the spiral's forward leg (the line → the record → the glass → the magazine → the next press), each older
  than r.222 — the first is the one he can see:** the lawn strip and the magazine beside it start from different
  zeros — `capIntroEnter`/`capIntroReset` restart the count (`R.e0`) on ENTER, START, RESTART and MODE but never call
  `magLoad('RESET')`, while the Range refills at every reset (`rangeReset`, `downStart`); so one Range shot then one
  lawn hit reads `HIT 1 · MISS 0` beside 28/30, and the Range's own rule (HIT + MISS + rounds left = 30) breaks on the
  lawn; CTIME's `rounds` is a difference and stays true. Whether a lawn START refills is his call; the fix is one
  `magLoad('RESET')` in `capIntroReset`, outside this revision · FIRE is accepted while PAUSED (`fireN` has no paused
  check; PAUSE stops `phys` only), so a Train Down shot can be aimed with mouse-look and taken with the clock stopped
  and CTIME's `ms` leaves that time out · under PAUSE the lamp stays green although `capLight()` would return R ·
  RESTART after ALL DOWN wipes the run's HIT/MISS off the glass — r.224's subject.
