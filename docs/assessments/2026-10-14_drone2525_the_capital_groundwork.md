# THE CAPITAL — the groundwork, measured before a line of code

**Date:** 2026-10-14 (the probes ran 2026-10-13 19:37–20:10 CST)
**Subject:** the operator's ask of 2026-10-13 — DD-27 … DD-35, recorded verbatim in
`docs/asks/2026.10.11_18.56..53_drone2525_restore_r178_three_modes_poses.md` (persist commit `2cc52ed9`)
**Bytes under measurement:** the shipped r.207 deck, `frontend/public/drone-2525/play.html`, 932,061 B, served at
`https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html`
**Method:** four read-only probes — what the deck already has for the Capitol · the control law across platforms ·
the real Capitol's dimensions from public sources · a mechanical meaning for his "don't change the range".
Nothing was changed. Every number below was measured here or cited to its source.

---

## 0 · His words, and the order they set

> can you create edge wireframes of Austin texas Captial of texas scenario with stationary pop up targets for turret
> then find way to do same for drone
> each flying mode (Turret, Robot, Drone) has 1-2 joysticks. Always have target, approve, fire in centrr in same place
> as The Range turret mode.
> Any moving platform gets two joysticks with bottoms in middle
> Esch mode gets train -up, train down, Qualification choose a set of targets for each mode. Each turret location has
> different pop ups.
> also enhance capital of texas using online images to make more realistic outline using array of 13 Trinity colors
> with varying levels of thickness etc to mimic 3D structure of capital and capital lawn (including trees
> while making these updates; don't change the range; just use working range to start building elements for The Capital

His own order is the build order: the picture first, then the targets on it, then the programmes, then the controls,
then the drone. DD-35 governs every one of them.

---

## 1 · The finding that decides the first revision: **the Capitol does not draw at all**

Measured on the shipped bytes at 390×844, the Capital scene entered through its own picker (`#chLvl` → CH1 LAWN):

| MoT | budget `S.seg` | segments drawn | dropped | what the stage shows |
|---|---:|---:|---:|---|
| **1.1 (the default)** | 280 | **280** | **1,278** | **black — nothing of the Capitol** |
| 2.1 | 1,055 | 1,055 | 922 | partial |
| 5.1 | 3,380 | 1,748 | 244 | the boxes and three flat rings |

Instrumented to attribute the budget: `drawTargets` is entered at **5** segments spent and leaves at **280** — the
eight door targets (`doors`, 8 × a box plus a bullseye) consume the entire world budget before `WIRE.g` is reached,
so every one of the Capitol's 217 edges is dropped. Zero pop-ups were up at the time; the doors alone do it.

The deck's own comment at `play.html:1937` states the rule deliberately — *"what you must hit gets the budget first on
EVERY channel"* — and on the Range it is right. On the Capital it starves the subject. The Range already solved the
same class for itself in r.157 with `segsOwn` (`play.html:1930`): *my lane's targets are the shooter's own picture —
drawn outside the world budget (counted)*. The Capital needs the same law for its own subject.

**So no amount of better geometry helps until the budget question is answered.** That is why r.208 is "the Capitol is
drawn" and not "the Capitol is beautiful".

## 2 · What the deck already has (R-CORE step 1 — grep-verified, to be extended, never rebuilt)

- The scene exists: `<option value="capital">SCEN · CAPITAL 42</option>` (`play.html:350`), `<button
  data-mode="capital">CAPITAL 42</button>` (`:359`), `applyMode('capital')` (`:2750`).
- **42 turret locations already ring the building**, facing it: `units['T01'…'T42']` at `x=sin(a)·110,
  z=20+cos(a)·130` (`:800-805`) and `restoreCapitolTurrets()` (`:1146`) with `u.yaw=yawTo(0-u.x,20-u.z)`.
  T01 sits at (0, 150) — the south lawn, 130 m from the rotunda, looking north at the south front.
- Eight door targets exist (`:785-788`): `D-CAP-S/N/E/W`, `D-CVC`, `D-GM`, `D-LIB`, `D-11TH`.
- The geography is real: `MAPS.CAPITAL` and `ORIGIN` both at **30.27467, −97.74035** — the rotunda (`:1165-1166`).
- The whole fire gate is shared and already serves both scenes by its author's own declaration (`:2120`, r.147):
  `designate → markLock → approveDesig → fireN`, `slotBoxes`, `phaseOf/phaseCol`, `lockOn`, `decide`, `nextStep`.
- The thirteen colours are enforced at build time: `add(n,c,s){if(!OK.has(c))throw 0;…}` (`:1106`).
- The deck's Capitol today is **17 groups / 217 edges** of axis-aligned boxes:
  `capitol` 12 · `wingEW` 12 · `wingNS` 12 · `dome` 40 (three FLAT rings and one vertical) · `southSteps` 12 ·
  `greatWalk` 3 · `congress` 2 · `11th` 2 · `colorado` 1 · `brazos` 1 · `fence` 12 · `cvc` 12 · `mansion` 12 ·
  `lib` 12 · `allée` 28 (bare verticals, no canopy) · `radar` 13 · `grid` 31.

## 3 · The real building — sourced numbers, and where the deck and the record each have it wrong

| | sourced | source | the deck today | the repo record |
|---|---:|---|---:|---:|
| E–W greatest length | **172.67 m** (566 ft 6 in) | NHL nomination 70000770 | 168 m (−2.7%) | 176 m (+1.9%) |
| N–S central block | **88.09 m** (289 ft) | NHL nomination 70000770 | 88 m (−0.1%) | 110 m (**+24.9%**) |
| Ground to the star | **92.24 m** (302.64 ft, south-front grade) | Texas State Preservation Board | **62 m (−32.8%)** | — |
| Goddess of Liberty | 4.88 m (16 ft) | 1888 state pamphlet | absent | absent |
| Rotunda diameter | **18.29 m** (60 ft) | TSPB | r = 16 m (**+75%**) | — |
| With steps | 178.56 × 91.39 m | 1888 state pamphlet | — | — |
| Great Walk | 152.4 × 7.62 m (500 × 25 ft) | TSPB grounds | 174 × 14 m | 192 m long |

Two carriers, two different errors, and they disagree with each other as well as with the building. Outbound HTTP is
blocked in this container (every host 403s at the proxy), so the figures above came through search synthesis of those
pages, not from opening the PDFs — stated plainly so he can overrule any of them.

`docs/drone-2525/drone-2525.v00.00.json` + `frontend/lib/drone-2525/arena-model.ts` already hold a 12-vertex cruciform
footprint, 14 named buildings, 10 named roads, 4 tree rows with canopy radii, three named turret stations and a DEM —
gated by `tests/drone-arena.test.mjs`. It is a far better base than the deck's boxes, and its one bad number is the
N–S depth. **Correcting that one polygon fixes both carriers** — which is what "fix the class" means here.

## 4 · "Varying levels of thickness" is a renderer change, not a drawing change

`add(n,c,s)` stores `{name, colour, segments}` — there is no width field — and the painter uses **one** width for the
whole world: `const fw=S.maj===1?1.3:1.15;` (`:1909`) then `function segs(arr,col){ v.lineWidth=fw; … }` (`:1923`).
Measured: every line in the picture today is 1.15–1.3 px.

`frontend/lib/wire-core/vector-law.ts:17` already declares the ladder the operator is asking for —
`stroke: { hairline: 0.6, normal: 1.0, bold: 1.6, hud: 1.2 }` — and the same file fixes the limit: a **darker** edge
would be a fourteenth colour, so depth is read from weight, perspective and overlap, never shading. So his ask is
lawful and already has a vocabulary; it needs a fourth argument on `add()` and a third on `segs()`, with the default
leaving every existing call byte-identical.

## 5 · The control law — measured, and one place where his words meet his own earlier words

- **Every moving platform already has two sticks.** `syncSticks()` (`:2683`) hides `#joyL` for `kind==='turret'` and
  for nothing else. Census of the 49 units: 43 turret, 3 vtol, 1 sub, 1 ark, 1 droid. His "1–2 joysticks" is already true.
- **The sticks are pinned to the screen edges by CSS** (`#joyL{left:…} #joyR{right:…}`, `:181-184`); no JS moves them.
  "Bottoms in the middle" is a CSS change — but `placeFace()` derives the face row FROM the sticks, so inboard sticks
  would squeeze the row to nothing. The dependency has to be inverted first.
- **TARGET · APPROVE · FIRE is not in one place today.** Measured offsets of the row's centre from the stage centre:

| viewport | turret | drone / robot |
|---|---:|---:|
| 390×844 | −9 px (pills 72 px wide) | 0 px (pills 54/60/40) |
| 428×926 | +10 px | 0 px |
| **844×390** | **+235 px** | 0 px |
| 667×375 | +146 px | 0 px |

  The y is identical at every size. So only the horizontal anchor and the pill-width ladder have to be pinned.
- **HIS CALL, LISTED, NOT DECIDED.** "always have target, approve, fire in centre in same place as The Range turret
  mode" and his own ask of 2026-10-04 — *"target approve fire needs to be left of joystick for turret (and centered
  between two joysticks when operating drone)"* (`docs/asks/2026.10.04_08.50..02_…`) — name two different points, 235 px
  apart in landscape. The Range's turret row is **not** centred; it sits left of the single stick, because he asked
  for that. Reading A: every other platform adopts the turret's exact box (the Range never moves — allowed by DD-35).
  Reading B: everything including the turret moves to the true centre (that changes the Range — forbidden by DD-35).
  **Default taken: Reading A**, because it is the only one that obeys both his sentences. One word from him reverses it.
- On touch a drone today has **no yaw and no climb** — Q/E and U/J are keyboard-only (`:2919-2920`). The second stick's
  natural job is exactly that, and it is the only genuinely new control the Capital needs.

## 6 · DD-35 made mechanical — how "don't change the range" is proved, not promised

The Range is not a file; it is a `chNum()===0` branch through one 8,000-line script (`play.html:1937`). Three legs,
all measured on real ships:

1. **Source freeze.** 66 Range-owned top-level definitions (41,622 B) extracted by name and hashed in 85 ms. Run
   against the real r.205→r.206 and r.206→r.207 ships it reports exactly 4 moved spans each time, and all four match
   that patch's own header — zero false positives.
2. **Note freeze.** The boot QA publishes 237 rows; two boots of identical bytes agree on 231 of 237 notes, and the six
   that move are device-id or wall-clock and normalise with four regexes. One standing exception: `UNDER_CAP`, whose
   note *is* the file's byte count. Replayed across r.206→r.207 it flagged 1 added row and 6 genuine note moves, every
   one of them named in that patch's header.
3. **Play-through freeze.** TRAIN UP (34 entries, 20 s) and QUAL 40 (168 entries, 231 s, 40/40 EXPERT) are both
   byte-identical across runs once the wall-clock field is dropped. **Neither runs in CI today** — which is how the
   map-toast regression of r.206 reached his phone.

There is no naming convention that separates a Range row from a shared one, and a keyword heuristic gets it wrong
(it puts `SILHOUETTE_COLOUR_IS_THE_PHASE` and `BARS_OVER_THE_GRID` on the wrong side). So the gate freezes **all 237**
and lets the Capital append. Cheaper and strictly stronger than classifying.

## 7 · Decisions taken here, each reversible by one word from him

| # | Question | Decision | Why |
|---|---|---|---|
| DD-36 | Which "13 Trinity colours" | **the deck's `T13`** (`play.html:676`) | it is the deck's own thirteen (its self-check row reads `C02 13 colours`), it is what the Range is painted in, and `lib/trinity-palette.ts`'s different thirteen cannot be introduced without repainting the Range — which DD-35 forbids |
| DD-37 | Where the thickness ladder comes from | `VECTOR_LAW.stroke` — hairline 0.6 · normal 1.0 · bold 1.6 | already declared in the repo, already lawful, already gated elsewhere |
| DD-38 | What may exceed the segment budget | **the scene's own subject** (the Capitol itself), counted and never dropped — the Range's own r.157 rule, applied to the Capital | the subject cannot be the first thing dropped |
| DD-39 | Detail versus the fidelity dial | the subject's **detail** follows MoT; its **presence** does not | a weak phone sees the outline, never a blank stage |
| DD-40 | The face row (section 5) | Reading A — the moving platforms come to the turret's box; the Range's row never moves | the only reading that obeys both of his sentences |

## 8 · The revisions this sets up, in his order

| rev | title | his words |
|---|---|---|
| **r.208** | THE CAPITAL I — the Capitol is drawn | DD-34, DD-35 |
| r.209 | THE CAPITAL II — every turret location has its own pop-ups | DD-27, DD-33 |
| r.210 | THE CAPITAL III — TRAIN UP, TRAIN DOWN, QUALIFICATION in every mode | DD-32 |
| r.211 | THE CAPITAL IV — the control law | DD-29, DD-30, DD-31 |
| r.212 | THE CAPITAL V — the same, flown | DD-28 |

The range officer's opening and the QUAL lamp (his 18:25 and 04:34 words, D-23) move to r.213, and R-CORE in the
shared format to r.214. Nothing owed is dropped; the Capital goes first because his latest word says so.

## 9 · Two defects found while measuring, neither of them his, both owed

1. **`SCEN · CAPITAL 42` does not open the Capital.** `#modePick`'s handler (`play.html:5665`) sets `state.mode` and
   toasts; it never calls `applyMode` and never sets `state.challenge`, so picking his scenario leaves the Range on
   the glass. The intro's `#modes` buttons have no click handler at all. Folded into r.208 — it is the door.
2. **The Range's magazine row stays on the glass inside the Capital** (`#magBar`, RELOAD and the counter are drawn
   with `CH1 LAWN` on the strip). Recorded; it belongs to r.209, with the Capital's own target set.
