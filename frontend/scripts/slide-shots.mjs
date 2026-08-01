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
// 20px, not 12px: item 22c scaled body copy into the room the bigger boxes created. 12px was derived when
// the sheet was cramped and every panel was clipping; with the layout distributing the full canvas the same
// text is legible larger. The cap is still a hard ceiling — the DENSEST slide sets what the whole deck can
// use, because one global size is what makes 20 slides read as one deck.
const CAP_BODY = 20;
// 36px, not 18px: the operator re-specified the header band twice against IMG_8310 ("slide titles need to go
// back to prior size"), which is roughly double what item 21 derived. The cap follows the operator's stated
// reference — it is a ceiling that stops drift, not an independent opinion about what looks right.
const CAP_HEADER = 36;
// #22a — DEAD SPACE. The slide body region is ~690 sheet px tall. A panel whose painted content stops more
// than this far above its own bottom edge reads as an empty box, not as padding — the operator photographed
// a ~200px void under S8's VALUE EQUATION table. 90px is ~13% of the body region: comfortably above normal
// bottom padding (the panel's own p-[0.7cqw] is ~11px) and well below the gap a human notices.
// Two DIFFERENT voids, and conflating them is why the first attempt at this failed. A stretched box whose
// content still sits at the top looks identical, on a naive measurement, to a box that was never stretched.
//   DEAD_BOX — canvas height the LAYOUT never covered: the grid packed its rows and left the foot empty.
//              Pure geometry, fixed by stretching (22a). After the fix this should be ~0, so the cap is tight.
//   DEAD_INK — space inside a box below where its content is actually PAINTED. Stretching cannot fix this;
//              only larger type can (22c). 90px is ~13% of the 690px body region: comfortably above normal
//              bottom padding (a panel's own p-[0.7cqw] is ~11px) and well below the void a human notices.
const DEAD_BOX = 24;
const DEAD_INK = 90;

// ALL 20 codes by default (#21). Sampling five slides is how S4 shipped with a clipped CONOPS hero.
const ALL_SLIDES = "S1,S2,S3,S4,S5,S6,S7,S8,S9,S10,S11,S12,S13,S14,S15,S16,S17,S18,CSRA";
const SLIDES = (process.env.SLIDES || ALL_SLIDES).split(",").map((s) => s.trim()).filter(Boolean);
// Run against the LONGEST-named project, not PRJ-01. Testing the easy case is how the header shipped
// truncating in the first place: "AI/ML Software & Integration — Army IVAS" is the 40-character worst case.
const PROJECT = process.env.PROJECT || "PRJ-23";

