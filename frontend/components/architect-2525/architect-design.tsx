"use client";

/**
 * ARCHITECT-2525 · DESIGN — U-WF wireframe canvas (MASTER_SPEC §12 / ARC-01→05, 16, 28).
 * ==================================================================================
 * A site grid where you place 2×4 stud walls + door/window openings as instanced
 * wireframe primitives, each carrying a metadata packet (U-WF-02/06). 2D plan ⇄ 3D
 * isometric one-source (ARC-05). Live count/cost rollup feeds the $/min economy.
 * Self-contained; pure SVG (HAL-friendly, U-WF-07). Kept mounted by the shell.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { VoxelHouse } from "./voxel-house";
import { TinyFloorplan } from "./tiny-floorplan";
import { MiniPanel } from "./mini-panel";
import { findLayer, type HomeType } from "@/lib/architect-layers";
import type { RoomProgram } from "@/lib/room-program";
import { cloneLayout, moveRoomInLayout, resizeRoomInLayout, setRoomElement, toggleRoomFurniture, ROOM_FT, type RoomCell, type ElementKind } from "@/lib/room-layout";
import { sanitizeRoomLayout } from "@/lib/architect-guard";

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

export function ArchitectDesign({ onMetrics, header, onDropComponent, homeType, program, selectedId }: { onMetrics?: (m: DesignMetrics) => void; header?: ReactNode; onDropComponent?: (id: string) => void; homeType?: HomeType; program?: RoomProgram; selectedId?: string | null }) {
  const selectedLabel = selectedId ? (findLayer(selectedId)?.node.label ?? null) : null;
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragOver, setDragOver] = useState(false);   // drag-drop a Vision-Tree item onto the building
  const [walls, setWalls] = useState<Wall[]>([
    { a: [4, 4], b: [36, 4] }, { a: [36, 4], b: [36, 26] },
    { a: [36, 26], b: [4, 26] }, { a: [4, 26], b: [4, 4] },
  ]);
  const [openings, setOpenings] = useState<Opening[]>([{ wall: 0, t: 0.5, kind: "door" }]);
  const [pending, setPending] = useState<Pt | null>(null);
  const [mode, setMode] = useState<"wall" | "door" | "window">("wall");
  const [view3d, setView3d] = useState(false);
  const [voxel, setVoxel] = useState(false);   // V5 — 3×3×3 land-base voxel (house at center); 2D default = first floor
  const [roomSel, setRoomSel] = useState<string | null>(null); // selected Tiny Home room (2D plan ↔ 3D mini)
  const [roomLayout, setRoomLayout] = useState<RoomCell[]>(() => cloneLayout()); // P3 — movable room model
  const [tinyMode, setTinyMode] = useState<"edit" | "walk">("edit"); // edit the plan ⇄ walk the wireframe
  const [walkRoomId, setWalkRoomId] = useState<string>("entry");     // low-fi walkthrough position
  const [focusRoomId, setFocusRoomId] = useState<string | null>(null); // ⏎ Enter a room → optimize it only
  const tiny = homeType === "tiny";
  const selectRoom = (id: string) => setRoomSel((s) => (s === id ? null : id));
  // Persist the room layout so a design survives reload (the kid's home iterates over time). Write-on-mutation
  // (never a value-effect) — the repo's usePersistentSet pattern — so the mount load can't be clobbered.
  const RL_KEY = "arch2525.roomLayout";
  // WireGuard: a stored layout is untrusted — sanitize (clamp grid/size/element counts, drop malformed) at the boundary.
  useEffect(() => { try { const v = localStorage.getItem(RL_KEY); if (v) setRoomLayout(sanitizeRoomLayout(JSON.parse(v))); } catch {} }, []);
  const persistLayout = (next: RoomCell[]) => { try { localStorage.setItem(RL_KEY, JSON.stringify(next)); } catch {} return next; };
  // Walk to the adjacent room in the 3×3, if one exists there (steps through the wireframe room by room).
  const walkStep = (dRow: number, dCol: number) => {
    const cur = roomLayout.find((r) => r.id === walkRoomId); if (!cur) return;
    const next = roomLayout.find((r) => r.row === cur.row + dRow && r.col === cur.col + dCol);
    if (next) setWalkRoomId(next.id);
  };
  const walkRoom = roomLayout.find((r) => r.id === walkRoomId);
  // P3 cube modification — move the selected room within the 3×3 grid, swapping with whatever it displaces
  // (keeps the nine-room grid full; adjacency only, so cost is unchanged — honors the operator's rule).
  const moveRoom = (dRow: number, dCol: number) => {
    if (!roomSel) return;
    setRoomLayout((prev) => persistLayout(moveRoomInLayout(prev, roomSel, dRow, dCol)));
  };
  const resetLayout = () => setRoomLayout(persistLayout(cloneLayout()));
  // Enter a room → optimize IT ONLY: step its elements / toggle furniture (persisted, clamped).
  const setElement = (kind: ElementKind, delta: number) => { if (focusRoomId) setRoomLayout((prev) => persistLayout(setRoomElement(prev, focusRoomId, kind, delta))); };
  const toggleFurn = () => { if (focusRoomId) setRoomLayout((prev) => persistLayout(toggleRoomFurniture(prev, focusRoomId))); };
  const focusRoom = focusRoomId ? roomLayout.find((r) => r.id === focusRoomId) : undefined;
  // F9 stretch — resize the focused room's width/depth within the 10-ft envelope (1..2 cells = 10..20 ft),
  // clamped by the pure resizeRoomInLayout; persisted; feeds layoutSqft so area/cost track the change.
  const stretch = (dim: "w" | "d", delta: number) => {
    if (!focusRoomId || !focusRoom) return;
    const w = dim === "w" ? focusRoom.w + delta : focusRoom.w;
    const d = dim === "d" ? focusRoom.d + delta : focusRoom.d;
    setRoomLayout((prev) => persistLayout(resizeRoomInLayout(prev, focusRoomId, w, d)));
  };
  // Structural members — VISIBLE + ADJUSTABLE (operator: "can't see/change structural beam sizes").
  const STUD_SIZES = ["2×4", "2×6", "2×8"] as const;
  const BEAM_SIZES = ["4×6", "4×8", "6×8", "GLULAM"] as const;
  const [studIdx, setStudIdx] = useState(0);
  const [beamIdx, setBeamIdx] = useState(1);
  useEffect(() => { try { const v = localStorage.getItem("arch2525.structure"); if (v) { const s = JSON.parse(v); if (Number.isInteger(s.stud)) setStudIdx(s.stud); if (Number.isInteger(s.beam)) setBeamIdx(s.beam); } } catch {} }, []);
  const persistStruct = (stud: number, beam: number) => { try { localStorage.setItem("arch2525.structure", JSON.stringify({ stud, beam })); } catch {} };
  const cycleStud = () => setStudIdx((i) => { const n = (i + 1) % STUD_SIZES.length; persistStruct(n, beamIdx); return n; });
  const cycleBeam = () => setBeamIdx((i) => { const n = (i + 1) % BEAM_SIZES.length; persistStruct(studIdx, n); return n; });
  const wallW = [1, 1.7, 2.4][studIdx]; // stud size → visible wireframe member thickness
  const [hvac, setHvac] = useState(false); // aerial HVAC ducts overlay (operator ask)
  useEffect(() => { try { setHvac(localStorage.getItem("arch2525.hvac") === "1"); } catch {} }, []);
  const toggleHvac = () => setHvac((h) => { const n = !h; try { localStorage.setItem("arch2525.hvac", n ? "1" : "0"); } catch {} return n; });
  // Tiny Home defaults to the 2D floor plan with a persistent 3D mini-map (operator: "2D and 3D");
  // the ▦ Voxel toggle still swaps the main view to the full 3D voxel. Leaving tiny turns voxel off.
  useEffect(() => { if (homeType !== "tiny") setVoxel(false); }, [homeType]);

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
      <div data-arch-dropzone className="relative rounded-lg border p-2 transition-colors"
        onDragOver={(e) => { if (onDropComponent) { e.preventDefault(); setDragOver(true); } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData("text/plain"); if (id) onDropComponent?.(id); }}
        style={{ borderColor: dragOver ? C.cyan : C.border, background: dragOver ? "#0e2233" : C.panel }}>
        {/* Scrolling map header (Security-2525 R-CORE pattern): the Project·Master key rides the SAME horizontally-
            scrollable header as the map tools, so dimensions/cost/time sit on the map, not in a separate bar. */}
        <div data-arch-map-header className="mb-1 flex items-center gap-3 overflow-x-auto text-[10px]">
          {header}
          <div className="flex shrink-0 items-center gap-1" style={header ? { marginLeft: "auto" } : undefined}>
            {tiny ? (
              <>
                {/* segmented view — 2D · 3D · Voxel (Mission-Planning-style; replaces the loose toggles) */}
                <div className="flex overflow-hidden rounded border" style={{ borderColor: C.border }}>
                  {([["2D", () => { setVoxel(false); setView3d(false); }, !voxel && !view3d],
                     ["3D", () => { setVoxel(false); setView3d(true); }, !voxel && view3d],
                     ["Voxel", () => setVoxel(true), voxel]] as const).map(([lbl, fn, on]) => (
                    <button key={lbl} data-arch-view={lbl} onClick={fn} className="px-2 py-0.5"
                      style={{ color: on ? C.cyan : C.dim, background: on ? "#0e2233" : "transparent" }}>{lbl}</button>
                  ))}
                </div>
                {/* structural members — SEE + ADJUST stud/beam sizes (reflected as wireframe thickness) */}
                <button data-arch-stud onClick={cycleStud} title="Stud size — tap to change" className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.text }}>Studs {STUD_SIZES[studIdx]}</button>
                <button data-arch-beam onClick={cycleBeam} title="Beam size — tap to change" className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.text }}>Beams {BEAM_SIZES[beamIdx]}</button>
                <button data-arch-hvac onClick={toggleHvac} title="Aerial HVAC ducts" className="rounded border px-2 py-0.5" style={{ borderColor: hvac ? "#38bdf8" : C.border, color: hvac ? "#38bdf8" : C.dim }}>🌬 Ducts</button>
              </>
            ) : (
              <>
                {(["wall", "door", "window"] as const).map((m) => (
                  <button key={m} onClick={() => { setMode(m); setPending(null); }} className="rounded border px-2 py-0.5"
                    style={{ borderColor: C.border, color: mode === m ? C.cyan : C.dim, background: mode === m ? "#0e2233" : "transparent" }}>{m}</button>
                ))}
                <button onClick={() => setView3d((v) => !v)} disabled={voxel} className="rounded border px-2 py-0.5"
                  style={{ borderColor: C.border, color: voxel ? "#33415a" : view3d ? C.cyan : C.dim }}>{view3d ? "3D" : "2D"}</button>
                <button data-arch-voxel-toggle onClick={() => setVoxel((v) => !v)} className="rounded border px-2 py-0.5"
                  style={{ borderColor: voxel ? C.cyan : C.border, color: voxel ? C.cyan : C.dim }}>▦ Voxel</button>
                <button onClick={clearAll} className="rounded border px-2 py-0.5" style={{ borderColor: C.border, color: C.dim }}>clear</button>
              </>
            )}
          </div>
        </div>
        {/* F3 — clicking an Active Element / Vision-Tree row reflects it ON the map (2D or 3D voxel). */}
        {selectedLabel && (
          <div data-arch-selected-onmap className="pointer-events-none absolute left-1/2 top-9 z-20 -translate-x-1/2 animate-pulse rounded-full border px-3 py-1 text-[10px] font-semibold shadow-lg"
            style={{ borderColor: C.cyan, color: C.cyan, background: "#0a0f16ee" }}>
            ◎ {selectedLabel} <span style={{ color: C.dim }}>· shown on map</span>
          </div>
        )}
        {voxel ? <VoxelHouse homeType={homeType} program={program} layout={roomLayout} selectedRoomId={roomSel} onSelectRoom={selectRoom} wallW={wallW} hvac={hvac} /> : tiny ? (
          <div data-arch-tiny-view className="relative">
            {/* edit ⇄ walk toggle */}
            <div className="absolute right-2 top-2 z-20 flex gap-1">
              {(["edit", "walk"] as const).map((m) => (
                <button key={m} data-arch-tiny-mode={m} onClick={() => setTinyMode(m)} className="rounded border px-2 py-0.5 text-[10px] font-semibold"
                  style={{ borderColor: tinyMode === m ? C.cyan : C.border, color: tinyMode === m ? C.cyan : C.dim, background: tinyMode === m ? "#0e2233" : "transparent" }}>
                  {m === "edit" ? "✎ Edit" : "🚶 Walk"}
                </button>
              ))}
            </div>
            {tinyMode === "walk" ? (
              <div data-arch-walk className="relative">
                {/* low-fidelity wireframe WALKTHROUGH — step room to room through the voxel at eye level */}
                <VoxelHouse homeType={homeType} program={program} height={380} compact layout={roomLayout} walk walkRoomId={walkRoomId} wallW={wallW} hvac={hvac} />
                <div data-arch-walk-room className="absolute left-2 top-2 rounded-lg border px-2 py-1 text-[11px] font-semibold shadow-lg"
                  style={{ borderColor: C.cyan, color: C.cyan, background: "#0a0f16ee" }}>
                  🚶 {walkRoom ? `${walkRoom.k} · ${walkRoom.label}` : "—"}
                </div>
                {/* walk D-pad — step to the adjacent room */}
                <div data-arch-walkpad className="absolute bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5 rounded-lg border p-1.5 shadow-lg"
                  style={{ borderColor: C.cyan, background: "#0a0f16ee" }}>
                  <button data-arch-walk-n onClick={() => walkStep(-1, 0)} className="rounded border px-2 text-[11px]" style={{ borderColor: C.border, color: C.text }}>▲ N</button>
                  <div className="flex gap-0.5">
                    <button data-arch-walk-w onClick={() => walkStep(0, -1)} className="rounded border px-2 text-[11px]" style={{ borderColor: C.border, color: C.text }}>◀ W</button>
                    <button data-arch-walk-e onClick={() => walkStep(0, 1)} className="rounded border px-2 text-[11px]" style={{ borderColor: C.border, color: C.text }}>E ▶</button>
                  </div>
                  <button data-arch-walk-s onClick={() => walkStep(1, 0)} className="rounded border px-2 text-[11px]" style={{ borderColor: C.border, color: C.text }}>▼ S</button>
                </div>
              </div>
            ) : (
            <>
            {/* MAIN = 2D floor plan of the nine labeled rooms (operator's finalized design) */}
            <TinyFloorplan layout={roomLayout} selectedRoomId={roomSel} onSelectRoom={selectRoom} />
            {/* persistent 3D MINI-MAP (operator: "adjustable like Mission Planning") — the MiniPanel cube:
                ⠿ drag · ◢ resize · ▾ collapse-to-tab · ⛶ maximize (portal). Same roomLayout + selection. */}
            <div data-arch-minimap className="absolute bottom-2 right-2 z-10">
              <MiniPanel title="3D · MODEL" subtitle="Tiny Home" lanes={false} defaultW={196} defaultH={208} minW={140} minH={150}
                render={(s) => <VoxelHouse homeType={homeType} program={program} height={s} compact layout={roomLayout} selectedRoomId={roomSel} onSelectRoom={selectRoom} wallW={wallW} hvac={hvac} />} />
            </div>
            {/* HOUSE level — move the selected room (D-pad) + ⏎ Enter to optimize it only */}
            {roomSel && !focusRoomId && (
              <div data-arch-roommove className="absolute left-2 top-9 flex flex-col items-center gap-0.5 rounded-lg border p-1.5 shadow-lg"
                style={{ borderColor: C.cyan, background: "#0a0f16ee" }}>
                <div className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>Move room</div>
                <button data-arch-roommove-n onClick={() => moveRoom(-1, 0)} className="rounded border px-2 text-[11px]" style={{ borderColor: C.border, color: C.text }}>▲ N</button>
                <div className="flex gap-0.5">
                  <button data-arch-roommove-w onClick={() => moveRoom(0, -1)} className="rounded border px-2 text-[11px]" style={{ borderColor: C.border, color: C.text }}>◀ W</button>
                  <button data-arch-roommove-e onClick={() => moveRoom(0, 1)} className="rounded border px-2 text-[11px]" style={{ borderColor: C.border, color: C.text }}>E ▶</button>
                </div>
                <button data-arch-roommove-s onClick={() => moveRoom(1, 0)} className="rounded border px-2 text-[11px]" style={{ borderColor: C.border, color: C.text }}>▼ S</button>
                <button data-arch-room-enter onClick={() => setFocusRoomId(roomSel)} className="mt-0.5 rounded border px-2 text-[10px] font-semibold" style={{ borderColor: C.cyan, color: C.cyan }}>⏎ Enter</button>
                <button data-arch-roommove-reset onClick={resetLayout} className="mt-0.5 rounded border px-1 text-[8px]" style={{ borderColor: C.border, color: C.dim }}>reset</button>
              </div>
            )}
            {/* ROOM level — optimize THIS room only: windows · doors · outlets · furniture */}
            {focusRoom && (
              <div data-arch-room-editor className="absolute left-2 top-9 flex flex-col gap-1 rounded-lg border p-2 shadow-lg"
                style={{ borderColor: C.gold, background: "#0a0f16f2" }}>
                <div className="flex items-center gap-2">
                  <button data-arch-room-back onClick={() => setFocusRoomId(null)} className="rounded border px-1.5 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>← Back</button>
                  <span className="text-[11px] font-bold" style={{ color: C.gold }}>{focusRoom.k} · {focusRoom.label}</span>
                </div>
                {([["Windows", "windows"], ["Doors", "doors"], ["Outlets", "outlets"]] as const).map(([lbl, kind]) => (
                  <div key={kind} className="flex items-center justify-between gap-2 text-[10px]" style={{ color: C.text }}>
                    <span style={{ color: C.dim }}>{lbl}</span>
                    <span className="flex items-center gap-1">
                      <button data-arch-el-dec={kind} onClick={() => setElement(kind, -1)} className="rounded border px-1.5" style={{ borderColor: C.border, color: C.text }}>◀</button>
                      <span className="w-4 text-center tabular-nums" style={{ color: C.cyan }}>{focusRoom[kind]}</span>
                      <button data-arch-el-inc={kind} onClick={() => setElement(kind, 1)} className="rounded border px-1.5" style={{ borderColor: C.border, color: C.text }}>▶</button>
                    </span>
                  </div>
                ))}
                {/* F9 stretch — widen/deepen the room within the 10-ft envelope (10↔20 ft); feeds sqft/cost. */}
                {([["Width", "w"], ["Depth", "d"]] as const).map(([lbl, dim]) => (
                  <div key={dim} className="flex items-center justify-between gap-2 text-[10px]" style={{ color: C.text }}>
                    <span style={{ color: C.dim }}>{lbl}</span>
                    <span className="flex items-center gap-1">
                      <button data-arch-stretch-dec={dim} onClick={() => stretch(dim, -1)} className="rounded border px-1.5" style={{ borderColor: C.border, color: C.text }}>◀</button>
                      <span className="w-8 text-center tabular-nums" style={{ color: C.gold }}>{focusRoom[dim] * ROOM_FT} ft</span>
                      <button data-arch-stretch-inc={dim} onClick={() => stretch(dim, 1)} className="rounded border px-1.5" style={{ borderColor: C.border, color: C.text }}>▶</button>
                    </span>
                  </div>
                ))}
                <button data-arch-el-furn onClick={toggleFurn} className="rounded border px-2 py-0.5 text-[10px] font-semibold"
                  style={{ borderColor: focusRoom.furniture ? C.cyan : C.border, color: focusRoom.furniture ? C.cyan : C.dim }}>🪑 Furniture {focusRoom.furniture ? "on" : "off"}</button>
              </div>
            )}
            </>
            )}
          </div>
        ) : (
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
        )}
        <div className="mt-1 text-[9px]" style={{ color: C.dim }}>
          {voxel ? "3D voxel — click a room to select · drag to orbit/tilt · scroll to zoom · first-floor plan lives in 2D"
            : tiny ? "2D floor plan — nine 10'×10' rooms = 900 ft² · click a room to select · 3D mini-map lower-right · ▦ Voxel for full 3D"
            : view3d ? "3D isometric — edit in 2D" : mode === "wall" ? "Click two grid points to place a 2×4 wall" : `Click near a wall to place a ${mode}`}
        </div>
      </div>
  );
}
