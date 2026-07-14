"use client";

/**
 * TEXTURED GLOBE — a small draggable + ZOOMABLE 3D sphere painted with a REAL equirectangular surface map
 * (NASA/planetpixelemporium maps in /public/planets, loaded locally → offline + deterministic). The texture
 * is inverse-projected per-pixel onto an orthographic sphere on a <canvas> with BILINEAR sampling and a
 * day/night terminator. Drag = rotate (L spin+tilt, R roll); wheel / two-finger pinch = ZOOM IN for more
 * surface detail — and when a higher-resolution map (`srcHi`) is supplied it swaps in past the zoom threshold
 * (progressive "best-in-class" detail). Optional lat/lon marker (Earth) + ring (Saturn). Self-contained.
 */
import { useEffect, useRef, useState } from "react";

const DEG = Math.PI / 180;
type Tex = { data: Uint8ClampedArray; w: number; h: number };
const TEX_CACHE = new Map<string, Tex>();

function loadTexture(src: string): Promise<Tex | null> {
  const hit = TEX_CACHE.get(src);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const ctx = cv.getContext("2d"); if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      try { const t = { data: ctx.getImageData(0, 0, w, h).data, w, h }; TEX_CACHE.set(src, t); resolve(t); }
      catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const ZMIN = 1, ZMAX = 5;

export function TexturedGlobe({ src, srcHi, size = 96, lat, lon, spinDeg = 0, markerColor = "#ffd400", ring, label }: {
  src: string; srcHi?: string; size?: number; lat?: number; lon?: number; spinDeg?: number; markerColor?: string; ring?: string | null; label?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<Tex | null>(TEX_CACHE.get(src) ?? null);
  const [texHi, setTexHi] = useState<Tex | null>(srcHi ? (TEX_CACHE.get(srcHi) ?? null) : null);
  const [rot, setRot] = useState({ lon: lon != null ? -lon : 0, lat: 14, roll: 0 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null);
  const touch = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<number | null>(null);

  useEffect(() => { loadTexture(src).then(setTex); }, [src]);
  // fetch the hi-res map lazily once the user zooms in (don't pay for it until needed)
  useEffect(() => { if (srcHi && zoom >= 1.8 && !texHi) loadTexture(srcHi).then(setTexHi); }, [srcHi, zoom, texHi]);
  // native non-passive wheel → zoom (React onWheel is passive, can't preventDefault the page scroll)
  useEffect(() => {
    const el = canvas.current; if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setZoom((z) => Math.min(ZMAX, Math.max(ZMIN, z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)))); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const S = size, R = S * 0.46 * zoom, CX = S / 2, CY = S / 2;
    const T = zoom >= 1.8 && texHi ? texHi : tex;     // progressive detail
    const out = ctx.createImageData(S, S); const px = out.data;
    const lam0 = (rot.lon - spinDeg) * DEG, cl = Math.cos(rot.lat * DEG), sl = Math.sin(rot.lat * DEG);
    const cr = Math.cos(rot.roll), sr = Math.sin(rot.roll);
    const Lx = -0.42, Ly = 0.42, Lz = 0.82, Ll = Math.hypot(Lx, Ly, Lz);
    const w = T ? T.w : 1, h = T ? T.h : 1, td = T ? T.data : null;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const sx = (x - CX) / R, sy = -(y - CY) / R, r2 = sx * sx + sy * sy, o = (y * S + x) * 4;
        if (r2 > 1) { px[o + 3] = 0; continue; }
        const vz = Math.sqrt(1 - r2);
        const vx = sx * cr + sy * sr, vy = -sx * sr + sy * cr;
        const gy = vy * cl + vz * sl, gz = -vy * sl + vz * cl, gx = vx;
        const latR = Math.asin(Math.max(-1, Math.min(1, gy)));
        const lonR = lam0 + Math.atan2(gx, gz);
        let u = (lonR / (2 * Math.PI) + 0.5) % 1; if (u < 0) u += 1;
        const v = Math.max(0, Math.min(1, 0.5 - latR / Math.PI));
        const shade = Math.max(0.12, (sx * Lx + sy * Ly + vz * Lz) / Ll);
        if (td) {
          // bilinear sample (wrap longitude, clamp latitude)
          const fx = u * w - 0.5, fy = v * h - 0.5;
          const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
          const xa = ((x0 % w) + w) % w, xb = (xa + 1) % w, ya = Math.max(0, Math.min(h - 1, y0)), yb = Math.max(0, Math.min(h - 1, y0 + 1));
          const i00 = (ya * w + xa) * 4, i10 = (ya * w + xb) * 4, i01 = (yb * w + xa) * 4, i11 = (yb * w + xb) * 4;
          for (let c = 0; c < 3; c++) {
            const top = td[i00 + c] * (1 - ax) + td[i10 + c] * ax, bot = td[i01 + c] * (1 - ax) + td[i11 + c] * ax;
            px[o + c] = (top * (1 - ay) + bot * ay) * shade;
          }
          px[o + 3] = 255;
        } else { px[o] = 90 * shade; px[o + 1] = 110 * shade; px[o + 2] = 140 * shade; px[o + 3] = 255; }
      }
    }
    ctx.clearRect(0, 0, S, S); ctx.putImageData(out, 0, 0);
    ctx.beginPath(); ctx.arc(CX, CY, Math.min(R, S / 2 - 0.5), 0, 2 * Math.PI); ctx.strokeStyle = "#233043"; ctx.lineWidth = 0.8; ctx.stroke();
    if (lat != null && lon != null) {
      const phi = lat * DEG, lm = (lon - (rot.lon - spinDeg)) * DEG;
      let ex = Math.cos(phi) * Math.sin(lm), ey = Math.sin(phi); const ez0 = Math.cos(phi) * Math.cos(lm);
      const ey2 = ey * cl - ez0 * sl, ez2 = ey * sl + ez0 * cl; ey = ey2; const ez = ez2;
      const ex3 = ex * cr - ey * sr, ey3 = ex * sr + ey * cr;
      if (ez > 0) { const mx = CX + ex3 * R, my = CY - ey3 * R; ctx.beginPath(); ctx.arc(mx, my, 1.9, 0, 2 * Math.PI); ctx.strokeStyle = markerColor; ctx.lineWidth = 0.8; ctx.stroke(); ctx.beginPath(); ctx.arc(mx, my, 0.9, 0, 2 * Math.PI); ctx.fillStyle = markerColor; ctx.fill(); }
    }
  }, [tex, texHi, rot, spinDeg, size, lat, lon, markerColor, zoom]);

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") { touch.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (touch.current.size === 2) { const [a, b] = Array.from(touch.current.values()); pinch.current = Math.hypot(a.x - b.x, a.y - b.y); } }
    else drag.current = { x: e.clientX, y: e.clientY, btn: e.button };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      const prev = touch.current.get(e.pointerId); if (!prev) return;
      touch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touch.current.size >= 2 && pinch.current) { const [a, b] = Array.from(touch.current.values()); const d = Math.hypot(a.x - b.x, a.y - b.y); setZoom((z) => Math.min(ZMAX, Math.max(ZMIN, z * (d / pinch.current!)))); pinch.current = d; }
      else { const dx = e.clientX - prev.x, dy = e.clientY - prev.y; setRot((r) => ({ ...r, lon: r.lon - dx * 0.6, lat: Math.max(-85, Math.min(85, r.lat + dy * 0.5)) })); }
      return;
    }
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y; drag.current.x = e.clientX; drag.current.y = e.clientY;
    if (drag.current.btn === 2) setRot((r) => ({ ...r, roll: r.roll + dx * 0.01 }));
    else setRot((r) => ({ ...r, lon: r.lon - dx * 0.6, lat: Math.max(-85, Math.min(85, r.lat + dy * 0.5)) }));
  };
  const up = (e: React.PointerEvent) => { if (e.pointerType === "touch") { touch.current.delete(e.pointerId); if (touch.current.size < 2) pinch.current = null; } else drag.current = null; };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {ring && (
          <svg viewBox="0 0 100 100" width={size} height={size} className="pointer-events-none absolute inset-0">
            <ellipse cx="50" cy="50" rx={46 * 1.9} ry={46 * 1.9 * Math.max(0.1, Math.abs(Math.sin(rot.lat * DEG)))} fill="none" stroke="#d9c48a" strokeWidth="3" opacity="0.5" />
          </svg>
        )}
        <canvas ref={canvas} width={size} height={size} data-textured-globe data-tex={src.split("/").pop()} data-zoom={zoom.toFixed(2)}
          className="touch-none cursor-grab" style={{ width: size, height: size, display: "block" }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} onContextMenu={(e) => e.preventDefault()} />
        {zoom > 1.05 && <span className="pointer-events-none absolute bottom-0 left-0.5 text-[7px] tabular-nums" style={{ color: "#19c8cf", fontFamily: "monospace" }}>{zoom.toFixed(1)}×</span>}
      </div>
      {label && <span className="text-[8px]" style={{ color: "#5f7186", fontFamily: "monospace" }}>{label}</span>}
    </div>
  );
}
