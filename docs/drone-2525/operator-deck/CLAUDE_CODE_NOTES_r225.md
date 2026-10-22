# Drone-2525 r.225 — H01: TRAIN DOWN ENDS AND THE STRIP KEEPS THE FOUR (2026-10-22)

**Artefact commit f760ba8 · carried `drone-2525_r.225.html` sha256 9e344668c47dc1fab8a8cf632adf6d7d3bd97b7cf219b0af4555bd5c33089d7f.**

## His words (the night brief, 2026-10-21, verbatim)
> r.225 · H01. Train Down ends and the strip keeps hits, misses, rounds, and time. The toast may expire. The strip
> does not. HI 1 · systems 1 · partners 0.

Measured before building (on the r.224 bytes, read-only): at `R.go === 'done'` the lawn already shows `ALL DOWN`,
the time under the light, `HIT n · MISS n` on the strip and the rounds in the magazine, and nothing auto-resets. What
wipes them is RESTART — `capIntroPress → capIntroReset('RESTART')` arms the next run and the strip falls back to
`HIT 0 · MISS 0`, the clock to blank — and the strip itself never carried the rounds or the time. The row is therefore
one state field and one reader.

## What changed (all in the FREE `capIntro*` family; no frozen definition moves)
- **`state.capLast`** — set in `capIntroTick` where the run ends, beside the CTIME row and from the same four numbers
  (`hits`, `misses`, `rounds`, `ms`); no new row, no new verb (the patcher refuses a second CTIME site or a `CLAST`).
- **`capStripText()`** (hoisted, append zone) — while the run is done, or the next run is merely armed by RESTART
  (not started), the strip reads `HIT n · MISS n · n RDS · m:ss.t` from `capLast`; a live run reads the live
  `HIT n · MISS n` from `capIntroRows`. The lawn's one strip writer (`capPaintScore`, r.222) reads it, so the mirror
  `#magStrip` and the observer carry the same text.
- **`capIntroReset(why)`** forgets `capLast` for a new visit (`ENTER`) or a new drill (`MODE`) — never for `RESTART`.

## The gate, red first (`redfirst/r225.md`)
`THE_STRIP_KEEPS_THE_FOUR` inserted alone into the r.224 bytes: after ALL DOWN the strip reads `HIT 1 · MISS 0` (no
rounds, no time) and RESTART wipes it to `HIT 0 · MISS 0` — red. On the cut: `HIT 1 · MISS 0 · 1 RD · 0:02.5` at ALL
DOWN, the same four seconds later, the same after RESTART (armed), the live `HIT 0 · MISS 0` after START.

## Played on the real UI (manual evidence, 428×926, the cut served from a scratch public dir)
`play/MoT/timeline.json`: 23/23 checks, 0 page errors — r.223's twenty unchanged (the foil at 1× and 30×, stroke only,
it rotates; the cue; the pre-cue FIRE refused; the paused FIRE; the Range after) with the two strip checks
re-expressed for the four, plus r.225's three: four seconds after ALL DOWN the strip reads `HIT 1 · MISS 0 · 1 RD ·
0:02.1` unchanged (the toast still shows `ALL DOWN · 0:02.1`); after RESTART (armed) the same; after START (live)
`HIT 0 · MISS 0`.

## The twelve seats, written from that play (80 words each; one fault in this revision, or SHIP)
- **Aset — consistency.** The strip keeps one shape at every moment: `HIT 0 · MISS 0` at entry, the live count
  during a run, the four at ALL DOWN, the same four at four seconds and after RESTART, the live count again at START.
  The mirror reads the same text — one writer, the same observer as r.222. Nothing on the Range changes. **SHIP.**
- **Asar — synthesis.** The run ends and reads whole on one line: `HIT 1 · MISS 0 · 1 RD · 0:02.1`, agreeing with
  CTIME {hits 1, misses 0, rounds 1, ms 2133}, the clock `0:02.1` and the magazine 29. RESTART keeps that line while
  the next run is armed; START clears it to live. **SHIP.**
- **Athena — his words.** "Train Down ends and the strip keeps hits, misses, rounds, and time. The toast may expire.
  The strip does not." Met on the real glass: all four on the strip, kept through four seconds and through RESTART;
  no new row, no new verb (the CTIME row is the only writer of those four); HI 1 · systems 1 · partners 0. **SHIP.**
- **Christo — the player.** After the hit he reads his whole run on the strip and can keep reading it while he
  arms the next; START clears it, as it should. At 428×926 the line's tail runs under the count magazine card — the
  strip-and-card overlap he named as outside the row; on landscape and a PC the four are clear. **SHIP**; aside only.
- **Enki — edge cases.** MODE to TRAIN UP forgets the four (a new drill); leaving the lawn forgets them (ENTER on
  return); a second completed run replaces them; a paused second run reads the live `HIT 1 · MISS 0`; RESTART before
  any run ends (no `capLast`) reads `HIT 0 · MISS 0`. The toast's own lifetime is untouched. **SHIP.**
- **Enlil — build.** 0 page errors; the row red on r.224 and green on the cut; the three edits and the reader are
  FREE; range-frozen 100/0; both scripts parse; the patcher asserts one CTIME site and no `CLAST`; the manifest gains
  one id. **SHIP.**
- **Krishna — integration.** `capPaintScore`'s one-writer-plus-observer mechanism (r.222) carries the four to
  `#phScore` and `#magStrip` alike; `hudScore`'s BLU/RED else-branch is still overridden; the Range's own strip and
  the r.224 drone tally are untouched; the lawn play on these bytes is 23/23. **SHIP.**
