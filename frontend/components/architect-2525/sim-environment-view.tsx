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
import { environmentFor, environmentObjects, hexPoints, VIEW, MARGIN, type FormId } from "@/lib/architect-sim-environment";
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
  const ox = MARGIN, oy = MARGIN, S = V - 2 * MARGIN, cell = S / 3;   // shared layout constants (no re-derivation — Krishna)

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
          <rect x={ox} y={oy} width={S} height={S} rx={1} stroke={wall} strokeWidth={wallW} />
          {/* the OPEN GREAT ROOM — one zone, NO interior dividers (genuinely open — Enki) */}
          {(() => {
            const g = env.placements.filter((p) => p.open);
            if (!g.length) return null;
            const x0 = Math.min(...g.map((p) => p.rect.x)), y0 = Math.min(...g.map((p) => p.rect.y));
            const x1 = Math.max(...g.map((p) => p.rect.x + p.rect.w)), y1 = Math.max(...g.map((p) => p.rect.y + p.rect.h));
            return (
              <g>
                <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} stroke={C.violet} strokeOpacity={0.55} strokeWidth={0.6} strokeDasharray="3 2" />
                <text x={x0 + 1.5} y={y1 - 1.5} fontSize={2.8} fill={C.violet} style={{ fontFamily: "ui-monospace, monospace" }}>OPEN GREAT ROOM</text>
              </g>
            );
          })()}
          {/* the private + utility rooms — dashed zone hints */}
          {env.placements.filter((p) => !p.open).map((pl, i) => (
            <rect key={`z-${i}`} x={pl.rect.x} y={pl.rect.y} width={pl.rect.w} height={pl.rect.h} stroke={C.dim} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.55} />
          ))}
        </g>
      )}
      {env.shell === "hex" && env.hexes && (
        <g fill="none" vectorEffect="non-scaling-stroke">
          {/* the HEX DOME as a printed 3D volume cue (Athena/Pangu): a flat-top hexagon shell enclosing the cluster + a
              dome section arc + a thin inner hex, so the picture reads as the hex dome being printed, not a flat circle */}
          {env.dome && (
            <g>
              <polygon points={hexPoints(V / 2, V / 2, V / 2 - 4).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} stroke={`${C.violet}66`} strokeWidth={0.9} />
              <polygon points={hexPoints(V / 2, V / 2, V / 2 - 9).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")} stroke={`${C.violet}33`} strokeWidth={0.5} strokeDasharray="2 2" />
              <path d={`M ${8} ${V / 2} A ${V / 2 - 8} ${(V / 2 - 8) * 0.62} 0 0 1 ${V - 8} ${V / 2}`} stroke={`${C.violet}55`} strokeWidth={0.6} strokeDasharray="2 2" />
              <text x={V / 2} y={11} fontSize={2.8} textAnchor="middle" fill={C.violet} style={{ fontFamily: "ui-monospace, monospace" }}>HEX DOME</text>
            </g>
          )}
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
