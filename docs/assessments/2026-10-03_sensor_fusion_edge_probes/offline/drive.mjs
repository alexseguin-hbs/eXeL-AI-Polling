// Online first, then the network is cut and the page reloaded. MODE=shipped: today's cnn.js (CDN + GitHub, answered from
// mirrors with the real hosts' cache headers). MODE=offline: same-origin files + a service worker that keeps them.
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
import fs from "node:fs"; import path from "node:path";
const MODE = process.env.MODE, PORT = process.env.PORT, URL0 = `http://127.0.0.1:${PORT}/SensorFusion-2525/`;
const NM = process.env.SCRATCH + "/tfjsprobe/node_modules/@tensorflow", UP = "/home/user/de-risking-strategies/sensorfusion";
const IMG = "data:image/jpeg;base64," + fs.readFileSync(process.env.SCRATCH + "/bench/img/zidane.jpg").toString("base64");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext(); const p = await ctx.newPage();
if (MODE === "shipped") await ctx.route(/cdn\.jsdelivr\.net|raw\.githubusercontent\.com/, (route) => { const u = new URL(route.request().url());
  const m = u.hostname === "cdn.jsdelivr.net" && u.pathname.match(/^\/npm\/@tensorflow\/([^@]+)@[^/]+\/(.*)$/);
  const f = m ? path.join(NM, m[1], m[2]) : path.join(UP, u.pathname.replace(/^\/De-Risking-Strategies\/SensorFusion\/master\//, ""));
  if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: "" });
  return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "access-control-allow-origin": "*", "content-type": f.endsWith(".wasm") ? "application/wasm" : f.endsWith(".js") ? "text/javascript" : "application/octet-stream",
    "cache-control": m ? "public, max-age=31536000, immutable" : "max-age=300" } }); });
const detect = () => p.evaluate(async (src) => { try {
  await new Promise((ok, no) => { const t = Date.now(); (function w() { if (window.SFCnn) return ok(); if (Date.now() - t > 20000) return no(new Error("no model runner")); setTimeout(w, 200); })(); });
  const img = new Image(); img.src = src; await img.decode(); const s = await window.SFCnn.load("head"); const r = await window.SFCnn.detect(s, img);
  return "OK " + r.hits.map((h) => h.name + " " + Math.round(h.score * 100) + "%").join(", ");
} catch (e) { return "FAIL " + String(e && e.message || e).slice(0, 120); } }, IMG);
const ensureRunner = () => p.evaluate(() => new Promise((ok) => { if (window.SFCnn) return ok(); const s = document.createElement("script"); s.src = "/sensor-fusion/cnn.js"; s.onload = ok; s.onerror = ok; document.head.appendChild(s); }));
await p.goto(URL0); await ensureRunner();
if (MODE === "offline") { await p.evaluate(async () => { await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready; });
  await p.reload(); await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 }); await ensureRunner(); }
console.log(MODE, "online :", await detect());
if (MODE === "shipped") await ctx.unroute(/cdn\.jsdelivr\.net|raw\.githubusercontent\.com/);
await ctx.setOffline(true);
let page = "loaded"; try { await p.reload({ timeout: 15000 }); } catch (e) { page = "RELOAD FAILED: " + String(e.message).split("\n")[0].slice(0, 90); }
const title = await p.title().catch(() => "?"); console.log(MODE, "offline: page", page, "| title:", JSON.stringify(title));
if (page === "loaded") { await ensureRunner(); console.log(MODE, "offline:", await detect()); }
await p.screenshot({ path: `offline_${MODE}.png` }); await b.close();
