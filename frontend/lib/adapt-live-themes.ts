// Adapt LIVE backend themes (Cube 6 GET /sessions/{id}/themes) into the
// SessionThemeData shape the Flower-of-Life visual renders — so real polling
// sessions show REAL Theme 01 (Risk/Supporting/Neutral) × Theme 02 (3/6/9)
// results instead of the seeded 5,000-response mock. Pure + deterministic
// (unit-locked in tests/adapt-live-themes.test.mjs).
import type { SessionThemeData, ThemeInfo, Theme01Label } from "@/lib/types";

/** One enriched row from GET /sessions/{id}/themes (backend schema ThemeRead). */
export interface LiveThemeRow {
  id: string;
  label: string;
  summary: string;
  confidence: number; // 0-1 or 0-100 — normalized below
  response_count: number;
  /** risk | support | neutral (maps to the 3 Theme01 buckets). */
  theme01_category: "risk" | "support" | "neutral" | null;
  /** "3" | "6" | "9" for Theme02 children; null/undefined for a Theme01 parent row. */
  theme_level: string | null;
  parent_theme_id: string | null;
}

const CATEGORY_TO_LABEL: Record<string, Theme01Label> = {
  risk: "Risk & Concerns",
  support: "Supporting Comments",
  neutral: "Neutral Comments",
};

export const THEME01_LABELS: Theme01Label[] = [
  "Risk & Concerns",
  "Supporting Comments",
  "Neutral Comments",
];

/** Normalize a confidence value to an integer percent (accepts 0-1 or 0-100). */
function pct(c: number): number {
  if (typeof c !== "number" || !Number.isFinite(c)) return 0;
  return Math.round(c <= 1 ? c * 100 : c);
}

function toInfo(row: LiveThemeRow): ThemeInfo {
  const label = (row.label || "").trim();
  const count = row.response_count ?? 0;
  const isEmpty = label === "" || count <= 0;
  return { label, count, avgConfidence: pct(row.confidence), summary33: row.summary || "", isEmpty };
}

/** Pad/trim a Theme02 level array to exactly n slots (Flower-of-Life geometry
 *  needs 3/6/9 petals; missing ones render dimmed as isEmpty placeholders). */
function padLevel(arr: ThemeInfo[], n: number): ThemeInfo[] {
  const out = arr.slice(0, n);
  while (out.length < n) {
    out.push({ label: "", count: 0, avgConfidence: 0, summary33: "", isEmpty: true });
  }
  return out;
}

/**
 * Convert enriched backend theme rows into SessionThemeData.
 * Returns totalResponses = 0 when there are no real Theme01 parents yet — the
 * caller uses that to show a "themes generating" placeholder (never the mock).
 */
export function adaptLiveThemes(sessionId: string, rows: LiveThemeRow[]): SessionThemeData {
  const theme1 = {} as Record<Theme01Label, ThemeInfo>;
  const theme2 = {} as Record<Theme01Label, { level3: ThemeInfo[]; level6: ThemeInfo[]; level9: ThemeInfo[] }>;
  for (const label of THEME01_LABELS) {
    theme1[label] = { label, count: 0, avgConfidence: 0, summary33: "", isEmpty: true };
    theme2[label] = { level3: [], level6: [], level9: [] };
  }

  for (const row of rows || []) {
    const label = row.theme01_category ? CATEGORY_TO_LABEL[row.theme01_category] : undefined;
    if (!label) continue;
    if (row.theme_level == null || row.parent_theme_id == null) {
      // Theme 01 parent row (its own category, no level).
      theme1[label] = toInfo(row);
    } else if (row.theme_level === "3") {
      theme2[label].level3.push(toInfo(row));
    } else if (row.theme_level === "6") {
      theme2[label].level6.push(toInfo(row));
    } else if (row.theme_level === "9") {
      theme2[label].level9.push(toInfo(row));
    }
  }

  for (const label of THEME01_LABELS) {
    theme2[label].level3 = padLevel(theme2[label].level3, 3);
    theme2[label].level6 = padLevel(theme2[label].level6, 6);
    theme2[label].level9 = padLevel(theme2[label].level9, 9);
  }

  const totalResponses = THEME01_LABELS.reduce((s, l) => s + (theme1[l].count || 0), 0);
  return { sessionId, totalResponses, theme1, theme2, responses: [] };
}
