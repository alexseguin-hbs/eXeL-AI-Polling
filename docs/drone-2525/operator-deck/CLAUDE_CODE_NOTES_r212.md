# Drone-2525 r.212 — THE RECORD THE DECK CARRIES IS CURRENT AGAIN

Artefact `0d4d606` · deck sha256 `604f158dc207dcd013bd1984723d2ce3ffa03f94ae267728399f0a0fff6a2e87`

## His ask, a third time

> **Operator, 2026-10-15, with the same two screenshots:** *"I still do not see why you regress; use image 2
> formate for the range"*

**The answer is not about the sheet.** His screenshot's corner reads **`eXeL r0.210`**. r.211 restored the sheet to
his image 2, was measured, was pushed to both refs — and never reached the site.

## What actually happened

Deploy run **#1890** on `689a4a4e9`: `conclusion: failure`. The `gate` job died at step 7 (the headless suites) in
77 seconds, `ship` was skipped, and because the deck gates run in `prebuild` since r.196 the Cloudflare build fails
the same way. The site stayed on `df76efa`. Verify Live #2820 then polled 20 × 30 s for a commit that was never
going to be served, and reported a poll timeout — which I first read as deploy lag. It was hiding the gate failure.

```
FAIL: the deck carries the record through rev 87; the file is exactly one entry longer —
      this release's own row (lag 2, last kind release)
deck-rcore: 91 passed, 1 failed
```

## The omission, and it is mine

`r209_to_r210.py` regenerated the embedded `RCORE_LEDGER` from the ledger at build time:

```python
LEDGER=json.load(open(.../drone-2525.ledger.json))
THROUGH=len(LEDGER['entries'])
```

`r210_to_r211.py` never touched the block. Its **only** mention of `RCORE_LEDGER` is line 126 — the regex that
*strips* it before the code assertions. So the deck kept `through=87` while the ledger grew to 88 (r.210 records)
and 89 (r.211 ship).

**The embedded record is not optional bookkeeping a patcher may skip. It is part of what the deck is.**

## And I reported it green

The r.211 commit message says `deck-rcore 92/0`. The shipped bytes give **91/1, exit 1**. r.211 was executed
ad-hoc — there is no `r211-execute.sh` — so the gate ran against the r.210 state, before the bookkeeping bumped
`DECK_REV` and appended rev 89. **A gate run before the bookkeeping is a gate run on a different revision.** Same
class as the sheet itself: a check that did not check.

## What r.212 changes

1. **The record is regenerated** from the ledger through rev 89. The patcher refuses unless the embedded entries
   equal the ledger's first 89 **field for field, in the gate's own field order** (`rev, date, kind, text` redacted,
   `commit`, `shipped`), with `through === 89`.
2. **The chain gates the bytes it ships.** `r212-execute.sh` step 4 runs every deck gate *after* the bookkeeping
   commit, against the exact `frontend/public/drone-2525/play.html` commit B carries, under `set -euo pipefail`.
   `deck-rcore` is in that list for the first time — it did not exist when the r.208 template was written.
3. **Red-first is a step, not a note.** The chain exits 1 if `deck-rcore` is *green* on the r.211 bytes.

## What rides along, untouched

r.211's restored share sheet: opaque `#05080c`, the map as a 28 px `#2EE0E0` heading, seat and programme italic
beneath, the white QR card, *Scan to share The Range*, the filled `#1E4A4E` Copy Link pill, the plain white close.
`THE_SHEET_NAMES_THE_MAP` unchanged, still sabotage-proved three ways.

## The gates, quoted from the run

See `redfirst/r212.md` for the red, and the ship commit for the green — both taken from the tee'd output of step 4,
not from memory.

## Owed, unchanged

The Capitol footprint is 24.9 % too deep north–south in the arena record and `mission-planning.tsx` · no
`test:drone-play` runner in CI, so both play-throughs are manual evidence · **Verify Live polls 10 minutes against
an 18-minute job**, which is what made a real gate failure look like deploy lag — the next small commit · 428×926,
the size he actually holds, is still not a CI viewport.
