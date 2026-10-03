// Offline prototype (scratch, not app code): keep the page, the browser runtime and one model folder on the device.
const C = "sf-offline-v2";
const KEEP = ["/SensorFusion-2525/", "/sensor-fusion/cnn.js",
  "/sf-lib/tfjs-core/dist/tf-core.min.js", "/sf-lib/tfjs-backend-cpu/dist/tf-backend-cpu.min.js", "/sf-lib/tfjs-tflite/dist/tf-tflite.min.js",
  "/sf-lib/tfjs-tflite/wasm/tflite_web_api_cc_simd.js", "/sf-lib/tfjs-tflite/wasm/tflite_web_api_cc_simd.wasm",
  "/sf-lib/tfjs-tflite/wasm/tflite_web_api_cc.js", "/sf-lib/tfjs-tflite/wasm/tflite_web_api_cc.wasm",
  "/sf-models/Demo90/Sample_TFLite_model/detect.tflite", "/sf-models/Demo90/Sample_TFLite_model/labelmap.txt", "/sf-models/PreLoadedModels/Model02.Head/Sample_TFLite_model/detect.tflite", "/sf-models/PreLoadedModels/Model02.Head/Sample_TFLite_model/labelmap.txt"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(C).then((c) => c.addAll(KEEP)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// Same origin: network first, keep a copy; when the network is gone, answer from the copy.
self.addEventListener("fetch", (e) => { const u = new URL(e.request.url); if (u.origin !== location.origin || e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const k = r.clone(); caches.open(C).then((c) => c.put(e.request, k)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((m) => m || new Response("offline and not kept", { status: 503 })))); });
