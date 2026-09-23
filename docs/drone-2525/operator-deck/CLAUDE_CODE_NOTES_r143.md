# CLAUDE_CODE_NOTES r.143 — no horizon line; a white bullseye that turns red near a target (2026-09-23)

HEAD `drone-2525_r.143.html` · sha256 in `HASHES_r143.sha256` · served byte-identical at `/drone-2525/play.html`.
Built from r.142 by `patches/r142_to_r143.py` (8 asserted exact-anchor edits). Ask: `docs/asks/2026-09-23_reticle_white_red_no_horizon.md`.

## What a player meets differently in r.143
1. **No green line across the picture.** The horizon is where the world's wire puts it.
2. **A white bullseye.** It turns red the moment the pip sits on a target, and the hairline bracket around that silhouette turns red with
   it. Red here is aim, not permission — TARGET still paints amber and APPROVE still turns it red before FIRE.
3. **LOCK names what is under the pip.** With every target standing, LOCK used to name the nearer plate beside the pip; now the one the pip
   is on wins (a marked target still holds LOCK while it stays in view).

## Invariants (in the deck)
The bullseye is white unless the pip is on a target; NEAR never reads or writes the fire gate; LOCK is the thing in the crosshair.

## Gates
In-file QA **146 rows**, **145/146 in portrait and landscape**. New: `RETICLE_RED_NEAR_TARGET`, `LOCK_IS_THE_THING_IN_THE_CROSSHAIR`,
`NO_HORIZON_LINE` (pixel samples across the horizon row + the painter's source). Repo: `drone-playable` 82, `range-2525` 108, `drone-deck-qa` 34,
`drone-team-e2e` 9/9.

## Owed (honest)
The same bullseye behaviour on the Capital and the other scenes (the operator's next); `reticleNear()` already covers non-plate targets by
centre distance — the bracket and the plate outline test are the range's. Everything r.142 owed.
