// FROM OPEN PLAY TO A REAL ARENA — the progression, and the one-in-nine gate on it.
//
// Operator 2026-09-16: "Long term goal is many play game and 11.1 percent play our game to advance to
// winners circle and tournament where one team is able to play another team on actual physical laser tag
// drone game… game should expand so in person challenge attracts talent of 11.1% to play winners circle
// where one gets to play on actual physical systems."
//
// ── THE 11.1 % IS NOT A NEW NUMBER ───────────────────────────────────────────────────────────────
// It is one ninth, the R-CORE recursion gate (docs/MODE_R-CORE_SPEC.md). Using the framework's own
// threshold rather than inventing a second one means the tournament and the engineering discipline advance
// on the same rule, which is the point of having a rule at all.
//
// ── FOUR STAGES, AND THE LAST ONE IS REAL ────────────────────────────────────────────────────────
//   OPEN      anyone, any device, the browser game
//   CIRCLE    the top one ninth of a season's field
//   TOURNAMENT  the circle, drawn against each other
//   PHYSICAL  two teams, actual machines, an actual floor
//
// The last stage is the only one where a mistake can hurt somebody, so it is the only one with a gate that
// is not about skill. `admitToPhysical` refuses unless a NAMED safety officer has cleared it, both teams
// are present and the arena is declared clear — and it refuses by returning a reason, never by throwing
// away the entry. Nobody loses a season because a checkbox was unticked.
//
// Pure and seeded: no clock, no DOM, no Math.random. Ties break on declared criteria in a declared order,
// so a standing can be recomputed from the same results and audited.

/** One ninth. The R-CORE recursion gate, reused rather than re-invented. */
export const ADVANCE_FRACTION = 1 / 9;
/** A field smaller than this advances nobody. A gate that always passes is not a gate. */
export const MIN_FIELD = 9;

export type Stage = "open" | "circle" | "tournament" | "physical";
export const STAGES: Stage[] = ["open", "circle", "tournament", "physical"];

export interface Crew {
  /** The two people: a pilot and a targeteer. Both named, because the fire gate needs a name. */
  id: string;
  pilot: string;
  targeteer: string;
}

export interface Record_ {
  crewId: string;
  /** Matches played. A crew with none is not ranked — it is unranked, which is different from last. */
  played: number;
  /** Opposing aircraft brought down and landed safely. */
  downed: number;
  /** Of the beam time this crew spent, the share that reached a target still able to fight. */
  beamEfficiency: number;
  /** Named decisions this crew's watch officer answered inside the window. Discipline, not speed. */
  decisionsHonoured: number;
  /** Named decisions that expired unanswered. The thing that should cost a crew a season. */
  decisionsLapsed: number;
}

/**
 * THE SCORE, and why it is shaped this way.
 *
 * A crew that shoots a lot is not the crew we want in a room with real machines. The score is dominated by
 * how much of the beam actually landed on something that could still fight (efficiency) and by whether the
 * crew's decisions were answered rather than allowed to lapse. Kills matter, but they are the smallest term
 * — otherwise the tournament would select for exactly the behaviour the physical stage cannot afford.
 *
 * Per match, so a crew that played more does not out-rank one that played better.
 */
export function score(r: Record_): number {
  if (r.played <= 0) return 0;
  const asked = r.decisionsHonoured + r.decisionsLapsed;
  const discipline = asked > 0 ? r.decisionsHonoured / asked : 1;
  return (r.downed / r.played) * 1 + r.beamEfficiency * 4 + discipline * 5;
}

/**
 * Standing, best first. Ties break on DECLARED criteria in a DECLARED order — efficiency, then discipline,
 * then fewer lapses, then the crew id — so two people can recompute the same table from the same results
 * and get the same answer. A tournament that cannot be audited is not a tournament.
 */
export function standing(records: readonly Record_[]): Record_[] {
  return [...records].sort((a, b) => {
    const d = score(b) - score(a);
    if (Math.abs(d) > 1e-12) return d;
    if (b.beamEfficiency !== a.beamEfficiency) return b.beamEfficiency - a.beamEfficiency;
    const la = a.decisionsLapsed, lb = b.decisionsLapsed;
    if (la !== lb) return la - lb;
    return a.crewId < b.crewId ? -1 : a.crewId > b.crewId ? 1 : 0;
  });
}

/** How many of a field advance. Floor, not round: the gate is a floor and rounding up would soften it. */
export const advanceCount = (fieldSize: number): number =>
  fieldSize < MIN_FIELD ? 0 : Math.floor(fieldSize * ADVANCE_FRACTION);

export interface Season {
  id: string;
  records: Record_[];
}

