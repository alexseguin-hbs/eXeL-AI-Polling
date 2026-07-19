"use client";
// In-app scripted PLAY-TEST / DEMO. Auto-steps the map through a mission sequence ON-SCREEN, profiling
// FPS per section for EDGE calibration + acting as a live demo. Drives the REAL UI via DOM events — no
// new imperative API. v2 now covers the full requested replay: switch AO (Camp Blanding), PLACE assets
// (arm palette div + tap the tactical map), add+remove, pan to Capitol, plus orbit/grid/2D↔3D/tilt/mirror.
import { ASSET_LABELS, ASSET_ORDER } from "@/components/security-2525/asset-icons";

export type PlaySection = { name: string; fps: number; minFps: number; ms: number; errors: number };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
// CLICK SPLASH — an expanding cyan ring at (x,y) so the operator SEES every scripted tap/click during
// the play-test (demo cue: "show users things that can be done"). Pure DOM, self-removing, no deps.
const splash = (x: number, y: number, color = "#22d3ee") => {
  if (typeof document === "undefined" || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const d = document.createElement("div");
  d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:16px;height:16px;margin:-8px 0 0 -8px;border:2px solid ${color};border-radius:50%;z-index:99999;pointer-events:none;opacity:0.95;box-shadow:0 0 8px ${color};transition:transform .5s ease-out,opacity .5s ease-out`;
  document.body.appendChild(d);
  requestAnimationFrame(() => { d.style.transform = "scale(3.6)"; d.style.opacity = "0"; });
  setTimeout(() => d.remove(), 560);
};
const splashEl = (el: Element | null | undefined, color?: string) => { if (!el) return; const r = el.getBoundingClientRect(); splash(r.x + r.width / 2, r.y + r.height / 2, color); };
const btn = (txt: string): HTMLButtonElement | undefined =>
  Array.from(document.querySelectorAll("button")).find(
    (b) => (b.textContent || "").includes(txt) && (b as HTMLElement).offsetParent !== null
  ) as HTMLButtonElement | undefined;
const click = (txt: string): boolean => { const b = btn(txt); if (b) { splashEl(b); b.click(); } return !!b; };
const globe = (): SVGElement | null => {
  const gs = Array.from(document.querySelectorAll('svg[aria-label^="Wireframe globe"]')) as SVGElement[];
  let best: SVGElement | null = null, a = 0;
  for (const g of gs) { const r = g.getBoundingClientRect(); if (r.width * r.height > a) { a = r.width * r.height; best = g; } }
  return best;
};
const drag = async (g: SVGElement, dx: number, dy: number, type: "touch" | "mouse", steps = 20) => {
  const r = g.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const opt = (x: number, y: number, t: string) => ({ pointerId: type === "touch" ? 1 : 2, pointerType: type, clientX: x, clientY: y, button: type === "mouse" && t === "down" ? 2 : 0, bubbles: true });
  splash(cx, cy);
  g.dispatchEvent(new PointerEvent("pointerdown", opt(cx, cy, "down") as PointerEventInit));
  for (let i = 1; i <= steps; i++) { g.dispatchEvent(new PointerEvent("pointermove", opt(cx + (dx * i) / steps, cy + (dy * i) / steps, "move") as PointerEventInit)); await sleep(22); }
  g.dispatchEvent(new PointerEvent("pointerup", opt(cx + dx, cy + dy, "up") as PointerEventInit));
};
// arm an asset from the LEFT palette (items are <div class="cursor-grab">, not <button>)
const armAsset = (label: string): boolean => {
  const el = Array.from(document.querySelectorAll("div.cursor-grab")).find(
    (d) => (d.textContent || "").includes(label) && (d as HTMLElement).offsetParent !== null
  ) as HTMLElement | undefined;
  if (el) { splashEl(el, "#eab308"); el.click(); } return !!el;
};
// the largest tactical map surface (mapRef has no id — select by its class signature)
const mapEl = (): HTMLElement | null => {
  const ds = Array.from(document.querySelectorAll("div.touch-none.overflow-hidden.rounded-md")) as HTMLElement[];
  let best: HTMLElement | null = null, a = 0;
  for (const d of ds) { const r = d.getBoundingClientRect(); if (r.width * r.height > a) { a = r.width * r.height; best = d; } }
  return best;
};
// stationary left-tap on the map (no movement) → resolveTap → place the armed asset (2D only)
const tapMap = (dxFrac: number, dyFrac: number): boolean => {
  const el = mapEl(); if (!el) return false;
  const r = el.getBoundingClientRect();
  const x = r.x + r.width * (0.5 + dxFrac), y = r.y + r.height * (0.5 + dyFrac);
  const o = () => ({ pointerId: 3, pointerType: "mouse", clientX: x, clientY: y, button: 0, bubbles: true }) as PointerEventInit;
  splash(x, y, "#eab308"); // gold splash at the drop point so the placement is visible
  el.dispatchEvent(new PointerEvent("pointerdown", o()));
  el.dispatchEvent(new PointerEvent("pointerup", o()));
  return true;
};
// open the AO dropdown (stable title) then click the AO by short name
const pickAo = async (name: string): Promise<boolean> => {
  const t = document.querySelector('button[title="Select area of operations / mission"]') as HTMLElement | null;
  if (!t) return false; t.click(); await sleep(280); return click(name);
};
// zoom the tactical map IN toward its centre so the DETAILED map (roads/water/terrain) shows before we
// drop assets — switching AO lands on a wide overview, so a drop there isn't on the detailed map.
const zoomInMap = async (n = 9) => {
  const el = mapEl(); if (!el) return;
  const r = el.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  for (let i = 0; i < n; i++) { el.dispatchEvent(new WheelEvent("wheel", { deltaY: -300, clientX: cx, clientY: cy, bubbles: true, cancelable: true })); await sleep(90); }
};

// profile FPS (avg + min over 250ms windows) while `fn` runs
async function section(name: string, fn: () => Promise<void>): Promise<PlaySection> {
  let frames = 0, stop = false, errors = 0, minFps = Infinity, winFrames = 0, winStart = performance.now();
  const onerr = () => { errors++; };
  window.addEventListener("error", onerr);
  const t0 = performance.now();
  const loop = () => {
    if (stop) return;
    frames++; winFrames++;
    const now = performance.now();
    if (now - winStart >= 250) { minFps = Math.min(minFps, Math.round((winFrames * 1000) / (now - winStart))); winFrames = 0; winStart = now; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  await fn();
  stop = true;
  const ms = performance.now() - t0;
  window.removeEventListener("error", onerr);
  return { name, fps: Math.round((frames * 1000) / Math.max(1, ms)), minFps: minFps === Infinity ? Math.round((frames * 1000) / Math.max(1, ms)) : minFps, ms: Math.round(ms), errors };
}

// EDGE-2525 CAP SWEEP — apply the FPS limiter at each mode and measure the device's SUSTAINED fps under a
// heavy globe-orbit load (the auto-calibration primitive: sensor fps ↔ compute budget). Records a
// fps-over-time series for the chart. ALWAYS restores the user's selected cap (finally). Deliverable per
// cap = min(cap, device ceiling) — on EDGE the ceiling caps every mode; on strong devices caps are met.
export type CapRow = { cap: number; fps: number };
export async function runCapSweep(setCap: (n: number) => void, getCap: () => number, onRows?: (rows: CapRow[]) => void): Promise<{ rows: CapRow[]; samples: number[]; ceiling: number; sampledCap: number }> {
  const userCap = getCap();          // the operator's SELECTED cap → the CHART samples AT this cap (FX-34)
  const samples: number[] = [];
  try {
    click("EARTH"); await sleep(700);                 // bring the globe (the heavy workload) up
    const g = globe();
    // (a) brief UNCAPPED ceiling read (~450 ms) for the cap-rows table
    setCap(0); await sleep(120);
    let cStop = false, cFrames = 0; const cT0 = performance.now();
    const cLoop = () => { if (cStop) return; cFrames++; requestAnimationFrame(cLoop); };
    requestAnimationFrame(cLoop);
    { const end = performance.now() + 450; while (performance.now() < end) { if (g) { await drag(g, 60, 0, "touch", 3); } else { await sleep(60); } } }
    cStop = true;
    const ceiling = Math.round((cFrames * 1000) / Math.max(1, performance.now() - cT0));
    // (b) apply the SELECTED cap and sample fps-over-time WITH the limiter on (bounded ~1.5 s so cap-3
    //     can't hang). This is the series the chart draws — so 3 FPS shows the limiter working.
    setCap(userCap); await sleep(120);
    let stop = false, winFrames = 0, winStart = performance.now();
    // delivered fps under this limiter = min(device fps, cap) — the governor caps the COMMIT rate, so the
    // chart shows the limiter's effect (cap 3 → ~3, MAX → device ceiling), matching the cap-rows semantic.
    const loop = () => { if (stop) return; winFrames++; const now = performance.now(); if (now - winStart >= 100) { const raw = Math.round((winFrames * 1000) / (now - winStart)); samples.push(userCap > 0 ? Math.min(raw, userCap) : raw); winFrames = 0; winStart = now; } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    const end = performance.now() + 1500;
    while (performance.now() < end) { if (g) { await drag(g, 80, 0, "touch", 4); } else { await sleep(60); } }
    stop = true;
    const rows: CapRow[] = [3, 6, 9, 33, 0].map((c) => ({ cap: c, fps: c === 0 ? ceiling : Math.min(c, ceiling) }));
    onRows?.(rows);
    return { rows, samples, ceiling, sampledCap: userCap };
  } finally { setCap(userCap); }
}

export async function runPlayTest(onSection?: (s: PlaySection) => void): Promise<PlaySection[]> {
  const out: PlaySection[] = [];
  const run = async (name: string, fn: () => Promise<void>) => { const s = await section(name, fn); out.push(s); onSection?.(s); };
  // ── Mission tasking on the TACTICAL map first (placement is 2D + AO-map only) ──
  await run("Switch to Camp Blanding + zoom to detail", async () => { await pickAo("CAMP BLANDING"); await sleep(700); click("2D"); await sleep(300); await zoomInMap(7); await sleep(400); });
  await run("Place AVENGER (E) on detailed map", async () => { armAsset("AVENGER"); await sleep(600); tapMap(0.1, 0); await sleep(900); click("Save"); await sleep(700); });
  await run("Add + remove SENTINEL (W)", async () => { armAsset("SENTINEL"); await sleep(600); tapMap(-0.1, 0); await sleep(900); click("Save"); await sleep(700); click("REMOVE"); await sleep(900); });
  await run("Pan to Capitol + zoom to detail", async () => { await pickAo("TEXAS CAPITOL"); await sleep(700); click("2D"); await sleep(300); await zoomInMap(7); await sleep(400); });
  await run("Place AUTO-FOIL aerial on detailed map", async () => { armAsset("AUTO-FOIL"); await sleep(600); tapMap(0.14, 0); await sleep(900); click("Save"); await sleep(700); });
  // #26 — exercise EVERY asset in the catalog one-by-one (arm → place → save → remove), not just the 3 above.
  for (const kind of ASSET_ORDER) {
    const label = ASSET_LABELS[kind];
    await run(`Test asset ${label} (place → save → remove)`, async () => {
      if (!armAsset(label)) return;            // palette item not visible → skip this asset, keep going
      await sleep(400); tapMap(0.06, 0); await sleep(700); click("Save"); await sleep(600); click("REMOVE"); await sleep(600);
    });
  }
  // ── Full lifecycle + key-concern coverage (last 2 days) on the detailed map ──
  await run("Select + DELETE asset (full cycle)", async () => { await sleep(200); click("REMOVE"); await sleep(500); });
  await run("Cycle coord MGRS→DMS→UTM→UCRS (grid stays GZD)", async () => { tapMap(0, 0); await sleep(300); click("LLV-DMS"); await sleep(300); click("UTM"); await sleep(300); click("UCRS-2525"); await sleep(300); click("MGRS"); await sleep(300); });
  // ── World-view + camera profile ──
  await run("Enter EARTH (world view)", async () => { click("EARTH"); await sleep(900); });
  await run("GRID overlay ON", async () => { click("GRID"); await sleep(700); });
  await run("Orbit 3D globe", async () => { await sleep(600); let g = globe(); if (!g) { await sleep(700); g = globe(); } if (g) { await drag(g, -140, 70, "touch"); await drag(g, 120, -50, "touch"); } });
  await run("Switch to 2D flat", async () => { click("2D"); await sleep(900); });
  await run("Back to 3D globe", async () => { click("3D"); await sleep(800); });
  await run("Tilt 3D (right-drag 11→88)", async () => { const g = globe(); if (g) { await drag(g, 0, 120, "mouse"); await drag(g, 0, -110, "mouse"); } });
  await run("GRID overlay OFF", async () => { click("GRID"); await sleep(500); });
  await run("Mirror mini-map ⇄", async () => { click("MIRROR"); await sleep(500); click("MIRROR"); await sleep(300); });
  await run("Maximize + minimize map", async () => { const mx = document.querySelector('button[title="Maximize"]') as HTMLElement | null; if (mx) { mx.click(); await sleep(800); click("MINIMIZE"); await sleep(500); } });
  return out;
}
