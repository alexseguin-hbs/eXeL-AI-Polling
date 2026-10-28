"use client";

/**
 * ARCHITECT-2525 · SIMULATE — ENVIRONMENT VIEW (operator 2026-10-27/28). A real, readable floor-plan MOCKUP of one
 * build form, drawn with the HOME'S OWN furniture (defaultObjectsForRoom, placed via projectPlaced — nothing invented):
 *   • Cube        — the nine rooms on a 3×3 grid (solid interior walls).
 *   • Tiny Home   — a long 8.5×40 ft THOW: one shell, an open great room up front, Bath + Bedroom at the rear.
 *   • Eco-Sphere  — seven hexagons (1 centre + 6) under a hex-panel dome.
 * The build option drives the drawing: method switches the walls (stick = thin cyan · 3D Print = thick stone, tinted by
 * material) and the roof is drawn per the chosen roof type — a gable/hip/flat cue over the rectilinear forms, the
 * hex-panel dome over the Eco-Sphere (operator: "show HEX roof … and different roof options for Cube, Tiny Home, 3D Print").
 * Pure inline SVG, deterministic, legible at 375px and in a PNG screenshot.
 */
import { useMemo } from "react";
import { environmentFor, environmentObjects, hexPoints, VIEW, MARGIN, type FormId, type Rect } from "@/lib/architect-sim-environment";
import { projectPlaced, OBJECT_SPEC } from "@/lib/room-objects";
import { ROOFS, type BuildOption, type RoofType } from "@/lib/architect-sim-options";

