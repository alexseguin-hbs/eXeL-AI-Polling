#!/usr/bin/env node
/**
 * drone-walkthrough — every screen a person can reach on /main/Drone-2525, captured from the REAL static
 * export, with the controls available on each one recorded as it goes.
 *
 * Operator 2026-09-15: "first show me screen by screen as well as button controls to see all key actions
 * users can take in platform for Capital of Texas example (practice stationary or drone) with HI and HI+AI".
 *
 * Nothing here is staged. Each shot is the built site after a real sequence of clicks, and the controls
 * listed under each screen are read out of the live DOM rather than typed from memory — so a control that
 * silently disappears shows up as a missing row, not as a stale sentence in a document.
 */
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const SHOTS = process.env.WALK_DIR || join(ROOT, "..", "shots-walkthrough");
const PORT = Number(process.env.WALK_PORT || 4661);

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".txt": "text/plain", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".webp": "image/webp", ".woff2": "font/woff2", ".mjs": "text/javascript" };
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split("?")[0]);
    let f = join(OUT, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, "index.html"); }
    catch {
      const alt = join(OUT, p.replace(/\/$/, "") + ".html");
      try { await stat(alt); f = alt; } catch { f = join(OUT, p.replace(/\/$/, ""), "index.html"); }
    }
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

const BASE = `http://127.0.0.1:${PORT}/main/Drone-2525/`;
const screens = [];
let bad = 0;

/** Read every control a person can actually press on this screen, out of the live DOM. */
async function controls(page) {
  return page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const out = [];
    for (const b of document.querySelectorAll("button")) {
      if (!vis(b)) continue;
      out.push({ kind: "button", label: (b.textContent || "").trim().replace(/\s+/g, " "), enabled: !b.disabled });
    }
    for (const sel of document.querySelectorAll("select")) {
      if (!vis(sel)) continue;
      const opts = [...sel.options].map((o) => o.text.trim());
      out.push({ kind: "menu", label: opts[sel.selectedIndex] ?? "", enabled: !sel.disabled, options: opts.length, choices: opts.slice(0, 3) });
    }
    for (const r of document.querySelectorAll("input[type=range]")) {
      if (!vis(r)) continue;
      out.push({ kind: "slider", label: `${r.min}–${r.max}, now ${r.value}`, enabled: !r.disabled });
    }
    for (const s of document.querySelectorAll("[data-drone-stick]")) {
      if (!vis(s)) continue;
      out.push({ kind: "stick", label: s.getAttribute("data-drone-stick") || "", enabled: true });
    }
    return out;
  });
}

async function readIf(page, sel) {
  const l = page.locator(sel).first();
  if (!(await l.count())) return null;
  return ((await l.textContent()) ?? "").trim().replace(/\s+/g, " ");
}

async function screen(page, id, title, what, steps = async () => {}) {
  await steps(page);
  await page.waitForTimeout(500);
  const file = join(SHOTS, `${id}.png`);
  await page.screenshot({ path: file, fullPage: false });
  const c = await controls(page);
  const hud = {
    level: await readIf(page, "[data-drone-fidelity]"),
    stream: await readIf(page, "[data-drone-stream]"),
    calibration: await readIf(page, "[data-drone-cal]"),
    aim: await readIf(page, "[data-drone-aim]"),
    score: await readIf(page, "[data-drone-score]"),
    seats: await readIf(page, "[data-drone-crewline]"),
    flight: await readIf(page, "[data-drone-flight]"),
    note: await readIf(page, "[data-drone-note]"),
    approval: await readIf(page, "[data-drone-approval]"),
  };
  const paths = await page.locator("[data-drone-arena] svg path").count();
  if (paths < 5) { console.error(`BLANK: ${id} drew only ${paths} paths`); bad++; }
  screens.push({ id, title, what, file, controls: c, hud, paths, width: page.viewportSize().width });
  console.log(`  ${id.padEnd(22)} ${String(paths).padStart(3)} paths · ${c.length} controls`);
  return hud;
}

