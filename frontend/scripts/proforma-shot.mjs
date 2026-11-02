#!/usr/bin/env node
/**
 * PROFORMA SHOT — real 390px capture of the HOME BUILDING PROCESS pro-forma table (Build → Estimate tab)
 * against the LOCAL static build (out/). Writes PNGs to shots/proforma/.
 */
import { mkdir, stat } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";

const OUTDIR = resolve(new URL("..", import.meta.url).pathname, "shots/proforma");
const OUT = resolve(new URL("..", import.meta.url).pathname, "out");
const PORT = 4791;
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTE = process.env.ARCH_ROUTE || "/Architect-2525/";

const srv = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: OUT, stdio: "ignore" });
const shots = [];
try {
  await mkdir(OUTDIR, { recursive: true });
  await new Promise((r) => setTimeout(r, 1200));
  const { chromium } = await import("playwright");
  const cands = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/chromium"].filter(Boolean);
  let executablePath; for (const x of cands) { try { await stat(x); executablePath = x; break; } catch {} }
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 1500 }, deviceScaleFactor: 2 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(BASE + ROUTE, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1500);

  const clickByText = async (txt) => page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find((x) => (x.textContent || "").trim() === t);
    if (b) { b.click(); return true; } return false;
  }, txt);

  const build = await clickByText("Build");
  await page.waitForTimeout(500);
  const est = await clickByText("Estimate");
  await page.waitForTimeout(700);
  const found = await page.evaluate(() => { const el = document.querySelector("[data-arch-proforma]"); if (el) el.scrollIntoView({ block: "center" }); return !!el; });
  await page.waitForTimeout(500);

  const whole = join(OUTDIR, "estimate-whole-390.png");
  await page.screenshot({ path: whole, fullPage: true }); shots.push(whole);
  const pf = page.locator("[data-arch-proforma]").first();
  const n = await pf.count();
  if (n) { try { const p = join(OUTDIR, "proforma-section-390.png"); await pf.screenshot({ path: p }); shots.push(p); } catch {} }
  const text = n ? (await pf.innerText()).replace(/\s+/g, " ").trim() : "(no [data-arch-proforma] found)";
  console.log(JSON.stringify({ build, est, found, pfCount: n, shots: shots.length, errs, text }, null, 2));
  await browser.close();
} catch (e) { console.log("proforma-shot FAILED:", e.message); } finally { srv.kill("SIGKILL"); }
console.log("\nSHOTS (" + shots.length + "):");
for (const s of shots) console.log("  " + s);
process.exit(shots.length ? 0 : 1);
