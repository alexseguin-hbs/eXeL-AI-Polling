"use client";

/**
 * ARCHITECT-2525 · CANONICAL HOUSE VIEW — the 2D ⇄ 3D mirror (operator 2026-11-01, FX01b:
 *   "make top to bottom view and mirror (like security 2525) of 2D vs 3D").
 * =================================================================================================
 * ONE shared geometry (the canonical 3×3 — master.roomCells + dims), drawn two ways, stacked top (2D
 * top-down plan) to bottom (3D isometric), so the plan and the massing read as one house (the Security-2525
 * "2D range ring + 3D dome from one shape" pattern). Each room is a 12′ cube with a 10′ interior and a 1′
 * service cavity (the gap between the outer cube and the inner room is that cavity). Wet rooms tint cyan.
 * Pure presentation from the master — no second source.
 */
import type { CanonicalHouseTruth } from "@/lib/architect-house-truth";

const C = { bd: "#1e2b3a", dim: "#5f7186", text: "#c8d6e5", cyan: "#19c8cf", violet: "#c084fc", ai: "#00DAE6", wall: "#2b3d52", roof: "#0e2233" };
const GRID = 3;

export function CanonicalHouseView({ master }: { master: CanonicalHouseTruth }) {
  const cells = master.roomCells;
  const roomFt = master.dims.roomFt;   // 10
  const cubeFt = master.dims.cubeFt;   // 12
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // ── 2D TOP-DOWN PLAN ── units: 3 px/ft; cube 36, interior 30, cavity band 3 (=1′). North (row 2) is up.
  const FT = 3;
  const cube = cubeFt * FT;                 // 36
  const interior = roomFt * FT;             // 30
  const cavity = (cube - interior) / 2;     // 3 (=1′)
  const plan = cube * GRID;                 // 108
  const M = 11;                             // margin for dim ticks
  const vb = plan + M * 2;                  // 130
  const cellAt = (col: number, row: number) => ({ x: M + col * cube, y: M + (GRID - 1 - row) * cube }); // north up

  // ── 3D ISOMETRIC ── one diamond per cube on the top face; the whole block extruded by wallH. gy = row (front→back).
  const A = 18, B = 9, wallH = 20, ox = 64, oy = 12;
  const iso = (gx: number, gy: number) => ({ x: ox + (gx - gy) * A, y: oy + (gx + gy) * B });
  const topCorners = [iso(0, 0), iso(GRID, 0), iso(GRID, GRID), iso(0, GRID)]; // back · right · front · left
  const pts = (ps: { x: number; y: number }[]) => ps.map((p) => `${p.x},${p.y}`).join(" ");
  const back = topCorners[0], right = topCorners[1], front = topCorners[2], left = topCorners[3];
  const down = (p: { x: number; y: number }) => ({ x: p.x, y: p.y + wallH });
  const diamond = (gx: number, gy: number) => pts([iso(gx, gy), iso(gx + 1, gy), iso(gx + 1, gy + 1), iso(gx, gy + 1)]);
  const isoCenter = (col: number, row: number) => {
    const a = iso(col, row), b = iso(col + 1, row + 1); return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  return (
    <div data-arch-house-view className="flex flex-col gap-1 rounded-lg border p-2" style={{ borderColor: C.bd }}>
      <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-wider">
        <span style={{ color: C.ai }}>Plan ⇄ 3D</span>
        <span style={{ color: C.dim }}>one house · two views · {master.dims.shellWidthFt}′ shell · {roomFt}′ rooms</span>
      </div>

      {/* 2D TOP-DOWN (north up) */}
      <div className="flex items-center gap-1">
        <span className="w-8 shrink-0 text-[8px] font-semibold" style={{ color: C.dim }}>2D ↑N</span>
        <svg data-house-2d viewBox={`0 0 ${vb} ${vb}`} className="w-full" style={{ maxWidth: 230, height: "auto" }} role="img" aria-label="Top-down plan of the canonical 3×3 house">
          {cells.map((c) => {
            const { x, y } = cellAt(c.col, c.row);
            const ctr = { x: x + cube / 2, y: y + cube / 2 };
            return (
              <g key={`${c.col}-${c.row}`}>
                {/* the 12′ cube (outer) — the band to the inner room is the 1′ service cavity */}
                <rect x={x + 0.5} y={y + 0.5} width={cube - 1} height={cube - 1} fill={C.roof} stroke={C.wall} strokeWidth="0.6" />
                {/* the 10′ interior room */}
                <rect x={x + cavity} y={y + cavity} width={interior} height={interior} fill={c.wet ? "#0c2730" : "#0c1420"} stroke={c.wet ? C.ai : C.violet} strokeWidth="0.7" />
                <text x={ctr.x} y={ctr.y + 1.5} textAnchor="middle" fontSize="5.4" fill={C.text} style={{ fontWeight: 600 }}>{cap(c.label)}</text>
                <text x={ctr.x} y={ctr.y + 8} textAnchor="middle" fontSize="3.6" fill={C.dim}>{roomFt}′×{roomFt}′</text>
              </g>
            );
          })}
          {/* overall dimension tick */}
          <text x={M + plan / 2} y={M - 3} textAnchor="middle" fontSize="4.4" fill={C.ai}>{master.dims.shellWidthFt}′</text>
        </svg>
      </div>

      {/* 3D ISOMETRIC — the same 9 cubes */}
      <div className="flex items-center gap-1">
        <span className="w-8 shrink-0 text-[8px] font-semibold" style={{ color: C.dim }}>3D</span>
        <svg data-house-3d viewBox="0 0 128 100" className="w-full" style={{ maxWidth: 230, height: "auto" }} role="img" aria-label="Isometric 3D of the canonical 3×3 house">
          {/* left + right extruded walls (the massing) */}
          <polygon points={pts([left, front, down(front), down(left)])} fill="#0a1a26" stroke={C.wall} strokeWidth="0.7" />
          <polygon points={pts([front, right, down(right), down(front)])} fill="#0c2233" stroke={C.wall} strokeWidth="0.7" />
          {/* top face */}
          <polygon points={pts([back, right, front, left])} fill={C.roof} stroke={C.ai} strokeWidth="0.9" />
          {/* 3×3 cube grid on the top face */}
          {cells.map((c) => {
            const wet = c.wet; const ctr = isoCenter(c.col, c.row);
            return (
              <g key={`iso-${c.col}-${c.row}`}>
                <polygon points={diamond(c.col, c.row)} fill={wet ? "#0c2730" : "transparent"} stroke={wet ? C.ai : C.violet} strokeWidth="0.5" opacity={wet ? 0.95 : 0.7} />
                {wet && <circle cx={ctr.x} cy={ctr.y} r="1.5" fill={C.ai} />}
              </g>
            );
          })}
          <text x={ox} y={down(front).y + 7} textAnchor="middle" fontSize="4.4" fill={C.dim}>{master.dims.shellWidthFt}′ × {master.dims.shellDepthFt}′ × {master.dims.wallHeightFt}′ · 9 cubes</text>
        </svg>
      </div>
      <div className="text-[8px]" style={{ color: C.dim }}><span style={{ color: C.ai }}>■</span> wet room (plumbing) · the gap around each room is the 1′ service cavity</div>
    </div>
  );
}
