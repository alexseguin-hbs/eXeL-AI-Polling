/**
 * ARCHITECT-2525 · ROOM PROGRAM — element counting + engineering rough-sizing (Vision 2525).
 * =========================================================================================
 * Pure, deterministic. Turns the whole-house params (area · stories · style) + a user-editable room
 * program (bedrooms · bathrooms · ceiling height) into the counts a homeowner/trade needs:
 *   • per-bedroom sq ft + room VOLUME (ft³) for cooling load
 *   • ELECTRICAL service amps + voltage + HVAC tonnage + rough appliance load
 *   • PLUMBING fixture units + water-supply / sewer pipe sizes + fittings/valves so a plumber can estimate
 * Rules of thumb are conventional US-residential heuristics (cited inline) — a starting estimate, NOT a
 * stamped engineering calc. Reuses `styleEquivalence` for usable sqft so we never re-derive area.
 */
import { styleEquivalence, type GlobalParams } from "./architect-project";

export interface RoomProgram { bedrooms: number; bathrooms: number; ceilingFt: number; kitchens?: number; }
export const DEFAULT_PROGRAM: RoomProgram = { bedrooms: 3, bathrooms: 2, ceilingFt: 9, kitchens: 1 };
const clampN = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(n) ? Math.round(n) : lo));

/** Smart-default a program from the whole-house area (≈650 gross sqft/bedroom; ~0.75 bath/bedroom). */
export function deriveProgram(p: GlobalParams): RoomProgram {
  const bedrooms = clampN(p.areaSqft / 650, 1, 8);
  return { bedrooms, bathrooms: clampN(bedrooms * 0.75, 1, 6), ceilingFt: 9 };
}

export interface Electrical { serviceAmps: number; voltage: number; hvacTons: number; applianceKw: number; }
export interface Plumbing { fixtureUnits: number; waterPipeIn: string; sewerPipeIn: string; valves: number; fittings: number; }
// Key at-a-glance counts (F4) — the minimum housing metrics shown on the map when the Active-Items rail is hidden.
export interface KeyCounts { rooms: number; windows: number; doors: number; outlets: number; }
export interface ProgramMetrics {
  grossSqft: number; usableSqft: number; bedrooms: number; bathrooms: number;
  perBedroomSqft: number; bedroomVolumeFt3: number;
  electrical: Electrical; plumbing: Plumbing; counts: KeyCounts;
}

// Electrical service by conditioned area (NEC-style tiers) — 240 V split-phase US residential.
function serviceAmps(usable: number): number {
  if (usable < 1500) return 100;
  if (usable < 2600) return 150;
  if (usable < 4000) return 200;
  return 400;
}

/** Finalized Tiny Home (operator design): 3×3 grid of nine 10'×10'×10' rooms = 900 ft², 1 story,
 * one full bath (Master Bath). Fixed by the design — NOT derived from global area. */
export const TINY_HOME = { grossSqft: 900, usableSqft: 900, rooms: 9, bathrooms: 1, bedrooms: 1, ceilingFt: 10, footprintFt: 30, windows: 8, doors: 9 } as const;

export function programMetrics(params: GlobalParams, prog: RoomProgram = DEFAULT_PROGRAM, homeType: "full" | "tiny" = "full"): ProgramMetrics {
  const tiny = homeType === "tiny";
  const eq = tiny ? { gross: TINY_HOME.grossSqft, usable: TINY_HOME.usableSqft } : styleEquivalence(params); // gross + usable (net-to-gross by style)
  const usable = eq.usable, gross = eq.gross;
  const beds = tiny ? TINY_HOME.bedrooms : clampN(prog.bedrooms, 1, 12), baths = tiny ? TINY_HOME.bathrooms : clampN(prog.bathrooms, 1, 10), ceil = tiny ? TINY_HOME.ceilingFt : clampN(prog.ceilingFt, 7, 16);
  // Bedrooms take ~32% of usable area; the rest is living/kitchen/bath/circulation.
  const perBedroomSqft = Math.round((usable * 0.32) / beds);
  const bedroomVolumeFt3 = Math.round(perBedroomSqft * ceil);
  // HVAC ≈ 1 ton / 550 sqft conditioned (moderate-climate rule of thumb).
  const hvacTons = clampN(usable / 550, 1, 25);
  const electrical: Electrical = {
    serviceAmps: serviceAmps(usable), voltage: 240, hvacTons,
    applianceKw: Math.round((6 + baths * 1.5 + hvacTons * 3.5) * 10) / 10,   // base + baths + HVAC compressor draw
  };
  // Plumbing fixture units (WSFU): ~8 per full bath + kitchen 2 + laundry 2.
  const fixtureUnits = baths * 8 + 4;
  const plumbing: Plumbing = {
    fixtureUnits,
    waterPipeIn: fixtureUnits <= 20 ? '¾"' : fixtureUnits <= 45 ? '1"' : '1¼"',
    sewerPipeIn: fixtureUnits <= 20 ? '3"' : '4"',              // building drain by DFU
    valves: baths * 6 + 4,                                       // shutoffs + supply stops + hose bibbs
    fittings: baths * 12 + beds * 2 + 8,                         // elbows/tees/couplings estimate
  };
  // Key counts (F4) — rough, deterministic, code-informed at-a-glance numbers.
  //  rooms   = beds + baths + 4 common (living · kitchen · dining · utility)
  //  windows ≈ 2 per bedroom + 5 common (egress + daylight, IRC R303/R310 spirit)
  //  doors   ≈ beds + baths + 3 (interior per room + 2 exterior + garage/patio)
  //  outlets ≈ NEC 210.52 receptacle rough count (perimeter-driven → ~1 / 60 usable sqft + 1 / room)
  const kitchens = clampN(prog.kitchens ?? 1, 1, 4);
  const totalRooms = tiny ? TINY_HOME.rooms : beds + baths + kitchens + 3;   // + living · dining · utility
  const counts: KeyCounts = {
    rooms: totalRooms,
    windows: tiny ? TINY_HOME.windows : beds * 2 + 5,
    doors: tiny ? TINY_HOME.doors : beds + baths + 3,
    outlets: Math.round(usable / 60) + totalRooms,
  };
  return { grossSqft: gross, usableSqft: usable, bedrooms: beds, bathrooms: baths, perBedroomSqft, bedroomVolumeFt3, electrical, plumbing, counts };
}
