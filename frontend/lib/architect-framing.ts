/**
 * ARCHITECT-2525 · Framing takeoff — a member-by-member build plan for a rectangular structure.
 * ============================================================================================
 * Generates every wooden member (2×4 studs, plates, 2×10 floor joists, 2×6 rafters) plus engineered
 * members (LVL ridge beam, steel columns) with, per placement: length · install time · cost (material +
 * labour) · whether the placement is REPETITIVE ENOUGH for humanoid-robot automation. Rolls up total
 * time/cost, an ordered build sequence (for a printed instruction sheet), and a 24/7-robotics scenario
 * (repetitive placements run around the clock → days saved). Pure + deterministic → replayable.
 *
 * This is the granular tier under the WorkSection estimate engine (lib/architect-estimate.ts): a WorkSection
 * ("Framing") decomposes into these individual member placements.
 */

export type MemberType = "stud" | "plate" | "topplate" | "joist" | "rafter" | "beam" | "column" | "header";

export interface Member {
  id: string; type: MemberType; label: string; material: string;
  lengthFt: number; placeMin: number; costUsd: number; automatable: boolean; phase: string;
}

export interface FramingParams { widthFt: number; lengthFt: number; heightFt: number; studSpacingIn: number; crew: number; laborRate: number; }

export interface FramingRollup {
  count: number; totalMin: number; totalCostUsd: number; materialUsd: number; laborUsd: number;
  autoCount: number; autoPct: number; autoMin: number;
  crewDays: number; robotDays: number; daysSaved: number;
}

export interface SequenceStep { phase: string; members: Member[]; min: number; cost: number; automatable: number; }
export interface FramingPlan { members: Member[]; sequence: SequenceStep[]; rollup: FramingRollup; params: FramingParams; }

// Per-type rates: material $/ft, install minutes/placement, robot-suitable (repetitive).
const RATE: Record<MemberType, { matPerFt: number; placeMin: number; auto: boolean; mat: string }> = {
  stud:     { matPerFt: 0.75, placeMin: 2,  auto: true,  mat: "SPF 2×4" },
  plate:    { matPerFt: 0.75, placeMin: 6,  auto: true,  mat: "SPF 2×4 (bottom plate)" },
  topplate: { matPerFt: 0.75, placeMin: 6,  auto: true,  mat: "SPF 2×4 (double top plate)" },
  joist:    { matPerFt: 2.10, placeMin: 4,  auto: true,  mat: "SPF 2×10 joist" },
  rafter:   { matPerFt: 1.10, placeMin: 5,  auto: true,  mat: "SPF 2×6 rafter" },
  header:   { matPerFt: 6.00, placeMin: 10, auto: false, mat: "LVL header" },
  beam:     { matPerFt: 9.00, placeMin: 25, auto: false, mat: "LVL ridge beam" },
  column:   { matPerFt: 14.0, placeMin: 20, auto: false, mat: "Steel column" },
};

const PHASE_ORDER = ["Sill & plates", "Wall studs", "Top plates", "Headers", "Floor joists", "Beams & columns", "Rafters"];
const PHASE_OF: Record<MemberType, string> = {
  plate: "Sill & plates", stud: "Wall studs", topplate: "Top plates", header: "Headers",
  joist: "Floor joists", beam: "Beams & columns", column: "Beams & columns", rafter: "Rafters",
};

function mk(type: MemberType, label: string, lengthFt: number, laborRate: number, idx: number): Member {
  const r = RATE[type];
  const costUsd = lengthFt * r.matPerFt + r.placeMin * (laborRate / 60);
  return { id: `${type}-${idx}`, type, label, material: r.mat, lengthFt: Math.round(lengthFt * 100) / 100, placeMin: r.placeMin, costUsd: Math.round(costUsd * 100) / 100, automatable: r.auto, phase: PHASE_OF[type] };
}

