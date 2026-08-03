#!/usr/bin/env node
// feedback-artifact — generate the operator feedback artifact in the LOCKED format:
// one HTML (with REAL embedded screenshots) + one companion JSON. Both, every time.
//
// WHY (operator, 2026-07-29): "it is impossible to verify what you uploaded and what I provided feedback
// for." Ad-hoc artifacts drifted in shape from session to session, so a verdict could not be tied back to a
// commit. The template in Innovation_Feedback_2026.07.26_images.html is now THE contract and must not be
// deviated from: numbered card · real screenshot · per-item SHA · APPROVE/CHANGES/N-A · comment box ·
// 12 Ascended Masters with grades · MoT synthesis · fixed Reset/Save/Download-JSON bar · localStorage
// persistence · JSON roll-up of {sha, title, verdict, comment} per item.
//
// The per-item SHA is the whole point: every card says which commit shipped that surface, so a comment can
// always be traced to the code it was written against.
//
// Screenshots are captured from the LOCAL static export (frontend/out) with Playwright + the preinstalled
// Chromium — never invented, never schematic. If a capture fails the card still renders and says so; a
// missing screenshot is reported, never faked.
//
//   npm run feedback                       # build out/ first, then: node scripts/feedback-artifact.mjs
//   MANIFEST=path.json node scripts/feedback-artifact.mjs
//
// Outputs (both, always):
//   docs/feedback/<stamp>_Innovation_FEEDBACK_images.html
//   docs/feedback/<stamp>_Innovation_FEEDBACK_images.json

import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { execSync } from "node:child_process";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const DOCS = resolve(ROOT, "..", "docs", "feedback");
const PORT = 4599;
const sha = (r = "HEAD") => execSync(`git rev-parse --short ${r}`, { cwd: ROOT, encoding: "utf8" }).trim();
const HEAD = sha();

// Stamp in CST, matching the deck + the 2026.07.26 artifact convention.
const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
const p2 = (n) => String(n).padStart(2, "0");
const STAMP = `${now.getFullYear()}.${p2(now.getMonth() + 1)}.${p2(now.getDate())}`;

