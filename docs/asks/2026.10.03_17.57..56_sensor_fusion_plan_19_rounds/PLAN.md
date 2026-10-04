# Sensor Fusion → DETECT → control loops — the plan for Grok (revision 0.18)

> Living plan, revised once per round of the 19-round SSSES · SPIRAL · AsM simulation (see `ASK.md`, `rNN.md`).
> Goal (operator): create Drone-2525, Manta-2525 and MASS-AI detection quickly as a global team — our models, introduced into control loops.
> Everyone starts at **Your region** below (role · next action · file); it is the only start list.
> **Next Grok commit (nothing else first):** wire the existing `frontend/tests/sensor-fusion-coral.test.mjs` as `test:sf-coral` (a green
> line first), then `frontend/tests/sensor-fusion-plan-citations.test.mjs` as `test:sf-plan-cites`, both in `test:ci` beside `test:sf-r4a` (`:192`). Its first green date is ladder week 1 in
> `contract.json`. No new C-step promise is added until it exists.

**Handed to Grok at round 19** (in this order; everything else is "specified, not started"):
1. The next commit above · owner: contract owner. Test 31 reports "late" if week 1 has no green run 7 days after round 19.
2. C1 · `lib/2525-core/detect-contract.ts` with `contract.json` and golden vectors · test 12 · owner: contract owner.
3. The air kit and the minimum Gate 2 set for `drone-avoid-01` · `public/sensor-fusion/kits/air/`, `lib/sensor-fusion/replay.ts`
   (emulator plus air obstacle layer), `lib/2525-core/loop-actions.ts` (air `FlightAxes` only) · `sensor-fusion-loop-replay.test.mjs` ·
   owner: air loop integrator.
**"Quickly" has a number:** each kit records *time to controller-proven* (the Gate 2 pass date minus the date the region's kit was first
published) in `kit.json`, never a download date. Test 31 and the project page show it per region.

**Done at round 19 = specified**, each with owner, file and test: (1) `drone-avoid-01`'s gates, signing path and values, cited;
(2) one command type and loop host per family, every `VEHICLES` id mapped or no-loop; (3) a covering sensor per loop class; (4) an output
kind per purpose, or "later"; (5) a sample size and method per statistical claim; (6) region spec files change without lapsing another
region's card; (7) alert paths paired, local first, no picture without consent; (8) a role and recorded drill per human who takes over;
(9) the 14,000-word budget.
**Done at build week N:** the dated ladders in `loop-spec.draft.json` `ladders` (rules in its `_about`; moved to `contract.json` at C1).
Every ladder runs smoke replay, Gate 2, R9 merge and first trained card, Gate 1, C5, C5b, C5a; test 31 refuses any other order.
**Answer first** (decisions ranked by the teams each one blocks): 9, then 8, then 14 (21 and 17 next; test 31 checks each region row's
"Blocks arm" set against the decisions its ladder rungs cite). They block **arm**, never
**simulation**, which runs on "proposed" defaults; unanswered at hand-off, test 31 marks them "default, unsigned" and signing waits
(`ladders.decisionDefaults`, joined to every C5 rung). One-tap defaults:
9 = the proposed values in Part C (speed table included) · 8 = Drone-2525 collision avoidance in the civic simulation ·
14 = each region's integrator owns its minimal world now, on the dated C4b ladder.
> You are Grok. Methods, files and tests for you to build; no code here.
> Sources: `2026.10.03_17.43..08_sensor_fusion_ask_to_grok_capture_label_projects_v3_FINAL.md` (body, appendix omitted) ·
`2026.10.03_17.55..31_detect_cable_light_codex_video_for_grok.md`.

## Revision history
| Rev | Round | What changed |
|---|---|---|
| 0.00–0.13 | 1–13 | Moved verbatim to `HISTORY.md` beside this plan (0.15); rows unchanged. |
| 0.14–0.16 | 14–16 | Moved verbatim to `HISTORY.md` (0.17); rows unchanged. |
| 0.17 | 17 | Cut by moving: history 0.14–0.16 to `HISTORY.md`, R4b and R4c to `WAITING.md`, alerts and schools to `ALERTS.md`, citations-test fail list and runners to `TESTS.md`. Fixed: input size from the model tensor; pixel rows by class and loop row, child width, margin; smoke-replay week 1, dated C5 and C5b; setpoint-loss timeout; decisions block arm only; loop-rate replay clips; poses sensitive; decision 25. Measured `wc -w PLAN.md`: 14,600 (from 15,496). |
| 0.18 | 18 | Every ladder in build order (R9 and first trained card, Gate 1, C5, C5b, C5a) with a week-2 CODEOWNERS rung; derived run counts; Manta current pass line, card line, child row; pole and tree refused; `sizeTruth`; `seedClassMap`; custom01 fixed; Ground row split; decisions in order; setpoint parameters and order; signed size in the outcome line. |

## The whole chain in one line (read this first)
capture (R2) → Level 1 boxes (R3) → Level 2 review (R6) → XML + Light Codex strip (R3, R10) → `<Set>.train.json` (R9) → model folder +
model card (hand-off, R9) → edge or DETECT (Part B, `DETECT.md`) → display → **control loop** (Part C, C1–C6: Drone-2525 air · Manta-2525 water · MASS-AI ground).
The citation test also checks that every R and C number in this line exists as a heading or build step.

| Role | Picks up |
|---|---|
| Labeler | R2 capture, R3 Level 1 boxes |
| Reviewer (never the labeler) | R6 Level 2, R9 merge |
| Model builder | the training hand-off: train.json in, three files + model card out |
| Loop integrator (one per region: air, water, ground) | Part C replay gate, HAL fit, its world in `replay.ts` |
| Contract owner (one, cross-domain) | `detect-contract.ts`, the spec file, `actuators.json`, golden vectors |
| Camera integrator (school region) | camera values, consent status, the local alert screen |

The role's next action and file are columns of **Your region** below.
The R numbers are build steps, not plan revisions (0.NN) and not Sensor Fusion ledger releases.

**Words used here** live in `GLOSSARY.md` (each Part C term once; citations test).

**Your region (index) — the only start list.** Each region's **loop kit** is one folder, `public/sensor-fusion/kits/<region>/`: its spec
file, world seed, emulator seed, golden vectors, one pinned replay clip and the provisional card. A new partner reaches controller-proven
(provisional) from that folder alone. (1) `kit.json` lists the spec-file hash, contract hash, world and emulator seeds, golden vectors,
clip hash, a **salted consent-id hash** per clip (never the raw id; the raw id and guardian record stay on the project store behind R4a
policies) and the provisional card hash; `sensor-fusion-loop-replay.test.mjs` runs Gate 2 from the kit folder alone. (2) **No picture of a
person in a public kit:** `kits/camera/` holds synthetic frames only; any other kit clip with a person, swimmer or child-height frame needs a
consent id and a passed blur; the citations test refuses an image or video under `kits/camera/`. (3) **One spec file per region:**
`public/sensor-fusion/loop-spec/<region>.json` plus a shared `contract.json`, each with its own hash and owner region in CODEOWNERS. A card
lapses only on **the region's spec file, or `contract.json`** (one wording everywhere; test 34). In this plan "the spec file" means the
region's file plus `contract.json`; the bare old name is refused. (4) **Sensitive content stays off `public/`.** `contract.json` classes every spec field by sensitivity. Mapped wire spans,
geofences and camera positions live in the members-only project store behind the R4a policies; public kits carry synthetic layouts
only. The citations test refuses coordinates or a camera position under `public/sensor-fusion/`. (5) **Dependency lifetime** (ROS 2 Jazzy
to May 2029, firmware majors, LiteRT, base-model digest) is in `loop-spec.draft.json`
`retrainCadence.dependencyEndOfLife`.
| Region | Kit path | Roles and next action · file | First test | Blocks arm (simulation runs on defaults) | Week-1 deliverable |
|---|---|---|---|---|---|
| Everyone | — | the citations test and `test:sf-coral` (the next commit), then the R1 test | citations test | — | citations test green |
| Air | `kits/air/` | labeler: R2 wire clips at range · the capture spec; reviewer: R6 on another member's boxes · `.xml`; integrator: obstacle layer · `lib/sensor-fusion/replay.ts` | test 40 | 8, 9 | kit smoke replay; controller-proven at week 5 |
| Water | `kits/water/` | labeler: R2 hulls in glare; remote operator: takeover drill in simulation (`loop-spec/water.json` `humanRole`; pass: 59 timed takeovers, p95 under the stand-off time); integrator: 2D water step · `replay.ts` | test 31 | 9, 14 | kit smoke replay; controller-proven at week 10 |
| Ground | `kits/ground/` | labeler: R2 night steps; integrator: 2D ground step and dock marker · `replay.ts` | test 31 | mass-droid: 9, 14, 21, 22, 23 · exel-robot: 9, 14, 17 | kit smoke replay; controller-proven at week 10 |
| Camera | `kits/camera/` | camera integrator: values and consent check · `loop-spec/camera.json`, the capture spec | test 40 | 3, 18, 19, 20 | values and consent check written; no capture before consent |
| Contract owner | — | C1 record, spec and golden vectors · `lib/2525-core/detect-contract.ts`, `contract.json`; model builder: pinned recipe (R9) · `recipes/recipe.json` | C1 golden vectors | 9 | C1 bench file |
R8 clock and R10 strips can start in any region. Waits on decision 1: R4b group join, R4c seating, R5 group blocks, shared queues, Upload.

---

# Part A — Sensor Fusion: capture, label, build models as a team (v3 FINAL, R1–R10)

> Operator ask of 2026.10.03: **use the tokenomics visual from https://exel-ai-polling.explore-096.workers.dev/vision-2525/** for
> contribution time (screenshot: `2026.10.03_17.43..08_sensor_fusion_tokenomics_visual_vision2525.png`). v3 folds the twelve-lens test into v2.

You are Grok, coding `frontend/app/SensorFusion-2525/` and `frontend/public/sensor-fusion/` on `main`. Short sentences in the app. **One
revision at a time:** commit R1, wait until the live site serves it, then start R2.

## Rules that do not change
- A model is one folder with three files: `detect.tflite`, `edgetpu.tflite`, `labelmap.txt`. Never rename them. Never add a second way to store a model.
- Nothing a person sees names a database, an error code or a vendor. One plain sentence; the detail goes to the console.
- The screen never says "saved", "uploaded" or "reviewed" before it is true.
- New words: the key goes in `frontend/lib/lexicon-data.ts`, and its name goes in `AFTER_FILL` in
  `frontend/tests/lexicon-coverage.test.mjs:19`. It stays English until the operator says the English is final. No translation fill.
- A test for a later revision does not enter `test:ci` before that revision ships.
- **Citations are checked, not trusted.** `frontend/tests/sensor-fusion-plan-citations.test.mjs` (plain Node, `test:sf-plan-cites`): not built at
  `8f2bddc` (absent from `package.json:10`, `:192`); owner: contract owner; due week 1. Until it exists, "the citations test checks" means "will check". `test:sf-coral` runs with
  `node --experimental-strip-types` (`sensor-fusion-coral.test.mjs:3` imports `sf.ts`).
  **Draft promotion:** in the C1 commit every key of both draft JSONs lands exactly once in a region spec file or `contract.json`,
  and the drafts are deleted. **Scan set:** PLAN.md, TESTS.md, GLOSSARY.md, DETECT.md, ASK.md, WAITING.md, ALERTS.md and both draft JSON files. Each citation is **path + anchor string**
  (the line is a hint), marked **today** (code exists) or **to build**. It records its **pin SHA**; at round start it prints each cited
  file changed since the pin, and fails when `git log <pin>..HEAD` touches one with no plan note, or a "no code commit since X" sentence
  disagrees with `git log X..HEAD -- frontend/`. **Word budget** (`wc -w PLAN.md`, computed by the test itself, read from `contract.json`): at most 14,600 at
  0.17 and 14,000 at 0.19; 10,000 is a build-week target; it prints the count per Part. Prose lines at most 200 characters (tables exempt).
  What it fails on is listed in `TESTS.md` (moved in 0.17).

