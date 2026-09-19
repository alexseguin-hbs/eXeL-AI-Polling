# r.132 — 38-AsM TEAM TEST (operator 2026-09-19: "test entire drone-2525 as 38 ASM team")

Served bytes under test: `frontend/public/drone-2525/play.html` = `docs/drone-2525/operator-deck/drone-2525_r.132.html`
(HEAD r.132, commit 3d653bc). Every seat drove the deck ONLY by clicks, key presses and select changes through
`frontend/scripts/asm-play.mjs` (Playwright, Chromium, node http over `frontend/public`). Seats report
SEAT / RESULT / EXPECTED / VERDICT / SAW / MISREAD / WHAT ELSE ON THIS PATH CAN FAIL. Captures under
`frontend/perf/asm/` (gitignored). Agents ran at the configured model and effort; nothing overridden.

This file is APPEND-ONLY: wave 1 is recorded as it landed; waves 2–3 and the 48-AsM fleet synthesis append below.

## Wave 1 — 13 seats (s01–s13)

| seat | lens | kind | lane / mode / size | result | verdict |
|---|---|---|---|---|---|
| s01 | Aset | solo | L01 · TRAINING·RESET · 6 · 390×844 | 6/0/0/0 | PASS (misreads) |
| s02 | Asar | solo | L04 · TRAINING·DOWN · 6 | 6/0/0/0 | PASS (misreads) |
| s03 | Athena | solo | L08 · QUAL·40 · 6 | 6/0/0/0 | PASS (misreads) |
| s04 | Christo | solo | L12 · TRAINING·RESET · 6 · **360×640** | 6/0/0/0 | **FAIL** — top HUD hard-clipped at 360 px; the HIT/MISS/LAPSED score is unreadable |
| s05 | Enki | **ai** | L03 · TRAINING·RESET · 4 | 0/0/4 (AI never marked) | **FAIL** — AsM SPOT never marks a range plate |
| s06 | Enlil | **team** | L02 · 3 engagements | 3/0/0 · hash ce54b132 MATCH/MATCH | PASS — joiner never learns the outcome |
| s07 | Krishna | capitol | CH1 turret | (pending) | |
| s08 | Odin | solo | L15 · QUAL·40 · 12 | 12/0/0/0 · R 12 H 12 · 142→121 s | PASS |
| s09 | Pangu | **team** | L07 · 3 · **1440×900** | 3/0/0 · hash 51d9b44e MATCH/MATCH | PASS — right panel occludes the picture's right quarter |
| s10 | Sofia | solo | L19 · TRAINING·DOWN · 12 | 10/0/2/0 · ALL DOWN reached | **FAIL** — key 1 after ALL DOWN says "NO T1", not "ALL DOWN · RESET" |
| s11 | Thoth | **ai** | L10 · QUAL·40 · 5 | 0/0/5 · R 15 expired 15 | **FAIL** — AI never marked; 15 rounds charged LAPSED |
| s12 | Thor | capitol | CH5 turret | (pending) | |
| s13 | MoT-1 | **team** | L12 · 4 · **360×640** | 4/0/0 · hash 24c771a6 MATCH/MATCH | PASS — rangeline truncates at 360 px |

### What every seat that PLAYED saw hold
- The two-step held on every path: TARGET → "AMBER" → APPROVE → "RED BOX · <id> · SOLO HI-2" (solo) or "· PEER HI-2"
  (team) → FIRE. No seat fired on amber; no seat fired without a mark. QUAL·40 charged exactly one round per exposure
  (s08: 12 exposures → R 12), the table clock counted 142 s down, and lapses charged UNFIRED MISS (s11: 15/15).
- Two isolated browser contexts over the WebRTC data channel reached ROOM LIVE three times (s06, s09, s13), the joiner's
  APPROVE turned the host's amber red on BOTH devices as PEER HI-2, the host fired, and both devices ended on ONE replay
  hash saying MATCH — at 390, 360 and 1440 px. Zero page errors on all thirteen seats.
- TRAINING·DOWN keeps a downed target down and reaches "ALL DOWN · RESET" after ten distinct hits, never re-listing a downed
  target (s10). TRAINING·RESET cycles the ten silhouettes at their distances with the declared exposure seconds (s01, s04).

### Defect classes (convergent across seats — each is ONE class, listed once)

