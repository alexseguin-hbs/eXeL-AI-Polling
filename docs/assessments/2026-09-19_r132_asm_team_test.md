# r.132 — 38-AsM TEAM TEST (operator 2026-09-19: "test entire drone-2525 as 38 ASM team")

Served bytes under test: `frontend/public/drone-2525/play.html` = `docs/drone-2525/operator-deck/drone-2525_r.132.html`
(HEAD r.132, commit 3d653bc). Every seat drove the deck ONLY by clicks, key presses and select changes through
`frontend/scripts/asm-play.mjs` (Playwright, Chromium, node http over `frontend/public`). Seats report
SEAT / RESULT / EXPECTED / VERDICT / SAW / MISREAD / WHAT ELSE ON THIS PATH CAN FAIL. Captures under
`frontend/perf/asm/` (gitignored). Agents ran at the configured model and effort; nothing overridden.

This file is APPEND-ONLY: wave 1 is recorded as it landed; waves 2–3 and the 48-AsM fleet synthesis append below.

## Wave 1 — 13 seats (s01–s13)

| seat | lens | kind | lane / mode / size | result | verdict |
|---|---|---|---|---|---|
| s01 | Aset | solo | L01 · TRAINING·RESET · 6 · 390×844 | 6/0/0/0 | PASS (misreads) |
| s02 | Asar | solo | L04 · TRAINING·DOWN · 6 | 6/0/0/0 | PASS (misreads) |
| s03 | Athena | solo | L08 · QUAL·40 · 6 | 6/0/0/0 | PASS (misreads) |
| s04 | Christo | solo | L12 · TRAINING·RESET · 6 · **360×640** | 6/0/0/0 | **FAIL** — top HUD hard-clipped at 360 px; the HIT/MISS/LAPSED score is unreadable |
| s05 | Enki | **ai** | L03 · TRAINING·RESET · 4 | 0/0/4 (AI never marked) | **FAIL** — AsM SPOT never marks a range plate |
| s06 | Enlil | **team** | L02 · 3 engagements | 3/0/0 · hash ce54b132 MATCH/MATCH | PASS — joiner never learns the outcome |
| s07 | Krishna | capitol | CH1 turret | (pending) | |
| s08 | Odin | solo | L15 · QUAL·40 · 12 | 12/0/0/0 · R 12 H 12 · 142→121 s | PASS |
| s09 | Pangu | **team** | L07 · 3 · **1440×900** | 3/0/0 · hash 51d9b44e MATCH/MATCH | PASS — right panel occludes the picture's right quarter |
| s10 | Sofia | solo | L19 · TRAINING·DOWN · 12 | 10/0/2/0 · ALL DOWN reached | **FAIL** — key 1 after ALL DOWN says "NO T1", not "ALL DOWN · RESET" |
| s11 | Thoth | **ai** | L10 · QUAL·40 · 5 | 0/0/5 · R 15 expired 15 | **FAIL** — AI never marked; 15 rounds charged LAPSED |
| s12 | Thor | capitol | CH5 turret | (pending) | |
| s13 | MoT-1 | **team** | L12 · 4 · **360×640** | 4/0/0 · hash 24c771a6 MATCH/MATCH | PASS — rangeline truncates at 360 px |

### What every seat that PLAYED saw hold
- The two-step held on every path: TARGET → "AMBER" → APPROVE → "RED BOX · <id> · SOLO HI-2" (solo) or "· PEER HI-2"
  (team) → FIRE. No seat fired on amber; no seat fired without a mark. QUAL·40 charged exactly one round per exposure
  (s08: 12 exposures → R 12), the table clock counted 142 s down, and lapses charged UNFIRED MISS (s11: 15/15).
- Two isolated browser contexts over the WebRTC data channel reached ROOM LIVE three times (s06, s09, s13), the joiner's
  APPROVE turned the host's amber red on BOTH devices as PEER HI-2, the host fired, and both devices ended on ONE replay
  hash saying MATCH — at 390, 360 and 1440 px. Zero page errors on all thirteen seats.
- TRAINING·DOWN keeps a downed target down and reaches "ALL DOWN · RESET" after ten distinct hits, never re-listing a downed
  target (s10). TRAINING·RESET cycles the ten silhouettes at their distances with the declared exposure seconds (s01, s04).

### Defect classes (convergent across seats — each is ONE class, listed once)

**D1 · The score is clipped exactly where it matters (s04, s10, s13; s01–s03 at 390).** `#playHud` is
`overflow:hidden; white-space:nowrap` with no wrap, no ellipsis and no second home for the numbers. At 360 px the strip ends
"…TRAINING · RE"; at 390 px "…TRAINING · DOWN · H". HIT/MISS/LAPSED and the terminal "ALL DOWN · RESET" are unreadable on
the phone. Class: every HUD string that can grow (designation + mode + score) shares one nowrap line. Fix the class:
the score gets its own line (or the designation does), and nothing that must be read is allowed to overflow silently.

