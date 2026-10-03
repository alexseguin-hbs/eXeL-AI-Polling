// The phone as a SCREEN for a Pi camera: a plain http page served by the node at its LAN address (no certificate).
// The camera is refused there (proven in securectx.mjs) - but does everything a screen needs still work?
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
const URL0 = process.argv[2] || "http://192.0.2.2:8525/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await (await b.newContext()).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 120)));
await p.goto(URL0); await p.waitForFunction(() => window.__MODELS, null, { timeout: 30000 });
const r = await p.evaluate(async () => {
  const out = { isSecureContext: self.isSecureContext, camera_api: !!navigator.mediaDevices, crypto_subtle: !!(self.crypto && crypto.subtle), wasm: typeof WebAssembly === "object" };
  const both = await window.runBoth("/m/_probe/zidane640.jpg", "Demo90", "");
  out.browser_cnn = both.browser.verb + " " + both.browser.payload.layers[0].boxes.length + " boxes, " + both.browser.payload.ms + " ms, hash " + both.browser.hash;
  out.node_cnn = both.edge.verb + " " + both.edge.payload.layers[0].boxes.length + " boxes, " + both.edge.payload.ms + " ms, hash " + both.edge.hash;
  return out;
});
console.log(URL0, JSON.stringify(r, null, 1)); console.log("page errors:", errs); await b.close();
