/**
 * SIM Data — Per-poll simulation data for Cube 10 Easter Egg.
 * Re-exports all 4 polls + lookup helper.
 */

export { POLL_1 } from "./poll-1-product-feedback";
export { POLL_2 } from "./poll-2-q1-strategy";
export { POLL_3 } from "./poll-3-ai-governance";
export { POLL_4 } from "./poll-4-team-innovation";

import { POLL_1 } from "./poll-1-product-feedback";
import { POLL_2 } from "./poll-2-q1-strategy";
import { POLL_3 } from "./poll-3-ai-governance";
import { POLL_4 } from "./poll-4-team-innovation";

export type SimPollData = typeof POLL_1 | typeof POLL_2 | typeof POLL_3 | typeof POLL_4;

/** All SIM polls in display order */
export const ALL_SIM_POLLS = [POLL_1, POLL_2, POLL_3, POLL_4] as const;

/** Lookup poll data by session ID. Returns undefined if not found. */
export function getSimPollBySessionId(sessionId: string): SimPollData | undefined {
  return ALL_SIM_POLLS.find((p) => p.sessionId === sessionId);
}

/** Lookup poll data by index (0-based). Returns undefined if out of range. */
export function getSimPollByIndex(index: number): SimPollData | undefined {
  return ALL_SIM_POLLS[index];
}