**D2 · The HUD score line lags one shot behind the counter (s01, s06, s08).** "HIT 2" on the header while `rangeHit=3`
and the toast says HIT. The strip is rendered from the previous tick's snapshot; the toast and counter from this one.

**D3 · The approver never learns the outcome (s06, s09, s13).** After the joiner's APPROVE and the host's HIT, the
joiner's score stays "HIT 0 · MISS 0", its reticle still shows the red box, its toast still says "RED BOX … PEER HI-2".
The hash matches, so the record is shared; the PICTURE is not. The person who authorised the shot has no on-screen proof
it landed. Class: HIT/MISS/LAPSE are reduced into `rangeHit/rangeMiss` on the origin only, and the desig/red-box clear is
origin-only too — the peer's reducer path must clear the box and tally the outcome from the same canonical row.

**D4 · The AI member cannot play the range (s05, s11).** With AsM SPOT on, `state.desig` stayed null through every
exposure: `asmTick` marks only from OTHER turret units and only when `bd < (best.form ? 340 : 80)`; range plates carry no
`form`, so the 80 m gate applies while every silhouette stands at 50–300 m. The AI seat lapses every exposure. Two
sub-findings in the same class: (a) SPOT is already the default, so the on-screen AsM button's first press advances to
**AsM FIRE**, whose toast reads "AsM MAY FIRE · HI still designates" — and play.html:2412-2417 would let the AI shoot on its
own with NO APPROVE once a mark existed. That is the fire gate widened for the AI seat and must be closed: an AI-initiated
shot never fires without a named human APPROVE (drone-authority invariant). (b) The end capture shows a red LOCK reticle
with "LOCK C-150R-L10 150M" while desig is null and the strip says TARGET FIRST — a reader cannot tell whether the AI
marked or not. LOCK is aim, not designation; it must not be drawn in the designation colour.

**D5 · Three entrances to "range empty" compose three sentences (s10).** Key 1 → `targetN` → "NO T1"; the TARGET
button and voice route through `noLockMsg()` → "ALL DOWN · RESET". One state, one sentence: all three call `noLockMsg()`.

**D6 · A downed target is still drawn with its countdown and a red LOCK line (s01–s03).** After HIT the silhouette
stays on screen with "200M E · 6s" and the LOCK line until the next exposure raises another plate. The box should go down
with its target (r.131 rule) AND the caption + LOCK should leave with it.

**D7 · Desktop layout (s09, 1440×900).** The settings/LINK/CODEX column sits over the picture's right quarter (x≈840–1140)
while x≈1140–1440 is black and unused; the panel overflows the 900 px height (R-CORE and FPS collide with R HEAD); the
orange sim-frame line at x≈48 strikes through the bottom-left caption ("RED B|OX", "HIT ·|CIRCLE") on every capture.

**D8 · Small honesty defects on the record.** Pre-LIVE lobby shows "LAPSED 1" at APPLY/READY — a lapse counted while no
one may fire (s06). Joiner's LINK prints "-1978 ms" (clock-skew artefact; the host prints +1981) (s09). The waiting room
reports lane 20 / unit T01 until START, not the requested lane (s13). "AsM MAY FIRE · HI still designates" contradicts the
QUAL·40 AI-seat contract (s11).

**D9 · Jargon a stranger cannot read (s01–s03, s09).** "HIT · CIRCLE", "DOWN DIRECT", "SCEN · 50M RANGE" (the served
ranges are 50–300 m), "SPIRAL v1". The demo bar is a stranger understanding in 60 s.

### Not defects (misreads the seats corrected themselves)
- `lane:11` → HUD "L12": 0-based index, not a mismatch. `final.score` one step behind the last toast: snapshot timing.
- "AI never marked → LAPSED 3 per step" (s11): the seat's 20 s wait spans three exposures; the deck charged one round per
  exposure, which is the rule.
- The two "NO T1" presses after ALL DOWN are the idle state, not lock refusals (script label).

### Unexercised by wave 1 (owed to waves 2–3)
ONE ROUND PER EXPOSURE refusal (a second FIRE inside a still-red exposure); the 20-exposure / clock-expiry boundary of QUAL·40
tables I→II→III; capitol CH1–CH5 (s07/s12 pending); a data-channel drop between APPROVE and FIRE; the waiting room imaged at
360 px; 768×1024 tablet; lanes 21–42.
