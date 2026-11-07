/**
 * ARCHITECT-2525 · LIBRARY SECTIONS → ROOMS · PHASES · CATEGORY (Rev A) — the DOCUMENTED map from the operator's board
 * sections (his complete library's `sections`, 25 labels across the 10 packs) to the 9 canonical room keys (or GENERAL)
 * and the DEV_PHASES ids an asset draws in. ONE map, gated complete (every section in LIBRARY_METADATA has a row) — a kind
 * with a legacy ObjectKind keeps its authored ASSET_PARAMS rooms/phases; this map serves the library assets without one.
 * Pure data, no React.
 */
import type { AssetCategory, RoomKey } from "@/lib/room-objects";

export interface SectionRule { rooms: RoomKey[] | "GENERAL"; phases: string[]; category: AssetCategory }

/** Board section → rooms (room-layout keys) · DEV_PHASES ids · brief §17 category. GENERAL = every room. An empty phases list
 *  means "the full design view only" (his EXTERIOR / SITE / OPERATIONS taxonomies have no DEV_PHASE yet). */
export const SECTION_RULES: Record<string, SectionRule> = {
  // Pack 2 — rooms
  "Living / Common":                    { rooms: ["L", "E"],       phases: ["interior"],                                  category: "FURNITURE" },
  "Kitchen":                            { rooms: ["K"],            phases: ["interior"],                                  category: "FIXTURES" },
  "Kitchen Appliances":                 { rooms: ["K"],            phases: ["plumbing", "sewer", "finish", "interior"],   category: "MECHANICAL" },
  "Bathroom":                           { rooms: ["B"],            phases: ["plumbing", "sewer", "finish", "interior"],   category: "FIXTURES" },
  "Bedroom":                            { rooms: ["M"],            phases: ["interior"],                                  category: "FURNITURE" },
  "Office":                             { rooms: ["O"],            phases: ["interior"],                                  category: "FURNITURE" },
  "Laundry":                            { rooms: ["S"],            phases: ["plumbing", "sewer", "finish", "interior"],   category: "MECHANICAL" },
  "Laundry / Storage":                  { rooms: ["S"],            phases: ["interior"],                                  category: "FURNITURE" },
  "Verified extras":                    { rooms: ["D"],            phases: ["interior"],                                  category: "FURNITURE" },   // the dining pair
  // Pack 1 — shell + MEP
  "Shell & Structure":                  { rooms: "GENERAL",        phases: ["foundation", "framing", "roofing"],          category: "BUILDING_ELEMENTS" },
  "MEP strip on source board":          { rooms: "GENERAL",        phases: ["plumbing", "electrical", "hvac"],            category: "MECHANICAL" },
  // Pack 4 — utilities + life systems
  "Water & Air":                        { rooms: "GENERAL",        phases: ["plumbing", "sewer", "hvac"],                 category: "PLUMBING" },
  "Power & Energy":                     { rooms: "GENERAL",        phases: ["electrical"],                                category: "ELECTRICAL" },
  "Safety, Health & Environment":       { rooms: "GENERAL",        phases: ["electrical", "security"],                    category: "SECURITY" },
  // Pack 3 — finishes, lighting, security, exterior
  "Finishes":                           { rooms: "GENERAL",        phases: ["finish"],                                    category: "BUILDING_ELEMENTS" },
  "Lighting":                           { rooms: "GENERAL",        phases: ["electrical", "interior"],                    category: "LIGHTING" },
  "Security & Smart":                   { rooms: "GENERAL",        phases: ["security", "internet"],                      category: "SECURITY" },
  "Exterior & Site":                    { rooms: "GENERAL",        phases: ["roofing", "finish"],                         category: "BUILDING_ELEMENTS" },
  "Site Utilities & Outdoor Systems":   { rooms: "GENERAL",        phases: ["plumbing", "electrical"],                    category: "SITE" },
  // Packs 5–10
  "Smart Home & Automation":            { rooms: "GENERAL",        phases: ["internet", "security"],                      category: "ELECTRICAL" },
  "Site & Landscape":                   { rooms: "GENERAL",        phases: [],                                            category: "SITE" },
  "Accessibility & Inclusion":          { rooms: ["B", "E"],       phases: ["interior"],                                  category: "FIXTURES" },
  "Sustainability & Resilience":        { rooms: "GENERAL",        phases: ["electrical", "roofing"],                     category: "ELECTRICAL" },
  "Lifestyle & Personalization":        { rooms: ["L", "M"],       phases: ["interior"],                                  category: "FURNITURE" },
  "Operations & Maintenance":           { rooms: ["S"],            phases: [],                                            category: "MECHANICAL" },
};

const PHASE_ORDER_HINT = ["foundation", "framing", "roofing", "plumbing", "sewer", "electrical", "hvac", "internet", "security", "insulation", "finish", "interior"];

/** The union of the sections' rooms (GENERAL if any section is GENERAL; de-duplicated, ROOM_KEYS order). */
export function roomsForSections(sections: readonly string[]): RoomKey[] | "GENERAL" {
  const out: RoomKey[] = [];
  for (const s of sections) {
    const r = SECTION_RULES[s]?.rooms;
    if (r === "GENERAL") return "GENERAL";
    for (const k of r ?? []) if (!out.includes(k)) out.push(k);
  }
  return out.length ? out : "GENERAL";
}
/** The union of the sections' DEV_PHASES ids, in build order. */
export function phasesForSections(sections: readonly string[]): string[] {
  const set = new Set<string>();
  for (const s of sections) for (const p of SECTION_RULES[s]?.phases ?? []) set.add(p);
  return PHASE_ORDER_HINT.filter((p) => set.has(p));
}
/** The first section's category (the board's primary placement); FURNITURE when no section is known. */
export function categoryForSections(sections: readonly string[]): AssetCategory {
  for (const s of sections) { const c = SECTION_RULES[s]?.category; if (c) return c; }
  return "FURNITURE";
}
export function isKnownSection(s: string): boolean { return Object.hasOwn(SECTION_RULES, s); }
