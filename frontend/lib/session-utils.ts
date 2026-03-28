/** Shared session state utilities — imported by session-view, dashboard, and join-flow. */

/** Canonical status ordering — status only moves forward, never backward. */
export const STATUS_ORDER = ["draft", "open", "polling", "ranking", "closed", "archived"] as const;

/** Returns the rank of a status string. Unknown statuses rank as 0 (same as "draft"). */
export function statusRank(status: string): number {
  const i = STATUS_ORDER.indexOf(status as typeof STATUS_ORDER[number]);
  return i === -1 ? 0 : i;
}
