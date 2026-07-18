"use client";

/**
 * ARCHITECT-2525 · VOXEL HOUSE — selectable 3×3 voxel, Mission-Planning parity (F1 + F7).
 * =================================================================================================
 * A pure CSS-3D voxel adapted from Security-2525 Mission Planning's lattice + face() primitive
 * (mission-planning.tsx :2238 scene transform · :2844 face · :1949 top-face pick cells). No WebGL.
 *
 *  • SELECTABLE cells — every room/land cell has a clickable top face; the picked cell highlights
 *    (Mission-Planning `voxelSel`). House sits in the middle.
 *  • ROTATE / ZOOM / TILT — drag to orbit the bearing (horizontal) + tilt the pitch (vertical);
 *    wheel to zoom. NORTH is the default heading; a compass rose rides the corner.
 *  • TINY HOME default (operator finalized design) — a 3×3×1 labeled-room layout: 30'×30'×10',
 *    each room a 10' cube (~900 ft²). Rows: Master-Bedroom·Master-Bath·Master-Closet /
 *    Living·Kitchen·Dining / Office·Storage-Laundry·Entry-Porch. Cyan exterior land base +
 *    violet interior room voxels + labels + a front porch stair. (Layout is adjacency only — cost
 *    is unchanged; the cost/schedule engine is untouched.)
 *  • FULL HOME — the generic 3×3×3 land base with a single house cube at the centre (2,2) cell.
 * Elevation surfaces (per-corner altitude) land in the next slice; this is the selectable-voxel core.
 */
import { useState, type CSSProperties } from "react";
import type { HomeType } from "@/lib/architect-layers";
import type { RoomProgram } from "@/lib/room-program";