**D1 · The score is clipped exactly where it matters (s04, s10, s13; s01–s03 at 390).** `#playHud` is
`overflow:hidden; white-space:nowrap` with no wrap, no ellipsis and no second home for the numbers. At 360 px the strip ends
"…TRAINING · RE"; at 390 px "…TRAINING · DOWN · H". HIT/MISS/LAPSED and the terminal "ALL DOWN · RESET" are unreadable on
the phone. Class: every HUD string that can grow (designation + mode + score) shares one nowrap line. Fix the class:
the score gets its own line (or the designation does), and nothing that must be read is allowed to overflow silently.

**D2 · The HUD score line lags one shot behind the counter (s01, s06, s08).** "HIT 2" on the header while `rangeHit=3`
and the toast says HIT. The strip is rendered from the previous tick's snapshot; the toast and counter from this one.

**D3 · The approver never learns the outcome (s06, s09, s13).** After the joiner's APPROVE and the host's HIT, the
joiner's score stays "HIT 0 · MISS 0", its reticle still shows the red box, its toast still says "RED BOX … PEER HI-2".
The hash matches, so the record is shared; the PICTURE is not. The person who authorised the shot has no on-screen proof
it landed. Class: HIT/MISS/LAPSE are reduced into `rangeHit/rangeMiss` on the origin only, and the desig/red-box clear is
origin-only too — the peer's reducer path must clear the box and tally the outcome from the same canonical row.

**D4 · The AI member cannot play the range (s05, s11).** With AsM SPOT on, `state.desig` stayed null through every
exposure: `asmTick` marks only from OTHER turret units and only when `bd < (best.form ? 340 : 80)`; range plates carry no
`form`, so the 80 m gate applies while every silhouette stands at 50–300 m. The AI seat lapses every exposure. Two
sub-findings in the same class: (a) SPOT is already the default, so the on-screen AsM button's first press advances to
**AsM FIRE**, whose toast reads "AsM MAY FIRE · HI still designates" — and play.html:2412-2417 would let the AI shoot on its
own with NO APPROVE once a mark existed. That is the fire gate widened for the AI seat and must be closed: an AI-initiated
shot never fires without a named human APPROVE (drone-authority invariant). (b) The end capture shows a red LOCK reticle
with "LOCK C-150R-L10 150M" while desig is null and the strip says TARGET FIRST — a reader cannot tell whether the AI
marked or not. LOCK is aim, not designation; it must not be drawn in the designation colour.

**D5 · Three entrances to "range empty" compose three sentences (s10).** Key 1 → `targetN` → "NO T1"; the TARGET
button and voice route through `noLockMsg()` → "ALL DOWN · RESET". One state, one sentence: all three call `noLockMsg()`.

**D6 · A downed target is still drawn with its countdown and a red LOCK line (s01–s03).** After HIT the silhouette
stays on screen with "200M E · 6s" and the LOCK line until the next exposure raises another plate. The box should go down
with its target (r.131 rule) AND the caption + LOCK should leave with it.

**D7 · Desktop layout (s09, 1440×900).** The settings/LINK/CODEX column sits over the picture's right quarter (x≈840–1140)
while x≈1140–1440 is black and unused; the panel overflows the 900 px height (R-CORE and FPS collide with R HEAD); the
orange sim-frame line at x≈48 strikes through the bottom-left caption ("RED B|OX", "HIT ·|CIRCLE") on every capture.

**D8 · Small honesty defects on the record.** Pre-LIVE lobby shows "LAPSED 1" at APPLY/READY — a lapse counted while no
one may fire (s06). Joiner's LINK prints "-1978 ms" (clock-skew artefact; the host prints +1981) (s09). The waiting room
reports lane 20 / unit T01 until START, not the requested lane (s13). "AsM MAY FIRE · HI still designates" contradicts the
QUAL·40 AI-seat contract (s11).

**D9 · Jargon a stranger cannot read (s01–s03, s09).** "HIT · CIRCLE", "DOWN DIRECT", "SCEN · 50M RANGE" (the served
ranges are 50–300 m), "SPIRAL v1". The demo bar is a stranger understanding in 60 s.

