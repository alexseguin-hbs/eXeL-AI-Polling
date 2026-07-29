#!/usr/bin/env node
// slide-shots — THE SCREENSHOT GATE for the /innovation Present-mode deck.
//
// WHY (operator, 2026-07-29): "the screenshot gate catches the rest." Every previous slide-fidelity round was
// graded from tsc + unit tests, neither of which can see an EMPTY PANEL BODY or text spilling out of a card.
// The operator found both by opening the app on a phone. This script closes that hole: it drives the real
// built app in a real browser at the two viewports that matter and FAILS the build on what a human would
// have flagged — overflow and oversized type.
//
// It captures S1, S2, S3, S8, S11 in PRESENT mode at 390x844 (phone portrait) AND 1440x810 (desktop
// landscape) and asserts, per slide per viewport:
//   1. OVERFLOW — no element inside the SlideCanvas has scrollWidth > clientWidth or scrollHeight >
//      clientHeight. Text that clips is a defect, not a styling preference.
//   2. TYPE SCALE — computed font-size, NORMALISED to the print reference width, stays inside the caps from
//      backlog item 3: body <= 12px, box headers <= 18px. Normalising is the whole trick: the canvas is a
//      container-query box, so 1cqw is 3.9px at 390 and ~13.5px at 1440. Comparing raw px to a print target
//      would be meaningless. We scale every measurement by (PRINT_W / actual canvas width) so one cap holds
//      at every viewport and matches what a single-page landscape printout will actually show.
//   3. NON-EMPTY PANELS — every AMTS panel frame has resolved content in its body. A panel that renders its
//      title with nothing under it is the exact bug in backlog item 2, and it must never ship again.
//
// The server + capture pattern is lifted from scripts/feedback-artifact.mjs (same static server over out/,
// same preinstalled-Chromium resolution) so there is ONE way this repo drives a browser.
//
//   cd frontend && npm run build && node scripts/slide-shots.mjs
//   SHOTS=1 node scripts/slide-shots.mjs      # also write the PNGs to docs/feedback/shots/
//   SLIDES=S1,S3 node scripts/slide-shots.mjs # narrow the run while iterating
//
// Exit 0 only when every slide passes at every viewport. Anything else is non-zero, on purpose.

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const SHOT_DIR = resolve(ROOT, "..", "docs", "feedback", "shots");
const PORT = Number(process.env.SHOT_PORT || 4601);

// The AMTS page is a fixed 16:9 sheet. The print target (@page size, backlog item 4) is 1600x900, so 1600px
// is the reference width every font measurement is normalised to before it meets a cap.
const PRINT_W = 1600;
// Backlog item 3 — absolute px caps at print width. Upper bounds only: small text at a small viewport is
// correct behaviour for a container-query sheet, oversized text is the defect.
const CAP_BODY = 12;
const CAP_HEADER = 18;

const SLIDES = (process.env.SLIDES || "S1,S2,S3,S8,S11").split(",").map((s) => s.trim()).filter(Boolean);
const VIEWPORTS = [
  { name: "phone-portrait", width: 390, height: 844 },
  { name: "desktop-landscape", width: 1440, height: 810 },
];

// ── Static server over out/ (verbatim pattern from feedback-artifact.mjs) ────────────────────
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

// ── Browser — the PREINSTALLED Chromium. `playwright install` is forbidden in this environment: the bundled
//    build (1194) does not match what this Playwright version would fetch (1217), so we point at it. ──────
async function launch() {
  const { chromium } = await import("playwright");
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
  ].filter(Boolean);
  let executablePath;
  for (const c of candidates) { try { await stat(c); executablePath = c; break; } catch {} }
  return chromium.launch(executablePath ? { executablePath } : {});
}

// ── In-page audit. Runs inside the built app against the real, laid-out DOM. ─────────────────
// Returns plain data (no DOM handles) so the assertions live in node, where they can be reported clearly.
const AUDIT = (printW) => {
  const canvas = document.querySelector("[data-slide-canvas]");
  if (!canvas) return { error: "no [data-slide-canvas] in present mode" };
  const cw = canvas.clientWidth || 1;
  const k = printW / cw;                       // normalise every px to the print sheet's width
  const round = (n) => Math.round(n * 10) / 10;

  const overflow = [];
  const type = [];
  for (const el of canvas.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    // Scrollable-by-design containers legitimately overflow; everything else must fit.
    const scrollable = /auto|scroll/.test(cs.overflowX + cs.overflowY);
    const w = el.scrollWidth - el.clientWidth;
    const h = el.scrollHeight - el.clientHeight;
    // 1px of slack absorbs sub-pixel rounding in the layout engine; 2px+ is a real clip.
    if (!scrollable && (w > 1 || h > 1) && el.clientWidth > 0 && el.clientHeight > 0) {
      overflow.push({ tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 70), dx: w, dy: h,
        text: (el.textContent || "").trim().slice(0, 60) });
    }
    // Only measure elements that actually paint text of their own.
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const px = round(parseFloat(cs.fontSize) * k);
    // A "box header" is the slide header band, an AMTS panel banner, or a field banner. Everything else —
    // including the subheader line and the page footer — is body copy and meets the tighter cap.
    const header = !!el.closest("[data-panel-head],[data-field-banner],[data-slide-head]");
    type.push({ px, header, text: (el.textContent || "").trim().slice(0, 42) });
  }

  // Every AMTS panel must have a body with resolved content — a titled panel with an empty body is the
  // backlog-item-2 defect and is reported as a hard failure, not a warning.
  const panels = [...canvas.querySelectorAll("[data-panel]")].map((el) => ({
    title: (el.querySelector("[data-panel-head]")?.textContent || "").trim().slice(0, 48),
    body: (el.querySelector("[data-panel-body]")?.textContent || "").trim().length,
    charts: el.querySelectorAll("svg,img,canvas").length,
  }));
  // Fallback slides (no AMTS panel yet) still must not render an all-empty body.
  const bodyText = (canvas.querySelector("[data-slide-body]")?.textContent || "").trim().length;
  return { cw, k: round(k), overflow, type, panels, bodyText };
};

