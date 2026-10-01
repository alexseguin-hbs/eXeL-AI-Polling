# Financial-2525 release notes

Every release r.NNN of https://exel-ai-polling.explore-096.workers.dev/financial-2525 ships with a note in one shape
(operator 2026-10-01, addendum 71): your words (verbatim, with the addendum), what changed, what did not, what was measured,
the open question if any, and `SHA | committed | pushed | Verify Live`. Newest first on the page.

- `r.NNN.md` — the note; its data sits as JSON in the comment at the top, the readable note follows.
- `img/r.NNN-before.png`, `img/r.NNN-after.png` (and `-after-<view>.png`) — the changed area at 390 px, violet theme, the
  same two entries recorded, so BEFORE and AFTER compare directly.
- Page (private, the same link every release, a feedback field per release): https://claude.ai/artifact/QeHrRp36vDhR1avnj4UF5K

How a release is noted:

```sh
cd frontend && node scripts/fin-release-shots.mjs --rev 038 --as after --area "<selector of the changed area>"
#   BEFORE = the previous release's AFTER of the same area; otherwise build the previous ship SHA and pass --root
cd .. && node scripts/fin-release-note.mjs --write note.json   # writes releases/r.038.md
node scripts/fin-release-note.mjs --chat 038                  # the message sent in chat (same words)
node scripts/fin-release-note.mjs --page <scratch>/index.html # regenerates the page, then publish it to the same link
node scripts/fin-release-note.mjs --check
```

From r.038 on, the revision's `why` in `financial-2525.v.000.json` opens with the note's one-line title, so the R-CORE panel and
these notes say the same thing. Revisions 0.028–0.037 are not edited (the record only appends).

Back-filled r.028–r.036 from the captures taken at each release; r.031 has no BEFORE capture of the unit list, and the note says so.
