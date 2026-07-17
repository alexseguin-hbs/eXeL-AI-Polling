"use client";

/**
 * ARCHITECT-2525 · DESIGN — U-WF wireframe canvas (MASTER_SPEC §12 / ARC-01→05, 16, 28).
 * ==================================================================================
 * A site grid where you place 2×4 stud walls + door/window openings as instanced
 * wireframe primitives, each carrying a metadata packet (U-WF-02/06). 2D plan ⇄ 3D
 * isometric one-source (ARC-05). Live count/cost rollup feeds the $/min economy.
 * Self-contained; pure SVG (HAL-friendly, U-WF-07). Kept mounted by the shell.
 */
import { useRef, useState } from "react";

const C = {
  panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186",
  cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", grid: "#1a2536",
};

const LOT_W = 40, LOT_H = 30, WALL_H = 8; // feet
const OC_IN = 16;                          // stud spacing (inches on-center)

type Pt = [number, number];
interface Wall { a: Pt; b: Pt; }
interface Opening { wall: number; t: number; kind: "door" | "window"; }

const lenFt = (w: Wall) => Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
const studs = (w: Wall) => Math.max(2, Math.floor((lenFt(w) * 12) / OC_IN) + 1);

// isometric projection (ft → screen units); z up.
const iso = (x: number, y: number, z: number): Pt => {
  const s = Math.sin(Math.PI / 6), c = Math.cos(Math.PI / 6);
  return [(x - y) * c + 34, (x + y) * s - z + 6];
};

export interface DesignMetrics { walls: number; linearFt: number; studs: number; openings: number; }