## Today vs gap (read the code first — do not rebuild what ships)
**Pin: last code commit `8f2bddc`** (`git log 8f2bddc..HEAD -- frontend/` is empty; the citations test checks this sentence and
writes the round commit into its output). Since the 0.06 pin: `0140439` adds the unused `lib/sensor-fusion/voc.ts` (R3); `37df2c1`
makes `cnn.js:106-107` skip an empty or placeholder name while Python keeps it (`sensor_fusion_edge.py:178`), a **regression** against
the C2 adapter rule; `7a9d4f9`, `dd6d410`, `8f2bddc` are ledger revisions 32-33 (`ledger.ts:234`).
Earlier: `02872b9`, `3acb1d5`, `26d9d12`, `80e6a1c` (`git log`). CPU is the default (`sf.ts` `modelFile` ~:57, `runPlan` ~:62). Gap: `test:sf-coral`.
**Shipped, keep:** the accuracy meter (`hits.reduce` ~:783) and step icons (`ledger.ts:132-146`); PNG names (`c49a9d4`; R2, R5, R7, R9,
R10 follow PNG); `models.json` (`sf.ts:23`, `cnn.js:50`; gap: only the R1 test).
| Already in the code | Where | Gap |
|---|---|---|
| Steps "Capture Images" and "Annotate Images" | `app/SensorFusion-2525/steps.tsx:2-3` | Capture takes only sensor + device today; video picking (R2) |
| Pascal VOC writer and reader | `function vocXml` (~:186), `function writeXml` (~:231), `function readVoc` (~:237) in `sensor-fusion.tsx`; unused `lib/sensor-fusion/voc.ts` (`0140439`) | the page **imports** `voc.ts` and deletes its three copies; never a third reader (R3) |
| Picture + label tables | `040_sensor_fusion_pictures.sql`, `041_sensor_fusion_labels.sql`; **R4a SHIPPED** (`0c25475`, `042_sensor_fusion_members_only.sql`: guest policies dropped, `sensor_fusion_members`, member-only read and insert; `tests/sensor-fusion-r4a.test.mjs`) | 041 lacks `level`, `labeled_by` and review columns; `owner_key` is free text, never bound to `auth.uid()`; no way to seat a member; NULL-`project_id` rows vanish (R4c) |
| Names `head.0001.png` that continue | built by `function peekNames` / `function commitNames` (~:267-272) | dot form → `<label>_<NNNN>.png` (R5), with migration |
| Fixed detection threshold | `cnn.js:104` (`score > 0.5`); also `sensor_fusion_edge.py:176` in both `edge/` and `download/` | per-class thresholds from the model card (Part C) |
| Invite codes | `lib/drone-2525/si-pod.ts:119` `inviteCode` = seeded hash fed to `randomPodCode`; `admits` `:149` runs in the browser | live codes from crypto bytes + a server check (R4b) |
| Vehicles | `lib/2525-core/controls.ts:20-21` (`vtol-quadwing`, `manta-99-66`, `manta-mini-66-33`, `ark-sail-33`, `mass-droid`); the comment at `:19` is prose, never a gate; `lib/drone-2525/platform.ts:10`; Manta project `lib/pod-projects.ts:86`; `lib/2525-core/MANIFEST.md` | no detection contract; no water or ground world (decision 14). `turret` (`:21`, the Drone-2525 fire-gate surface, `drone-ledger.gen.ts:17`) is **no-loop** by name in `contract.json`: out of scope, nothing designed for it |
| Compute tiers | `lib/wire-core/hal.ts` `HAL_PROFILES` (pi/edge/accel), `halCnnMs`, `sensorFits`; `tests/drone-hal.test.mjs` | render budgets, not model time; the card carries measured ms (Part C) |
| Shipped labelmaps | `models.json`: `demo90` (COCO), `thermal01` (`:553`, dog, person), `checkid` (`:541`, four named people), `tree` (`:136`), `deer` (`:109`), `custom01` (`:145`, the full 91-label COCO map, like `demo90`; used: car, bus, truck, motorcycle, boat, bird), `head` (`:118`), `eyes` (`:127`) | no wire, pole, hull, pier, buoy or step; seed `drone-avoid-01` from `tree` plus `vehicle` ← car, bus, truck, motorcycle (`seedClassMap` in the capture spec; test 40 refuses a seeded class whose source labels the model lacks), wildlife from `deer` (R9.5); `checkid`, `head`, `eyes` on the deny list |
| Model bytes source | `BASE`, a third-party master branch (`cnn.js:8`, `sensor_fusion_edge.py:34`); no browser hash check (`cnn.js:64`, `:67`); Python fetches at `:127`, installs by `os.replace` (`:128`), updates itself from `APP` (`:35`, `:285`) | pinned, hash-listed copies named by the signed card |
| Two edge-script copies | `public/sensor-fusion/edge/` and `download/`, byte-identical; `model_rows` reads a cached `home()` `models.json` first (`:39-47`) | `edge/` is the source, `download/` gated byte-identical |
| Detector timing | `sensor_fusion_edge.py:167-169` and `cnn.js:80`, `:116` time inference only | both adapters stamp capture time at the read (Part C) |
| Detection payload | `lib/light-codex-detect.ts` — **does not exist yet** | Part B method 1 |
| Pod clock | `lib/pod-clock.ts` | wire to project elements (R8) |
| Trinity cards (♡ SI · 웃 HI · ◬ AI) | `app/vision-2525/page.tsx:168-195`, data `lib/soi-framework.ts:32-34` | reuse as one shared component (R8) |

## Revisions, in order (each: its done line, its tests, then wait for LIVE)

Where to start is the **Your region** index at the top; this section gives each R step's done line and tests.

**R1 · One model list — SHIPPED.** `models.json` exists and all four readers use it (see Today vs gap). Do not rebuild it.
*Only gap — the test:* every `models.json` entry has its three files; the name picker shows only the open model's labels.

