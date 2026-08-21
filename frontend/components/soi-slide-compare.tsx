"use client";

// Vision • 2525 — SoI-2525 slide-version compare.
// Drops into the SoI-2525 page (or any host) with the slide's version history as a prop.
// Pick any two versions; each field's change reads side by side — removed in red, added in
// green — by the SAME engine the living document and the CRS matrix use. Self-contained:
// no store access, no side effects, so it cannot disturb the host page.

import { useMemo, useState } from "react";
import type { SlideVersion, SlideFieldValue } from "@/lib/innovation-data";
import { diffMaps, diffText, sideBySide } from "@/lib/version-diff";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Flatten any SlideFieldValue to readable text so it can be word-diffed.
function fieldToText(v: SlideFieldValue | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((row) => (Array.isArray(row) ? row.join(" · ") : String(row))).join("\n");
  return Object.entries(v)
    .map(([k, val]) => `${k}: ${val}`)
    .join("\n");
}

// A version's fields flattened to key -> effective text (hi unless the field is AI-mode).
function versionMap(v: SlideVersion): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, cell] of Object.entries(v.fields || {})) {
    const mode = (cell as { mode?: "hi" | "ai" }).mode;
    out[key] = fieldToText(mode === "ai" ? cell.ai : cell.hi);
  }
  return out;
}

const label = (v: SlideVersion) => `${v.ts?.slice(0, 10) || "—"} · ${v.status || "draft"}${v.by ? " · " + v.by : ""}`;

export function SoiSlideCompare({ versions }: { versions: SlideVersion[] }) {
  const ordered = useMemo(() => [...versions].sort((a, b) => (a.ts || "").localeCompare(b.ts || "")), [versions]);
  const [aIdx, setAIdx] = useState(0);
  const [bIdx, setBIdx] = useState(Math.max(0, ordered.length - 1));

  if (ordered.length < 2)
    return <p className="text-xs italic text-zinc-500">This slide has fewer than two saved versions — nothing to compare yet.</p>;

  const a = ordered[Math.min(aIdx, ordered.length - 1)];
  const b = ordered[Math.min(bIdx, ordered.length - 1)];
  const changed = diffMaps(versionMap(a), versionMap(b)).filter((c) => c.kind !== "carried");
  const finKeys = ["nreK", "revM", "marginM", "npvM"] as const;
  const finChanged = finKeys.filter((k) => a.fin?.[k] !== b.fin?.[k]);

  return (
    <div className="rounded border border-zinc-800 text-xs">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2">
        <span className="font-semibold text-cyan-300">Compare slide versions</span>
        <label className="flex items-center gap-1">
          Baseline
          <select value={aIdx} onChange={(e) => setAIdx(+e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1">
            {ordered.map((v, i) => (
              <option key={v.id} value={i}>
                {label(v)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          Target
          <select value={bIdx} onChange={(e) => setBIdx(+e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1">
            {ordered.map((v, i) => (
              <option key={v.id} value={i}>
                {label(v)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {a.id === b.id ? (
        <p className="px-3 py-3 italic text-zinc-500">Baseline and Target are the same version — pick two different versions.</p>
      ) : (
        <div className="px-3 py-2">
          <p className="mb-2 text-zinc-400">
            {changed.length} field{changed.length === 1 ? "" : "s"} changed
            {finChanged.length ? ` · ${finChanged.length} financial metric${finChanged.length === 1 ? "" : "s"} moved` : ""}
          </p>
          {finChanged.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {finChanged.map((k) => (
                <span key={k} className="rounded border border-amber-600/50 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                  {k}: {String(a.fin?.[k] ?? "—")} → {String(b.fin?.[k] ?? "—")}
                </span>
              ))}
            </div>
          )}
          {changed.length === 0 && finChanged.length === 0 ? (
            <p className="italic text-zinc-500">No differences between these two versions.</p>
          ) : (
            <div className="space-y-2">
              {changed.map((c) => {
                const sb = sideBySide(diffText(c.from, c.to), esc);
                return (
                  <div key={c.key} className="rounded border border-zinc-800">
                    <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/40 px-2 py-1">
                      <span className="font-mono text-zinc-300">{c.key}</span>
                      <span className={"rounded px-1.5 py-0.5 " + (c.kind === "added" ? "bg-emerald-500/20 text-emerald-300" : c.kind === "removed" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300")}>
                        {c.kind}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 px-2 py-2 sm:grid-cols-2">
                      <p className="leading-relaxed text-zinc-300 [&_del]:rounded [&_del]:bg-red-500/20 [&_del]:px-0.5 [&_del]:text-red-300 [&_del]:line-through" dangerouslySetInnerHTML={{ __html: sb ? sb.left : esc(c.from) || "&mdash;" }} />
                      <p className="leading-relaxed text-zinc-300 [&_ins]:rounded [&_ins]:bg-emerald-500/20 [&_ins]:px-0.5 [&_ins]:text-emerald-300 [&_ins]:no-underline" dangerouslySetInnerHTML={{ __html: sb ? sb.right : esc(c.to) || "&mdash;" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