const C = { ground: "#070b12", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", dim: "#5f7186", cement: "#9aa7b4", composite: "#7fd4a8", hexpanel: "#8aa0b8" };

/** A plan-view roof cue over a rectilinear shell — a dashed ridge/hip notation + a corner label, so the roof CHOICE
 *  is visible on the mockup without obscuring the plan (Christo: legible; Enlil: honest notation). */
function RoofCue({ rect, roof, color }: { rect: Rect; roof: RoofType; color: string }) {
  const { x, y, w, h } = rect;
  const cx = x + w / 2, cy = y + h / 2;
  const label = ROOFS[roof].short;
  const tag = (
    <text x={x + w - 1.5} y={y + 4} fontSize={2.8} textAnchor="end" fill={color} opacity={0.9} style={{ fontFamily: "ui-monospace, monospace" }}>⌂ {label}</text>
  );
  if (roof === "flat") {
    return (
      <g>
        <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={0.6} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        {tag}
      </g>
    );
  }
  if (roof === "hip") {
    return (
      <g stroke={color} strokeOpacity={0.4} strokeWidth={0.6} strokeDasharray="2 2" vectorEffect="non-scaling-stroke">
        <line x1={x} y1={y} x2={cx} y2={cy} /><line x1={x + w} y1={y} x2={cx} y2={cy} />
        <line x1={x} y1={y + h} x2={cx} y2={cy} /><line x1={x + w} y1={y + h} x2={cx} y2={cy} />
        {tag}
      </g>
    );
  }
  // gable — a dashed ridge down the longer axis
  const horizontal = w >= h;
  return (
    <g stroke={color} strokeOpacity={0.45} strokeWidth={0.7} strokeDasharray="3 2" vectorEffect="non-scaling-stroke">
      {horizontal ? <line x1={x + 2} y1={cy} x2={x + w - 2} y2={cy} /> : <line x1={cx} y1={y + 2} x2={cx} y2={y + h - 2} />}
      {tag}
    </g>
  );
}

export function SimEnvironmentView({ formId, opt, size = 220 }: { formId: FormId; opt: BuildOption; size?: number }) {
  const env = useMemo(() => environmentFor(formId), [formId]);
  const placed = useMemo(() => environmentObjects(env), [env]);
  const printed = opt.method === "3d-print";
  const hexp = opt.method === "hex-panel";
  const cement = printed && opt.printMaterial === "cement";
  // three-way wall treatment by construction method (stick / 3D-print / hex-panel) — the Eco default is hex-panel, so it
  // must NOT fall through to the stick branch (Enki): each method gets its own wall tint, weight, and aria label.
  const wall = printed ? (cement ? C.cement : C.composite) : hexp ? C.hexpanel : C.cyan;
  const wallW = printed ? 2.4 : hexp ? 1.8 : 1.1;
  const V = env.view;
  const ox = MARGIN, oy = MARGIN, S = V - 2 * MARGIN, cell = S / 3;
  const shellRect: Rect = env.shellRect ?? { x: ox, y: oy, w: S, h: S };
  const methodLabel = printed ? `3D Print · ${opt.printMaterial}` : hexp ? "hex-panel shell" : `stick · ${opt.frameMaterial}`;

  return (
    <svg viewBox={`0 0 ${V} ${V}`} style={{ display: "block", width: "100%", maxWidth: size, aspectRatio: "1 / 1", background: C.ground, borderRadius: 6 }}
      role="img" aria-label={`${formId} floor plan with furniture, ${methodLabel}, ${ROOFS[opt.roof].label} roof`} data-arch-sim-env={formId}>

      {/* ── shell ── */}
      {env.shell === "grid" && (
        <g fill="none" stroke={wall} strokeWidth={wallW} vectorEffect="non-scaling-stroke">
          <rect x={ox} y={oy} width={S} height={S} rx={1} />
          <line x1={ox + cell} y1={oy} x2={ox + cell} y2={oy + S} />
          <line x1={ox + 2 * cell} y1={oy} x2={ox + 2 * cell} y2={oy + S} />
          <line x1={ox} y1={oy + cell} x2={ox + S} y2={oy + cell} />
          <line x1={ox} y1={oy + 2 * cell} x2={ox + S} y2={oy + 2 * cell} />
        </g>
      )}
      {env.shell === "tiny" && (
        <g fill="none" vectorEffect="non-scaling-stroke">
          {/* the long 8.5×40 THOW outline */}
          <rect x={shellRect.x} y={shellRect.y} width={shellRect.w} height={shellRect.h} rx={1} stroke={wall} strokeWidth={wallW} />
          {/* the OPEN GREAT ROOM — one zone, NO interior dividers (genuinely open — Enki) */}
          {(() => {
            const g = env.placements.filter((p) => p.open);
            if (!g.length) return null;
            const x0 = Math.min(...g.map((p) => p.rect.x)), y0 = Math.min(...g.map((p) => p.rect.y));
            const x1 = Math.max(...g.map((p) => p.rect.x + p.rect.w)), y1 = Math.max(...g.map((p) => p.rect.y + p.rect.h));
            return (
              <g>
                <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} stroke={C.violet} strokeOpacity={0.55} strokeWidth={0.6} strokeDasharray="3 2" />
                <text x={x0 + 1} y={y0 - 1.2} fontSize={2.6} fill={C.violet} style={{ fontFamily: "ui-monospace, monospace" }}>OPEN GREAT ROOM</text>
              </g>
            );
          })()}
          {/* the private rooms (Bath, Bedroom) — dashed dividers */}
          {env.placements.filter((p) => !p.open).map((pl, i) => (
            <rect key={`z-${i}`} x={pl.rect.x} y={pl.rect.y} width={pl.rect.w} height={pl.rect.h} stroke={C.dim} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.6} />
          ))}
          <text x={shellRect.x} y={shellRect.y + shellRect.h + 4} fontSize={2.8} fill={C.dim} style={{ fontFamily: "ui-monospace, monospace" }}>8.5 × 40 ft · standard THOW</text>
        </g>
      )}
      {env.shell === "hex" && env.hexes && (
        <g fill="none" vectorEffect="non-scaling-stroke">
          {/* the HEX-PANEL DOME roof (operator: "show HEX roof … Eco-Sphere dome panels"): a flat-top hexagon shell over
              the cluster, a thin inner hex, a dome section arc, AND the triangulated hex panels (the geodesic facets) */}
          {env.dome && (
            <g>
              <polygon points={hexPoints(V / 2, V / 2, V / 2 - 4).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} stroke={`${C.violet}66`} strokeWidth={0.9} />
              <polygon points={hexPoints(V / 2, V / 2, V / 2 - 9).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} stroke={`${C.violet}33`} strokeWidth={0.5} strokeDasharray="2 2" />
              {/* geodesic panel facets — spokes from centre to each outer vertex (the hex panels of the shell) */}
              {hexPoints(V / 2, V / 2, V / 2 - 4).map(([x, y], i) => (
                <line key={`spoke-${i}`} x1={V / 2} y1={V / 2} x2={x} y2={y} stroke={`${C.violet}2e`} strokeWidth={0.4} />
              ))}
              <path d={`M ${8} ${V / 2} A ${V / 2 - 8} ${(V / 2 - 8) * 0.62} 0 0 1 ${V - 8} ${V / 2}`} stroke={`${C.violet}55`} strokeWidth={0.6} strokeDasharray="2 2" />
              <text x={V / 2} y={11} fontSize={2.8} textAnchor="middle" fill={C.violet} style={{ fontFamily: "ui-monospace, monospace" }}>HEX DOME · panels</text>
            </g>
          )}
          {env.hexes.map((hx, i) => (
            <polygon key={i} points={hexPoints(hx.cx, hx.cy, hx.r).map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}
              stroke={wall} strokeWidth={wallW} fill={i === 0 ? `${C.cyan}0f` : "none"} />
          ))}
        </g>
      )}

      {/* ── roof cue for the rectilinear forms (the hex dome is drawn above) ── */}
      {env.shell !== "hex" && <RoofCue rect={shellRect} roof={opt.roof} color={C.gold} />}

      {/* ── the furniture — the home's REAL objects, placed in this geometry ── */}
      {placed.map(({ roomKey, rect, objects }) =>
        objects.map((o) => {
          const p = projectPlaced(o, rect.x, rect.y, rect.w, rect.h);
          const spec = OBJECT_SPEC[o.kind];
          const opening = o.kind === "door" || o.kind === "window";
          return (
            <rect key={`${roomKey}-${o.id}`} x={p.x} y={p.y} width={Math.max(0.6, p.w)} height={Math.max(0.6, p.h)} rx={0.3}
              fill={opening ? spec.color : "none"} fillOpacity={opening ? 0.5 : 1} stroke={spec.color} strokeWidth={0.4}
              vectorEffect="non-scaling-stroke" opacity={0.95} />
          );
        })
      )}

      {/* ── room-key labels (bright enough to read at 375px and in a PNG — Enki) ── */}
      {env.placements.map((pl, i) => (
        <text key={`lbl-${pl.roomKey}-${i}`} x={pl.rect.x + 1.5} y={pl.rect.y + 5} fontSize={3.8} fontWeight={700}
          fill="#aebccb" style={{ fontFamily: "ui-monospace, monospace", paintOrder: "stroke", stroke: "#070b12", strokeWidth: 0.6 }}>{pl.roomKey}</text>
      ))}
    </svg>
  );
}
