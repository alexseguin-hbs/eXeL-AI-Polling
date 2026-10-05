# Claude Code notes · r.165 (2026-10-05)

**Asks (verbatim):** "target is not allowing to be reselected to approve ; test throughally" · "Splash stays way too long" · "targets do not disappear when shot."

## Causes
1. Reselect: SPACE / right click checked the CURRENT mark first; with another target red it said "RED · FIRE" and never looked at the amber under the bullseye.
   A tap re-marked a marked target (red → amber). TRAIN DOWN still dropped an earlier unapproved mark on a new one.
2. The lasting "splash": the damage ring over the current mark (lifePct < 100) was drawn on a DOWN target; since marks stay (r.162) it stayed until the
   target stood again. Headless proof: removing the mark removed the red oval; removing the splash did not.

## What a player meets
- Bullseye on any marked target → SPACE approves it (or right click it, or APPROVE). F fires the red one under the bullseye.
- A hit target falls and nothing red stays on it; in TRAIN UP its red box comes back with it 3 s later.
- TRAIN DOWN: marks are remembered; the hit target's mark ends.

## Gates
RESELECT_TO_APPROVE (every door × TRAIN UP / TRAIN DOWN / QUAL 40), NO_RING_ON_A_DOWN_TARGET, MARKS_ARE_REMEMBERED strict; boot QA both orientations.