// ── The surfaces to capture. `sha` is the commit that SHIPPED that surface — this is what makes a
//    verdict traceable. `act` runs in the page before the shot (unlock, navigate, open present mode).
const ITEMS = JSON.parse(process.env.MANIFEST ? await readFile(process.env.MANIFEST, "utf8") : "null") ?? [
  { id: "F1", sha: "0c3f044", title: "Dog tag — category fill, darker green, short label, 3 metric lines",
    path: "/innovation/", act: { kind: "present", project: "PRJ-07", slide: "S1" }, clip: "[data-slide-canvas] .rounded-lg.border-2",
    desc: "The tag body is now tinted by the PROJECT CATEGORY at ~36% over the deck's dark base (was 13%); the border stays the Strategic Pillar. Green went #34d399 → #10b981 → #059669 across your two 'darker' asks. Labels dropped the words the colour already carries: 'Enhance / NextGen' → 'Enhance', 'New Mkt / Vertical' → 'Mkt / Vertical'. Metrics are back to one per line, three lines, on every surface." },
  { id: "F2", sha: "0c3f044", title: "Metric text contrast at the new fill — measured, not eyeballed",
    path: "/innovation/", act: { kind: "present", project: "PRJ-01", slide: "S1" }, clip: "[data-slide-canvas] .rounded-lg.border-2",
    desc: "The stronger fill raised the floor under the tag's own text. Composited over #0b0f14 the old slate-500 label measured 1.90:1 — under WCAG AA. Rather than weaken the fill you asked for, the TEXT moved: label → slate-300, value → slate-100. Worst case across all four categories is now 6.08:1 and 8.23:1. Same frame as F1 so you can compare two categories side by side." },
  { id: "F3", sha: "5f974b6", title: "Dependencies — a real table, Project # | Project | Risk",
    path: "/innovation/", act: { kind: "present", project: "PRJ-02", slide: "S1" }, clip: "[data-slide-canvas] [data-panel]:has([data-panel-head]:has-text('Dependencies'))",
    desc: "Bullets became a table keyed by the same project id the constellation and the dependency graph use, so the sheet and the map can never name a project two different ways. Critical-path-first ranking and the '+N more' row are kept. Direction ('we rely on X' vs 'X relies on us') is no longer printed — your call for 3 columns over a 4th; both directions still produce rows. Shown on a project WITH edges." },
  { id: "F4", sha: "79f7366", title: "Roadmap blocks read G1 · Concept, date alone on the right",
    path: "/innovation/", act: { kind: "present", project: "PRJ-01", slide: "S1" }, clip: "[data-slide-canvas] [data-panel]:has([data-panel-head]:has-text('Roadmap'))",
    desc: "The card title was the gate alone on the left with 'stage · date' bolted together on the right. It now reads 'G1 · Concept' left and 'Apr' right — the slide header's own order. Both surfaces call ONE producer, gateStageLabel(), and a lock bans any second hand-written 'gate · stage' template so the convention cannot drift." },
  { id: "F5", sha: "79f7366", title: "Same convention, slide top-right",
    path: "/innovation/", act: { kind: "present", project: "PRJ-01", slide: "S1" }, clip: "[data-slide-canvas] [data-slide-title]",
    desc: "This is the other half of F4: the slide's top-right meta now routes through the same gateStageLabel() producer. Check that the gate·stage string here reads identically to the roadmap block titles below it — that identity is what 'same convention everywhere' means in code rather than in a comment." },
  { id: "F6", sha: "7683e81", title: "Market Opportunity · Pipeline — investigated, no dead space found",
    path: "/innovation/", act: { kind: "present", project: "PRJ-01", slide: "S1" }, clip: "[data-slide-canvas] [data-panel]:has([data-panel-head]:has-text('Market Opportunity'))",
    desc: "⚠ NEEDS YOUR EYE. You asked for the pipeline table at the top of its box. I built the obvious fix (content-start) and MEASURED it: the gap above the table is 5px with or without it on all 33 projects, so the fix was a no-op and I reverted it rather than ship decoration. The table does sit ~43px down — because 'Target segment / customer' renders above it. If THAT line is what you want the table above, it is a reorder, and it contradicts your earlier instruction that segment heads this panel. One word from you decides it." },
  { id: "F7", sha: "6d5ca82", title: "\"Open Digital Inputs\" — the shorter button",
    path: "/innovation/", act: { kind: "gate" }, clip: "main",
    desc: "'Open Digital Presentation Input' → 'Open Digital Inputs' (you: 'existing phrase is too long'). One Lexicon value — but FOUR Playwright gates find Present mode by that exact label, and all four were widened in the same commit so none of them could go silently blind. Mutation-proved: narrowing one back makes the sweep hang on 30-second lookups." },
  { id: "F8", sha: "591cadc", title: "Admin — category colours AND fill strength, contrast-guarded",
    path: "/innovation/", act: { kind: "admin", section: "Project Category Colours" }, clip: "section:has(h2:has-text('Project Category Colours'))",
    desc: "Per-category colour picker and a fill-strength (mask) slider, in the same shape as the Strategic Pillars rows. The override lives at a RESOLVER, not at any render site — six places draw that colour and wiring it anywhere else would put two greens on one screen. Each row shows the LIVE measured WCAG contrast of the tag's own metric text over that fill and turns red under 4.5:1, because the slider can otherwise silently make the board sheet unreadable." },
  { id: "F9", sha: "591cadc", title: "S1 as one sheet — judge the whole thing",
    path: "/innovation/", act: { kind: "present", project: "PRJ-01", slide: "S1" }, clip: "[data-slide-canvas]",
    desc: "The full exec one-pager with every change above landed together: tag top-left, dependency table, roadmap band, pipeline panel. Gated at 38/38 viewport checks, all 33 projects with zero overflow and zero label overprint, 20 real PDF pages, and pinch-zoom working on all 19 slides." },
  { id: "F10", sha: "414e6bc", title: "Settings — Feedback + eXeL AI at the very bottom, egg still unlocks",
    path: "/session/?id=DEMO2026&sim=1", act: { kind: "settings" }, clip: "[data-settings-footer]",
    desc: "The eXeL badge was UNREACHABLE from Settings — it lives in the page footer, behind the fixed z-50 panel, while the panel still reserved 80px of padding for a 'floating' badge that no longer floats. Feedback + eXeL AI are now the last row of the Settings list, below Atlantis Accord. Light Codex is untouched and still easter-egg gated. A new rendered gate drives the real unlock: three theme clicks → badge blinks → click → Simulation Mode with exactly one overlay." },
];

