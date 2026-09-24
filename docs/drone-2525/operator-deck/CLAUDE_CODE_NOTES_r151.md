# CLAUDE_CODE_NOTES r.151 — pop-up targets fire again (2026-09-24)

Built by `patches/r150_to_r151.py` (4 asserted edits; a miss refuses) from r.150. Ask: the operator's **"pop-up targets no longer
work."** The 48-agent fleet's r.147 order, MoT 1 item 5 ("one under the pip"). One value changes; the scope is strict.

## Invariant, in the player's words
**If you can lock it you can fire it.** The FIRE gate accepts exactly what the LOCK accepts. A lawn pop the LOCK reaches
(`LOCK_REACH_PX`, 48 px) can be fired; the round is spent on the shot and the outcome (HIT on the base, MISS on the edge) is on the
record — never refused outright.

## The bug, root-caused
r.150 taught every spending path to pass one gate: a round is spent only with the bullseye on the red box. Its **non-plate** branch
projected `worldOf(tgt)` — a pop's **BASE**, y≈1.2 m — and accepted only within **32 px** of the pip. But a lawn pop is **drawn at
body-centre** `p.y+1.2` (≈2.4 m), and the LOCK / mark reaches `LOCK_REACH_PX` (**48 px**). So a TURRET / CAPITAL pop
(`s.kind==='pop'`, no `.form`) could be **marked and approved** — the LOCK reached the drawn silhouette — yet **FIRE was refused**
`TARGET_OFF_PICTURE`, because its base sat more than 32 px below the pip. That is exactly "pop-up targets no longer work." Range
plates (`tgt.form`) go through `pipOn` (outline + 8 px) and were never affected.

## The fix — one value
In the FIRE gate's non-plate `else` branch (the only place scoped): the tolerance `<=32` becomes `<=LOCK_REACH_PX`. Nothing else
moves. `pipOn`, the lock, the draw, plate handling — untouched. Confirmed `LOCK_REACH_PX` is the top-level const `= 48`.

```
OLD  on=!!pr&&pr.x>=0&&pr.x<=W&&pr.y>=0&&pr.y<=H&&Math.hypot(pr.x-W/2,pr.y-H*.46)<=32;
NEW  on=!!pr&&pr.x>=0&&pr.x<=W&&pr.y>=0&&pr.y<=H&&Math.hypot(pr.x-W/2,pr.y-H*.46)<=LOCK_REACH_PX;
```

## Correction on the record (r.150)
r.150's FIRE-gate comment said "every other kind the 32 px the hit test uses." For a pop that 32 px was the bug — its base is 1.2 m
below the drawn silhouette. From r.151 the non-plate FIRE reach is `LOCK_REACH_PX`. The `applyHit` HIT test (`pipOff < 32`) is
deliberately unchanged: a shot at the silhouette spends a round (its base is past 32), a shot at the base lands the hit. The round is
no longer refused outright — which was the whole of the operator's complaint.

## The gate
- **`FIRE_HITS_A_POP`** (in-file boot QA, beside `FIRE_ON_THE_BOX_STILL_HITS`): a turret lawn pop, marked and approved. **A** —
  bullseye on the drawn silhouette (its base measured past 32 px, within `LOCK_REACH_PX`): FIRE **spends a round** where r.150 refused
  `TARGET_OFF_PICTURE`. **B** — bullseye on the base: FIRE → **HIT** with **SIM-ACTION** on the record. The note carries the measured
  pixels and round counts; `scripts/drone-deck-qa.mjs` holds it to a note regex (a predicate replaced by `true` cannot pass).
- **REPO source gate** (`tests/drone-playable.test.mjs`): the served bytes' non-plate FIRE branch uses `LOCK_REACH_PX`, never `<=32`,
  and `FIRE_HITS_A_POP` is present.

## Do not regress
- The non-plate FIRE tolerance is `LOCK_REACH_PX`, one source with the LOCK. Never a bare number.
- `pipOn` (plates), `applyHit`'s hit test, the lock and the draw are out of scope for this fix.
