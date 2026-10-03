## Browser runtimes on the SAME detect.tflite (bench, identical 300x300 bytes vs Python tflite-runtime)
- tfjs-tflite 0.0.1-alpha.10 (loader fixed: /wasm/ path + functional calls), single-thread WASM: all 4 models, 39-44 ms/frame, Demo90 163/179 boxes matched, max score diff 0.016 (Head 0.086), median 0.
- tfjs-tflite threaded (numThreads 4, COOP/COEP): hung, killed at 200 s (UNVERIFIED cause).
- LiteRT.js 2.5.3 webgpu + JSPI: all 4 models run; Demo90 168/179 matched, max diff 0.023; 470-526 ms/frame on SOFTWARE WebGPU (no GPU in sandbox).
- LiteRT.js wasm (plain): 'memory access out of bounds'; wasm+JSPI: 'Cannot read properties of undefined (reading value)' / 'Element type NONE is not supported'; wasm threaded (COI): out of bounds. => its CPU path cannot run the SSD post-process today.
- LiteRT.js webgpu without JSPI: 'Asyncify is not defined'.
- MediaPipe Tasks Vision 1.0.1: refuses - needs TFLite Model Metadata.
- onnxruntime-web: needs ONNX conversion (second format) - not tested.
## Cube probe
- browser CNN 16.5 env/s (43 ms) vs edge node localhost 5.7/s (CNN 144 ms, rt 157 ms, 37 KB/frame 640x360). Throttle 4x: browser 4.4/s (190 ms), edge 4.7/s (171 ms).
## One Python brain, two homes
- fusion.py (pure Python, no numpy) ran unchanged in CPython (tflite-runtime detect) and Pyodide 314.0.7 in Chromium (JS tfjs-tflite detect via js bridge).
- Same identification: head from layer 2; score 1.00 vs 0.98; combined 0.72 vs 0.706; all boxes IoU 0.93-0.98. Raw-output hashes differ (f795f6c3 vs c6b97d49): resize kernels differ.
## Network laws (Chromium)
- http page from a LAN address: isSecureContext false, no navigator.mediaDevices, no WebGPU, no crypto.subtle -> no camera.
- https page (self-signed accepted): camera OPEN; fetch to http LAN node BLOCKED (Mixed Content); fetch to http loopback BLOCKED (private network permission).
## Pyodide
- loads 1.9 s from local files; Python 3.14 wasm32; no tflite/litert package in its 357-package lock; numpy wheel must be vendored for offline (404 here).
## WebRTC: HTTPS page <-> Python node (aiortc 1.15) on the LAN, SDP by paste
- secure context, camera allowed; data channel opened; 10 frames x 36,861 B JPEG (640x360): round trip median 160 ms (min 140), envelopes authority MARK.
- 168,949 B frame: channel CLOSED at frame 0; negotiated sctp.maxMessageSize = 65536 -> frames must stay under 64 KB or be chunked.
- Chrome hides LAN IPs behind mDNS (.local) by default; a real phone+Pi on one Wi-Fi resolve mDNS; this container needed --disable-features=WebRtcHideLocalIpsWithMdns.
## Decision hash
- hashing the DECISION (verb, from_layer, label, boxes snapped to a 0.1 grid, score band) gives the same hash in CPython and Pyodide: 117e81bef7592a62 == 117e81bef7592a62 (raw-output hashes differed).
## Light Codex caption round trip (repo lib/light-codex.ts, block 2, Double Helix, 640x360 frame)
- PNG: verified (both strands). Lossless WebP: verified. JPEG q95: verified via bottom strand (Single Helix fallback). JPEG q85: verified (bottom strand). JPEG q60: null.
- => captions survive camera JPEG at q>=85 with block 2; correction of E14 ("PNG only").
## Sensor Fusion mark through Drone-2525's own fire law (repo slots.ts + decisions.ts)
- machine mark -> designate amber (by SF:Model02.Head); canFire refuses AMBER_NO_APPROVE. Good.
- RISK PROVEN: slots.approve(st,1,"SF:edge-node") -> red, approvalKind "two-person" (names differ), canFire ok. The gate is name-based; ai-crew resolveRequest is name-based too ("an unnamed approval is not an approval"). Safe while only human seat buttons call approve(); Sensor Fusion is the first machine-generated stream into the room.
- Guarded approve (only HI:pilot / HI:targeteer) refuses the machine (stays amber) and accepts the human (red, two-person). Record: AI DESIGNATE · HI APPROVE · HI SIM-ACTION; decisions DEC-0001 SF:Model02.Head, DEC-0002 HI:targeteer; replay hash f0d61ca146860f25.
