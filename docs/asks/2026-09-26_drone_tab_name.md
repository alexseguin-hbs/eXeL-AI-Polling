# Drone-2525 tab/title name → "eXeL Drone-2525" (operator 2026-09-26)

## Verbatim ask
> also make drone-2525 tan [tab] name / eXeL Drone-2525 / not sure why ECO IS IN NAME

## The defect
`frontend/public/drone-2525/play.html:7` = `<title>eXeL ECO-2525 · MoT · SSSES</title>`. The browser tab
therefore reads "eXeL ECO-2525 · …". It should read **"eXeL Drone-2525 · MoT · SSSES"** (leading name
"eXeL Drone-2525"). "ECO-2525" is a stale/leftover deck name; the surface is Drone-2525.

## Why it needs a drone revision (not a raw edit)
play.html is the byte-gated served operator deck (DECK_REV currently **152**). Editing it directly breaks
drone-playable (byte-identity vs the carried r.152 snapshot), drone-revisions (served sha must match the
register HEAD entry) and deck-consistency (DECK_REV must agree everywhere). So this is a **new drone
revision r.153 (title-only)**, mirroring the r.152 ship exactly.

## Execute (in the QUIET window — after the DRS visionary passes finish, to avoid test:ci collision)
Follow the established drone-ship pattern used for r.150→r.152 (asserted patch → byte-copy play.html →
HASHES → register → deck-rev → manifest → ledger → notes → gates → push both refs). Concretely, one
title-only change propagated through:
- The carried snapshot `docs/drone-2525/operator-deck/drone-2525_r.153.html` = byte-copy of r.152 with
  line-7 title `eXeL ECO-2525 · MoT · SSSES` → `eXeL Drone-2525 · MoT · SSSES` (via an asserted patch, one edit).
- `frontend/public/drone-2525/play.html` = byte copy of the r.153 snapshot (title fixed).
- `docs/drone-2525/operator-deck/HASHES_r153.sha256` (sha of the r.153 html/play.html).
- `docs/drone-2525/operator-deck/REVISIONS.md` — append the r.153 row (chain hash), what changed
  ("tab title ECO-2525 → Drone-2525"), no logic change.
- `frontend/lib/drone-2525/deck-rev.ts` DECK_REV `"152"` → `"153"` (and any deck-head.mjs pin).
- `frontend/scripts/drone-deck-qa.mjs` manifest / DECK_REV expectations bumped to 153 (no QA-row change —
  logic untouched, so the row set is identical).
- drone ledger + `CLAUDE_CODE_NOTES_r153.md` (or the notes pattern in use) — a one-line title-fix entry.
Note: the previously-planned r.153 "record & wire" work shifts to r.154 (this title fix takes r.153).
Gates: drone-playable · deck-consistency · drone-revisions · drone-deck-qa (both orientations) · full
test:ci · next build — all green; push both refs; Verify Live.
