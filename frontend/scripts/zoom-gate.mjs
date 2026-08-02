#!/usr/bin/env node
// zoom-gate — THE PINCH GATE for the /innovation Present-mode deck.
//
// WHY (operator, 2026-08-01, with three iPhone screenshots): "consider tabs at top separate from window with
// slide for zoom. These tabs when two finger released get really big and slide large."
//
// THE DEFECT, MEASURED before this gate existed. `useViewport` read `window.innerWidth/innerHeight`. On a
// desktop that is the LAYOUT viewport. On iOS it is the VISUAL viewport, which SHRINKS when you pinch. So a
// pinch fed a smaller viewport into `fit`, the sheet shrank in CSS px by exactly the factor the browser was
// magnifying by, the two cancelled, and the sheet never grew — while the chrome, sized in fixed px and not a
// function of `fit`, took the magnification in full:
//
//     pinch   iOS-reported viewport   fit      sheet CSS h   APPARENT sheet   APPARENT chrome
//      1x         390 x 844          0.2437      219.4          219 px           123 px
//      2x         195 x 422          0.1219      109.7          219 px           398 px      <- sheet FLAT
//      3x         130 x 281          0.0122       11.0           33 px           810 px      <- sheet SHRANK
//
// NO DESKTOP GATE COULD SEE THIS. On desktop Chromium `innerWidth` and `documentElement.clientWidth` are the
// same number, so tsc, 3358 locks, slide-shots and pdf-gate were all structurally incapable of observing it.
// That is what this script exists for.
//
// ⚠ THE EMULATION IS THE WHOLE TRICK, AND `setViewportSize` IS THE WRONG TOOL. It shrinks the layout viewport
// AND the visual viewport together, so a fixed reader would look just as broken as a broken one and the gate
// would not discriminate. iOS shrinks ONLY `innerWidth`/`innerHeight`. So we override exactly those two
// getters and leave `documentElement.clientWidth/Height` alone — which is precisely the divergence that
// exists on the operator's device and nowhere in this sandbox.
//
// THE ASSERTION IS THOTH'S PRODUCT, NOT A PIXEL COUNT: apparent = CSS size x browser magnification. A correct
// deck has apparent(z)/apparent(1) == z. The broken deck has it == 1 — the formal statement of "zoom does
// nothing". Asserting a pixel number instead would go stale the first time a panel is resized.
//
//   cd frontend && npm run build && node scripts/zoom-gate.mjs
//
// Exit 0 only when the sheet tracks the pinch at every level, at both orientations, on all three of Enki's
// edges. Anything else is non-zero, on purpose.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const PORT = Number(process.env.ZOOM_PORT || 4699);
// A pinch is not exact, and neither is a container-query layout rounding to device pixels. 8% is far tighter
// than the 1.00-vs-3.00 signal this is built to catch, and loose enough not to flap on a rounding change.
const TOL = 0.08;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
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
    "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean);
  let executablePath;
  for (const c of candidates) { try { await stat(c); executablePath = c; break; } catch {} }
  return chromium.launch(executablePath ? { executablePath } : {});
}

/** Pretend to be iOS under a pinch of `z`: shrink ONLY the visual-viewport reads, then fire resize. */
const PINCH = (z) => {
  const W = document.documentElement.clientWidth, H = document.documentElement.clientHeight;
  Object.defineProperty(window, "innerWidth", { configurable: true, get: () => Math.round(W / z) });
  Object.defineProperty(window, "innerHeight", { configurable: true, get: () => Math.round(H / z) });
  window.dispatchEvent(new Event("resize"));
};
const READ = () => {
  const cv = document.querySelector("[data-slide-canvas]");
  const bar = document.querySelector(".slide-noprint.flex.shrink-0.flex-wrap");
  if (!cv) return { err: "no canvas" };
  return { cssH: +cv.getBoundingClientRect().height.toFixed(1), chromeH: bar?.offsetHeight ?? null,
    layoutW: document.documentElement.clientWidth, reportedW: window.innerWidth };
};

async function openPresent(page) {
  await page.goto(`http://127.0.0.1:${PORT}/innovation/`, { waitUntil: "networkidle", timeout: 30000 });
  const gate = page.locator('input[type="password"]').first();
  if (await gate.count()) { await gate.fill("369963").catch(() => {}); await page.keyboard.press("Enter").catch(() => {}); }
  await page.getByRole("button", { name: "Gate Requirements" }).first().click();
  await page.locator('select:has(option[value^="PRJ-"])').first().selectOption("PRJ-01");
  await page.getByRole("button", { name: /Open (Digital Presentation Input|slide show)/i }).first().click();
  await page.getByRole("button", { name: "Go to slide S1" }).first().click();
  await page.getByRole("button", { name: /Present/ }).first().click();
  await page.waitForSelector("[data-slide-canvas]", { timeout: 15000 });
  await page.waitForTimeout(600);
}

