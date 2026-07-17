"use client";

/**
 * ARCHITECT-2525 · VOXEL HOUSE — 3×3×3 land base with the house cube at the CENTER cell (V5).
 * =================================================================================================
 * A pure CSS-3D scene adapted from Security-2525 Mission Planning's voxel lattice (mission-planning.tsx
 * :3154-3243 + the face() primitive :2844). No WebGL. The land base is a 3×3×3 grid of unit cells
 * (grid floors via repeating-linear-gradient + 16 vertical edges); the HOUSE is a cube stamped at the
 * center cell (idx 4 → offset 0,0). Drag to orbit the bearing. First pass — operator refines next.
 */
import { useState, type CSSProperties } from "react";

const C = { dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400" };

export function VoxelHouse() {
  const [bearing, setBearing] = useState(0.35);
  const cell = 46, n = 3, box = n * cell, band = cell, topZ = n * band;
  const at = (t: string): CSSProperties => ({ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) ${t}` });
  const face = (t: string, w: number, h: number, color: string, solid: boolean): CSSProperties =>
    ({ ...at(t), width: w, height: h, border: `1px ${solid ? "solid" : "dashed"} ${color}`, background: solid ? `${color}22` : "transparent" });

  // 4 stacked 3×3 grid planes (outer floors solid, interior thin).
  const floors = [0, 1, 2, 3].map((k) => {
    const outer = k === 0 || k === 3;
    return <div key={`f${k}`} style={{ ...at(`translateZ(${k * band}px)`), width: box, height: box,
      border: `${outer ? 2 : 1}px solid ${C.cyan}${outer ? "cc" : "33"}`,
      backgroundImage: `repeating-linear-gradient(to right, ${C.cyan}22 0 1px, transparent 1px ${cell}px), repeating-linear-gradient(to bottom, ${C.cyan}22 0 1px, transparent 1px ${cell}px)` }} />;
  });
  // 16 vertical edges (4 solid corners + 12 thin posts).
  const edges = Array.from({ length: 16 }, (_, i) => {
    const ix = i % 4, iy = (i / 4) | 0, x = (ix - 1.5) * cell, y = (iy - 1.5) * cell;
    const corner = (ix === 0 || ix === 3) && (iy === 0 || iy === 3);
    return <div key={`e${i}`} style={{ ...at(`translate3d(${x}px,${y}px,${topZ / 2}px) rotateX(90deg)`), width: corner ? 2 : 1, height: topZ, background: corner ? `${C.cyan}cc` : `${C.cyan}33` }} />;
  });
  // HOUSE cube — center cell (idx 4 → x=0,y=0), one storey tall, sitting on the ground plane.
  const hh = band;
  const house = (
    <div data-arch-voxel-house style={{ transformStyle: "preserve-3d" }}>
      <div style={face(`translate3d(0px,0px,${hh}px)`, cell, cell, C.violet, true)} />
      <div style={face(`translate3d(0px,${-cell / 2}px,${hh / 2}px) rotateX(90deg)`, cell, hh, C.violet, true)} />
      <div style={face(`translate3d(0px,${cell / 2}px,${hh / 2}px) rotateX(90deg)`, cell, hh, C.violet, true)} />
      <div style={face(`translate3d(${-cell / 2}px,0px,${hh / 2}px) rotateY(90deg)`, hh, cell, C.violet, true)} />
      <div style={face(`translate3d(${cell / 2}px,0px,${hh / 2}px) rotateY(90deg)`, hh, cell, C.violet, true)} />
    </div>
  );

  return (
    <div data-arch-voxel className="relative w-full cursor-grab overflow-hidden rounded active:cursor-grabbing"
      style={{ background: "#070b12", height: 380 }}
      onPointerMove={(e) => { if (e.buttons === 1) setBearing((b) => b + e.movementX * 0.012); }}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center 60%", transform: "perspective(820px) rotateX(58deg) scale(1.02)" }}>
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: `rotateZ(${bearing}rad)` }}>
          {floors}{edges}{house}
        </div>
      </div>
      <div className="absolute left-2 top-2 text-[9px]" style={{ color: C.dim }}>
        3×3×3 land base · <span style={{ color: C.violet }}>house at center (2,2)</span> · drag to orbit · <span style={{ color: C.gold }}>preview — refine next</span>
      </div>
    </div>
  );
}