// ── 12 Ascended Masters + MoT for THIS session ──────────────────────────────────────────────
const ASM = [
  ["Aset", "Consistency", "A", "One producer now spells 'G1 · Concept' for both the roadmap band and the slide header, and one resolver spells every category colour for all six render sites. Two conventions that used to exist twice now exist once."],
  ["Asar", "Synthesis", "A−", "The sheet reads as one artifact: category-coloured tag, a dependency table keyed to the graph, a roadmap in the header's own grammar. The one loose thread is F6, and it is flagged rather than guessed."],
  ["Athena", "Flow", "A", "Visual first, admin last, exactly as the operator ordered it. The two height-growers shipped before anything cosmetic could spend the sheet's budget."],
  ["Christo", "Consensus", "B+", "Every change is additive to what was already agreed; nothing the operator did not ask about moved. F6 is the honest exception and it is escalated, not decided."],
  ["Enki", "Edge cases", "A", "Per-entry validation on the colour store, a clamped mask range, the no-dependency row, and the empty-half case in gateStageLabel. One bad value costs one thing, never the palette."],
  ["Enlil", "Build", "A−", "tsc 0 and a green build on every commit, seven commits, each pushed to both remotes before the next began."],
  ["Krishna", "Integration", "A", "The dependency table's Project # is the same p.id the constellation uses; the category override sits at a resolver precisely so six render sites cannot disagree."],
  ["Odin", "Foresight", "B+", "I predicted the fill would be re-tuned and kept it to one constant — then the operator asked for it in Admin, so it became a resolver with the constant as its seed. The prediction held; the conclusion did not."],
  ["Pangu", "Innovation", "B", "Nothing genuinely new was invented this round, and that is correct: every fix reused pillarColorOf's shape, the pillar store, the AmtsPanel frame, or the existing gates."],
  ["Sofia", "Perspective", "A−", "Shortening the labels makes colour load-bearing and roughly one in twelve readers cannot split this green from this orange — so the dot, the word and the tooltip all survive, each locked."],
  ["Thoth", "Data", "A", "Three claims were settled by measurement rather than argument: the 1.90:1 contrast, the 92px constant tag height, and the 5px pipeline gap that disproved my own fix."],
  ["Thor", "Risk / security", "A−", "The mask slider measures its own WCAG contrast and refuses to hide the text; admin colour in a printed sheet is an accepted, written-down exception. No secrets, no sacred-code changes."],
];
const MOT_GRADE = "A− · APPROVE WITH ONE OPEN QUESTION";
const MOT = `Seven commits shipped and are pushed to both remotes: the dog tag fills with its category and its text was re-measured against that fill, Dependencies became a real table keyed to the dependency graph, "G1 · Concept" became one producer used by both surfaces that print it, green went one step darker again, the deck button became "Open Digital Inputs" with all four test locators widened in the same commit, category colour AND fill strength became Admin settings behind a live contrast guard, and the Settings panel got Feedback + eXeL AI as its last row so the easter-egg unlock is reachable again. What earns the A− rather than an A is not the engineering, it is that THREE separate things I was about to ship turned out to be wrong and only measurement caught them: a router.push "fix" that fixed nothing (the real cause was my own test server's MIME type), a content-start prop that changed the rendered gap by zero pixels, and a launcher-count assertion that passed against a selector matching nothing. All three were reverted or tightened rather than shipped, and each is written into the commit that found it. The remaining open item is F6: the pipeline table sits below the "Target segment / customer" line, and moving it contradicts an earlier explicit instruction, so it needs one word rather than a guess. Cloudflare remains UNVERIFIED from this sandbox — the proxy 403s every host, so LIVE has not been confirmed and is not claimed.`;


// ── Static server over out/ ─────────────────────────────────────────────────────────────────
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".txt": "text/plain",
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

