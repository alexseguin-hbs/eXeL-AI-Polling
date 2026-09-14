/** Shared session state utilities — imported by session-view, dashboard, and join-flow. */

/** Canonical status ordering — status only moves forward, never backward… */
export const STATUS_ORDER = ["draft", "open", "polling", "ranking", "closed", "archived"] as const;

/** Returns the rank of a status string. Unknown statuses rank as 0 (same as "draft"). */
export function statusRank(status: string): number {
  const i = STATUS_ORDER.indexOf(status as typeof STATUS_ORDER[number]);
  return i === -1 ? 0 : i;
}

/**
 * …EXCEPT the living-vote re-open: ranking → polling is a real forward move when it carries a
 * HIGHER current_cycle (a new round). Use this wherever a server result is applied to local
 * state so a re-opened round is honoured and stale data still can't roll status back.
 */
export function statusAdvances(
  prev: { status: string; current_cycle?: number | null },
  next: { status: string; current_cycle?: number | null },
): boolean {
  if (statusRank(next.status) > statusRank(prev.status)) return true;
  const pc = Number(prev.current_cycle) || 1, nc = Number(next.current_cycle) || 1;
  return prev.status === "ranking" && next.status === "polling" && nc > pc;
}
