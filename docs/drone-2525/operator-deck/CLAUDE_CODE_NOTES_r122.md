# Drone-2525 — notes for Claude Code
HEAD: `drone-2525_v.00.00_r.122.html` (~155 KB, well under 7.77 MB)
Alias: `drone-2525.html`
Nomenclature: `v.00.00_r.NNN` only. Do not invent skipped revisions.

Civic sim only. Texas Capitol lawn is a rehearsal arena. CH0 is a separate virtual rifle range. Do not optimize real firing solutions around the Capitol.

---

## Doctrine (do not bend)

TARGET → AMBER box + T1…T99  
APPROVE → RED box (second HI; same phone = SOLO HI-2)  
FIRE → only after RED  
Result → HIT or MISS (range) / life % (lawn pops)  
Replay → evidence  

PLAY → RECORD → REPLAY → COMPARE → QUALIFY → IMPROVE → SHARE

AI/AsM may spot. HI authorizes. Symbol for machine seat: ◬ (never paint the letters "AI" on craft).

---

## What r.122 actually contains

### Worlds
- **CH1–CH5**: Texas Capitol lawn wireframe (Congress / 11th origin). 42 turrets on a ring when not on range.
- **CH0 TRAIN / SCEN · 50M RANGE**: Army-style range, not the lawn. 42 lanes on one firing line.

### 42 lanes (CH0)
`LANES[0..41]` at x = -205 + i*10.
- every 3rd **QUAL** (flat)
- **UP** (positive slope)
- **DOWN** (negative slope)

Turrets **T01–T42 park on the firing line**, `yaw = π` (look +Z downrange).
`parkRangeTurrets()` / `restoreCapitolTurrets()` when leaving CH0.

Select lane: map tap L##, or `#lanePick`. `seatLane(i)`.

### Alt-C silhouettes (`QUAL` + `silMesh`)
Match the M16A1 25 m Alternate Course C sheet, placed at **true metres**:

| id | form | intent |
|---|---|---|
| C-50 | F mound | 50 m foxhole |
| C-100L/R | F mound | 100 m |
| C-150L/R | E torso+head | 150 m |
| C-200L/R | E | 200 m |
| C-250 / C-250B | E | 250 m |
| C-300 | E | 300 m |

`qWorld()` offsets each plate by current lane x / slope / pit height.
HIT folds the plate (`q.fall` 0→1). MISS leaves it up.

### Three range modes (`#rngMode`)
1. **PRACTICE UP** — hit → down → pops back
2. **PRACTICE STAY** — hit → stays down
3. **QUAL 40** — official tables, 40 rounds, stay down

Official Alt-C (DA 5790-R / West Point):
- Table I prone supported 20 rd / 120 s / max 2 scored per silhouette
- Table II prone unsupported 10 rd / 60 s / max 1
- Table III kneeling 10 rd / 60 s / 50+100 ×2, 150 cap 1
- 23 Marksman / 30 Sharpshooter / 36 Expert

AsM fixture: `ASM_QUAL40.json` seed 2525, mean ~30.2, Thoth 36 Expert. Button **ASM QUAL40**.

### Craft
- TURRET — right stick only (look). Left body disabled.
- QUAD (D1Q) and **VTOL FOIL** (one body; not two objects)
- MASS-AI = two-wheel ground droid (R2). No walls.
- ARK SAIL 33 + MINI 66-33 water-only. No “Travis”; pick Austin water body.

Look-up + forward climbs on air (ceiling 420). Walls reject air/droid. Water clamp for hulls.

### Controls (locked — do not invert)
L stick: up = body forward, down = back, left/right = sidestep.
R stick: left = look left, right = look right, up/down = head.
Turret: same R law (`pan += -rx`).
Touch drag: secondary look; left is left, up is up.
Pinch zoom. Map: drag pan, pinch zoom, two-finger tilt/yaw (Security-2525 style).
Click = target. Double-click = fire. Voice toggle exists.
Sensitivity / trim in settings; trims must persist (do not zero after load).

### Authority / HUD
Orange toast = status line, not box color.
TARGET toast must say **AMBER · WAIT APPROVE**, never RED.
APPROVE toast: `RED BOX · id · SOLO HI-2` or `PEER HI-2`.
After fire: `LAST T# id HIT|MISS` (range) or life % (lawn).
Red list on left = approved T-slots.

### COMM / SYNC (present, not two-phone proven)
BroadcastChannel + WebRTC offer/answer with **shared room**.
`appendCanonicalEvent` → `applyWorld` reducer → hash.
HELLO compares replay hash → MATCH / DIVERGED.
Do not create a second SIM-ACTION via `netEvent` after `decide()`.
BLE is scaffold unless a writable 2525 characteristic exists.

### Vector law
Black ground. Edges only. 13 Trinity strokes. No fill/gradient/shadow.
LOD/FPS from compute after CNN reserve. HUD shows tier · fps · dropped.

---

## Files

| file | role |
|---|---|
| drone-2525_v.00.00_r.122.html | HEAD playable |
| drone-2525.html | same bytes |
| ASM_QUAL40.json | 12 AsM × official 40-rd tables |
| ASM_CUP_99.* | immutable older cup fixture — do not overwrite |
| CLAUDE_CODE_NOTES_r122.md | this note |

---

## Do not regress

1. Stick signs. Test turret + quad + VTOL FOIL before any release.
2. Turret CH0 stays on its pit. No `x*0.92` camera pull (that sheared the picture).
3. FOIL ≠ second aircraft. QUAD / VTOL / FOIL labels stay on D1Q / D1 / D1F if those ids exist.
4. CH0 must not draw the Capitol ring or T01–T42 circle.
5. `chNum(0)===0`. CH0 is not CH1.
6. One event → one reducer → one world → one hash.
7. Fixture vs live SIM vs human plays stay labeled separately.
8. Release gate: movement 18/18 class ops + in-file QA. Do not ship “cold.”

---

## Still open (honest)

- Two real phones: HOST/JOIN → DIRECT → AMBER both → RED both → same hash → disconnect/snapshot → same hash. Local QA green ≠ that proof.
- 3v3+ event order (need session clock, not peer-local seq).
- QUAL40 human play does not yet enforce Table I/II/III magazines or 120/60 s towers — scoring is HIT/MISS + 40 count. Tables are in the AsM fixture.
- Alt-C sheet is 25 m *scaled* paper; we placed **true 50–300 m** plates. Both are valid; do not mix claims.
- Bathymetry is a proxy, not a survey.
- Endurance soak (hours of wall-clock FPS/heap) is not the 2016-trial batch.
- 9v9 remains labeled locked until 1v1 then 3v3 qualify.

---

## Suggested next revision (narrow)

r.123 only if needed:
- QUAL40 tower: Table I 20 / Table II 10 / Table III 10 with time + per-silhouette cap in the live HI loop.
- Map: hide T01–T42 captions on CH0 (already intended); keep L01–L42 + silhouette stack on the selected lane only if 42×10 plates choke a phone.
- Two-phone SYNC gate as a first-class QA row that stays FAIL when not DIRECT.

Do not bundle palette changes, 16k claims, or swarm architecture into that revision.

---

## Operator map of the UI

SCEN · 50M RANGE | CH0 TRAIN | RANGE · PRACTICE UP/STAY/QUAL 40 | L## picker  
MAP = 42 lanes. OPERATOR = selected pit, look downrange.  
TARGET / APPROVE / FIRE. R HEAD stick on the right.
