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

// ── REAL PAPER, not a 1600x900 fantasy ───────────────────────────────────────────────────────
// The operator prints US Letter with 0.5in margins, in BOTH orientations. The old gate asked Chromium for a
// 1600x900 page — the exact assumption that was broken — so it could never see the clipped right edge that
// survived every previous fix. Printable box at 96dpi:
//   Letter landscape 11.0 x 8.5in - 1in margins ->  10.0in x 7.5in ->  960 x 720 px
//   Letter portrait   8.5 x 11.0in - 1in margins ->   7.5in x 10.0in -> 720 x 960 px
const PAPER = [
  { name: "Letter landscape", landscape: true,  wpx: 960, hpx: 720 },
  { name: "Letter portrait",  landscape: false, wpx: 720, hpx: 960 },
];

const open = async (pg) => {
  await pg.goto(`http://127.0.0.1:${PORT}/innovation/`, { waitUntil: "networkidle", timeout: 30000 });
  await pg.getByRole("button", { name: "Gate Requirements" }).first().click();
  await pg.locator('select:has(option[value^="PRJ-"])').first().selectOption(PROJECT);
  await pg.getByRole("button", { name: /Open slide show/ }).first().click();
  await pg.getByRole("button", { name: /Present/ }).first().click();
  await pg.waitForSelector("[data-slide-canvas]", { timeout: 15000 });
  // Mount the print stack through the app's OWN beforeprint listener — if that breaks, the gate breaks too.
  await pg.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await pg.waitForTimeout(700);
};