export interface Advancement {
  fieldSize: number;
  /** Crews that played at all. A crew with no matches cannot advance on a score of zero. */
  ranked: number;
  advancing: number;
  circle: Record_[];
  /** Said out loud, because a cut nobody can see is a cut nobody trusts. */
  cutLine: number | null;
  why: string;
}

/** Who goes through. One ninth of the field that actually played, by the standing above. */
export function toCircle(season: Season): Advancement {
  const played = season.records.filter((r) => r.played > 0);
  const ranked = standing(played);
  const n = advanceCount(ranked.length);
  const circle = ranked.slice(0, n);
  return {
    fieldSize: season.records.length,
    ranked: ranked.length,
    advancing: n,
    circle,
    cutLine: n > 0 ? score(circle[circle.length - 1]) : null,
    why: ranked.length < MIN_FIELD
      ? `a field of ${ranked.length} advances nobody — one ninth of fewer than ${MIN_FIELD} is nobody, and a gate that always passes is not a gate`
      : `${n} of ${ranked.length} who played — one ninth, the R-CORE gate — at a cut of ${(n > 0 ? score(circle[circle.length - 1]) : 0).toFixed(3)}`,
  };
}

// ── THE DRAW ─────────────────────────────────────────────────────────────────────────────────────

export interface Pairing { a: string; b: string | null }

/**
 * Seed the circle against itself, first against last. Deterministic from the standing, so a bracket can be
 * published before it is played and checked afterwards. An odd circle leaves one crew unpaired — said
 * plainly as `b: null` rather than given a silent bye that nobody can see.
 */
export function draw(circle: readonly Record_[]): Pairing[] {
  const ids = circle.map((r) => r.crewId);
  const out: Pairing[] = [];
  let lo = 0, hi = ids.length - 1;
  while (lo < hi) { out.push({ a: ids[lo++], b: ids[hi--] }); }
  if (lo === hi) out.push({ a: ids[lo], b: null });
  return out;
}

// ── THE STAGE WHERE IT IS REAL ───────────────────────────────────────────────────────────────────

export interface PhysicalReadiness {
  /** The person who has cleared the floor. A name, because there is no such thing as an anonymous clearance. */
  safetyOfficer: string;
  /** Both crews physically present at the arena. */
  bothTeamsPresent: boolean;
  /** The arena declared clear of people who are not part of the match. */
  arenaClear: boolean;
  /** Every machine's own descent checked before it is allowed to fly over anyone. */
  descentChecked: boolean;
}

export interface Admission { ok: boolean; why: string }

/**
 * THE ONLY GATE IN THIS FILE THAT IS NOT ABOUT SKILL.
 *
 * Everything above decides who has earned a place. This decides whether it is safe to give it to them, and
 * the two must never be the same question — a crew that wins is not thereby safe to put in a room with
 * flying machines. Every condition is a person or a physical fact, none of them is a score, and the refusal
 * always says which one is missing rather than a general no.
 *
 * It refuses; it does not discard. A crew that cannot play today keeps its place.
 */
export function admitToPhysical(r: PhysicalReadiness): Admission {
  if (!r.safetyOfficer || !r.safetyOfficer.trim())
    return { ok: false, why: "no named safety officer has cleared this floor — a clearance without a name is not one" };
  if (!r.bothTeamsPresent) return { ok: false, why: "both crews must be at the arena; a physical match is not played remotely" };
  if (!r.arenaClear) return { ok: false, why: "the arena is not clear of people who are not in the match" };
  if (!r.descentChecked) return { ok: false, why: "every machine's descent must be checked before it flies over anybody" };
  return { ok: true, why: `cleared by ${r.safetyOfficer}` };
}

/** What a crew has to do to reach the next stage, in one sentence they can act on. */
export function nextStep(stage: Stage, a?: Advancement): string {
  switch (stage) {
    case "open": return a
      ? `play, and finish in the top ${a.advancing} of ${a.ranked} — one ninth`
      : "play, and finish in the top one ninth of the season";
    case "circle": return "you are in the circle; the draw is first against last";
    case "tournament": return "win your side of the draw, then the floor has to be cleared by name before you fly";
    case "physical": return "you are on real machines over a real floor — nothing here is a simulation";
  }
}

/** One line for a standings board. No jargon and no unit anyone has to convert. */
export const standingLine = (r: Record_, place: number): string =>
  `${String(place).padStart(2)}. ${r.crewId} · ${r.downed} down in ${r.played} · `
  + `${Math.round(r.beamEfficiency * 100)}% of beam on target · `
  + `${r.decisionsLapsed === 0 ? "every decision answered" : `${r.decisionsLapsed} decision(s) lapsed`}`;
