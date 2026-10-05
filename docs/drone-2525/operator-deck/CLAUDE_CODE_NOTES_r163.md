# Claude Code notes · r.163 (2026-10-05)

**Asks (verbatim):** Addendum 18 — "we need T1, T2, T3 as order of targets gets labeled.  So I can Approve T3 and Fire T3, or Approve T1, Approve T3
and Fire 1". Addendum 21 — "Note: Splash now stays too long after firing."

## What a player meets differently
- Mark targets in any order: they are T1, T2, T3 … in that order. Re-marking one keeps its number. RESTART starts at T1.
- PC: press 3 → the turret turns onto T3; SPACE approves it; F fires it. Keys 4–9 reach T4–T9.
- Voice (browser speech for now): "approve three", "approve T1", "fire one", "target two", "reload". "Don't fire three" holds.
- FIRE still needs the target red and the bullseye on it ("fire 1" turns the head onto T1 first).
- The splash after a hit lasts 0.3 s of real time, on any machine.

## Cause of the long splash
The splash was 0.45 s of GAME time; the frame loop caps each frame at 0.05 s, so below 20 fps the game clock runs slow and the splash stretched.

## Gates
QA `T_NUMBERS_IN_MARKING_ORDER`, `VOICE_BY_NUMBER`, `SPLASH_IS_SHORT`; boot QA both orientations, only SYNC_DIRECT red by construction.

## Corrections
r.162 artefact commit `0e6d329` (not 9222164); r.162 shipped `6fe15e4`, LIVE in Verify Live #2485.

## Next (Addendum 20)
r.164: Settings → Voice — pick BROWSER · VOSK · MY VOICE, a per-voice test that scores each word, and calibration (training stays on the device).
