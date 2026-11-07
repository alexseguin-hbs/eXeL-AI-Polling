/**
 * ARCHITECT-2525 · ASSET MATERIALS (Rev A) — the ONE place an asset colour literal may live.
 * =================================================================================================
 * The brief's design-language LOCK (docs/asks/2026.11.07_architect2525_native_asset_regeneration_brief.md §2, the
 * operator's concept boards by eXeL AI): primary body teal/cyan · outlines + edge highlights bright cyan · secondary
 * accents purple · glass transparent cyan/blue · screens dark navy/purple · electrical yellow, water/air blue-cyan,
 * security alert restrained red WHERE SEMANTICALLY USEFUL — and the critical rule: ONLY WOOD IS TAN. Tan/natural wood
 * is reserved for actual wood (studs, trusses, sheathing, wood furniture surfaces where intentionally modelled as wood)
 * and is FRAME_COLOR imported from the one framing palette — never a literal here, never a decorative accent.
 *
 * Laws (gated by tests/architect-asset-registry.test.mjs):
 *  · no colour literal outside THIS file within lib/architect-2525/assets/** and lib/architect-asset-export.ts;
 *  · WOOD only on isWoodKind — a part accent "WOOD" or a WOOD body on any other kind falls back to the body preset;
 *  · the Architect body/edge/accent hexes share NO value with MEP_COLOR (MoT ruling P0: "an appliance palette that shares
 *    NO hex with MEP_COLOR — today every wet appliance is the water colour"); the semantic colours are RE-EXPORTED from
 *    their one source (MEP_COLOR / SHELL_COLOR), never re-literalled.
 * Pure data + pure helpers, no React.
 */
import { FRAME_COLOR, SHELL_COLOR } from "@/lib/architect-phase-palette";
import { MEP_COLOR } from "@/lib/mep-runs";
import { ASSET_PARAMS, type MaterialPreset, type ObjectKind, type PartAccent } from "@/lib/room-objects";

export interface Material {
  id: MaterialPreset;
  fill: string;      // the face colour
  edge: string;      // the outline / edge highlight (bright cyan on every Architect material)
  opacity: number;   // 0..1 — glass is the one translucent material
  note: string;
}

/** Outlines and edge highlights — bright cyan on every Architect-2525 material (the board's wireframe edge). */
export const ARCH_EDGE = "#4ff2ff";

/** The material presets. The body preset of a kind is ASSET_PARAMS[kind].materialPreset; a part may override it by role. */
export const MATERIALS: Record<MaterialPreset, Material> = {
  ARCH_TEAL:   { id: "ARCH_TEAL",   fill: "#1a7f8a",   edge: ARCH_EDGE, opacity: 1,    note: "primary body — teal, bright-cyan edge" },
  ARCH_ACCENT: { id: "ARCH_ACCENT", fill: "#a855f7",   edge: ARCH_EDGE, opacity: 1,    note: "secondary accent — purple (cushions, rings, basins, door slabs; never a decorative tan)" },
  GLASS:       { id: "GLASS",       fill: "#7dd3fc",   edge: ARCH_EDGE, opacity: 0.35, note: "glass — transparent cyan/blue (windows, shower walls, mirrors)" },
  SCREEN:      { id: "SCREEN",      fill: "#1e1b4b",   edge: ARCH_EDGE, opacity: 1,    note: "screens — dark navy/purple (TV, monitor, appliance displays)" },
  WOOD:        { id: "WOOD",        fill: FRAME_COLOR, edge: ARCH_EDGE, opacity: 1,    note: "ONLY WOOD IS TAN — FRAME_COLOR (SPF lumber), imported, never a literal; isWoodKind only" },
};

/** Semantic colours where a function demands one — imported from their ONE source, never re-literalled. */
export const SEMANTIC = {
  ELECTRICAL: MEP_COLOR.wiring,     // yellow — panels, wiring, outlets
  WATER: MEP_COLOR.water,           // cyan — cold supply
  HOT_WATER: MEP_COLOR.hot,         // red — hot supply
  SEWER: MEP_COLOR.sewer,           // green — DWV
  AIR: MEP_COLOR.duct,              // sky — ducts, registers, air handlers
  SECURITY_ALERT: SHELL_COLOR.camera, // restrained red — cameras, sensors, alerts
} as const;

/**
 * The kinds that ARE wood at Level 1 — the framing / shell member roles the walk's framing and shell libraries draw in
 * FRAME_COLOR (studs, plates, headers, king/jack/cripple studs, sills, trusses, rafters, joists, sheathing). No placed
 * ObjectKind is wood today (the boards model every piece of furniture in teal); a wood-surfaced furniture kind is added
 * HERE first, then may carry a WOOD part — the gate refuses WOOD anywhere else. (The steel cut-list members of
 * lib/architect-framing.ts are NOT wood: that is the Voortman steel path.)
 */
export const WOOD_KINDS: readonly string[] = ["stud", "plate", "header", "king", "jack", "cripple", "sill", "truss", "rafter", "joist", "sheathing"];
export function isWoodKind(kind: string): boolean { return WOOD_KINDS.includes(kind); }

/** Part role → the material preset it reads. */
export const ACCENT_PRESET: Record<PartAccent, MaterialPreset> = { ACCENT: "ARCH_ACCENT", GLASS: "GLASS", SCREEN: "SCREEN", WOOD: "WOOD" };

/** The material a kind's part reads: its accent role when set (WOOD only on a wood kind — otherwise the body), else the
 *  kind's body preset. Pure. */
export function materialOf(kind: ObjectKind, accent?: PartAccent): Material {
  const body = MATERIALS[ASSET_PARAMS[kind].materialPreset];
  if (!accent) return body;
  if (accent === "WOOD" && !isWoodKind(kind)) return body;   // ONLY WOOD IS TAN
  return MATERIALS[ACCENT_PRESET[accent]];
}