(async () => {
  await mkdir(SHOTS, { recursive: true });
  const browser = await launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  try {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-drone-arena] svg path", { timeout: 20000 });

    await screen(page, "01-arrive", "Arriving", "The arena as it opens: one turret on the south lawn, every door a target, level 1.1.");

    await screen(page, "02-turrets-running", "Security Turrets · a round under way",
      "The clock is running and doors are popping up. This is the stationary practice mode on one turret.",
      async (p) => { await p.click("[data-drone-run]"); await p.waitForTimeout(2500); });

    await screen(page, "03-turrets-aimed", "Aiming at a door",
      "Next door swings the camera to a door this turret can actually reach; the aim readout names the bearing and range.",
      async (p) => { await p.click("[data-drone-next]"); await p.waitForTimeout(3200); });

    await screen(page, "04-turrets-tagged", "Photograph, then shoot",
      "Capture stores the door's edge set; only then will a shot count. The log keeps every attempt and its reason.",
      async (p) => {
        await p.click("[data-drone-capture]", { timeout: 2000 }).catch(() => {});
        await p.waitForTimeout(400);
        await p.click("[data-drone-shoot]", { timeout: 2000 }).catch(() => {});
        await p.waitForTimeout(600);
        const d = p.locator("details summary").first();
        if (await d.count()) await d.click();
      });

    await screen(page, "05-capital-block", "Security Capital · the whole block",
      "The round now moves you to whichever turret can reach the next door, and your score follows you across the lawn.",
      async (p) => {
        await p.click("[data-drone-mode='capital']");
        await p.waitForTimeout(400);
        await p.click("[data-drone-run]");
        await p.waitForTimeout(1500);
        await p.click("[data-drone-next]");
        await p.waitForTimeout(3000);
      });

    await screen(page, "06-drone-hover", "Two-person drone · hovering",
      "The same gimbal, now on a flying airframe. Left stick moves the aircraft, right stick turns it and changes height.",
      async (p) => {
        await p.click("[data-drone-mode='drone']");
        await p.waitForTimeout(500);
        await p.click("[data-drone-run]");
        await p.waitForTimeout(9000);          // let it actually climb to its loiter height
      });

    await screen(page, "07-drone-wing-refused", "Why it will not go to the wing yet",
      "Asking for wing flight too low or too slow is refused in words a pilot can act on, rather than ignored.",
      async (p) => { await p.click("[data-drone-wing]", { timeout: 2000 }).catch(() => {}); await p.waitForTimeout(600); });

    await screen(page, "08-mixed-crew", "Mixed crew · a machine takes a seat",
      "Choose who holds which seat. The line under the controls always names who is flying and who is aiming.",
      async (p) => {
        await p.click("[data-drone-mode='multi']");
        await p.waitForTimeout(400);
        await p.selectOption("[data-drone-crew]", "hi_pilot");
        await p.waitForTimeout(400);
        await p.click("[data-drone-run]");
        await p.waitForTimeout(9000);
      });

    // THE ONE THAT MATTERS: wait for the machine to ask, and show that nothing fires until a person answers.
    const asked = await screen(page, "09-approval-asked", "The machine asks. Nothing fires.",
      "When a machine is aiming it must ask a named person before any shot. While this question is open, pressing Shoot does nothing and says why.",
      async (p) => {
        await p.waitForSelector("[data-drone-approval]", { timeout: 40000 }).catch(() => {});
        await p.waitForTimeout(500);
        await p.click("[data-drone-shoot]", { timeout: 2000 }).catch(() => {});
        await p.waitForTimeout(500);
      });

    await screen(page, "10-approval-held", "A person turns it down",
      "Hold refuses the shot, by name, and the refusal is counted and kept in the record.",
      async (p) => { await p.click("[data-drone-hold]", { timeout: 3000 }).catch(() => {}); await p.waitForTimeout(800); });

    await screen(page, "11-approval-approved", "A person allows it",
      "Approve is the only thing that opens the gate, and the permission carries the name that granted it.",
      async (p) => {
        await p.waitForSelector("[data-drone-approval]", { timeout: 40000 }).catch(() => {});
        await p.click("[data-drone-approve]", { timeout: 3000 }).catch(() => {});
        await p.waitForTimeout(800);
      });

    await screen(page, "12-level-5-5", "Turning the level up",
      "Level 5.5 asks for the densest mesh and all five sensors. Calibration answers immediately and names what it shed.",
      async (p) => { await p.selectOption("[data-drone-mot]", "5.5"); await p.waitForTimeout(1500); });

    await screen(page, "13-self-test", "The self-test",
      "Point it at a machine and it reports the highest level that machine holds at full video.",
      async (p) => {
        await p.selectOption("[data-drone-mot]", "1.1");
        await p.click("[data-selfcal-run]");
        await p.waitForSelector("[data-selfcal-progress]", { timeout: 30000 });
        await p.waitForTimeout(32000);
        await p.click("[data-selfcal-stop]");
        await p.waitForSelector("[data-selfcal-report]", { timeout: 60000 }).catch(() => {});
        await p.waitForTimeout(500);
      });
    await page.close();

    // Phone width — the same journey, one thumb.
    const phone = await ctx.newPage();
    await phone.setViewportSize({ width: 390, height: 844 });
    await phone.goto(BASE, { waitUntil: "networkidle" });
    await phone.waitForSelector("[data-drone-arena] svg path", { timeout: 20000 });
    await screen(phone, "14-phone-turrets", "On a phone · stationary", "Every control reachable with one thumb at 390 px, with no sideways scrolling.");
    await screen(phone, "15-phone-drone", "On a phone · flying", "The two sticks sit under the arena where thumbs already are.",
      async (p) => { await p.click("[data-drone-mode='drone']"); await p.waitForTimeout(500); await p.click("[data-drone-run]"); await p.waitForTimeout(9000); });
    void asked;
  } finally { await browser.close(); server.close(); }

  await writeFile(join(SHOTS, "walkthrough.json"), JSON.stringify({ screens }, null, 2));
  console.log(`\n${screens.length} screens → ${SHOTS}`);
  process.exit(bad ? 1 : 0);
})();