// ── Capture ─────────────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * ⚠ `act` IS A NAMED RECIPE, NOT ARBITRARY PAGE CODE. Every fix in this release lives either on S1 in
 * PRESENT mode or inside the Admin console, and the old capture() only did goto+unlock+screenshot — so
 * every card would have shown the same /innovation landing page and the artifact would have been useless
 * for feedback. Three recipes cover everything; `page` (the default) is the previous behaviour untouched,
 * so older manifests keep working. The Present chain is copied from the locator sequence already proven in
 * scripts/slide-shots.mjs rather than re-invented.
 */
async function drive(page, act) {
  const kind = act?.kind ?? "page";
  if (kind === "page") return;
  if (kind === "present") {
    await page.getByRole("button", { name: "Gate Requirements" }).first().click();
    if (act.project) await page.locator('select:has(option[value^="PRJ-"])').first().selectOption(act.project);
    await page.getByRole("button", { name: /Open (Digital (Presentation )?Inputs?|slide show)/i }).first().click();
    await page.getByRole("button", { name: `Go to slide ${act.slide || "S1"}` }).first().click({ timeout: 8000 });
    await page.getByRole("button", { name: /Present/ }).first().click();
    await page.waitForSelector("[data-slide-canvas]", { timeout: 15000 });
    await page.waitForTimeout(700);
    return;
  }
  if (kind === "admin") {
    await page.getByRole("button", { name: "Business Setup" }).first().click();
    await page.waitForTimeout(500);
    // ⚠ Business Setup has its OWN admin gate behind the deck's `369963` unlock. Without this the card
    // showed the code prompt instead of the section — a screenshot of a locked door, not of the feature.
    const admin = page.getByPlaceholder(/admin code/i).first();
    if (await admin.count()) {
      await admin.fill("369963");
      await page.getByRole("button", { name: /Unlock Business Setup/i }).first().click();
      await page.waitForTimeout(900);
    }
    if (act.section) {
      await page.evaluate((needle) => {
        const h = [...document.querySelectorAll("h2, h3")].find((e) => (e.textContent || "").toLowerCase().includes(needle.toLowerCase()));
        h?.scrollIntoView({ block: "center" });
      }, act.section);
      await page.waitForTimeout(400);
    }
    return;
  }
  if (kind === "settings") {         // the polling app's Settings slide-over, scrolled to its new footer row
    await page.getByRole("button", { name: "Settings" }).first().click();
    await page.getByRole("button", { name: "Settings" }).last().click();
    await page.waitForSelector("[data-settings-footer]", { timeout: 10000 });
    await page.evaluate(() => document.querySelector("[data-settings-footer]")?.scrollIntoView({ block: "end" }));
    await page.waitForTimeout(500);
    return;
  }
  if (kind === "gate") {           // the Gate Requirements screen itself — where "Open Digital Inputs" lives
    await page.getByRole("button", { name: "Gate Requirements" }).first().click();
    await page.waitForTimeout(600);
    return;
  }
  throw new Error(`unknown act kind "${kind}"`);
}

/** `clip` frames the card on the thing that changed. Falls back to the viewport if the selector misses —
 *  and says so, because a silently-wrong frame is worse than a wide one. */
async function shoot(page, clip) {
  if (!clip) return page.screenshot({ type: "png" });
  const el = page.locator(clip).first();
  if (await el.count()) {
    const box = await el.boundingBox();
    if (box && box.width > 8 && box.height > 8) {
      const pad = 10;
      const vp = page.viewportSize() || { width: 1240, height: 820 };
      return page.screenshot({ type: "png", clip: {
        x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad),
        width: Math.min(vp.width - Math.max(0, box.x - pad), box.width + pad * 2),
        height: Math.min(vp.height - Math.max(0, box.y - pad), box.height + pad * 2),
      } });
    }
  }
  console.warn(`  ! clip "${clip}" not found — falling back to the full viewport`);
  return page.screenshot({ type: "png" });
}