for (const paper of PAPER) {
  // Model the paper: lay the page out at the PRINTABLE width before printing. This is also the operator's
  // real condition on a phone, where the print tree inherits a narrow layout viewport.
  await page.setViewportSize({ width: paper.wpx, height: paper.hpx });
  // Navigate under SCREEN media — print CSS hides everything but the stack, so the app's own UI must still
  // be reachable to drive it. Switch to print only once the stack is mounted.
  await page.emulateMedia({ media: "screen" });
  await open(page);
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(400);

  const m = await page.evaluate(() => {
    const sheets = [...document.querySelectorAll(".slide-print-page")];
    let widest = 0, tallest = 0;
    for (const sh of sheets.slice(0, 4)) {
      const r = sh.getBoundingClientRect();
      tallest = Math.max(tallest, Math.round(r.height));
      for (const n of sh.querySelectorAll("*")) {
        const b = n.getBoundingClientRect();
        if (b.width > 0) widest = Math.max(widest, Math.round(b.right));
      }
    }
    // Carried over from the previous gate: every canvas must FILL its sheet. This is what caught the
    // third-scale cover, so the paper rewrite must not drop it.
    let worstFill = 1;
    for (const sh of sheets) {
      const r = sh.getBoundingClientRect(), c = sh.querySelector("[data-slide-canvas]");
      if (!c || !r.width) { worstFill = 0; continue; }
      const cr = c.getBoundingClientRect();
      worstFill = Math.min(worstFill, (cr.width / r.width) * (cr.height / Math.max(1, r.height)));
    }
    return { sheets: sheets.length, widest, tallest, worstFill: Math.round(worstFill * 100) / 100,
      sheetW: sheets[0] ? Math.round(sheets[0].getBoundingClientRect().width) : 0 };
  });

  const buf = await page.pdf({ format: "Letter", landscape: paper.landscape, printBackground: true,
    margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" } });
  const pages = pdfPageCount(buf);
  if (process.env.KEEP) { await mkdir(SHOT_DIR, { recursive: true }); await writeFile(join(SHOT_DIR, `deck-${paper.landscape ? "landscape" : "portrait"}.pdf`), buf); }

  console.log(`  ${paper.name.padEnd(17)} printable ${paper.wpx}x${paper.hpx}px · sheet ${m.sheetW}x${m.tallest}px · widest ${m.widest}px · fill ${Math.round(m.worstFill * 100)}% · REAL PDF pages ${pages}`);
  if (pages !== EXPECT_PAGES) failures.push(`${paper.name} — THE ARTIFACT HAS ${pages} PAGES, expected ${EXPECT_PAGES}`);
  // THE ASSERTION THAT DID NOT EXIST, and the reason the clipped right edge survived three fixes.
  if (m.widest > paper.wpx + 2) failures.push(`${paper.name} — content runs ${m.widest - paper.wpx}px past the ${paper.wpx}px printable width (right edge CLIPPED)`);
  if (m.sheetW > paper.wpx + 2) failures.push(`${paper.name} — the print sheet is ${m.sheetW}px wide, wider than the ${paper.wpx}px printable box`);
  if (m.sheets !== EXPECT_PAGES) failures.push(`${paper.name} — the stack mounted ${m.sheets} sheets, expected ${EXPECT_PAGES}`);
  if (m.worstFill < 0.98) failures.push(`${paper.name} — a canvas fills only ${Math.round(m.worstFill * 100)}% of its sheet (the third-scale cover defect)`);
}

// ── ENGINE COVERAGE — state it, never imply it ───────────────────────────────────────────────
// The operator prints from Chrome on iPhone. Chrome on iOS is NOT Chromium: Apple mandates WKWebView, so
// every iOS browser is WebKit. This gate drives Blink. Twice now a green Chromium run was allowed to imply
// the artifact was correct everywhere, and twice the operator found it broken. So the run says out loud
// which engine it verified and which it did not.
let webkitPages = null, webkitWhy = "";
try {
  const { webkit } = await import("playwright");
  const wb = await webkit.launch();
  const wctx = await wb.newContext({ viewport: { width: 960, height: 720 } });
  await wctx.addInitScript(() => { try { sessionStorage.setItem("innovation-unlocked", "1"); } catch {} });
  const wp = await wctx.newPage();
  await open(wp);
  // WebKit's page.pdf() is Chromium-only in Playwright; assert on the print-media LAYOUT instead, which is
  // where WebKit and Blink actually diverge (out-of-flow + transformed boxes are not fragmented by WebKit).
  await wp.emulateMedia({ media: "print" });
  await wp.waitForTimeout(400);
  const wm = await wp.evaluate(() => {
    const sheets = [...document.querySelectorAll(".slide-print-page")];
    let widest = 0, oof = 0, tx = 0;
    for (const sh of sheets) {
      const cs = getComputedStyle(sh);
      if (cs.position === "fixed" || cs.position === "absolute") oof++;
      for (let n = sh; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).transform !== "none") { tx++; break; }
      for (const n of sh.querySelectorAll("*")) { const b = n.getBoundingClientRect(); if (b.width > 0) widest = Math.max(widest, Math.round(b.right)); }
    }
    return { sheets: sheets.length, widest, oof, tx };
  });
  webkitPages = wm.sheets;
  console.log(`  WebKit           sheets ${wm.sheets} · widest ${wm.widest}px · out-of-flow sheets ${wm.oof} · transformed ancestors ${wm.tx}`);
  if (wm.sheets !== EXPECT_PAGES) failures.push(`WebKit — ${wm.sheets} print sheets, expected ${EXPECT_PAGES}`);
  if (wm.oof) failures.push(`WebKit — ${wm.oof} sheets are out of flow; WebKit does not fragment out-of-flow boxes`);
  if (wm.tx) failures.push(`WebKit — ${wm.tx} sheets sit under a transform; WebKit does not fragment inside transformed boxes`);
  if (wm.widest > 962) failures.push(`WebKit — content runs ${wm.widest - 960}px past the printable width`);
  await wb.close();
} catch (e) { webkitWhy = (e?.message || String(e)).split("\n")[0].slice(0, 110); }

if (webkitPages === null) {
  console.log(`\n  ⚠ WEBKIT UNVERIFIED — no WebKit build in this sandbox (/opt/pw-browsers has chromium only, and`);
  console.log(`    \`playwright install\` is forbidden here). Reason: ${webkitWhy}`);
  console.log(`    VERIFIED ENGINE: Blink (Chromium). UNVERIFIED ENGINE: WebKit — which is what Chrome on iOS,`);
  console.log(`    Safari and every iOS browser actually use. A green run above does NOT prove the operator's`);
  console.log(`    export is correct. The CSS is written to WebKit's stricter fragmentation rules (normal flow,`);
  console.log(`    no transforms, legacy break properties emitted) but that is reasoning, not measurement.`);
}

await browser.close();
console.log(`\n${failures.length ? "✗" : "✓"} pdf-gate`);
failures.forEach((f) => console.error(`  ✗ ${f}`));
process.exit(failures.length ? 1 : 0);
