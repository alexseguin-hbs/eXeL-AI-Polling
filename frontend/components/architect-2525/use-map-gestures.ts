"use client";

/**
 * ARCHITECT-2525 · two-finger map gestures — pinch-zoom + pan (Mission-Planning parity).
 * =================================================================================================
 * Pointer-event based (works for touch + trackpad + mouse-wheel). TWO fingers = pinch-to-zoom AND pan
 * by the midpoint (so one finger stays free for tap-to-select on the 2D plan). Wheel/trackpad = zoom.
 * Returns {zoom, pan} + handlers to spread onto the scroll surface, and a reset(). Mirrors Security's
 * GlobeView pinch model without importing it (self-contained, HAL-friendly).
 */
import { useRef, useState, type PointerEvent as RPointerEvent, type WheelEvent as RWheelEvent } from "react";

export function useMapGestures({ min = 0.5, max = 6, initial = 1 }: { min?: number; max?: number; initial?: number } = {}) {
  const [zoom, setZoom] = useState(initial);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pts = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ d: number; mx: number; my: number } | null>(null);
  const moved = useRef(false); // Enki: a gesture happened → suppress the trailing tap-select
  const clamp = (z: number) => Math.max(min, Math.min(max, z));

  const onPointerDown = (e: RPointerEvent) => {
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 1) moved.current = false; // fresh touch — a clean tap until proven a gesture
    if (pts.current.size === 2) pinch.current = null;   // reset baseline when the second finger lands
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: RPointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = Array.from(pts.current.values());
    if (a.length < 2) return; // one finger → let tap/select through
    const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
    const mx = (a[0].x + a[1].x) / 2, my = (a[0].y + a[1].y) / 2;
    if (pinch.current) {
      const ratio = pinch.current.d > 0 ? d / pinch.current.d : 1;
      setZoom((z) => clamp(z * ratio));
      setPan((p) => ({ x: p.x + (mx - pinch.current!.mx), y: p.y + (my - pinch.current!.my) }));
      moved.current = true; // two-finger gesture → not a tap
    }
    pinch.current = { d, mx, my };
  };
  const onPointerUp = (e: RPointerEvent) => {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); // Thor: never leave a captured pointer
  };
  const onWheel = (e: RWheelEvent) => { setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.1 : 0.9))); };
  const reset = () => { setZoom(initial); setPan({ x: 0, y: 0 }); };

  // `moved` lets a click handler ignore the tap that trails a pinch/pan (call in onSelect).
  return { zoom, pan, reset, moved, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onWheel } };
}
