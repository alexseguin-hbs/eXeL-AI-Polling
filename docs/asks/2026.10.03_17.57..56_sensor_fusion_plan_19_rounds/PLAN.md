# Sensor Fusion — the plan for Grok (revision 0.22)

> The operator removed control loops from this plan on 2026-10-04.
> Do not build a loop for Drone-2525, Manta-2525, MASS-AI, or the eXeL AI robot.
> Do not build a detection that steers, slows, holds, or stops a vehicle.
> Do not build a signed approval for a driving model, or a shared detection record for those loops.
> **Alerts are all on.** There is no school-alert mode. "School alerts" does not mean anything. A place does not turn an alert off.
> Capture, labels, the model files, and the Sensor Fusion page stay.
> The round records `r01.md`–`r19.md` stay as history. `loop-spec.draft.json`, `SIGNING.md`, and the Part C tests in `TESTS.md` are archive. Do not build a vehicle from them.

**Alerts.** Every alert is enabled: a blocked exit, a spill, smoke or fire, a fall, a crowd, a door open after hours, and a person in the way. None of these is a school alert. An alert tells a person. It does not drive anything. They live behind one Sensor Fusion setting (R11).

**Next, and nothing else first:** wire `frontend/tests/sensor-fusion-coral.test.mjs` as `test:sf-coral` into `test:ci`, beside `test:sf-r4a`.

**Then, one step at a time, after the live site shows the last step:**
1. One XML module, `frontend/lib/sensor-fusion/voc.ts`, write then read.
2. File names that are never reused.
3. Capture settings. GPS and EXIF removed. Pictures stay PNG.
4. Level 1, Level 2, the Light Codex strip beside the picture, then one training file after Level 2.
5. R11, the Alerts setting.

You are Grok. Methods and files for the page. No control-loop code.

## Revision history
| Rev | Round | What changed |
|---|---|---|
| 0.00–0.13 | 1–13 | Moved verbatim to `HISTORY.md` beside this plan (0.15); rows unchanged. |
| 0.14–0.16 | 14–16 | Moved verbatim to `HISTORY.md` (0.17); rows unchanged. |
| 0.17 | 17 | Cut by moving: history 0.14–0.16 to `HISTORY.md`, R4b and R4c to `WAITING.md`, alerts and schools to `ALERTS.md`, citations-test fail list and runners to `TESTS.md`. Fixed: input size from the model tensor; pixel rows by class and loop row, child width, margin; smoke-replay week 1, dated C5 and C5b; setpoint-loss timeout; decisions block arm only; loop-rate replay clips; poses sensitive; decision 25. Measured `wc -w PLAN.md`: 14,600 (from 15,496). |
| 0.18 | 18 | Every ladder in build order (R9 and first trained card, Gate 1, C5, C5b, C5a) with a week-2 CODEOWNERS rung; derived run counts; Manta current pass line, card line, child row; pole and tree refused; `sizeTruth`; `seedClassMap`; custom01 fixed; Ground row split; decisions in order; setpoint parameters and order; signed size in the outcome line. |
| 0.19 | 19 | Moved signing, crew and registry to `SIGNING.md`, roles to `GLOSSARY.md`. Added: command rate split from frame rate plus a measured jitter bench; detector-lost pass line and frozen-camera stratum; family-keyed `HumanAxes`; `blur-01` card; air rungs for `decelMs2`, `maxBankDeg` and `VEHICLE_MODELS`; exelRobot CODEOWNERS; C5b comparator; status word rule; loop panel off `round.tsx`; `standOffFraction`, `anchorFitted`. |
| 0.20 | — | Operator: control loops removed from the build plan. Part C is not a build step. Archive files stay as history. |
| 0.21 | — | Operator: all alerts are on. There is no school-alert mode. A place does not turn an alert off. |
| 0.22 | — | Operator: alerting is a Sensor Fusion setting. Adds R11: one Alerts switch; on = every alert on; a self-test must pass first; alerts tell a person only. |

## The chain (read this first)
capture → Level 1 boxes → Level 2 review → XML and a Light Codex strip beside the picture → one training file after Level 2 → a model folder on the device.
The chain stops at the model folder. It does not enter a vehicle.

# Part A — Sensor Fusion: capture, label, build models as a team (v3 FINAL, R1–R10)

