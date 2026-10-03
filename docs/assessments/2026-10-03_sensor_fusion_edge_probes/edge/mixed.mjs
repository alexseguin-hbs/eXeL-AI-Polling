import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--no-proxy-server"] });
const ctx = await b.newContext({ ignoreHTTPSErrors: true, permissions: ["camera"] }); const p = await ctx.newPage(); const cons = [];
p.on("console", (m) => cons.push(m.text().slice(0, 180)));
await p.goto("https://192.0.2.2:8643/");
const r = await p.evaluate(async () => { const o = { isSecureContext: self.isSecureContext };
  try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); o.camera = "OPEN"; s.getTracks().forEach((t) => t.stop()); } catch (e) { o.camera = "FAILED " + e.message; }
  for (const u of ["http://192.0.2.2:8525/models", "http://127.0.0.1:8525/models"]) { try { const x = await fetch(u); o[u] = "HTTP " + x.status; } catch (e) { o[u] = "BLOCKED: " + e.message; } }
  return o; });
console.log(JSON.stringify(r, null, 1)); console.log("console:", cons.slice(0, 4)); await b.close();
