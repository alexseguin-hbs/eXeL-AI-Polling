// Runs Grok's UNMODIFIED frontend/public/sensor-fusion/cnn.js the way /SensorFusion-2525 does (SFCnn.load(id) then
// SFCnn.detect(session, picture)). jsDelivr and raw.githubusercontent are answered from local copies of the SAME
// package versions and the SAME model folders, file for file; a path the CDN would not have is a 404 here too.
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
import fs from "node:fs"; import path from "node:path";
const NM = process.env.SCRATCH + "/tfjsprobe/node_modules/@tensorflow", UP = "/home/user/de-risking-strategies/sensorfusion";
const CNN = process.env.CNN || "/home/user/eXeL-AI-Polling/frontend/public/sensor-fusion/cnn.js", IMG = process.env.SCRATCH + "/bench/img/zidane.jpg";
const ids = (process.argv[2] || "demo90,head,deer,tree").split(",");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage(); const log = [], miss = [];
p.on("console", (m) => log.push(m.type() + ": " + m.text().slice(0, 160))); p.on("pageerror", (e) => log.push("pageerror: " + String(e).slice(0, 200)));
const file = (f, ct) => fs.existsSync(f) && fs.statSync(f).isFile() ? { status: 200, body: fs.readFileSync(f), headers: { "content-type": ct, "access-control-allow-origin": "*" } } : null;
const ctype = (f) => f.endsWith(".wasm") ? "application/wasm" : f.endsWith(".js") ? "text/javascript" : f.endsWith(".jpg") ? "image/jpeg" : f.endsWith(".html") ? "text/html" : "application/octet-stream";
await p.route("**/*", async (route) => {
  const u = new URL(route.request().url()); let f = null;
  const m = u.hostname === "cdn.jsdelivr.net" && u.pathname.match(/^\/npm\/@tensorflow\/([^@]+)@[^/]+\/(.*)$/);
  if (m) f = path.join(NM, m[1], m[2]);
  else if (u.hostname === "raw.githubusercontent.com") f = path.join(UP, u.pathname.replace(/^\/De-Risking-Strategies\/SensorFusion\/master\//, ""));
  else if (u.hostname === "sf.local") f = u.pathname === "/" ? null : u.pathname === "/sensor-fusion/cnn.js" ? CNN : u.pathname === "/zidane.jpg" ? IMG : null;
  if (u.hostname === "sf.local" && u.pathname === "/") return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>t</title><img id=i src=/zidane.jpg><script src=/sensor-fusion/cnn.js></script>" });
  const r = f && file(f, ctype(f)); if (r) return route.fulfill(r);
  miss.push(u.href); return route.fulfill({ status: 404, body: "not found" });
});
await p.goto("https://sf.local/"); await p.waitForFunction(() => window.SFCnn && document.getElementById("i").complete, null, { timeout: 30000 });
for (const id of ids) {
  const r = await p.evaluate(async (id) => {
    const t0 = performance.now();
    try { const s = await Promise.race([window.SFCnn.load(id), new Promise((_, j) => setTimeout(() => j(new Error("load timeout 60 s")), 60000))]);
      const out = await window.SFCnn.detect(s, document.getElementById("i"));
      return { id, ok: true, ms: Math.round(performance.now() - t0), input: [s.height, s.width, s.dtype], hits: out.hits.map((h) => h.name + " " + Math.round(h.score * 100)) };
    } catch (e) { return { id, ok: false, ms: Math.round(performance.now() - t0), error: String(e && e.message || e).slice(0, 240) }; }
  }, id);
  console.log(JSON.stringify(r));
}
console.log("404s:", [...new Set(miss)].join("\n      ") || "none"); console.log("console:", log.slice(0, 12).join("\n         ") || "none");
await b.close();