> If a sentence below names a vehicle, a loop, a kit, Gate 1, Gate 2, or a card that lets a model drive, skip it. That sentence is leftover from revision 0.19. It is not a build step.

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
  and the drafts are deleted. **Scan set:** PLAN.md, SIGNING.md, TESTS.md, GLOSSARY.md, DETECT.md, ASK.md, WAITING.md, ALERTS.md and both draft JSON files. Each citation is **path + anchor string**
  (the line is a hint), marked **today** (code exists) or **to build**. It records its **pin SHA**; at round start it prints each cited
  file changed since the pin, and fails when `git log <pin>..HEAD` touches one with no plan note, or a "no code commit since X" sentence
  disagrees with `git log X..HEAD -- frontend/`. **Word budget** (`wc -w PLAN.md`, computed by the test itself, read from `contract.json`): at most 14,600 at
  0.17 and 14,000 at 0.19; 10,000 is a build-week target; it prints the count per Part and the total with siblings, which may not grow. Prose lines at most 200 characters (tables exempt).
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
are blurred unless consent is recorded. There is no school-alert rule. **Identity models** (`checkid`, any
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
  must agree for loop-ready. **Blur finder card (0.19):** `blur-01` gets its own `models.json` v2 card (owner: camera integrator): face
  and person recall floor 0.99 with adult-face and child-face `pixelExtent` rows, a Clopper-Pearson quota sized by the R9 power rule, and a
  held-out set. R6 samples 5% of blurred frames; one visible face refuses the set. A blur card under its floor, or a clip blurred by an
  uncarded model, refuses every kit clip with a person, swimmer or child-height frame. Failure-mode row "face blur fails" cites this
  floor. Test 39 and test 40 goldens. **One label source:** the `labelmap.txt` bytes (UTF-8, LF) are what every hash covers; `models.json` labels
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

**R11 · Alerts — one Sensor Fusion setting (operator, 2026.10.04_03.38..50 CST).**
> Operator, verbatim: "Alerting if works should be a SF setting"
- **One switch in Settings**, "Alerts", under Edge Compute. Remembered on the device as \`sf2525-alerts\` (reads and writes in
  try/catch). **On means every alert is on:** a blocked exit, a spill, smoke or fire, a fall, a crowd, a door open after hours, a person in
  the way. There are no categories to pick and no place-based mode.
- **"If it works" is a self-test.** The switch can only be on after **Test alert** fires a sample end to end on this device: the banner
  shows, and sound or vibration plays if allowed. The row then reads "Alerts on · tested <YYYY.MM.DD_HH.MM..SS>". If the test fails, the
  switch stays off with one plain sentence saying why.
- **When an alert fires:** an alert class from the open model is seen in at least 3 frames in a row, above the existing confidence
  threshold. Each class alerts at most once per 30 s.
- **What an alert is:** a banner on this screen, plus sound or vibration if allowed. A local list keeps the time, the class and the %.
  The picture is kept only if the person turns that on, with faces blurred unless consent is recorded. Nothing leaves the device until
  decision 1 is answered.
- **What it never does:** drive, steer or stop anything; mark, approve or fire; name a person. Identity models (\`checkid\`) are never an
  alert source.
- New words stay English in \`AFTER_FILL\`.

*Tests:*
- A pure \`alertDecide(frames, settings, now)\` in \`lib/sensor-fusion/alerts.ts\` gives an alert or none:
  - it alerts only after 3 frames in a row, and the 30 s cooldown holds per class;
  - a detection below the threshold never alerts;
  - with the switch on, every alert class is live, and there is no per-category or per-place filter;
  - \`checkid\` is refused as a source.
- Headless at 390 px:
  - the switch cannot turn on before Test alert passes;
  - it survives a reload;
  - Test alert shows the banner;
  - an alert makes no network request.

## Tests file and runners
The test files, runners and the Python CI job are listed in `TESTS.md` (moved in 0.17).


## Operator decisions — capture and labels only
Control-loop decisions are removed. These remain.
1. Where group projects, roles, queues and time records are stored — the server track waits on it. [Supabase, behind R4a policies]
2. Where Upload sends sets. [the same project store]
3. Teacher role and consent rules for minors. [teacher on; minors only with recorded guardian consent; faces blurred]
4. What reopening a project after Close does. [new block numbers after the last; old blocks untouched]
5. When a project counts as paid (the 웃 switch). [only when the operator marks it]
6. The training JSON's layout. [COCO]
7. Where training runs and who may sign a model card. [any region's machine, running the pinned recipe whose hash the card records; a named
member who did not review; the operator signs the gate]
10. DETECT: band, HDMI side channel, or both. [band first]
11. DETECT: which video links count. [HDMI only]
12. DETECT: code per person or per pair of boxes, and how a lost code is replaced. [per pair; re-pair to replace]
13. DETECT: protected content (HDCP). [unprotected sources only, unless licensed]
15. Retention periods. [field events 90 days; clips showing people 30 days unless consent is recorded; the replay test checks these numbers]
16. Whether a future accel tier may declare a fourth runtime file, or must stay Coral. [stay Coral; today the three-file rule would refuse it silently, so the refusal is stated]
24. Where an adult contributor's consent record lives across borders. [in the contributing region's project store behind the R4a
    policies; only the salted hash travels in `kit.json`, and that region's rules govern; test 34 golden: a kit with an unhashed consent
    id is refused]


## Out of scope
Control loops. Drone-2525, Manta-2525, MASS-AI, the eXeL AI robot, and any detection that drives a vehicle.
A signed card that lets a model drive.
A school-alert mode. It does not exist.
DETECT hardware (`DETECT.md`) stays a later note. It is not a build step.
Any change to existing model files or label files.

---

# Parked — control loops
Removed from this plan on 2026-10-04 by the operator. Not a build step.
The text that used to be Part C is in the round records and in `loop-spec.draft.json`. Leave it there.

# Appendix — Part B — DETECT
`DETECT.md` is future hardware. It is not part of the current build, and it is not a control loop.
