#!/usr/bin/env node
// pdf-gate — THE PDF GATE for the /innovation deck export.
//
// WHY (operator, 2026-07-29): the ⎙ PDF button shipped "verified" and produces FOUR pages instead of 21,
// with a third-scale cover in the corner and body text running off the sheet. The #4 probe that passed it
// counted 21 DOM nodes it BELIEVED were pages. It never asked the browser to make a PDF. Counting your own
// intention is not verification — this script asserts on the ARTIFACT, the actual bytes Chromium emits.
//
//   cd frontend && npm run build && node scripts/pdf-gate.mjs
//   KEEP=1 node scripts/pdf-gate.mjs     # also write the PDF to docs/feedback/shots/deck.pdf
//
// Server + Chromium resolution are lifted from scripts/slide-shots.mjs so there is ONE way this repo drives
// a browser. Exit 0 only when the real export is correct.

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const SHOT_DIR = resolve(ROOT, "..", "docs", "feedback", "shots");
const PORT = Number(process.env.PDF_PORT || 4650);
const PROJECT = process.env.PROJECT || "PRJ-23";

// The deck is a cover + every slide in SLIDE_SCHEMA. Read the count from the schema rather than hardcoding
// 21, so adding a slide cannot silently make the gate assert the wrong number.
const { SLIDE_SCHEMA } = await import("../lib/innovation-data.ts");
const EXPECT_PAGES = SLIDE_SCHEMA.length + 1;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp", ".woff2": "font/woff2" };
const serve = () => createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let f = join(OUT, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); } catch { f = join(OUT, p.replace(/\/$/, "") + ".html"); }
    const body = await readFile(f);
    res.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404).end("nf"); }
}).listen(PORT);

async function launch() {
  const { chromium } = await import("playwright");
  const candidates = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].filter(Boolean);
  let executablePath;
  for (const c of candidates) { try { await stat(c); executablePath = c; break; } catch {} }
  return chromium.launch(executablePath ? { executablePath } : {});
}

// Page count straight from the PDF's own object table. No dependency: a page object is `/Type /Page` not
// followed by `s` (which would be the /Pages tree node).
const pdfPageCount = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page(?![s])/g) || []).length;

await new Promise((r) => serve().once("listening", r));
console.log(`pdf-gate · ${PROJECT} · expecting ${EXPECT_PAGES} pages (cover + ${SLIDE_SCHEMA.length} slides) at 1600x900 landscape`);

const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 } });
await ctx.addInitScript(() => {
  try { sessionStorage.setItem("innovation-unlocked", "1"); } catch {}
  Element.prototype.requestFullscreen = function () { return Promise.resolve(); };
});
const page = await ctx.newPage();
const failures = [];

await page.goto(`http://127.0.0.1:${PORT}/innovation/`, { waitUntil: "networkidle", timeout: 30000 });
await page.getByRole("button", { name: "Gate Requirements" }).first().click();
await page.locator('select:has(option[value^="PRJ-"])').first().selectOption(PROJECT);
await page.getByRole("button", { name: /Open slide show/ }).first().click();
await page.getByRole("button", { name: /Present/ }).first().click();
await page.waitForSelector("[data-slide-canvas]", { timeout: 15000 });

// Mount the print stack the same way a real Ctrl-P does — through the app's own beforeprint listener, not
// by reaching into React state. If that listener ever breaks, this gate must break with it.
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await page.waitForTimeout(800);

const domPages = await page.evaluate(() => document.querySelectorAll(".slide-print-page").length);

const buf = await page.pdf({ width: "1600px", height: "900px", landscape: true, printBackground: true,
  preferCSSPageSize: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
const pages = pdfPageCount(buf);

if (process.env.KEEP) { await mkdir(SHOT_DIR, { recursive: true }); await writeFile(join(SHOT_DIR, "deck.pdf"), buf); }

console.log(`  DOM print-pages: ${domPages}   REAL PDF pages: ${pages}   bytes: ${buf.length}`);
if (domPages !== EXPECT_PAGES) failures.push(`the print stack mounted ${domPages} pages, expected ${EXPECT_PAGES}`);
if (pages !== EXPECT_PAGES) failures.push(`THE ARTIFACT HAS ${pages} PAGES, expected ${EXPECT_PAGES} — this is the defect the DOM count could not see`);

// ── Geometry, measured in the PRINT rendering rather than on screen ─────────────────────────
// preferCSSPageSize means the @page box governs; every sheet must fill it, and nothing may sit outside it.
await page.emulateMedia({ media: "print" });
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await page.waitForTimeout(600);
const geo = await page.evaluate(() => {
  const sheets = [...document.querySelectorAll(".slide-print-page")];
  const out = sheets.slice(0, 3).concat(sheets.slice(-1)).map((el, i) => {
    const r = el.getBoundingClientRect();
    const canvas = el.querySelector("[data-slide-canvas]");
    const cr = canvas ? canvas.getBoundingClientRect() : null;
    // widest painted element relative to the sheet — catches body text running off the page
    let widest = 0;
    for (const n of el.querySelectorAll("*")) {
      const b = n.getBoundingClientRect();
      if (b.width > 0) widest = Math.max(widest, b.right - r.left);
    }
    return { i, sheet: [Math.round(r.width), Math.round(r.height)],
      canvas: cr ? [Math.round(cr.width), Math.round(cr.height)] : null, widest: Math.round(widest) };
  });
  return out;
});
for (const g of geo) {
  if (!g.canvas) { failures.push(`sheet ${g.i}: no [data-slide-canvas] inside the print page`); continue; }
  if (g.sheet[0] !== 1600 || g.sheet[1] !== 900) failures.push(`sheet ${g.i}: print page is ${g.sheet[0]}x${g.sheet[1]}, expected 1600x900`);
  // The cover was rendering at roughly a third scale in a corner — the canvas must FILL its sheet.
  if (g.canvas[0] < 1590 || g.canvas[1] < 890) failures.push(`sheet ${g.i}: canvas is ${g.canvas[0]}x${g.canvas[1]}, does not fill the 1600x900 sheet`);
  if (g.widest > 1610) failures.push(`sheet ${g.i}: content runs ${g.widest - 1600}px past the right edge of the sheet`);
}
console.log("  geometry:", geo.map((g) => `#${g.i} sheet ${g.sheet.join("x")} canvas ${g.canvas ? g.canvas.join("x") : "MISSING"} widest ${g.widest}`).join(" | "));

await browser.close();
console.log(`\n${failures.length ? "✗" : "✓"} pdf-gate`);
failures.forEach((f) => console.error(`  ✗ ${f}`));
process.exit(failures.length ? 1 : 0);
