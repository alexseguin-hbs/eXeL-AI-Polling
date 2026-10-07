#!/usr/bin/env node
/**
 * cube-sim-live-check — Cubes 1-10 behind the easter-egg unlock, SIM and LIVE, driven as a person drives them.
 *
 * Operator, 2026-10-07: "review Cube 1-10 behind easter code unlock; these need to be working and should be
 * similar to understand if process works as aLive. So basically test SIM / LIVE FOR EACH CUBE".
 *
 *   SIM  = the static export as deployed (NEXT_PUBLIC_MOCK_MODE default → lib/mock-data.ts answers /sim/*).
 *   LIVE = a static export built with NEXT_PUBLIC_MOCK_MODE=false, talking to the REAL FastAPI backend, which this
 *          script starts itself (uvicorn, backend/). Build it once with:
 *            NEXT_PUBLIC_MOCK_MODE=false NEXT_PUBLIC_API_URL=http://127.0.0.1:8011/api/v1 npx next build
 *          then move `out/` aside and pass it as --live-out.
 *
 * For every run: phone width (390), Settings → theme Cyan → Sunset → Violet → the badge blinks → click it →
 * Simulation Mode → the seeds 웃 ◬ ♡ → Cube 10 admin code → CUBE SIM → /sim. Then, per Cube 1-9: pick it, read the
 * LIVE-code blocks, the Input · Functions · Output, the LIVE code panel, the SSSES card, the council preview, Check
 * In → Submit to Simulate, and read the LIVE (baseline) / YOUR VERSION columns + verdict. Cube 10 = the Admin
 * Console (the simulator's own end-to-end run). Every console error and page error is recorded per cube.
 * With both modes, the two runs are compared field by field: same blocks, same I·F·O, same code, same columns.
 *
 * Run:  npm run build && node scripts/cube-sim-live-check.mjs [--sim-out out] [--live-out DIR] [--shots DIR]
 */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const SIM_OUT = resolve(ROOT, arg("sim-out", "out"));
const LIVE_OUT = arg("live-out", "") ? resolve(arg("live-out")) : "";
const SHOTS = resolve(arg("shots", join(ROOT, "..", ".cubesim-shots")));
const API_PORT = Number(arg("api-port", 8011));
const W = Number(arg("width", 390));
// The Cube 10 admin demo code. ⚠ SIM and LIVE DISAGREE: the backendless SIM accepts 94561230
// (lib/easter-egg-context.tsx), the real backend 96541230 (backend/app/config.py, docs/CUBE_10_PLAN.md).
// Each run types the code its own side accepts, and the report names the mismatch.
const ADMIN_CODE = { sim: "94561230", live: "96541230" };

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp",
  ".woff2": "font/woff2", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".mjs": "text/javascript" };
// Same resolver as settings-egg-gate: `/session` AND `/session/`, and the RSC payload served as text so the
// client router navigates softly (a hard reload would wipe the in-memory easter-egg state).
function serve(dir, port) {
  return new Promise((ok) => {
    const srv = createServer(async (req, res) => {
      try {
        const p = decodeURIComponent(req.url.split("?")[0]);
        let f = join(dir, p);
        try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); }
        catch {
          const alt = join(dir, p.replace(/\/$/, "") + ".html");
          try { await stat(alt); f = alt; } catch { f = join(dir, p.replace(/\/$/, ""), "index.html"); }
        }
        const body = await readFile(f);
        res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
        res.end(body);
      } catch { res.writeHead(404).end("nf"); }
    }).listen(port, () => ok(srv));
  });
}

async function startBackend(origin) {
  const proc = spawn("python3", ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(API_PORT), "--log-level", "warning"], {
    cwd: resolve(ROOT, "..", "backend"),
    env: { ...process.env, PYTHONPATH: ".", ALLOWED_ORIGINS: origin },
    stdio: ["ignore", "ignore", "pipe"],
  });
  let errTail = ""; proc.stderr.on("data", (d) => { errTail = (errTail + d).slice(-4000); });
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(`http://127.0.0.1:${API_PORT}/api/v1/sim/cubes`); if (r.ok) return { proc, tail: () => errTail }; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  proc.kill();
  throw new Error(`backend did not start on :${API_PORT}\n${errTail}`);
}

