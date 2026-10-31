"use client";

/**
 * ARCHITECT-2525 · BUILD — 4D step-by-step construction sequence (MASTER_SPEC §12a / ARC-29, 29.01, 30).
 * =================================================================================================
 * Scrub a step timeline and watch the CANONICAL 3×3 DESIGN go up in build order — footings + slab → the nine room
 * walls → roof → dry-in → plumbing (the wet core) → electrical (wire from power) → windows + doors — with "who does
 * what when" trade lanes (ARC-30). R5 (operator 2026-10-31: "minimally this needs to be 3x3 design"): the viewport
 * used to be a hardcoded gable-house cartoon with no link to the design; it now draws the SAME nine-room / 900 ft²
 * house Design (VoxelHouse) and Simulate render — TINY_ROOM_LAYOUT is the one source — revealed phase by phase.
 * PRODUCT TRUTH: nothing is built; the sequence is an ILLUSTRATIVE build order, not actual progress (the Build gate
 * is not reached). Self-contained SVG; pure client; deterministic (no Math.random — replay law).
 */
import { useEffect, useRef, useState } from "react";
import { TINY_ROOM_LAYOUT, TINY_GRID, ROOM_FT, TINY_SIDE_FT } from "@/lib/room-layout";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400" };
const TRADE_COLOR: Record<string, string> = { Concrete: "#8a8f98", Framing: "#19c8cf", Plumbing: "#38bdf8", Electrical: "#ffd400", Finish: "#22c55e" };
const TRADES = ["Concrete", "Framing", "Plumbing", "Electrical", "Finish"];

interface Step { s: number; e: number; trade: string; label: string; kind: string; }
// Dry-in BEFORE MEP (the Build-Instructions BUILD_ORDER: Foundation → Framing → Roofing → Plumbing → Electrical → finish).
const SEQ: Step[] = [
  { s: 1, e: 2, trade: "Concrete", label: "Footings + Slab — 30×30 ft", kind: "foundation" },
  { s: 3, e: 6, trade: "Framing", label: "Room Walls — 9 rooms on the 3×3", kind: "studs" },
  { s: 7, e: 9, trade: "Framing", label: "Beams + Roof Trusses", kind: "beams" },
  { s: 10, e: 11, trade: "Framing", label: "Sheathing + Roof Deck — dry-in", kind: "sheathing" },
  { s: 12, e: 14, trade: "Plumbing", label: "Plumbing Rough-in — the wet core", kind: "plumbing" },
  { s: 15, e: 17, trade: "Electrical", label: "Electrical Rough-in — wire from power", kind: "electrical" },
  { s: 18, e: 20, trade: "Finish", label: "Windows + Doors + Finish", kind: "openings" },
];
const TOTAL = 20;

const shown = (day: number, k: string) => SEQ.some((x) => x.kind === k && day >= x.s);
const ramp = (day: number, k: string) => { const x = SEQ.find((s) => s.kind === k); if (!x) return 0; return Math.max(0, Math.min(1, (day - x.s + 1) / (x.e - x.s + 1))); };

// ── the 3×3 in plan view: the 30×30 ft house drawn at X0/Y0 with `cell` px per 10-ft room ───────────────────────────
const X0 = 22, Y0 = 6, CELL = 19, HOUSE = CELL * TINY_GRID;            // 57 px across for 30 ft
const cx = (col: number) => X0 + col * CELL, cy = (row: number) => Y0 + row * CELL;
const isWet = (k: string) => k === "B" || k === "K" || k === "S";    // the centre column — the canonical wet core
const exteriorEdges = (row: number, col: number): ("N" | "S" | "E" | "W")[] => {
  const e: ("N" | "S" | "E" | "W")[] = [];
  if (row === 0) e.push("N"); if (row === TINY_GRID - 1) e.push("S"); if (col === 0) e.push("W"); if (col === TINY_GRID - 1) e.push("E");
  return e;
};

