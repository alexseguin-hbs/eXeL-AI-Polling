// One shape at the read boundary for Cube-7 rankings (WS-C final). The REAL GET /rankings
// returns a bare list[AggregatedRankingRead] ({theme_id, rank_position, score, vote_count});
// the mock (and POST /aggregate) return {rankings:[{theme_id, rank, score}], winner, replay_hash}.
// Reading `agg.rankings[].rank` only worked against the mock — this normalizes both so the
// results surface, the SIM driver and any future consumer never diverge again. Pure; unit-locked.

export interface RankRow { theme_id: string; rank: number; score: number }

type LiveRow = { theme_id: string; rank_position?: number; rank?: number; score?: number };
type Wrapped = { rankings?: LiveRow[]; winner?: string | null; replay_hash?: string | null };

export function normalizeRankings(res: unknown): RankRow[] {
  const rows: LiveRow[] = Array.isArray(res)
    ? (res as LiveRow[])
    : Array.isArray((res as Wrapped)?.rankings) ? ((res as Wrapped).rankings as LiveRow[]) : [];
  const out = rows
    .filter((r) => r && typeof r.theme_id === "string")
    .map((r, i) => ({
      theme_id: String(r.theme_id),
      rank: Number.isFinite(r.rank_position) ? Number(r.rank_position) : Number.isFinite(r.rank) ? Number(r.rank) : i + 1,
      score: Number.isFinite(r.score) ? Number(r.score) : 0,
    }));
  out.sort((a, b) => a.rank - b.rank || a.theme_id.localeCompare(b.theme_id));
  return out;
}

/** Winner: explicit when the payload carries one, else the rank-1 row. */
export function rankingWinner(res: unknown, rows: RankRow[] = normalizeRankings(res)): string | null {
  const w = (res as Wrapped)?.winner;
  return typeof w === "string" && w ? w : rows[0]?.theme_id ?? null;
}

export function rankingReplayHash(res: unknown): string | null {
  const h = (res as Wrapped)?.replay_hash;
  return typeof h === "string" && h ? h : null;
}
