// Visit once online (the keeper fills), CLOSE the browser, reopen with the network cut, walk the real page:
// guest -> "Sensor Fusion, no Coral" -> SENSOR 1 on (fake camera) -> what the person reads, painted box pixels.
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
const URL0 = `http://127.0.0.1:${process.env.PORT}/SensorFusion-2525/`, DIR = process.env.SCRATCH + "/offline2/profile";
const args = ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", `--use-file-for-fake-video-capture=${process.env.SCRATCH}/edge/cam.y4m`];
const open = () => chromium.launchPersistentContext(DIR, { executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args, viewport: { width: 390, height: 844 }, permissions: ["camera"] });
let ctx = await open(); let p = ctx.pages()[0] || await ctx.newPage();
await p.addInitScript(() => { try { localStorage.setItem("sf2525-guest", "1"); } catch {} });
await p.goto(URL0); await p.evaluate(async () => { await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready; });
await p.reload(); await p.waitForTimeout(3000); const kept = await p.evaluate(async () => (await (await caches.open("sf-offline-v2")).keys()).length);
console.log("online visit: files kept on the device:", kept); await ctx.close();
ctx = await open(); await ctx.setOffline(true); p = ctx.pages()[0] || await ctx.newPage();
let ok = "loaded"; try { await p.goto(URL0, { timeout: 15000 }); } catch (e) { ok = "FAILED " + String(e.message).split("\n")[0].slice(0, 80); }
console.log("browser reopened, network cut: page", ok, "| online?", await p.evaluate(() => navigator.onLine).catch(() => "?"));
if (ok === "loaded") {
  await p.getByText("Sensor Fusion, no Coral").first().click({ timeout: 20000 }); await p.getByText(/SENSOR 1:/).first().click({ timeout: 20000 });
  const seen = new Set(); const t0 = Date.now();
  while (Date.now() - t0 < 20000) { const t = await p.evaluate(() => [...document.querySelectorAll("p")].map((x) => x.textContent).find((x) => /detect\.tflite|model|Cannot|not a function|stopped|start/i.test(x || "")) || ""); if (t) seen.add(t); await p.waitForTimeout(500); }
  const ink = await p.evaluate(() => { const c = document.querySelector("canvas"); if (!c || !c.width) return -1; const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
  console.log("the person reads:", JSON.stringify([...seen]), "| painted pixels:", ink); await p.screenshot({ path: "offline_cold.png" }); }
await ctx.close();
