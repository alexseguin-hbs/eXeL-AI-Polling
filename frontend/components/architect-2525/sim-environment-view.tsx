"use client";

/**
 * ARCHITECT-2525 · SIMULATE — ENVIRONMENT VIEW (operator 2026-10-27: "press of simulate button should create that
 * environment" · "pictures will always be used"). A real, readable floor-plan MOCKUP of one build form, drawn with the
 * HOME'S OWN furniture (the conserved set from defaultObjectsForRoom, placed via projectPlaced — nothing invented):
 *   • Cube        — the nine rooms on a 3×3 grid (solid interior walls).
 *   • Tiny Home   — the same furniture in an OPEN 900 ft² volume (one shell, faint zone hints, no interior walls).
 *   • Eco-Sphere  — seven hexagons (1 centre + 6) under a hex dome.
 * The framing toggle switches the walls between stick-framed (thin cyan) and 3D-printed cement (thick stone) — the ICON
 * construction method. Pure inline SVG, deterministic, legible at 375px and in a PNG screenshot.
 */
import { useMemo } from "react";
import { environmentFor, environmentObjects, hexPoints, type FormId } from "@/lib/architect-sim-environment";
import { projectPlaced, OBJECT_SPEC } from "@/lib/room-objects";
import type { Framing } from "@/lib/architect-sim-options";

const C = { ground: "#070b12", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", dim: "#5f7186", cement: "#9aa7b4" };

export function SimEnvironmentView({ formId, framing, size = 220 }: { formId: FormId; framing: Framing; size?: number }) {
  const env = useMemo(() => environmentFor(formId), [formId]);
  const placed = useMemo(() => environmentObjects(env), [env]);
  const cement = framing === "3d-printed-cement";
  const wall = cement ? C.cement : C.cyan;
  const wallW = cement ? 2.4 : 1.1;
  const V = env.view;
  const S = V - 12;            // inner side for the grid/open shell
  const cell = S / 3;
  const ox = 6, oy = 6;        // shell origin (matches MARGIN in the generator)

  return (
    <svg viewBox={`0 0 ${V} ${V}`} style={{ display: "block", width: "100%", maxWidth: size, aspectRatio: "1 / 1", background: C.ground, borderRadius: 6 }}
      role="img" aria-label={`${formId} floor plan with furniture, ${cement ? "3D-printed cement" : "stick-framed"}`} data-arch-sim-env={formId}>

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
      {env.shell === "open" && (
        <g fill="none" vectorEffect="non-scaling-stroke">
          {/* one open shell (solid wall) + dashed ZONE hints per room (no solid interior walls) — adapts to the layout */}
          <rect x={ox} y={oy} width={S} height={S} rx={1} stroke={wall} strokeWidth={wallW} />
          {env.placements.map((pl, i) => (
            <rect key={`z-${i}`} x={pl.rect.x} y={pl.rect.y} width={pl.rect.w} height={pl.rect.h} stroke={C.dim} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.55} />
          ))}
        </g>
      )}
      {env.shell === "hex" && env.hexes && (
        <g fill="none" vectorEffect="non-scaling-stroke">
          {/* hex dome halo */}
          {env.dome && <circle cx={V / 2} cy={V / 2} r={V / 2 - 4} stroke={`${C.violet}55`} strokeWidth={0.8} strokeDasharray="3 3" />}
          {env.hexes.map((hx, i) => (
            <polygon key={i} points={hexPoints(hx.cx, hx.cy, hx.r).map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}
              stroke={wall} strokeWidth={wallW} fill={i === 0 ? `${C.cyan}0f` : "none"} />
          ))}
        </g>
      )}

      {/* ── the conserved furniture — the home's REAL objects, placed in this geometry ── */}
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
