"use client";

// Vision • 2525 — SoI-2525 PROJECT CRS Design Traceability Matrix.
// Operator: "PROJECT for SoI-2525 gets CRS AS WELL. I was just providing format for max
// traceability. CRS should capture all changes; this IS R-CORE REPLAY. We need all, not
// just last 3." So every SoI-2525 project carries a traceability row in the SAME Design-
// Matrix format the polling tool uses (User Story · Dev Team · Design Input/Output ·
// Design Review timestamp · V&V · Design Change), each row derived from the project. Edit
// a project's Design Review timestamp, save a version, and EVERY version is kept (append-
// only replay — never capped) so any two can be compared field-by-field, removed in red
// and added in green, by the same version-diff engine the living document uses.
// Versions persist per-viewer in localStorage (never leaves the browser).

import { useEffect, useMemo, useState } from "react";
import { type Project, briefOf, GATE_STAGE, GATE_REVIEW, confidenceOf, type Gate } from "@/lib/innovation-data";
import { diffCollection, diffText, sideBySide, escHtml } from "@/lib/version-diff";

// One traceability row, in the canonical CRS Design-Matrix format.
type CrsRow = {
  crs: string; group: string; userStory: string; devTeam: string;
  inputId: string; specInput: string; marketInput: string;
  outputId: string; outputDef: string; reviewId: string;
  vvPlan: string; change: string; changeDesc: string;
};
type Version = { id: string; label: string; ts: string; rows: CrsRow[] };
const STORE = "v2525.soi.crs.versions";
const esc = escHtml; // one shared, hardened escaper (was a local duplicate)

// The traceability fields shown/compared, in order.
const FIELDS: { k: keyof CrsRow; label: string }[] = [
  { k: "userStory", label: "User Story (value proposition)" },
  { k: "devTeam", label: "Dev Team" },
  { k: "inputId", label: "Design Input #" },
  { k: "specInput", label: "Specification Input (target at launch)" },
  { k: "marketInput", label: "Market Input (Next Best Alternative)" },
  { k: "outputId", label: "Design Output #" },
  { k: "outputDef", label: "Design Output (definable / measurable)" },
  { k: "reviewId", label: "Design Review # (timestamp)" },
  { k: "vvPlan", label: "Verification & Validation Plan (gate)" },
  { k: "change", label: "Design Change" },
  { k: "changeDesc", label: "Design Change Description" },
];

// Derive the canonical CRS row for a project — deterministic, no clock, from project data.
function projectToCrs(p: Project): CrsRow {
  const b = briefOf(p);
  const gate = p.gate as Gate;
  const gr = GATE_REVIEW[gate];
  return {
    crs: p.id,
    group: `SoI-2525 · ${p.lob}`,
    userStory: p.valueProp || p.name,
    devTeam: `${p.manager} · ${p.division}`,
    inputId: `${p.id}.IN`,
    specInput: b.needs.join(" · "),
    marketInput: p.nextBestAlternative || b.solution.join(" · "),
    outputId: `${p.id}.OUT`,
    outputDef: b.outcomes.join(" · "),
    reviewId: `DR-${gate}-${GATE_STAGE[gate]} · conf ${confidenceOf(p)}/5`,
    vvPlan: (gr?.mustHave || []).join(" · ") || `${GATE_STAGE[gate]} gate review`,
    change: "",
    changeDesc: "",
  };
}

function loadVersions(): Version[] {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as Version[];
  } catch {
    /* private mode / blocked storage — fall through to the baseline */
  }
  return [];
}