/** Generate the full member list + sequence + rollup for a rectangular building. */
export function generateFraming(params: FramingParams): FramingPlan {
  const { widthFt: W, lengthFt: L, heightFt: H, studSpacingIn: S, crew, laborRate } = params;
  const members: Member[] = [];
  let n = 0;
  const walls = [
    { name: "Front", len: L }, { name: "Back", len: L }, { name: "Left", len: W }, { name: "Right", len: W },
  ];
  const studLen = Math.max(6, H - 0.375 * 3); // wall height less plates
  for (const w of walls) {
    members.push(mk("plate", `${w.name} bottom plate`, w.len, laborRate, n++));
    members.push(mk("topplate", `${w.name} top plate A`, w.len, laborRate, n++));
    members.push(mk("topplate", `${w.name} top plate B`, w.len, laborRate, n++));
    const studs = Math.floor((w.len * 12) / S) + 1;
    for (let i = 0; i < studs; i++) members.push(mk("stud", `${w.name} stud ${i + 1}/${studs}`, studLen, laborRate, n++));
  }
  // one header per wall (door/window) — engineered, not robot-friendly
  for (const w of walls) members.push(mk("header", `${w.name} opening header`, Math.min(6, w.len / 2), laborRate, n++));
  // floor joists spanning W, spaced S along L
  const joists = Math.floor((L * 12) / S) + 1;
  for (let i = 0; i < joists; i++) members.push(mk("joist", `Floor joist ${i + 1}/${joists}`, W, laborRate, n++));
  // ridge beam (LVL) down the length + two steel columns to carry it
  members.push(mk("beam", "Ridge beam (LVL)", L, laborRate, n++));
  members.push(mk("column", "Steel column A", H, laborRate, n++));
  members.push(mk("column", "Steel column B", H, laborRate, n++));
  // rafters, pairs @24" along L
  const rafterPairs = Math.floor((L * 12) / 24) + 1;
  const rafterLen = Math.sqrt((W / 2) ** 2 + (W / 3) ** 2); // ~6/12 pitch
  for (let i = 0; i < rafterPairs; i++) { members.push(mk("rafter", `Rafter ${i + 1}L`, rafterLen, laborRate, n++)); members.push(mk("rafter", `Rafter ${i + 1}R`, rafterLen, laborRate, n++)); }

  // sequence by phase
  const sequence: SequenceStep[] = PHASE_ORDER.map((phase) => {
    const ms = members.filter((m) => m.phase === phase);
    return { phase, members: ms, min: ms.reduce((s, m) => s + m.placeMin, 0), cost: Math.round(ms.reduce((s, m) => s + m.costUsd, 0) * 100) / 100, automatable: ms.filter((m) => m.automatable).length };
  }).filter((s) => s.members.length);

  const rollup = rollupFraming(members, crew);
  return { members, sequence, rollup, params };
}

/** Roll up totals + the 24/7 humanoid-robotics scenario. */
export function rollupFraming(members: Member[], crew: number): FramingRollup {
  const totalMin = members.reduce((s, m) => s + m.placeMin, 0);
  const materialUsd = Math.round(members.reduce((s, m) => s + (m.costUsd - m.placeMin * 0), 0) * 100) / 100; // approx incl labour below
  const totalCostUsd = Math.round(members.reduce((s, m) => s + m.costUsd, 0) * 100) / 100;
  const auto = members.filter((m) => m.automatable);
  const autoMin = auto.reduce((s, m) => s + m.placeMin, 0);
  const nonAutoMin = totalMin - autoMin;
  const crewDays = totalMin / (crew * 8 * 60);                         // human crew, 8-hour days
  const robotDays = autoMin / (crew * 24 * 60) + nonAutoMin / (crew * 8 * 60); // robots run repetitive work 24/7
  return {
    count: members.length, totalMin, totalCostUsd, materialUsd, laborUsd: 0,
    autoCount: auto.length, autoPct: Math.round((auto.length / members.length) * 100), autoMin,
    crewDays: Math.round(crewDays * 100) / 100, robotDays: Math.round(robotDays * 100) / 100,
    daysSaved: Math.round((crewDays - robotDays) * 100) / 100,
  };
}

export const fmtHrs = (min: number) => `${(min / 60).toFixed(1)} h`;
export const fmtUsd = (n: number) => `$${Math.round(n).toLocaleString()}`;