async function capture() {
  const { chromium } = await import("playwright");
  // Use the browser the environment already ships. Its build (1194) does not match what this Playwright
  // version would download (1217), and `playwright install` is forbidden here — so point at it explicitly
  // rather than fetching anything. CHROMIUM_PATH overrides for other machines.
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome",
    "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome",
  ].filter(Boolean);
  let executablePath;
  for (const c of candidates) { try { await stat(c); executablePath = c; break; } catch {} }
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 820 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const it of ITEMS) {
    try {
      await page.goto(`http://127.0.0.1:${PORT}${it.path}`, { waitUntil: "networkidle", timeout: 25000 });
      // The /innovation tool is gated behind the operator code; unlock if the field is present.
      const code = page.locator('input[type="password"], input[placeholder*="code" i]').first();
      if (await code.count()) { await code.fill("369963").catch(() => {}); await page.keyboard.press("Enter").catch(() => {}); }
      await page.waitForTimeout(1200);
      await drive(page, it.act);
      it.img = "data:image/png;base64," + (await shoot(page, it.clip)).toString("base64");
    } catch (e) {
      it.img = null;
      it.captureError = (e?.message || String(e)).slice(0, 140);
      console.warn(`  ! ${it.id} capture failed: ${it.captureError}`);
    }
  }
  await browser.close();
}

// ── Render — template held VERBATIM from Innovation_Feedback_2026.07.26_images.html ──────────
const CSS = `:root{--bg:#070b12;--panel:#0a0f16;--panel2:#0d141d;--line:#1e293b;--line2:#164e63;--ink:#cbd5e1;--dim:#7c8aa0;--cyan:#22d3ee;--amber:#eab308;--green:#34d399;--orange:#fbbf24;--violet:#c084fc;--rose:#fb7185;}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Segoe UI',system-ui,sans-serif;line-height:1.55;padding-bottom:150px}
h1,h2,h3{font-family:'Cascadia Code','Consolas',ui-monospace,monospace;font-weight:700}
.wrap{max-width:1180px;margin:0 auto;padding:22px 18px}
header.top{border-bottom:1px solid var(--line2);background:linear-gradient(180deg,#0a1420,#070b12);padding:26px 18px 20px}
header.top h1{color:var(--cyan);font-size:23px;letter-spacing:2px}
header.top .sub{color:var(--amber);margin-top:6px;font-size:14px}
header.top .meta{color:var(--dim);margin-top:8px;font-size:12px;font-family:'Consolas',monospace}
section{margin-top:30px}
h2{color:var(--cyan);font-size:16px;letter-spacing:2px;border-left:4px solid var(--cyan);padding-left:12px;margin-bottom:6px;text-transform:uppercase}
.lead{color:var(--dim);font-size:13px;margin:0 0 14px 16px}
.grid{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:820px){.grid{grid-template-columns:1fr 1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.card .head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line)}
.num{flex:none;width:30px;height:30px;border-radius:8px;background:#052a33;color:var(--cyan);display:flex;align-items:center;justify-content:center;font-family:'Consolas',monospace;font-weight:700}
.card .head .t{font-size:14px;color:#e2e8f0;font-weight:600}
.sha{margin-left:auto;font-family:'Consolas',monospace;font-size:10px;color:var(--dim);background:#0d141d;border:1px solid var(--line);border-radius:4px;padding:2px 6px;white-space:nowrap}
.shot{background:#000;border-bottom:1px solid var(--line)}
.shot img{display:block;width:100%;height:auto}
.shot .miss{color:var(--rose);font-family:'Consolas',monospace;font-size:12px;padding:26px 14px;text-align:center}
.desc{padding:10px 14px;font-size:12.5px;color:var(--ink)}
.fb{padding:10px 14px 14px;border-top:1px solid var(--line)}
.verdicts{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.verdicts label{color:var(--ink);font-family:'Consolas',monospace;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px}
input[type=radio]{accent-color:var(--amber)} .v-ap{color:var(--green)} .v-ch{color:var(--amber)} .v-na{color:var(--dim)}
textarea{width:100%;min-height:52px;background:#0d0b06;color:#e2e8f0;border:1px solid #3f3512;border-left:2px solid var(--amber);border-radius:6px;padding:8px;font-size:12.5px;resize:vertical;font-family:inherit}
.asm-grid{display:grid;grid-template-columns:1fr;gap:12px}@media(min-width:820px){.asm-grid{grid-template-columns:1fr 1fr}}
.asm{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--cyan);border-radius:8px;padding:12px 14px}
.asm h3{font-size:13px;color:var(--cyan)} .asm .role{color:var(--amber);font-size:10.5px;font-family:'Consolas',monospace;text-transform:uppercase;letter-spacing:1px;margin:2px 0 6px} .asm p{font-size:12.5px} .asm .grade{float:right;font-family:'Consolas',monospace;font-size:12px;border:1px solid var(--line2);border-radius:4px;padding:1px 7px;color:var(--green)}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px 16px;margin-bottom:12px}
/* mobile: tables scroll inside their own box; the page never scrolls sideways.
   Long unbroken tokens (filenames, hashes) wrap instead of pushing the layout. */
.xscroll{overflow-x:auto;max-width:100%}
body{overflow-wrap:anywhere}
.mot{border-left:3px solid var(--amber);background:linear-gradient(180deg,#12100a,#0a0f16)} .mot h3{color:var(--amber)}
table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:6px}
th{text-align:left;color:var(--amber);font-family:'Consolas',monospace;font-size:11px;padding:7px 9px;border-bottom:1px solid var(--line2)}
td{padding:8px 9px;border-bottom:1px solid #111827;vertical-align:top}
.pill{font-family:'Consolas',monospace;font-size:10px;padding:2px 7px;border-radius:4px;border:1px solid var(--line2);color:var(--cyan);white-space:nowrap}
.bar{position:fixed;left:0;right:0;bottom:0;background:rgba(7,11,18,.96);border-top:1px solid var(--line2);padding:12px 18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;z-index:50}
.bar .stat{font-family:'Consolas',monospace;font-size:12px;color:var(--dim)}
button.act{font-family:'Consolas',monospace;font-size:13px;font-weight:700;border:none;border-radius:7px;padding:9px 16px;cursor:pointer}
.b-save{background:#0d141d;color:var(--cyan);border:1px solid var(--line2)} .b-json{background:var(--cyan);color:#06202a} .b-reset{background:#0d141d;color:var(--dim);border:1px solid var(--line)}`;

