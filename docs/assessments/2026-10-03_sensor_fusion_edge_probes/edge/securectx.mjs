// Does a page served over plain http from a LAN address get the camera? (a phone opening the Pi's page)
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
for (const url of ["http://127.0.0.1:8525/", "http://192.0.2.2:8525/"]) {
  const ctx = await b.newContext({ permissions: ["camera"] }); const p = await ctx.newPage();
  await p.goto(url, { waitUntil: "domcontentloaded" });
  const r = await p.evaluate(async () => { const out = { isSecureContext: self.isSecureContext, hasMediaDevices: !!navigator.mediaDevices, webgpu: !!navigator.gpu, crypto_subtle: !!(self.crypto && crypto.subtle) };
    try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); out.camera = 'OPEN ' + s.getVideoTracks()[0].label; s.getTracks().forEach((t) => t.stop()); } catch (e) { out.camera = 'FAILED: ' + (e && e.message || e); }
    try { await fetch('/models'); out.models = 'reachable'; } catch (e) { out.models = 'no'; } return out; });
  console.log(url, JSON.stringify(r)); await ctx.close();
}
await b.close();
