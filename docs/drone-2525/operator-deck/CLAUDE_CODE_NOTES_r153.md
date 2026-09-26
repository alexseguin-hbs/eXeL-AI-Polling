# CLAUDE_CODE_NOTES_r153 — the browser tab reads "eXeL Drone-2525" (2026-09-26)

## Operator ask
> also make drone-2525 tab name / eXeL Drone-2525 / not sure why ECO IS IN NAME
>
> (follow-up) It should be "eXeL Drone-2525" not "eXeL Drone-2525 · MoT · SSSES"

`docs/asks/2026-09-26_drone_tab_name.md`.

## What a player meets differently
The browser tab (and any bookmark / share title) for `/drone-2525/play.html` now reads exactly **eXeL Drone-2525**.
It had read **eXeL ECO-2525 · MoT · SSSES** — a leftover deck name from an early edition — which is why the phone tab
said "ECO". Nothing else on the page changes.

## What changed (title-only)
- `<title>eXeL ECO-2525 · MoT · SSSES</title>` → `<title>eXeL Drone-2525</title>` (the whole "· MoT · SSSES" suffix
  dropped, per the operator's follow-up), plus the `revision:'0.152'` / `r0.152` stamps → `0.153`. Three asserted edits
  (`patches/r152_to_r153.py`); a miss REFUSES.
- `public/drone-2525/play.html` = byte copy of the carried `drone-2525_r.153.html` (sha256 `3c3de521…`, 368,965 B).

## Why no gate / QA row
A browser `<title>` carries no runtime behaviour, so there is nothing new to prove at runtime. The proof the title
shipped is byte-identity: `drone-playable` holds the served `play.html` byte-identical to the carried r.153 snapshot
(sha256-pinned in `HASHES_r153.sha256` and the `REVISIONS.md` register chain). The boot-QA manifest is unchanged
(no row added or removed); r.152's `⤢`/`⤡` full-screen assertions and all range behaviour carry over untouched.

## Record
- `HASHES_r153.sha256` (deck sha + patch sha); `REVISIONS.md` r.153 row (chain `4e7b2345…`) + section; README HEAD
  `drone-2525_r.153.html`; `deck-rev.ts` + `tests/deck-head.mjs` DECK_REV `153`.
- Domain JSON `drone-2525.v00.00.json`: `project.revision` 0.038; release 0.038 (r.153) `commit c65d719` (artefact) /
  `shipped PENDING`; r.152 (0.037) `shipped` filled `948c37e`. Ledger `drone-2525.ledger.json`: rev 48 (r.153) added,
  r.152 `shipped` filled `948c37e`. `domain.gen.ts` + foil exports regenerated (revision stamp 0.037 → 0.038).

## Numbering
The previously-planned r.153 "record & wire" work (the fleet's items 9–11) shifts to **r.154**; this title fix takes
r.153, per the operator's 2026-09-26 ask.