**R2 · Capture from three sources, one set.** Sensor (name from the open model's `labelmap.txt`, default 4) · this device (files) ·
video. Video keeps the fewest different-enough frames: 4 frames/s; drop frames under the Laplacian floor (proposed 100 on a 640 px grey
frame) and near-copies within Hamming 6 of a 64-bit fingerprint; prefer frames where the model sees the object; keep 1 in 10 empty; cap 40
per minute; show "1,800 frames → 31 pictures" first. Every number lives in **the capture spec** (`capture-spec.draft.json` beside this plan until C1, then the region's spec file), read by page and
Python. Strip GPS and EXIF; respect rotation; HEIC and JPEG uploads become PNG.
**Domain and conditions.** Each set records its domain (air · water-surface · underwater · ground) and sensor (rgb, thermal; sonar and
depth later) and tags the conditions a loop needs: glare, turbidity, spray, night, rain, lens fouling, dust or mud, motion blur, child
height (consent only). The R6 set check warns when a needed condition has zero pictures.
**People in pictures.** `person` is for avoidance, search and rescue, alerts and blurring only, never for engagement. Faces in shared sets
are blurred unless consent is recorded; school pictures need a consent id each (`ALERTS.md`). **Identity models** (`checkid`, any
face or named-person labelmap) are never loop- or camera-eligible and never shared without recorded consent.
**Quotas per domain** (the capture spec): minutes per class = (held-out + replay + 300 train boxes) ÷ (kept picks/min on the R2 pinned
clip × boxes per pick); replay equals held-out; each needs **at least 30 distinct clips per class, and never fewer than ceil(quota ÷ m)**, scored with a clip-cluster bound. **Capture
burden:** classes × conditions × (held-out + replay) + train; per-condition quotas only report until the operator promotes one. Each class
records a **known size** (measured p5 size truth, below) and a minimum pixel extent at its minimum detection range (size ÷ range × focal
length; polylines by length); a camera and class pair below it is refused. Replay clips carry range truth for every class the loop steers on. Each camera has intrinsics
**per medium**; Gate 1 refuses a clip whose medium has no calibration, and a surface-trained Manta card is refused underwater. **Hard
cases** (field events, Part C) are picked first. **Loop-rate clips:** replay and held-out clips are stored whole at no less than the loop's
`replayFps` (Drone 20, ground 8, Manta 4); only training picks are decimated to 4 frames/s. Every person, swimmer or child-height frame in
such a clip is blurred; one unblurred frame refuses it. Each domain's `storageEstimate` (clips × seconds × fps
× bytes per frame) is checked against the members-only store; test 40 prints it. Air and water get a blind or fouled
clip quota (`replayRule`, `firstWeek`). `replayRule` names the clip codec (lossless or fixed decoder), bytes per frame and decoder
version, so browser and Python frame hashes match (R2 golden).
*Test (browser + Python runner):* a pinned 60 s clip gives ≤ 40 pictures, no near-copies, the same picks in both; an underwater clip scored
with air intrinsics is refused; 392 frames from 3 clips are "not ready"; a 1 cm wire at 40 m on a 640 px, 70° camera is refused; a 10 fps
clip is refused for the air replay set; one unblurred frame in a
20 fps clip refuses the clip.

**R3 · Annotate.** Four edge grips (left/right move sideways only, top/bottom up and down only) placed **outside** the box so a finger
never covers the line; thin high-contrast line; magnifier while dragging; one-pixel nudges. Boxes kept in picture pixels. SAVE BOX writes
to the device only. `lib/sensor-fusion/voc.ts` already ships (`vocXml(page)`, `readVoc`, `VocPage`) but nothing imports it, and `sensor-fusion.tsx` keeps its own
`vocXml`, `writeXml` and `readVoc`. **Make the page import `voc.ts` and delete the three inline copies**, then extend `voc.ts`; never a
third reader. A picture may have zero, one or many boxes.
Label names come from `labelmap.txt` ("did you mean …?" for close spellings), file-name safe (letters, digits, `-`); two labels that make
the same file name (`ray fin`, `rayfin`) are refused at entry.
**Thin objects** (wire, cable, mooring line) get a second label shape: a polyline, stored in the same VOC XML as a `<polyline>` element
that `readVoc` reads. The merge (R9) turns it into a chain of short boxes (minimum box size in the capture spec) only for detectors that
need boxes. labelImg ignores the extra element.
*Tests:* first, a source check finds exactly one `readVoc`, one `vocXml` and one merge function across `app/` and `lib/`, and the page imports
`voc.ts` (it fails today); `readVoc(vocXml(x))` equals `x`; a polyline round-trips; a diagonal wire polyline never becomes one box over 50%
of the frame; labelImg opens the file; a saved box equals the on-screen box within 1 pixel; five SAVE BOX = 0 downloads.

**R4a · Close the tables — SHIPPED** (`0c25475`, `supabase/migrations/042_sensor_fusion_members_only.sql`). Guest policies of 040 and 041
are dropped and only signed-in project members read or add. Do not rebuild it. Its test runs in `test:ci` as `test:sf-r4a` and in `prebuild`.
*Only gap:* the test should parse 042's SQL (no `anon` in any policy, every policy names `sensor_fusion_is_member`) if it still checks a self-model.

**R4b and R4c (server track: group roles, live invite codes, seating, review sign-off columns, old rows)** wait on decision 1.
They live in `WAITING.md` beside this plan, unchanged; the citations test scans it as part of the plan.

**R5 · Names that never collide.** `<label>_<NNNN>.png` + `.xml`, 4 digits, 5+ past 9999. Alone: highest used + 1, never reused.
Group: temporary names while collecting; at **Close upload**, members in join order, each member's pictures in capture order, one unbroken
block each (`bird_0001`–`bird_1111`, then `bird_1112`–`bird_2222`).
A late member gets the next block; a leaver keeps theirs. Old `bird.0001` names are read and renamed once; the XML records every rename. Reopening after Close is the operator's decision.
*Test:* 2 × 1,111 pictures number as above; 10,000 pictures reach `bird_10000`; an old dot-name set migrates with no gap.

**R6 · Level 1 and Level 2.** Each box carries `level`, `labeled_by`, `labeled_at`; after review `reviewed_by`, `reviewed_at`, `review`
(accepted · fixed · rejected) and a short note back. The reviewer is never the labeler. **Local Level 2:** two members share one device,
each signed in with their own id, so Level 2 runs without decision 1. **Re-check against poisoning:** a second reviewer re-checks a random
5% of accepted boxes; a set above the spec's disagreement rate is blocked from train.json. A queue holds a picture for one person for 10
minutes. A set check flags near-duplicate names and boxes. Only accepted or fixed boxes train.
**Start from today's button.** The shipped `markLevel2` (~:454) promotes for whoever holds the phone. Extend it: the XML records
`labeled_by`, `reviewed_by` and the verdict, and equal ids are refused ("Someone else must review your boxes"). Until then `mergeTraining`
writes `"reviewed": "local-unreviewed"`, which the card schema refuses. **Small regions** borrow a reviewer, re-checker or signer seat from
another region through the R4c invite.
*Test:* a reviewer never sees their own box, also on a shared device; one id never writes level 2 on its own box; a level 2 box with no
`reviewed_by` is refused by the merge; today's training.json is refused by the card schema; a held picture frees after the timeout; a set
above the disagreement rate cannot be merged.

**R7 · Save set and upload.** `Pictures/<Set>/` (folder on a desktop, one zip on a phone) with every png+xml pair, `labelmap.txt` and a
manifest (schema version, model id + labelmap hash, member roster in join order, the rename log, and per file: sha256, label count, level,
member id, and a consent id for any school picture). The XML carries the same schema version. Warn before the phone's storage is full.
**Upload destination is the operator's decision.**
*Tests:* Save set makes one file; manifest hashes match; the manifest's extension is `.png`; a failed upload never says "uploaded"; no
screen names a database, error code or vendor.

**R8 · Contribution time, shown with the Vision-2525 tokenomics cards.**
- *Clock:* reuse `frontend/lib/pod-clock.ts` (`measure()`, `witnessedMinutes()`, `hhmmss()`), as `app/soi-session/page.tsx` and the
  Drone-2525 SI panel do. No second clock. Every working stretch counts (capture, Level 1, Level 2, merges, set checks). **Clocked, not
  claimed:** the platform records start and stop (member id, project, element, device); recorded time is never altered; a claim never
  exceeds witnessed time; idle closes a stretch. UTC stored, local time shown, `YYYY.MM.DD_HH.MM..SS`; order follows the clock's `seq`.
- *The visual (operator, 2026.10.03):* the three `/vision-2525/` cards — ♡ SI, 웃 HI, ◬ AI — with glyph disc, accent, purpose and law
  (`1 minute given = 1 ♡` · `1 웃 = 1 hour at 1× local min wage · earned = M × hours` · `◬ = witnessed acceleration · 1 min SI = 5 ◬
  illustrative, variable to ~10×`). **Method:** lift the markup at `app/vision-2525/page.tsx:176-192` (`TRINITY_ACCENT`, `:33`) into one
  shared `components/soi-trinity-cards.tsx`, used by both pages, never a copy. Value lines: ♡ minutes live; ◬ only as the illustrative
  multiple; 웃 "paid projects only" until the operator marks a project paid. Text reads through `soi.coin.*` (`lib/lexicon-data.ts:1306-1315`);
  Vision-2525 prints `c.name` raw today, so the shared component fixes that too (as `components/soi-section.tsx:38` does). Cards stack at 390 px.
- *Where:* the project page (team total, by element), each member's row, each model version. Paid projects → 웃 from the date marked
  paid, platform-clocked only (operator's decision). ♡ is never spent or traded (D12).
*Tests:* ten minutes of Level 1 make one stretch with all fields; idle is not counted; an over-claim is refused; team ♡ equals the sum of
members, the same in two time zones; both pages import one card component; no card string skips `t()`.

**R9 · XML while editing, one JSON after Level 2 (operator, 2026.10.03_17.48..49 CST).**
> Operator, verbatim: "default to xml for individual editing and we can merge to json after level 2 completed for model training"
- **XML is the source of truth.** One Pascal VOC `.xml` beside each `.png`, edited through Level 1 and Level 2 (R3, R6). Nobody edits the JSON.
- **Merge only when Level 2 is complete.** A **Merge for training** button appears once every picture has finished Level 2; until then it
  says how many wait. **Extend the shipped `mergeTraining`** (~:471; it already refuses while any box is short of Level 2) and move it into
  the shipped `lib/sensor-fusion/voc.ts` as one pure function that reads every XML through `readVoc` and writes one `<Set>.train.json`:
  images (file, width, height, sha256); categories in `labelmap.txt` order; only accepted or fixed boxes (rejected and Level-1-only counts
  printed); schema version, model id, labelmap hash and a hash over all the XMLs; a class-balance report per class and condition (under
  the box floor, proposed 300, the set is "not ready for loop X"). COCO layout recommended (decision 6).
- **Regenerated, never patched.** An edit goes back to the XML, a new review, a fresh merge. A JSON whose XML hash no longer matches is out of date.
- **Three splits, fixed before merging,** by clip or session, never by frame; the manifest (R7) records the split by sha256, and the merge
  refuses a held-out or replay hash. **Held-out size, by power:** the card reports the one-sided 95% exact (Clopper-Pearson) lower bound;
  n is the smallest count where **every n' ≥ n** clears the floor at the assumed true recall with power ≥ 0.8 (decimal proofs as comments
  in the capture spec). Proposed: 392 for 0.97 at a true 0.99; 142 for 0.90 at 0.96; 68 for 0.85 at 0.95; 124 for 0.95 at 0.99 (dock
  marker). **One rule for sizing and scoring:** boxes in one clip are not independent, so each quota is multiplied by the clip design
  effect 1 + (m − 1)ρ, with m boxes per clip and ρ a stated prior in the capture spec. At m = 13 and ρ = 0.05 (×1.6) the quotas
  are 628, 228, 109 and 199, scored with the same clip-cluster bound. Every class a loop or camera names has a floor, an assumed true recall and its quota in the capture spec; the schema refuses
  a class missing any of the three. A bound under its floor is "not ready". **Nuisance stops come from false confirmed tracks per clear
  minute, not precision** (Part C events rule): the cap is in the Part C values table, scored on **whole clear replay clips**, never R2's picks. The card also reports
  recall per class per condition, bearing error and the longest run of missed frames.
  **Blur parity:** person and swimmer recall is measured unblurred with consent or with the runtime's blur; the card says which, and they
  must agree for loop-ready. **One label source:** the `labelmap.txt` bytes (UTF-8, LF) are what every hash covers; `models.json` labels
  equal them; both adapters map name → index through that file only.
- **Training hand-off.** A pinned recipe, `public/sensor-fusion/recipes/recipe.json` (not `train/`, which holds UI icons): base model,
  input size **per HAL tier**, epochs, seed, quantization to `detect.tflite` and `edgetpu.tflite`, the base model's sha256 and the training
  environment digest. Any region runs it; the card records the recipe hash and both digests, and signing refuses base weights that differ.
  Per tier, the card records the minimum pixel extent and minimum detection range its input size implies; the capture spec takes its
  pixel-extent refusal from the smallest tier a loop allows. A pi-tier card whose range falls under a row's minimum detection range is
  refused for that row.
  Out: `<Set>.train.json` + labelmap hash. Back: the three files + a **model card**, a `card` object on the entry in `models.json` v2
  (schema-checked), never a fourth file. It holds: train.json hash; sha256 of the three files; per-class precision, recall and thresholds
  on held-out; `unknown` rate; domain; sensor (rgb, thermal; sonar and depth declared); `tierMs.{pi,edge,accel}` (device, file, runtime
  format from a versioned registry in the spec file (`tflite`, also read as `litert`; `edgetpu`; `onnx` declared but refused
  until decision 16) — input size, p50, p95, p99, longest delay, a soak of
  at least 10 minutes under load); `clearedLoops[]`, `clearedPlaces[]`; per-class bearing error; **`burstLen`** (per class per condition, two-state model) and
  **`falseTracksPerClearMin`** (with the clear minutes and distinct clips behind it). Gate 2 and the provisional card read only these two. A named member who did not review signs it (decision 7).
- **First labelmap per loop (R9.5):** `drone-avoid-01`, `manta-hold-01`, `mass-nav-01`, seeded from shipped classes (bird, boat, person,
  car); new classes (wire, hull, buoy, step) start at zero. **Save set (R7)** carries the XMLs always, the JSON only when current. Page and
  Python merge the same way.
*Tests (plain Node):* a merge is refused while any picture is short of Level 2 or a box lacks sign-off; the same XMLs give byte-identical
JSON; box counts equal accepted plus fixed; one XML edit marks the JSON out of date; no held-out or replay hash is in train.json and no
clip spans two splits; every v2 card has all fields, including recipe hash and soak; 0.97 recall on 50, 98 of 100 at 0.97 and 58 of 60
at 0.90 are "not ready"; the quota golden table pins both sets, iid 392, 142, 68 and 124 and inflated 628, 228, 109 and 199, flags 391, 141 and 67 as
not monotone-safe, and refuses a table that prints iid quotas with no note; the clip floor is ceil(quota ÷ m) (49 clips for 628 at m = 13); browser and
Python compute the same labelmap hash.

**R10 · Light Codex as each picture's metadata (operator, 2026.10.03_17.51..01 CST).**
> Operator, verbatim: "within organizing workloads ; feel free to use LightCodex on image for level 1 and level 2 annotations; while also
> specifying time annotated on image, who captured or uploaded image, and who level 1 and level 2 approved with time stamps ( think light
> codex as metadata)."
- **Reuse:** `frontend/lib/light-codex.ts` — `placeSignature` writes, `decodeImage` reads, `unsupportedChars` refuses before writing.
- **One line per picture** (member ids, UTC stamps): `<file stem> · CAP <id> <stamp> <sensor|device|video> · L1 <id> <stamp> · L2 <id>
  <stamp> <accepted|fixed|rejected> · X <first 8 of the XML sha256>`. Each step writes a new codex and never edits the old one; the XML
  hash ties it to its XML, and a mismatch reads as out of date.
- **Never on the training picture, never on a JPEG.** A stripe would teach the model its colours, and JPEG breaks Light Codex (T14). The
  codex is a PNG strip beside the picture, `<label>_<NNNN>.codex.png`, in the set (R7); only its hash enters the training JSON (R9).
- The R6 queues read the strips to show each picture's state, who and when; stamps match the pod clock (R8). **The XML wins** a disagreement.
*Tests:* a PNG strip reads back exactly (16 of 16); through JPEG it never reads verified; an unsupported character is refused; L1 and L2
appear only after sign-off, by different ids; a stale XML hash is flagged; training pixels are unchanged.

## Tests file and runners
The test files, runners and the Python CI job are listed in `TESTS.md` (moved in 0.17).

## Operator decisions — one list for the whole plan (asked, not assumed; recommended default in brackets)
1. Where group projects, roles, queues and time records are stored — the server track waits on it. [Supabase, behind R4a policies]
2. Where Upload sends sets. [the same project store]
3. Teacher role and consent rules for minors. [teacher on; minors only with recorded guardian consent; faces blurred]
4. What reopening a project after Close does. [new block numbers after the last; old blocks untouched]
5. When a project counts as paid (the 웃 switch). [only when the operator marks it]
6. The training JSON's layout. [COCO]
7. Where training runs and who may sign a model card. [any region's machine, running the pinned recipe whose hash the card records; a named
member who did not review; the operator signs the gate]
8. Which loop gets the first model. [Drone-2525 collision avoidance in the civic simulation]
9. The compute tier, max detection age and per-class floors per loop. [the Part C table's proposed values: tier, age column, recall-floor column]
10. DETECT: band, HDMI side channel, or both. [band first]
11. DETECT: which video links count. [HDMI only]
12. DETECT: code per person or per pair of boxes, and how a lost code is replaced. [per pair; re-pair to replace]
13. DETECT: protected content (HDCP). [unprotected sources only, unless licensed]
14. Who builds the fuller water and ground worlds, and when; whether `ark-sail-33` joins Manta. [the loop integrator of each region owns its
    minimal world in `replay.ts` now (C4); fuller worlds after the first air box is loop-ready; `ark-sail-33` later]
15. Retention periods. [field events 90 days; clips showing people 30 days unless consent is recorded; the replay test checks these numbers]
16. Whether a future accel tier may declare a fourth runtime file, or must stay Coral. [stay Coral; today the three-file rule would refuse it silently, so the refusal is stated]
17. The eXeL AI robot's vehicle id. [add `exel-robot` to `VEHICLES` with a `CONTROLS_SCHEMA` minor note; simulation-loop-ready until a vehicle model exists]
18. School retention. [clips showing minors 7 days; none leaves the site unless consent is recorded; the replay test checks the number]
19. How risk alerts reach staff. [(b) local only: the camera computer and staff devices paired through the shipped ECDH pairing, no server; (a) a server `alert` kind in
`notify-core.js` later, a link only, never a picture]
20. Whether fall and crowd hazards run on cameras that see minors. [off until decided; place and time only, never who]
21. Whether MASS-AI gains Addendum 1's goal and risk purposes. The operator asked for "targeting, obstacle avoidance, risk identification,
    etc for eXeL AI robot and Mass-AI robot". [MASS-AI takes the goal layer in the same build as `exel-nav-01`, behind the same arbiter and
    safety-first rule, with the eXeL AI robot's goal classes and 1° bearing ceiling; alternative he may choose: safety-only until
    `exel-nav-01` passes] The citations test checks every `ASK.md` addendum vehicle has a goal-purpose path.
22. Grid geometry (free space or occupancy) in the record's geometry registry. [refused until a ground region asks, after `drone-avoid-01`;
    owner: ground integrator]
