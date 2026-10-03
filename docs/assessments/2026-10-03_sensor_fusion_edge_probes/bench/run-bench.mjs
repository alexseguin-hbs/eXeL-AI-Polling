import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { join, extname } from "node:path";
import { chromium } from "/home/user/eXeL-AI-Polling/frontend/node_modules/playwright/index.mjs";
const SP = "$SCRATCH", NM = SP + "/tfjsprobe/node_modules", B = SP + "/bench";
const MIME = { ".js": "text/javascript", ".mjs": "text/javascript", ".html": "text/html", ".wasm": "application/wasm", ".json": "application/json" };
const srv = createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"), p = decodeURIComponent(u.pathname);
  const f = p.startsWith("/nm/") ? join(NM, p.slice(4)) : p.startsWith("/b/") ? join(B, p.slice(3)) : join(B, "bench.html");
  const coi = (req.headers.referer || req.url).includes("coi=1");
  try { const body = await readFile(f); res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream", ...(coi ? { "Cross-Origin-Opener-Policy": "same-origin", "Cross-Origin-Embedder-Policy": "require-corp", "Cross-Origin-Resource-Policy": "same-origin" } : {}) }); res.end(body); }
  catch { res.writeHead(404).end("nf"); }
});
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const port = srv.address().port;
const cases = (process.argv[2] || "tfjs-1t,litert-wasm,mediapipe").split(",");
const throttle = Number(process.argv[3] || 1);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--enable-unsafe-webgpu", "--enable-features=Vulkan,WebAssemblyJSPromiseIntegration", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ref = JSON.parse(await readFile(B + "/ref.json", "utf8"));
const summary = [];
for (const c of cases) {
  const [rt, ...flags] = c.split("+"); const qs = new URLSearchParams({ rt }); for (const f of flags) qs.set(f, "1");
  const p = await b.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message.slice(0, 200))); p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });
  if (throttle > 1) { const cdp = await p.context().newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle }); }
  await p.goto(`http://127.0.0.1:${port}/?${qs}`);
  await p.waitForFunction(() => document.title === "done", null, { timeout: Number(process.env.CASE_MS || 90000) }).catch(() => {});
  const out = await p.evaluate(() => window.__OUT);
  const row = { case: c, throttle, coi: out && out.coi, webgpu: out && out.webgpu, error: out && out.error, models: {} };
  for (const [m, r] of Object.entries((out && out.models) || {})) {
    if (r.error) { row.models[m] = { error: r.error }; continue; }
    // match each reference box (score > 0.3) to the browser box of the same class with the largest overlap
    const iou = (a, b) => { const iy = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), ix = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])); const i = ix * iy, u = (a[2]-a[0])*(a[3]-a[1]) + (b[2]-b[0])*(b[3]-b[1]) - i; return u > 0 ? i / u : 0; };
    let refBoxes = 0, matched = 0, ds = [], same = 0, nmis = 0;
    for (const id of ref.ids) { const a = ref.ref[m][id], x = r.res[id]; if (!x) continue; if (a.n !== x.n) nmis++; let ok = true;
      for (let i = 0; i < a.n; i++) { if (a.s[i] <= 0.3) continue; refBoxes++; let best = 0, bj = -1;
        for (let j = 0; j < x.n; j++) { if (Math.round(x.c[j]) !== Math.round(a.c[i])) continue; const v = iou(a.b[i], x.b.slice(j * 4, j * 4 + 4)); if (v > best) { best = v; bj = j; } }
        if (best >= 0.9) { matched++; ds.push(Math.abs(a.s[i] - x.s[bj])); if (Math.abs(a.s[i] - x.s[bj]) > 0.05) ok = false; } else ok = false; }
      if (ok) same++; }
    ds.sort((p, q) => p - q);
    const maxds = ds.length ? ds[ds.length - 1] : 0, maxdb = ds.length ? ds[Math.floor(ds.length / 2)] : 0;
    row.models[m] = { load_ms: r.load_ms, ms_median: r.ms_median, pictures_same: `${same}/${ref.ids.length}`, boxes_matched: `${matched}/${refBoxes}`, count_mismatch: nmis, max_score_diff: +maxds.toFixed(4), median_score_diff: +maxdb.toFixed(4), io: r.inputs ? { in: r.inputs, out: r.outputs } : undefined };
  }
  row.errors = errs.slice(0, 3); summary.push(row); await p.close();
}
console.log(JSON.stringify(summary, null, 1)); await b.close(); srv.close();
