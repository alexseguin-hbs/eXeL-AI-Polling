# Claude Code notes · r.197 (2026-10-12) — TRAIN DOWN on the record

**Asks (operator 2026-10-11, verbatim):** "Train-Down where we have timer under stop light tonsee how fast to target all 3" · "that way a 3v3 drone can
have challenges targeting number of targets (6 people per team), to find the best time similar to Train-Down at "The Range.""

**Invariant (in the deck as a comment on `downStartOnRecord`):** TRAIN DOWN is a timed run on the record. START raises the lane's targets and opens the
clock as a decision row behind the same door as a shot; the clock stops the instant the last target is down and the time is a decision row; both reach
every seat and enter the replay hash.

## Causes
1. r.178 had no clock: TRAIN DOWN was "every target up, a hit stays down, ALL DOWN · PRESS RESTART" — no time anywhere.
2. r.182 (`aac4db9b`, a hand edit never registered) added the clock under the light but START mutated the plates and a local stopwatch directly: not a
   row, not sent to the other phone, not in the replay hash — the one thing the 3v3 challenge will score was display-only.
3. `rangeAllDown` was computed from "no plate standing", so an armed lane (every target down before START) read as ALL DOWN.

## What a player meets
- Pick TRAIN DOWN (menu, RESTART, a lane change, or the QR link in that mode): every target is down, the light says WAIT, the button says START, the
  strip says PRESS START.
- START: every target stands, the light goes green, the clock runs under the lamps (TIME m:ss.t) and on the strip; TARGET → APPROVE → FIRE on each.
- The last target down: the clock stops — ALL DOWN · m:ss.t on the light, the strip and the hint; RESTART lit; RESTART re-arms.
- START before PRACTICE or the room's start, or while the clock runs: refused, with the reason, and a REJECT row.
- In a room: the START row runs the same lane's clock on the other phone; the TIME row is the time there too (one clock per lane, the host's).

## Gates
- `TRAIN_DOWN_CLOCK` — armed (every target down, START, WAIT) → START (every target up, a START row with `targets:11`, FIRE) → running (TIME,
  m:ss.t) → the last target down (a TIME row within 50 ms of the clock) → ALL DOWN · m:ss.t on the light, the strip and the hint.
- `TRAIN_DOWN_ON_THE_RECORD` — START before the round: REJECT ROUND_NOT_OPEN; START while running: REJECT CLOCK_RUNNING; START and TIME rows on the
  record; the replay hash moves.
- `MODE_DOWN_ALL_DOWN` re-stated through START (it forced every plate down without a START and read ALL DOWN).
- `drone-playable`: `TRAIN_DOWN_N` declared; `downStartOnRecord`; `decide('START'…)` with `targets`; `decide('TIME'…)`; START/TIME in the wire kinds; the
  peer branches; the mode opens armed.
- Boot QA both orientations (only `SYNC_DIRECT` red); `drone-team-e2e` 10/10; `range-2525`; `deck-consistency`; `drone-revisions`; `traceability` (rev 75
  cites the commit that carries 0.197); `tsc` clean; `next build` with the deck gates in prebuild.

## Open (defaults taken, on the record)
- "all 3": the lane raises its 11; `TRAIN_DOWN_N` raises the nearest N when set, and the START row carries `targets:N` either way — one constant, never a
  second mode. The operator names the number.

## Owed
- r.198 QUAL: the five pose rasters matched to the four magazines; the range goes cold (a COLD row).
- r.199 R-CORE on the range in the shared format from the shared ledger; DD-01…DD-06; the ship column filled.

Artefact commit `f65885b` · deck sha256 `1e6fd69cfe8368d14ebd3c107bf482654c0bafcac8e5896048d167913535057c`.