async function launch() {
  const { chromium } = await import("playwright");
  const candidates = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean);
  let executablePath;
  for (const c of candidates) { try { await stat(c); executablePath = c; break; } catch {} }
  return chromium.launch(executablePath ? { executablePath } : {});
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The unlock, as a person does it, on a phone. Returns notes on each step. */
async function unlock(page, base, notes) {
  await page.goto(`${base}/session/?id=DEMO2026&sim=1`, { waitUntil: "networkidle", timeout: 45000 });
  // Can a thumb reach the navbar gear at phone width? (inside the viewport AND nothing painted over it)
  const gear = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Settings" || x.title === "Settings");
    if (!b) return { found: false };
    const r = b.getBoundingClientRect();
    const top = document.elementFromPoint(Math.min(r.left + r.width / 2, innerWidth - 1), r.top + r.height / 2);
    return { found: true, x: Math.round(r.left), w: innerWidth, scrollW: document.documentElement.scrollWidth,
      reachable: r.right <= innerWidth && (b === top || b.contains(top)) };
  });
  // Playwright's trial tap = a real thumb: in view, stable, and not covered by another element.
  const trial = await page.getByRole("button", { name: "Settings" }).first().click({ trial: true, timeout: 3000 }).then(() => true, (e) => String(e.message).match(/<[^>]+>[^\n]*intercepts pointer events/)?.[0] || "not tappable");
  if (trial !== true) { gear.reachable = false; gear.coveredBy = trial; }
  notes.push(`Settings gear at ${W}px: ${gear.coveredBy ? `COVERED (${gear.coveredBy.slice(0, 140)}) · ` : ""}${gear.found ? (gear.reachable ? "reachable" : `UNREACHABLE (x=${gear.x}, viewport ${gear.w}, page ${gear.scrollW} wide, no sideways scroll)`) : "not rendered"}`);
  if (!gear.reachable) {
    await page.screenshot({ path: join(SHOTS, `${notes.mode || "run"}-00-gear-offscreen-${W}.png`) }).catch(() => {});
    await page.setViewportSize({ width: 1280, height: 800 });   // unlock where the gear is on screen, then back to phone
    notes.push("unlock performed at 1280px, workbench driven at phone width");
  }
  await page.getByRole("button", { name: "Settings" }).first().click();
  await page.getByRole("button", { name: "Settings" }).last().click();
  await page.waitForSelector("[data-settings-footer]", { timeout: 15000 });
  await page.evaluate(() => document.querySelector("[data-settings-footer]")?.scrollIntoView({ block: "end" }));
  for (const id of ["exel-cyan", "sunset", "violet"]) { await page.click(`[data-theme-preset="${id}"]`); await sleep(150); }
  await sleep(400);
  const blinking = await page.evaluate(() => /badge-blink/.test(document.querySelector("[data-settings-footer] [data-exel-badge] button")?.className || ""));
  notes.push(`badge blinking after Cyan→Sunset→Violet: ${blinking}`);
  await page.click("[data-settings-footer] [data-exel-badge] button");
  await page.waitForSelector("[data-sim-overlay]", { timeout: 15000 });
  notes.push("Simulation Mode overlay mounted");
  // Cube 10 admin: the seeds 웃 → ◬ → ♡ (hi, ai, si), then the admin code.
  for (const s of ["hi", "ai", "si"]) { await page.click(`[data-cube10-icon="${s}"]`, { force: true }); await sleep(150); }
  const prompt = await page.$("[data-cube10-code]");
  notes.push(`Cube 10 code prompt after 웃◬♡: ${!!prompt}`);
  if (prompt) {
    await page.fill("[data-cube10-code]", ADMIN_CODE[notes.mode] || ADMIN_CODE.sim);
    notes.push(`typed admin code ${ADMIN_CODE[notes.mode]}`);
    await page.click("[data-cube10-verify]");
    await sleep(1200);
  }
  const level = await page.$eval("[data-cube10-level]", (e) => e.textContent.trim()).catch(() => "none");
  notes.push(`Cube 10 access level: ${level}`);
  await page.getByRole("button", { name: /CUBE SIM/ }).first().click();
  if (!gear.reachable) await page.setViewportSize({ width: W, height: 844 });
  await page.waitForURL(/\/sim\/?/, { timeout: 15000 });
  await page.waitForSelector("[data-cube-sim-select]", { timeout: 20000 }).catch(() => {});
  return level;
}

