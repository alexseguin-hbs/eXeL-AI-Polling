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
 * Elevation surfaces are LIVE: the 8 land cells around the pad rise/fall to their procedural altitude
 * (grass-shaded slabs + skirts), the four outer corners carry visible altitude labels, and a
 * North-default compass rides the corner (F1 · #136; terrain math + determinism lock in lib/terrain.ts).
 */
import { useRef, useState, type CSSProperties } from "react";
import type { HomeType } from "@/lib/architect-layers";
import type { RoomProgram } from "@/lib/room-program";
import { elevAt, cornerAltitudes, mToFt } from "@/lib/terrain";
import { TINY_ROOM_LAYOUT, type RoomCell } from "@/lib/room-layout";

const C = { dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", text: "#c8d6e5", green: "#22c55e" };

export function VoxelHouse({ homeType = "full", program, lat = 30.44, lon = -97.62, height = 400, compact = false, layout = TINY_ROOM_LAYOUT, selectedRoomId, onSelectRoom, walk = false, walkRoomId, wallW = 1, hvac = false, showSockets = true }: {
  homeType?: HomeType; program?: RoomProgram; lat?: number; lon?: number; height?: number; compact?: boolean;
  layout?: RoomCell[]; selectedRoomId?: string | null; onSelectRoom?: (id: string) => void;
  walk?: boolean; walkRoomId?: string | null; wallW?: number; hvac?: boolean; showSockets?: boolean;
}) {
  const [bearing, setBearing] = useState(0);       // 0 = NORTH up (operator: North is the default)
  const [pitch, setPitch] = useState(58);          // camera tilt (deg)
  const [zoom, setZoom] = useState(1);
  const [selLocal, setSelLocal] = useState<string | null>(null);
  // Selection can be lifted (controlled) so the 2D plan, 3D voxel, and right panel agree; else local.
  const selId = onSelectRoom ? (selectedRoomId ?? null) : selLocal;
  const selectRoom = (id: string) => { if (onSelectRoom) onSelectRoom(id); else setSelLocal((s) => (s === id ? null : id)); };
  // Room-based render applies to the unlocked markets — Tiny Home AND Home (MF/Commercial locked). Both show the
  // 9-room ground floor as LEVEL 1 of a 3×3×3 cube (operator: "voxel = first level of a 3×3×3 cube").
  const tiny = homeType === "tiny" || homeType === "full";

  const cell = 66, n = 3, box = n * cell; // land-base cell (px); the house = the centre cell at 1× voxel size
  const at = (t: string): CSSProperties => ({ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) ${t}` });
  const face = (t: string, w: number, h: number, color: string, solid: boolean, bw = 1): CSSProperties =>
    ({ ...at(t), width: w, height: h, border: `${bw}px ${solid ? "solid" : "dashed"} ${color}`, background: solid ? `${color}22` : "transparent" });

  // Gestures (Mission-Planning parity, touch + mouse): ONE finger/drag = orbit bearing + tilt pitch;
  // TWO fingers = pinch-to-zoom. Wheel = zoom. Pointer positions are tracked so touch deltas are reliable.
  const gp = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gpinch = useRef<number | null>(null);
  const clampZoom = (z: number) => Math.max(0.6, Math.min(3.2, z));
  const onDown = (e: React.PointerEvent) => { gp.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (gp.current.size === 2) gpinch.current = null; };
  const onMove = (e: React.PointerEvent) => {
    if (!gp.current.has(e.pointerId)) {
      // mouse fallback: LEFT or RIGHT button held with no tracked pointer (Mission-Planning parity — right-drag
      // orbits/tilts too; the container suppresses the context menu so the right-drag reads cleanly).
      if (e.buttons === 1 || e.buttons === 2) { setBearing((b) => b + e.movementX * 0.012); setPitch((p) => Math.max(18, Math.min(82, p - e.movementY * 0.15))); }
      return;
    }
    const prev = gp.current.get(e.pointerId)!;
    gp.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const a = Array.from(gp.current.values());
    if (a.length >= 2) {
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (gpinch.current) setZoom((z) => clampZoom(z * (d / gpinch.current!)));
      gpinch.current = d;
    } else {
      setBearing((b) => b + (e.clientX - prev.x) * 0.012);
      setPitch((p) => Math.max(18, Math.min(82, p - (e.clientY - prev.y) * 0.15)));
    }
  };
  const onUp = (e: React.PointerEvent) => { gp.current.delete(e.pointerId); if (gp.current.size < 2) gpinch.current = null; };
  const onWheel = (e: React.WheelEvent) => { setZoom((z) => clampZoom(z - e.deltaY * 0.0012)); };

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

  // Low-fi 3D furniture — a translucent cuboid (top + 4 short walls) at floor level inside a room.
  const furnBox = (dx: number, dy: number, w: number, d: number, hgt: number, col: string, kk: string) => (
    <div key={kk} style={{ ...at(`translate3d(${dx}px,${dy}px,0px)`), transformStyle: "preserve-3d" }}>
      <div style={face(`translate3d(0px,0px,${hgt}px)`, w, d, col, true)} />
      <div style={face(`translate3d(0px,${-d / 2}px,${hgt / 2}px) rotateX(90deg)`, w, hgt, col, true)} />
      <div style={face(`translate3d(0px,${d / 2}px,${hgt / 2}px) rotateX(90deg)`, w, hgt, col, true)} />
      <div style={face(`translate3d(${-w / 2}px,0px,${hgt / 2}px) rotateY(90deg)`, hgt, d, col, true)} />
      <div style={face(`translate3d(${w / 2}px,0px,${hgt / 2}px) rotateY(90deg)`, hgt, d, col, true)} />
    </div>
  );
  // 3D furniture artifacts per room key (operator: "3D artifacts replicating bed, etc") — bed, tub/sink,
  // wardrobe, sofa, kitchen island/counter, dining table, desk, washer/dryer. Low-fi, deterministic.
  const furn3d = (key: string, s: number) => {
    const V = C.violet, Cy = C.cyan, A = C.gold;
    switch (key) {
      case "M": return furnBox(0, s * 0.06, s * 0.58, s * 0.72, s * 0.16, V, "bed");                                                   // bed
      case "B": return <>{furnBox(-s * 0.22, -s * 0.16, s * 0.34, s * 0.24, s * 0.16, Cy, "tub")}{furnBox(s * 0.24, s * 0.22, s * 0.2, s * 0.2, s * 0.18, Cy, "sink")}</>; // tub + sink
      case "C": return furnBox(-s * 0.3, 0, s * 0.14, s * 0.7, s * 0.5, V, "wardrobe");                                                 // tall wardrobe
      case "L": return <>{furnBox(-s * 0.06, s * 0.22, s * 0.5, s * 0.2, s * 0.16, V, "sofa")}{furnBox(-s * 0.3, -s * 0.02, s * 0.16, s * 0.5, s * 0.16, V, "chaise")}</>; // sectional
      case "K": return <>{furnBox(0, 0, s * 0.4, s * 0.26, s * 0.2, Cy, "island")}{furnBox(0, -s * 0.34, s * 0.7, s * 0.14, s * 0.22, Cy, "counter")}</>; // island + counter
      case "D": return furnBox(0, 0, s * 0.4, s * 0.4, s * 0.16, A, "table");                                                          // dining table
      case "O": return furnBox(0, -s * 0.16, s * 0.52, s * 0.16, s * 0.18, V, "desk");                                                 // desk
      case "S": return <>{furnBox(-s * 0.2, 0, s * 0.26, s * 0.26, s * 0.22, Cy, "washer")}{furnBox(s * 0.2, 0, s * 0.26, s * 0.26, s * 0.22, Cy, "dryer")}</>; // washer + dryer
      default: return null;                                                                                                            // E — porch outside
    }
  };

  // A room/house cube at grid index, of edge `size`, laid out on a `size`-pitch 3×3 (so 3 rooms span 3·size).
  // 4 violet walls + a clickable top face carrying the label. `cx/cy` shift the whole 3×3 into a parent cell.
  const roomCube = (id: string, label: string, key: string, size: number, row: number, col: number, cx = 0, cy = 0, opts: { color?: string; font?: number; furn?: boolean } = {}) => {
    const x = cx + (col - 1) * size, y = cy + (row - 1) * size, h = size;
    const selected = selId === id;
    const color = selected ? C.gold : (opts.color ?? C.violet);
    return (
      <div key={`room${id}`} style={{ ...at(`translate3d(${x}px,${y}px,0px)`), transformStyle: "preserve-3d" }}>
        <div style={face(`translate3d(0px,${-size / 2}px,${h / 2}px) rotateX(90deg)`, size, h, color, false, wallW)} />
        <div style={face(`translate3d(0px,${size / 2}px,${h / 2}px) rotateX(90deg)`, size, h, color, false, wallW)} />
        <div style={face(`translate3d(${-size / 2}px,0px,${h / 2}px) rotateY(90deg)`, h, size, color, false, wallW)} />
        <div style={face(`translate3d(${size / 2}px,0px,${h / 2}px) rotateY(90deg)`, h, size, color, false, wallW)} />
        {opts.furn && furn3d(key, size)}
        <button
          data-arch-voxel-cell={key}
          onClick={(e) => { e.stopPropagation(); selectRoom(id); }}
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
  // WALK MODE (operator: "wireframe low-fidelity walkthrough must be possible") — drop to near eye-level,
  // zoom in, and centre the scene on the current room so you step through the wireframe room by room.
  const walkRoom = walk && tiny ? layout.find((r) => r.id === walkRoomId) : undefined;
  const wx = walkRoom ? (walkRoom.col - 1) * roomSize : 0;
  const wy = walkRoom ? (walkRoom.row - 1) * roomSize : 0;
  const effPitch = walk ? 20 : pitch;   // low angle = first-person feel
  const effZoom = walk ? 3.2 : zoom;    // stand inside the room
  // Front porch stair — off the Entry room (E, sub-idx 8) at the front edge of the centre cell.
  const porch = tiny ? (
    <div data-arch-voxel-porch style={{ ...at(`translate3d(${roomSize}px,${cell / 2 + 3}px,0px)`), transformStyle: "preserve-3d" }}>
      {[0, 1, 2].map((s) => (
        <div key={s} style={face(`translate3d(0px,${s * 4}px,${(3 - s) * 3}px)`, roomSize * 0.8, 4, C.cyan, true)} />
      ))}
    </div>
  ) : null;

  // AERIAL HVAC DUCTS (operator: "don't forget aerial ducts for hvac") — overhead trunk + branch runs at
  // ceiling height across the tiny home, so ductwork reads in 3D. Low-fi cyan slabs; toggled from the header.
  const ducts = hvac && tiny ? (
    <div data-arch-voxel-hvac style={{ transformStyle: "preserve-3d" }}>
      <div style={face(`translate3d(0px,0px,${roomSize + 3}px)`, roomSize * 2.7, 6, "#38bdf8", true)} />{/* E-W trunk */}
      {[-1, 0, 1].map((r) => <div key={r} style={face(`translate3d(0px,${r * roomSize}px,${roomSize + 3}px)`, 5, roomSize * 0.9, "#38bdf8", true)} />)}{/* N-S branches per row */}
      {[-1, 0, 1].map((c) => <div key={`v${c}`} style={{ ...at(`translate3d(${c * roomSize}px,${roomSize}px,${roomSize}px)`), width: 5, height: 3, background: "#38bdf8" }} />)}{/* register drops */}
    </div>
  ) : null;

  // ELECTRICAL OUTLETS in WALK mode (operator IMG_7486: "sockets viewable in 3D walkable mode, single room
  // only") — gold markers low on the walk-room's 4 walls, one per the room's outlet count. Toggled from the
  // ⚡ Electric section of Design Settings; only rendered when walking a single room (never the full plan).
  const sockets = walk && walkRoom && showSockets ? (
    <div data-arch-voxel-sockets style={{ ...at(`translate3d(${wx}px,${wy}px,0px)`), transformStyle: "preserve-3d" }}>
      {Array.from({ length: Math.min(8, walkRoom.outlets || 0) }).map((_, i) => {
        const wall = i % 4, h = roomSize / 2, z = 4; // z ≈ outlet height, low on the wall
        const along = (((Math.floor(i / 4) + 1) / (Math.floor((walkRoom.outlets || 0) / 4) + 2)) - 0.5) * roomSize * 0.7;
        const t = wall === 0 ? `translate3d(${along}px,${-h}px,${z}px) rotateX(90deg)`
          : wall === 1 ? `translate3d(${along}px,${h}px,${z}px) rotateX(90deg)`
          : wall === 2 ? `translate3d(${-h}px,${along}px,${z}px) rotateY(90deg)`
          : `translate3d(${h}px,${along}px,${z}px) rotateY(90deg)`;
        return <div key={i} style={{ ...face(t, 3, 3, C.gold, true), boxShadow: `0 0 4px ${C.gold}` }} />;
      })}
    </div>
  ) : null;

  // FULL-home fallback: the original 3×3×3 land base + one house cube at the centre cell.
  const fullLattice = !tiny ? [0, 1, 2, 3].map((k) => {
    const outer = k === 0 || k === 3;
    return <div key={`f${k}`} style={{ ...at(`translateZ(${k * cell}px)`), width: box, height: box,
      border: `${outer ? 2 : 1}px solid ${C.cyan}${outer ? "cc" : "33"}`,
      backgroundImage: `repeating-linear-gradient(to right, ${C.cyan}22 0 1px, transparent 1px ${cell}px), repeating-linear-gradient(to bottom, ${C.cyan}22 0 1px, transparent 1px ${cell}px)` }} />;
  }) : null;

  // 3×3×3 CUBE FRAME (operator: "voxel = first level of a 3×3×3 cube") — the 9-room ground floor is LEVEL 1; two
  // more wireframe levels (violet 3×3 grids at the room-height pitch) + corner posts stack above the house's
  // centre cell, so the home reads as the first level of a 27-cell cube (Vision-2525 cube · room to grow up).
  const cubeFrame = tiny ? (
    <div data-arch-voxel-cube style={{ transformStyle: "preserve-3d" }}>
      {[1, 2, 3].map((lvl) => (
        <div key={`cl${lvl}`} style={{ ...at(`translateZ(${lvl * roomSize}px)`), width: cell, height: cell,
          border: `1px solid ${C.violet}${lvl === 3 ? "88" : "44"}`,
          backgroundImage: `repeating-linear-gradient(to right, ${C.violet}22 0 1px, transparent 1px ${roomSize}px), repeating-linear-gradient(to bottom, ${C.violet}22 0 1px, transparent 1px ${roomSize}px)` }} />
      ))}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sy], i) => (
        <div key={`post${i}`} style={{ ...at(`translate3d(${sx * cell / 2}px,${sy * cell / 2}px,${1.5 * roomSize}px) rotateX(90deg)`), width: 1.4, height: 3 * roomSize, background: `${C.violet}66` }} />
      ))}
    </div>
  ) : null;

  const beds = program?.bedrooms;
  const caption = tiny
    ? "Tiny Home · house = centre cube of the 3×3 land base · surrounding land shows elevation · orbit to read relief · scroll to zoom"
    : `3×3 land base · house at centre · surrounding land shows elevation${beds ? ` · ${beds} bed` : ""} · orbit to read relief · scroll to zoom`;

  return (
    <div data-arch-voxel className="relative w-full cursor-grab touch-none overflow-hidden rounded active:cursor-grabbing"
      style={{ background: "#070b12", height }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onWheel={onWheel}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center 60%",
        transform: `perspective(820px) rotateX(${effPitch}deg) scale(${1.02 * effZoom})` }}>
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: `rotateZ(${bearing}rad) translate3d(${-wx}px,${-wy}px,0px)` }}>
          {landFloor}
          {terrain}
          {fullLattice}
          {tiny
            ? <div data-arch-voxel-house style={{ transformStyle: "preserve-3d" }}>{layout.map((r) => roomCube(r.id, r.label, r.k, roomSize, r.row, r.col, 0, 0, { font: 8, furn: r.furniture }))}{porch}{ducts}{sockets}{cubeFrame}</div>
            : <div data-arch-voxel-house style={{ transformStyle: "preserve-3d" }}>{roomCube("house", "House", "H", cell, 1, 1)}</div>}
        </div>
      </div>

      {/* Per-corner ALTITUDE of the 3×3 land base (operator: "each corner … show height"). ft, from procedural terrain. */}
      {!compact && ([["nw", "left-2 top-9", ca.nw], ["ne", "right-2 top-12", ca.ne], ["sw", "left-2 bottom-2", ca.sw], ["se", "right-2 bottom-2", ca.se]] as const).map(([k, pos, m]) => (
        <div key={k} data-arch-corner-alt={k} className={`absolute ${pos} rounded border px-1 text-[8px] font-semibold tabular-nums`}
          style={{ borderColor: `${C.green}55`, color: C.green, background: "#0a0f16cc" }}>{k.toUpperCase()} {mToFt(m) >= 0 ? "+" : ""}{mToFt(m)}′</div>
      ))}

      {/* NORTH-default compass rose (rotates with bearing so N always points to scene-north). */}
      <div data-arch-compass className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: `${C.cyan}55`, background: "#0a0f16cc" }}>
        <span style={{ display: "inline-block", transform: `rotate(${-bearing}rad)`, color: C.cyan, fontSize: 9, fontWeight: 800 }}>N↑</span>
      </div>

      {/* selected-room readout */}
      {selId && tiny && !compact && (() => { const r = layout.find((x) => x.id === selId); if (!r) return null; return (
        <div data-arch-voxel-selroom className="absolute left-2 bottom-8 rounded border px-2 py-0.5 text-[10px]"
          style={{ borderColor: `${C.gold}66`, color: C.gold, background: "#0a0f16cc" }}>
          {r.k} · {r.label} · {`${10 * r.w}'×${10 * r.d}'×10'`}
        </div>
      ); })()}

      {!compact && (
        <div className="absolute left-2 top-2 max-w-[68%] text-[9px]" style={{ color: C.dim }}>
          {caption}
        </div>
      )}
    </div>
  );
}
