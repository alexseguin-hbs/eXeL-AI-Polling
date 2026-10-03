// Drives the edge probe in headless Chromium with a fake camera. Measures both paths and compares their envelopes.
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
const URL0 = process.argv[2] || "http://127.0.0.1:8525/", THROTTLE = Number(process.argv[3] || 1), SECS = Number(process.argv[4] || 12);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${new URL(".", import.meta.url).pathname}cam.y4m`] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"] });
const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
if (THROTTLE > 1) { const cdp = await ctx.newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE }); }
await p.goto(URL0); await p.waitForFunction(() => window.__MODELS, null, { timeout: 30000 });
const out = { throttle: THROTTLE, models: await p.evaluate(() => window.__MODELS.models.map((m) => m.name)) };
const iou = (a, b) => { const iy = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), ix = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])); const i = ix * iy, u = (a[2]-a[0])*(a[3]-a[1]) + (b[2]-b[0])*(b[3]-b[1]) - i; return u > 0 ? i / u : 0; };
const agree = (A, B) => A.payload.layers.map((L, k) => { const M = B.payload.layers[k]; if (!M) return { layer: L.layer, same: false, why: "layer missing" };
  const pairs = L.boxes.map((x) => { let best = 0, ds = 1; for (const y of M.boxes) if (y.label === x.label) { const v = iou(x.box, y.box); if (v > best) { best = v; ds = Math.abs(x.score - y.score); } } return { label: x.label, iou: +best.toFixed(3), dscore: +ds.toFixed(3) }; });
  return { layer: L.layer, model: L.model, browser_boxes: L.boxes.length, edge_boxes: M.boxes.length, pairs }; });
for (const [name, then] of [["Demo90", ""], ["Demo90", "Model02.Head"]]) {
  const r = await p.evaluate(([n, t]) => window.runBoth("/m/_probe/zidane.jpg", n, t), [name, then]);
  out[`still ${name}${then ? "→" + then : ""}`] = { browser: { verb: r.browser.verb, hash: r.browser.hash, ms: r.browser.payload.ms, layers: r.browser.payload.layers.map((l) => l.boxes.map((x) => `${x.label} ${x.score}`)) },
    edge: { verb: r.edge.verb, hash: r.edge.hash, ms: r.edge.payload.ms, round_trip_ms: r.edge.round_trip_ms, bytes_up: r.edge.bytes_up, codex: r.edge.codex, layers: r.edge.payload.layers.map((l) => l.boxes.map((x) => `${x.label} ${x.score}`)) },
    agreement: agree(r.browser, r.edge) };
}
await p.selectOption("#model", "Demo90"); await p.click("#go"); await p.waitForTimeout(1500);
for (const mode of ["browser", "edge"]) {
  await p.selectOption("#mode", mode); await p.evaluate(() => { window.__LOG.length = 0; }); const t0 = Date.now(); await p.waitForTimeout(SECS * 1000);
  const L = await p.evaluate(() => window.__LOG.slice()); const secs = (Date.now() - t0) / 1000;
  const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  out[`camera ${mode}`] = { envelopes: L.length, per_second: +(L.length / secs).toFixed(2), cnn_ms_median: med(L.map((e) => e.payload.ms)), round_trip_ms_median: med(L.map((e) => e.round_trip_ms)), bytes_up_median: med(L.map((e) => e.bytes_up)), saw: [...new Set(L.map((e) => (e.payload.layers[0].boxes[0] || {}).label || "none"))], authority: [...new Set(L.map((e) => e.authority))] };
}
out.errors = errs.slice(0, 4); console.log(JSON.stringify(out, null, 1)); await b.close();
