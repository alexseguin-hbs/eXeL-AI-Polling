"use client";

/**
 * ARCHITECT-2525 · VECTOR GLASS — the ONE public Design CENTER (R-UX1 truthful center; R-UX2 selection + ghost).
 * =================================================================================================
 * Projects the canonical Runtime through the Block-D WireframeAdapter (toWireframe → Line[]) to a pure SVG.
 * Two views and nothing else: PLAN and VECTOR 3D. No walk-through, no 2×4 wall authoring, no "3D · MODEL",
 * no extruded walls — every drawn line is a canonical SPACE BOUNDARY (never a Wall / Door / Window). This
 * replaces the legacy wall/walk-through engine so the Design tab can no longer tell two stories (a truthful
 * left beside a false center — unified direction §5/§6). Mission-Planning (Security-2525) is the look/feel
 * standard. R-UX2: it renders the LIVE canonical project (so an accepted edit shows), highlights the selected
 * Space (gold), draws the proposed geometry as a dashed-amber GHOST, and selects a Space on click.
 */
import { useMemo, useState, type ReactNode } from "react";
import { buildProjectFromSeed } from "@/lib/architect-2525/canonical/runtime";
import { TINY_HOME_V1 } from "@/lib/architect-2525/seeds/tiny-home-v1";
import { toWireframe, type ViewMode, type Line } from "@/lib/architect-2525/canonical/wireframe";
import type { ArchitectProject, SpaceEntity } from "@/lib/architect-2525/canonical/types";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", gold: "#ffd400", amber: "#f59e0b", grid: "#1a2536", bg: "#070b12" };
const STROKE: Record<string, { color: string; w: number }> = {
  grid:      { color: C.grid, w: 0.6 },
  space:     { color: C.cyan, w: 1.6 },
  selection: { color: C.gold, w: 2.6 },
  north:     { color: C.gold, w: 1.4 },
};
const VB = 1000, PAD = 64;
const spacesOf = (p: ArchitectProject) => p.entities.filter((e): e is SpaceEntity => e.entity_type === "SPACE");

export function VectorGlass({ header, project, selectedId = null, onSelectSpace, ghost }: {
  header?: ReactNode;
  project?: ArchitectProject;
  selectedId?: string | null;
  onSelectSpace?: (entityId: string) => void;
  ghost?: ArchitectProject | null;
}) {
  const seed = useMemo(() => buildProjectFromSeed(TINY_HOME_V1), []);
  const proj = project ?? seed;
  const [view, setView] = useState<ViewMode>("PLAN");
  const scene = useMemo(() => toWireframe(proj, { view, selectedId }), [proj, view, selectedId]);

  // Fit the µm scene into a fixed square SVG box, Y-flipped so +Y (north) / up reads UP on screen.
  const { minX, minY, maxX, maxY } = scene.bounds;
  const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
  const s = (VB - 2 * PAD) / Math.max(w, h);
  const offX = PAD + ((VB - 2 * PAD) - w * s) / 2;
  const offY = PAD + ((VB - 2 * PAD) - h * s) / 2;
  const sx = (px: number) => offX + (px - minX) * s;
  const sy = (py: number) => offY + (maxY - py) * s; // flip so north/up is up

  // The proposed geometry, drawn as a dashed-amber GHOST — only the Spaces whose geometry actually changed.
  const ghostLines = useMemo(() => {
    if (!ghost || ghost === proj) return [] as Line[];
    const cur = new Map(spacesOf(proj).map((g) => [g.entity_id, g]));
    const changed = new Set(spacesOf(ghost).filter((g) => {
      const p = cur.get(g.entity_id);
      return p && (p.x_um !== g.x_um || p.y_um !== g.y_um || p.width_um !== g.width_um || p.depth_um !== g.depth_um);
    }).map((g) => g.entity_id));
    if (!changed.size) return [] as Line[];
    return toWireframe(ghost, { view, grid: false, north: false }).lines.filter((l) => l.space_id && changed.has(l.space_id));
  }, [ghost, proj, view]);

  // Per-Space hit rect (bounding box of its drawn lines) + centroid for the bay label — view-agnostic.
  const perSpace = useMemo(() => {
    const acc = new Map<string, { bay: string; minx: number; miny: number; maxx: number; maxy: number; cx: number; cy: number; n: number }>();
    for (const l of scene.lines) {
      if (!l.space_id || !l.bay_code) continue;
      const g = acc.get(l.space_id) ?? { bay: l.bay_code, minx: Infinity, miny: Infinity, maxx: -Infinity, maxy: -Infinity, cx: 0, cy: 0, n: 0 };
      for (const p of [l.a, l.b]) {
        const X = sx(p[0]), Y = sy(p[1]);
        g.minx = Math.min(g.minx, X); g.maxx = Math.max(g.maxx, X);
        g.miny = Math.min(g.miny, Y); g.maxy = Math.max(g.maxy, Y);
        g.cx += X; g.cy += Y; g.n += 1;
      }
      acc.set(l.space_id, g);
    }
    return [...acc.entries()].map(([id, g]) => ({ id, bay: g.bay, x: g.minx, y: g.miny, w: g.maxx - g.minx, h: g.maxy - g.miny, cx: g.cx / g.n, cy: g.cy / g.n }));
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
        {/* transparent per-Space hit targets (drawn first, under the strokes) */}
        {onSelectSpace && perSpace.map((sp) => (
          <rect key={`hit-${sp.id}`} data-canon-hit={sp.bay} x={sp.x} y={sp.y} width={Math.max(0, sp.w)} height={Math.max(0, sp.h)}
            fill="transparent" style={{ cursor: "pointer" }} onClick={() => onSelectSpace(sp.id)} />
        ))}
        {scene.lines.map((l: Line, i) => {
          const st = STROKE[l.kind] ?? STROKE.space;
          return <line key={i} data-canon-space={l.bay_code || undefined} data-line-kind={l.kind}
            x1={sx(l.a[0])} y1={sy(l.a[1])} x2={sx(l.b[0])} y2={sy(l.b[1])}
            stroke={st.color} strokeWidth={st.w} vectorEffect="non-scaling-stroke" strokeLinecap="round" pointerEvents="none" />;
        })}
        {/* proposed geometry ghost (dashed amber) — the consequence before any commit */}
        {ghostLines.map((l, i) => (
          <line key={`ghost-${i}`} data-arch-ghost x1={sx(l.a[0])} y1={sy(l.a[1])} x2={sx(l.b[0])} y2={sy(l.b[1])}
            stroke={C.amber} strokeWidth={1.8} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" strokeLinecap="round" pointerEvents="none" />
        ))}
        {perSpace.map((sp) => (
          <text key={`lbl-${sp.id}`} data-canon-label={sp.bay} x={sp.cx} y={sp.cy} fill={selectedId === sp.id ? C.gold : C.text} fontSize={13}
            textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "monospace", cursor: onSelectSpace ? "pointer" : "default" }}
            onClick={onSelectSpace ? () => onSelectSpace(sp.id) : undefined}>{sp.bay}</text>
        ))}
        {northLine && <text x={sx(northLine.b[0])} y={sy(northLine.b[1])} dy={-5} fill={C.gold} fontSize={12} textAnchor="middle" style={{ fontFamily: "monospace" }} pointerEvents="none">N</text>}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[9px]" style={{ color: C.dim }}>
        <span>Canonical Space boundaries · PLAN + VECTOR 3D · no walls, no openings{ghostLines.length ? " · amber = proposed" : ""}</span>
        <span style={{ color: C.cyan }}>CANONICAL</span>
      </div>
    </div>
  );
}
