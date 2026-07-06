"use client";

/**
 * SECURITY-2525 · THE PFIELD venue wireframe
 * ==========================================
 * Detailed gridiron + stadium overlay for the drone-play test AO, georeferenced
 * from the 4 real turf corners (bilinear). Layout estimated from aerial imagery
 * (Google/Apple Maps) — west grandstand large + covered, smaller east stand,
 * octagonal concourse, corner fieldhouses.
 *
 * Field frame (u,v): u = 0 at NORTH end line → 1 at SOUTH; v = 0 at WEST
 * sideline → 1 at EAST. Values <0 or >1 extrapolate (seats, concourse).
 * 120 yd end-to-end (2×10 yd end zones), so goal lines sit at u = 1/12 & 11/12.
 *
 * mode "2d" = plan view. mode "3d" = oblique (stands/structures extruded up).
 */

export interface Corners {
  nw: [number, number]; ne: [number, number]; sw: [number, number]; se: [number, number];
}
type Frac = { fx: number; fy: number };

const COL = {
  field: "#00ff9f", endzone: "#00ff9f", white: "#e5e7eb", gold: "#ffd400",
  goalpost: "#facc15", struct: "#94a3b8", structFill: "#94a3b8", seat: "#64748b",
};

export function PfieldVenue({
  corners, toFrac, mode = "2d",
}: {
  corners: Corners;
  toFrac: (lat: number, lon: number) => Frac;
  mode?: "2d" | "3d";
}) {
  const { nw, ne, sw, se } = corners;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  // bilinear (u=N→S, v=W→E) → screen fraction (0..100 viewBox space)
  const ll = (u: number, v: number): [number, number] => [
    lerp(lerp(nw[0], ne[0], v), lerp(sw[0], se[0], v), u),
    lerp(lerp(nw[1], ne[1], v), lerp(sw[1], se[1], v), u),
  ];
  // 3D oblique: lift a point by height h (in field-width units) toward screen-up.
  const H = mode === "3d" ? 9 : 0;              // screen-% lift per unit height
  const p = (u: number, v: number, h = 0): [number, number] => {
    const [lat, lon] = ll(u, v);
    const f = toFrac(lat, lon);
    return [f.fx * 100, f.fy * 100 - h * H];
  };
  const XY = (u: number, v: number, h = 0) => { const [x, y] = p(u, v, h); return `${x.toFixed(2)},${y.toFixed(2)}`; };
  const seg = (u1: number, v1: number, u2: number, v2: number, stroke: string, w: number, op = 1, h = 0) => {
    const [x1, y1] = p(u1, v1, h), [x2, y2] = p(u2, v2, h);
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={w} opacity={op} strokeLinecap="round" />;
  };

  // ── Yard geometry ──────────────────────────────────────────────────────────
  const goalN = 1 / 12, goalS = 11 / 12;
  const yardU = Array.from({ length: 23 }, (_, i) => (i + 1) / 24); // every 5 yd
  const tenU = Array.from({ length: 11 }, (_, i) => (i + 1) / 12);  // every 10 yd
  const numFor = [0, 10, 20, 30, 40, 50, 40, 30, 20, 10, 0];       // at tenU[k]
  // hash marks: two interior rows (NFL-ish), short ticks along each 5-yd line
  const hashV = [0.36, 0.64];

  // ── Structures (field-frame, estimated from aerial) ─────────────────────────
  const octagon: [number, number][] = [
    [-0.32, -1.30], [-0.08, -2.15], [1.08, -2.15], [1.32, -1.30],
    [1.32, 1.30], [1.08, 2.15], [-0.08, 2.15], [-0.32, 1.30],
  ];
  const seatRows = (uLo: number, uHi: number, vIn: number, vOut: number, rows: number, h = 0) =>
    Array.from({ length: rows }, (_, i) => {
      const v = lerp(vIn, vOut, i / (rows - 1));
      return seg(uLo, v, uHi, v, COL.seat, 0.35, 0.8, h);
    });
  const rect = (uLo: number, uHi: number, vLo: number, vHi: number, h = 0) =>
    <polygon points={[XY(uLo, vLo, h), XY(uLo, vHi, h), XY(uHi, vHi, h), XY(uHi, vLo, h)].join(" ")}
      fill={`${COL.structFill}14`} stroke={COL.struct} strokeWidth="0.3" strokeLinejoin="round" />;
  // extruded block (3D): draw base rect + top rect + connecting verticals
  const block = (uLo: number, uHi: number, vLo: number, vHi: number, h: number, seatRowsN = 0) => (
    <g>
      {mode === "3d" && [[uLo, vLo], [uHi, vLo], [uHi, vHi], [uLo, vHi]].map(([u, v], i) => (
        <line key={i} x1={p(u, v, 0)[0]} y1={p(u, v, 0)[1]} x2={p(u, v, h)[0]} y2={p(u, v, h)[1]} stroke={COL.struct} strokeWidth="0.25" opacity="0.5" />
      ))}
      {mode === "3d" && rect(uLo, uHi, vLo, vHi, 0)}
      {rect(uLo, uHi, vLo, vHi, h)}
      {seatRowsN > 0 && seatRows(uLo, uHi, vLo, vHi, seatRowsN, h)}
    </g>
  );

  // Field-goal "U": crossbar at ~10 ft + two uprights, drawn just past each end line.
  const goalPost = (u: number) => {
    const dz = u < 0.5 ? -0.045 : 0.045; // stand the posts a hair beyond the end line
    return (
      <g>
        {seg(u + dz, 0.42, u + dz, 0.58, COL.goalpost, 0.5)}
        {seg(u + dz, 0.42, u + dz * 2.2, 0.42, COL.goalpost, 0.5)}
        {seg(u + dz, 0.58, u + dz * 2.2, 0.58, COL.goalpost, 0.5)}
        <circle cx={p(u + dz, 0.5)[0]} cy={p(u + dz, 0.5)[1]} r="0.5" fill={COL.goalpost} />
      </g>
    );
  };

  return (
    <g strokeLinejoin="round">
      {/* octagonal concourse perimeter */}
      <polygon points={octagon.map(([u, v]) => XY(u, v, mode === "3d" ? 0.4 : 0)).join(" ")}
        fill={`${COL.structFill}0a`} stroke={COL.struct} strokeWidth="0.4" opacity="0.8" />
      {/* corner fieldhouses */}
      {block(-0.26, -0.02, -1.95, -1.30, 0.8)}
      {block(-0.26, -0.02, 1.30, 1.95, 0.8)}
      {block(1.02, 1.26, -1.95, -1.30, 0.8)}
      {block(1.02, 1.26, 1.30, 1.95, 0.8)}
      {/* south fieldhouse (behind S end zone) */}
      {block(1.05, 1.28, 0.15, 0.85, 0.9)}
      {/* WEST grandstand (large, covered) + EAST stand (smaller) */}
      {block(0.06, 0.94, -1.70, -0.12, 1.4, 12)}
      {block(0.22, 0.78, 1.12, 1.62, 1.0, 8)}

      {/* ── Field ── */}
      <polygon points={[XY(0, 0), XY(0, 1), XY(1, 1), XY(1, 0)].join(" ")}
        fill={`${COL.field}16`} stroke={COL.field} strokeWidth="0.45" />
      {/* end zones */}
      <polygon points={[XY(0, 0), XY(0, 1), XY(goalN, 1), XY(goalN, 0)].join(" ")} fill={`${COL.endzone}22`} stroke={COL.endzone} strokeWidth="0.3" />
      <polygon points={[XY(goalS, 0), XY(goalS, 1), XY(1, 1), XY(1, 0)].join(" ")} fill={`${COL.endzone}22`} stroke={COL.endzone} strokeWidth="0.3" />
      {/* 5-yd lines */}
      {yardU.map((u, i) => seg(u, 0, u, 1, COL.field, 0.18, 0.5, 0))}
      {/* 10-yd lines (heavier) */}
      {tenU.map((u, i) => seg(u, 0, u, 1, COL.field, 0.3, 0.85, 0))}
      {/* hash marks */}
      {yardU.map((u) => hashV.map((v) => seg(u, v - 0.02, u, v + 0.02, COL.white, 0.2, 0.6, 0)))}
      {/* goal lines + 50 */}
      {seg(goalN, 0, goalN, 1, "#19c8cf", 0.35, 0.95, 0)}
      {seg(goalS, 0, goalS, 1, "#19c8cf", 0.35, 0.95, 0)}
      {seg(0.5, 0, 0.5, 1, COL.gold, 0.45, 0.95, 0)}
      {/* white yard NUMBERS at each 10-yd line, near both sidelines */}
      {tenU.map((u, k) => (numFor[k] > 0 ? [0.14, 0.86].map((v, j) => {
        const [x, y] = p(u, v);
        return (
          <text key={`${k}-${j}`} x={x} y={y} fontSize="1.8" fontFamily="monospace" fontWeight="bold"
            fill={COL.white} textAnchor="middle" dominantBaseline="middle" opacity="0.9">
            {numFor[k]}
          </text>
        );
      }) : null))}
      {/* yellow field goals at both end lines */}
      {goalPost(0)}
      {goalPost(1)}
    </g>
  );
}