23. Robot-to-robot corridor pairing. [later; until defined every shared area counts as occupied; owner: ground integrator] The citations
    test checks that every "decision N" a row cites has text on that topic here.
24. Where an adult contributor's consent record lives across borders. [in the contributing region's project store behind the R4a
    policies; only the salted hash travels in `kit.json`, and that region's rules govern; test 34 golden: a kit with an unhashed consent
    id is refused]
25. Manta crew status. `pod-projects.ts:91` budgets life support for 5 people, so "unmanned" is not assumed. [the first loop row is the
    Mini run uncrewed in simulation with a remote operator; a crewed row adds an on-board crew role, and "cut thrust" first sounds a crew
    alert] Test 29 refuses a loop row whose crew status contradicts the pod-projects tasks. The remote operator's takeover drill gets a
    crewed variant (crew alert before cut thrust), recorded as its own field-event kind.

## Out of scope
Any change to existing model files or label files. Training itself is in scope only as the first-trained-card ladder rung (the model
builder runs the pinned recipe on an R9 merge).

---

# Part C — Detections into control loops (Drone-2525 · Manta-2525 · MASS-AI)

> **Scope boundary (hard).** A detection steers, slows, holds or stops a vehicle — for navigation, collision avoidance, station keeping,
> inspection, wildlife, search and rescue, and the Drone-2525 civic simulation. It never marks, approves or fires anything. The
> Drone-2525 two-step named-human gate (TARGET amber → APPROVE red → FIRE, simulation only; amber → red two-step at
> `lib/drone-2525/challenge.ts:17`, CH5 two-person rule at `:103`, slot-box rule r.149 at `lib/drone-2525/domain.gen.ts:306`) is
> untouched. Real-world weapon targeting and detecting people for engagement are out of scope.

**Targeting here means goal targeting:** picking a place or object to drive to, follow or dock with. It never means aiming at a person.

**Loops take detections from the on-board model today** (`cnn.js`, `sensor_fusion_edge.py`)
**and from the DETECT band later**, on the local track, with no server.

**Order:** the citations test, C1, C2, then the per-region ladder (C4b and the air ladder below). R4a is **SHIPPED** (042,
`0c25475`, `test:sf-r4a`). The eXeL AI robot box (`exel-nav-01`, after C1 and decision 17) and the camera place (`edtech-hazard-01`,
policy now, capture after consent) follow their finish lines in Addendum 1. Build order: C1, C2, C3, C4, C4b, C5, C5b, C5a, C6 (citations test).

**Build steps (local track; each: done line, test, then wait for LIVE).**
- **C1 · Contract + spec.** `detect-contract.ts` and the spec file, pure, with `loop-spec.schema.json` in the same commit: numeric
  fields with units (`budgetMs`, `fps`, `p99Ms`, `maxAgeMs`, `actuationMs`, `dwellMs`, C, k, recall floors per class); prose moves to a
  `note` field no runtime reads. *Done:* golden vectors load the same schema-checked file and pass in Node and Python.
  **C1 bench** (owner: contract owner): `cnn.js` and the edge script, capture to output, on one pi and one edge device, over a pinned frame
  set of at least 299 frames per tier (the p99 event minimum), written to `public/sensor-fusion/bench/c1-bench.json`.
  Decision 9 values stay "proposed" until that file exists; the citations test will check it.
- **One on-vehicle loop host.** `public/sensor-fusion/edge/loop_runner.py` (pi and edge tiers, C2 and C6) reads the spec file and
  `actuators.json`, takes Detection records from the edge script, and runs a Python port of the arbiter and tracker. It passes the same golden
  vectors as `loop-actions.ts`: a pinned record stream gives identical command sequences in both (test 12). `test:sensor-fusion-py` is the
  CI job only; `loop_runner.py` is the process on the vehicle. `download/` carries a byte-identical copy.
- **C2 · Adapters.** `fromCnnHits` and the Python edge adapter. *Done:* the adapters agree on pinned raw output tensors (boxes, classes,
  scores, count saved as JSON from one real run), so CI needs no TFLite runtime. Real-inference parity is a manual check recorded on the card.
- **C3 · Gate 1, open-loop replay per domain.** Reads only rows that 042's member policies allow. *Done:* per-class P/R and p99 scored for
  air, water and ground. Air, water and ground run
  in parallel — one regional team each; "one revision at a time" binds only the live site.
- **C4 · Gate 2, closed loop.** Obstacle layer, detection emulator, `loop-actions.ts`, water and ground worlds. *Done:* the first loop-ready
  box below is met in simulation.
- **C4b · Vehicle model per region.** A parameter file and kinematic model for `manta-mini-66-33` and `mass-droid` (later `exel-robot`),
  owned by the region's loop integrator. *Done:* the vehicle is in `VEHICLE_MODELS` (vehicle id → parameter-file path), a data export of `lib/2525-core/controls.ts` with a
  `CONTROLS_SCHEMA` minor bump; the registry, this line and test 31 read that set, never a comment. This is the only path from simulation-loop-ready to
  loop-ready. **Dated ladders** (decision 14 default; owner: each region's loop integrator) live in one place, `loop-spec.draft.json`
  `ladders.air`, `ladders.water` and `ladders.ground`; test 31 reads only that key. Week 1 starts on the date `test:sf-plan-cites` first
  passes in `test:ci`. Test 31 compares each rung with today's date and reports "late", never "failed". Water (`manta-mini-66-33`) and
  ground (`mass-droid`) run in parallel; `exel-robot` follows decision 17.
- **C5 · Signed release + rollback.** *Done:* a live loop refuses any model without a signed, hash-matched card.
- **C5b · Shadow.** A new signed card runs beside the live card on the same frames, writes disagreements as field events and never
  actuates. Promote it only after the shadow minutes in the spec file with zero safety-relevant disagreement. *Test:* no shadow output
  reaches `loop-actions.ts` (source check); its disagreements land in `field-events.jsonl`.
- **C5a · SITL (software in the loop).** `loop_runner.py` drives ArduPilot SITL (Copter, Rover, Boat) and PX4 SITL with emulator records
  over the signed MAVLink link. It exercises every `actuators.json` row and action id, the link-loss failsafe read and the arm-time
  snapshot. *Done:* each family's Gate 2 strata pass in SITL, written to `public/sensor-fusion/bench/c5a-sitl.json`. *Test:* a
  `sensor-fusion-loop-replay.test.mjs` case where an unmapped action id or an off failsafe refuses arm. C6 refuses to start without it.
  The minimal `replay.ts` worlds stay the CI gate; a Gazebo Harmonic world (paired with Jazzy) is the fuller option under decision 14,
  and one golden Gate 2 run must agree between the two. **Ground leg:** a ROS 2 Jazzy + Nav2 SITL run in Gazebo Harmonic for
  `mass-droid` and `exel-robot` covers `NavigateToPose`, its cancel on a safety stop, the Nav2 speed limit for "slow" and the SROS2
  refusal, written under a `ros2` key in `c5a-sitl.json`; C6 for ground refuses without it. **Field back to SITL:** every field-event
  hard case with a recorded pose is replayed through SITL as a regression case before the next C6, so a field failure comes back sim-first.
  **Poses are sensitive:** `contract.json` marks field-event poses and positions sensitive, like geofences. A hard case is converted to
  vehicle-relative coordinates before it enters any kit or SITL case that leaves the members-only store; the citations test refuses
  latitude, longitude or GNSS fields in field events or kits under `public/sensor-fusion/`.
- **C6 · Bench, then fenced field.** First a hardware-in-the-loop bench: recorded frames feed the real edge script, and the actuator-table
  output is read, not flown. **Sim-to-real check:** the same recorded frames run through the Gate 2 emulator and the real edge script;
  both miss-burst lengths and false-track rates go to `public/sensor-fusion/bench/c6-bench.json`. A bench burst longer than the card's
  lapses Gate 2 to controller-proven. Then a geofenced trial with a named safety pilot and the independent minimum active. *Done:* the C6 record
  carries the signed gate hash and the safety pilot's salted member id. Until a vehicle model exists, Manta and MASS-AI stop at C5.
  **Takeover drill:** before arming (Gate 2 and C6), the named human (pilot, Manta remote operator or robot team) performs the takeovers and re-arms set in
  the spec file in simulation, each written as a field event. Their measured reaction time is its own term in the actuator table,
  never inside B. C6 refuses without the drill records.
- Each C step ships as its own Sensor Fusion ledger revision (`app/SensorFusion-2525/ledger.ts`; it is at rev 33, `:234`, so C steps take rev 34 or later).

## One loop contract, shared — never three copies
- **`lib/2525-core/detect-contract.ts`** (pure, new), registered in `lib/2525-core/MANIFEST.md`. Drone-2525 is the first consumer;
  Manta-2525, MASS-AI, the eXeL AI robot and the camera place are declared consumers.
- **Input: Detection record v1**, versioned like `CONTROLS_SCHEMA` (`controls.ts:17`). Required: label index (from `labelmap.txt`), box
  x, y, w, h as 0–9999, confidence 0–9999, capture time (ms), clock domain id (device id plus boot id), frame number, model id, labelmap
  hash, sensor id, camera id, calibration version, medium (air, water-surface, underwater) and runtime file. Optional: range (m), track id.
  Zero objects = a **heartbeat**. Part B carries the same record. Minor versions only add optional fields, which readers ignore; an unknown major gives the safe
  action. **v1.1** adds an optional geometry kind, `frame-box` or `polar` (range and bearing), for sonar and depth. **Two cameras:** records
  merge by camera id within one clock domain, and the most careful action wins. Golden vectors cover polar and disagreeing cameras.
  **v1.2** adds a **pose** block: roll, pitch, yaw, gimbal angles and an IMU sample stamped in the capture's clock domain. Box to path uses
  the pose nearest the capture stamp and refuses one older than m. Golden vector: a 20° bank with a level-camera box gives the world bearing.
  Capture (R2) logs pose and a per-medium calibration clip, so the bearing and dock ceilings can be met.
  **Pose source.** `loop_runner.py` reads MAVLink `ATTITUDE` (or ROS 2 `/imu`) from the autopilot link it already holds. It maps the flight
  controller's boot clock through the clock-offset handshake (MAVLink `TIMESYNC` is one method) and joins pose to records by capture stamp.
  A browser `cnn.js` record has no IMU, so it stays replay-ready only.
  **v1.3** adds a **frame-health** block: Laplacian sharpness, mean luma and occluded fraction. Floors per medium live in the spec file,
  reusing the R2 Laplacian floor in the capture spec. A heartbeat below a floor means **blind**, never clear (mud, spray, a hand, night).
  R2 tags fouled clips into a Gate 1 "blind" bin, so the floors are set from captured frames. Floors are keyed by **sensor and medium**
  (rgb, thermal, IR night). Occluded fraction is computed per tile on a 3 × 3 grid; one blind tile in the swept corridor counts as blind.
  **Bridges** (in `detect-contract.ts`, versioned, with golden round-trips): record → ROS 2 `vision_msgs/Detection2DArray`, and → MAVLink
  `OBSTACLE_DISTANCE` (or `_3D`), so a partner's autopilot avoidance becomes one more independent layer without a fork. **Bridge rules:** a bridge
  starts only on an authenticated link (MAVLink 2 signing, SROS2-secured topic) or refuses; it sends obstacle data only, never a command
  message; person and swimmer leave as a generic obstacle with range and bearing, with no class name, track history or picture reference.
  Each partner is cleared for avoidance only. Clearances are marked sensitive in `contract.json` and kept in the members-only store behind the R4a policies, so no
  partner name is published; any use toward engagement is out of scope and not designed.
  Tests 7 and 12 extend: an unsigned link, a command-message type or a class name on the bridge is refused. The link-auth column of
  `actuators.json` lives in the on-vehicle copy, not the public file. Geometry kinds
  are a versioned registry: `frame-box`, `polar`, and `grid` (free space or occupancy) declared but refused until decision 22.
- **Spec version handshake.** Each region's spec file and `contract.json` carry a schema major, minor and content hash (the `kit.json`
  inputs). An unknown major gives the safe action; unknown minor fields are ignored. Golden: a v2 spec read by a v1 runner gives the safe action. The retired per-section hash wording is refused.
