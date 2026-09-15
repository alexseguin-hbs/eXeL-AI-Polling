#!/usr/bin/env node
/**
 * drone-shots — capture the Drone-2525 arena from the REAL static export, at the two widths that matter.
 *
 * Reuses the settings-egg-gate harness verbatim: a node:http server over `out/` plus the preinstalled
 * Chromium. Nothing is mocked — what lands in the PNG is what the deployed build paints. Every shot waits
 * on a stable selector and fails loudly; a blank stage is reported as blank, never padded.
 *
 * Run:  npm run build && node scripts/drone-shots.mjs
 */
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const SHOTS = process.env.DRONE_SHOTS_DIR || join(ROOT, "..", "shots-drone");
const PORT = Number(process.env.DRONE_PORT || 4637);

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
    const body = await readFile(f);   // read BEFORE the header, or a miss writes headers twice
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

const URL_BASE = `http://127.0.0.1:${PORT}`;
const shots = [];
let bad = 0;

async function shoot(ctx, name, width, height, steps = async () => {}) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(`${URL_BASE}/main/Drone-2525/`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-drone-arena] svg path", { timeout: 20000 });
  await steps(page);
  const paths = await page.locator("[data-drone-arena] svg path").count();
  const hud = (await page.locator("[data-drone-fidelity]").first().textContent().catch(() => "")) ?? "";
  const file = join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file });
  if (paths < 5) { console.error(`BLANK: ${name} drew only ${paths} paths`); bad++; }
  shots.push({ name, width, paths, hud: hud.trim(), file });
  await page.close();
}

(async () => {
  await mkdir(SHOTS, { recursive: true });
  const browser = await launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  try {
    await shoot(ctx, "01-arena-desktop-ultra", 1440, 900);
    await shoot(ctx, "02-arena-desktop-low", 1440, 900, async (p) => {
      await p.click("[data-drone-tier='low']");
      await p.waitForTimeout(600);
    });
    await shoot(ctx, "03-arena-phone", 390, 844);
    await shoot(ctx, "04-arena-phone-capital", 390, 844, async (p) => {
      await p.click("[data-drone-mode='capital']");
      await p.waitForTimeout(400);
    });
    // Play a real round, headlessly: start the clock, swing to a door, photograph it, fire.
    await shoot(ctx, "05-round-played", 1440, 900, async (p) => {
      await p.click("[data-drone-mode='capital']");
      await p.click("[data-drone-run]");
      await p.waitForTimeout(900);
      for (let i = 0; i < 6; i++) {
        await p.click("[data-drone-next]");
        await p.waitForTimeout(3200);   // a 45°/s gimbal needs time to arrive; rushing it is the player's error, not the game's
        const aimed = (await p.locator("[data-drone-note]").textContent()) ?? "";
        const aimNow = (await p.locator("[data-drone-aim]").textContent()) ?? "";
        await p.click("[data-drone-capture]", { timeout: 1500 }).catch(() => {});
        await p.waitForTimeout(250);
        const afterCap = (await p.locator("[data-drone-note]").textContent()) ?? "";
        await p.click("[data-drone-shoot]", { timeout: 1500 }).catch(() => {});
        await p.waitForTimeout(250);
        const afterShot = (await p.locator("[data-drone-note]").textContent()) ?? "";
        console.log(`    attempt ${i + 1}: ${aimNow.trim()} at "${aimed.trim()}" → capture "${afterCap.trim()}" → shoot "${afterShot.trim()}"`);
      }
      const note = await p.locator("[data-drone-note]").textContent();
      const sc = await p.locator("[data-drone-score]").textContent();
      const aim = await p.locator("[data-drone-aim]").textContent();
      console.log(`  round: score "${(sc ?? "").trim()}" · aim "${(aim ?? "").trim()}" · last "${(note ?? "").trim()}"`);
      await p.click("[data-drone-run]");
      const log = await p.locator("details summary").first();
      if (await log.count()) await log.click();
      await p.waitForTimeout(200);
    });
  } finally { await browser.close(); server.close(); }

  console.log("\nDrone-2525 shots");
  for (const s of shots) console.log(`  ${s.name.padEnd(26)} ${String(s.width).padStart(4)}px  ${String(s.paths).padStart(3)} paths  ${s.hud}`);
  console.log(`\n→ ${SHOTS}`);
  process.exit(bad ? 1 : 0);
})();
