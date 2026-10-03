// 300 detections with Grok's cnn.js (+ the two fixes) on one picture: does memory stay flat? A phone that leaks one tensor
// a frame dies after minutes at 10 FPS. Also: does it still run when the browser has no WASM SIMD (older phones, some Pi builds)?
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
import fs from "node:fs"; import path from "node:path";
const NM = process.env.SCRATCH + "/tfjsprobe/node_modules/@tensorflow", UP = "/home/user/de-risking-strategies/sensorfusion", CNN = process.env.CNN, IMG = process.env.SCRATCH + "/bench/img/zidane.jpg";
const args = [];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args });
const p = await b.newPage(); const miss = [];
// NOSIMD: refuse the runtime's tiny SIMD probe module (an older phone / browser without WASM SIMD); the real runtime still loads.
if (process.env.NOSIMD) await p.addInitScript(() => { const inst = WebAssembly.instantiate.bind(WebAssembly), val = WebAssembly.validate.bind(WebAssembly);
  const isSimdProbe = (b) => { try { const u = b instanceof ArrayBuffer ? new Uint8Array(b) : ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : null; return !!u && u.length < 200 && u.includes(253); } catch { return false; } };
  WebAssembly.instantiate = (b, i) => isSimdProbe(b) ? Promise.reject(new WebAssembly.CompileError("simd off")) : inst(b, i);
  WebAssembly.validate = (b) => isSimdProbe(b) ? false : val(b); });
await p.route("**/*", async (route) => { const u = new URL(route.request().url()); let f = null;
  const m = u.hostname === "cdn.jsdelivr.net" && u.pathname.match(/^\/npm\/@tensorflow\/([^@]+)@[^/]+\/(.*)$/);
  if (m) f = path.join(NM, m[1], m[2]); else if (u.hostname === "raw.githubusercontent.com") f = path.join(UP, u.pathname.replace(/^\/De-Risking-Strategies\/SensorFusion\/master\//, ""));
  else if (u.pathname === "/") return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><img id=i src=/z.jpg><script src=/cnn.js></script>" });
  else if (u.pathname === "/cnn.js") f = CNN; else if (u.pathname === "/z.jpg") f = IMG;
  if (f && fs.existsSync(f)) return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": f.endsWith(".wasm") ? "application/wasm" : f.endsWith(".js") ? "text/javascript" : "application/octet-stream" } });
  miss.push(u.pathname.split("/").pop()); return route.fulfill({ status: 404, body: "" }); });
await p.goto("https://sf.local/"); await p.waitForFunction(() => window.SFCnn && document.getElementById("i").complete);
const r = await p.evaluate(async () => {
  const simd = WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));
  const s = await window.SFCnn.load("head"), img = document.getElementById("i"), mem = [], ms = [];
  for (let k = 0; k <= 300; k++) { const t0 = performance.now(); const out = await window.SFCnn.detect(s, img); ms.push(performance.now() - t0);
    if (k === 0 || k === 100 || k === 300) mem.push({ k, tensors: tf.memory().numTensors, kB: Math.round(tf.memory().numBytes / 1024), hits: out.hits.length }); }
  ms.sort((a, b) => a - b); return { wasmSimd: simd, mem, medianMs: Math.round(ms[150]) };
});
console.log(JSON.stringify(r), "wasm files fetched missing:", [...new Set(miss)].join(",") || "none"); await b.close();