- **One tracker.** `lib/2525-core/track.ts` (pure, new): IoU association and a constant-velocity filter, K-of-N confirm, drop after H. It is
  the only source of track id and velocity for follow, the swept corridor and A_track; `loop_runner.py` ports it. Node and Python golden
  vectors pin track ids over a 40-frame clip.
- **Range fusion.** The independent rangefinder or depth wins over class known size. A disagreement over the ratio in the spec file
  gives slow and a field event; a 2× disagreement never returns continue.
- **Capture time:** monotonic ms from the capturing device, stamped at grab, never after inference. **Python:** a grab thread keeps only the
  newest frame (or a buffer of 1), stamped at `grab()` (`camera.read`, `sensor_fusion_edge.py:235`). **Browser:** `requestVideoFrameCallback`
  `captureTime`, then `presentationTime`; with neither, the device is replay-ready only. The record names its stamp source. **Replay** uses
  the clip's recorded domain and checks it is monotonic. A live loop refuses a foreign domain unless a **clock-offset handshake** (stamped
  pings, methods in `detect-contract.ts`) gives a fresh offset whose bound fits inside m; that is how DETECT or a separate camera computer
  feeds a loop. No capture time, a future stamp or a foreign domain gives the safe action.
- **Adapters:** `fromCnnHits` turns `cnn.js` hits (`cnn.js:105-113`) into the record; the Python edge script gets the same adapter. Both
  clamp boxes to 0–1 before scaling. An out-of-range or unnamed class id becomes `unknown`, never dropped. **C2 prerequisite:** `37df2c1`
  made `cnn.js:106-107` skip such boxes while Python keeps the placeholder name (`sensor_fusion_edge.py:178`). `fromCnnHits` reads the raw hits before any
  display filter; the display may still hide them. `decodeDetections` is the third producer later.
- **Which file runs where — from the signed card, never the switch.** Reuse `modelFile` / `runPlan` (`sf.ts`) and `model_file` /
  `interpreter_for` (`sensor_fusion_edge.py`); no second mapping. **C2 changes their signature:** today `modelFile(coral: boolean)`
  (`sf.ts:57`) and `model_file(folder, coral)` (`:96`) take a switch; they take the card's tier entry (tier → file) and keep the boolean
  only as a shim for the unarmed demo. Test 10: an armed call with the coral switch flipped returns the card's file. A loop takes its tier and file from the card's `tierMs` entry. While a
  loop is armed, the `sf2525-coral` switch, the model picker and the self-update are refused. A file that differs from the card's, or an
  interpreter that fails to load, gives the safe action and a field event, never the other file.
- **Box to path:** bearing from the box centre and the intrinsics; range from the independent sensor or the class's known size. "In the
  path" = bearing inside the swept corridor and range under the stopping distance. **Wing mode cannot stop:** there it means inside the
  turn-radius arc; the loiter circle is checked clear first, or the Drone climbs to the geofence ceiling. Stopping distance and turn radius
  come from a vehicle parameter file per vehicle in `lib/2525-core` (in `MANIFEST.md`, read by `replay.ts`). **Minimum detection range**
  has one definition, in the speed envelope below (worst-case A_track plus clearance); Gate 1 scores recall in that range bin. A
  one-frame box with no track gives only "slow". The citations test refuses a term defined by two formulas.
- **One shared spec, two runtimes:** the spec file (`public/sensor-fusion/loop-spec/<region>.json` plus `contract.json`) holds actions, failure rows, budgets, ages, floors, thresholds,
  class lists, places and the schools policy. TypeScript and Python both read it; golden vectors run in both. Ids are domain-neutral.
