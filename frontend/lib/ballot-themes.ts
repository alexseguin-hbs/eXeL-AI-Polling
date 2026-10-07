// The themes a participant ranks in a real session (AsM round 2, Krishna 2026-10-07).
//
// A real session's ballot must carry the session's OWN Cube 6 Theme02 ids — the backend's
// submit_user_ranking (cube7 ranking_submission.py) accepts exactly the non-empty Theme02 rows at the
// session's theme2_voting_level, scoped to its theme01_category when one is set. The participant page
// used to send the nine placeholder ids "t1".."t9", so every human ballot was refused (422: not a UUID).
// This module is that same rule on the client, pure, so the page and the Admin Console driver build the
// ballot one way. It reads GET /sessions/{id}/themes (LiveThemeRow[]), which mock mode also serves.
import { useEffect, useState } from "react";
import { api } from "./api";
import type { LiveThemeRow } from "./adapt-live-themes";
import type { SimTheme } from "./types";

export type BallotLevel = "3" | "6" | "9";
export type BallotCategory = "risk" | "support" | "neutral";

const PARTITION: Record<BallotCategory, NonNullable<SimTheme["partition"]>> = {
  risk: "Risk & Concerns",
  support: "Supporting Comments",
  neutral: "Neutral Comments",
};
const COLORS: Record<BallotCategory, string> = { risk: "#EF4444", support: "#10B981", neutral: "#3B82F6" };
const ICONS = ["🚀", "⚠️", "⚖️", "💡", "🔬", "🔒", "🌐", "📊", "🎯"];

/** The backend's _category_key (cube6 pipeline.py): a Theme01 label → risk | support | neutral. */
export function categoryKey(label: string | null | undefined): BallotCategory | null {
  const lower = (label || "").toLowerCase();
  if (lower.includes("risk")) return "risk";
  if (lower.includes("support")) return "support";
  if (lower.includes("neutral")) return "neutral";
  return null;
}

/** "theme2_9" → "9" (default "9", the backend's default voting level). */
export function levelOf(votingLevel: string | null | undefined): BallotLevel {
  const m = /([369])$/.exec(votingLevel || "");
  return (m ? m[1] : "9") as BallotLevel;
}

function parentCategory(row: LiveThemeRow): BallotCategory | null {
  return categoryKey(row.label) ?? row.theme01_category ?? null;
}

/** The valid ballot: non-empty Theme02 rows at `level`, under a parent of `category` when one is set (any
 *  parent otherwise), in the server's row order — the backend's valid_ids is a set, so order carries no vote. */
export function ballotThemeRows(rows: LiveThemeRow[], level: BallotLevel, category: BallotCategory | null): LiveThemeRow[] {
  const parents = rows.filter((r) => r.theme_level == null);
  const allowed = new Set(
    parents.filter((p) => category == null || parentCategory(p) === category).map((p) => p.id),
  );
  return rows
    .filter((r) => r.theme_level === level && (r.label || "").trim() !== "" && r.parent_theme_id != null && allowed.has(r.parent_theme_id));
}

/** The ballot rows in the shape the ranking and results components draw. */
export function toBallotThemes(ballot: LiveThemeRow[], rows: LiveThemeRow[]): SimTheme[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ballot.map((r, i) => {
    const parent = r.parent_theme_id ? byId.get(r.parent_theme_id) : undefined;
    const cat = (parent && parentCategory(parent)) || r.theme01_category || null;
    const c = typeof r.confidence === "number" && Number.isFinite(r.confidence) ? r.confidence : 0;
    return {
      id: r.id,
      name: r.label.trim(),
      confidence: c > 1 ? c / 100 : c,
      responseCount: r.response_count ?? 0,
      color: cat ? COLORS[cat] : "#64748B",
      icon: ICONS[i % ICONS.length],
      partition: cat ? PARTITION[cat] : undefined,
    };
  });
}

/** Load a real session's ballot (null while loading or when `sessionId` is null). */
export function useSessionBallotThemes(
  sessionId: string | null,
  votingLevel: string | null | undefined,
  category: BallotCategory | null,
): SimTheme[] | null {
  const [themes, setThemes] = useState<SimTheme[] | null>(null);
  const level = levelOf(votingLevel);
  useEffect(() => {
    if (!sessionId) { setThemes(null); return; }
    let live = true;
    api.get<LiveThemeRow[]>(`/sessions/${sessionId}/themes`)
      .then((rows) => {
        if (!live) return;
        const list = Array.isArray(rows) ? rows : [];
        setThemes(toBallotThemes(ballotThemeRows(list, level, category), list));
      })
      .catch(() => { if (live) setThemes([]); });
    return () => { live = false; };
  }, [sessionId, level, category]);
  return themes;
}
