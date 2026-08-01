// F6 — shared responsive-viewport primitive for the 2525 apps (SoI-2525 · Security-2525 · Architect-2525).
// Detects a resolution CLASS (16:9 · 1080p · 4K · other) + ORIENTATION (portrait/landscape) and reacts to
// resize + orientationchange, so any app can adapt its layout reactively on phone + PC to the SAME contract.
//
// The classifier is a PURE function so it is deterministic and unit-testable (no window). The hook wraps it.
"use client";
import { useEffect, useState } from "react";

export type AspectClass = "16:9" | "1080p" | "4k" | "other";
export type Orientation = "portrait" | "landscape";
export interface ViewportInfo {
  w: number;
  h: number;
  aspect: number;          // w / h
  aspectClass: AspectClass;
  orientation: Orientation;
  isPhone: boolean;        // narrow side < 768 (Tailwind md)
}

/** Pure viewport classifier — deterministic, no DOM. `aspectClass` keys off the LONG edge's pixel count
 *  (1080p ≈ 1920, 4K ≈ 3840) and a 16:9 aspect (±3%); everything else is "other". */
export function classifyViewport(w: number, h: number): ViewportInfo {
  const aspect = h > 0 ? w / h : 0;
  const long = Math.max(w, h);
  const short = Math.min(w, h);
  const is169 = Math.abs(aspect - 16 / 9) < 0.05 || Math.abs(aspect - 9 / 16) < 0.05;
  let aspectClass: AspectClass = "other";
  if (long >= 3200) aspectClass = "4k";          // 4K / UHD-class (3840×2160 and up)
  else if (long >= 1800 && long < 3200 && is169) aspectClass = "1080p"; // FHD 16:9 (1920×1080)
  else if (is169) aspectClass = "16:9";          // 16:9 at other sizes (720p, laptop panels)
  return { w, h, aspect, aspectClass, orientation: w >= h ? "landscape" : "portrait", isPhone: short < 768 };
}

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;

/** Distance between two touch points. Pure — takes plain {clientX, clientY} pairs, not TouchEvent. */
export function touchDistance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }): number {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

/** Pure pinch-zoom resolver, shared by the 2525 apps.
 *  `startZoom` is the zoom level captured WHEN THE GESTURE BEGAN — so a pinch continues from wherever the
 *  ＋/－ buttons left off instead of snapping back to 1×. Result is clamped to [ZOOM_MIN, ZOOM_MAX] and
 *  rounded to 2dp so React state settles (no infinite float churn). A zero/absent start distance is a no-op. */
export function pinchZoom(startZoom: number, startDist: number, curDist: number): number {
  if (!(startDist > 0) || !(curDist > 0)) return startZoom;
  const next = startZoom * (curDist / startDist);
  return +Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)).toFixed(2);
}

const SSR_DEFAULT: ViewportInfo = classifyViewport(1440, 900); // stable SSR value (desktop landscape)

/** Reactive viewport info. SSR-safe (returns a stable desktop default until mounted), then updates on
 *  resize + orientationchange. Debounced via rAF so rapid resizes coalesce to one state update.
 *
 *  ⚠ Z6a · READS THE **LAYOUT** VIEWPORT, NEVER `window.innerWidth`. THIS IS LOAD-BEARING, AND IT SHIPPED
 *  WRONG. On a desktop the two are the same number, which is exactly why it survived: `tsc`, 3358 locks,
 *  the screenshot gate and the PDF gate were all structurally incapable of telling them apart. On iOS,
 *  `window.innerWidth/innerHeight` report the **VISUAL** viewport, which SHRINKS when the user pinches.
 *  Consumers size layout from this hook, so a pinch fed them a smaller viewport, their content shrank in
 *  CSS px by exactly the factor the browser was magnifying by, the two cancelled — and the content never
 *  grew while the surrounding chrome took the magnification in full. Measured on the operator's case
 *  (/innovation Present, 390x844): the slide sat at an apparent 219px through 1x, 1.5x, 2x and 3x, while
 *  the control bar went 123px -> 810px. `scripts/zoom-gate.mjs` reproduces it and was proven RED here
 *  before this line changed.
 *
 *  `documentElement.clientWidth/clientHeight` IS the layout viewport: immune to pinch on iOS, identical to
 *  `innerWidth` on every desktop, and universally supported. There is no fallback to `innerWidth` on
 *  purpose — a fallback is how the bug comes back. */
export function useViewport(): ViewportInfo {
  const [vp, setVp] = useState<ViewportInfo>(SSR_DEFAULT);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      const el = document.documentElement;
      raf = requestAnimationFrame(() => setVp(classifyViewport(el.clientWidth, el.clientHeight)));
    };
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", read); window.removeEventListener("orientationchange", read); };
  }, []);
  return vp;
}
