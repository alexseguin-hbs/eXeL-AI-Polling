"use client";

/**
 * TEXTURED GLOBE — a small draggable 3D sphere painted with a REAL equirectangular surface map
 * (NASA/planetpixelemporium maps bundled in /public/planets, loaded locally → offline + deterministic).
 * The texture is inverse-projected per-pixel onto an orthographic sphere on a <canvas>, with a day/night
 * terminator for the 3D read. Rotatable by drag (LEFT = spin longitude + tilt latitude, RIGHT = roll);
 * NO zoom — mirrors the Security-2525 globe interaction. Optional lat/lon marker (Earth) + ring (Saturn).
 * Self-contained; falls back to a shaded disc if the image can't load.
 */
import { useEffect, useRef, useState } from "react";

const DEG = Math.PI / 180;
// Module cache: decoded texture pixels keyed by src, so each map is sampled once across all globes.
const TEX_CACHE = new Map<string, { data: Uint8ClampedArray; w: number; h: number }>();

function loadTexture(src: string): Promise<{ data: Uint8ClampedArray; w: number; h: number } | null> {
  const hit = TEX_CACHE.get(src);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const ctx = cv.getContext("2d"); if (!ctx) { resolve(null); return; }
      ctx.drawImage(img, 0, 0);
      try { const d = ctx.getImageData(0, 0, w, h).data; const t = { data: d, w, h }; TEX_CACHE.set(src, t); resolve(t); }
      catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function TexturedGlobe({ src, size = 96, lat, lon, spinDeg = 0, markerColor = "#ffd400", ring, label }: {
  src: string; size?: number; lat?: number; lon?: number; spinDeg?: number; markerColor?: string; ring?: string | null; label?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<{ data: Uint8ClampedArray; w: number; h: number } | null>(TEX_CACHE.get(src) ?? null);
  const [ringTex, setRingTex] = useState<{ data: Uint8ClampedArray; w: number; h: number } | null>(ring ? (TEX_CACHE.get(ring) ?? null) : null);
  const [rot, setRot] = useState({ lon: lon != null ? -lon : 0, lat: 14, roll: 0 });
  const drag = useRef<{ x: number; y: number; btn: number } | null>(null);

  useEffect(() => { loadTexture(src).then(setTex); }, [src]);
  useEffect(() => { if (ring) loadTexture(ring).then(setRingTex); }, [ring]);

  // Render: for each pixel in the disc, un-rotate the view ray to geographic (lat,lon), sample the texture,
  // shade by a fixed upper-left light (day/night terminator). Redraw only when rotation / spin / texture change.
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const S = size, R = S * 0.46, CX = S / 2, CY = S / 2;
    const out = ctx.createImageData(S, S);
    const px = out.data;
    const lam0 = (rot.lon - spinDeg) * DEG, cl = Math.cos(rot.lat * DEG), sl = Math.sin(rot.lat * DEG);
    const cr = Math.cos(rot.roll), sr = Math.sin(rot.roll);
    // light direction in view space (upper-left, slightly front) → diffuse terminator
    const Lx = -0.42, Ly = 0.42, Lz = 0.82, Ll = Math.hypot(Lx, Ly, Lz);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const sx = (x - CX) / R, sy = -(y - CY) / R;      // view-plane coords (post-roll)
        const r2 = sx * sx + sy * sy; const o = (y * S + x) * 4;
        if (r2 > 1) { px[o + 3] = 0; continue; }           // outside the disc → transparent
        const vz = Math.sqrt(1 - r2);
        // un-roll (x,y); z unchanged
        const vx = sx * cr + sy * sr, vy = -sx * sr + sy * cr;
        // un-tilt by lat0
        const gy = vy * cl + vz * sl, gz = -vy * sl + vz * cl, gx = vx;
        const latR = Math.asin(Math.max(-1, Math.min(1, gy)));
        const lonR = lam0 + Math.atan2(gx, gz);
        let u = (lonR / (2 * Math.PI) + 0.5) % 1; if (u < 0) u += 1;
        const v = 0.5 - latR / Math.PI;
        const tx = Math.min(tex ? tex.w - 1 : 0, (u * (tex ? tex.w : 1)) | 0);
        const ty = Math.min(tex ? tex.h - 1 : 0, (v * (tex ? tex.h : 1)) | 0);
        const shade = Math.max(0.12, (sx * Lx + sy * Ly + vz * Lz) / Ll); // 0.12 ambient on the night side
        if (tex) { const ti = (ty * tex.w + tx) * 4; px[o] = tex.data[ti] * shade; px[o + 1] = tex.data[ti + 1] * shade; px[o + 2] = tex.data[ti + 2] * shade; px[o + 3] = 255; }
        else { px[o] = 90 * shade; px[o + 1] = 110 * shade; px[o + 2] = 140 * shade; px[o + 3] = 255; }
      }
    }
    ctx.clearRect(0, 0, S, S);
    ctx.putImageData(out, 0, 0);
    // rim
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 2 * Math.PI); ctx.strokeStyle = "#233043"; ctx.lineWidth = 0.8; ctx.stroke();
    // location marker (Earth) — project (lat,lon) forward; draw only if on the near hemisphere
    if (lat != null && lon != null) {
      const phi = lat * DEG, lm = (lon - (rot.lon - spinDeg)) * DEG;
      let ex = Math.cos(phi) * Math.sin(lm), ey = Math.sin(phi), ez = Math.cos(phi) * Math.cos(lm);
      const ey2 = ey * cl - ez * sl, ez2 = ey * sl + ez * cl; ey = ey2; ez = ez2;
      const ex3 = ex * cr - ey * sr, ey3 = ex * sr + ey * cr;
      if (ez > 0) { const mx = CX + ex3 * R, my = CY - ey3 * R; ctx.beginPath(); ctx.arc(mx, my, 1.9, 0, 2 * Math.PI); ctx.strokeStyle = markerColor; ctx.lineWidth = 0.8; ctx.stroke(); ctx.beginPath(); ctx.arc(mx, my, 0.9, 0, 2 * Math.PI); ctx.fillStyle = markerColor; ctx.fill(); }
    }
  }, [tex, rot, spinDeg, size, lat, lon, markerColor]);

  const down = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, btn: e.button }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX; drag.current.y = e.clientY;
    if (drag.current.btn === 2) setRot((r) => ({ ...r, roll: r.roll + dx * 0.01 }));
    else setRot((r) => ({ ...r, lon: r.lon - dx * 0.6, lat: Math.max(-85, Math.min(85, r.lat + dy * 0.5)) }));
  };
  const up = () => { drag.current = null; };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Saturn ring — behind + front halves via two stacked ellipse strokes (simple, tilt-aware) */}
        {ring && ringTex && (
          <svg viewBox="0 0 100 100" width={size} height={size} className="pointer-events-none absolute inset-0">
            <ellipse cx="50" cy="50" rx={46 * 1.9} ry={46 * 1.9 * Math.max(0.1, Math.abs(Math.sin(rot.lat * DEG)))} fill="none" stroke="#d9c48a" strokeWidth="3" opacity="0.5" />
          </svg>
        )}
        <canvas ref={canvas} width={size} height={size} data-textured-globe data-tex={src.split("/").pop()}
          className="touch-none cursor-grab" style={{ width: size, height: size, display: "block" }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onContextMenu={(e) => e.preventDefault()} />
      </div>
      {label && <span className="text-[8px]" style={{ color: "#5f7186", fontFamily: "monospace" }}>{label}</span>}
    </div>
  );
}
