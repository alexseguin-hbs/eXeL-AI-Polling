# Drone-2525 · The Range — the twelve Masters on phantom targets and colour agreement, and what is still open on the LIVE r.205 (2026-10-13)

> **Operator, 2026-10-12 ~21:15 CST:** "I need 12 AsM Fleet to test; youbknow mybcriteria but fail toninplment; test and somulate until no phantomntargets and ensure all targets and siloeets have the proper color boxing with button when bulleseye osnover target"

145 agents: twelve Masters probing the served deck, every finding refuted three ways, one ordered fix list. They were ordered onto the r.204 bytes; r.204 and then r.205 shipped while they worked, and they re-played every confirmed finding against the bytes on his phone rather than re-reporting what was already closed. Their verdict is below verbatim.

**I verified the two BLOCKING items myself, on the shipped r.205 bytes (`24d03765…`), before writing a line of r.206** (`scratchpad/r206/probe1.mjs`):

```
D1  after releaseAuthority('QA'):  C-100C {mist:true, phase:null, slot:null, painted #E24B3B}
                                   C-200R {mist:true, phase:null, slot:null, painted #E24B3B}
                                   the never-marked C-150L: painted #E8D5B0 · boxes drawn: 0
D2  10 aim points with the bullseye strictly inside exactly one silhouette → 2 handed the
    mark to another plate (bullseye on C-300-L21, the box went to C-200R-L21)
```

Both hold. Their fix order becomes r.206.

---

# FLEET 12 — VERDICT ON THE RANGE

**His order (2026-10-12 ~21:15 CST, verbatim):** *"I need 12 AsM Fleet to test; you know my criteria but fail to implement; test and simulate until no phantom targets and ensure all targets and siloeets have the proper color boxing with button when bulleseye is over target"*

