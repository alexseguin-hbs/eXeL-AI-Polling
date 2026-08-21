// Vision • 2525 — shared version-compare engine (v.19).
//
// One diff core for every version-control surface in the tool:
//   · the living document's ledger (word-level block diffs)
//   · the CRS Design Traceability Matrix (field + timestamp diffs across matrix versions)
//   · SoI-2525 slide-version history
//   · R-CORE / replay comparisons
//
// Ported from the living document's r243 word-diff (dfTok/dfDiff) and generalised.
// Pure, deterministic, no I/O — same inputs always give the same ops, so a diff is a
// property of the two versions and never of when it was computed.

export type Op = { t: -1 | 0 | 1; s: string }; // -1 removed · 0 equal · 1 added

// Cross-language tokenizer: CJK/Hangul/Kana as single tokens, numbers grouped,
// everything else split on runs of non-space non-CJK. Works in every language.
export function tokenize(text: string): string[] {
  return (
    text.match(
      /[぀-ヿ㐀-鿿가-힯豈-﫿]|[0-9]+(?:[.,][0-9]+)*|[^\s぀-ヿ㐀-鿿가-힯豈-﫿]+/gu,
    ) || []
  );
}

// Longest-common-subsequence token diff. Returns null when either side exceeds `cap`
// (word-level LCS is O(n·m)); callers fall back to a coarser summary above the cap.
export function diffTokens(a: string[], b: string[], cap = 3000): Op[] | null {
  const n = a.length,
    m = b.length;
  if (n > cap || m > cap) return null;
  const dp: Uint16Array[] = [];
  for (let i = 0; i <= n; i++) dp.push(new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : dp[i + 1][j] >= dp[i][j + 1] ? dp[i + 1][j] : dp[i][j + 1];
  const ops: Op[] = [];
  let i = 0,
    j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ t: 0, s: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ t: -1, s: a[i] });
      i++;
    } else {
      ops.push({ t: 1, s: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ t: -1, s: a[i++] });
  while (j < m) ops.push({ t: 1, s: b[j++] });
  return ops;
}

// Word-level diff of two plain texts. `null` = too large for a word view.
export function diffText(oldText: string, newText: string, cap = 3000): Op[] | null {
  return diffTokens(tokenize(oldText || ""), tokenize(newText || ""), cap);
}

export type FieldChange = { field: string; kind: "added" | "removed" | "changed" | "carried"; from: string; to: string };

// Field-by-field diff of two records (e.g. two versions of one CRS entry).
export function diffRecord<T extends Record<string, string>>(
  oldRec: Partial<T> | null,
  newRec: Partial<T> | null,
  fields: (keyof T)[],
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const f of fields) {
    const from = (oldRec?.[f] ?? "") as string;
    const to = (newRec?.[f] ?? "") as string;
    const kind = !from && to ? "added" : from && !to ? "removed" : from !== to ? "changed" : "carried";
    out.push({ field: String(f), kind, from, to });
  }
  return out;
}

export type RowDiff<T> = { key: string; kind: "added" | "removed" | "changed" | "carried"; from: T | null; to: T | null };

// Diff two versions of a keyed collection (e.g. a matrix version vs another).
export function diffCollection<T extends Record<string, string>>(
  oldArr: T[],
  newArr: T[],
  keyField: keyof T,
): RowDiff<T>[] {
  const A = new Map<string, T>(),
    B = new Map<string, T>();
  for (const r of oldArr) A.set(String(r[keyField]), r);
  for (const r of newArr) B.set(String(r[keyField]), r);
  const keys = Array.from(new Set([...A.keys(), ...B.keys()]));
  return keys.map((key) => {
    const from = A.get(key) ?? null,
      to = B.get(key) ?? null;
    const kind = !from && to ? "added" : from && !to ? "removed" : JSON.stringify(from) !== JSON.stringify(to) ? "changed" : "carried";
    return { key, kind, from, to };
  });
}

// Convenience: split diffText ops into old-side and new-side HTML fragments
// (removed struck-through, added marked) for a side-by-side view. Caller supplies esc.
export function sideBySide(ops: Op[] | null, esc: (s: string) => string): { left: string; right: string } | null {
  if (!ops) return null;
  let left = "",
    right = "";
  for (const o of ops) {
    const e = esc(o.s);
    if (o.t === 0) {
      left += e + " ";
      right += e + " ";
    } else if (o.t === -1) {
      left += `<del>${e}</del> `;
    } else {
      right += `<ins>${e}</ins> `;
    }
  }
  return { left: left.trim(), right: right.trim() };
}