- **Odin — future-proofing.** `capLast` is the seed of a per-run record for the later rungs — four numbers per seat
  per run — and the fall (r.226) does not touch it. **SHIP.**
- **Pangu — cutting edge.** A plainer strip (`1 · 0 · 1 · 0:02.1`) would lose the labels his row names; the words
  keep it readable. **SHIP.**
- **Sofia — many lenses.** The four are legible in the DOM and on landscape and PC; at phone portrait the tail sits
  under the count card — the named overlap, outside this row. The middle dots render; nothing new overlaps the
  buttons, the light or the magazine. **SHIP**, aside only.
- **Thoth — data.** CTIME {ms 2133, hits 1, misses 0, rounds 1} → the strip `HIT 1 · MISS 0 · 1 RD · 0:02.1` (tenths
  floored, as the clock does); `capLast` equals CTIME; the magazine 30→29 = rounds. **SHIP.**
- **Thor — risk.** The strip never reads BLU/RED (the r.222 row's two legs still green); `capLast` is cleared on a
  new visit or drill, so no stale numbers leak into another run; the Range is untouched and the two play-throughs
  must be byte-identical (the chain proves it before the push). **SHIP.**

## SSSES, three attempts (recorded; a low pillar does not open a new feature)
1. **As built — Security 97 · Stability 92 · Scalability 94 · Efficiency 94 · Succinctness 82.** Security: no new
   input path; the four come from the deck's own rows. Stability: one field, one reader, cleared at the two exits.
   Scalability: per-run state, O(1). Efficiency: one string per frame, written only on change. Succinctness (lowest):
   the boot row's snapshot boilerplate again (the eighth copy).
2. **Attempt 2 — fold the `done` and `armed` branches:** they are already one condition. No change.
3. **Attempt 3 — drop the `RDS` plural:** his words say "rounds"; the label follows the count. No change.
   **Kept: attempt 1.**

## One spiral
Forward — the run ends → `capLast` → the strip reads the four → the toast expires → RESTART arms the next run, the four
stay → START, the live count. The first place truth is lost: the clock under the light goes blank while the next run
is armed — the strip keeps the time, the clock does not; his row names the strip, so this is one line, not a fault.
Backward — from the four stored: the strip reads `capLast`, written in the same statement as CTIME from the same
four; the first assumption tested — "the toast may expire" — had not yet happened at four seconds, and the strip does
not depend on it. **Closer: no change.**

## Not here, stated
- The foil's fall (r.226): the track still vanishes on the hit; the four are unaffected.
- The clock under the light while the next run is armed (blank) — one line, outside the row.
- The strip's tail under the count card at phone portrait — the named overlap, outside the row.
