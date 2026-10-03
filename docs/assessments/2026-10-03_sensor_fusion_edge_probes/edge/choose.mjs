import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const thr of [1, 2, 4, 6]) {
  const ctx = await b.newContext(); const p = await ctx.newPage();
  if (thr > 1) { const cdp = await ctx.newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: thr }); }
  await p.goto("http://127.0.0.1:8525/"); await p.waitForFunction(() => window.__MODELS, null, { timeout: 30000 });
  const r = await p.evaluate(async () => { const img = new Image(); img.src = "/m/_probe/zidane640.jpg"; await img.decode(); return window.choosePath(img, "Demo90"); });
  console.log(`CPU x${thr}:`, JSON.stringify(r)); await ctx.close();
}
await b.close();