export function SoiProjectCrs({ projects }: { projects: Project[] }) {
  const baseRows = useMemo(() => projects.map(projectToCrs), [projects]);
  const baseline: Version = useMemo(
    () => ({ id: "base", label: "Original (from the project record)", ts: "—", rows: baseRows }),
    [baseRows],
  );
  const [versions, setVersions] = useState<Version[]>([]);
  const [working, setWorking] = useState<CrsRow[]>(baseRows);
  const [mode, setMode] = useState<"edit" | "compare">("edit");
  const [aId, setAId] = useState("base");
  const [bId, setBId] = useState("base");

  useEffect(() => { setVersions(loadVersions()); }, []);
  // If the project set changes underneath, keep the working copy in step with the baseline.
  useEffect(() => { setWorking(baseRows); }, [baseRows]);

  const allVersions = useMemo(() => [baseline, ...versions], [baseline, versions]);
  const byId = (id: string) => allVersions.find((v) => v.id === id) || baseline;

  function persist(next: Version[]) {
    setVersions(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      /* storage blocked — the edit still lives in memory for this session */
    }
  }

  function saveVersion() {
    const n = versions.length + 1;
    const v: Version = {
      id: "v" + n + "-" + Date.now().toString(36),
      label: "Edited version " + n,
      ts: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
      rows: working.map((r) => ({ ...r })),
    };
    // R-CORE REPLAY: keep the Original baseline + EVERY edited version, append-only.
    // "We need all, not just last 3." No cap — each edit is a replayable point.
    persist([...versions, v]);
    setBId(v.id);
    setAId(versions.length ? versions[versions.length - 1].id : "base");
    setMode("compare");
  }

  function editReview(crs: string, val: string) {
    setWorking((w) => w.map((r) => (r.crs === crs ? { ...r, reviewId: val } : r)));
  }

  const groups = useMemo(() => Array.from(new Set(baseRows.map((r) => r.group))), [baseRows]);

  return (
    <div className="text-zinc-200">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-cyan-300">Project CRS — Design Traceability Matrix</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Every SoI-2525 project as a traceability row in the same Design-Matrix format the polling tool uses.
          Edit a project&rsquo;s Design Review timestamp, save a version, then compare any two: changes read field
          by field, removed in red and added in green, by the same engine that versions the living document.
          <span className="text-zinc-500"> Every version is kept (R-CORE replay) — never just the last few.</span>
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-zinc-700 bg-zinc-900/40 px-3 py-2 text-sm">
        <div className="inline-flex overflow-hidden rounded border border-zinc-700">
          <button onClick={() => setMode("edit")}
            className={"px-3 py-1 " + (mode === "edit" ? "bg-cyan-500/20 text-cyan-200" : "text-zinc-400")}>
            Edit &amp; version
          </button>
          <button onClick={() => setMode("compare")}
            className={"px-3 py-1 " + (mode === "compare" ? "bg-cyan-500/20 text-cyan-200" : "text-zinc-400")}>
            Compare versions
          </button>
        </div>
        {mode === "edit" ? (
          <button onClick={saveVersion} className="rounded border border-cyan-600 px-3 py-1 text-cyan-300 hover:bg-cyan-500/10">
            Save this as a version
          </button>
        ) : (
          <>
            <label className="flex items-center gap-1">
              Before
              <select value={aId} onChange={(e) => setAId(e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1">
                {allVersions.map((v) => (<option key={v.id} value={v.id}>{v.label}</option>))}
              </select>
            </label>
            <label className="flex items-center gap-1">
              After
              <select value={bId} onChange={(e) => setBId(e.target.value)} className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1">
                {allVersions.map((v) => (<option key={v.id} value={v.id}>{v.label}</option>))}
              </select>
            </label>
            <span className="text-xs text-zinc-500">{allVersions.length} version{allVersions.length === 1 ? "" : "s"} kept</span>
          </>
        )}
      </div>

      {mode === "edit" ? (
        <EditView groups={groups} rows={working} onEdit={editReview} />
      ) : (
        <CompareView a={byId(aId)} b={byId(bId)} />
      )}
    </div>
  );
}

function EditView({ groups, rows, onEdit }: { groups: string[]; rows: CrsRow[]; onEdit: (crs: string, v: string) => void }) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group}>
          <h3 className="mb-2 text-sm font-semibold text-zinc-300">{group}</h3>
          <div className="overflow-x-auto rounded border border-zinc-800">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-zinc-900/60 text-zinc-400">
                <tr>
                  <th className="px-2 py-1.5">Project</th>
                  <th className="px-2 py-1.5">User Story (value prop)</th>
                  <th className="px-2 py-1.5">Output #</th>
                  <th className="px-2 py-1.5">Design Review # (timestamp)</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter((r) => r.group === group).map((r) => (
                  <tr key={r.crs} className="border-t border-zinc-800 align-top">
                    <td className="px-2 py-1.5 font-mono text-cyan-300">{r.crs}</td>
                    <td className="px-2 py-1.5 text-zinc-300">{r.userStory}</td>
                    <td className="px-2 py-1.5 font-mono text-zinc-400">{r.outputId}</td>
                    <td className="px-2 py-1.5">
                      <input value={r.reviewId} onChange={(e) => onEdit(r.crs, e.target.value)}
                        className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-zinc-200"
                        aria-label={"Design Review timestamp for " + r.crs} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function CompareView({ a, b }: { a: Version; b: Version }) {
  const rows = diffCollection(a.rows as unknown as Record<string, string>[], b.rows as unknown as Record<string, string>[], "crs");
  const changed = rows.filter((r) => r.kind !== "carried");
  if (a.id === b.id)
    return <p className="text-sm italic text-zinc-500">Before and After are the same version — choose two different versions to see changes.</p>;
  if (!changed.length) return <p className="text-sm italic text-zinc-500">No changes between {a.label} and {b.label}.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        {changed.length} project{changed.length === 1 ? "" : "s"} changed &middot; <span className="text-cyan-300">{a.label}</span> →{" "}
        <span className="text-cyan-300">{b.label}</span>
      </p>
      {changed.map((row) => {
        const from = (row.from || {}) as unknown as CrsRow;
        const to = (row.to || {}) as unknown as CrsRow;
        const fieldRows = FIELDS.map((f) => {
          const ov = (from[f.k] as string) || "";
          const nv = (to[f.k] as string) || "";
          if (ov === nv) return null;
          const sb = sideBySide(diffText(ov, nv), esc);
          return { field: f.label, sb, ov, nv };
        }).filter(Boolean) as { field: string; sb: { left: string; right: string } | null; ov: string; nv: string }[];
        return (
          <div key={row.key} className="rounded border border-zinc-800">
            <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-xs">
              <span className="font-mono text-cyan-300">{row.key}</span>
              <span className={"rounded px-1.5 py-0.5 " + (row.kind === "added" ? "bg-emerald-500/20 text-emerald-300" : row.kind === "removed" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300")}>
                {row.kind}
              </span>
            </div>
            <div className="divide-y divide-zinc-800">
              {fieldRows.map((fr, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 px-3 py-2 text-xs sm:grid-cols-[190px_1fr_1fr]">
                  <div className="text-zinc-500">{fr.field}</div>
                  <div className="min-w-0">
                    <div className="mb-0.5 font-mono text-[10px] text-zinc-600">{a.label}</div>
                    <p className="leading-relaxed text-zinc-300 [&_del]:rounded [&_del]:bg-red-500/20 [&_del]:px-0.5 [&_del]:text-red-300 [&_del]:line-through" dangerouslySetInnerHTML={{ __html: fr.sb ? fr.sb.left : esc(fr.ov) }} />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-0.5 font-mono text-[10px] text-zinc-600">{b.label}</div>
                    <p className="leading-relaxed text-zinc-300 [&_ins]:rounded [&_ins]:bg-emerald-500/20 [&_ins]:px-0.5 [&_ins]:text-emerald-300 [&_ins]:no-underline" dangerouslySetInnerHTML={{ __html: fr.sb ? fr.sb.right : esc(fr.nv) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