### Not defects (misreads the seats corrected themselves)
- `lane:11` → HUD "L12": 0-based index, not a mismatch. `final.score` one step behind the last toast: snapshot timing.
- "AI never marked → LAPSED 3 per step" (s11): the seat's 20 s wait spans three exposures; the deck charged one round per
  exposure, which is the rule.
- The two "NO T1" presses after ALL DOWN are the idle state, not lock refusals (script label).

### Unexercised by wave 1 (owed to waves 2–3)
ONE ROUND PER EXPOSURE refusal (a second FIRE inside a still-red exposure); the 20-exposure / clock-expiry boundary of QUAL·40
tables I→II→III; capitol CH1–CH5 (s07/s12 pending); a data-channel drop between APPROVE and FIRE; the waiting room imaged at
360 px; 768×1024 tablet; lanes 21–42.

## Wave 1 — the two capitol seats (landed after the table above)

| seat | lens | kind | result | verdict |
|---|---|---|---|---|
| s07 | Krishna | capitol CH1 (PRACTICE) | round never started | **FAIL** — PRACTICE is CH0-only by design; the refusal is a 1.4 s toast naming no next action; the CH0 range ran and lapsed 54 targets behind the intro |
| s12 | Thor | capitol CH5 (PRACTICE) | round never started | PASS — the deck refused CH5 alone and nothing fired; same wording gap |

New classes from these two: **D10 · the range runs and lapses before anyone may fire** (54 lapses behind the intro; 1 in every waiting
room) and **D11 · a refusal names the rule, not the next action** ("PRACTICE / NO ROOM · CH0 ONLY", 1.4 s). Also noted: the in-round CH
picker lets a solo player reach CH1 after entering at CH0 — a path the intro says does not exist (open; not folded here).

## Wave 2 — 13 seats (s14–s26), the paths wave 1 could not reach

| seat | lens | kind | lane / mode / size | result | verdict |
|---|---|---|---|---|---|
| s14 | Aset | solo · 2nd pull | L21 · RESET · 6 | 6/0 · 6 second pulls → "NO RED BOX", REJECT rows, no extra hit | PASS |
| s15 | Asar | solo · table boundary | L30 · QUAL·40 · 22 | 22/0 · TI 20/20 → "TII READY" · TII clock 75 s fresh · TOTAL 20→22 · no double charge | PASS |
| s16 | Athena | solo · last lane | L42 · DOWN · 12 | 10/0 · ten distinct, ALL DOWN reached; key 1 said "NO T1" | PASS (D5 again) |
| s17 | Christo | solo · 2nd pull | L25 · QUAL·40 · 6 | 6/0 · R never moved on a second pull; sentence was NO RED BOX (hit case), ONE ROUND PER EXPOSURE is the miss case | PASS on the invariant |
| s18 | Enki | ai · SPOT default | L05 · RESET · 4 | 0/0 · AI never marked | **FAIL** — `asmTick` is never called from the live loop (D4 root) |
| s19 | Enlil | ai · AsM FIRE | L09 · RESET · 4 | 0/0 · vacuous | **FAIL** — same root; and the FIRE branch checks no red phase (would down an amber target) |
| s20 | Krishna | capitol CH1 room | 3 | 0/3 MISS · hash MATCH · red on both | PASS on the room; the marked pop was 106 px off the pip (D12) |
| s21 | Odin | capitol CH3 room | 3 | 0/3 MISS · hash MATCH · moving UAV-1 locked | PASS on the room; same D12; the joiner's red box off its screen (D13) |
| s22 | Pangu | capitol CH5 room | 3 | 0/3 MISS · hash MATCH · no CH5 overlay | brief was stale: a PEER approve already is the second human; overlay superseded — documented |
| s23 | Sofia | team · tablet | L33 · 768×1024 | 3/0 · MATCH · waiting room legible | PASS; a stranger cannot complete an unaided join (RED code shown nowhere — `ROOM_PRIVATE_CODES`, operator decision) |
| s24 | Thoth | team · 2nd pull over the wire | L05 · 3 | 3/0 · MATCH after every refusal · joiner HIT 0, red box on a dead target | PASS on the invariant; D3 confirmed |
| s25 | Thor | solo · desktop | L01 · 1440×900 | 6/0 | **FAIL** — `#side` absolute inside the stage covers x 840–1140 while the reserved strip x 1140–1440 is black (D7 root); 2314 px of panel hidden below the fold |
| s26 | MoT-2 | solo · smallest phone | L18 · QUAL·40 · 320×568 | 6/0 | **FAIL** — score clipped by 169 px; LOCK line overprints the unit footer by 17 px; reticle sits on the APPROVE pill |

