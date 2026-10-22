# Drone-2525 r.228 — H02: TWO HI ON ONE SYSTEM (2026-10-22)

**Artefact commit bcdbb15 · carried `drone-2525_r.228.html` sha256 a9b1aa019449a5d548d30c6bece406e9ee1432cead0302b405648d567624cc99.**

## His words (the night brief, 2026-10-21, verbatim)
> r.228 · H02. Two HI, one system, one partner. The pilot and the gunner. A press from either is accepted. A second
> FIRE on the same mark is refused. The record names both.

CRS-CL.H02 (file 1): HI 2 · systems 1 · partners 1 · scene H01.S (Enki's Spark; the same three presses; no mode change).
And DD-148 (2026-10-22): *"Use playwright to test each major execution phase, SSSES AND SPIRAL TEST, and AsM report out
each phase."*

## Measured before building (the r.227 bytes; every function named is FREE — none in `tests/range-spans.json`)
The deck already has a two-phone room over WebRTC (`drone-team-e2e.mjs`: host offer → joiner answer → DIRECT → team auth
→ READY → START → LIVE). A room at challenge 1/3/5 landed on the old ring seat; the lawn's four rows (CSTART, CTIME,
CRESET, CUE) never travelled (decide's wire list); `marksPersist()` was false in a room; `approveDesig` and `wireApprove`
held TWO_HUMANS on a self-approve; `fireN` refused the approver's seat (NOT_THE_MARKERS_SEAT); a second FIRE on a struck
track was a TARGET_GONE. **And no room could launch at all**: the real e2e read `ROOM HOLD · WAIT BOTH READY` on every
deck from r.219 on (green on r.216 and r.218) — the joiner's READY row never landed on the host.

## What changed (the patcher `patches/r227_to_r228.py`; new definitions hoisted in the append zone)
- **The lawn door.** `lobbyLaunchSnapshot()` carries `lawn:(+state._selCh===1)` — the CH1 LAWN chip's own word;
  `lobbyEnterLive` opens `pickScenario('capital')` on both phones when `data.lawn===true` (one system A1, one air track,
  LIVE). A snapshot without the field lands where it always did — the old capitol two-phone seat is untouched.
- **The four lawn verbs on the wire.** `decide()` sends CSTART/CTIME/CRESET/CUE; `applyWorld` hands a peer's row to the
  hoisted `capLawnPeer(row)`. **One clock per room (r.197's law):** `capLawnWrites()` — the host's tick writes CUE and
  CTIME; the joiner plays the fall and reads the host's rows.
- **Either HI's press is accepted on the lawn.** `marksPersist()` holds the bullseye reading in a lawn room; the
  TWO_HUMANS holds and the NOT_THE_MARKERS_SEAT reject are off when `capLawnCrew()` — the lawn, in LIVE. The Range room
  is untouched (the r.129 pins still match; the CH0 e2e reads as before).
- **A second FIRE on the same mark is refused.** `fireN`, on the lawn in a room: the track struck (`lifePct<=0`) and the
  mark the track's or already gone → `REJECT ALREADY_DOWN`, `ALREADY DOWN · THE OTHER HI TOOK IT`, no round.
- **The record names both.** CSTART and CTIME carry `system:'A1'` and `hi:[…]` — the room's member ids; every HIT, MISS,
  APPROVE and DESIGNATED row already carries its phone.
- **The play's two findings, fixed in the same cut (the r.224 precedent: a fault the play finds is fixed before the cut).**
  (1) The SNAPSHOT handler set the joiner's `state.evSeq` to the host's; eventIds are per phone (`SID-E<n>`), so the
  joiner's next row reused an id the host already held and was dropped — `state.evSeq=Math.max(state.evSeq||0,+pay.evSeq||0)`.
  (2) With the room launching, the host's boot self-check START(stay)/TIME/RESET rows, replayed through the joiner's
  snapshot, armed the joiner's lane in TRAIN DOWN and its APPROVE was refused TARGET_DOWN — `ev()` stamps every row
  `qa:!!state.qaArmed`; `applyWorld` returns at its head for a peer's qa row (never a LOBBY_ row): the row stays on the
  record (one hash on both phones) and drives nothing here.

## The gate, red first (`redfirst/r228.md`)
`TWO_HI_ONE_SYSTEM` inserted alone into the r.227 bytes: RED (no door in the snapshot, none in `lobbyEnterLive`, the verbs
not on the wire, a self-approve held TWO_HUMANS, CSTART naming one HI). On the cut: green — the door in both places; the
four verbs on the wire; both on the lawn in LIVE; CSTART names both; my mark amber, my own approve red; the other HI's
mark approved by that HI red; FIRE from the seat that did not mark it a hit (30→29); a second FIRE refused ALREADY_DOWN
(29→29); CTIME names both. The two findings' red-first is the real e2e itself: red at READY on r.227, 6/10 on the
counter fix alone, 9/10 (the HEAD check only) with both.

## Played through the real UI (Playwright; DD-148)
- **The two-phone lawn room** (`lawn-room.mjs`, 390×844 both phones, `play/room10/` on the cut that carries the twelve's thirteen fixes): **25/25, 0 page errors** — both on
  the lawn in LIVE; MODE and START travel; the cue on both from the host; the host marks, the joiner approves (red on
  both), the joiner fires (a hit, 30→29 on the joiner), the host's FIRE on the same mark refused, no round; CTIME on both
  from the host with `hi` naming both; the strip's four on both; one hash. Scene 2: RESTART keeps the four; the host's
  self-approve accepted; the host fires; the joiner's second FIRE refused; one hash. The three checks the first round
  earned: the joiner's FIRE lit and the recital `PRESS FIRE` on both after the joiner's APPROVE; `LAST · UAV-1 · DOWN` on
  both after a partner's hit; the joiner's foil down at the host's CTIME (`fall 1`, never frozen mid-air).
- **The solo lawn** (one HI, `play/solo/`): 25/25 — unchanged.
- **The Range room** (CH0, `drone-team-e2e.mjs` on the cut): 9/10 — the HEAD check the only miss on a carried file.

## The twelve seats, first round (from the plays of the first cut; `play12.workflow.js`, run wf_551d7d3a-d7f)
5 SHIP (Athena, Enlil, Odin, Pangu, Thoth) · 7 FAULT → the synthesis verified every fault and merged three into one class:
**FIX FIRST, five faults, all in free code — fixed before the cut:**
1. **The glass spoke the Range rule while the press acted** (Aset, Christo, Sofia): `approveWorksHere` / `fireWorksHere` —
   the predicates the lit button and the recital read — still carried the Range's LIVE rule, so the joiner's FIRE was dark
   under "THE OTHER SEAT FIRES" and then struck (r.207's law broken on the row's own press). Fixed: both predicates and the
   four Range-rule toast tails (designate, markLock, approveDesig, fireN) learn `capLawnCrew()`.
2. **`capLawnCrew()` keyed on this phone's scenery, not the room's door** (Thor): a LIVE CH0 phone that wandered to SCEN
   CAPITAL became a crew of one. Fixed: the crew is `capIntro() && LIVE && launch.lawn===true`; `marksPersist()` follows.
3. **The host's CTIME froze the joiner's foil mid-fall** (Krishna): `capLawnPeer`'s CTIME stamped `R.hitT`, which gates the
   tick's fall. Fixed: the CTIME branch finishes the fall (down, on the ground, the mark dropped) before stamping.
4. **A departed host left the joiner with no cue and no ALL DOWN** (Enki): `capLawnWrites()` was `!LIVE || host`. Fixed:
   `|| com.path==='DROPPED'` — the HI left alone keeps the clock.
5. **A partner's HIT left this phone's recital at TARGET FIRST** (Asar): `applyWorld`'s peer-HIT line set no `lastShot` for a
   non-plate. Fixed: a partner's hit on the track is this phone's LAST too.
The second round (run wf_11a51344-38a), on the cut that carries all five: 8 SHIP (Aset, Asar, Athena, Enlil, Krishna,
Odin, Pangu, Thoth) · 4 FAULT → the synthesis confirmed three one-line gaps in free code, **fixed before the cut**:
6. **The approver's own glass named the partner** (Christo, Sofia): `approveDesig`'s toast head keyed on who marked, so the
   joiner's own APPROVE read "APPROVED BY THE OTHER SEAT". Fixed: on the lawn crew the head reads "APPROVED BY YOU".
7. **A joiner's hit inside the host's silent window never closed the run** (Enki): the CTIME close ran only on the fall's
   tick, when the joiner still had no clock; once the loss was detected nothing re-entered it. Fixed: a stay run with its
   hit landed and the clock now this phone's closes on the next tick with the hit's own time; the boot row carries the leg.
8. **The partner's-hit LAST reached the old capitol seat** (Thor): the `lastShot` edit had no lawn gate. Fixed: `capLawnCrew()`.
The third round (run wf_7db70082-855), on the cut that carries all eight: 7 SHIP · 5 FAULT → the synthesis confirmed five
small gaps, **fixed before the cut**: (9) the partner was named two ways on the lawn — `seatName()` says THE OTHER HI on the
lawn crew in the relay toasts, `wireApprove`'s sentence, `seatWord()`, the RELOAD / WITHDREW / NOBODY-APPROVED toasts
(Aset, Sofia); (10) the shooter's own double-tap was told the partner took it — the ALREADY_DOWN toast reads the record's
last HIT row: YOU TOOK IT or THE OTHER HI TOOK IT (Christo); (11) `capLawnWrites()` keyed on the host, not the crew — a
LIVE non-host phone that wanders to the Capital outside a lawn room keeps its own clock as r.227 gave it (Krishna);
(12) the H02 row in the lawn CRS and INTRO.02 in the plan still decree the Range rule — an appended amendment line in each
quotes his later words; no row is edited (Odin); (13) the ledger text printed the expression where the hash belongs —
and not only here: revs 104, 106 and 107 (r.224, r.226, r.227) carry the literal `"+H[:8]+"`; a correction row (rev 108,
appended before the cut, in commit A) names the three with their true hashes, and r.228's own row is rev 109 (Odin's aside).
The fourth round, on the cut that carries all thirteen:
On the fixed cut's plays (`play/room11/` 27/27, `play/solo/` 25/25, `../e2e/r228cut6.log` 9/10 — the HEAD check the only
miss; sha256 b393a12a…) the fourth round, re-run in full on Opus 4.8 after the session left Fable, returned **twelve SHIP,
0 FAULT; the synthesis SHIP**. Each seat re-read the evidence read-only: the two-phone room's record is byte-identical on
both phones (hash 09a7d6f0 scene 1, 99652a68 scene 2; events 137/137), every clock row is the host's (CTIME from the host,
`capLawnHi()` naming both), the second FIRE on the struck mark is refused `ALREADY_DOWN` with no round (host 30→30, joiner
29→29), and CSTART/CTIME carry `system:'A1'` and `hi:[both ids]`; `range-frozen` 100 definitions + 3 moved-map spans, 0
moved; the Range room byte-equal (CH0 self-approve still refused TWO_HUMANS, the marker's seat still fires, hash
e9fac447==e9fac447). Two forward-looking asides, not faults: for H03/H04 `capLawnHi()` must read per-system and the press
rows gain a `system` field (Odin — additive); the reconnect reseed of the event counter is pre-existing and strictly
improved, not introduced here (Pangu). The two round-four faults themselves (Aset's markLock marker-read, Christo's lawn
entry toast) were fixed before this round and are green on the cut, red-first on the pre-fix bytes (`play/room-prefix/`).

