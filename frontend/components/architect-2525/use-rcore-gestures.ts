"use client";

/**
 * VISION-2525 R-CORE GESTURES — the shared React hook every Architect surface uses so they all feel like the
 * Security-2525 Mission-Planning map (operator: "same left/right click + two-finger zoom & rotation as MP;
 * R-Core for all areas of interaction"). LEFT-drag / one-finger = PAN · RIGHT-drag = rotate+tilt · two fingers =
 * pinch-zoom + twist-bearing + vertical-tilt · wheel = zoom · context menu suppressed. All reducer math is the
 * pure, unit-tested `lib/rcore-gestures` (no second implementation).
 */
import { useRef, useState, type PointerEvent as RPE, type WheelEvent as RWE } from "react";
import { RCORE_CFG, clamp, rightDrag, pinchUpdate, pairGeometry, wheelZoom, type GestureCfg, type PinchState } from "@/lib/rcore-gestures";

export interface RCoreOpts {
  initialBearing?: number;  // radians (0 = North up)
  initialPitch?: number;    // degrees
  initialZoom?: number;
  pan?: boolean;            // LEFT-drag / one-finger pans (default true)
  cfg?: Partial<GestureCfg>;
}

export function useRCoreGestures(opts: RCoreOpts = {}) {
  const cfg: GestureCfg = { ...RCORE_CFG, ...(opts.cfg ?? {}) };
  const b0 = opts.initialBearing ?? 0, p0 = opts.initialPitch ?? 58, z0 = opts.initialZoom ?? 1;
  const panOn = opts.pan !== false;
  const [bearing, setBearing] = useState(b0);
  const [pitch, setPitch] = useState(p0);
  const [zoom, setZoom] = useState(z0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pts = useRef<Map<number, { x: number; y: number; btn: number }>>(new Map());
  const pinch = useRef<PinchState | null>(null);
  const moved = useRef(false);

  const onPointerDown = (e: RPE) => {
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button });
    if (pts.current.size === 1) moved.current = false;
    if (pts.current.size === 2) pinch.current = null;   // fresh baseline when the 2nd finger lands
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
  };
  const onPointerMove = (e: RPE) => {
    const rec = pts.current.get(e.pointerId); if (!rec) return;
    const px = rec.x, py = rec.y; rec.x = e.clientX; rec.y = e.clientY;
    const arr = Array.from(pts.current.values());
    if (arr.length >= 2) {
      const g = pairGeometry(arr[0].x, arr[0].y, arr[1].x, arr[1].y);
      if (pinch.current) {
        const { zoomFactor, dBearing, dPitch } = pinchUpdate(pinch.current, g, cfg);
        setZoom((z) => clamp(z * zoomFactor, cfg.minZoom, cfg.maxZoom));
        setBearing((b) => b + dBearing);
        setPitch((p) => clamp(p + dPitch, cfg.minPitch, cfg.maxPitch));
        moved.current = true;
      }
      pinch.current = g;
      return;
    }
    const dx = e.clientX - px, dy = e.clientY - py;
    if (Math.abs(dx) + Math.abs(dy) > 0) moved.current = true;
    if (rec.btn === 2) {  // RIGHT-drag → rotate + tilt (mouse); touch reports button 0 → pans below
      const width = (e.currentTarget as Element).getBoundingClientRect().width || 1;
      const { dBearing, dPitch } = rightDrag(dx, dy, width, cfg);
      setBearing((b) => b + dBearing);
      setPitch((p) => clamp(p + dPitch, cfg.minPitch, cfg.maxPitch));
    } else if (panOn) {   // LEFT-drag / one-finger → PAN
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  };
  const onPointerUp = (e: RPE) => {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
  };
  const onWheel = (e: RWE) => setZoom((z) => clamp(z * wheelZoom(e.deltaY, cfg), cfg.minZoom, cfg.maxZoom));
  const onContextMenu = (e: { preventDefault: () => void }) => e.preventDefault();
  const reset = () => { setBearing(b0); setPitch(p0); setZoom(z0); setPan({ x: 0, y: 0 }); };

  return { bearing, pitch, zoom, pan, reset, moved, setBearing, setPitch, setZoom,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onWheel, onContextMenu } };
}
