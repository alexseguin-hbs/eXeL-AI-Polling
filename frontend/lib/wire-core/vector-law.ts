// THE VECTOR LAW (operator 2026-09-15, with references: Star Wars arcade 1983, Battlezone).
// "Heres what I mean by wireframe; entire ecosystem should be like this for all users."
//
// A vector display had no fill to give. Everything below follows from that one fact:
//   1. Black ground. Lines only — no fill, gradient, shadow, texture or ambient shading.
//   2. One saturated stroke colour per object, from the 13 (lib/wire-core/palette). Never a shaded variant:
//      a darker edge would be a 14th colour, so depth is read from PERSPECTIVE and OVERLAP instead.
//   3. The HUD is drawn in the same language at the same weight — score, shield arc, reticle and range
//      brackets are strokes on the same surface, not chrome floating above a 3D view.
//   4. Every closed shape is a ring of segments; a curve is an n-gon, so its cost is declared.
// Scope: lib/wire-core is inherited by every 2525 domain surface. It does NOT repaint the polling app's
// chrome — that was not asked for, and CLAUDE.md forbids changing UI the operator did not name.
export const VECTOR_LAW = {
  ground: "#000000",
  fill: "none",                 // the only legal fill on a wireframe surface
  linecap: "round" as const,
  linejoin: "round" as const,
  /** Stroke weight in px before the fidelity dial scales it. */
  stroke: { hairline: 0.6, normal: 1.0, bold: 1.6, hud: 1.2 },
  /** Phosphor bloom is a LAYER hint, never a per-vertex colour — the model stays 13-only. */
  bloom: { filter: "drop-shadow(0 0 2px currentColor)", minTier: "high" as const },
  /** Curve resolution per tier: a circle is this many segments. */
  ngonSides: { low: 8, med: 13, high: 26, ultra: 39 },
} as const;

/** Properties every drawn element gets — collected in one place so a surface cannot forget one. */
export const strokeProps = (hex: string, width: number) => ({
  fill: VECTOR_LAW.fill, stroke: hex, strokeWidth: width,
  strokeLinecap: VECTOR_LAW.linecap, strokeLinejoin: VECTOR_LAW.linejoin,
});
