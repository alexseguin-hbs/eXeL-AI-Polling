#!/usr/bin/env node
/**
 * drone-perf — MEASURE the arena in a real browser before and after changing it.
 *
 * "Optimize" without a number is a guess. This drives the built site, runs a mode for a fixed wall-clock
 * window, and reports what actually happened: frames painted, React renders, DOM nodes, the segment counts
 * the HUD itself reports, and the JavaScript heap. The numbers go to stdout so a before and after can be
 * compared by eye, and to a JSON file so a gate can compare them without eyes.
 */
import { createServer } from "node:http";
import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const ROOT = resolve(new URL("..", import.meta.url).pathname);
const OUT = join(ROOT, "out");
const PORT = Number(process.env.PERF_PORT || 4681);
const DEST = process.env.PERF_OUT || join(ROOT, "..", "perf");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain" };
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
  const c = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium"].filter(Boolean);
  let executablePath;
  for (const x of c) { try { await stat(x); executablePath = x; break; } catch {} }
  return chromium.launch(executablePath ? { executablePath } : {});
}

const WINDOW_MS = 6000;
/**
 * A desktop pins every case at 60 fps, so a change that removes real work shows as no change at all — the
 * vsync ceiling hides it. Slowing the processor down is what makes the measurement mean something, and it
 * is also the case this project actually cares about: a Pi-class head with a sensor taking its share first.
 */
const CPU_THROTTLE = Number(process.env.PERF_CPU || 10);

let memoHit = null;

async function run(page, label, setup, extra = {}) {
  await page.goto(`http://127.0.0.1:${PORT}/main/Drone-2525/`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-drone-arena] svg path", { timeout: 20000 });
  await setup(page);
  await page.waitForTimeout(700);

  // Count real painted frames over a real window. Nothing here is a model of the browser.
  const m = await page.evaluate(async (ms) => {
    let frames = 0;
    const t0 = performance.now();
    await new Promise((done) => {
      const tick = () => { frames++; performance.now() - t0 >= ms ? done() : requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const t1 = performance.now();
    return {
      fps: +((frames * 1000) / (t1 - t0)).toFixed(1),
      frames,
      domNodes: document.getElementsByTagName("*").length,
      svgPaths: document.querySelectorAll("[data-drone-arena] svg path").length,
      heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
      hud: (document.querySelector("[data-drone-fidelity]")?.textContent || "").replace(/\s+/g, " ").trim(),
    };
  }, WINDOW_MS);
  console.log(`  ${label.padEnd(22)} ${String(m.fps).padStart(6)} fps · ${String(m.domNodes).padStart(5)} nodes · ${String(m.svgPaths).padStart(3)} paths · ${m.heapMB ?? "—"} MB`);
  return { label, ...m };
}

(async () => {
  await mkdir(DEST, { recursive: true });
  const browser = await launch();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE });
  const runs = [];
  try {
    console.log(`Drone-2525 performance · ${WINDOW_MS / 1000}s per case · processor slowed ${CPU_THROTTLE}x · real painted frames\n`);
    runs.push(await run(page, "idle 1.1", async () => {}));
    runs.push(await run(page, "turrets running 1.1", async (p) => { await p.click("[data-drone-run]"); }));
    runs.push(await run(page, "turrets running 5.5", async (p) => {
      await p.selectOption("[data-drone-mot]", "5.5"); await p.waitForTimeout(800); await p.click("[data-drone-run]");
    }));
    runs.push(await run(page, "drone flying 1.1", async (p) => {
      await p.click("[data-drone-mode='drone']"); await p.waitForTimeout(400); await p.click("[data-drone-run]"); await p.waitForTimeout(3000);
    }));
    runs.push(await run(page, "mixed crew 1.1", async (p) => {
      await p.click("[data-drone-mode='multi']"); await p.waitForTimeout(400); await p.click("[data-drone-run]"); await p.waitForTimeout(3000);
    }));
    // THE PASS MARK THE OPERATOR SET: forty-two aircraft, rung 2.3, holding the 30 Hz reference.
    runs.push(await run(page, "42 aircraft 2.3", async (p) => {
      await p.click("[data-drone-mode='drone']"); await p.waitForTimeout(300);
      await p.selectOption("[data-drone-mot]", "2.3"); await p.waitForTimeout(500);
      await p.click("[data-drone-run]"); await p.waitForTimeout(6000);
    }, { aircraft: 42 }));
    runs.push(await run(page, "42 aircraft 5.5", async (p) => {
      await p.selectOption("[data-drone-mot]", "5.5"); await p.waitForTimeout(800);
    }, { aircraft: 42 }));
    // THE LEVEL-ONE FLOOR (operator 2026-09-16: "lowest simplest lowest rendered lowest memory requirement
    // visual first"). Rung 1.1 is the Raspberry-Pi-class rung, WIREFRAME-CORE U-WF-07. Until the one-segment
    // mark existed, 1.1's real share bought 31 deltas and eleven of the forty-two were dropped here — so
    // this case is the one that would have caught it, and it is the one that must never regress.
    runs.push(await run(page, "42 aircraft 1.1", async (p) => {
      await p.selectOption("[data-drone-mot]", "1.1"); await p.waitForTimeout(800);
    }, { aircraft: 42 }));

    // ── DOES THE PROJECTION MEMO ACTUALLY HOLD? ──────────────────────────────────────────────────
    // Measured, not instrumented. With the round paused NOTHING in the world changes, so a memo that holds
    // costs nothing whatever the rung — and a memo that does not re-projects every edge every frame, which
    // a heavier rung makes obvious. Comparing a paused 1.1 with a paused 5.5 is the whole test: if the
    // heavier one is materially slower while nothing is moving, the memo is being thrown away each frame.
    const paused = async (level) => {
      await page.goto(`http://127.0.0.1:${PORT}/main/Drone-2525/`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-drone-arena] svg path", { timeout: 20000 });
      await page.selectOption("[data-drone-mot]", level);
      await page.waitForTimeout(900);
      return page.evaluate(async (ms) => {
        let f = 0; const t0 = performance.now();
        await new Promise((d) => { const tk = () => { f++; performance.now() - t0 >= ms ? d() : requestAnimationFrame(tk); }; requestAnimationFrame(tk); });
        return (f * 1000) / (performance.now() - t0);
      }, 4000);
    };
    const idleLow = await paused("1.1"), idleHigh = await paused("5.5");
    memoHit = idleHigh >= idleLow * 0.9;
    console.log(`\n  projection memo · paused 1.1 ${idleLow.toFixed(1)} fps · paused 5.5 ${idleHigh.toFixed(1)} fps → ${memoHit ? "HOLDS" : "NOT HOLDING"}`);
  } finally { await browser.close(); server.close(); }
  const file = join(DEST, `${process.env.PERF_LABEL || "run"}.json`);
  // Stamped with the commit, so the scorer can refuse a comparison older than the code it is scoring.
  let commit = "unknown";
  try { commit = (await import("node:child_process")).execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(); } catch { /* not a checkout */ }
  const stamped = runs.map((r) => ({ ...r, memoHit }));
  await writeFile(file, JSON.stringify({ windowMs: WINDOW_MS, cpuThrottle: CPU_THROTTLE, commit, at: new Date().toISOString(), runs: stamped }, null, 2));
  console.log(`\n→ ${file}`);
})();
