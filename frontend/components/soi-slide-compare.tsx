"use client";

// Vision • 2525 — SoI-2525 slide-version compare (v.19).
// One diff engine → many artifact types → one replay language. A slide is a versioned
// object; two versions are compared at the FIELD level first, THEN rendered — so the
// shared engine stays authoritative. Change TYPE is surfaced (Text · Visual · Data ·
// Order · Meaning) so a moved slide never reads like a doctrine change, and a changed
// diagram is a first-class "Visual changed" event even when no text moved. Historical on
// the left, current on the right; removed red, added green. Self-contained (props-in).

import { useMemo, useState } from "react";
import type { SlideVersion, SlideFieldValue } from "@/lib/innovation-data";
import { diffMaps, diffText, sideBySide, escHtml, type KeyChange } from "@/lib/version-diff";

const esc = escHtml; // one shared, hardened escaper (was a local duplicate)

type ChangeType = "Text" | "Visual" | "Data" | "Order" | "Meaning";

// Classify a field by its key so visuals/data/order are never flattened to a word diff.
function classify(key: string): ChangeType {
  const k = key.toLowerCase();
  if (/(visual|image|img|chart|diagram|figure|photo|svg|graphic)/.test(k)) return "Visual";
  if (/(data|metric|number|figure\b|fin|rev|npv|cost|estimate|margin|nre|kpi|budget|price|rate)/.test(k)) return "Data";
  if (/(order|position|index|sequence|rank)/.test(k)) return "Order";
  if (/(status|gate|doctrine|meaning|decision|approval|state)/.test(k)) return "Meaning";
  return "Text";
}

const TYPE_STYLE: Record<ChangeType, string> = {
  Text: "bg-cyan-500/15 text-cyan-300 border-cyan-600/40",
  Visual: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-600/40",
  Data: "bg-amber-500/15 text-amber-300 border-amber-600/40",
  Order: "bg-sky-500/15 text-sky-300 border-sky-600/40",
  Meaning: "bg-violet-500/15 text-violet-300 border-violet-600/40",
};

