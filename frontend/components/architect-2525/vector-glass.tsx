"use client";

/**
 * ARCHITECT-2525 · VECTOR GLASS — the ONE public Design CENTER (R-UX1 truthful center; completed in R-UX5).
 * =================================================================================================
 * Projects the canonical Runtime — buildProjectFromSeed(TINY_HOME_V1) — through the Block-D WireframeAdapter
 * (toWireframe → Line[]) to a pure SVG. Two views and nothing else: PLAN and VECTOR 3D. No walk-through, no
 * 2×4 wall authoring, no "3D · MODEL", no extruded walls — every drawn line is a canonical SPACE BOUNDARY
 * (never a Wall / Door / Window). This replaces the legacy wall/walk-through engine so the Design tab can no
 * longer tell two stories (a truthful left beside a false center — unified direction §5/§6). Mission-Planning
 * is the look/feel standard. R-UX5 adds click-to-select, the proposal ghost, and the illustrative Sandbox
 * overlay; R-UX2 wires canonical Space selection + the edit path.
 */
import { useMemo, useState, type ReactNode } from "react";
import { buildProjectFromSeed } from "@/lib/architect-2525/canonical/runtime";
import { TINY_HOME_V1 } from "@/lib/architect-2525/seeds/tiny-home-v1";
import { toWireframe, type ViewMode, type Line } from "@/lib/architect-2525/canonical/wireframe";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400", grid: "#1a2536", bg: "#070b12" };
const STROKE: Record<string, { color: string; w: number }> = {
  grid:      { color: C.grid, w: 0.6 },
  space:     { color: C.cyan, w: 1.6 },
  selection: { color: C.gold, w: 2.4 },
  north:     { color: C.gold, w: 1.4 },
};
const VB = 1000, PAD = 64;

export function VectorGlass({ header }: { header?: ReactNode }) {
  const project = useMemo(() => buildProjectFromSeed(TINY_HOME_V1), []);
  const [view, setView] = useState<ViewMode>("PLAN");
  const scene = useMemo(() => toWireframe(project, { view }), [project, view]);

  // Fit the µm scene into a fixed square SVG box, Y-flipped so +Y (north) / up reads UP on screen.
  const { minX, minY, maxX, maxY } = scene.bounds;
  const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
  const s = (VB - 2 * PAD) / Math.max(w, h);
  const offX = PAD + ((VB - 2 * PAD) - w * s) / 2;
  const offY = PAD + ((VB - 2 * PAD) - h * s) / 2;
  const sx = (px: number) => offX + (px - minX) * s;
  const sy = (py: number) => offY + (maxY - py) * s; // flip so north/up is up

  // Bay-code labels at each Space's line-centroid (view-agnostic — works for PLAN and VECTOR-3D).
  const labels = useMemo(() => {
    const acc = new Map<string, { bay: string; n: number; x: number; y: number }>();
    for (const l of scene.lines) {
      if (!l.space_id || !l.bay_code) continue;
      const g = acc.get(l.space_id) ?? { bay: l.bay_code, n: 0, x: 0, y: 0 };
      g.x += l.a[0] + l.b[0]; g.y += l.a[1] + l.b[1]; g.n += 2;
      acc.set(l.space_id, g);
    }
    return [...acc.values()].map((g) => ({ bay: g.bay, x: g.x / g.n, y: g.y / g.n }));
  }, [scene]);
  const northLine = scene.lines.find((l) => l.kind === "north");

  return (
    <div data-arch-vector-glass data-testid="vector-glass" data-arch-view={view} className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
      {/* Master key + PLAN/VECTOR-3D toggle ride the map's own scrolling header (Security-2525 map-control method). */}
      <div data-arch-map-header className="mb-1 flex items-center gap-3 overflow-x-auto text-[10px]">
        {header}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <div className="flex overflow-hidden rounded border" style={{ borderColor: C.border }}>
            {(["PLAN", "VECTOR3D"] as ViewMode[]).map((v) => (
              <button key={v} data-arch-view-btn={v} onClick={() => setView(v)} className="px-2 py-0.5"
                style={{ color: view === v ? C.cyan : C.dim, background: view === v ? "#0e2233" : "transparent" }}>
                {v === "PLAN" ? "PLAN" : "VECTOR 3D"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${VB} ${VB}`} preserveAspectRatio="xMidYMid meet" className="w-full rounded" style={{ background: C.bg, aspectRatio: "1 / 1", maxWidth: "100%" }}>
        {scene.lines.map((l: Line, i) => {
          const st = STROKE[l.kind] ?? STROKE.space;
          return <line key={i} data-canon-space={l.bay_code || undefined} data-line-kind={l.kind}
            x1={sx(l.a[0])} y1={sy(l.a[1])} x2={sx(l.b[0])} y2={sy(l.b[1])}
            stroke={st.color} strokeWidth={st.w} vectorEffect="non-scaling-stroke" strokeLinecap="round" />;
        })}
        {labels.map((lb) => (
          <text key={lb.bay} data-canon-label={lb.bay} x={sx(lb.x)} y={sy(lb.y)} fill={C.text} fontSize={13} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "monospace" }}>{lb.bay}</text>
        ))}
        {northLine && <text x={sx(northLine.b[0])} y={sy(northLine.b[1])} dy={-5} fill={C.gold} fontSize={12} textAnchor="middle" style={{ fontFamily: "monospace" }}>N</text>}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[9px]" style={{ color: C.dim }}>
        <span>Canonical Space boundaries · PLAN + VECTOR 3D · no walls, no openings</span>
        <span style={{ color: C.cyan }}>CANONICAL</span>
      </div>
    </div>
  );
}