### What wave 2 proved held
One round per exposure (R never moved on any second pull, solo or over the wire; the REJECT row travels and the hash matches after it);
the QUAL·40 table boundary (20 → TII with its own clock, TOTAL carried, nothing charged twice); lane 42 = lane 1; two-device rooms
at CH1, CH3 and CH5 reach LIVE and MATCH; a moving target can be locked; the tablet waiting room is legible.

### New classes (added to D1–D9)
**D10** the range lapses before the round starts · **D11** a refusal names no next action · **D12** a mark does not aim: TARGET
designates what is in the cone (±21°) but never turns the head, so a red box 100+ px off the pip is fired at and reads as a refusal ·
**D13** the approver's head is not turned to the mark, so the box can sit off the joiner's screen · **D14** the AI mark's author is
re-stamped with the human's id by the reducer (`by:row.peerId||…`).

### Root causes the seats found by reading the served source
- `asmTick` (the AI member) is defined, exercised by the boot row `ASM_SEES_THE_RANGE`, and never called from `phys`/`spawn`/`loop`.
  The gate was green while the feature was dead, because the gate called the function itself instead of proving the loop does.
- `#side{position:absolute;right:0}` is a child of `#stage`, while `#app.desk #stage{margin-right:min(300px,32vw)}` reserves the strip
  outside the stage — the panel never moves into the space reserved for it.
- `#playHud` is `flex-wrap:nowrap; overflow:hidden; white-space:nowrap`; the designation and the score share one line.

## r.133 — what was folded (verified on the served r.133 by the same harness before shipping)
D1 (strip wraps, score on its own line; 320/360 px readable — capture `perf/asm/v133-solo-03-end.png`) · D2 (`hudScore()` written on the
event) · D3 (peer HIT/MISS tally + release: joiner ends `HIT 2`, desig null, "THE OTHER SEAT · REJECT · NO RED BOX") · D4 (AI member ticked,
plates-only on the range, pit distance, red-only fire through `fireN`, once per box, OFF default; AI seat 3/3 on replay) · D5 (one
sentence) · D6 (hit target leaves lock + caption) · D7 (panel in its strip) · D9 (words) · D10 (`rangeArmed()`) · D11 (refusal names the
next action; toast lifetime scales) · D12/D13 (TARGET aims; the approver's and the AI-marked seat's head turn to the mark) · D14 (reducer
keeps the author). QA rows: `HUD_SCORE_WRAPS`, `ASM_TICKED_LIVE`, `ASM_SPOTS_FROM_PIT`, `ASM_FIRE_NEEDS_RED`, `PEER_HIT_TALLIES_AND_CLEARS`,
`EMPTY_RANGE_ONE_SENTENCE`, `RANGE_IDLE_BEFORE_START` — 100 rows, 99/100 headless.

Left open (named): the per-device range clock between peers; the joiner's qual tables from remote hits; the unaided join (RED code
private by decision); the in-round CH picker bypass of "CH0 only"; the reticle over the APPROVE pill at 320 px; 2314 px of side panel
below the fold on desktop; the third wave (12 seats: voice, tap/double-tap, sticks, MAP view, DATA/EXPORT, REPLAY scrub, lanes 21–41,
HAL PI/EDGE, MoT 5.5, RESET mid-table, a lapse-then-fire, a data-channel drop) is owed after r.133 ships.

## Wave 3 — 12 seats (s27–s38) on the SERVED r.133 (449de5f; Deploy #926 ✓, Verify Live #1725 ✓ with the play.html probe)

