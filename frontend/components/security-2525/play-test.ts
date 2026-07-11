"use client";
// In-app scripted PLAY-TEST / DEMO. Auto-steps the map through a mission sequence ON-SCREEN, profiling
// FPS per section for EDGE calibration + acting as a live demo. Drives the REAL UI via DOM events — no
// new imperative API. v2 now covers the full requested replay: switch AO (Camp Blanding), PLACE assets
// (arm palette div + tap the tactical map), add+remove, pan to Capitol, plus orbit/grid/2D↔3D/tilt/mirror.
export type PlaySection = { name: string; fps: number; minFps: number; ms: number; errors: number };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const btn = (txt: string): HTMLButtonElement | undefined =>
  Array.from(document.querySelectorAll("button")).find(
    (b) => (b.textContent || "").includes(txt) && (b as HTMLElement).offsetParent !== null
  ) as HTMLButtonElement | undefined;
const click = (txt: string): boolean => { const b = btn(txt); if (b) b.click(); return !!b; };
const globe = (): SVGElement | null => {
  const gs = Array.from(document.querySelectorAll('svg[aria-label^="Wireframe globe"]')) as SVGElement[];
  let best: SVGElement | null = null, a = 0;
  for (const g of gs) { const r = g.getBoundingClientRect(); if (r.width * r.height > a) { a = r.width * r.height; best = g; } }
  return best;
};
const drag = async (g: SVGElement, dx: number, dy: number, type: "touch" | "mouse", steps = 20) => {
  const r = g.getBoundingClientRect(); const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const opt = (x: number, y: number, t: string) => ({ pointerId: type === "touch" ? 1 : 2, pointerType: type, clientX: x, clientY: y, button: type === "mouse" && t === "down" ? 2 : 0, bubbles: true });
  g.dispatchEvent(new PointerEvent("pointerdown", opt(cx, cy, "down") as PointerEventInit));
  for (let i = 1; i <= steps; i++) { g.dispatchEvent(new PointerEvent("pointermove", opt(cx + (dx * i) / steps, cy + (dy * i) / steps, "move") as PointerEventInit)); await sleep(22); }
  g.dispatchEvent(new PointerEvent("pointerup", opt(cx + dx, cy + dy, "up") as PointerEventInit));
};
// arm an asset from the LEFT palette (items are <div class="cursor-grab">, not <button>)
const armAsset = (label: string): boolean => {
  const el = Array.from(document.querySelectorAll("div.cursor-grab")).find(
    (d) => (d.textContent || "").includes(label) && (d as HTMLElement).offsetParent !== null
  ) as HTMLElement | undefined;
  el?.click(); return !!el;
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
  el.dispatchEvent(new PointerEvent("pointerdown", o()));
  el.dispatchEvent(new PointerEvent("pointerup", o()));
  return true;
};
// open the AO dropdown (stable title) then click the AO by short name
const pickAo = async (name: string): Promise<boolean> => {
  const t = document.querySelector('button[title="Select area of operations / mission"]') as HTMLElement | null;
  if (!t) return false; t.click(); await sleep(280); return click(name);
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

export async function runPlayTest(onSection?: (s: PlaySection) => void): Promise<PlaySection[]> {
  const out: PlaySection[] = [];
  const run = async (name: string, fn: () => Promise<void>) => { const s = await section(name, fn); out.push(s); onSection?.(s); };
  // ── Mission tasking on the TACTICAL map first (placement is 2D + AO-map only) ──
  await run("Switch to Camp Blanding", async () => { await pickAo("CAMP BLANDING"); await sleep(900); });
  await run("Place AVENGER (E) + approve", async () => { click("2D"); await sleep(500); armAsset("AVENGER"); await sleep(200); tapMap(0.12, 0); await sleep(500); click("Save"); await sleep(300); });
  await run("Add + remove SENTINEL (W)", async () => { armAsset("SENTINEL"); await sleep(200); tapMap(-0.12, 0); await sleep(500); click("Save"); await sleep(300); click("REMOVE"); await sleep(300); });
  await run("Pan to Capitol (Austin)", async () => { await pickAo("TEXAS CAPITOL"); await sleep(800); });
  await run("Place AUTO-FOIL aerial + approve", async () => { click("2D"); await sleep(300); armAsset("AUTO-FOIL"); await sleep(200); tapMap(0.15, 0); await sleep(500); click("Save"); await sleep(300); });
  // ── World-view + camera profile ──
  await run("Enter EARTH (world view)", async () => { click("EARTH"); await sleep(900); });
  await run("GRID overlay ON", async () => { click("GRID"); await sleep(700); });
  await run("Orbit 3D globe", async () => { const g = globe(); if (g) { await drag(g, -140, 70, "touch"); await drag(g, 120, -50, "touch"); } });
  await run("Switch to 2D flat", async () => { click("2D"); await sleep(900); });
  await run("Back to 3D globe", async () => { click("3D"); await sleep(800); });
  await run("Tilt 3D (right-drag 11→88)", async () => { const g = globe(); if (g) { await drag(g, 0, 120, "mouse"); await drag(g, 0, -110, "mouse"); } });
  await run("GRID overlay OFF", async () => { click("GRID"); await sleep(500); });
  await run("Mirror mini-map ⇄", async () => { click("MIRROR"); await sleep(500); click("MIRROR"); await sleep(300); });
  return out;
}
