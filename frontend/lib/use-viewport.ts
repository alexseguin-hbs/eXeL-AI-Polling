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

const SSR_DEFAULT: ViewportInfo = classifyViewport(1440, 900); // stable SSR value (desktop landscape)

/** Reactive viewport info. SSR-safe (returns a stable desktop default until mounted), then updates on
 *  resize + orientationchange. Debounced via rAF so rapid resizes coalesce to one state update. */
export function useViewport(): ViewportInfo {
  const [vp, setVp] = useState<ViewportInfo>(SSR_DEFAULT);
  useEffect(() => {
    let raf = 0;
    const read = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVp(classifyViewport(window.innerWidth, window.innerHeight)));
    };
    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", read); window.removeEventListener("orientationchange", read); };
  }, []);
  return vp;
}