const ZOOMS = [1.5, 2, 3];
const failures = [];
const browser = await launch();

// Enki's edges are CASES here, not footnotes: a landscape phone puts the height term in charge from the
// start; "already pinched" means the collapse is present before any gesture; a software keyboard shrinks the
// visual viewport exactly like a pinch does, so it exercises the same broken path with no pinch at all.
const CASES = [
  { name: "phone-portrait", w: 390, h: 844, pre: null },
  { name: "phone-landscape", w: 844, h: 390, pre: null },
  { name: "portrait · ENTERED ALREADY PINCHED", w: 390, h: 844, pre: 2 },
  { name: "portrait · SOFTWARE KEYBOARD (visual vp shrunk, no pinch)", w: 390, h: 844, pre: 1.55 },
];

for (const c of CASES) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  // "Already pinched" must be true BEFORE the deck mounts, or it is just a late pinch wearing a hat.
  if (c.pre) await page.addInitScript(`(${PINCH.toString()})(${c.pre});`);
  await openPresent(page);

  if (c.pre) await page.evaluate(PINCH, c.pre);      // re-assert after hydration replaced the window props
  await page.waitForTimeout(300);
  const base = await page.evaluate(READ);
  if (base.err) { failures.push(`${c.name}: ${base.err}`); await ctx.close(); continue; }
  const baseApparent = base.cssH * (c.pre ?? 1);
  console.log(`\n  ${c.name}   layout ${base.layoutW}px · reported ${base.reportedW}px · chrome ${base.chromeH}px`);
  console.log(`     pinch   reported vp   sheet CSS h   apparent   ratio   want`);
  console.log(`     ${String((c.pre ?? 1) + "x").padEnd(7)} ${String(base.reportedW).padEnd(13)} ${String(base.cssH).padEnd(13)} ${String(baseApparent.toFixed(0)).padEnd(10)} ${"1.00".padEnd(7)} 1.00  (baseline)`);

  for (const z of ZOOMS) {
    const eff = z * (c.pre ?? 1);
    await page.evaluate(PINCH, eff);
    await page.waitForTimeout(350);
    const m = await page.evaluate(READ);
    const apparent = m.cssH * eff;                    // Thoth: apparent = CSS x magnification
    const ratio = apparent / baseApparent;
    const ok = Math.abs(ratio - z) <= z * TOL;
    console.log(`     ${String(z + "x").padEnd(7)} ${String(m.reportedW).padEnd(13)} ${String(m.cssH).padEnd(13)} ${String(apparent.toFixed(0)).padEnd(10)} ${ratio.toFixed(2).padEnd(7)} ${z.toFixed(2)}  ${ok ? "✓" : "✗ SHEET DOES NOT TRACK THE PINCH"}`);
    if (!ok) failures.push(`${c.name} @ ${z}x — apparent sheet ratio ${ratio.toFixed(2)}, expected ${z.toFixed(2)} (the sheet ${ratio < 1.15 ? "stayed flat" : "drifted"} while the browser magnified)`);
  }
  await ctx.close();
}
// ── Z-5 · EVERY SLIDE, NOT JUST S1 (operator: "ensure zoom works on all slides") ───────────────
// The four cases above are DEPTH on one code. This is BREADTH: open the deck once and walk all 20 sheets
// with ArrowRight, pinching each to 2x. A per-slide open would cost ~20 page loads for the same signal;
// the walk exercises the real navigation path as a bonus, so a slide that fails to mount also shows up.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await openPresent(page);
  // ⚠ THE COUNT COMES FROM THE DECK'S OWN "i/N" FOOTER, AND THE FIRST DRAFT OF THIS GATE GOT IT WRONG.
  // It counted `[data-slide-code]`, which only exists in the PRINT stack — unmounted unless printing — so
  // the walk reported "1 sheets" and passed while testing a single slide. A breadth gate that silently
  // collapses to depth is worse than none: it reads green and covers nothing.
  const n = await page.evaluate(() => {
    const m = Array.from(document.querySelectorAll("span")).map((e) => /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(e.textContent || "")).find(Boolean);
    return m ? Number(m[2]) : 0;
  });
  if (n < 2) { failures.push(`all-slides walk — could not read the deck length from the i/N footer (got ${n}); the walk would have tested one slide and called it the deck`); }
  console.log(`\n  ALL SLIDES @ 2x — walking ${n} sheets with ArrowRight`);
  const seen = new Set();
  let bad = 0;
  for (let i = 0; i < n; i++) {
    await page.evaluate(PINCH, 1); await page.waitForTimeout(120);
    const b = await page.evaluate(READ);
    await page.evaluate(PINCH, 2); await page.waitForTimeout(200);
    const m = await page.evaluate(READ);
    const code = await page.evaluate(() => document.querySelector("[data-slide-title]")?.textContent?.trim() ?? "?");
    const ratio = (m.cssH * 2) / (b.cssH * 1);
    const ok = b.cssH > 0 && Math.abs(ratio - 2) <= 2 * TOL;
    if (!ok) { bad++; failures.push(`all-slides walk · sheet ${i + 1} (${code}) @ 2x — ratio ${ratio.toFixed(2)}, expected 2.00`); }
    seen.add(code);
    if (!ok || i === 0 || i === n - 1) console.log(`     ${String(i + 1).padStart(2)}/${n}  ${code.slice(0, 34).padEnd(36)} ratio ${ratio.toFixed(2)}  ${ok ? "✓" : "✗"}`);
    await page.keyboard.press("ArrowRight"); await page.waitForTimeout(180);
  }
  console.log(`     ${n - bad}/${n} sheets track the pinch · ${seen.size} distinct slide titles visited`);
  // ArrowRight must actually MOVE. If navigation broke, every iteration would re-measure sheet 1 and the
  // ratio assertion would pass n times on one slide — the exact false green the count bug above produced.
  if (seen.size < n) failures.push(`all-slides walk — only ${seen.size} distinct slides of ${n} were reached; ArrowRight is not advancing the deck`);
  await ctx.close();
}

