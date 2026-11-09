/**
 * SensorFusion-2525 shared class list helpers (CRS-08.04–08.06).
 * Normalize + exact reuse + "did you mean?" near-match. No invented rates.
 */

export type SfClass = {
  class_id: string;
  project_id: string;
  canonical_name: string;
  name_key: string;
  use_count: number;
  merged_into?: string | null;
};

/** Match key only: trim, lower, strip spaces/underscores/hyphens/punct; naive plural→singular. */
export function classNameKey(raw: string): string {
  let s = (raw || "").trim().toLowerCase();
  s = s.replace(/[\s_\-]+/g, "").replace(/[^a-z0-9]/g, "");
  if (s.length > 3 && s.endsWith("ies")) s = s.slice(0, -3) + "y";
  else if (s.length > 2 && s.endsWith("ses")) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  return s || "unnamed";
}

/** Levenshtein distance for near-match prompts. */
export function editDistance(a: string, b: string): number {
  const x = a || "";
  const y = b || "";
  if (x === y) return 0;
  if (!x.length) return y.length;
  if (!y.length) return x.length;
  const row = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= y.length; j++) {
      const cur = row[j];
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[y.length];
}

export type ClassResolve =
  | { kind: "exact"; match: SfClass }
  | { kind: "near"; match: SfClass; distance: number; typed: string }
  | { kind: "new"; typed: string; name_key: string };

/**
 * Prefer existing classes (most-used first). Exact name_key → reuse.
 * Near-match (distance ≤ 2, or ≤ 1/3 of key length) → "did you mean?".
 */
export function resolveClassInput(typed: string, classes: readonly SfClass[]): ClassResolve {
  const trimmed = (typed || "").trim();
  const key = classNameKey(trimmed);
  const live = classes.filter((c) => !c.merged_into);
  const ranked = [...live].sort((a, b) => b.use_count - a.use_count || a.canonical_name.localeCompare(b.canonical_name));

  const exact = ranked.find((c) => c.name_key === key);
  if (exact) return { kind: "exact", match: exact };

  let best: { c: SfClass; d: number } | null = null;
  for (const c of ranked) {
    const d = editDistance(key, c.name_key);
    const limit = Math.max(1, Math.floor(Math.max(key.length, c.name_key.length) / 3));
    if (d > 0 && d <= Math.min(2, limit)) {
      if (!best || d < best.d || (d === best.d && c.use_count > best.c.use_count)) {
        best = { c, d };
      }
    }
  }
  if (best) return { kind: "near", match: best.c, distance: best.d, typed: trimmed };
  return { kind: "new", typed: trimmed, name_key: key };
}

/** Autocomplete filter: existing classes whose name/key contains the typed fragment; most-used first. */
export function suggestClasses(typed: string, classes: readonly SfClass[], limit = 12): SfClass[] {
  const q = classNameKey(typed);
  const live = classes.filter((c) => !c.merged_into);
  const scored = live
    .map((c) => {
      const hit =
        !q ||
        c.name_key.includes(q) ||
        classNameKey(c.canonical_name).includes(q) ||
        c.canonical_name.toLowerCase().includes((typed || "").trim().toLowerCase());
      return hit ? c : null;
    })
    .filter((c): c is SfClass => Boolean(c));
  scored.sort((a, b) => b.use_count - a.use_count || a.canonical_name.localeCompare(b.canonical_name));
  return scored.slice(0, limit);
}
