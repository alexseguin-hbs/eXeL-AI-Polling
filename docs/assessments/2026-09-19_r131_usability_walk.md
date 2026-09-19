# Drone-2525 r.131 — usability walk by REAL CLICKS (solo · AI member · HI team), 2026-09-19 evening

Operator ask (verbatim in `docs/asks/2026-09-19_usability_asm_team_test.md`): "test out all UI/Ux for usability and laser
tag targets as solo, team of HI member, or AI member." Method: headless Chromium at 390 px on the SERVED r.131
(`frontend/public/drone-2525/play.html`), driven only by clicks, key presses, stick drags and select changes — never by
calling deck functions — recording the HUD, the toast and the designation after each step (script:
`scratchpad/usab131.mjs`, captures `u-00…u-10`). What a stranger would read is the standard.

## Solo (PRACTICE · NO ROOM · CH0) — the range works by touch
| step | what the player saw | verdict |
|---|---|---|
| boot (intro up) | HUD already reads `LAST T1 C-50-L01 100% OFF` and `MISS 0` before anyone fired — the boot QA's last shot leaks into the first screen | **defect (r.132)** |
| SKIP → CITY → CRAFT TURRET → RANGE CH0 → PRACTICE | intro closes, toast `CH0 PRACTICE · NO ROOM`, pit L21, no target up yet | ok |
| TARGET during the 1.5 s gap | toast `NO TARGET UP · NEXT IN 0.8 S` | ok (r.131) |
| first exposure → TARGET | `AMBER T1 C-100C-L21`, toast `AMBER · T1 C-100C-L21 · WAIT APPROVE` | ok |
| FIRE on amber | `AMBER · SECOND HI APPROVE` — refused | ok |
| APPROVE | `RED T1 C-100C-L21`, toast `RED BOX · C-100C-L21 · SOLO HI-2` | ok (solo says solo) |
| FIRE | `HIT · CIRCLE`, HUD `HIT 1 · MISS 0`, box gone | ok |
| key `1` on the next exposure | `TARGET 1 C-200R-L21 AMBER` — aims and marks the exposed plate | ok (r.131) |
| double-tap blank sky (red box up) | `DOUBLE-TAP THE RED BOX TO FIRE` — refused | ok (r.131) |
| double-tap ON the box | the first tap re-designates the same target (amber again), the second tap is refused `AMBER · SECOND HI APPROVE` — double-tap-to-fire can never work | **defect (r.132)**: a tap on the already-designated target must keep its phase |
| pick QUAL · 40 in the select | HUD `TI 0/0 of 20 · 142s · TOTAL 0/0`, toast `RANGE · L21 DOWN · QUAL · 40` | ok |
| slew off with the R stick, FIRE | `MISS NO-SCORE · TI PRONE SUP · 0/1` — "NO-SCORE" on a MISS is noise | wording (r.132) |
| FIRE again in the same exposure | `ONE ROUND PER EXPOSURE` | ok (r.131) |
| the exposure lapses | rounds stay 0/1 (the miss was already charged), timer 138 s | ok (r.131) |
| TRAINING · DOWN, then RESET | toasts `RANGE · L21 DOWN · TRAINING · DOWN`, `RANGE RESET` | ok (r.131) |
| HUD `MISS` count rose to 3 in TRAINING while nobody fired | lapsed exposures are counted as MISS — reads as "you missed" | wording (r.132): LAPSED, not MISS |

## AI member (AsM as targeteer) — not usable on the range
- The `AsM SPOT / AsM FIRE / AsM OFF` control (`#btnAsm`) is **0×0 on a phone**, before and after MORE: unreachable by
  finger. It could only be pressed by script. **defect (r.132)**: put the AsM seat toggle where the crew controls are.
- The deck boots with `asmSpot=true` while the button reads `AsM SPOT`; the first press goes to `AsM MAY FIRE · HI still
  designates` — a stranger cannot tell the current state from the label. **wording (r.132)**: the label must name the
  state you are IN, and the press must say what changed.
- With the AsM on, **no designation ever appeared on the range** (15 s, exposures rising): the AsM targeteer only knows
  pops/drones on the Capitol channels, not the silhouettes. With `AsM FIRE` on and no HI designation, nothing fired
  (correct: the gate holds), and nothing was spotted either. **gap (r.132)**: the AsM targeteer must see the lane's
  exposed silhouette at CH0 so "AI member" means something on the range.

## HI team (two tabs, the TAB path) — a team cannot form in one browser
- Both tabs opened as `HOST` with different room ids (`2525BX`, `2525CS`), `PATH OFFLINE`. The host's 6-digit team code
  was `556020`; entering it on the second tab and pressing JOIN gave `JOIN FAIL` (JOIN is the network join, which
  needs a DIRECT link). READY on the host → `START · WAIT DIRECT + AUTH`; the joiner → `READY HOLD · WAIT DIRECT + TEAM
  AUTH`; LAUNCH → `ROOM HOLD · WAIT DIRECT + AUTH`. The room stayed in WAITING; the range play continued solo.
- So: **the lobby refuses to launch without a DIRECT (WebRTC/WIFI) link + team authentication — by design (r.128's
  `canLaunch` order), and the TAB path is not a room path.** A two-human team is only reachable through WIFI HOST /
  WIFI JOIN (offer/answer paste) or two phones. That is the r.132 target: a real two-page WebRTC test in one headless
  browser (manual offer/answer piped between the pages), then the wire-path authority fixes the fleet listed (net
  APPROVE gate, SNAPSHOT never red, peer DESIG → slot + lane guard, per-slot approve/fire).
- The room screen itself reads well: ROOM ID, ROLE, PATH, ROSTER, a match-size select, the FORM TEAM → AUTHENTICATE →
  READY → START line.

## What r.132 takes from this
1. QA leaves `lastShot`/`lastBand` on the first screen → restore/clear (small).
2. Tap on the already-designated target keeps its phase (double-tap-to-fire works as documented).
3. `MISS NO-SCORE` → `MISS`; lapsed exposures count as `LAPSED`, not `MISS`, in the HUD.
4. The AsM seat toggle reachable on a phone; its label names the state you are in; the AsM targeteer sees the exposed
   silhouette at CH0.
5. The wire path: net APPROVE through the same rule as the button; SNAPSHOT never imports red and restores LIVE; a peer
   DESIG writes a slot, honours the lane guard and never overwrites a red singleton; `approveDesig(who, slot)` and
   `fireN(n)` honour the slot. Proven by a two-page WebRTC HI-team walk (host offer → joiner answer → DIRECT → auth →
   READY → START → target on A, approve on B, red on both, fire on A, one hash).