## SSSES, three attempts (`ssses-spiral.workflow.js`)
Three attempts on Opus 4.8, all **"as built"** (changed=false): no same-members/same-meaning form raised the lowest pillar
without breaking a rule, so the judge kept **attempt 1**. Scores: Security **90** · Stability **94** · Scalability **80**
(lowest) · Efficiency **88** · Succinctness **85**; all three rules green — the pass line holds (the room launches, either
HI's press lands, a second FIRE on the mark is refused, CSTART/CTIME name both), the Range is untouched (0 edited functions
in `range-spans.json`; CH0 self-approve still refused; both phones e9fac447), and no new control or row (the new signal is
four wire verbs and transient toasts, buttons 106→106). The lowest — Scalability 80 — is set by two facts r.228 did not
introduce and cannot reshape under the rules: the join path replays the host's full event history through `applyWorld`
(O(session-length), the pre-existing SNAPSHOT path M4b/M4c only harden), and the construct is bounded by CRS-CL.H02 to one
partner / one system / one air track (lifting that is H03/H04). So the honest call is no edit.

## One spiral
Forward (the change → the record → the glass → the magazine → the next press): M4b's `Math.max` is what lets the room launch
at all (a peer's snapshot had rewound this phone's per-phone eventId counter, every room stalled at READY since r.219); the
CH1-LAWN door puts both phones on the one A1 system and the one foil; `capLawnCrew()` lets either HI's TARGET/APPROVE/FIRE
land; M4 refuses a second FIRE on the struck track, so the record is one hash on both phones (09a7d6f0, 137 events,
CSTART/CTIME naming both HI and system A1). The first place truth is lost is **the magazine**: on the one A1 system the phone
that did not press FIRE still reads 30 RDS full while the record shows one round spent — `magSpend`/`hudMag` are frozen
(r.138) and "one magazine per system" is already deferred, so **inRevision false**. Backward (door → cue → three presses →
one track → the four numbers): no link is false end to end (room11 27/27, byte-identical 148-row records, hash MATCH). The
first assumption not unconditionally true is **the two-FIRE race inside one wire latency** — M4's refusal keys on
`lifePct<=0`, so two near-simultaneous presses both clear the guard before the first HIT propagates; it is off the sequential
demonstrated path and is the disclosed "named, not fixed" decision. **Closing change: none** — the worse first-place (the
magazine) is outside the revision and frozen; the in-revision one (the race) needs a cross-phone fire-arbiter, a new control
that would break the sequential pass line and the Range's shared fire-acceptance. The kept form is as built.

## Decisions (reversible in one word)
CH1 LAWN is the lawn room's door · the host's clock writes CUE and CTIME · START/RESTART/MODE from either phone travel ·
`ALREADY_DOWN` as the lawn's own reason word · pilot/gunner roles are not named in rows (the lawn turret has no one flying;
the control law is a later row) · the magazine stays per phone (`magSpend` is frozen; r.138) · the two-FIRE race inside
one wire latency is named, not fixed · the two play findings are fixed inside this revision (they are the room's own
floor; without them H02 cannot be played).

## Not here, stated
- Pilot/gunner roles in rows; one magazine per system; the two-FIRE race; H03 (r.229) and H04 (r.230).
- The self-check's rows still precede the player's on his own record (named at r.222); they now drive no other phone.