function render() {
  const cards = ITEMS.map((it, i) => `  <div class="card">
    <div class="head"><div class="num">${i + 1}</div><div class="t">${esc(it.title)}</div><div class="sha">${it.id} · ${it.sha}</div></div>
    <div class="shot">${it.img ? `<img alt="${esc(it.title)}" src="${it.img}">` : `<div class="miss">screenshot not captured — ${esc(it.captureError || "unknown")}<br>(reported, never faked)</div>`}</div>
    <div class="desc">${esc(it.desc)}</div>
    <div class="fb">
      <div class="verdicts">
        <label class="v-ap"><input type="radio" name="v-${it.id}" value="APPROVE">Approve</label>
        <label class="v-ch"><input type="radio" name="v-${it.id}" value="CHANGES">Changes</label>
        <label class="v-na"><input type="radio" name="v-${it.id}" value="N/A">N/A</label>
      </div>
      <textarea id="c-${it.id}" placeholder="Comment for ${it.id}…"></textarea>
    </div>
  </div>`).join("\n");

  const asm = ASM.map(([n, role, grade, txt]) =>
    `<div class="asm"><h3>${n}<span class="grade">${grade}</span></h3><div class="role">${role}</div><p>${esc(txt)}</p></div>`).join("");

  const manifest = JSON.stringify(ITEMS.map(({ id, sha, title }) => ({ id, sha, title })));
  const KEY = `innovation-feedback-images-${STAMP.replace(/\./g, "-")}`;
  const jsonName = `${STAMP}_Innovation_FEEDBACK_images.json`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>eXeL-AI · Innovation Project · Feedback (images) · ${STAMP}</title>
<style>
${CSS}
</style></head><body>
<header class="top"><div class="wrap">
<h1>eXeL-AI · INNOVATION PROJECT — FEEDBACK (WITH IMAGES)</h1>
<div class="sub">Real screenshots of the live /innovation tool · number + picture + approve + save + JSON</div>
<div class="meta">stamp ${STAMP} · latest sha ${HEAD} · ${ITEMS.length} captured surfaces · 12 Ascended Masters + MoT</div>
</div></header>
<div class="wrap">
<section><h2>Shipped surfaces — approve each (real screenshots)</h2>
<p class="lead">Captured from the built app (code 369963). Each card carries the SHA of the commit that shipped it, so a comment is always traceable to the code it was written against. Set a verdict + comment; Save persists to this browser; Download JSON exports the roll-up.</p>
<div class="grid">
${cards}
</div></section>

<section><h2>12 Ascended Masters — grades</h2>
<div class="asm-grid">${asm}</div>
<div class="panel mot" style="margin-top:12px"><h3>Master of Thought — synthesis <span style="float:right;font-family:Consolas,monospace;font-size:12px;color:var(--amber)">${MOT_GRADE}</span></h3>
<p style="font-size:12.5px;margin-top:6px">${esc(MOT)}</p></div></section>

<section><h2>Traceability — surface → commit</h2>
<div class="panel"><div class="xscroll"><table><thead><tr><th>ID</th><th>Surface</th><th>Shipped in</th></tr></thead><tbody>
${ITEMS.map((it) => `<tr><td><span class="pill">${it.id}</span></td><td>${esc(it.title)}</td><td><span class="pill">${it.sha}</span></td></tr>`).join("\n")}
</tbody></table></div></div></section>
</div>

<div class="bar"><span class="stat" id="stat">0 / ${ITEMS.length} reviewed</span><span style="flex:1"></span>
<button class="act b-reset" onclick="resetFb()">Reset</button><button class="act b-save" onclick="saveFb()">Save</button><button class="act b-json" onclick="downloadJSON()">Download JSON</button></div>
<script>
const ITEMS=${manifest};const KEY='${KEY}';
function collect(){const features={};ITEMS.forEach(it=>{const v=document.querySelector('input[name="v-'+it.id+'"]:checked');features[it.id]={sha:it.sha,title:it.title,verdict:v?v.value:null,comment:document.getElementById('c-'+it.id).value};});return {release:'eXeL-AI · INNOVATION PROJECT (images)',stamp:'${STAMP}',sha:'${HEAD}',features};}
function refresh(){const p=collect();const d=Object.values(p.features).filter(f=>f.verdict).length;document.getElementById('stat').textContent=d+' / '+ITEMS.length+' reviewed';}
function dl(){const b=new Blob([JSON.stringify(collect(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='${jsonName}';a.click();}
function saveFb(){localStorage.setItem(KEY,JSON.stringify(collect()));refresh();document.getElementById('stat').textContent+=' · saved ✓';dl();}
function resetFb(){localStorage.removeItem(KEY);document.querySelectorAll('input[type=radio]').forEach(r=>r.checked=false);document.querySelectorAll('textarea').forEach(t=>t.value='');refresh();}
function downloadJSON(){dl();}
(function(){const s=localStorage.getItem(KEY);if(s){try{const p=JSON.parse(s);Object.entries(p.features||{}).forEach(([id,f])=>{if(f.verdict){const r=document.querySelector('input[name="v-'+id+'"][value="'+f.verdict+'"]');if(r)r.checked=true;}const c=document.getElementById('c-'+id);if(c&&f.comment)c.value=f.comment;});}catch(e){}}refresh();})();
document.addEventListener('change',refresh);document.addEventListener('input',refresh);
</script></body></html>`;
}

// ── Run ─────────────────────────────────────────────────────────────────────────────────────
console.log(`feedback-artifact · stamp ${STAMP} · sha ${HEAD} · ${ITEMS.length} surfaces`);
const server = serve();                       // must be listening BEFORE the browser navigates
await new Promise((r) => server.once("listening", r));
await capture();
server.close();
await mkdir(DOCS, { recursive: true });
const base = join(DOCS, `${STAMP}_Innovation_FEEDBACK_images`);
await writeFile(`${base}.html`, render(), "utf8");
// Companion JSON — the SAME shape downloadJSON() produces, pre-seeded with null verdicts so the roll-up
// exists as a file even before the operator opens the page.
await writeFile(`${base}.json`, JSON.stringify({
  release: "eXeL-AI · INNOVATION PROJECT (images)", stamp: STAMP, sha: HEAD,
  features: Object.fromEntries(ITEMS.map((it) => [it.id, { sha: it.sha, title: it.title, verdict: null, comment: "" }])),
}, null, 2) + "\n", "utf8");

const captured = ITEMS.filter((i) => i.img).length;
console.log(`  HTML  ${base}.html`);
console.log(`  JSON  ${base}.json`);
console.log(`  shots ${captured}/${ITEMS.length} captured${captured < ITEMS.length ? " — failures are marked in the artifact, not faked" : ""}`);
process.exit(0);
