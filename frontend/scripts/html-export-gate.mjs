// HTML EXPORT GATE (operator 2026-09-24): the Export menu's HTML option must produce ONE self-contained file that renders the cover and
// every slide with no control and no console error, under the 7.77 MB standalone ceiling, carrying the project's own text. Runs on
// the BUILT app (postbuild), the way a reader would open the file: from disk, in a fresh page.
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
const ROOT = resolve(new URL("..", import.meta.url).pathname), OUT = join(ROOT, "out");
const PORT = Number(process.env.HTML_GATE_PORT || 4699), PROJECT = process.env.PROJECT || "PRJ-34", CEIL = 7_770_000;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const srv = createServer(async (req, res) => { try { let p = decodeURIComponent(req.url.split("?")[0]); let f = join(OUT, p); try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); } catch { f = join(OUT, p.replace(/\/$/, "") + ".html"); } const body = await readFile(f); res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" }); res.end(body); } catch { res.writeHead(404).end("nf"); } }).listen(PORT);
let exe; for (const c of [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium"].filter(Boolean)) { try { await stat(c); exe = c; break; } catch {} }
if (!exe) { console.log("html-export: SKIPPED — no Chromium on this machine (the gate runs where Chromium exists: local builds and the Actions gate); this is a fourth state, not a pass"); srv.close(); process.exit(0); }
const { chromium } = await import("playwright");
const browser = await chromium.launch({ executablePath: exe });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, acceptDownloads: true });
await ctx.addInitScript(() => { try { sessionStorage.setItem("innovation-unlocked", "1"); } catch {} Element.prototype.requestFullscreen = function () { return Promise.resolve(); }; });
const page = await ctx.newPage();
const failures = [];
try {
  await page.goto(`http://127.0.0.1:${PORT}/innovation/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.getByRole("button", { name: "Gate Requirements" }).first().click();
  await page.locator('select:has(option[value^="PRJ-"])').first().selectOption(PROJECT);
  await page.getByRole("button", { name: /Open (Digital (Presentation )?Inputs?|slide show)/i }).first().click();
  await page.getByRole("button", { name: /Present/ }).first().click();
  await page.waitForSelector("[data-slide-canvas]", { timeout: 15000 });
  await page.getByRole("button", { name: "Export the deck as a PDF" }).first().click();
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 20000 }), page.getByRole("menuitem", { name: "Export the deck as HTML" }).first().click()]);
  const dir = join(ROOT, ".next", "html-export-gate"); await mkdir(dir, { recursive: true });
  const file = join(dir, dl.suggestedFilename()); await dl.saveAs(file);
  const bytes = (await stat(file)).size;
  if (bytes > CEIL) failures.push(`${dl.suggestedFilename()} is ${bytes} B — over the 7.77 MB standalone ceiling`);
  if (!/^PRJ-\d+_S1-S\d+_\d{4}-\d{2}-\d{2}\.html$/.test(dl.suggestedFilename())) failures.push(`unexpected file name ${dl.suggestedFilename()}`);
  const reader = await ctx.newPage(); const errs = [];
  reader.on("pageerror", (e) => errs.push(String(e.message || e))); reader.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await reader.goto("file://" + file, { waitUntil: "load", timeout: 30000 }); await reader.waitForTimeout(800);
  const r = await reader.evaluate(() => {
    const sheets = [...document.querySelectorAll("[data-slide-code]")];
    const text = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
    const body = (document.body.textContent || "").replace(/\s+/g, " ");
    return { sheets: sheets.length, codes: sheets.map((s) => s.getAttribute("data-slide-code")), buttons: document.querySelectorAll("button").length,
      thin: sheets.filter((s) => text(s).length < 200).map((s) => s.getAttribute("data-slide-code")), s1: text(sheets.find((s) => s.getAttribute("data-slide-code") === "S1") || document.body).slice(0, 400),
      // AG-1 (operator 2026-09-24): a founder's export shows no edit / system-interaction link. The " · ✎ " edit
      // suffix and "EDIT FINANCIALS" are LIVE-only ([data-noprint]); a survivor here is a dead link on paper.
      editLinks: ((body.match(/· ✎|EDIT FINANCIALS/gi)) || []).length, noprint: document.querySelectorAll("[data-noprint]").length,
      styled: getComputedStyle(document.querySelector("[data-slide-canvas]") || document.body).containerType, width: Math.round((document.querySelector(".slide-print-page") || document.body).getBoundingClientRect().width) };
  });
  if (r.sheets !== 20) failures.push(`the file carries ${r.sheets} sheets, expected 20 (cover + 19) — ${r.codes.join(",")}`);
  if (r.buttons) failures.push(`${r.buttons} <button> survived in the export — a document, not an app`);
  if (r.editLinks) failures.push(`${r.editLinks} edit / system-interaction link(s) survived in the export ("· ✎" / "EDIT FINANCIALS") — must be [data-noprint], live-only`);
  if (r.noprint) failures.push(`${r.noprint} [data-noprint] element(s) survived — the export strip did not run`);
  if (r.thin.length) failures.push(`thin sheets (< 200 chars): ${r.thin.join(",")}`);
  if (PROJECT === "PRJ-34" && !/CrisisCommand/.test(r.s1)) failures.push(`S1 does not carry the project's own text: "${r.s1.slice(0, 120)}"`);
  if (r.styled !== "size") failures.push(`the canvas lost its container-type (stylesheets not inlined?)`);
  if (errs.length) failures.push(`console/page errors in the exported file: ${errs.slice(0, 3).join(" | ").slice(0, 300)}`);
  console.log(`html-export · ${PROJECT} · ${dl.suggestedFilename()} · ${bytes} B · sheets ${r.sheets} · buttons ${r.buttons} · edit-links ${r.editLinks} · page width ${r.width}px · errors ${errs.length}`);
} catch (e) { failures.push(`could not export: ${String(e?.message || e).split("\n")[0].slice(0, 200)}`); }
await browser.close(); srv.close();
if (failures.length) { console.log("✗ html-export"); for (const f of failures) console.log("  ✗ " + f); process.exit(1); }
console.log("✓ html-export"); process.exit(0);