export function ArchitectBuild() {
  const [day, setDay] = useState(1);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!playing) return;
    raf.current = setInterval(() => setDay((d) => { if (d >= TOTAL) { setPlaying(false); return d; } return d + 1; }), 600);
    return () => { if (raf.current) clearInterval(raf.current); };
  }, [playing]);

  const activeToday = SEQ.filter((x) => day >= x.s && day <= x.e);
  const gx = (d: number) => (d / TOTAL) * 100;
  const rooms = TINY_ROOM_LAYOUT;

  return (
    <div className="space-y-2">
      {/* PRODUCT TRUTH (Block E 2/n): nothing is built. The 4D sequence below is an ILLUSTRATIVE build order,
          not actual progress — the Build gate is not reached. */}
      <div data-arch-build-status className="rounded-lg border px-3 py-2 text-[11px] font-bold" style={{ borderColor: "#5a3a1a", background: "#1a1206", color: "#f59e0b" }}>
        BUILD · BLOCKED · G4 Qualification required
        <span className="ml-2 font-normal" style={{ color: C.dim }}>— nothing is built; the project is at PLAN · REVIEWABLE. The sequence below is an illustrative build order, not actual progress.</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 flex items-center justify-between text-[9px]" style={{ color: C.dim }}>
          <span><b style={{ color: C.cyan }}>THE 3×3 DESIGN</b> · {rooms.length} rooms · {TINY_SIDE_FT}×{TINY_SIDE_FT} ft · {TINY_SIDE_FT * TINY_SIDE_FT} ft² — plan view, built step by step</span>
          <span>N ↑</span>
        </div>
        {/* progressive build of the canonical 3×3 — one source (TINY_ROOM_LAYOUT), revealed by phase */}
        <svg data-arch-build data-arch-build-3x3 viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet" className="w-full rounded" style={{ background: "#070b12", aspectRatio: "10 / 7" }}>
          {/* site datum */}
          <line x1="4" y1="66" x2="96" y2="66" stroke="#233043" strokeWidth="0.4" />
          {/* FOUNDATION — 30×30 slab + footings under every room wall */}
          {shown(day, "foundation") && (
            <g data-el="foundation" opacity={ramp(day, "foundation")}>
              <rect x={X0} y={Y0} width={HOUSE} height={HOUSE} fill="#2a2f38" stroke="#8a8f98" strokeWidth="0.6" />
              {[1, 2].map((i) => (<g key={i}>
                <line x1={cx(i)} y1={Y0} x2={cx(i)} y2={Y0 + HOUSE} stroke="#5a6170" strokeWidth="0.35" strokeDasharray="1 1" />
                <line x1={X0} y1={cy(i)} x2={X0 + HOUSE} y2={cy(i)} stroke="#5a6170" strokeWidth="0.35" strokeDasharray="1 1" />
              </g>))}
              <text x={X0 + HOUSE / 2} y={Y0 + HOUSE + 3.2} fontSize="2.4" fill="#8a8f98" textAnchor="middle" style={{ fontFamily: "monospace" }}>slab {TINY_SIDE_FT}×{TINY_SIDE_FT} ft</text>
            </g>
          )}
          {/* ROOM WALLS — the nine 10×10 rooms of the 3×3, each with its key (the Design tab's M/B/C/L/K/D/O/S/E) */}
          {shown(day, "studs") && (
            <g data-el="studs" opacity={ramp(day, "studs")}>
              {rooms.map((r) => (
                <g key={r.id} data-arch-build-room={r.k}>
                  <rect x={cx(r.col) + 0.6} y={cy(r.row) + 0.6} width={CELL - 1.2} height={CELL - 1.2} fill="none" stroke={TRADE_COLOR.Framing} strokeWidth="0.55" />
                  <text x={cx(r.col) + CELL / 2} y={cy(r.row) + CELL / 2 + 1.4} fontSize="4" fontWeight={700} fill={TRADE_COLOR.Framing} textAnchor="middle" style={{ fontFamily: "monospace" }}>{r.k}</text>
                </g>
              ))}
            </g>
          )}
          {/* BEAMS + ROOF TRUSSES — a ridge across the house + rafters over every room line */}
          {shown(day, "beams") && (
            <g data-el="beams" opacity={ramp(day, "beams")}>
              <line x1={X0} y1={Y0 + HOUSE / 2} x2={X0 + HOUSE} y2={Y0 + HOUSE / 2} stroke={TRADE_COLOR.Framing} strokeWidth="0.9" />
              {Array.from({ length: 7 }, (_, i) => X0 + (i + 0.5) * (HOUSE / 7)).map((x, i) => (
                <line key={i} x1={x} y1={Y0} x2={x} y2={Y0 + HOUSE} stroke={TRADE_COLOR.Framing} strokeWidth="0.3" opacity={0.7} />
              ))}
            </g>
          )}
          {/* SHEATHING + ROOF DECK — the exterior perimeter closes (dry-in) */}
          {shown(day, "sheathing") && <rect data-el="sheathing" x={X0 - 0.8} y={Y0 - 0.8} width={HOUSE + 1.6} height={HOUSE + 1.6} fill="none" stroke="#3a4a5f" strokeWidth="1.1" opacity={ramp(day, "sheathing")} />}
          {/* PLUMBING — rough-in through the wet core (the centre column B · K · S), supply + drain to the street */}
          {shown(day, "plumbing") && (
            <g data-el="plumbing" opacity={ramp(day, "plumbing")}>
              <line x1={cx(1) + CELL / 2} y1={Y0 + 2} x2={cx(1) + CELL / 2} y2={Y0 + HOUSE + 6} stroke={TRADE_COLOR.Plumbing} strokeWidth="0.7" />
              {rooms.filter((r) => isWet(r.k)).map((r) => (
                <rect key={r.id} x={cx(r.col) + CELL / 2 - 2.2} y={cy(r.row) + CELL / 2 - 4.5} width={4.4} height={2.6} rx={0.5} fill="none" stroke={TRADE_COLOR.Plumbing} strokeWidth="0.45" />
              ))}
              <text x={cx(1) + CELL / 2 + 1.5} y={Y0 + HOUSE + 5.5} fontSize="2.2" fill={TRADE_COLOR.Plumbing} style={{ fontFamily: "monospace" }}>to sewer</text>
            </g>
          )}
          {/* ELECTRICAL — WIRE FROM POWER (the pole) TO THE HOME, then an outlet per the room's count (ARC-29.01) */}
          {shown(day, "electrical") && (
            <g data-el="electrical" opacity={ramp(day, "electrical")}>
              <line x1="8" y1="18" x2="8" y2="66" stroke="#556" strokeWidth="0.5" />
              <polyline points={`8,20 14,24 10,28 ${X0 - 2},34 ${X0},36`} fill="none" stroke={TRADE_COLOR.Electrical} strokeWidth="0.6" />
              <rect x={X0 + 0.8} y={Y0 + HOUSE / 2 + 1.5} width={2.6} height={3.2} fill="none" stroke={TRADE_COLOR.Electrical} strokeWidth="0.4" />
              {rooms.map((r) => Array.from({ length: Math.min(4, r.outlets) }, (_, i) => (
                <circle key={`${r.id}${i}`} cx={cx(r.col) + 3 + i * ((CELL - 6) / 3)} cy={cy(r.row) + CELL - 2.4} r={0.55} fill={TRADE_COLOR.Electrical} />
              )))}
            </g>
          )}
          {/* WINDOWS + DOORS — EVERY window of a perimeter room (its RoomCell count) spread along its exterior edges
              (a room with two windows and one exterior wall gets both on that wall), and every door of the Entry */}
          {shown(day, "openings") && (
            <g data-el="openings" opacity={ramp(day, "openings")}>
              {rooms.map((r) => {
                const edges = exteriorEdges(r.row, r.col); if (!edges.length) return null;
                const w = 4.2, t = 0.9;
                return Array.from({ length: r.windows }, (_, i) => {
                  const edge = edges[i % edges.length];
                  const slot = Math.floor(i / edges.length), slots = Math.ceil(r.windows / edges.length);
                  const along = cx(r.col) + (CELL * (slot + 1)) / (slots + 1) - w / 2;         // spread along the edge
                  const alongY = cy(r.row) + (CELL * (slot + 1)) / (slots + 1) - w / 2;
                  const x = edge === "W" ? cx(r.col) - t / 2 : edge === "E" ? cx(r.col) + CELL - t / 2 : along;
                  const y = edge === "N" ? cy(r.row) - t / 2 : edge === "S" ? cy(r.row) + CELL - t / 2 : alongY;
                  const horiz = edge === "N" || edge === "S";
                  return <rect key={`${r.id}w${i}`} x={x} y={y} width={horiz ? w : t} height={horiz ? t : w} fill="#0b2a2e" stroke={C.cyan} strokeWidth="0.35" />;
                });
              })}
              {/* the Entry's doors (up to two): the front door at the W end of the south edge — clear of the window's centre slot — and a second (porch) door on the east edge */}
              {rooms.filter((r) => r.k === "E").map((r) => Array.from({ length: Math.min(2, r.doors) }, (_, i) => i === 0
                ? <rect key={`${r.id}d0`} x={cx(r.col) + 2.5} y={cy(r.row) + CELL - 0.6} width={4} height={1.4} fill="#1a2a1f" stroke="#22c55e" strokeWidth="0.35" />
                : <rect key={`${r.id}d1`} x={cx(r.col) + CELL - 0.6} y={cy(r.row) + CELL / 2 - 2} width={1.4} height={4} fill="#1a2a1f" stroke="#22c55e" strokeWidth="0.35" />))}
            </g>
          )}
        </svg>
        {/* step scrubber */}
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: playing ? C.violet : C.dim }}>{playing ? "❚❚" : "▶"}</button>
          <input type="range" min={1} max={TOTAL} value={day} onChange={(e) => { setPlaying(false); setDay(+e.target.value); }} className="flex-1" />
          <span className="w-28 text-right text-[11px] tabular-nums" style={{ color: C.dim }}>Step {day}/{TOTAL} · illustrative</span>
        </div>
      </div>
      {/* trade coordination — who does what when */}
      <div className="space-y-2 rounded-lg border p-3 text-[11px]" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>TRADE COORDINATION</div>
        <svg viewBox="0 0 100 40" className="w-full" style={{ aspectRatio: "5 / 2" }}>
          {TRADES.map((t, row) => (
            <g key={t}>
              <text x="0" y={row * 8 + 5} fontSize="3" fill={TRADE_COLOR[t]} style={{ fontFamily: "monospace" }}>{t.slice(0, 5)}</text>
              {SEQ.filter((x) => x.trade === t).map((x, i) => (
                <rect key={i} x={22 + gx(x.s - 1) * 0.78} y={row * 8 + 2} width={gx(x.e - x.s + 1) * 0.78} height="4" rx="0.6" fill={TRADE_COLOR[t]} opacity={day >= x.s ? 0.9 : 0.25} />
              ))}
            </g>
          ))}
          <line x1={22 + gx(day) * 0.78} y1="0" x2={22 + gx(day) * 0.78} y2="40" stroke={C.cyan} strokeWidth="0.4" strokeDasharray="1 1" />
        </svg>
        <div className="border-t pt-1 text-[10px]" style={{ borderColor: C.border }}>
          <div className="font-bold" style={{ color: C.dim }}>ILLUSTRATIVE SEQUENCE · STEP {day}</div>
          {activeToday.length ? activeToday.map((x, i) => (
            <div key={i} className="flex items-center gap-1"><span style={{ color: TRADE_COLOR[x.trade] }}>●</span><span style={{ color: C.text }}>{x.trade}</span><span style={{ color: C.dim }}>— {x.label}</span></div>
          )) : <div style={{ color: C.dim }}>—</div>}
          <div className="mt-1 text-[9px]" style={{ color: C.dim }}>Same house as Design + Simulate (3×3 · {ROOM_FT}-ft rooms); phases follow the Build-Instructions order (dry-in before MEP).</div>
        </div>
      </div>
    </div>
    </div>
  );
}
