# Drone-2525 r.227 — H01: THE LINK OPENS THE LAWN ONLY ON A TRAINING RECORD (2026-10-22)

**Artefact commit 5af0af8 · carried `drone-2525_r.227.html` sha256 e76067b2ceab4e7ffdf9ca8900bfa1a08f86c6ebca4403ac198179e5c3b931d7.**

## His words (the night brief, 2026-10-21, verbatim)
> r.227 · H01. ?map=capital opens the lawn on Train Up only when Training's three drills are on the record. An empty
> record refuses. One player, one air track, A1 only.

And the doctrine behind it (CRS-CL.10, the brief's closed list): *"A link, a menu, or a query string cannot open a step
whose line above is empty."*

Measured before building: r.209's share sheet writes `?map=capital&station=…&role=turret&mode=…` for a Capital
station, and nothing in the deck reads `map` or `station` — the only query reader is `?range=` (`arcade()`, inside
`enterTheRange`'s frozen span, never edited). The record (`state.events`, `state.decisions`) is in memory and dies on
a reload. The boot QA's own rows hold a TRAIN DOWN START/TIME pair and plate hits, but no QUAL 40 COLD row.

## What changed (append zone, hoisted; no frozen definition moves)
- **`trainingOnTheRecord()`** reads the session's record and nothing else: TRAIN UP = a plate HIT row (`C-…`) whose
  `t` lies outside every TRAIN DOWN window; TRAIN DOWN = a START row (mode `stay`) with a TIME row at or after it;
  QUAL 40 = a COLD row (mode `qual40`). Returns the three and `ok`.
- **`openMapLink(map)`** — the one door for the link: on `ok` false it writes `REJECT LAWN {reason EMPTY_RECORD, via
  LINK, up, down, qual}`, says `TRAINING FIRST · THE RANGE · <the missing drills> NOT ON THE RECORD`, and returns
  false with the intro untouched; on `ok` it hides the intro, sets the Range link's own practice line (r.192), sets
  the drill to TRAIN UP and calls `pickScenario('capital')` — the lawn r.219 built: one player, one air track, A1.
- **The reader** runs at the end of script #1, after `arcade()` has consumed `?range=`: `?map=…` without `?range=` →
  `openMapLink(map)`. A Range QR link is byte-for-byte as before.
- **The menu path is not locked here.** SCEN → the Capital still opens the lawn directly; CL.10's "a menu" is the
  next row's business, named so it is not lost.

## The gate, red first (`redfirst/r227.md`)
`THE_LINK_REFUSES_AN_EMPTY_RECORD` inserted alone into the r.226 bytes: `openMapLink is not defined` — red. On the cut:
with the record swapped empty the door refuses (REJECT via LINK, the intro stays); on the real boot record `up` and
`down` are true and `qual` is false, so it still refuses; the three drills are then made through the deck's own doors
(`downStartOnRecord` + hits + `rangeTick`, a TRAIN UP hit after the window, `qualFinish`'s COLD row) and the link opens
the lawn on TRAIN UP, A1, exactly one standing object.

## Played on the real UI (manual evidence, 428×926, the cut served from a scratch public dir)
`play/MoT/timeline.json`: 25/25, 0 page errors — a `?map=capital&station=7&role=turret&mode=train-up` link opened
fresh: `capStep null`, CH0, the intro shown, one REJECT row, the toast `TRAINING FIRST · THE RANGE · TRAIN UP · TRAIN
DOWN · QUAL 40 NOT ON THE RECORD`, the predicate `{up false, down false, qual false}`; then the lawn through the menu
plays exactly as r.226 (the foil, the cue, the four, the fall, the Range after).

## The twelve seats, written from that play (80 words each; one fault in this revision, or SHIP)
- **Aset — consistency.** The lock reads one record one way: the same predicate for the link's refusal and the row's
  green leg, the same REJECT shape the deck already writes, the same practice line the Range link sets. The lawn
  through the menu is unchanged frame for frame. **SHIP.**
- **Asar — synthesis.** A fresh link: refused, named, the intro in place, one row on the record. The same link after
  the three drills: the lawn on TRAIN UP, A1, one track. The sentence says which drills are missing. **SHIP.**
- **Athena — his words.** "?map=capital opens the lawn on Train Up only when Training's three drills are on the
  record. An empty record refuses. One player, one air track, A1 only." Met literally, through the deck's own record
  and door; the menu is not in his sentence and is named as the next row. **SHIP.**
- **Christo — the player.** Scan the sheet's QR on a fresh phone: the intro stays and one line tells him the Range
  comes first and which drills he has not done. After Training in the same session, the link opens the lawn. A
  reload forgets the record — so the link's only use is in-session; the persisted record is a later rung. **SHIP.**
- **Enki — edge cases.** `?range=` still wins and is byte-identical; `?map=` with `?range=` defers to the Range;
  an unknown map refuses silently (returns false, no row — a downstream want); a plate hit inside a TRAIN DOWN window
  does not count as TRAIN UP; a START without its TIME is not a window. **SHIP.**
- **Enlil — build.** 0 page errors; the row red on r.226 and green on the cut; two hoisted functions and one IIFE in
  the append zone; range-frozen 100/0; both scripts parse; the manifest gains one id. **SHIP.**
- **Krishna — integration.** `openMapLink` enters through `pickScenario('capital')` — the one door r.208/r.219 built —
  and sets the practice line the way `enterTheRange` does, so `roundOpen()` is true on arrival; the REJECT row rides
  `decide()`, so it reaches a room's peers like every other refusal. **SHIP.**
- **Odin — future-proofing.** The predicate is the lock the ladder needs: the menu (next row), Intermediate's gate
  ("Introductory works") and Real-World's (CL.10) can read the same three fields and extend them. **SHIP.**
- **Pangu — cutting edge.** A link that refuses a fresh tab is the honest form of a lock on an in-memory record;
  pretending otherwise would be the invention. **SHIP.**
- **Sofia — many lenses.** One toast sentence, no new control, no new row on the glass; the intro's own screen stays
  as it was. **SHIP.**
- **Thoth — data.** The REJECT row carries `up/down/qual` so the record says why; the window test uses the rows' own
  `t`; on the boot record `up true · down true · qual false` is the measured truth of what the QA writes. **SHIP.**
- **Thor — risk.** No frozen definition moves; the `?range=` reader is byte-identical and pinned; the lawn's boot
  rows and the harness enter by `pickScenario` and are untouched by the lock; a crafted link cannot bypass the
  predicate because the predicate reads rows, not the URL. **SHIP.**

## SSSES, three attempts (recorded; a low pillar does not open a new feature)
1. **As built — Security 96 · Stability 92 · Scalability 94 · Efficiency 95 · Succinctness 84.** Security: the lock
   reads rows, never the URL; the practice line is the Range link's own. Stability: one door, one predicate, one
   reader; the row proves both legs. Scalability: O(rows) once at load. Efficiency: one scan at load. Succinctness
   (lowest): the boot row's boilerplate (the tenth copy) and the three-drill synthesis inside it.
2. **Attempt 2 — drop the window test and count any plate hit as TRAIN UP:** simpler, but a Train Down hit would
   count as Train Up; the pass line weakens. Not kept.
3. **Attempt 3 — read the TRAINING_IS_ON_THE_RECORD row's own result instead of the rows:** that row plays the
   drills in QA; the lock must read the player's rows. Not kept. **Kept: attempt 1.**

## One spiral
Forward — the link → the reader → the predicate → the REJECT row and the sentence, or the door → `pickScenario` → the
lawn on TRAIN UP → the three presses. The first place truth is lost: none inside this row; outside it, the menu still
opens the lawn on an empty record (CL.10 whole is the next row), and a link can never open the lawn in a fresh tab
because the record dies on a reload — the persisted record is a later rung. Backward — from "A1 only, one track": the
door is `pickScenario('capital')`, which seats A1 and stands one track (r.219's rows still green); the first assumption
tested — "the boot record holds all three drills" — is false (`qual false`), which is why the row makes the third drill
through `qualFinish` rather than assuming it. **Closer: no change.**

## Not here, stated
- The menu lock (CRS-CL.10 whole): SCEN → the Capital still opens the lawn on an empty record.
- A persisted record (a link that opens the lawn in a fresh tab after Training on another day).
- An unknown `?map=` value refuses without a row.
