# DD-101 — the revert audit: what came undone, what did not, and the gate that was missing

**His words (operator, 2026.10.19):**

> remember We had this addressed in past revisions but some reason you reverted; as you sometimes due

Three read-only trails over the carried revisions, the patchers, the gates and his own ask file. The first
attempt was killed by a container restart with no result; this is the re-run.

---

## Headline

**One genuine silent revert, still broken. One deliberate change whose side effect nobody measured — the
magazine. One trail completely clean.** And the thing he has asked for most on the deck is not a revert at
all; it never shipped there.

---

## 1 · THE MAGAZINE — deliberate, documented, and unmeasured against the behaviour it cost

Measured from his r0.178 screenshot and today's served deck, profiled identically (ink extent of the
drawing, then every raster row where lit pixels cross ≥ 30 % of the body width):

| | fill starts | fill ends |
|---|---|---|
| **r0.178 — his picture, 30 RDS** | **6.7 % from the top** | 87.2 % |
| **r.215 — shipped today, 30 RDS** | **39.2 % from the top** | 100 % |

Today's number is the served `play.html` rendered headless at 428×926 DPR 3 with
`state.mag={cap:30,rounds:30}` and `hudMag()` called.

**Where it moved, exactly:**

| revision | rounds drawn as | fill top |
|---|---|---|
| r.178 → r.201 | inline SVG `#magRibs`, 19 ribs spanning the body | ~6.7 % |
| **r.202** (`ab65de481`) | raster + `--cut` clip | `MAG_FILL_TOP = 11.3` |
| **r.203** (`4adfe7056`) → r.215 | same raster, new tops | **`MAG_FILL_TOP = 32.0`**, `MAG_BARS = 19` |

**It was not careless.** `patches/r202_to_r203.py` states the intent in its own header — the bars go
*"distinct, inside the walls, over the grid, **below the window**"* — and it was built from **shot40, a
render of this session's that he sent back as his reference**. The defect is that **no gate anywhere asks
whether a full magazine reads full**, so a deliberate local improvement cost a behaviour that had been
right since r0.178 and stayed wrong for **thirteen revisions with every gate green**.

**A second defect from the same constants.** `hudMag()`'s clamp `r >= MAG_BARS ? MAG_BAR_TOPS[0] : …`
means rounds **19 through 30 all draw the identical picture** — eleven rounds, more than a third of the
magazine, invisible. A full magazine and a two-thirds magazine look the same.

---

## 2 · THE ONE GENUINE SILENT REVERT — the QR deep-link reader, still broken

- `bb7bb3cd9` (10-09) added **`openSharedRange`**: fired on **any** of `mode`, `role` or `range`, read
  `role` into `state._selCraft`, clamped the lane 1–42.
- **`b2dfa80a1` (10-10) "Reinstate the r.166 range" removed it.** The commit body mentions only *"Later
  magazine experiments are off it"* — **nothing about the share link.** Same commit, same mechanism as the
  already-proven r.167–r.176 loss.
- He asked again (`ddb5108d1`), and the rebuild is **a narrower one-liner**, still the only reader in the
  served deck at `play.html:5929`, firing **only** on `range=`:

```js
if(q&&q.get('range')) enterTheRange(parseInt(q.get('range'),10)||21, q.get('mode')||'train-up'); /* r.187 */
```

**Live consequence.** `shareUrl()` at `play.html:9031` emits, for any non-Range rung,
`…?map=capital&station=…&role=turret&mode=…` — **with no `range=`**. Measured in the served bytes:
`q.get('map')` **0 hits**, `q.get('station')` **0 hits**. **The Capital share QR writes a link nothing
reads**; scanning it lands on the intro. Declared as debt in the r.209 and r.214 ledger rows — declared,
and still broken.

---

## 3 · THE CLEAN TRAIL — QA rows that died

Nine row ids have ever been removed from `frontend/tests/deck-qa-manifest.mjs` (r.137 ×6, r.138, r.142 ×2,
r.150, r.157 ×2, r.158, r.196, r.205 ×2). **All nine declared** in their commit message or superseded by a
named replacement. The one that looked like the class — `MARK_SURVIVES_THE_RETURN` at r.196 — is not: the
operator reversed that behaviour himself on 10-08 (`d6bcc1607`, *"Train Up: after a hit, target, approve,
and fire again"*). **The exact set holds today: 251 ids, all 251 live in the served deck**, and no silent
additions. A clean trail is a real result and is recorded as one.

---

## 4 · NOT A REVERT, BUT THE MOST-REPEATED ASK — the deck's `</>` Code chip

**Four or more distinct reports by name** (10-15, 10-16, 10-17 ×2, two identical sentences in one addendum,
then 10-18 *"still no two step offering"* after he walked it in three screenshots to pre-empt "you did not
scroll"). Measured on the served deck: `cmpVC` **0**, `code-icon` **0**, `code-wordmark` **0**. The panel's
mode row is a string at `play.html:6390` with exactly two buttons and a two-way `if/else` below.

It **never shipped on the deck** and was declared deferred at every revision, so it is not the revert class
— but it is the single most repeated ask on the surface he actually plays.

**And DD-88's promised guard was never built:** no test in `frontend/tests/` presses the R-CORE badge
across project routes, which is exactly what he asked for so that "unreachable" could never again be
something one hand-run probe knows.

---

## 5 · THE GATE THAT WAS MISSING, AND WHERE IT BELONGS

Measured: **no node-side gate in this repo screenshots a page and decodes the PNG** — no `pngjs`, `sharp`,
`jimp` or `canvas`, and every `page.screenshot({path})` writes an artefact nothing reads back. And
**`prebuild` is browser-free**, so a pixel gate there would break the Cloudflare build.

The right home already exists and already reads pixels:

- **`ROUNDS_ARE_INSIDE_THE_MAGAZINE`** (`play.html:5368`, deferred 1200 ms) already decodes the rasters to a
  canvas and measures the first and last fill rows with `getImageData`. Its `&& top > 25` **is** r.203's
  window rule written into the deck's own self-test — it currently *forbids* the fix, and inverts to
  `top <= 10`.
- **`frontend/scripts/drone-deck-qa.mjs:57-79`** already pins ~60 rows' *measured note text* by regex, so
  one entry there gates the measured percentage itself, not just a boolean.

No new script, no new dependency, nothing added to `prebuild`.

---

## Order this sets

1. **Drone-2525 r.216** — the thirty-bar magazine as a **restoration**, plus the two behaviour assertions.
2. **The Capital QR reader** — the one genuine silent revert still broken.
3. **The deck's `</>` chip (DD-79) + the revision-scrubber crash (DD-89)** — same panel.
4. **DD-88's guard** — press the badge on every project route.