const C = { dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", text: "#c8d6e5" };

// Tiny-home 3×3 room grid (operator finalized design) — index = row*3 + col, read top→bottom / left→right.
const TINY_ROOMS: { k: string; label: string }[] = [
  { k: "M", label: "Master Bedroom" }, { k: "B", label: "Master Bath" }, { k: "C", label: "Master Closet" },
  { k: "L", label: "Living Room" }, { k: "K", label: "Kitchen" }, { k: "D", label: "Dining Room" },
  { k: "O", label: "Office" }, { k: "S", label: "Storage · Laundry" }, { k: "E", label: "Entry · Porch" },
];
const ENTRY_IDX = 8; // the E cell (bottom-right) carries the front porch + stairs

export function VoxelHouse({ homeType = "full", program }: { homeType?: HomeType; program?: RoomProgram }) {
  const [bearing, setBearing] = useState(0);       // 0 = NORTH up (operator: North is the default)
  const [pitch, setPitch] = useState(58);          // camera tilt (deg)
  const [zoom, setZoom] = useState(1);
  const [sel, setSel] = useState<number | null>(null);
  const tiny = homeType === "tiny";

  const cell = 52, n = 3, box = n * cell, hh = cell; // one storey = one voxel tall
  const at = (t: string): CSSProperties => ({ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) ${t}` });
  const face = (t: string, w: number, h: number, color: string, solid: boolean): CSSProperties =>
    ({ ...at(t), width: w, height: h, border: `1px ${solid ? "solid" : "dashed"} ${color}`, background: solid ? `${color}22` : "transparent" });

  // Drag = orbit bearing (horizontal) + tilt pitch (vertical). Wheel = zoom. (MP gesture model, :1815.)
  const onMove = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    setBearing((b) => b + e.movementX * 0.012);
    setPitch((p) => Math.max(18, Math.min(82, p - e.movementY * 0.15)));
  };
  const onWheel = (e: React.WheelEvent) => { setZoom((z) => Math.max(0.6, Math.min(2.4, z - e.deltaY * 0.0012))); };

  // The exterior land base — a 3×3 grid floor (cyan) so the plot reads as 30'×30'.
  const landFloor = (
    <div style={{ ...at("translateZ(0px)"), width: box, height: box,
      border: `2px solid ${C.cyan}cc`,
      backgroundImage: `repeating-linear-gradient(to right, ${C.cyan}22 0 1px, transparent 1px ${cell}px), repeating-linear-gradient(to bottom, ${C.cyan}22 0 1px, transparent 1px ${cell}px)` }} />
  );

  // A single room/house cube at grid index: 4 violet walls + a clickable top face carrying the label.
  const roomCube = (idx: number, label: string, key: string, opts: { selectable?: boolean; color?: string } = {}) => {
    const col = idx % 3, row = (idx / 3) | 0;
    const x = (col - 1) * cell, y = (row - 1) * cell;
    const selected = sel === idx;
    const color = selected ? C.gold : (opts.color ?? C.violet);
    return (
      <div key={`room${idx}`} style={{ ...at(`translate3d(${x}px,${y}px,0px)`), transformStyle: "preserve-3d" }}>
        {/* 4 walls */}
        <div style={face(`translate3d(0px,${-cell / 2}px,${hh / 2}px) rotateX(90deg)`, cell, hh, color, false)} />
        <div style={face(`translate3d(0px,${cell / 2}px,${hh / 2}px) rotateX(90deg)`, cell, hh, color, false)} />
        <div style={face(`translate3d(${-cell / 2}px,0px,${hh / 2}px) rotateY(90deg)`, hh, cell, color, false)} />
        <div style={face(`translate3d(${cell / 2}px,0px,${hh / 2}px) rotateY(90deg)`, hh, cell, color, false)} />
        {/* clickable top face + label */}
        <button
          data-arch-voxel-cell={key}
          onClick={(e) => { e.stopPropagation(); if (opts.selectable !== false) setSel((s) => (s === idx ? null : idx)); }}
          title={label}
          style={{ ...face(`translate3d(0px,0px,${hh}px)`, cell, cell, color, true),
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: selected ? `${C.gold}44` : `${color}22`, color: selected ? C.gold : C.text,
            fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
          {key}
        </button>
      </div>
    );
  };

  // Front porch stair on the Entry (E) cell — a couple of steps stepping down in front (+Y = toward viewer/front).
  const ecol = ENTRY_IDX % 3, erow = (ENTRY_IDX / 3) | 0;
  const ex = (ecol - 1) * cell, ey = (erow - 1) * cell;
  const porch = tiny ? (
    <div data-arch-voxel-porch style={{ ...at(`translate3d(${ex}px,${ey + cell * 0.7}px,0px)`), transformStyle: "preserve-3d" }}>
      {[0, 1, 2].map((s) => (
        <div key={s} style={face(`translate3d(0px,${s * 6}px,${(3 - s) * 4}px)`, cell * 0.7, 6, C.cyan, true)} />
      ))}
    </div>
  ) : null;

  // FULL-home fallback: the original 3×3×3 land base + one house cube at the centre cell.
  const fullLattice = !tiny ? [0, 1, 2, 3].map((k) => {
    const outer = k === 0 || k === 3;
    return <div key={`f${k}`} style={{ ...at(`translateZ(${k * cell}px)`), width: box, height: box,
      border: `${outer ? 2 : 1}px solid ${C.cyan}${outer ? "cc" : "33"}`,
      backgroundImage: `repeating-linear-gradient(to right, ${C.cyan}22 0 1px, transparent 1px ${cell}px), repeating-linear-gradient(to bottom, ${C.cyan}22 0 1px, transparent 1px ${cell}px)` }} />;
  }) : null;

  const beds = program?.bedrooms;
  const caption = tiny
    ? "Tiny Home · 3×3×1 · 30'×30'×10' · ~900 ft² · click a room · drag to orbit/tilt · scroll to zoom"
    : `3×3×3 land base · house at center (2,2)${beds ? ` · ${beds} bed` : ""} · drag to orbit/tilt · scroll to zoom`;

  return (
    <div data-arch-voxel className="relative w-full cursor-grab touch-none overflow-hidden rounded active:cursor-grabbing"
      style={{ background: "#070b12", height: 400 }}
      onPointerMove={onMove} onWheel={onWheel}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center 60%",
        transform: `perspective(820px) rotateX(${pitch}deg) scale(${1.02 * zoom})` }}>
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: `rotateZ(${bearing}rad)` }}>
          {landFloor}
          {fullLattice}
          {tiny
            ? <div data-arch-voxel-house style={{ transformStyle: "preserve-3d" }}>{TINY_ROOMS.map((r, i) => roomCube(i, r.label, r.k))}{porch}</div>
            : <div data-arch-voxel-house style={{ transformStyle: "preserve-3d" }}>{roomCube(4, "House", "H")}</div>}
        </div>
      </div>

      {/* NORTH-default compass rose (rotates with bearing so N always points to scene-north). */}
      <div data-arch-compass className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: `${C.cyan}55`, background: "#0a0f16cc" }}>
        <span style={{ display: "inline-block", transform: `rotate(${-bearing}rad)`, color: C.cyan, fontSize: 9, fontWeight: 800 }}>N↑</span>
      </div>

      {/* selected-room readout */}
      {sel != null && tiny && (
        <div data-arch-voxel-selroom className="absolute left-2 bottom-8 rounded border px-2 py-0.5 text-[10px]"
          style={{ borderColor: `${C.gold}66`, color: C.gold, background: "#0a0f16cc" }}>
          {TINY_ROOMS[sel].k} · {TINY_ROOMS[sel].label} · 10'×10'×10'
        </div>
      )}

      <div className="absolute left-2 top-2 max-w-[68%] text-[9px]" style={{ color: C.dim }}>
        {caption}
      </div>
    </div>
  );
}
