# Drone-2525 r.226 — H01: THE FOIL DROPS, IT DOES NOT VANISH (2026-10-22)

**Artefact commit 6654c01 · carried `drone-2525_r.226.html` sha256 29eb6e6ce35de74e150c0fd4a8905631f4746f5905b8fb140aa35e1e62b3835f.**

## His words (the night brief, 2026-10-21, verbatim)
> r.226 · H01. Only if the r.223 foil vanishes instead of dropping. Reuse the fall the plates already use. If it
> already drops, SKIP.

Measured before building (the r.223 spiral's backward finding, re-read on the r.225 bytes): `applyWorld`'s HIT handler
lowers a struck non-plate in the same press — `if((o.lifePct||0)<=0&&!o.form) o.up=false;` — so `capIntroTick`'s fall
ramp (`d.fall += dt·2.4`, the plates' own shape from r.206) never ran for a local hit, and the drone painter's
`if(!d.up) return` removed the foil on the next frame: it vanished, as the box had. Not a SKIP.

## What changed (four edits, all FREE; no frozen definition moves)
- **`applyWorld`** exempts the lawn's track (`o===capIntroTrack()`) from that line, exactly as the line already
  exempts a plate (`o.form`): the track keeps its feet through its fall and its own tick lowers it when the fall ends.
- **`capIntroTick`** — the plates' ramp (0→1 at 2.4/s) now also drops the track to the ground: `d.y` goes from the
  track's altitude to 1 m as `fall` goes 0→1; and the mark is dropped at the first frame of the fall (`R.falling`,
  `dropMark(id,'FALL')`), so a second FIRE during the 0.4 s has no red box — one HIT row, one CTIME, as before.
- **`foilDraw`** noses the foil over as it falls (`A.pitch −= fall·π/2`): the hovering tail-sitter tips to level and
  sinks.
- **`lockOn`** keeps a falling track (`lifePct ≤ 0`) out of the lock, as the plate pool already keeps a falling plate.

## The gate, red first (`redfirst/r226.md`)
`THE_FOIL_DROPS` inserted alone into the r.225 bytes: right after FIRE the track is down and gone — red. On the cut:
still up at lifePct 0 with the fall begun and the mark dropped; the foil still drawn while falling; 0.2 s in, sinking;
down at the ramp's end (400 ms); one CTIME with one hit.

## Played on the real UI (manual evidence, 428×926, the cut served from a scratch public dir)
`play/MoT/timeline.json`: 24/24, 0 page errors — r.225's twenty-three unchanged, plus on the frame after FIRE the track
reads `up true · lifePct 0 · fall 0.13 · y 10.6 m` with 111 foil segments drawn; then `HIT · UAV-1 · DOWN`, ALL DOWN,
CTIME {ms 2533, hits 1, misses 0, rounds 1}, the strip `HIT 1 · MISS 0 · 1 RD · 0:02.5`.

## The twelve seats, written from that play (80 words each; one fault in this revision, or SHIP)
- **Aset — consistency.** The foil is the same foil through the hit: drawn standing, drawn falling (111 segments on
  the frame after FIRE), gone when down — the plates' own sequence. The strip, the clock and the magazine read as
  r.225 left them; the Range is untouched. **SHIP.**
- **Asar — synthesis.** FIRE → the foil tips and sinks for 0.4 s → down → `HIT · UAV-1 · DOWN`, ALL DOWN, CTIME
  {1, 0, 1, 2533 ms}, the strip's four. One hit, one row, one fall. **SHIP.**
- **Athena — his words.** The foil vanished, so the row applies; "reuse the fall the plates already use" is met
  literally — the same `fall` field, the same 2.4/s ramp, the same exemption in `applyWorld` that a plate has. Not a
  SKIP. **SHIP.**
- **Christo — the player.** The hit now looks like a hit: the foil noses over and drops to the ground instead of
  blinking out. At 1× it is a 14-px thing falling 12 m — short but visible; at 30× the whole wire tips. **SHIP.**
- **Enki — edge cases.** A second FIRE during the fall: the mark is gone at the first frame, so it is refused with
  no round; the lock ignores the falling track; the time-out and Train Up's return are unchanged (the ramp ends with
  `up=false` as before, then RETURN_S). The Range drone of r.224 still vanishes — its row asked for no fall. **SHIP.**
- **Enlil — build.** 0 page errors; the row red on r.225 and green on the cut; four FREE edits; range-frozen 100/0;
  both scripts parse; the patcher asserts one CTIME site; the manifest gains one id. **SHIP.**
- **Krishna — integration.** The exemption in `applyWorld` is keyed on `capIntroTrack()` so the Range's plates and
  the r.224 drone are untouched; `lockOn`'s `lifePct ≤ 0` guard matches the plate pool's; the r.225 strip and the
  r.222 observer are unchanged (the play's 23 earlier checks still green). **SHIP.**
- **Odin — future-proofing.** The fall is a state ramp the later tiers' tracks can reuse as is; the foil's
  nose-over is one line in `foilDraw` keyed on `fall`, so a moving track falls the same way. **SHIP.**
- **Pangu — cutting edge.** A tail-sitter that tips to level and drops is the simplest honest fall; a tumble would
  be invention. **SHIP.**
- **Sofia — many lenses.** Nothing new on the glass: no control, no row, no word; the fall is 0.4 s of motion where
  there was a blink. **SHIP.**
- **Thoth — data.** On the frame after FIRE: `fall 0.13` = 0.05 + 2.4·dt over one frame; `y 10.6` = 1 + 11·(1 −
  0.13); the ramp ends at 400 ms (the row) ; one CTIME, hits 1, misses 0, rounds 1. **SHIP.**
- **Thor — risk.** A falling track that still reads `up` could be targeted: the lock excludes it and its mark is
  dropped at the first frame; the peer-HIT path keeps the same exemption; the two Range play-throughs must be
  byte-identical (the chain proves it before the push). **SHIP.**

## SSSES, three attempts (recorded; a low pillar does not open a new feature)
1. **As built — Security 97 · Stability 91 · Scalability 94 · Efficiency 93 · Succinctness 83.** Security: no new
   input path. Stability: the four edits are guarded on the one track; the fall ends as before. Scalability: per-track
   state. Efficiency: one extra condition per HIT row and per lock pass. Succinctness (lowest): the boot row's
   boilerplate (the ninth copy).
2. **Attempt 2 — fold the mark-drop into `dropMark`'s existing call at the ramp's end:** that is the vanish's own
   timing; the mark must go at the first frame. No change.
3. **Attempt 3 — a shared `isLawnTrack(o)` helper for the two guards:** two call sites, one expression each. No change.
   **Kept: attempt 1.**

## One spiral
Forward — FIRE → `applyHit` (lifePct 0, fall 0.05) → the HIT row → `applyWorld` leaves the track up → the next tick
drops the mark, sinks it, noses the foil over → 0.4 s → down → CTIME → the strip's four. The first place truth is
lost: none inside this row; outside it, the Range drone of r.224 still vanishes on a hit (its row asked for no fall)
— one line. Backward — from "same fall": the plates' ramp field, rate and exemption are reused, not copied; the first
assumption tested — "a falling track cannot be fired on twice" — holds because the mark goes at the first frame and
the lock excludes it. **Closer: no change.**

## Not here, stated
- The Range drone's fall (r.224 — it vanishes; a downstream want, not in the queue).
- The ladder lock and the `?map=` reader (r.227).