function fieldToText(v: SlideFieldValue | undefined): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((row) => (Array.isArray(row) ? row.join(" · ") : String(row))).join("\n");
  return Object.entries(v).map(([k, val]) => `${k}: ${val}`).join("\n");
}

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
  const [aIdx, setAIdx] = useState(0); // historical (left)
  const [bIdx, setBIdx] = useState(Math.max(0, ordered.length - 1)); // current (right)

  if (ordered.length < 2)
    return <p className="text-xs italic text-zinc-500">This slide has fewer than two saved versions — nothing to compare yet.</p>;

  const a = ordered[Math.min(aIdx, ordered.length - 1)];
  const b = ordered[Math.min(bIdx, ordered.length - 1)];

  // Field-level diff, then classify each change.
  const fieldChanges: (KeyChange & { type: ChangeType })[] = diffMaps(versionMap(a), versionMap(b))
    .filter((c) => c.kind !== "carried")
    .map((c) => ({ ...c, type: classify(c.key) }));

  // Meaning: status / gate transitions are first-class even with no field change (gate-over-gate).
  const meaning: { field: string; from: string; to: string }[] = [];
  if (a.status !== b.status) meaning.push({ field: "status", from: a.status || "draft", to: b.status || "draft" });
  if (a.gate !== b.gate) meaning.push({ field: "gate", from: String(a.gate), to: String(b.gate) });

  // Data: financial snapshot moves are first-class.
  const finKeys = ["nreK", "revM", "marginM", "npvM"] as const;
  const finChanged = finKeys.filter((k) => a.fin?.[k] !== b.fin?.[k]).map((k) => ({ k, from: a.fin?.[k], to: b.fin?.[k] }));

  // Plain computed value (NOT a hook): this runs after the early return above, so it must
  // never be a useMemo — a conditionally-called hook is a rules-of-hooks error that fails the
  // Next build. The work is a tiny array tally, so memoization bought nothing anyway.
  const counts: Record<string, number> = (() => {
    const c: Record<string, number> = {};
    for (const f of fieldChanges) c[f.type] = (c[f.type] || 0) + 1;
    if (finChanged.length) c.Data = (c.Data || 0) + finChanged.length;
    if (meaning.length) c.Meaning = (c.Meaning || 0) + meaning.length;
    return c;
  })();

  const impact = meaning.length ? "Doctrine / gate change" : counts.Visual ? "Visual change" : counts.Data ? "Data change" : counts.Text ? "Content change" : "No change";
  const whatChanged = Object.entries(counts).map(([t, n]) => `${n} ${t.toLowerCase()}`).join(" · ") || "nothing";
  const nothing = fieldChanges.length === 0 && finChanged.length === 0 && meaning.length === 0;

  return (
    <div className="rounded border border-zinc-800 text-xs">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2">
        <span className="font-semibold text-cyan-300">Compare slide versions</span>
        <label className="flex items-center gap-1">
          Historical
          <select value={aIdx} onChange={(e) => setAIdx(+e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1">
            {ordered.map((v, i) => (<option key={v.id} value={i}>{label(v)}</option>))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          Current
          <select value={bIdx} onChange={(e) => setBIdx(+e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1">
            {ordered.map((v, i) => (<option key={v.id} value={i}>{label(v)}</option>))}
          </select>
        </label>
      </div>

      {a.id === b.id ? (
        <p className="px-3 py-3 italic text-zinc-500">Historical and Current are the same version — pick two different versions.</p>
      ) : nothing ? (
        <p className="px-3 py-3 italic text-zinc-500">No differences between these two versions.</p>
      ) : (
        <div className="px-3 py-2">
          {/* impact badge + What changed? line */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={"rounded border px-2 py-0.5 font-medium " + (meaning.length ? TYPE_STYLE.Meaning : counts.Visual ? TYPE_STYLE.Visual : counts.Data ? TYPE_STYLE.Data : TYPE_STYLE.Text)}>{impact}</span>
            <span className="text-zinc-400">What changed? {whatChanged}</span>
          </div>

          {/* Meaning (status/gate) — first-class */}
          {meaning.map((m) => (
            <div key={m.field} className="mb-2 flex flex-wrap items-center gap-2 rounded border border-violet-600/40 bg-violet-500/10 px-2 py-1 text-violet-200">
              <span className="rounded bg-violet-500/20 px-1.5 py-0.5">Meaning</span>
              <span className="font-mono">{m.field}</span>
              <span>{m.from} → {m.to}</span>
            </div>
          ))}

          {/* Data (financial snapshot) — first-class, not word-diffed */}
          {finChanged.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {finChanged.map(({ k, from, to }) => (
                <span key={k} className="rounded border border-amber-600/40 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                  {k}: {String(from ?? "—")} → {String(to ?? "—")}
                </span>
              ))}
            </div>
          )}

          {/* Field changes — visual/data/order as events; text/meaning as word diff */}
          <div className="space-y-2">
            {fieldChanges.map((c) => {
              const wordDiff = c.type === "Text" || c.type === "Meaning";
              const sb = wordDiff ? sideBySide(diffText(c.from, c.to), esc) : null;
              return (
                <div key={c.key} className="rounded border border-zinc-800">
                  <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/40 px-2 py-1">
                    <span className="font-mono text-zinc-300">{c.key}</span>
                    <span className={"rounded border px-1.5 py-0.5 " + TYPE_STYLE[c.type]}>{c.type}</span>
                    <span className={"rounded px-1.5 py-0.5 " + (c.kind === "added" ? "bg-emerald-500/20 text-emerald-300" : c.kind === "removed" ? "bg-red-500/20 text-red-300" : "bg-zinc-700 text-zinc-300")}>{c.kind}</span>
                  </div>
                  {wordDiff ? (
                    <div className="grid grid-cols-1 gap-2 px-2 py-2 sm:grid-cols-2">
                      <p className="leading-relaxed text-zinc-300 [&_del]:rounded [&_del]:bg-red-500/20 [&_del]:px-0.5 [&_del]:text-red-300 [&_del]:line-through" dangerouslySetInnerHTML={{ __html: sb ? sb.left : esc(c.from) || "&mdash;" }} />
                      <p className="leading-relaxed text-zinc-300 [&_ins]:rounded [&_ins]:bg-emerald-500/20 [&_ins]:px-0.5 [&_ins]:text-emerald-300 [&_ins]:no-underline" dangerouslySetInnerHTML={{ __html: sb ? sb.right : esc(c.to) || "&mdash;" }} />
                    </div>
                  ) : (
                    // Visual / Data / Order: a first-class change event, not a text flatten.
                    <div className="px-2 py-2 text-zinc-400">
                      {c.type} changed{c.kind === "added" ? " (added in current)" : c.kind === "removed" ? " (removed from current)" : ""} — open Replay to see this version&rsquo;s {c.type.toLowerCase()} exactly as it was.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