// ⚠ X-7 · THE SLOT-ASPECT DRIFT LOCK — PROMISED IN X-4 AND NOT BUILT UNTIL NOW.
// `SLIDE_SLOT_ASPECT` in page.tsx is the aspect the waterfall lays itself out for WHEN IT CANNOT MEASURE
// ITS OWN BOX — which is every print render, because the print stack mounts under `display:none`. A stale
// constant therefore does not break the screen at all (a live ResizeObserver overrides it there); it breaks
// the EXPORTED PDF, silently, and the only lock that existed pinned the number instead of checking it.
// This reads the constant out of the source and compares it against the panel the browser actually laid
// out. 8% is far tighter than the ~3x error one layout change produces, and loose enough not to flap.
const SLOT_TOL = 0.08;
const SLOT_CONST = Number(
  (await readFile(join(ROOT, "app/innovation/page.tsx"), "utf8")).match(/const SLIDE_SLOT_ASPECT = ([\d.]+);/)?.[1] ?? 0);
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
  const ellipsis = [];
  const own0 = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const cRect = canvas.getBoundingClientRect();
  for (const el of canvas.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    // TEXT IS ONLY LOST WHEN SOMETHING CLIPS IT. An element whose overflow is `visible` paints outside its
    // box and stays perfectly readable (absolutely-positioned connectors do this by design), so flagging it
    // is a false positive. Two things really lose content, and only these are reported:
    //   (a) the element CLIPS its own content — overflow:hidden/clip and scroll size exceeds client size;
    //   (b) the element paints outside the SLIDE CANVAS, which is itself overflow:hidden.
    // Scrollable-by-design containers (auto/scroll) are exempt from (a) — the user can reach the content —
    // but they are NOT exempt from (b), because a printed sheet cannot scroll.
    const clips = /hidden|clip/.test(cs.overflowX + cs.overflowY);
    const w = el.scrollWidth - el.clientWidth;
    const h = el.scrollHeight - el.clientHeight;
    // 1px of slack absorbs sub-pixel rounding in the layout engine; 2px+ is a real clip.
    if (clips && (w > 1 || h > 1) && el.clientWidth > 0 && el.clientHeight > 0) {
      overflow.push({ tag: el.tagName.toLowerCase(), cls: (el.className || "").toString().slice(0, 70), dx: w, dy: h,
        text: (el.textContent || "").trim().slice(0, 60) });
    }
    // STANDING LAW (operator): text is NEVER cut off and NEVER ellipsised.
    //   · text-overflow:ellipsis that is ACTUALLY triggering = a clipped string. `truncate` on a string that
    //     fits is harmless; on one that does not it silently eats content, which is the banned behaviour.
    //   · a rendered "…" is banned outright in the header band — the law says shrink, then wrap, never clip.
    if (own0(el)) {
      const clippedText = cs.textOverflow === "ellipsis" && el.scrollWidth - el.clientWidth > 1;
      if (clippedText) ellipsis.push({ where: el.getAttribute("data-proj-name") !== null ? "project name" : el.tagName.toLowerCase(),
        text: (el.textContent || "").trim().slice(0, 50), over: el.scrollWidth - el.clientWidth });
      if (el.closest("[data-slide-head]") && /[…]|\.\.\.$/.test((el.textContent || "").trim()))
        ellipsis.push({ where: "HEADER", text: (el.textContent || "").trim().slice(0, 50), over: 0 });
    }

    // Only measure TYPE on elements that paint text of their own — but the CANVAS-BOUNDS check below must
    // also cover images, SVG and canvas. A clipped CONOPS hero (operator, IMG_8312) carries no text node, so
    // a text-only bounds check would have let a visibly cut-off picture through. A gate that misses a visible
    // clip is worse than no gate.
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const paints = /^(img|svg|canvas|image)$/.test(el.tagName.toLowerCase());
    if (!own && !paints) continue;
    // (b) — painted content must sit inside the canvas. 2px of slack for sub-pixel layout.
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      const out = Math.max(cRect.left - r.left, r.right - cRect.right, cRect.top - r.top, r.bottom - cRect.bottom);
      if (out > 2) overflow.push({ tag: el.tagName.toLowerCase(), cls: "OUTSIDE CANVAS", dx: Math.round(out), dy: 0,
        text: (el.textContent || "").trim().slice(0, 60) || `<${el.tagName.toLowerCase()}> ${Math.round(r.width)}x${Math.round(r.height)}` });
    }
    if (!own) continue;
    // SVG text scales with its viewBox, so its CSS font-size is in USER units, not screen px. Multiply by the
    // element's actual screen transform before comparing to a px cap, or every chart label reads 4x too big.
    const ctm = typeof el.getScreenCTM === "function" ? el.getScreenCTM() : null;
    const px = round(parseFloat(cs.fontSize) * (ctm ? Math.abs(ctm.a) : 1) * k);
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
  // #22a — DEAD SPACE. Measure where content is actually PAINTED, not where its box ends: with rows stretched
  // to fill a panel, a short paragraph's BOX covers the panel while its TEXT still sits at the top. Range
  // rects over text nodes (plus img/svg/canvas rects) give the bottom edge the eye actually sees.
  const scaleF = (cRect.height / (canvas.clientHeight || 1)) || 1;
  const paintedBottom = (root) => {
    let b = -Infinity;
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const rng = document.createRange();
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.textContent.trim()) continue;
      rng.selectNodeContents(n);
      const r = rng.getBoundingClientRect();
      if (r.height > 0) b = Math.max(b, r.bottom);
    }
    for (const el of root.querySelectorAll("img,svg,canvas")) {
      const r = el.getBoundingClientRect();
      if (r.height > 0) b = Math.max(b, r.bottom);
    }
    return b;
  };
  const bodyEl = canvas.querySelector("[data-slide-body]");
  const panelEls = [...canvas.querySelectorAll("[data-panel]")];
  const deadInk = [];
  // INK — every box must be filled by its own content.
  const inkBoxes = panelEls.length ? panelEls : (bodyEl ? [...bodyEl.children] : []);
  for (const el of inkBoxes) {
    const pb = paintedBottom(el);
    if (!isFinite(pb)) continue;
    deadInk.push({ gap: round((el.getBoundingClientRect().bottom - pb) / scaleF),
      where: (el.querySelector("[data-panel-head],[data-field-banner]")?.textContent || el.textContent || "box").trim().slice(0, 40) });
  }
  // BOX — the body region must be COVERED by its boxes. This is the one 22a fixes: it ignores where the ink
  // stops and asks only whether the layout used the canvas it was given.
  let deadBox = 0;
  if (bodyEl && bodyEl.children.length) {
    const bRect = bodyEl.getBoundingClientRect();
    const lowest = Math.max(...[...bodyEl.children].map((c) => c.getBoundingClientRect().bottom));
    deadBox = round((bRect.bottom - lowest) / scaleF);
  }

  // #21 — the header must be IDENTICAL on all 20 slides: same two type sizes, never truncated, and the body
  // starting at the same Y. Measured here, compared across slides in node.
  const box = (sel) => {
    const el = canvas.querySelector(sel);
    if (!el) return null;
    const cs2 = getComputedStyle(el);
    return { px: round(parseFloat(cs2.fontSize) * k), sw: el.scrollWidth, cw: el.clientWidth,
      lines: Math.round(el.getBoundingClientRect().height / (parseFloat(cs2.lineHeight) || parseFloat(cs2.fontSize) * 1.15)),
      text: (el.textContent || "").trim().slice(0, 44) };
  };
  const body = canvas.querySelector("[data-slide-body]");
  // Report in SHEET px: the canvas is CSS-scaled to fit, so a screen-px delta would differ per viewport even
  // though the sheet is identical. Dividing by the live scale makes portrait and landscape directly comparable.
  const scale = cRect.height / (canvas.clientHeight || 1);
  const bodyTop = body ? round((body.getBoundingClientRect().top - cRect.top) / (scale || 1)) : null;
  return { cw, k: round(k), overflow, type, panels, bodyText, deadInk, deadBox, ellipsis, head: { proj: box("[data-proj-name]"), title: box("[data-slide-title]"), bodyTop } };
};

