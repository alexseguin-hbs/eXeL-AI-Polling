"use client";
// In-app scripted PLAY-TEST / DEMO. Auto-steps the map through a mission sequence ON-SCREEN, profiling
// FPS per section for EDGE calibration + acting as a live demo. Drives the REAL UI via DOM events — no
// new imperative API. v1 covers the reliably-drivable core (orbit / grid / 2D↔3D / tilt); asset-placement
// + corner-click steps are v2 (they need the placement flow + geo→screen mapping).
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
  await run("Enter EARTH (world view)", async () => { click("EARTH"); await sleep(900); });
  await run("GRID overlay ON", async () => { click("GRID"); await sleep(700); });
  await run("Orbit 3D globe", async () => { const g = globe(); if (g) { await drag(g, -140, 70, "touch"); await drag(g, 120, -50, "touch"); } });
  await run("Switch to 2D flat", async () => { click("2D"); await sleep(900); });
  await run("Back to 3D globe", async () => { click("3D"); await sleep(800); });
  await run("Tilt 3D (right-drag 11→88)", async () => { const g = globe(); if (g) { await drag(g, 0, 120, "mouse"); await drag(g, 0, -110, "mouse"); } });
  await run("GRID overlay OFF", async () => { click("GRID"); await sleep(500); });
  return out;
}