| seat | lens | path | verdict | the one finding |
|---|---|---|---|---|
| s27 | Aset | tap / double-tap | PASS on the gate | amber double-tap refused (REJECT row), red double-tap fires; but a single tap on blank sky MARKS the locked plate, and after a lapse `#board` keeps the dead amber row (rangeRelease never calls list()) |
| s28 | Asar | MAP view | **FAIL** | in MAP `phys()` returns early: the phase strip freezes at TARGET FIRST through amber→red→HIT, the AI member stops ticking, the turret never slews; the map legend overprints the score strip; lane labels sit under the pills at 390; Capitol doors drawn on the range map; the MAP button is `#btnView` |
| s29 | Athena | DATA / SAVE / EXPORT | PASS | pack() carries events/decisions/metrics/replayHash/qual, all stamped 0.133; SAVE/EXPORT/pack never move the hash; SIX revision strings in one panel (r.0.133 · r0.133 · 0.133 · UPDATES r.128 · BOOT 0.125 · FIXTURE r0.103); SAVE = 4 downloads from one tap (phones drop three); "WIRE" is the whole EXPORT feedback; the QUAL clock runs under the panels |
| s30 | Christo | REPLAY scrub | **FAIL** | the invariant holds (world/hash untouched) but `#replayBar` is display:none at ≤900 px and in landscape, PLAY is inert, «» skip rows, log-rows and ev-rows shift columns |
| s31 | Enki | HAL PI · MoT 1.1 | PASS on play | 300 m plate hit on a phone (6×6 px floor box); HAL/MoT selects give NO toast; "PIP FLOOR … PX" exists only in a comment; PI budgetMs never throttles the loop (labelled, not simulated); `60/96` reads as an underrun |
| s32 | Enlil | MoT 5.5 desktop | PASS on the r.133 claim | side panel at x 1140–1440, overlap 0; but the fixed R-HEAD stick (z 8) sits on the panel's corner; 74 % of the panel below the fold with no scroll cue; the orange pit-box edge crosses the same-colour toast |
| s33 | Krishna | RESET mid table | **FAIL** | every visible expectation holds, but RESET is NOT on the record: hash identical before/after, BLU keeps counting (SCORE BLU 600 after a "fresh" table), no RESET row, not sent to a peer, no confirmation |
| s34 | Odin | lapse then fire | PASS | lapse = R+1 expired+1, hit = R+1 H+1, TOTAL and LAPSED consistent at every step; `hudScore()` runs one call before `qualRecordShot()` (one-frame lag on the FIRE tick) |
| s35 | Pangu | data-channel drop | **FAIL** | after the approver's page is gone the host shows DIRECT · 2p · MATCH for 48 s+, no toast, the red box holds silently, the fire lands; `dc close` only feeds `proofMark`, `com.peers` only rises, HELLO has no reply timeout, `fireN` never asks whether the approver is present |
| s36 | Sofia | VOICE without a mic | **FAIL** | toast + button say VOICE ON while the recognizer died `not-allowed` 20 ms later; a second press re-announces ON; NO MIC API unreachable in Chromium; the APPROVE regex runs before the HOLD regex so "don't approve" approves |
| s37 | Thoth | lanes 22/31/41 · determinism | PASS | same lane → same exposure order, lanes differ; the replay hash differs across two loads of the same lane BY DESIGN of its identity columns (SID, eventId, orderKey) — and `logicalClock` is beacon-driven, so the hash is not fully clock-free |
| s38 | Thor | AsM FIRE after approve | PASS on the invariant | APPROVE precedes HIT on all three, the AI never fired on amber, once per box; but in the SAME tick a second turret re-marks the just-downed plate (stale amber → approvable → a phantom MISS DOWN row), and the HIT row names the human device, the AI only in the log |

### New classes from wave 3
**D15** RESET (and the mode change) mutate the qualification with no canonical row: not on the record, not on the peer, no confirmation ·
**D16** the link has no liveness: DIRECT/peers/MATCH are last-written values, never a heartbeat with a timeout · **D17** VOICE reports the
intent, not the outcome (`r.start()` toasts ON before `onerror`) and negation is heard as consent · **D18** MAP view stops the world's
writers (strip, AI tick, slew) while the clock runs · **D19** the AI loop marks from a stale `live` after its own shot (one tick, two
turrets, the second marks a dead plate) · **D20** state changes that only log (HAL, MoT) are invisible to the player · **D21** the
replay bar is unreachable on a phone; PLAY inert · **D22** six revision strings on one panel; SAVE = four downloads.

### Held on r.133 (re-verified by wave 3)
The two-step by tap, key, button and voice grammar; one round per exposure; lapse/hit bookkeeping; SAVE/EXPORT/pack leave the hash; per-lane
seeded exposures; 300 m hittable on a phone; desktop panel in its strip; AI fires only after APPROVE, once per box.
