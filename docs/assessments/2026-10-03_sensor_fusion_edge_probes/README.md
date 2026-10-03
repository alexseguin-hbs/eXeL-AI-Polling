# Sensor Fusion — R-CORE EDGE-2525 reference probes (Claude Code, 2026-10-03 night)

**Reference probes, not app code.** Grok writes all Sensor Fusion code. These files prove what works and give Grok
tests to run. Nothing here is wired into `frontend/app/SensorFusion-2525/` or `frontend/public/sensor-fusion/`.
No model file was renamed. Paths in the scripts use `$SCRATCH` for the scratch folder the probes ran from; set it
to any working folder that holds the runtime packages (`npm i @tensorflow/tfjs-tflite@0.0.1-alpha.10
@tensorflow/tfjs-core@4.22.0 @tensorflow/tfjs-backend-cpu@4.22.0 @litertjs/core@2.5.3 pyodide@314.0.7
--legacy-peer-deps`) and a Python venv (`pip install tflite-runtime "numpy<2" pillow opencv-python-headless aiortc aiohttp`).

The running log of every measurement is `FINDINGS.md`. The ask is `docs/asks/2026-10-03_sensor_fusion_rcore_edge_browser.md`.

| Folder | What it proves | How to run |
|---|---|---|
| `bench/` | Every browser runtime on the SAME 300×300 input bytes as Python tflite-runtime (parity + ms). Pyodide: one pure-Python `fusion.py` runs in CPython and in the browser. `fusion2.py`: two cameras, one object — boxes matched in a shared frame, combined score, envelope signed with a room key (forgery and wrong room both refused). | `node bench/run-bench.mjs "tfjs-1t,litert-webgpu+jspi"` · `python bench/fusion_cpython.py photo.jpg` · `node bench/pyfusion.mjs` · `python bench/fusion2_demo.py` |
| `edge/` | The cube: `edge_node.py` (Python backbone: folder = model list, POST /infer → one envelope, serves the page and the runtime itself), `page.html` (browser = screen + camera, CNN in browser or on the node, same envelope), WebRTC from an HTTPS page to a Python peer (`rtc_node.py` + `rtc.mjs`), the secure-context and mixed-content laws (`securectx.mjs`, `mixed.mjs`), the start-up chooser that picks browser or node on the device in hand (`choose.mjs`), and eight peers at once on one node (`concurrent.py`: 3/40 before the per-model lock, 40/40 after). | `SF_HOME=… SF_WEBLIB=… python edge/edge_node.py 8525` then `node edge/drive.mjs http://127.0.0.1:8525/ 1 12` · `node edge/choose.mjs` · `python edge/concurrent.py` |
| `codex/` | A Light Codex caption (repo `lib/light-codex.ts`) stamped on a camera frame survives PNG, lossless WebP and JPEG q≥85. | `node --experimental-strip-types codex/stamp.mjs stamp frame.rgba "DEMO90 PERSON 73 T1 S1 MARK"` |
| `drone/` | A Sensor Fusion mark through Drone-2525's own fire law (repo `slots.ts` + `decisions.ts`): amber is refused; a machine-named approve would turn it red (name-based gate); a guarded approve refuses the machine. | `node --experimental-strip-types drone/sf_into_drone.mjs` |
| `devicecheck/` | The one-tap device check published at https://claude.ai/artifact/1DQS4jfGH2Nd1pRLZtgPxi (runtime + model bytes ship beside the page). | open the link on each device · `node devicecheck/dc_check.mjs` locally |
| `litert/` | The Python runtime question: tflite-runtime is Linux-only and frozen at 2023; LiteRT (`ai-edge-litert`) runs the same `.tflite` files on Windows, Mac and Linux with numpy 2, same answers at ≥50%, about 10× faster here. | `python litert/dump.py <models>` in each venv · `python litert/threads.py <models>` |
| `grok/` | Grok's own code run as it ships (feedback only, nothing applied): `cnn.js` fails on every model in the browser; two one-line fixes (`cnn_two_fixes.diff`) make Head find a head and the built page draw boxes; the page shows the raw error to the person; `sensor_fusion_edge.py` cannot start without network and a dropped download overwrites a good model. | `node grok/cnn_run.mjs head,demo90` · `CNN=… node grok/cnn_page.mjs` · `sh grok/offline_start.sh` · `python3 grok/short_download.py model.tflite` |
| `accuracy/` | The Head / Deer / Tree test on Open Images (kept for the record; the operator set accuracy aside for now). | `python accuracy/eval.py` |