// ── Z-5 · THE IN-APP ZOOM CONTROL AND ITS PAN, WHICH IS THE PART THAT FELT FINICKY ─────────────
// The pinch cases above only ever exercised the BROWSER's magnification. The − 100% + control is a
// different path: it scales the sheet in CSS and the stage must become scrollable so the reader can pan
// to the part they zoomed in on. And while zoomed, the two invisible 10%-wide page-turn zones must NOT be
// in the way — on S1 the left column is the value proposition, so "drag left to read it" was turning the
// page instead.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await openPresent(page);
  const probe = () => {
    const st = document.querySelector("[data-slide-canvas]")?.closest(".overflow-auto");
    return { zoneCount: document.querySelectorAll('[aria-label="Previous slide"],[aria-label="Next slide"]').length,
             pannable: !!st && (st.scrollWidth > st.clientWidth + 2 || st.scrollHeight > st.clientHeight + 2),
             pager: document.querySelectorAll("[data-slide-pager]").length };
  };
  const at1 = await page.evaluate(probe);
  for (let i = 0; i < 3; i++) { await page.getByRole("button", { name: "Zoom in" }).click(); await page.waitForTimeout(120); }
  const label = (await page.locator("text=/^\\d+%$/").first().textContent())?.trim();
  const atZ = await page.evaluate(probe);
  console.log(`\n  IN-APP ZOOM · 100% → ${label}`);
  console.log(`     page-turn zones   ${at1.zoneCount} at 1x → ${atZ.zoneCount} zoomed   ${atZ.zoneCount === 0 ? "✓ stand down" : "✗ still armed over the pan"}`);
  console.log(`     stage pannable    ${at1.pannable} at 1x → ${atZ.pannable} zoomed      ${atZ.pannable ? "✓" : "✗ nothing to pan — the sheet did not grow"}`);
  if (at1.zoneCount !== 2) failures.push(`in-app zoom — expected 2 page-turn zones at 1x, found ${at1.zoneCount}`);
  if (atZ.zoneCount !== 0) failures.push(`in-app zoom — ${atZ.zoneCount} page-turn zone(s) still armed while zoomed; a pan will page the deck`);
  if (!atZ.pannable) failures.push("in-app zoom — the stage is not scrollable while zoomed, so the sheet cannot be panned");
  await ctx.close();
}

await browser.close();
server.close();

console.log("");
if (failures.length) {
  console.log(`✗ zoom-gate — ${failures.length} failure(s)`);
  for (const f of failures) console.log(`  ✗ ${f}`);
  process.exitCode = 1;
} else {
  console.log(`✓ zoom-gate — the sheet tracks the pinch at ${ZOOMS.join("x, ")}x across ${CASES.length} cases,`);
  console.log(`  on every slide in the deck, and the in-app zoom pans without paging`);
  console.log(`  ⚠ WEBKIT UNVERIFIED — this emulates the iOS visual/layout viewport divergence on Blink by`);
  console.log(`    overriding innerWidth/innerHeight. It is a faithful model of the quirk, not the engine.`);
  console.log(`    There is no WebKit build in this sandbox and \`playwright install\` is forbidden here.`);
}
process.exit(failures.length ? 1 : 0);
