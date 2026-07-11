"use client";
// Global FPS governor — ONE live target-FPS cap, read per-frame by the map's animation loops
// (globe orbit, dead-reckon playback, zoom). 0 = MAX (uncapped, each loop keeps its own baseline).
// Lower caps throttle state commits to save compute on EDGE / low-power devices. Set from the
// main-menu SETTINGS popover; the loops read it imperatively so no React re-render is needed.
let _cap = 0; // 0 = MAX
type Sub = (cap: number) => void;
const subs = new Set<Sub>();

export function getFpsCap(): number { return _cap; }
export function setFpsCap(n: number): void {
  _cap = !Number.isFinite(n) || n < 0 ? 0 : n;
  try { localStorage.setItem("sec2525.fpsCap", String(_cap)); } catch { /* ignore */ }
  subs.forEach((s) => s(_cap));
}
export function initFpsCap(): void {
  try { const v = Number(localStorage.getItem("sec2525.fpsCap")); if (Number.isFinite(v) && v >= 0) _cap = v; } catch { /* ignore */ }
}
export function subscribeFpsCap(s: Sub): () => void { subs.add(s); return () => { subs.delete(s); }; }

// Minimum ms between commits for a loop, given its own baseline floor. The governor can only SLOW a
// loop past its baseline (never speed it up) — so capping to 30 won't override dead-reckon's 50ms floor.
export function capInterval(baselineMs: number): number {
  return _cap > 0 ? Math.max(baselineMs, 1000 / _cap) : baselineMs;
}

// One-shot device benchmark: count real animation frames for `ms`, return sustained FPS. Used by the
// SPEED TEST for EDGE system-requirements calibration (sustained, not peak).
export function runSpeedTest(ms = 2000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - start >= ms) { resolve(Math.round((frames * 1000) / (now - start))); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
