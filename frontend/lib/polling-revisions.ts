// WS-D Revision-history control for polling results (operator 2026-09-14: "Let's revisit polling, and
// create revision history control as well"). Append-only snapshots of a session's themed + ranked
// results, compared with the shared Vision-2525 diff engine (lib/version-diff.ts) — the same core the
// living-document ledger and SoI-2525 slide history use (no rework). Pure + deterministic: a snapshot's
// id is a content hash, so re-snapshotting an unchanged result is a no-op.

import type { SessionThemeData, Theme01Label } from "@/lib/types";
import { diffMaps, type KeyChange } from "@/lib/version-diff";

export interface RankRow { label: string; rank: number; score: number }

export interface PollingSnapshot {
  id: string;            // content hash — identical results → identical id
  at: string;            // ISO capture time (metadata only; not part of the id)
  label: string;         // human label ("v3 · 2026-09-14 14:30")
  sessionId: string;
  totalResponses: number;
  /** Flattened field map used for diffing (theme tiers, counts, confidence, priorities). */
  fields: Record<string, string>;
}

const THEME01: Theme01Label[] = ["Risk & Concerns", "Supporting Comments", "Neutral Comments"];

/** Stable FNV-1a hash of a string → 8-hex id (same family as the rest of the app). */
function hash(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Flatten a themed+ranked result into a key→text map for diffMaps. Deterministic key order. */
export function flattenResult(data: SessionThemeData, ranking: RankRow[] = []): Record<string, string> {
  const f: Record<string, string> = {};
  f["Total responses"] = String(data.totalResponses ?? 0);
  for (const label of THEME01) {
    const t = data.theme1?.[label];
    if (!t || t.isEmpty) continue;
    f[`${label} · responses`] = String(t.count ?? 0);
    f[`${label} · confidence`] = `${t.avgConfidence ?? 0}%`;
    if (t.summary33) f[`${label} · 33`] = t.summary33;
    if (t.summary111) f[`${label} · 111`] = t.summary111;
    if (t.summary333) f[`${label} · 333`] = t.summary333;
    // Theme02 level-3 sub-themes (labels + counts) — the coarse structure, kept legible.
    const l3 = data.theme2?.[label]?.level3 ?? [];
    l3.filter((s) => s && !s.isEmpty).forEach((s, i) => { f[`${label} · L3 #${i + 1}`] = `${s.label} (${s.count})`; });
  }
  ranking.forEach((r) => { f[`Priority #${r.rank}`] = `${r.label} — score ${r.score}`; });
  return f;
}

/** Build an append-ready snapshot from the current result. `at`/`label` are metadata; id is content. */
export function snapshotResult(sessionId: string, data: SessionThemeData, ranking: RankRow[] = [], at: Date = new Date()): PollingSnapshot {
  const fields = flattenResult(data, ranking);
  const id = hash(sessionId + "|" + JSON.stringify(fields));
  return { id, at: at.toISOString(), label: "", sessionId, totalResponses: data.totalResponses ?? 0, fields };
}

/**
 * Append a snapshot to the history (append-only). A snapshot whose content id equals the last
 * entry's is a no-op (nothing changed) — the history never grows on an identical re-capture.
 * Labels are assigned by position ("v1", "v2", …) so the timeline reads naturally.
 */
export function appendRevision(list: PollingSnapshot[], snap: PollingSnapshot): PollingSnapshot[] {
  const prev = list[list.length - 1];
  if (prev && prev.id === snap.id) return list; // unchanged → no new edition (the "append never edit" rule)
  const n = list.length + 1;
  const stamp = new Date(snap.at);
  const labelled = { ...snap, label: `v${n} · ${stamp.toLocaleString()}` };
  return [...list, labelled];
}

/** Diff two snapshots (field-level) via the shared engine. changed/added/removed only when asked. */
export function diffSnapshots(a: PollingSnapshot | null, b: PollingSnapshot | null): KeyChange[] {
  return diffMaps(a?.fields ?? {}, b?.fields ?? {});
}

// ── localStorage persistence (best-effort, per session) ──────────────────────
const KEY = (sessionId: string) => `poll.revisions.${sessionId}`;

export function loadRevisions(sessionId: string): PollingSnapshot[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY(sessionId)) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PollingSnapshot[]) : [];
  } catch { return []; }
}

export function saveRevisions(sessionId: string, list: PollingSnapshot[]): void {
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY(sessionId), JSON.stringify(list));
  } catch { /* storage unavailable (private window / quota) — history stays in-memory this session */ }
}