**Bytes under verdict:** `2085cd150d08f886b4f8236ed8d8f3f60c2494b6608afed08c7260298039db9b` — r.204 tenth cut, served at `http://127.0.0.1:4727/drone-2525/play.html`.
**Compared against:** LIVE r.203 `00661e043b0d6a5e1147960389ec8e4736f07f3a6634a1b5d84cc138e3372a5c` at `:4726` — **these are different bytes**, so the r.203/r.204 comparison several masters reported as impossible was in fact available, and I ran it on every finding.
**Also played:** the shipped **r.205** `24d03765171b8e8df3b55ed78b0d40133cd3c76f42b26eed79bc555ee71d8665` (repo `frontend/public/drone-2525/play.html`, commit `1c787652a`, Verify Live #2775), served at `:4731`.

**Deploy state:** `SHA 2e16e82f8 | committed ✓ | pushed ✓ (git ls-remote main = 2e16e82f89070f2db925f21812b9cc24a813b61c) | cloudflare UNVERIFIED from this sandbox (the proxy 403s every host)`. Check in one tap: **https://exel-ai-polling.explore-096.workers.dev**. The repo's own record says r.205 shipped LIVE in `1c78765` at Verify Live #2775.

Every figure below is my own, measured by playing the deck in headless Chromium at 390×844 @2 (touch build where the press mattered), reading the painter's own geometry (`slotBoxes()`, `plateRect()`, `phaseOf`/`phaseCol`) **and** the `#view` canvas pixels with `getImageData`, classified against his table (`#F0A020` GIMBAL · `#E24B3B` LOCK · `#E8D5B0` SI). Probes and pictures: `scratchpad/fleet12/verdict/`.

---

## THE STANDING CORRECTION, BEFORE THE VERDICT

The order calls r.204 "the revision being shipped now". It is not: **r.204 shipped** (`e5aec75b`, Verify Live #2769) and **r.205 shipped after it** (`1c787652a`, Verify Live #2775) while this fleet was testing. Under **NO REWORK — "never re-report a shipped item as remaining"**, I grep-verified and then *played* every confirmed finding against the r.205 bytes. **Four of the eight confirmed defects, and both of the items the order says the next revision must carry, are already closed.** Re-reporting them would be rework. The verdict is therefore given twice: on the bytes I was ordered to judge, and on the bytes on his phone now.

---

## HIS TWO CRITERIA

### (A) NO PHANTOM TARGETS — **FAIL** on r.204. Closed, on the class I could reproduce, in r.205.

The failure is his own sentence, *"a silhouette drawn mid-fall for ever"*.

QUAL 40, lane 21, at wall time. I marked, approved and fired the exposed plate with **0.1835 s left** of its 5 s window — a normal late shot. `C-50-L21` was left `up:true, lifePct:0, fall:0.05`, its fall ran to **0.5298** and then **stopped for ever**: identical at clock 18.86, 19.86, 21.88, 23.88, 25.90 and 27.91, through the gap, through the whole of engagement 2's exposure, into the next gap.

It is **painted**, not merely stateful — the differential settles it: the same rect on the same frame holds **126 SI pixels / 387 lit** with the plate up and **0 / 0** with it forced down.

It **accumulates**. Playing a deliberate late shooter for 150 s: 1 → 2 → 3 → 4 → 5 → 6 → **7 phantoms standing at once** (clock 94.1), and at the end **5 of the 7 silhouettes on his picture were dead**.

The glass denies what it draws: strip `LAST · 50 M RIGHT · DOWN`, no box, `lockOn()` null, nothing lit, and his TARGET button answers `NO TARGET UP · NEXT IN 1.1 S`.

**Threshold, measured, not assumed** (fresh page per point): clean at 0.584 / 0.433 / **0.383** s left; frozen at **0.333** / 0.284 / 0.083 s left. The boundary is **~0.38 s**, the fall time `(1−0.05)/2.4 = 0.396 s` less a tick — not the 0.42 s quoted across the fleet. The frozen value is set by how late the shot is (0.89 / 0.77 / 0.53 / 0.29), so every fixed "0.49 / 0.69 / 0.77" in the filings is lead-dependent, not a constant.

Identical on LIVE r.203 — **carried, not an r.204 regression**.

**r.205:** the identical shot at 0.1835 s left now goes down — `up:false, fall:1`, `standingDead:[]`, and the painted differential is **0 px with the plate up**. `FALL_ENDS_WITH_THE_WINDOW` is in the bytes and green.

### (B) COLOUR AGREEMENT — **FAIL** on r.204. **Still FAIL on r.205**, on four counts.

The headline failure on r.204 was his rule broken on **every target, every time**: a TARGETED plate painted the APPROVED red inside its own amber box.

I swept **all eleven standing plates of lane 21**, each through unmarked → TARGET → control → APPROVE. **11/11** showed it: `phaseOf='amber'`, `slotBoxes().col='#F0A020'`, and red `#E24B3B` pixels in the silhouette. The one-variable control is decisive — clearing **only** `q.mist` on the same frame moves every red pixel into amber (C-100C at 8×: **232 LOCK → 232 GIMBAL**, exactly). Unmarked: 0 LOCK on all eleven.

The picture is `shots/r204_z8_2_TARGETED_amberbox_REDman.png`: the glass says AMBER four times — the strip, the caption `T1 · 100 M CENTRE · AMBER`, the gold box, the toast `NOW PRESS APPROVE` — around a red figure, with a green APPROVE lit beside it. (The red rings inside the box are the bullseye reticle on `#hud`, r.143, correct — they must **not** be read as the defect; the control picture shows them surviving while the dome turns amber.)

Identical on r.203 — carried. **r.205 closes it: 0/11.**

**Four colour disagreements remain on the LIVE r.205 bytes** — D2, D4, D6, D7 below, each played and measured there.

---

## CONFIRMED DEFECTS, IN FIX ORDER

Fix order is: what is on his phone now, worst first. D1/D3/D5 are recorded as **CLOSED IN r.205** and must not be rebuilt.

### 1 — BLOCKING · (B), and a mark's colour outliving its mark · **OPEN ON LIVE r.205**
**`releaseAuthority()` lets go of the mark and keeps the colour — a standing, unmarked, unboxed target wears APPROVED red for ever**

*Played:* TRAIN UP lane 21. Marked + approved `C-100C-L21`, marked `C-200R-L21`. Changed lane with his own `#lanePick` (values are **zero-based** — "LANE 21" is value `20`; following the literal string `22` lands on LANE 23, which is how one master's first run found nothing), then back.

*Saw (r.204 and r.205 alike):* both plates return `mist:true, phase:null, slot:null`, `slotBoxes()=[]`, `tgtSlot` empty — the deck says unmarked, the strip says `100 M CENTRE · PRESS TARGET`, the lit button is **TARGET** — and the silhouettes paint **103 and 72 LOCK pixels** while the never-marked neighbour `C-150L-L21` is **27 SI cream**. It never heals (unchanged after 8 s). `shots/r205_orphan_B_back_RED_no_box.png`.

*It is the door, not the lane:* a **bare `releaseAuthority()`** leaves 3 orphans. RESTART is clean (`rangeReset` clears mist). So the lane change is one member of a class with eleven call sites — RE-MARK, ROOM START (whose own r.136 comment promises *"no red box crosses from the waiting room into LIVE"* — today the box does not cross and the red silhouette does), SCENE CHANGE, RESET, TARGET_DOWN/GONE, PEER RESET.

*Why r.205 did not close it:* r.205's painter is `phaseCol(q, q.mist?T13.LOCK:…)` — phase first, **mist as the default when there is no phase**. That is exactly the orphan's state, so the orphan is red *by construction*.

*Bounded, so the note does not overclaim:* the stale flag does **not** open the fire gate. Pressing FIRE on the orphan is refused — `NO RED BOX · MARK A TARGET FIRST`, rounds 30→30, hits 0→0. It is a picture telling a lie about authority, not authority leaking.

**One-line fix** — `play.html:5482`, in `releaseAuthority`, beside `state.pending=null;`:
```js
(typeof PLATES!=='undefined'?PLATES:[]).forEach(q=>{q.mist=false;});
```
(the `typeof` guard costs nothing and cannot throw from the ROOM START / SCENE CHANGE call sites). To close the class rather than the instance, the same line covers `pops` and `drones`, which carry the flag at `:1964`/`:2021` — I did **not** reproduce those on The Range, where no pop or drone stands, so they are named as class work, not claimed as played.

**The invariant, in his words:** *a target with no box is the plain silhouette — no mark, no colour.*

**The gate — `NO_COLOUR_WITHOUT_A_MARK`:** mark two plates (one approved), call **`releaseAuthority('QA')`** — *not* `rangeRelease`, see below — then assert for every plate of the lane that the colour the painter hands `silMesh(q)` equals `phaseCol(q,…)`, i.e. `PLATES.every(q => !q.mist || markSlotOf(q.id) || (state.desig&&state.desig.id===q.id))`. If the leg did not run (no plate marked, the release not reached), push `ok:false, note:'NOT EXERCISED: …'` — never green by omission.
**Why this row is needed and the existing one cannot serve:** r.205's `SILHOUETTE_COLOUR_IS_THE_PHASE` (`:4872`) is **green over this defect**, because its "the mark ended" leg calls `rangeRelease(qs[1])` — the one release door that *does* clear mist — and never `releaseAuthority`, which does not.

### 2 — BLOCKING · (B) · **OPEN ON LIVE r.205**
**The box, the round and the kill go to a target the bullseye is not on — a nearer plate up to 8 px away steals the mark**

*Played:* TRAIN UP lane 21, `state.aimRef=null` (the stick/drag path, which never sets it — on a phone a gesture over 14 px is a drag, so his thumb lives here). Mapped 45 aim points at which the bullseye is **strictly inside exactly one** silhouette.

*Saw:* **12 of 45 (26.7%)** put the box on a different silhouette. Example: the pip **3.57 px inside** `C-300-L21`'s outline and **6.17 px outside** `C-200R-L21`'s — `lockOn()` returns the **200R**, because its admission margin is `m=8` and its tie-break is **world metres** (200.3 m beats 300.3 m). Played to the end through the real buttons: TARGET boxes the 200R, APPROVE reddens it, FIRE **kills it** — rounds 30→29, hits 0→1, `lastShot C-200R-L21 dead` — while the 300 under his bullseye stands untouched at life 100. Identical on r.203 and r.205.

This is his 18:40 sentence in its worst form: the lit button acts on a target that is not the one under the bullseye. It also contradicts the r.147 declaration already written into the deck — *LOCK is the target nearest the bullseye **on the picture**, never the nearest in metres*.

**One-line fix** — `play.html:2133`, `lockOn()`'s plate branch: run the admission loop **twice — first with `m=0`, then the existing `m=8` as fallback** — and in both passes rank by the pip's distance to the outline (`max(dxOut,dyOut)`), using world distance only to break an exact tie.
**Do not touch `pipOn()` (`:2119`)**: the same `m=8` there is the *hold* test for a mark already made, and tightening it would drop a kept mark the instant the pip drifts 2 px off a 300 m plate.

**The invariant, in his words:** *the box goes to the silhouette the bullseye is on.*

**The gate — `THE_BOX_GOES_TO_THE_PLATE_UNDER_THE_PIP`:** for a spread of aim points, assert that whenever the bullseye is strictly inside exactly one standing silhouette, `lockOn()` returns **that** silhouette. The row must count the points it actually tested and push `ok:false, note:'NOT EXERCISED: no aim point was strictly inside exactly one silhouette'` if that count is zero.

### 3 — (B) · **OPEN ON LIVE r.205**
**On the MAP the lit FIRE freezes — lit, refused, and still lit after the refusal**

*Played:* red mark standing, pressed his real `#btnView`, then let the deck run **2.5 s of real frames**.

*Saw:* `nextStep()` correctly returns `''`, but `#fFire` **keeps the `lit` class** — opacity 1, border `rgb(226,75,59)`, the 10 px glow — for the whole map session. Pressing it is refused (`YOUR RED BOX IS ON THE 200 M RIGHT · YOUR BULLSEYE IS NOT · LEAVE THE MAP`, rounds 30→30) **and it is still lit afterwards**. Cause: `paintCues()` is the only writer of that class and `phys()` returns early for the map at `:2903` (`hudScore(); hudPhase(); return;`) — r.134 added `hudPhase()` there for the strip and left `paintCues()` behind. Carried from r.203 (the freeze is identical there; only the strip wording changed, r.203 `PRESS FIRE` → r.204/r.205 `AIM ON IT`).

On the map there is no bullseye at all, so his closing clause — *nothing under the bullseye → nothing lit* — is broken by a glowing button that cannot be used.

**One-line fix** — `play.html:2903`: `hudScore(); hudPhase(); paintCues(); return;`
`paintCues` is HUD-only (the three buttons, RELOAD's call, RESTART's word, the light, the timer, the pose card) — it draws nothing on the picture, so none of his rasters can move. It also un-freezes RELOAD's call-light, which is stuck on the map for the same reason.

**The invariant, in his words:** *no bullseye, nothing lit.*

**The gate — `BUTTONS_ARE_DARK_OFF_THE_PICTURE`:** with a red mark standing, toggle to the map, run **one real frame**, then assert no `#fTgt/#fAppr/#fFire` carries `lit` and the strip's tail is the map wording; toggle back and assert FIRE relights. If the toggle did not happen or no frame ran, `ok:false, note:'NOT EXERCISED: …'`.

### 4 — (B) · **OPEN ON LIVE r.205**
**Amber and red disagree about what "under the bullseye" means — a ~28 px band where APPROVE lights and acts, and FIRE would refuse**

*Played:* marked `C-50L-L21`, walked the bullseye off it 2 px at a time, once amber and once red, reading `lockOn`, `pipOn`, `nextStep`, the lit class and the strip at each step.

*Saw:* from **8 px to 35.9 px clear of the outline** (lock holds to `LOCK_REACH_PX=48`, `pipOn` ends at outline+8), the **same pixel** gives: amber → `APPROVE` lit, strip `PRESS APPROVE`; red → **nothing lit**, strip `AIM ON IT`. Cause: `stepFor` (`:945`) carries `fireOnIt` on the red branch only.

**The filed fix must be reversed, and this is the measurement that decides it.** In that band I pressed both: the **lit APPROVE acts** — it turned the plate red with the bullseye 32 px off the silhouette — while **FIRE is refused** (`YOUR BULLSEYE IS NOT · PUT IT ON IT`, rounds 30→30). So the red side is honest (dark + "AIM ON IT" + refused) and is **specified and gated**: `BUTTONS_FOLLOW_THE_BULLSEYE` has a `transit` leg (`pan+=1.2`) asserting *"a red the bullseye is not on lights nothing and says AIM ON IT"*. Widening red — the fix as filed — would light a button the deck then refuses, reinstate exactly what r.204 removed, and **fail that green row**. It is also new in r.204 in the honest direction: on r.203 the same offset lit FIRE and said `PRESS FIRE`.

**One-line fix (narrow amber, never widen red)** — `play.html:945`, `stepFor`:
```js
if(d.phase==='amber') return (approveWorksHere(d)&&(!d.ref||fireOnIt({kind:d.kind||kindOfRef(d.ref),ref:d.ref})))?'APPROVE':'';
```
with the mirror in `hudPhase`'s amber branch (`:2978`) so the strip says `AIM ON IT` there too. **Owed, and his call because it changes an action, not the glass:** `approveDesig` (`:2472`) has no on-target test, so after this edit a dark APPROVE would still act if pressed. Closing that is its own revision and its own row.

**The invariant, in his words:** *one meaning of "under the bullseye" for all three buttons.*

**The gate — extend `BUTTONS_FOLLOW_THE_BULLSEYE` with an amber twin of `transit`:** at 25 px off one amber mark and 25 px off one red mark, assert both phases answer the same kind (both lit, or both dark). The row must fail if the offset leg did not run — its present legs all aim dead-centre, which is why it is green over this today.

### 5 — NOTE · (B) · **OPEN ON LIVE r.205**
**The recital names an UNTARGETED plate, and a DOWN plate, in the TARGETED amber**

*Saw:* an unmarked plate under the bullseye reads `300 M · PRESS TARGET` in **`rgb(240,160,32)` = `#F0A020`** — the colour he reserves for TARGETED. The `LAST · 50 M RIGHT · DOWN` branch is the same amber. Meanwhile *nothing* under the bullseye reads `TARGET FIRST` in `#C9A227` gold, so the deck already has a pre-mark colour and uses a second one. The box and silhouette are correct here, which is why it is a NOTE. **New in r.204** (r.203 had no such branch and said `TARGET FIRST`), so it is a fresh line the next cut can simply correct.

**One-line fix** — `hudPhase`, `:2979` (unmarked) → `pd.style.color='#C9A227'` (the gold its own `TARGET FIRST` already uses) and `:2981` (`LAST … DOWN`) → `T13.SI` `#E8D5B0`, keeping `#F0A020` for AMBER (`:2978`) and `#E24B3B` for RED. **Note for whoever ships it:** `frontend/tests/drone-playable.test.mjs` pins the literal source text `PRESS TARGET'); pd.style.color='#F0A020'`, and that test is in `prebuild` **and** `test:ci` — the regex moves with the revision, or the build goes red.

**The invariant, in his words:** *amber means marked, and only marked.*

**The gate:** fold into the strip row — assert `#phDes`'s colour equals the phase of what it names (`#F0A020` only while a mark is named), `ok:false` + `NOT EXERCISED` if no unmarked-plate leg ran.

### CLOSED IN r.205 — recorded so they are not rebuilt
| # | Defect | Closed by | Verified by me |
|---|---|---|---|
| D1 | TARGETED silhouette painted APPROVED red (11/11 plates) | `:2060` one painter + `SILHOUETTE_COLOUR_IS_THE_PHASE` (DD-16) | replayed the 11-plate sweep on r.205: **0/11** |
| D3 | QUAL late hit freezes mid-fall for ever | `:1009` window-end sweep + `FALL_ENDS_WITH_THE_WINDOW` | replayed the 0.1835 s shot: down, `fall:1`, **0 painted px** |
| D5 | Empty magazine darkens TARGET and APPROVE, which still act | `:947` FIRE-only + the strip branches (DD-19) | replayed: mag 0 → TARGET lit/`PRESS TARGET`; after TARGET → APPROVE lit/`PRESS APPROVE`; after APPROVE → nothing lit/`PRESS RELOAD`, FIRE refused. Strip and button now agree at every step |

---

## WHAT WAS REFUTED, AND WHY

I did not re-litigate the four already refuted; I confirmed the reasoning holds on these bytes and add the measurement that settles each.

1. **"Mid-fall a target wears half a box"** (Aset). The guard asymmetry is real in the source — `slotBoxes()` drops a slot on `up===false||lifePct<=0`, the screen T-box caller guards only `up===false`. But **no real route reaches that state**: `fireN` deletes the slot in the same synchronous block as a dead hit, a peer HIT row calls `rangeRelease`, and a lapse sets `up=false; fall=1` in one step. The finding's own repro set `lifePct=0` by hand while skipping the deletion. Dead code, not a picture he can see.
2. **"A ~20 px ring where a red target lights nothing"** (Athena). Reproduced exactly, refuted on meaning: the strip in that band reads `AIM ON IT`, so the words and the dark row are one state, and the "NOW PRESS FIRE" it leans on is a ≤4.2 s approval toast. The proposed fix lights a FIRE that the deck refuses and **fails the green `transit` leg**. My own press confirms the refusal. The surviving, narrower point is kept above as defect 4.
3. **"Three painters, three guards"** (Enlil). Same as 1 — a real asymmetry with no reachable consequence.
4. **"The lit button trails the glass by one frame"** (Sofia). The DOM is stale only when read in the same task as the action; `paintCues` runs inside `phys`, which runs from a rAF registered before any handler's, so no *painted* frame ever shows it. Its real value is the warning it carries: a same-tick probe reports false colour failures.
5. **"An empty magazine leaves a RED box with no step lit"** (Thor). Correctly refused on r.204: the strip said `PRESS RELOAD`, RELOAD was calling, and FIRE-lit-but-refused is what r.204 was built to stop. Note the live answer changed anyway — r.205 now lights TARGET and APPROVE while dry, because they cost no round.

**Two corrections to the record the fleet should carry:** (i) `:4726` and `:4727` serve **different** bytes — the r.203 comparison was available throughout, and I ran it on every finding; (ii) the quoted pixel counts and frozen `fall` values across the filings are aim- and lead-dependent. The reproducible proofs are the **one-variable control** (clear only `q.mist`, same frame) and the **painted differential** (same rect, plate up vs forced down).

---

## WHAT THE NEXT REVISION MUST CARRY

**Both items the order names are already shipped in r.205 — verified by play, not by reading the commit message:**

- **His captions removal** (20:44, *"remove all text from middle; targets only"*, DD-14): `plateCaptionRects()` returns `[]` on r.205 and measured **0 caption rects** with a plate marked; gated by `NO_WORDS_ON_THE_STAGE`. On r.204 the function still measures and places per-plate captions. **Done — do not rebuild.**
- **The button's colour** (21:05, *"the lit BUTTON carry the same colour as the box"*, DD-15): measured on r.205, the lit APPROVE is now **`rgb(240,160,32)` = `#F0A020`**, its box's amber; lit FIRE `#E24B3B`; lit TARGET stays `#3DCC8A` (an unmarked plate has no box to match, which is the only defensible reading). The r.204 baseline the change is measured against was lit APPROVE **`rgb(61,204,138)` green on a `#F0A020` box**. Gated by `BUTTON_WEARS_ITS_TARGETS_COLOUR`. **Done — do not rebuild.**

**So the next revision carries the five still-open defects above, in that order** — 1 `releaseAuthority` keeps the colour, 2 the stolen mark, 3 the frozen MAP button, 4 the amber/red band, 5 the recital's amber — **each with its gate**, and each as its own revision under his one-revision-at-a-time law, with the live site confirmed between them.

### The gate set itself is the deeper finding

**On the r.204 bytes, all five of the rows that name these behaviours were GREEN while every one of the eight defects stood** — 228 rows, 227 pass, the single red being `SYNC_DIRECT :: OFFLINE`. Specifically:

- `PHASE_COLOUR_FOLLOWS_THE_SLOT` was green over an amber-boxed red silhouette on all eleven plates, because it tests the `phaseCol()` **helper**, never the painted argument, and its only source check — `!/hot\(q\)\?T13\.LOCK/.test(src) && /phaseCol\(q,/.test(src)` — forbids *last* revision's spelling while `q.mist?T13.LOCK:` walks straight through both halves. It has been green over this since r.196.
- `NO_PHANTOM_TARGETS` cannot see a frozen phantom: it compares drawn silhouettes against `platesHere().filter(q=>q.up)`, and a frozen plate has `up===true`, so it is counted as legitimate on **both** sides — and the block runs with `rangeMode='bounce'`, so it never enters QUAL 40 at all.
- `NEXT_BUTTON_LIT` tests the empty magazine only on a **red** mark, the one case where "nothing lit" is right.
- `BUTTONS_FOLLOW_THE_BULLSEYE` aims dead-centre in every leg but `transit`.

**The rule for every row added from here:** a gate must measure the **painted result**, not the helper; and it must **fail, not pass, when its leg did not run** — `ok:false` with a note beginning `NOT EXERCISED:`. A row that can go green by not being exercised is not a gate. *An invariant defended only by a comment is already lost.*

---

## EVIDENCE

All under `scratchpad/fleet12/verdict/` — probes `lib.mjs`, `p1-mist.mjs`, `p1b-shot.mjs`, `p2-orphan.mjs`, `p3-qualfall.mjs`, `p3b-accum.mjs`, `p3c-thresh.mjs`, `p4-glass.mjs`, `p5-steal.mjs`, `p6-band.mjs`, `p6b-act.mjs`, `p7-cmp.mjs`, `p8-final.mjs`; data `p1_r204.json`, `p3b_accum.log`.

Pictures in `verdict/shots/`: `r204_z8_2_TARGETED_amberbox_REDman.png` (the amber box, the amber caption, the red figure) beside `r204_z8_3_CONTROL_mistOff_amberman.png` (same frame, mist cleared, the figure joins its box) · `r205_orphan_B_back_RED_no_box.png` (red silhouette, no box, strip `PRESS TARGET`, TARGET lit — **live now**) · `r204_qualphantom_zoom.png`, `r204_qual_accumulated.png` (seven) · `r204_steal.png` · `r204_map_FIRE_still_lit.png` · `r205_*` counterparts.

Nothing outside `scratchpad/fleet12/` was written or modified; the repo and both served decks are untouched.