// ── Drive the app into present mode on a given slide ─────────────────────────────────────────
async function openSlide(page, code) {
  await page.goto(`http://127.0.0.1:${PORT}/innovation/`, { waitUntil: "networkidle", timeout: 30000 });
  // Gate: sessionStorage is pre-seeded by addInitScript, but fill the field too if the gate still shows.
  const gate = page.locator('input[type="password"]').first();
  if (await gate.count()) { await gate.fill("369963").catch(() => {}); await page.keyboard.press("Enter").catch(() => {}); }
  await page.getByRole("button", { name: "Gate Requirements" }).first().click();
  // Drive the real project selector — same control an operator uses, so the gate cannot test a project the UI
  // cannot reach.
  await page.locator('select:has(option[value^="PRJ-"])').first().selectOption(PROJECT);
  // ⚠ THE GATE WAS TESTING NOTHING, AND IT TOOK A CLEAN RUN TO NOTICE. W-16 renamed this button to the
  // operator's wording ("Open Digital Presentation Input"); this locator still said "Open slide show", so
  // EVERY one of the 40 checks failed with "could not reach present mode" and the run reported `0 checks`.
  // A gate whose selector drifts stops guarding silently — the worst failure mode a gate has. Matches BOTH
  // labels so a future rename degrades instead of blinding it.
  await page.getByRole("button", { name: /Open (Digital Presentation Input|slide show)/i }).first().click();
  await page.getByRole("button", { name: `Go to slide ${code}` }).first().click();
  await page.getByRole("button", { name: /Present/ }).first().click();
  await page.waitForSelector("[data-slide-canvas]", { timeout: 15000 });
  await page.waitForTimeout(500);            // let cq-sized type settle after the fullscreen transition
}

