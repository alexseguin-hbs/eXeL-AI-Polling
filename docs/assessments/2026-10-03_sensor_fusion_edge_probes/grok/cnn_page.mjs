// The built /SensorFusion-2525/ page (frontend/out), as a guest, fake camera: menu 2 -> SENSOR 1 ON -> what the person reads.
// CDN and model hosts answered from the same local mirrors as run.mjs. CNN=<file> swaps /sensor-fusion/cnn.js for a scratch copy.
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
import fs from "node:fs"; import path from "node:path";
const OUT = "/home/user/eXeL-AI-Polling/frontend/out", NM = process.env.SCRATCH + "/tfjsprobe/node_modules/@tensorflow", UP = "/home/user/de-risking-strategies/sensorfusion";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${process.env.SCRATCH}/edge/cam.y4m`] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ["camera"] });
await ctx.addInitScript(() => { try { localStorage.setItem("sf2525-guest", "1"); } catch {} });
const p = await ctx.newPage(); const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
const ct = (f) => f.endsWith(".wasm") ? "application/wasm" : f.endsWith(".js") ? "text/javascript" : f.endsWith(".css") ? "text/css" : f.endsWith(".html") ? "text/html" : f.endsWith(".png") ? "image/png" : f.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream";
await p.route("**/*", async (route) => {
  const u = new URL(route.request().url()); let f = null;
  const m = u.hostname === "cdn.jsdelivr.net" && u.pathname.match(/^\/npm\/@tensorflow\/([^@]+)@[^/]+\/(.*)$/);
  if (m) f = path.join(NM, m[1], m[2]);
  else if (u.hostname === "raw.githubusercontent.com") f = path.join(UP, u.pathname.replace(/^\/De-Risking-Strategies\/SensorFusion\/master\//, ""));
  else if (u.hostname === "site.local") {
    if (u.pathname === "/sensor-fusion/cnn.js" && process.env.CNN) f = process.env.CNN;
    else { f = path.join(OUT, decodeURIComponent(u.pathname)); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html"); }
  }
  if (f && fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": ct(f), "access-control-allow-origin": "*" } });
  return route.fulfill({ status: 404, body: "" });
});
await p.goto("https://site.local/SensorFusion-2525/");
await p.getByText("Sensor Fusion, no Coral").first().click({ timeout: 20000 });
await p.getByText(/SENSOR 1:/).first().click({ timeout: 20000 });
const seen = new Set(); const t0 = Date.now();
while (Date.now() - t0 < 25000) { const t = await p.evaluate(() => [...document.querySelectorAll("p")].map((x) => x.textContent).find((x) => /detect\.tflite|model|malloc|round|FPS|Cannot|not a function/i.test(x || "")) || ""); if (t) seen.add(t); await p.waitForTimeout(500); }
const diag = await p.evaluate(async () => {
  const c = document.querySelector("canvas"), v = document.querySelector("video");
  let ink = -1; if (c && c.width) { const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; ink = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) ink++; }
  let direct = null; try { const s = await window.SFCnn.load("demo90"); const r = await window.SFCnn.detect(s, v); direct = r.hits.length + " hits"; } catch (e) { direct = "error: " + e.message; }
  return { SFCnn: !!window.SFCnn, canvas: c ? [c.width, c.height, getComputedStyle(c).display, c.getBoundingClientRect().height] : null, video: v ? [v.readyState, v.videoWidth, v.videoHeight] : null, inkPixels: ink, direct };
});
console.log("diag:", JSON.stringify(diag));
await p.screenshot({ path: process.env.SHOT || "page.png" });
console.log("the person reads, in order:", JSON.stringify([...seen])); console.log("page errors:", errs.slice(0, 3));
await b.close();
