# Signing, arm-time integrity and signatures — part of the plan for Grok

> Moved from `PLAN.md` Part C at revision 0.19 to keep the plan under its 14,000-word budget (Sofia, round 19). Text unchanged except the
> setpoint timeout-window sentence, marked 0.19. The plan, the citations test and test 31 read this file as part of Part C.

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
3 × (1000 ÷ `commandHz`) ms plus the **measured** link jitter p99, up to B (0.19: see PLAN.md Part C, *Setpoint rate and jitter*; test 12 refuses an empty window
or one computed from an unmeasured jitter). Order: `failureModes.failsafeOrder`.
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

## Crew, deny list and registry status
> Moved from `PLAN.md` Part C at revision 0.19, unchanged.

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