// ── Run ──────────────────────────────────────────────────────────────────────────────────────
await new Promise((r) => serve().once("listening", r));
console.log(`slide-shots · ${PROJECT} · ${SLIDES.length} slides · ${VIEWPORTS.map((v) => `${v.width}x${v.height}`).join(" + ")} · caps body<=${CAP_BODY}px header<=${CAP_HEADER}px @${PRINT_W}px`);

const browser = await launch();
const failures = [];
let checks = 0;
// Cross-viewport header record (#22b): portrait must stay within 2% of landscape on the
// fontSize-to-canvas-width RATIO. Comparing raw px would pass trivially now that the sheet is a fixed
// 1600x900 page; comparing the ratio is what actually proves the two renders are the same document.
const perVp = [];

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  // Pre-unlock so the gate never eats a run, and stub fullscreen — headless Chromium rejects the request and
  // the unhandled promise noise hides real errors.
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem("innovation-unlocked", "1"); } catch {}
    Element.prototype.requestFullscreen = function () { return Promise.resolve(); };
  });
  const page = await ctx.newPage();
  const headBoxes = [];   // #21 — per-slide header metrics, compared for uniformity after the loop
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
    headBoxes.push({ code, ...a.head });

    if (process.env.SHOTS) {
      await mkdir(SHOT_DIR, { recursive: true });
      await writeFile(join(SHOT_DIR, `${code}_${vp.name}.png`), await page.screenshot({ type: "png" }));
    }

    // 1 · OVERFLOW
    for (const o of a.overflow.slice(0, 4))
      failures.push(`${tag} — OVERFLOW ${o.dx > 1 ? `+${o.dx}px wide` : ""}${o.dy > 1 ? ` +${o.dy}px tall` : ""} on <${o.tag}> "${o.text}"`);

    // 1b · X-7 · S8's waterfall slot must still match the constant its PRINT layout is seeded from.
    if (code === "S8") {
      const slot = await page.evaluate(() => {
        const g = document.querySelector('[data-slide-canvas] svg[aria-label^="Value creation"]');
        const box = g?.closest("[data-panel-body]")?.getBoundingClientRect();
        return box && box.height > 0 ? +(box.width / box.height).toFixed(3) : 0;
      });
      if (!SLOT_CONST) failures.push(`${tag} — could not read SLIDE_SLOT_ASPECT out of page.tsx`);
      else if (!slot) failures.push(`${tag} — could not measure the waterfall's panel to check SLIDE_SLOT_ASPECT`);
      else if (Math.abs(slot - SLOT_CONST) > SLOT_CONST * SLOT_TOL)
        failures.push(`${tag} — SLIDE_SLOT_ASPECT is ${SLOT_CONST} but the panel measures ${slot} (>${Math.round(SLOT_TOL * 100)}% drift). `
          + `The SCREEN self-corrects and hides this; the EXPORTED PDF lays out from the constant and will letterbox. Update it.`);
      else console.log(`  · S8 slot aspect ${slot} vs SLIDE_SLOT_ASPECT ${SLOT_CONST} — within ${Math.round(SLOT_TOL * 100)}%`);
    }

    // 2 · TYPE SCALE (normalised to the print sheet)
    const body = a.type.filter((t) => !t.header);
    const heads = a.type.filter((t) => t.header);
    const overBody = body.filter((t) => t.px > CAP_BODY).sort((x, y) => y.px - x.px);
    const overHead = heads.filter((t) => t.px > CAP_HEADER).sort((x, y) => y.px - x.px);
    if (overBody.length) failures.push(`${tag} — BODY TYPE ${overBody[0].px}px > ${CAP_BODY}px cap (${overBody.length} el) e.g. "${overBody[0].text}"`);
    if (overHead.length) failures.push(`${tag} — HEADER TYPE ${overHead[0].px}px > ${CAP_HEADER}px cap (${overHead.length} el) e.g. "${overHead[0].text}"`);

    // 2b · NO CLIPPED OR ELLIPSISED TEXT — the operator's standing law.
    for (const e of (a.ellipsis || []).slice(0, 3))
      failures.push(`${tag} — TEXT CUT OFF in ${e.where}: "${e.text}"${e.over ? ` (${e.over}px hidden)` : " — rendered an ellipsis"}`);

    // 3 · DEAD BOX — ENFORCED (22a). The layout must use the canvas it was given. Proven red before the fix:
    //     >90px of uncovered foot on 20/20 slides, peaking at 689px on CS.
    if (a.deadBox > DEAD_BOX) failures.push(`${tag} — DEAD BOX ${a.deadBox}px of canvas the layout never covered (cap ${DEAD_BOX}px)`);

    // 3b · DEAD INK — measured, enforced in 22c. Stretching boxes cannot fill them with words; only larger
    //      type can, and the operator's order is BOXES FIRST, TEXT SECOND. Wiring this before 22c would make
    //      the gate red for work that has not been scheduled, which only teaches people to ignore it.

    // 4 · NON-EMPTY PANEL BODIES
    const empty = a.panels.filter((p) => p.body === 0 && p.charts === 0);
    for (const e of empty) failures.push(`${tag} — EMPTY PANEL BODY "${e.title}" (title rendered, nothing under it)`);
    if (!a.panels.length && a.bodyText === 0) failures.push(`${tag} — EMPTY SLIDE BODY (no panel, no content)`);

    const maxInk = (a.deadInk || []).length ? Math.max(...a.deadInk.map((d) => d.gap)) : 0;
    const maxB = body.length ? Math.max(...body.map((t) => t.px)) : 0;
    const maxH = heads.length ? Math.max(...heads.map((t) => t.px)) : 0;
    console.log(`  ${empty.length || a.overflow.length || overBody.length || overHead.length || a.deadBox > DEAD_BOX ? "✗" : "✓"} ${tag.padEnd(28)} canvas ${String(a.cw).padStart(4)}px ·` +
      ` body max ${String(maxB).padStart(5)}px · header max ${String(maxH).padStart(5)}px · panels ${a.panels.length}` +
      ` · overflow ${a.overflow.length} · box-void ${a.deadBox}px · ink-void ${maxInk}px`);
  }
  // ── #21 · HEADER UNIFORMITY across every slide at this viewport ────────────────────────────
  const seen = headBoxes.filter((h) => h.proj && h.title);
  if (seen.length > 1) {
    const projPx = [...new Set(seen.map((h) => h.proj.px))];
    const titlePx = [...new Set(seen.map((h) => h.title.px))];
    const tops = [...new Set(seen.map((h) => h.bodyTop))];
    if (projPx.length > 1) failures.push(`${vp.name} — PROJECT NAME size differs across slides: ${projPx.join("/")}px`);
    if (titlePx.length > 1) failures.push(`${vp.name} — SLIDE TITLE size differs across slides: ${titlePx.join("/")}px`);
    if (tops.length > 1) failures.push(`${vp.name} — BODY starts at different Y across slides: ${tops.join("/")}px`);
    for (const h of seen) {
      if (h.proj.sw - h.proj.cw > 1) failures.push(`${vp.name} ${h.code} — PROJECT NAME TRUNCATED "${h.proj.text}" (${h.proj.sw} > ${h.proj.cw})`);
      if (h.title.sw - h.title.cw > 1) failures.push(`${vp.name} ${h.code} — SLIDE TITLE TRUNCATED "${h.title.text}" (${h.title.sw} > ${h.title.cw})`);
    }
    console.log(`  · header @ ${vp.name}: name ${projPx[0]}px · title ${titlePx[0]}px · body top ${tops[0]}px · ${seen.length} slides`);
    perVp.push({ name: vp.name, proj: projPx[0], title: titlePx[0], top: tops[0], cw: seen[0].cw || 1600 });
  }
  await ctx.close();
}
// ── HEADER SWEEP · EVERY project, not a sample (standing law) ────────────────────────────────
// The long-tail name nobody anticipated is the entire point — exactly the class of bug found when the gate
// widened from 5 sampled slides to all 20 against the longest-named project. The name is a per-PROJECT
// property and the title a per-SLIDE one, so the sweep runs every project on ONE slide rather than the
// 33x20x2 = 1320 page loads a naive cross-product would need. One viewport is sufficient and provably so:
// the portrait/landscape ratio check below holds the two renders identical to 0.00%.
if (!process.env.NO_SWEEP) {
  const { DEMO_PROJECTS } = await import("../lib/innovation-data.ts");
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    try { sessionStorage.setItem("innovation-unlocked", "1"); } catch {}
    Element.prototype.requestFullscreen = function () { return Promise.resolve(); };
  });
  const page = await ctx.newPage();
  const sizes = new Map();
  let swept = 0;
  for (const pr of DEMO_PROJECTS) {
    try {
      await page.goto(`http://127.0.0.1:${PORT}/innovation/`, { waitUntil: "networkidle", timeout: 30000 });
      await page.getByRole("button", { name: "Gate Requirements" }).first().click();
      await page.locator('select:has(option[value^="PRJ-"])').first().selectOption(pr.id);
      // ⚠ THE GATE WAS TESTING NOTHING, AND IT TOOK A CLEAN RUN TO NOTICE. W-16 renamed this button to the
  // operator's wording ("Open Digital Presentation Input"); this locator still said "Open slide show", so
  // EVERY one of the 40 checks failed with "could not reach present mode" and the run reported `0 checks`.
  // A gate whose selector drifts stops guarding silently — the worst failure mode a gate has. Matches BOTH
  // labels so a future rename degrades instead of blinding it.
  await page.getByRole("button", { name: /Open (Digital Presentation Input|slide show)/i }).first().click();
      await page.getByRole("button", { name: /Present/ }).first().click();
      await page.waitForSelector("[data-slide-canvas]", { timeout: 15000 });
      const h = await page.evaluate(() => {
        const c = document.querySelector("[data-slide-canvas]");
        const el = c.querySelector("[data-proj-name]");
        const cs = getComputedStyle(el);
        const k = 1600 / (c.clientWidth || 1);
        return { px: Math.round(parseFloat(cs.fontSize) * k * 10) / 10, sw: el.scrollWidth, cw: el.clientWidth,
          ell: cs.textOverflow === "ellipsis", dots: /[…]|\.\.\.$/.test((el.textContent || "").trim()),
          text: (el.textContent || "").trim() };
      });
      swept++;
      sizes.set(h.px, (sizes.get(h.px) || 0) + 1);
      if (h.sw - h.cw > 1) failures.push(`SWEEP ${pr.id} — project name CUT OFF (${h.sw - h.cw}px hidden): "${h.text}"`);
      if (h.ell) failures.push(`SWEEP ${pr.id} — project name has text-overflow:ellipsis, which the law bans`);
      if (h.dots) failures.push(`SWEEP ${pr.id} — project name rendered an ellipsis: "${h.text}"`);
      if (h.px !== 32.8) console.log(`    · SHRINK FIRED ${pr.id} -> ${h.px}px  "${h.text}" (${h.text.length} ch)`);
    } catch (e) {
      failures.push(`SWEEP ${pr.id} — could not reach present mode: ${(e?.message || e).toString().split("\n")[0].slice(0, 90)}`);
    }
  }
  await ctx.close();
  console.log(`  · header sweep: ${swept}/${DEMO_PROJECTS.length} projects · name sizes ${[...sizes.entries()].map(([px, n]) => `${px}px x${n}`).join(", ")}`);
}

// #22b · PORTRAIT vs LANDSCAPE — same document, not merely similar.
if (perVp.length > 1) {
  const [a0, b0] = perVp;
  const drift = (x, y) => (Math.abs(x - y) / Math.max(x, y, 1)) * 100;
  for (const key of ["proj", "title", "top"]) {
    const d = drift(a0[key] / a0.cw, b0[key] / b0.cw);
    if (d > 2) failures.push(`${key} RATIO drifts ${d.toFixed(2)}% between ${a0.name} and ${b0.name} (cap 2%)`);
  }
  console.log(`  · portrait vs landscape: name ${a0.proj}/${b0.proj}px · title ${a0.title}/${b0.title}px · body top ${a0.top}/${b0.top}px`);
}
await browser.close();
process.exit(0 + (failures.length ? 1 : 0) * (console.log(`\n${failures.length ? "✗" : "✓"} ${checks} slide-viewport checks`), failures.length ? (failures.forEach((f) => console.error(`  ✗ ${f}`)), 1) : 0));