export function ArchitectDesign({ onMetrics }: { onMetrics?: (m: DesignMetrics) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [walls, setWalls] = useState<Wall[]>([
    { a: [4, 4], b: [36, 4] }, { a: [36, 4], b: [36, 26] },
    { a: [36, 26], b: [4, 26] }, { a: [4, 26], b: [4, 4] },
  ]);
  const [openings, setOpenings] = useState<Opening[]>([{ wall: 0, t: 0.5, kind: "door" }]);
  const [pending, setPending] = useState<Pt | null>(null);
  const [mode, setMode] = useState<"wall" | "door" | "window">("wall");
  const [view3d, setView3d] = useState(false);

  const emit = (ws: Wall[], os: Opening[]) => onMetrics?.({
    walls: ws.length, linearFt: Math.round(ws.reduce((a, w) => a + lenFt(w), 0)),
    studs: ws.reduce((a, w) => a + studs(w), 0), openings: os.length,
  });

  const clickPt = (e: React.MouseEvent): Pt | null => {
    const r = svgRef.current?.getBoundingClientRect(); if (!r) return null;
    const x = Math.round(((e.clientX - r.left) / r.width) * LOT_W);
    const y = Math.round(((e.clientY - r.top) / r.height) * LOT_H);
    return [Math.max(0, Math.min(LOT_W, x)), Math.max(0, Math.min(LOT_H, y))];
  };

  const onClick = (e: React.MouseEvent) => {
    if (view3d) return; // edit in 2D (one-source model)
    const p = clickPt(e); if (!p) return;
    if (mode === "wall") {
      if (!pending) { setPending(p); return; }
      if (p[0] === pending[0] && p[1] === pending[1]) { setPending(null); return; }
      const next = [...walls, { a: pending, b: p }]; setWalls(next); setPending(null); emit(next, openings);
    } else {
      // attach an opening to the nearest wall midpoint-ish
      let best = -1, bd = Infinity;
      walls.forEach((w, i) => { const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2; const d = Math.hypot(mx - p[0], my - p[1]); if (d < bd) { bd = d; best = i; } });
      if (best >= 0) { const next = [...openings, { wall: best, t: 0.5, kind: mode }]; setOpenings(next); emit(walls, next); }
    }
  };

  const clearAll = () => { setWalls([]); setOpenings([]); setPending(null); emit([], []); };

  const sx = (x: number) => (x / LOT_W) * 100, sy = (y: number) => (y / LOT_H) * 100;

  // The MODEL · U-WF PRIMITIVES readout was removed per operator (2026-07-17) — the master House dimensions /
  // cost / time now live on the map's settings header (MasterReadout, rendered by the shell). The wireframe still
  // emits its primitive metrics via onMetrics for the $/min economy + 4D build; it just isn't shown as a panel here.
  return (
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 flex items-center gap-1 text-[10px]">
          {(["wall", "door", "window"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setPending(null); }} className="rounded border px-2 py-0.5"
              style={{ borderColor: C.border, color: mode === m ? C.violet : C.dim, background: mode === m ? "#221833" : "transparent" }}>{m}</button>
          ))}
          <button onClick={() => setView3d((v) => !v)} className="ml-auto rounded border px-2 py-0.5"
            style={{ borderColor: C.border, color: view3d ? C.cyan : C.dim }}>{view3d ? "3D" : "2D"}</button>
          <button onClick={clearAll} className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.dim }}>clear</button>
        </div>
        <svg ref={svgRef} data-arch-design viewBox="0 0 100 75" preserveAspectRatio="xMidYMid meet"
          onClick={onClick} className="w-full cursor-crosshair rounded" style={{ background: "#070b12", aspectRatio: "4 / 3" }}>
          {!view3d ? (
            <>
              {/* site grid (ARC-01) */}
              {Array.from({ length: LOT_W + 1 }, (_, i) => <line key={`v${i}`} x1={sx(i)} y1="0" x2={sx(i)} y2="100" stroke={C.grid} strokeWidth="0.15" />)}
              {Array.from({ length: LOT_H + 1 }, (_, i) => <line key={`h${i}`} x1="0" y1={sy(i)} x2="100" y2={sy(i)} stroke={C.grid} strokeWidth="0.15" />)}
              {/* walls (ARC-02) + stud ticks */}
              {walls.map((w, i) => (
                <g key={i} data-wall>
                  <line x1={sx(w.a[0])} y1={sy(w.a[1])} x2={sx(w.b[0])} y2={sy(w.b[1])} stroke={C.cyan} strokeWidth="0.9" strokeLinecap="round" />
                </g>
              ))}
              {/* openings (ARC-03) */}
              {openings.map((o, i) => { const w = walls[o.wall]; if (!w) return null; const x = w.a[0] + (w.b[0] - w.a[0]) * o.t, y = w.a[1] + (w.b[1] - w.a[1]) * o.t; return (
                <circle key={i} data-opening cx={sx(x)} cy={sy(y)} r="1.1" fill={o.kind === "door" ? C.gold : C.green} />
              ); })}
              {pending && <circle cx={sx(pending[0])} cy={sy(pending[1])} r="1" fill={C.violet} />}
            </>
          ) : (
            <>
              {/* 3D isometric extrusion (ARC-05 one-source) */}
              {walls.map((w, i) => { const [ax, ay] = iso(w.a[0], w.a[1], 0), [bx, by] = iso(w.b[0], w.b[1], 0), [bx2, by2] = iso(w.b[0], w.b[1], WALL_H), [ax2, ay2] = iso(w.a[0], w.a[1], WALL_H); return (
                <polygon key={i} data-wall points={`${ax},${ay} ${bx},${by} ${bx2},${by2} ${ax2},${ay2}`} fill="#0e2233" stroke={C.cyan} strokeWidth="0.4" opacity="0.9" />
              ); })}
            </>
          )}
        </svg>
        <div className="mt-1 text-[9px]" style={{ color: C.dim }}>
          {view3d ? "3D isometric — edit in 2D" : mode === "wall" ? "Click two grid points to place a 2×4 wall" : `Click near a wall to place a ${mode}`}
        </div>
      </div>
  );
}
