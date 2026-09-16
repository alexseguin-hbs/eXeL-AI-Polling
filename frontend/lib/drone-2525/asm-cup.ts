// THE AsM CUP — the operator's published result, as a regression fixture. READ-ONLY, BY CONTRACT.
//
// `docs/drone-2525/operator-deck/ASM_CUP_99.json` is the 99-run seed-2525 cup the operator played with
// twelve named seats before this repository ran anything. His notes, three times: "Do not overwrite
// ASM_CUP_99.*". "Keep the 99× cup as regression fixture. Compare more than winners." "If you run 99×
// again, write a SIDECAR, leave ASM_CUP_99.* alone, hash the canonical event projection only."
//
// So this module never writes. It reads the parsed fixture and recomputes the four facts he published —
// 6v6 BLU 3–1 · 3v3 BLU 5–0 · pairs 1–3 RED · pairs 4–6 BLU — from the numbers in the file, so that a later
// build is judged against HIS result and not against a summary of it that could drift. The sidecar
// (decisions.ts sidecarOf) goes BESIDE the fixture under its own name; sidecarPathFor refuses to return
// the fixture's own path under any spelling.
//
// FLAGGED, NOT HIDDEN: the fixture declares revision "0.039" while the deck it shipped with is r.042 and
// the head is r.050. Which is the reference is the operator's to confirm; this module reports the
// declared revision and gates on nothing about it.
import type { Affiliation } from "@/components/security-2525/asset-icons";

export interface CupSeat { seat: string; name: string; line: string }
export interface CupPair { blu: number; red: number; draw: number; bp: number; rp: number }
export interface CupLevel { blu: number; red: number; draw: number; runs: number; bp: number; rp: number; pairs: CupPair[] }
export interface CupFixture {
  title: string;
  seed: number;
  revision: string;
  teams: { BLU: CupSeat[]; RED: CupSeat[] };
  pairings: { blu: string; red: string; seats: string }[];
  results: Record<string, Record<string, CupLevel>>;      // rung ("6v6") → level ("1".."5") → result
}

export const CUP_FIXTURE_PATH = "docs/drone-2525/operator-deck/ASM_CUP_99.json";
export const ROSTER_FIXTURE_PATH = "docs/drone-2525/operator-deck/ASM_ROSTER.csv";
/** The bytes the operator sent. A gate refuses if either file's hash moves — nothing here may edit them. */
export const CUP_FIXTURE_SHA256 = "5dc8489dcf8ca5f150f89d9248104540c3d2e1f6563343d5cedc582712fa8aba";
export const ROSTER_FIXTURE_SHA256 = "d154f18d63feb8a06f67698f9797853eeef7f16e0b12770fb9c07a554fcd3194";
export const SIDECAR_NAME = "exel-2525-sidecar.json";

/** The twelve, as CLAUDE.md names them — six a side, in the deck's seat order. */
export const CUP_ROSTER: Record<"BLU" | "RED", readonly string[]> = {
  BLU: ["Enki", "Thor", "Odin", "Athena", "Krishna", "Enlil"],
  RED: ["Sofia", "Aset", "Pangu", "Christo", "Thoth", "Asar"],
};

export type Winner = "BLU" | "RED" | "TIE";
export const winnerOf = (r: { blu: number; red: number }): Winner => (r.blu > r.red ? "BLU" : r.red > r.blu ? "RED" : "TIE");

export interface RungFacts {
  rung: string;
  /** Level → who won that level's 99 runs. */
  byLevel: Record<string, Winner>;
  tally: Record<Winner, number>;
  /** For each pairing index 0..5, who won it at EVERY level (or "MIXED" if the levels disagree). */
  pairs: (Winner | "MIXED")[];
}

/** Everything the published baseline says, recomputed from the fixture's own numbers. */
export function cupFacts(cup: CupFixture): { seed: number; revision: string; rungs: Record<string, RungFacts> } {
  const rungs: Record<string, RungFacts> = {};
  for (const [rung, levels] of Object.entries(cup.results)) {
    const byLevel: Record<string, Winner> = {};
    const tally: Record<Winner, number> = { BLU: 0, RED: 0, TIE: 0 };
    const pairWins: Winner[][] = [];
    for (const [level, r] of Object.entries(levels)) {
      const w = winnerOf(r); byLevel[level] = w; tally[w]++;
      r.pairs.forEach((p, i) => { (pairWins[i] ??= []).push(winnerOf(p)); });
    }
    const pairs = pairWins.map((ws) => (ws.every((w) => w === ws[0]) ? ws[0] : "MIXED"));
    rungs[rung] = { rung, byLevel, tally, pairs };
  }
  return { seed: cup.seed, revision: cup.revision, rungs };
}

/**
 * The baseline as the operator wrote it, in his words, checked against the facts. Returns the sentences
 * that hold and the ones that do not — a later run compares against these, never against memory.
 */
export function baselineHolds(cup: CupFixture): { ok: boolean; held: string[]; broken: string[] } {
  const f = cupFacts(cup);
  const held: string[] = [], broken: string[] = [];
  const say = (cond: boolean, s: string) => (cond ? held : broken).push(s);
  const six = f.rungs["6v6"], three = f.rungs["3v3"];
  say(Boolean(six) && six.tally.BLU === 3 && six.tally.RED === 1, "6v6 BLU 3–1");
  say(Boolean(three) && three.tally.BLU === 5 && three.tally.RED === 0, "3v3 BLU 5–0");
  for (const rung of ["6v6", "3v3"]) {
    const r = f.rungs[rung];
    say(Boolean(r) && [0, 1, 2].every((i) => r.pairs[i] === "RED"), `${rung} pairs 1–3 RED at every level`);
    say(Boolean(r) && [3, 4, 5].every((i) => r.pairs[i] === "BLU"), `${rung} pairs 4–6 BLU at every level`);
  }
  say(f.seed === 2525, "seed 2525");
  return { ok: broken.length === 0, held, broken };
}

/** The fixture's roster against the twelve the repository names. */
export function rosterMatches(cup: CupFixture): boolean {
  const names = (t: "BLU" | "RED") => cup.teams[t].map((s) => s.name);
  return (["BLU", "RED"] as const).every((t) => names(t).join("|") === CUP_ROSTER[t].join("|"))
    && cup.pairings.every((p, i) => p.blu === CUP_ROSTER.BLU[i] && p.red === CUP_ROSTER.RED[i]);
}

/** Where a new run's sidecar goes: beside the fixture, never AT it. Throws rather than returning the fixture's path. */
export function sidecarPathFor(fixturePath: string): string {
  const dir = fixturePath.slice(0, fixturePath.lastIndexOf("/") + 1);
  const out = dir + SIDECAR_NAME;
  if (out.toLowerCase() === fixturePath.toLowerCase() || /ASM_CUP_99|ASM_ROSTER/i.test(SIDECAR_NAME)) throw new Error("sidecar must not be the fixture");
  return out;
}

/** The side a fixture team maps to in the contest. BLU is friendly, RED hostile — the palette law already says so. */
export const sideOfTeam = (t: "BLU" | "RED"): Affiliation => (t === "BLU" ? "friendly" : "hostile");