/** Everything the workbench shows for the current cube. */
async function readCube(page) {
  return page.evaluate(() => {
    const txt = (e) => (e?.textContent || "").replace(/\s+/g, " ").trim();
    const sections = [...document.querySelectorAll("[data-sim-section]")].map((b) => txt(b));
    const ifoGrid = [...document.querySelectorAll("div.grid")].find((g) => g.className.includes("sm:grid-cols-3") && g.querySelectorAll("ul").length === 3);
    const ifo = ifoGrid ? [...ifoGrid.children].map((c) => ({ title: txt(c.querySelector("div")), items: [...c.querySelectorAll("li")].map(txt) })) : [];
    const liveBadge = [...document.querySelectorAll("span")].find((s) => s.textContent.trim() === "LIVE");
    const livePanel = liveBadge?.closest(".rounded-lg");
    const liveCode = livePanel?.querySelector("pre")?.textContent || "";
    const liveHead = txt(livePanel?.querySelector("div"));
    const yours = document.querySelector("textarea")?.value || "";
    const sssesCard = [...document.querySelectorAll(".rounded-xl")].find((e) => /SSSES/i.test(e.textContent) && e.querySelector(".grid-cols-5"));
    const ssses = sssesCard ? [...sssesCard.querySelectorAll(".grid-cols-5 > div")].map((d) => txt(d)) : [];
    const sssesMeta = sssesCard ? txt(sssesCard.querySelector(".font-mono")) : "";
    const err = txt([...document.querySelectorAll("div")].find((d) => d.className.includes("border-amber-500/40")));
    // What sticks out past a phone screen (outermost offenders only) — a page wider than the screen is a defect.
    const over = [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && !(e.parentElement && e.parentElement.getBoundingClientRect().right > innerWidth + 1))
      .slice(0, 4).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(" ").slice(0, 3).join(".")}→${Math.round(e.getBoundingClientRect().right)}`);
    return { sections, ifo, liveHead, liveCode, yours, ssses, sssesMeta, err, pageWidth: document.documentElement.scrollWidth, overflow: over };
  });
}

async function readVerdict(page) {
  return page.evaluate(() => {
    const txt = (e) => (e?.textContent || "").replace(/\s+/g, " ").trim();
    const title = [...document.querySelectorAll("div.text-xs.font-semibold")].find((d) => d.textContent.trim() === "LIVE (baseline)");
    if (!title) return null;
    const box = title.closest(".space-y-3");
    const cols = [...box.querySelector(".grid").children].map((c) => ({
      title: txt(c.querySelector("div")),
      fields: Object.fromEntries([...c.querySelectorAll(".grid > div")].map((d) => [txt(d.children[0]), txt(d.children[1])])),
    }));
    const decision = txt([...box.children].find((d) => d.className.includes("text-sm")));
    const optimization = txt([...box.querySelectorAll(".rounded-lg.border.p-3")].find((d) => /efficiency/.test(d.textContent))?.querySelector("div"));
    return { cols, decision, optimization };
  });
}

async function clickText(page, text) {
  const b = page.getByRole("button", { name: text }).first();
  await b.scrollIntoViewIfNeeded();
  await b.click();
}

async function runMode(browser, mode, dir, port) {
  const base = `http://127.0.0.1:${port}`;
  const ctx = await browser.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  let bucket = "unlock";
  page.on("console", (m) => { if (m.type() === "error") errors.push({ cube: bucket, kind: "console", text: m.text().slice(0, 300) }); });
  page.on("pageerror", (e) => errors.push({ cube: bucket, kind: "pageerror", text: String(e.message).slice(0, 300) }));
  page.on("requestfailed", (r) => { if (!/\.(mp3|wav)$/.test(r.url())) errors.push({ cube: bucket, kind: "requestfailed", text: `${r.method()} ${r.url()} ${r.failure()?.errorText}` }); });
  page.on("response", (r) => { if (r.status() >= 400 && /\/api\//.test(r.url())) errors.push({ cube: bucket, kind: `http ${r.status()}`, text: `${r.request().method()} ${r.url()}` }); });

  const notes = []; notes.mode = mode;
  const level = await unlock(page, base, notes);
  await page.screenshot({ path: join(SHOTS, `${mode}-00-sim-landing.png`) });
  const cubes = {};
  for (let id = 1; id <= 9; id++) {
    bucket = `cube${id}`;
    const r = { id };
    const sel = await page.$(`[data-cube-sim-select="${id}"]`);
    if (!sel) { r.error = "cube button not rendered"; cubes[id] = r; continue; }
    await sel.scrollIntoViewIfNeeded(); await sel.click();
    await page.waitForSelector("[data-sim-section]", { timeout: 20000 }).catch(() => {});
    await sleep(mode === "live" ? 2500 : 1500);   // contract → source / metrics / council fan-out
    r.before = await readCube(page);
    await page.screenshot({ path: join(SHOTS, `${mode}-cube${id}-1-live-code.png`), fullPage: false,
      clip: undefined }).catch(() => {});
    // the LIVE code panel itself (element shot — the code the cube runs)
    const livePanel = page.locator("span", { hasText: /^LIVE$/ }).first().locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
    await livePanel.scrollIntoViewIfNeeded().catch(() => {});
    await livePanel.screenshot({ path: join(SHOTS, `${mode}-cube${id}-2-code-panel.png`) }).catch(() => {});
    await clickText(page, /Check In/);
    await sleep(mode === "live" ? 2500 : 900);
    await clickText(page, /Submit to Simulate/);
    await page.waitForFunction(() => [...document.querySelectorAll("div")].some((d) => d.textContent.trim() === "LIVE (baseline)"), null, { timeout: mode === "live" ? 60000 : 15000 }).catch(() => {});
    r.verdict = await readVerdict(page);
    r.after = await readCube(page);
    const vbox = page.locator("div.space-y-3", { hasText: "LIVE (baseline)" }).first();
    await vbox.scrollIntoViewIfNeeded().catch(() => {});
    await vbox.screenshot({ path: join(SHOTS, `${mode}-cube${id}-3-verdict.png`) }).catch(() => {});
    cubes[id] = r;
  }

  // Cube 10 — the simulator's own end-to-end run (Admin Console, admin unlock only).
  bucket = "cube10";
  const c10 = { id: 10, level };
  await page.evaluate(() => window.scrollTo(0, 0));
  const adminTab = page.getByRole("button", { name: "Admin Console" });
  c10.adminTab = await adminTab.count() > 0;
  if (c10.adminTab) {
    await adminTab.first().click();
    await sleep(500);
    c10.mode = await page.evaluate(() => [...document.querySelectorAll("span")].map((s) => s.textContent.trim()).find((t) => /self-contained|live backend/.test(t)) || "");
    const runBtn = page.getByRole("button", { name: /^Run|Simulate|Run simulation/i }).first();
    c10.runButton = await runBtn.count() > 0 ? (await runBtn.textContent()).trim() : "";
    if (c10.runButton) {
      await runBtn.click();
      // The run is over when the button stops saying "Running…" (200 responses through the api layer).
      await page.waitForFunction(() => ![...document.querySelectorAll("button")].some((b) => /Running/.test(b.textContent || "")), null, { timeout: 300000 }).catch(() => {});
      await sleep(mode === "live" ? 4000 : 2500);
      c10.result = await page.evaluate(() => {
        const t = document.body.innerText;
        const pick = (re) => (t.match(re) || [])[0] || "";
        const stat = (label) => { const el = [...document.querySelectorAll("span")].find((x) => x.children.length === 2 && x.children[0].textContent === label); return el ? el.children[1].textContent.trim() : ""; };
        return { finished: ![...document.querySelectorAll("button")].some((b) => /Running/.test(b.textContent || "")),
          error: (t.match(/Simulation failed[^\n]*|[^\n]*(Request refused|not found|Failed to fetch)[^\n]*/i) || [])[0] || "",
          responses: stat("Responses"), categories: stat("Categories"), topPriority: stat("Top priority"), replay: stat("Replay"),
          theme01: /Theme 01 · priorities/.test(t), theme02: /Theme 02 · sub-themes/.test(t) };
      });
    }
    await page.screenshot({ path: join(SHOTS, `${mode}-cube10-admin-console.png`), fullPage: true }).catch(() => {});
  }
  cubes[10] = c10;
  await ctx.close();
  return { mode, notes, level, cubes, errors };
}

function compare(a, b) {
  const rows = [];
  for (let id = 1; id <= 9; id++) {
    const x = a.cubes[id], y = b.cubes[id];
    const diff = [];
    const eq = (k, u, v) => { if (JSON.stringify(u) !== JSON.stringify(v)) diff.push(k); };
    eq("blocks", x.before?.sections, y.before?.sections);
    eq("input·functions·output", x.before?.ifo, y.before?.ifo);
    eq("LIVE code", x.before?.liveCode, y.before?.liveCode);
    eq("SSSES pillars (names)", (x.before?.ssses || []).map((s) => s.replace(/\d+$/, "")), (y.before?.ssses || []).map((s) => s.replace(/\d+$/, "")));
    eq("verdict columns", x.verdict?.cols?.map((c) => [c.title, Object.keys(c.fields)]), y.verdict?.cols?.map((c) => [c.title, Object.keys(c.fields)]));
    eq("decision", x.verdict?.decision?.replace(/replay: \w+/, ""), y.verdict?.decision?.replace(/replay: \w+/, ""));
    rows.push({ id, alike: diff.length === 0, diff });
  }
  return rows;
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────────────
await mkdir(SHOTS, { recursive: true });
const browser = await launch();
const results = [];
const simSrv = await serve(SIM_OUT, 4641);
try {
  results.push(await runMode(browser, "sim", SIM_OUT, 4641));
} finally { simSrv.close(); }
if (LIVE_OUT) {
  const liveSrv = await serve(LIVE_OUT, 4642);
  let be;
  try {
    be = await startBackend("http://127.0.0.1:4642");
    results.push(await runMode(browser, "live", LIVE_OUT, 4642));
  } finally { liveSrv.close(); be?.proc.kill(); }
}
await browser.close();

const report = { width: W, results, compare: results.length === 2 ? compare(results[0], results[1]) : null };
await writeFile(join(SHOTS, "report.json"), JSON.stringify(report, null, 1));

let failed = 0;
for (const r of results) {
  console.log(`\n══ ${r.mode.toUpperCase()} ══  ${r.notes.join(" · ")}`);
  for (let id = 1; id <= 9; id++) {
    const c = r.cubes[id];
    const v = c.verdict;
    const okRun = !!(c.before?.sections?.length && c.before?.liveCode && !/unavailable|not baked/.test(c.before.liveCode) && v && v.cols?.every((k) => Object.keys(k.fields).length > 0));
    const errs = r.errors.filter((e) => e.cube === `cube${id}`);
    if (!okRun || errs.length) failed++;
    console.log(`  cube ${id}: ${okRun ? "✓" : "✗"} ${c.before?.sections?.length ?? 0} blocks · I/F/O ${(c.before?.ifo || []).map((k) => k.items.length).join("/")} · code ${c.before?.liveCode?.length ?? 0} ch · SSSES ${c.before?.ssses?.length ?? 0} · ` +
      `columns ${(v?.cols || []).map((k) => `${k.title}[${Object.keys(k.fields).join(",")}]`).join(" vs ")} · ${v?.optimization || ""} · ${v?.decision?.slice(0, 60) || c.before?.err || c.error || "no verdict"}` +
      (errs.length ? `\n      errors: ${errs.map((e) => `${e.kind}: ${e.text}`).join(" | ")}` : ""));
  }
  const pw = r.cubes[1]?.before;
  if (pw) console.log(`  /sim page width at ${W}px: ${pw.pageWidth}${pw.pageWidth > W ? ` — WIDER THAN THE SCREEN: ${(pw.overflow || []).join(" · ")}` : " ✓"}`);
  const c10 = r.cubes[10];
  console.log(`  cube 10: access=${c10.level} adminTab=${c10.adminTab} mode="${c10.mode || ""}" run="${c10.runButton || ""}" → ${JSON.stringify(c10.result || {})}`);
  const e10 = r.errors.filter((e) => e.cube === "cube10" || e.cube === "unlock");
  if (e10.length) console.log(`      unlock/cube10 errors: ${e10.map((e) => `${e.kind}: ${e.text}`).slice(0, 8).join(" | ")}`);
}
if (report.compare) {
  console.log("\n══ SIM vs LIVE ══");
  for (const row of report.compare) { if (!row.alike) failed++; console.log(`  cube ${row.id}: ${row.alike ? "alike ✓" : "DIFFERENT ✗ — " + row.diff.join(", ")}`); }
}
console.log(`\nscreenshots + report.json → ${SHOTS}`);
process.exit(failed ? 1 : 0);
