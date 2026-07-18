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
import { elevAt, cornerAltitudes, mToFt } from "@/lib/terrain";

const C = { dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", text: "#c8d6e5", green: "#22c55e" };

// Tiny-home 3×3 room grid (operator finalized design) — index = row*3 + col, read top→bottom / left→right.
const TINY_ROOMS: { k: string; label: string }[] = [
  { k: "M", label: "Master Bedroom" }, { k: "B", label: "Master Bath" }, { k: "C", label: "Master Closet" },
  { k: "L", label: "Living Room" }, { k: "K", label: "Kitchen" }, { k: "D", label: "Dining Room" },
  { k: "O", label: "Office" }, { k: "S", label: "Storage · Laundry" }, { k: "E", label: "Entry · Porch" },
];

export function VoxelHouse({ homeType = "full", program, lat = 30.44, lon = -97.62 }: { homeType?: HomeType; program?: RoomProgram; lat?: number; lon?: number }) {
  const [bearing, setBearing] = useState(0);       // 0 = NORTH up (operator: North is the default)
  const [pitch, setPitch] = useState(58);          // camera tilt (deg)
  const [zoom, setZoom] = useState(1);
  const [sel, setSel] = useState<number | null>(null);
  const tiny = homeType === "tiny";

  const cell = 66, n = 3, box = n * cell; // land-base cell (px); the house = the centre cell at 1× voxel size
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

  // The exterior land base — a 3×3 grid floor (cyan datum plane) so the plot reads as the parcel.
  const landFloor = (
    <div style={{ ...at("translateZ(0px)"), width: box, height: box,
      border: `2px solid ${C.cyan}cc`,
      backgroundImage: `repeating-linear-gradient(to right, ${C.cyan}22 0 1px, transparent 1px ${cell}px), repeating-linear-gradient(to bottom, ${C.cyan}22 0 1px, transparent 1px ${cell}px)` }} />
  );

  // TERRAIN ELEVATION (operator) — the 8 land cells AROUND the house rise/fall to their procedural elevation
  // (seeded by the lot lat/lon; datum = house pad). Grass-shaded slabs so the relief reads when you orbit.
  const ELEV_SCALE = 5;                    // px per metre of elevation
  const datum = elevAt(lat, lon, 0, 0);
  const slab = (t: string, w: number, h: number, fill: string): CSSProperties => ({ ...at(t), width: w, height: h, background: fill, border: `1px solid ${fill}` });
  const terrain = [0, 1, 2, 3, 5, 6, 7, 8].map((i) => {
    const col = i % 3, row = (i / 3) | 0, gx = col - 1, gy = row - 1;
    const em = Math.round((elevAt(lat, lon, gx, gy) - datum) * 10) / 10;   // metres relative to the pad
    const ePx = em * ELEV_SCALE;
    const tt = Math.max(0, Math.min(1, (em + 5) / 13));                    // low → high
    const grass = `hsl(${95 + tt * 20}, ${30 + tt * 22}%, ${24 + tt * 24}%)`;
    const x = gx * cell, y = gy * cell, top = Math.max(ePx, 0), bot = Math.min(ePx, 0), skirt = top - bot;
    return (
      <div key={`t${i}`} data-arch-land-cell={i} title={`${mToFt(em) >= 0 ? "+" : ""}${mToFt(em)} ft`} style={{ ...at(`translate3d(${x}px,${y}px,0px)`), transformStyle: "preserve-3d" }}>
        <div style={{ ...slab(`translate3d(0px,0px,${ePx}px)`, cell, cell, grass), opacity: 0.9 }} />
        {skirt > 0.5 && (<>
          <div style={slab(`translate3d(0px,${-cell / 2}px,${bot + skirt / 2}px) rotateX(90deg)`, cell, skirt, grass)} />
          <div style={slab(`translate3d(0px,${cell / 2}px,${bot + skirt / 2}px) rotateX(90deg)`, cell, skirt, grass)} />
          <div style={slab(`translate3d(${-cell / 2}px,0px,${bot + skirt / 2}px) rotateY(90deg)`, skirt, cell, grass)} />
          <div style={slab(`translate3d(${cell / 2}px,0px,${bot + skirt / 2}px) rotateY(90deg)`, skirt, cell, grass)} />
        </>)}
      </div>
    );
  });
  const ca = cornerAltitudes(lat, lon);

  // A room/house cube at grid index, of edge `size`, laid out on a `size`-pitch 3×3 (so 3 rooms span 3·size).
  // 4 violet walls + a clickable top face carrying the label. `cx/cy` shift the whole 3×3 into a parent cell.
  const roomCube = (idx: number, label: string, key: string, size: number, cx = 0, cy = 0, opts: { color?: string; font?: number } = {}) => {
    const col = idx % 3, row = (idx / 3) | 0;
    const x = cx + (col - 1) * size, y = cy + (row - 1) * size, h = size;
    const selected = sel === idx;
    const color = selected ? C.gold : (opts.color ?? C.violet);
    return (
      <div key={`room${idx}`} style={{ ...at(`translate3d(${x}px,${y}px,0px)`), transformStyle: "preserve-3d" }}>
        <div style={face(`translate3d(0px,${-size / 2}px,${h / 2}px) rotateX(90deg)`, size, h, color, false)} />
        <div style={face(`translate3d(0px,${size / 2}px,${h / 2}px) rotateX(90deg)`, size, h, color, false)} />
        <div style={face(`translate3d(${-size / 2}px,0px,${h / 2}px) rotateY(90deg)`, h, size, color, false)} />
        <div style={face(`translate3d(${size / 2}px,0px,${h / 2}px) rotateY(90deg)`, h, size, color, false)} />
        <button
          data-arch-voxel-cell={key}
          onClick={(e) => { e.stopPropagation(); setSel((s) => (s === idx ? null : idx)); }}
          title={label}
          style={{ ...face(`translate3d(0px,0px,${h}px)`, size, size, color, true),
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: selected ? `${C.gold}44` : `${color}22`, color: selected ? C.gold : C.text,
            fontSize: opts.font ?? 11, fontWeight: 700, letterSpacing: 1 }}>
          {key}
        </button>
      </div>
    );
  };

  // The tiny HOUSE occupies the MIDDLE cube of the 3×3 land base at 1× voxel size (Mission-Planning tier):
  // its 9 rooms are a 3×3 sub-grid nested inside the centre cell (roomSize = cell/3), so the surrounding 8
  // cells stay as LAND (elevation surfaces land next). Zoom in (scroll) to read the room labels.
  const roomSize = cell / 3;
  // Front porch stair — off the Entry room (E, sub-idx 8) at the front edge of the centre cell.
  const porch = tiny ? (
    <div data-arch-voxel-porch style={{ ...at(`translate3d(${roomSize}px,${cell / 2 + 3}px,0px)`), transformStyle: "preserve-3d" }}>
      {[0, 1, 2].map((s) => (
        <div key={s} style={face(`translate3d(0px,${s * 4}px,${(3 - s) * 3}px)`, roomSize * 0.8, 4, C.cyan, true)} />
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
    ? "Tiny Home · house = centre cube of the 3×3 land base · surrounding land shows elevation · orbit to read relief · scroll to zoom"
    : `3×3 land base · house at centre · surrounding land shows elevation${beds ? ` · ${beds} bed` : ""} · orbit to read relief · scroll to zoom`;

  return (
    <div data-arch-voxel className="relative w-full cursor-grab touch-none overflow-hidden rounded active:cursor-grabbing"
      style={{ background: "#070b12", height: 400 }}
      onPointerMove={onMove} onWheel={onWheel}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center 60%",
        transform: `perspective(820px) rotateX(${pitch}deg) scale(${1.02 * zoom})` }}>
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: `rotateZ(${bearing}rad)` }}>
          {landFloor}
          {terrain}
          {fullLattice}
          {tiny
            ? <div data-arch-voxel-house style={{ transformStyle: "preserve-3d" }}>{TINY_ROOMS.map((r, i) => roomCube(i, r.label, r.k, roomSize, 0, 0, { font: 8 }))}{porch}</div>
            : <div data-arch-voxel-house style={{ transformStyle: "preserve-3d" }}>{roomCube(4, "House", "H", cell)}</div>}
        </div>
      </div>

      {/* Per-corner ALTITUDE of the 3×3 land base (operator: "each corner … show height"). ft, from procedural terrain. */}
      {([["nw", "left-2 top-9", ca.nw], ["ne", "right-2 top-12", ca.ne], ["sw", "left-2 bottom-2", ca.sw], ["se", "right-2 bottom-2", ca.se]] as const).map(([k, pos, m]) => (
        <div key={k} data-arch-corner-alt={k} className={`absolute ${pos} rounded border px-1 text-[8px] font-semibold tabular-nums`}
          style={{ borderColor: `${C.green}55`, color: C.green, background: "#0a0f16cc" }}>{k.toUpperCase()} {mToFt(m) >= 0 ? "+" : ""}{mToFt(m)}′</div>
      ))}

      {/* NORTH-default compass rose (rotates with bearing so N always points to scene-north). */}
      <div data-arch-compass className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: `${C.cyan}55`, background: "#0a0f16cc" }}>
        <span style={{ display: "inline-block", transform: `rotate(${-bearing}rad)`, color: C.cyan, fontSize: 9, fontWeight: 800 }}>N↑</span>
      </div>

      {/* selected-room readout */}
      {sel != null && tiny && (
        <div data-arch-voxel-selroom className="absolute left-2 bottom-8 rounded border px-2 py-0.5 text-[10px]"
          style={{ borderColor: `${C.gold}66`, color: C.gold, background: "#0a0f16cc" }}>
          {TINY_ROOMS[sel].k} · {TINY_ROOMS[sel].label} · {"10'×10'×10'"}
        </div>
      )}

      <div className="absolute left-2 top-2 max-w-[68%] text-[9px]" style={{ color: C.dim }}>
        {caption}
      </div>
    </div>
  );
}