- **Output:** an **action** from the vehicle's own set, an **alert** (`ALERTS.md`), or a **report**, plus the reason for `?diag=1`. Air: continue,
  slow, hover, land, return. Water (surface): continue, slow, hold station, cut thrust (anchor where fitted). Ground safety layer: continue, slow, stop (brake held).
  A **report** carries the class, position, picture reference and a named human recipient, and drives nothing: search-and-rescue sightings
  (never a person's identity), wildlife sightings and inspection findings. A purpose with no class list and floors is marked "later" in
  its loop row. Test 40 checks every purpose has an output kind. **Report values** (spec file, beside the camera table): class,
  precision floor, time to report p95 (59 events), recipient role and channel. Reports use the paired alert channel, with the report kind
  in the channel interface in `detect-contract.ts`. The recipient sees a staff line ("Report: wildlife near pier 3"), Acknowledge and
  escalation, each a field event.
- **Per-class thresholds** come from the card and replace the fixed `score > 0.5` (`cnn.js:104`, `sensor_fusion_edge.py:176`).
- **Hold and recovery:** tightening is instant. Relaxing needs the dwell and C verified clear heartbeats (both per row, required by the
  schema), so a 10 fps flicker never alternates faster than the dwell.
- **Takeover — one arbiter.** A pure function in `loop-actions.ts` takes the human axes as a core `HumanAxes` type (fwd, lat, climb, yaw, plus family fields), the loop action and
  the armed state, and returns one `VehicleCommand` plus a "human has control" flag. `VehicleCommand` is a union keyed by vehicle family:
  air carries `FlightInput` (`flight.ts:87`); ground carries speed, turn rate and brake; water carries surge, sway and hold. Each family has
  its own kinematic step and its own `actuators.json` rows; no non-air vehicle ever gets a `FlightInput`. The family types live in
  `lib/2525-core` (a `FlightAxes` type that `FlightInput` satisfies), so no core file imports `@/lib/drone-2525` (source check). `StickAxes` and `axesFromHeld` live in
  `lib/drone-2525/use-controls.ts:25`, `:29`, so `round.tsx` converts to `HumanAxes` before it calls the arbiter; test 15 also refuses a core
  import of `use-controls.ts`.
  **Precedence — one table per family** in the spec file (first wins; this replaces earlier wording):

  | Family | Order |
  |---|---|
  | Air | human past the dead-band → safety layer → AI crew pilot (`round.tsx:464`, `crew.pilot`) or goal |
  | Ground | independent minimum (cliff sensor, bumper) → human → safety layer → AI crew pilot or goal |
  | Water (surface) | independent minimum (proximity hold, GNSS geofence; depth only on the later underwater row) → human → safety layer → AI crew pilot or goal |

  The AI pilot never overrides a human deflection or a safety slow. In the air the human has full authority; the status line reads
  "You have full control; the loop is only advising" and a field event is written. On ground and water a clamped stick shows
  "Stopped: drop-off ahead" (or the sensed hazard). **False cliff recovery (ground):** a press-and-hold creep override moves at creep
  speed, logs a field event and is refused while the downward range shows a real drop.
  Its dead-band is `DEFAULT_SETS.dead`
  (`lib/2525-core/stick-sets.ts:31`) within `SETS_LIMITS` (`:35`), never a second threshold. `components/drone-2525/round.tsx` (the one
  caller of `useControls`, `:465`) calls it every tick; a deflection past the dead-band wins that tick. Other vehicles get stick sets by
  vehicle id. The loop re-engages only on a human re-arm (two-tap or press-and-hold at 390 px), never by itself; each re-arm and takeover
  writes a field event with the salted member id.
- **Display:** boxes as strokes in the 13 Drone-2525 colours (`lib/drone-2525/arena-model.ts:2`); the action as one plain word; one status
  line at 390 px per state ("Loop is flying", "You have control", "Detector lost") and a re-arm control. Drone surfaces: `round.tsx` and
  `public/drone-2525/play.html`, which gets the arbiter as a built, hash-pinned bundle of `loop-actions.ts` and `detect-contract.ts`, never
  a hand copy. A contributor sees which of their pictures fed a loop-ready card, beside their ♡ minutes. **Bystander cue (ground and water):** on a
  person-triggered slow or stop the vehicle shows a steady light or tone, declared per row in `actuators.json`, never naming anyone (test
  29 golden: every person-avoid row has one). The action word never covers the
  reticle or slot boxes; display never writes slot, approval or fire state. New words stay English in `AFTER_FILL`.

## The loops (bound to the vehicle ids in `lib/2525-core/controls.ts:21`)
**Your vehicle in one line.** Drone-2525: the air team's drone slows, hovers or lands for wires, trees, people. Manta-2525: the water
team's surfaced Manta holds station near hulls, piers and swimmers. MASS-AI: the ground team's robot stops for obstacles and people. eXeL AI robot:
a second ground robot that also drives to, follows and docks with marked objects. EdTech camera: a school camera that only alerts named staff.
Test 29 checks that every class a card names has a camera pass result or names its covering sensor.
Each gets a loop card of at most 8 plain lines on the 390 px project page (English-only in `AFTER_FILL`). Drafts (sees · may do · when
unsure · takes over · never):
- **Drone-2525:** It looks for poles, trees, birds, people and vehicles; a rangefinder and mapped spans watch for wires. It may slow, hover, land or return. When unsure, it
  hovers. The pilot takes over with one stick move. It never marks, approves or fires anything.
- **Manta-2525:** It looks for hulls, piers, buoys, swimmers and marine animals. It may slow or hold station. When unsure, it holds
  station. If the current is too strong, it cuts thrust or anchors and calls the remote operator. Uncrewed in simulation; when crewed, a
  crew alert sounds before cut thrust. The remote operator takes over at any time. It never marks, approves or fires anything.
  (Test 29 refuses a card whose safe-action or crew words differ from its `loops.rows` cells.)
- **MASS-AI:** It looks for obstacles, steps, people and vehicles. It may slow or stop. When unsure, it stops with the brake held. The
  robot team takes over at any time. It never marks, approves or fires anything.
- **eXeL AI robot:** It drives to, follows or docks with a marked object a person picked, never a person. It may slow or stop. When
  unsure, it stops. The robot team takes over at any time. It never marks, approves or fires anything.
**Status word on every card** from `VEHICLE_MODELS` and `contract.json` ("in simulation only", "vehicle not built yet"); test 29
refuses a pending id's card without one.
**Non-air screen:** a 390 px loop panel, `components/sensor-fusion/loop-panel.tsx` (new), mounted on `app/SensorFusion-2525/` and
on the Manta row rendered by `app/soi-session/page.tsx:1008` (`DEFAULT_PROJECTS.map`, test 9), data from `lib/pod-projects.ts:86`.
It reads `round.tsx`'s Detection and command types (test 9) and shows each family's status words ("Robot is driving", "Boat is
holding", "You have control") and re-arm control.
**Platform map (data only):** `contract.json` maps vehicle id → `PlatformId` as strings (`lib/drone-2525/platform.ts:13`): `vtol-quadwing` →
D1, D1Q, D1F; `manta-mini-66-33` → M66; `manta-99-66` → M99; `mass-droid` → R2; T1 no-loop; `ark-sail-33` (ARK) "pending decision 14"; `turret` no-loop ("fire-gate surface, out
of scope"); `exel-robot` "pending decision 17", no `PlatformId` and no actuator rows. D1Q gets no wing rows; D1F (`prefersWing`, `:27`) is
refused below the wire ceiling outside mapped spans. **Manta medium:** M66 is kind `sub` in `domain.gen.ts`, so `contract.json` declares
`manta-mini-66-33` **surfaced-only** for the first loop (medium `water-surface`, GNSS station keeping); an underwater row (depth hold, no GNSS
station keeping) is later. The loop card, crew name and safe action follow the medium column. The water safe action is hold station, or cut thrust (anchor
where fitted) when position is lost; a row declared surfaced-only never names "surface" as an action (test 29 golden; it scans the output-kind list in PLAN.md as well as
`loops.rows`). Its first box is
`manta-hold-01` (station keeping); docking is not a water purpose until a dock class, goal layer and stratum exist. Test 29: every `VEHICLES` id has exactly one state (mapped, no-loop or pending N;
golden per id);
`turret` gets no `VehicleCommand`, `actuators.json` row, `clearedLoops` entry or bridge output; an `exel-robot` card is refused loop-ready until
`VEHICLES` has the id; a `PlatformId` kind and its loop medium agree (a `sub` runs a surface row only when declared surfaced); D1F golden.
Core imports nothing from `lib/drone-2525` (source check). **Refused pictures:** the
contributor's page gives one plain sentence per reason (no consent id, blur failed, class over quota, held-out clash, below the pixel
extent), then a second line saying what to do next ("ask the guardian for consent", "retake in better light", "pick another class",
"use another clip", "move closer"). An advisory class (unmapped wire) gets its own line instead: "This clip helps the wire warning, not the camera
model." Words in `AFTER_FILL`; test 40 has one golden per reason.

**The loop table** (vehicle, purposes, classes, latency budget, max age, HAL tier, recall floors, safe action, independent minimum,
world, human role) **lives in `loop-spec.draft.json`** (`loops.rows`); the three class lists are generated from it.

MASS-AI's goal layer waits on decision 21. **Covering sensor per class:** the spec file names, for every loop class, the independent
sensor that covers its misses; the schema refuses a class with none. Drone wire is covered by mapped spans in the geofence. Inside mapped
areas wire keeps its 0.90 floor; outside them the wire floor is 0.97. Ground step and drop-off are covered by the downward cliff
sensor; a forward rangefinder never counts for them. Gate 2 adds an unmapped-wire scenario with a burst miss. **Drone person:** a forward
rangefinder or a stand-off geofence is the covering sensor; with neither, the row is refused (test 40 golden), as the schema rule says. **Manta swimmer:** sonar or a proximity sensor, named per hull
in the spec file.
**Speed envelope (proposed, decision 9; held in each vehicle parameter file; test 40 refuses a row until it is filled).** Range =
v × B + stop + v × A_track + max(clearance, stand-off for the class). **A_track is the worst case**: (N + the card's `burstLen`) × P,
never K × P. Rows below use N = 5 and the provisional `burstLen` 2; the signed card's value replaces it. The Drone reuses the airframe
record: cruise is `"cruiseMs": 17` (`lib/drone-2525/domain.gen.ts:1307`; `flight.ts:19` is only the type field) and stall is
`stallSpeedMs(airframe)` (`flight.ts:38-39`), worked out from `domain.gen.ts:1302-1314` (14.38 m/s). Test 40 computes the stall speed, the 8 m stop and
the 51.0 m and 36.5 m turn radii from that record (`speedEnvelope`), never from literals. The stop deceleration (4 m/s²) and bank (30°)
are not in it yet, so `decelMs2` and `maxBankDeg` are added to the `docs/drone-2525` airframe source that generates `domain.gen.ts`;
until then those rows are refused as literals. No second Drone parameter file. The citations test refuses
any number in PLAN.md prose that the plan calls "computed" or "refused as a literal".

**The speed table lives in `loop-spec.draft.json` beside this plan** (`speedEnvelope`). Each row gains `coverReachM` per loop class:
the covering sensor's reach. Until the C6 bench measures it, each row carries the sensor's datasheet reach marked "provisional", so the
stand-off time, the drill cap and Gate 2 compute in simulation now. The bench rung in each ladder (p5 reach, at least 30 trials against
the class target, owner: region integrator) replaces it. Test 41 refuses a null anywhere, and a provisional reach only at the C6 arm.

**Pixel extents, at the model's input size** (from the card file, never the camera's 640 px). The rows live in `capture-spec.draft.json`
(`pixelExtent`), keyed by **class and loop row**: one per class in every `loops.rows` Classes cell and every `speedEnvelope` row that flies
it (so Drone quad bird has its own row). Each has `minBoxPx` (proposed: 2 px wide for wire and bird, 8 px box width otherwise), a result
per input size at `minBoxPx` × 1.1, and a **margin** (px ÷ (`minBoxPx` × 1.1)); a pass under 1.10 must state the field of view and range
tolerance it holds at. Known sizes are the class's small end (p5 of R2 size truth). Every loop whose place may see minors (Drone, MASS-AI,
eXeL robot) has a **child-width (0.3 m) person row**; a person floor scored only on adult rows is refused. The Drone child row is refused
at every size, so the rangefinder or stand-off geofence covers it, never the camera alone. Manta has a child-swimmer row (head 0.15 m,
8.4 px, refused; the hull sonar or proximity sensor covers it). Pole and tree are refused until a p5 or the forward rangefinder covers them.
Each row has `sizeTruth` ("nominal" or "p5 measured, n"); test 40 refuses "nominal" on a class a loop-ready card claims and stores margins
to 3 decimals (bird wing 0.995). At C1 rows are keyed by the card file's input width × height (`cnn.js:72-73` reads both), never square
columns. R2 enforces the row for the file on the loop's card. Test 40 recomputes
every px value and refuses a loop whose file is "refused" for a class with no covering sensor.

**Wire.** The camera never covers unmapped wire (refused at every size). Below the **wire ceiling** outside mapped spans, quad flight needs a
forward rangefinder, cleared only by its beam divergence and a measured 1 cm detection rate in `c6-bench.json`; until then its
`coverReachM` for wire is "unknown", never a datasheet figure, and the unmapped-wire row stays refused for Gate 2 arm and C6 (test 41).
Its reach covers the range plus the bearing error p95 (2°) and a gust term. **Wire ceiling, per region:** max(`"transitionMinAglM": 20`
(`domain.gen.ts:1313`; `canTransition`, `flight.ts:123`), the highest mapped wire + clearance), read by test 27 (golden: a 25 m span gives
28 m); R2 records wire height. **Position integrity:** the GNSS or EKF error bound (p95) is added to every mapped span and geofence; a bound
over the spec margin drops the row to the unmapped rule. **Wing mode** cannot slow below stall, so below the ceiling it flies quad; near
unmapped bird or traffic zones wing is refused unless a **wing speed cap** passes its bird row; its safe action loiters on a circle at
least the turn radius, checked clear (test 27). **Ground drop-off:** the forward-angled cliff sensor must reach v × B + stop, or speed is
capped to its reach (tests 27 and 40 golden: a 320 px card at 3 m/s unmapped with no rangefinder is refused).
**Goal-layer timing (ground robots).** A row gives control rate, tracker lag A_track, max follow speed and dock creep speed. The dock is
refused when creep speed × (p99 + P) ≥ 2 cm − m (equality refused, as in the timing law; m = 10% of the ceiling). eXeL creep is therefore
0.08 m/s: 0.08 × 0.2 s = 1.6 cm, under 1.8 cm. Golden in test 40: 0.09 m/s gives exactly 1.8 cm and is refused.
**Action setpoints (per family, in the spec file).** Each action word has numbers, so `loop-actions.ts` and `loop_runner.py` command the
same thing: **slow** = creep speed at the row's deceleration limit; **hover** = zero velocity, altitude held; **hold station** = position
hold inside a radius; **stop** = brake held. Each action also has a ramp limit. Golden vectors in test 12 pin the command sequence for each.
**Each setpoint reaches the autopilot.** A mode alone cannot carry "slow", so `actuators.json` gains a speed column per row:
MAVLink `MAV_CMD_DO_CHANGE_SPEED` (ArduPilot and PX4), or a guided or offboard velocity setpoint (`SET_POSITION_TARGET_LOCAL_NED`,
velocity fields) where the mode needs one; ROS 2 rows publish a Nav2 speed limit (`nav2_msgs/SpeedLimit` on the controller's
speed-limit topic) beside `NavigateToPose`. An action word with no message in its row is refused at arm (test 12 and test 31).
**Human stand-off time.** The stand-off time is (the covering sensor's measured reach − the
minimum detection range) ÷ v, generated per row, never typed. A reach equal to the minimum range gives 0 s and refuses the human as a
collision layer. **The arm rule follows the human's role, per family in the spec file (`humanRole`):** where the human is the
collision backup (ground and water at creep), a drill p95 over the stand-off time solves a lower speed cap from the drill, never a silent
arm; where the human is supervisory (Drone at cruise), the drill must finish its takeovers and re-arms, no time gates arm, and the
covering sensor must be present. The crew page prints the row's own value from the spec file ("This robot needs under <value> s"); a
supervisory Drone crew sees "Complete the takeover drill" (words in `AFTER_FILL`). Test 41 goldens: reach = range gives 0 s; a Drone pilot
at 1.4 s arms with a rangefinder and is refused without one; a ground drill over the stand-off time caps speed, computed from the
parameter file. **Drill speed cap:** the positive root v of reach = v(B + A_track + t_drill) + v²/2a + clearance, with `coverReachM` as
reach and the drill p95 as t_drill (test 41 golden for MASS-AI). **Drill size:** a p95 needs at least 59 timed takeovers per named
human (`humanRole.minTakeoversPerHuman`); fewer refuses arm. The drill spreads over sessions; the crew page shows "12 of 59 takeovers done". **Gate 2 compute** is strata
× 300 per vehicle (lists in `loop-spec.draft.json`, `gate2.strataByFamily`); test 40 checks each product.
Air and water gain a blind or fouled frame-health stratum; water gains stuck stick or operator link lag, since its human is the collision
backup. Ground splits into `groundSafety` (MASS-AI and `exel-robot`) and `groundGoal` (`exel-robot`; MASS-AI only after decision 21), so
no capture or replay effort goes to a goal the loop does not yet have. **Docking geometry:** lateral error = range × tan(bearing ceiling)
must not exceed the line-up; the eXeL robot's 2 cm at 1° lines up only inside 1.15 m (test 40 golden, computed, never typed).
The numbers are proposals for decision 9. They live in the spec file, not in code.

**Gate 2 and card values (proposed, decision 9).** Nuisance is scored on **events**, not frames: false confirmed
tracks per clear minute. Clear minutes needed = the smallest t where zero false tracks give a one-sided 95% Poisson bound (2.996 ÷ t)
under the cap: 2.996 ÷ 0.12 gives 25 minutes, 2.996 ÷ 0.06 gives 50. No ρ is needed. The minutes come from at least **30 distinct clear
clips** per loop; 3 clips are refused. A per-frame rate, if kept anywhere, takes ρ as a stated prior in the capture spec, never one
estimated from zero counts, and a clip bootstrap only once false positives exist. Golden rows sit in the capture spec; frames are
listed for capture planning only. **Percentile claims need events:** a p95 claim (time to alert, bearing error) needs at least 59 independent events all under the
ceiling (0.95^59 < 0.05); a p99 claim needs 299. **Precision floors** get a quota of predicted positives, sized like recall (one-sided 95%
Clopper-Pearson, power 0.8). **Re-size:** if pilot recall on the first 30 clips is under the assumed true value, the quota is recomputed
from the pilot estimate before capture continues (golden: assumed 0.96, measured 0.93 raises the 228 quota).
**The Gate 2 and card values table lives in `loop-spec.draft.json`** (`gate2.cardValues`).
Held-out quotas follow the R9 power rule. A row missing any value, or naming a class with no floor, is refused.

**EdTech camera values** (alerts only, no timing law; `cameraValues` in `loop-spec.draft.json`) are in `ALERTS.md`.
**One timing law, four numbers per loop**, in **ms since the capture stamp**, never frames: frame period P = 1000 ÷ fps; max age A, with
p99 + P ≤ A − m (margin m, proposed 10% of A, so a fresh box never clears on arrival); budget B ≥ A, leaving B − A for actuation;
heartbeat timeout H = kP + p50 (k proposed 3), so k missed frames always trip. A box older than A is cleared, never reused. A row is
refused when it breaks p99 + P ≤ A − m ≤ B (exact equality too), when its **slack** (A − m − p99 − P) is under 5 ms, or when its **stale
share** (boxes whose capture-to-output time plus frame phase exceeds A, from the card's soak histogram) is above 1%. Nothing approaches
inside a **stand-off**. A mode change the safe action needs (the Drone's 4 s `TRANSITION_S`, `flight.ts:69`) is its own term
in the actuator table, never hidden in B. Each floor applies to replay and held-out and needs the R9 box floor (300) per class.
`ark-sail-33` is decision 14. The safety layer is **advisory**: only more careful than the independent minimum, never less. `person` and
`swimmer` can only produce slow, hover, hold station or stop.

**First loop-ready deliverable (decision 8 default).** Drone-2525 collision avoidance in the civic simulation · `drone-avoid-01`, one named
version seeded from `tree` (`models.json:136`) · the Drone class list from the spec file · the pinned air replay set · Gate 1 (every
class's 95% lower bound at its floor, bearing under its ceiling, p99 after the soak within the edge row) and Gate 2 (its pass line in the
arena with the obstacle layer and burst-miss emulator) · signed card and gate · owner: loop integrator. This is the finish line the 19
rounds converge on. Manta-2525, MASS-AI and the eXeL AI robot get the same box (`manta-hold-01`, `mass-nav-01`, `exel-nav-01`) in their
minimal worlds, labelled **simulation-loop-ready** until their vehicle model exists. **Outcome line per loop:** each box ends
with one row a partner can read, generated only from a signed card plus `c6-bench.json` (until both exist it prints "proposed"): the
speed, range and small-end size (from its `pixelExtent` row, e.g. "person ≥0.3 m wide: rangefinder only") it was signed at and the
per-class recall; test 40 refuses a row whose size differs from the card, for
example "drone-avoid-01 · quad, mapped · 8 m/s · obstacle 15.0 m, person 22.0 m · wire 0.90, person 0.97".

**Your domain, your first week:** the table lives in `capture-spec.draft.json` (`firstWeek`, quotas with the clip design effect ×1.6, an
assumed prior until measured from the pilot 30 clips); each Day 1 names a role and a finish line. `usedBy` is per quota key: a loop id
plus an output kind (person → `drone-avoid-01` slow or hover; swimmer → `manta-hold-01` hold station; dock marker → `exel-nav-01` goal).
Test 40 refuses a `usedBy` that is not a `loops.rows` purpose. After the pilot 30 clips the design effect is re-measured and every
quota re-sized; until then test 40 prints "assumed" beside each quota. Unmapped wire feeds an advisory and the Gate 2 wire
stratum only, since the camera is refused for it at every tier. The camera held-out is one value per hazard. Water clips record
`medium` from an enum (`water-surface` only for now), so no underwater clip enters a surface quota. Each contributor's page shows which
classes they can help with today and that class's quota.

## Robots, goals, risks and cameras (Addendum 1)
> Operator, verbatim: "control looks of for targeting, obstacle avoidance, risk identification, etc for eXeL AI robot and Mass-AI robot
> (CNNs will be be able to be jointly developed for execution on EdTech security cameras, etc)."

- **One CNN, many places.** The `models.json` v2 card gains `clearedPlaces[]` beside `clearedLoops[]`: `robot:<vehicle id>`, `camera`,
  `computer`, each with its own status. The place list is versioned like the Detection record; a new kind is a minor addition, and an
  unknown place gets no action, alert only. A camera place has no actuator table. A card cleared only for a camera is refused by any loop.
- **The eXeL AI robot.** Decision 17 adds `exel-robot` to `VEHICLES` (`controls.ts:20`) with a `CONTROLS_SCHEMA` minor note; re-run
  `test:controls-schema` and `test:stick-sets`. It gets its own parameter file and stick set.
- **Two authority layers, one arbiter.** The **safety layer** (continue · slow · stop) stays advisory: only more careful. The **goal layer**
  (approach · follow · dock · line up) runs only while a named human has picked a goal target from the goal classes in the spec file.
  `person`, `swimmer` and deny-list classes can never be goals. The arbiter in `loop-actions.ts` runs the safety layer first on every tick,
  and its slow or stop always wins. Goal actions map to a ROS 2 navigation goal, simulation only until C6. Aiming at a person is out of scope.
- **Goals need position, not just a box.** The card carries per-class bearing error (p95, from the box centre and the intrinsics), range
  error where range truth exists, and dock line-up error (cm). A card over its ceiling (table above) is not ready, whatever its recall.
  The capture spec asks for range truth and tight boxes on goal classes.
- **Risk alerts, schools and cameras** moved verbatim to `ALERTS.md` (0.17). In one line each: an **alert** goes to one named role on a
  paired staff device, local first (decision 19), never through `lib/notify.ts`; pairing reuses the shipped ECDH pairing with a 6-digit
  pairing code, never the key; no picture leaves the site without a consent id; the schools policy is data (deny list, `blurRequired`,
  `consentRequired`, role names only); minors' retention is decision 18; fall and crowd stay off until decision 20; a robot may only slow
  or stop for a person alert. The **For schools** card draft is there for the operator to approve.
- **Finish lines.** `exel-nav-01`: goal docking on a dock marker in the minimal ground world, both gates, signed → simulation-loop-ready.
  `edtech-hazard-01`: an alert-only card cleared for `camera`, Gate 1 scored by per-class alert precision and time to alert (no timing law),
  signed. Owners: the ground loop integrator; a camera integrator for the school region.

## Failure modes — none of them maps to "continue"
The failure-mode table (event → action, 30 rows) **lives in `loop-spec.draft.json`** (`failureModes.rows`, moved verbatim in 0.15).
Test 40 refuses a row whose action is "continue", except a verified clear heartbeat above every frame-health floor.

## Model selection, sim first, then a signed gate
- **HAL fit:** the card's measured capture-to-output `tierMs` p99, after the soak, must satisfy p99 + P ≤ A − m on that tier. A tier with
  no measured p99 or soak cannot be selected. Tier to file: only the shipped `modelFile` / `model_file`. `hal.ts` stays a render helper
  (`frameBudgetMs`, `sensorFits`); `halCnnMs` is a fallback estimate, never a pass.
- **Gate 1 (model) · Gate 2 (controller) · signed release — loop-ready needs all three.**
  - **R-CORE first.** Before C3, grep the Security-2525 replay engine (`lib/2525-core/MANIFEST.md:17`; `components/security-2525/`
    `rcore.ts`, `play-test.ts`, `mission-support.ts`) and extend it into `lib/2525-core/replay`, or record why not, with file:line.
    Drone-2525's `ReplayBundle` (`lib/drone-2525/game.ts:108`) and `replayHash` (`decisions.ts:136`) cover the fire-gate ledger, score
    and doors, so loop replay reuses only `fnv1a64` (`decisions.ts:156`) over a **loop-event projection** (seed, card hash, spec-file and
    contract hashes, tick, action, reason, clearance) in a `LoopReplayBundle` without score or doors. A source check refuses importing
    `Ledger`, `replayHash` or `DecisionRecord` into `replay` or `loop-actions`. N = 300 seeds replay byte-identically, and a failed seed
    ties back to a hard-case capture task by its hashes. **Golden thread:** one synthetic kit clip goes R3 XML → `readVoc` →
    `mergeTraining` → train.json → provisional card → emulator → `VehicleCommand`; the hashes join at every seam
    (`sensor-fusion-loop-replay.test.mjs`).
  - **Gate 1, open-loop.** `lib/sensor-fusion/replay.ts` (new, pure) replays a pinned clip set per domain (R2 shared decoder, frame hashes,
    replay split only) and scores per-class precision, recall per condition, bearing error and capture-to-output p99. Alone = **replay-ready**.
  - **Gate 2, closed-loop.** A **detection emulator** in `replay.ts` projects world obstacles into the camera (card intrinsics), hides what
    `lineOfSight` (`lib/drone-2525/los.ts:36`) says is occluded, and adds or delays boxes from the card's precision and p99. **Misses come
    in bursts:** a two-state model per class per condition, burst length measured on the replay split and kept on the card. Recorded
    detections cannot react to the vehicle, so they never count as closed loop.
  - **Pass line per loop** (values in the table above): zero collisions over N seeded runs (N ≥ 300 supports under 1% at one-sided 95%), the
    minimum clearance, the nuisance-stop cap, and time to the safe action ≤ B. The hard-case list is sized from N. **Synthetic frames:**
    `replay.ts` renders labelled obstacle-layer views from the same projection, tagged `synthetic`, never counted in held-out or replay.
  - **Scenario generator** (per loop, in the spec file): each seed draws obstacle placement, wire height and sag, approach angle, wind or
    current, light and burst-miss state from stated ranges. Runs that share one layout are refused as N. **N per stratum:** unmapped wire with a burst miss, glare,
    person stand-off, current drift and dock loss each need N ≥ 300 for a 1% claim, or state the weaker bound (30 runs supports only
    under 10%). The command-link loss, stuck-stick, GNSS-drift and rangefinder-misses-wire rows are drawn as strata too; the peer-corridor
    stratum waits on decision 23. Water adds a current stratum at 1.2× the hull's rated station-keeping thrust; its pass line is
    `gate2.currentOverThrustPass`. Runs per family are derived, never typed (`gate2.computeRule`).
  - **Provisional card per loop:** precision, recall, burst length and p99 assumed at the floors, so Gate 2 runs with zero pictures. It
    reaches only controller-proven and is never signed.
- **Worlds.** Air: the Drone-2525 arena (`lib/drone-2525/arena-model.ts`; `world.ts` is its cache), which holds doors, buildings and tree
  rows (`:19`, `:26`, `:42`). Add a **ground-truth obstacle layer** as data, the way `treeRows` join: wire spans, poles, scripted birds
  and person-avoid markers. The Arena output gains the prisms `lineOfSight` needs (`los.ts:13`, `:39`), kept out of the wire model so the
  arena stamp and `test:drone-arena` stay unchanged. Water and ground: minimal pure 2D worlds in `replay.ts` (current drift; an obstacle
  grid and a dock marker). Fuller worlds are decision 14.
- **Actions to the vehicle.** `lib/2525-core/loop-actions.ts` (new, pure) returns the core `FlightAxes` type for each air action, which
  `FlightInput` (`flight.ts:87`) satisfies; it never imports `FlightInput` (test 15 source check):
  hover = zero input, altitude held, quad mode only; wing mode loiters on a fixed circle, then `toggleMode` (`flight.ts:97`, `:139`) into
  quad; land = `takeoffInput` (`:78`) in reverse; return = heading home, then forward. Water and ground get kinematic steps shaped like
  `stepFlight` (`:135`), fed by their own `VehicleCommand` family. The actuator table is one file, `public/sensor-fusion/actuators.json`,
  next to the spec file so the browser and `loop_runner.py` read one file (registered in `lib/2525-core/MANIFEST.md`, its hash in the
  signed record and the card-lapse rule, owned by the contract owner). Rows are keyed by autopilot and firmware major: ArduPilot Copter,
  Rover and Boat `custom_mode`, PX4 main and sub mode. The common `MAV_CMD_NAV_LOITER_UNLIM`, `MAV_CMD_NAV_LAND` and
  `MAV_CMD_NAV_RETURN_TO_LAUNCH` are preferred where they exist. ROS 2 is pinned to Jazzy (LTS) with Nav2 `NavigateToPose` and its cancel.
  A required column says how the link is authenticated (MAVLink 2 signing or SROS2). A loop refuses an autopilot whose declared version is
  not in the table. Simulation only until C6; no action id left unmapped.
- **Arm-time integrity.** At arm, `loop_runner.py` and the browser loop verify the spec file, `actuators.json`, the edge script, `loop_runner.py` with its tracker and arbiter port (and the
  byte-identical
  `download/` copy) and the card against the signed record, then run only that copy until disarm. A lapse or a new hash applies at the next arm, never
  mid-mission; fetches from `main` (`sensor_fusion_edge.py:35-36`) are refused while armed. Before arming, the runner reads the
  autopilot's link-loss failsafe, named per row in `actuators.json` (ArduPilot `FS_GCS_ENABLE`; PX4 `COM_DL_LOSS_T`, `NAV_DLL_ACT`);
  off, or set to continue, refuses to arm. **Setpoint stream:** each family row in `actuators.json` also names its command rate and the
autopilot's own setpoint-loss timeout and action (PX4 offboard loss: `COM_OF_LOSS_T`, `COM_OBL_RC_ACT` with RC, `COM_OBL_ACT` without; ArduPilot guided: `GUID_TIMEOUT`;
the Nav2 controller timeout), read at arm the same way. Arm is refused when that timeout exceeds the loop's B or its action is continue. Defaults exceed B (PX4 `COM_OF_LOSS_T` 1 s, Copter
`GUID_TIMEOUT` 3 s; ground: the base driver or `twist_mux`), so each row lists required parameters with pinned firmware versions, and a
`loop_runner.py` set-params step writes them before arm; a failed write or unpinned version refuses (test 34). The timeout window is
3 × command period plus link jitter p99, up to B (test 12 refuses an empty one). Order: `failureModes.failsafeOrder`.
That off-process timeout is the authority when `loop_runner.py` stalls or dies; the in-process watchdog only writes the field event.
The `OBSTACLE_DISTANCE` bridge emits at the command rate, inside H. C5a and every `gate2.strataByFamily` list gain "loop_runner killed
mid-run" (pass: the autopilot reaches its safe action inside B plus the timeout) and "setpoint stream lost". A new `.github/CODEOWNERS`
(today `.github/` holds only workflows; owner: contract owner; due week 2 of the ladder) plus branch protection
  covers `public/sensor-fusion/loop-spec/**`, `contract.json`, `actuators.json`, `loop-signers.json`, `loop-signatures.jsonl`, `kits/**`,
  `edge/loop_runner.py` and `lib/2525-core/{detect-contract,loop-actions,track}.ts` (the citations test checks every file the signed record
  hashes is covered): the contract owner plus the owner region, signed commits. The operator's
  root key that signs `loop-signers.json` stays offline, never in CI or a browser; a roster change needs 2 of 3 named holders, and a
  written recovery path covers a lost root key. **Live anti-spoofing:** a sudden class flip or a box that jumps past the tracker gate
  gives slow and a field event; R2's patch and glare clips form a Gate 1 "adversarial" bin.
- **Signed release:** before a live loop loads a model, a named human in the loop-integrator role, never the card's signer, signs the card
  hash, the three file sha256s, the train.json hash and the replay pass. Loop models pin to a signed card, never the main-branch URL
  (`sensor_fusion_edge.py:36`). Anything missing: simulation only. Rollback is one step to the previous signed card.
- **Branch protection is read, not assumed.** A CI step reads branch protection through the GitHub API (required review, signed commits
  on `main`); arm refuses a spec file or `loop_runner.py` whose last commit is unsigned. It is a dated rung in each ladder.
- **No "armed" beside unpinned bytes.** `components/sensor-fusion/loop-panel.tsx` refuses to show "armed" while the page's `cnn.js`
  session loaded from `BASE` rather than a hash-listed copy (source-check golden in `sensor-fusion-loop-replay.test.mjs`).
- **The gate covers the bytes and the runtime.** Loop models load only from the pinned, hash-listed copy the card names, never `BASE`
  (`cnn.js:8`, `sensor_fusion_edge.py:34`). `fetch()` (`:116-131`) checks each sha256 before `os.replace` (`:128`). The signed record holds
  the sha256 of `sensor_fusion_edge.py` and `loop_runner.py` (`edge/` the source, `download/` byte-identical or refused) and of the spec file;
arm is refused when the running `loop_runner.py` differs (test 41). **To build**
(today `:64`, `:67` fetch by URL with no hash): `cnn.js` hashes
  `labelmap.txt` and `detect.tflite` (`:64`, `:67`) with SubtleCrypto and passes **the same `ArrayBuffer`** to `loadTFLiteModel`, never the
  URL, so nothing is fetched twice. `models.json` v2 stays readable by v1 readers (`sf.ts:23`, `cnn.js:50`, both edge scripts ignore
  `card`); for a loop or a camera place, the edge script refuses a v1 or hash-mismatched cached `home()` copy (`:39-47`), the self-update (`:35`,
  `:285`) and `BASE` model pulls (`:34`, `:127`).
- **Where signatures live (local track):** append-only `public/sensor-fusion/loop-signatures.jsonl`. Each entry and roster change is a
  **git commit by a neutral bot or CI identity**; no personal name or email enters git; a CI test checks the chain. Each entry: salted
  member-id hash (the salt a per-project secret off `public/`, rotated with the roster), role, card hash, file sha256s, edge-script and spec
  hashes, replay hash, train.json roster hash, previous entry hash. **Signed means a signature:** a non-extractable ECDSA P-256 key per
  signer in IndexedDB — **new code**, since the Part B pairing is ECDH (`play.html` ~:3225). Public keys sit in
  `public/sensor-fusion/loop-signers.json`, signed by the operator's root key, with rotation and revocation in the chain; a revoked key voids
  every card it signed. **Retention:** decisions 15 and 18; only the project owner deletes; a field event past retention is refused for replay.
- **Minimum crew per region: four distinct member ids** (labeler, reviewer and 5% re-checker, card signer, gate signer). A gate signer who
  held an earlier role on that card is refused. The project page shows the missing role. **Cross-region cover:** a member of another
  region may fill a missing reviewer or signer role on a card they did not label; the page shows "Needs a reviewer from any region".
- **Deny list as data** in the spec file, per place: `checkid`, `head`, `eyes`, and any personal-name, face or eye label. Refused for
  loops and cameras; the display-only demo is unaffected.
- **Registry status:** each `models.json` v2 entry has an owner region and a status on one **readiness ladder**: draft → replay-ready
  (Gate 1) → controller-proven (provisional) (Gate 2 on a provisional card) → simulation-loop-ready (both gates, signed, minimal world) →
  loop-ready (vehicle model in `VEHICLE_MODELS`) → retired. Test 29 checks every card status word is a rung.
  **Deferred to the build phase, with their tests:** a partner's own model enters through the same three-file folder, Gate 1 and Gate 2
  (test 34: a foreign card without `tierMs`, soak or tensor shape is refused at arm); each `kits/<region>/README.md` is generated from
  `kit.json` (role, first test, week-1 rung, blocking decision), checked by the citations test, in place of a hand-written partner guide.
  The registry refuses `loop-ready` for a vehicle absent from the `VEHICLE_MODELS` data export (C4b),
  never a comment. Golden: `manta-mini-66-33` is in `VEHICLES` but not in `VEHICLE_MODELS`, so it is refused. Manta-2525, MASS-AI and
  the eXeL AI robot stop at simulation-loop-ready until their ladder reaches week 8. **Card lifetime:**
  loop-ready lapses to replay-ready when **the region's spec file, or `contract.json`**, its `actuators.json`
  rows, the edge script or `detect-contract.ts` changes hash, or past the card max age. A new camera hazard never lapses the Drone's card.
  Retiring never deletes a signed card; rollback reads only non-retired cards.
- **Field to capture:** every safe action, takeover, drift event, alert and replay miss writes an append-only field event (clip, frame
  hashes, loop or place id, card hash, reason). R2 turns them into the **hard cases** list, picked and reviewed first. Stored locally in
  `field-events.jsonl` (in the R7 manifest and the Python `home()`); a **retrain cadence** per region (`loop-spec.draft.json`, `retrainCadence`)
  sets the trigger for the next R9 merge, and test 31 reports "late" when it passed with no new card; on the server, a members-only table in 043 (decision 1). **Federated
  sets:** R9 merges two regions' sets by roster, keeps each clip split, and the card lists the contributing set hashes.

## Tests (when built)
The 41 numbered Part C tests live in `TESTS.md` beside this plan .
Grok copies that list into the header of `frontend/tests/sensor-fusion-loop.test.mjs` when C1 ships. Test numbers below point there.

---

# Appendix — Part B — DETECT
Moved to `DETECT.md` beside this plan, unchanged (future hardware, after Part C in build order). Decisions 10–13 stay in the
one decision list above. The citations test scans `DETECT.md` with this file.
