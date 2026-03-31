/**
 * SIM Data — Per-poll simulation data for Cube 10 Easter Egg.
 * Re-exports all 3 demos + lookup helper + theme resolution.
 *
 * Demo 1: eXeL AI Polling - Strategy Alignment (DEMO2026)
 * Demo 2: Collaborative Thoughts on AI Governance (PAST0001)
 * Demo 3: Team Innovation Challenge (STATIC01)
 */

export { POLL_2 as DEMO_1 } from "./poll-2-q1-strategy";
export { POLL_3 as DEMO_2 } from "./poll-3-ai-governance";
export { POLL_4 as DEMO_3 } from "./poll-4-team-innovation";

import { POLL_2 } from "./poll-2-q1-strategy";
import { POLL_3 } from "./poll-3-ai-governance";
import { POLL_4 } from "./poll-4-team-innovation";
import type { Theme2VotingLevel } from "@/lib/types";

// ── Shared Theme Types ───────────────────────────────────────────

export interface ThemeEntry {
  id: string;
  name: string;
  confidence: number;
  count: number;
  color: string;
  partition: "Risk & Concerns" | "Supporting Comments" | "Neutral Comments";
}

export interface ThemeLevels {
  theme2_3: ThemeEntry[];
  theme2_6: ThemeEntry[];
  theme2_9: ThemeEntry[];
}

export type SimPollData = typeof POLL_2 | typeof POLL_3 | typeof POLL_4;

/** All SIM polls in display order (3 demos) */
export const ALL_SIM_POLLS = [POLL_2, POLL_3, POLL_4] as const;

/** Lookup poll data by session ID. Returns undefined if not found. */
export function getSimPollBySessionId(sessionId: string): SimPollData | undefined {
  return ALL_SIM_POLLS.find((p) => p.sessionId === sessionId);
}

/** Lookup poll data by index (0-based). Returns undefined if out of range. */
export function getSimPollByIndex(index: number): SimPollData | undefined {
  return ALL_SIM_POLLS[index];
}

/**
 * Resolve themes for the given voting level from poll data.
 * Falls back to themeLevels.theme2_3 if the level key doesn't exist.
 */
export function resolveThemesForLevel(
  pollData: SimPollData,
  level: Theme2VotingLevel,
): ThemeEntry[] {
  const levels = pollData.themeLevels;
  return levels[level] ?? levels.theme2_3;
}
