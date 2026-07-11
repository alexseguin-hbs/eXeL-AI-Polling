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
  return (
    <div className="pointer-events-none fixed right-2 top-14 z-[90] rounded border px-2 py-1 font-mono text-[11px] font-bold tabular-nums"
      style={{ background: "#0a0e14cc", borderColor: "#1e2b3a", color: col }}
      aria-label="Frames per second">
      {fps} <span style={{ color: "#5f7186" }}>FPS</span>
    </div>
  );
}