// ── Drive the app into present mode on a given slide ─────────────────────────────────────────
async function openSlide(page, code) {
  await page.goto(`http://127.0.0.1:${PORT}/innovation/`, { waitUntil: "networkidle", timeout: 30000 });
  // Gate: sessionStorage is pre-seeded by addInitScript, but fill the field too if the gate still shows.
  const gate = page.locator('input[type="password"]').first();
  if (await gate.count()) { await gate.fill("369963").catch(() => {}); await page.keyboard.press("Enter").catch(() => {}); }
  await page.getByRole("button", { name: "Gate Requirements" }).first().click();
  await page.getByRole("button", { name: /Open slide show/ }).first().click();
  await page.getByRole("button", { name: `Go to slide ${code}` }).first().click();
  await page.getByRole("button", { name: /Present/ }).first().click();
  await page.waitForSelector("[data-slide-canvas]", { timeout: 15000 });
  await page.waitForTimeout(500);            // let cq-sized type settle after the fullscreen transition
}

// ── Run ──────────────────────────────────────────────────────────────────────────────────────
await new Promise((r) => serve().once("listening", r));
console.log(`slide-shots · ${SLIDES.join(",")} · ${VIEWPORTS.map((v) => `${v.width}x${v.height}`).join(" + ")} · caps body<=${CAP_BODY}px header<=${CAP_HEADER}px @${PRINT_W}px`);

const browser = await launch();
const failures = [];
let checks = 0;

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  // Pre-unlock so the gate never eats a run, and stub fullscreen — headless Chromium rejects the request and
  // the unhandled promise noise hides real errors.
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem("innovation-unlocked", "1"); } catch {}
    Element.prototype.requestFullscreen = function () { return Promise.resolve(); };
  });
  const page = await ctx.newPage();
  for (const code of SLIDES) {
    const tag = `${code} @ ${vp.name}`;
    let a;
    try {
      await openSlide(page, code);
      a = await page.evaluate(AUDIT, PRINT_W);
    } catch (e) {
      failures.push(`${tag} — could not reach present mode: ${(e?.message || e).toString().split("\n")[0].slice(0, 120)}`);
      continue;
    }
    if (a.error) { failures.push(`${tag} — ${a.error}`); continue; }
    checks++;

    if (process.env.SHOTS) {
      await mkdir(SHOT_DIR, { recursive: true });
      await writeFile(join(SHOT_DIR, `${code}_${vp.name}.png`), await page.screenshot({ type: "png" }));
    }

    // 1 · OVERFLOW
    for (const o of a.overflow.slice(0, 4))
      failures.push(`${tag} — OVERFLOW ${o.dx > 1 ? `+${o.dx}px wide` : ""}${o.dy > 1 ? ` +${o.dy}px tall` : ""} on <${o.tag}> "${o.text}"`);

    // 2 · TYPE SCALE (normalised to the print sheet)
    const body = a.type.filter((t) => !t.header);
    const heads = a.type.filter((t) => t.header);
    const overBody = body.filter((t) => t.px > CAP_BODY).sort((x, y) => y.px - x.px);
    const overHead = heads.filter((t) => t.px > CAP_HEADER).sort((x, y) => y.px - x.px);
    if (overBody.length) failures.push(`${tag} — BODY TYPE ${overBody[0].px}px > ${CAP_BODY}px cap (${overBody.length} el) e.g. "${overBody[0].text}"`);
    if (overHead.length) failures.push(`${tag} — HEADER TYPE ${overHead[0].px}px > ${CAP_HEADER}px cap (${overHead.length} el) e.g. "${overHead[0].text}"`);

    // 3 · NON-EMPTY PANEL BODIES
    const empty = a.panels.filter((p) => p.body === 0 && p.charts === 0);
    for (const e of empty) failures.push(`${tag} — EMPTY PANEL BODY "${e.title}" (title rendered, nothing under it)`);
    if (!a.panels.length && a.bodyText === 0) failures.push(`${tag} — EMPTY SLIDE BODY (no panel, no content)`);

    const maxB = body.length ? Math.max(...body.map((t) => t.px)) : 0;
    const maxH = heads.length ? Math.max(...heads.map((t) => t.px)) : 0;
    console.log(`  ${empty.length || a.overflow.length || overBody.length || overHead.length ? "✗" : "✓"} ${tag.padEnd(28)} canvas ${String(a.cw).padStart(4)}px ·` +
      ` body max ${String(maxB).padStart(5)}px · header max ${String(maxH).padStart(5)}px · panels ${a.panels.length}` +
      ` · overflow ${a.overflow.length}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(0 + (failures.length ? 1 : 0) * (console.log(`\n${failures.length ? "✗" : "✓"} ${checks} slide-viewport checks`), failures.length ? (failures.forEach((f) => console.error(`  ✗ ${f}`)), 1) : 0));
