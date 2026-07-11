"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Global FPS meter — counts animation frames and reports ~2×/second.
 * Rendered once in the command shell (SecurityCommandUX1) OUTSIDE the per-tab
 * conditionals, so a single toggle shows it on every tab (LIVE OVERVIEW, PLANNING,
 * SENSORS, …). Colour-coded: green ≥50, amber ≥30, red below. Not on the map.
 */
export function FpsMeter({ show }: { show: boolean }) {
  const [fps, setFps] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!show) return;
    let frames = 0;
    let last = performance.now();
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current != null) cancelAnimationFrame(raf.current); };
  }, [show]);
  if (!show) return null;
  const col = fps >= 50 ? "#3ec96b" : fps >= 30 ? "#f5a623" : "#ef4444";
  // ONE-LINE inline pill so it sits IN the top menu bar row (operator law) — not spilling below over the
  // tabs. Mounted inline next to LINK: SECURE / the gear.
  return (
    <span className="pointer-events-none inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums leading-none"
      style={{ background: "#0a0e14ee", borderColor: "#1e2b3a" }} aria-label="Frames per second">
      <span style={{ color: col }}>{fps}</span><span style={{ color: "#5f7186" }}>FPS</span>
    </span>
  );
}
