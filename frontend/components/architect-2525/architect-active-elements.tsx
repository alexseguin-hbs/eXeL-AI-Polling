"use client";

/**
 * ARCHITECT-2525 · ACTIVE ELEMENTS — the canonical Space inspector + editor (R-UX2, the truth loop made visible).
 * =================================================================================================
 * Mirrors Security-2525 Mission-Planning's ItemInspector (the operator's look/feel standard). The RIGHT rail
 * of the Design workspace. Select a canonical Space → it reads its canonical truth (entity_id, function, wet,
 * width/depth, area, revision), offers N/E/S/W ±1 ft + function/wet edits → AI PROPOSED IMPACT (interior
 * conserves / exterior changes net area; BLOCKED when a dimension would fall below the minimum) → ACCEPT (one
 * canonical revision, plan_state stays REVIEWABLE) / HOLD / REJECT. The R-CORE · SPIRAL · SYNC · REVERSE line
 * reads the REAL canonical verification returns — never a hardcoded PASS/SYNC (advisory §5 / §XVIII / §XIX).
 * ACCEPT is never plan approval; REVERSE is a pure verification (it reconstructs R0's hash, it does not undo).
 */
import { useMemo } from "react";
import { Boxes, ArrowUp, ArrowDown } from "lucide-react";
import { ftFromUm, sqftFromUm2, areaUm2 } from "@/lib/architect-2525/canonical/units";
import { SPACE_FUNCTIONS, WET_CLASSES } from "@/lib/architect-2525/canonical/types";
import type { Edge, EditProposal } from "@/lib/architect-2525/canonical/runtime-edit";
import type { CanonicalDesign } from "./use-canonical-design";

const C = { border: "#1e2b3a", panel: "#111826", panel2: "#0c1420", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", red: "#ef4444", amber: "#f59e0b" };
const titleCase = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
const EDGES: Edge[] = ["NORTH", "EAST", "SOUTH", "WEST"];

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 text-[10px]">
      <span style={{ color: C.dim }}>{label}</span>
      <span className={mono ? "truncate font-mono text-[9px]" : "truncate"} style={{ color: C.text }} title={value}>{value}</span>
    </div>
  );
}

export function ArchitectActiveElements({ design }: { design: CanonicalDesign }) {
  const s = design.selectedSpace;
  const preview = design.preview;
  const proposed = (preview && preview.status !== "CLEARED" ? preview.proposed_change : null) as EditProposal | null;
  const canAccept = !!preview && preview.status === "PROPOSED" && !design.blocked;
  const wF = s ? ftFromUm(s.width_um) : 0;
  const dF = s ? ftFromUm(s.depth_um) : 0;
  const areaFt2 = s ? sqftFromUm2(areaUm2(s.width_um, s.depth_um)) : 0;
  const hash8 = useMemo(() => design.currentHash.slice(0, 8), [design.currentHash]);

  const Pill = ({ label, color }: { label: string; color: string }) => (
    <span className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider" style={{ color, background: C.panel2 }}>{label}</span>
  );

  return (
    <div data-arch-active-elements data-testid="active-elements" className="flex flex-col gap-2">
      {/* CANONICAL header — this rail edits canonical project truth (vs. the future illustrative Sandbox). */}
      <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: C.cyan, color: C.cyan }}>
        <Boxes className="h-3 w-3" /> Canonical · Active Elements
      </div>

      {!s ? (
        <div className="rounded-lg border p-3 text-[10px] leading-relaxed" style={{ borderColor: C.border, color: C.dim }}>
          Select a Space in the Vision Tree or on the glass to inspect its canonical truth and propose an edit.
        </div>
      ) : (
        <>
          {/* SELECTED CANONICAL SPACE (§11-A) — prominent authority label, then the canonical detail. */}
          <div data-arch-canonical-space className="rounded-lg border" style={{ borderColor: C.border, background: C.panel }}>
            <div className="flex flex-wrap items-center gap-1.5 border-b px-2 py-1.5" style={{ borderColor: C.border }}>
              <span className="text-[10px] font-bold tracking-wider" style={{ color: C.cyan }}>CANONICAL SPACE</span>
              <span className="text-[11px] font-bold" style={{ color: C.text }}>{s.bay_code} · {titleCase(s.function)}</span>
              <Pill label={design.project.plan_state} color={C.gold} />
              <Pill label={`${s.evidence.authority_state} · ${s.evidence.validity}`} color={C.dim} />
            </div>
            <div className="px-2 py-1">
              <Row label="Entity" value={s.entity_id} mono />
              <Row label="Function" value={titleCase(s.function)} />
              <Row label="Wet class" value={s.wet_class} />
              <Row label="Width × Depth" value={`${wF} × ${dF} ft`} />
              <Row label="Area" value={`${areaFt2} ft²`} />
              <Row label="Revision" value={s.revision_id} />
            </div>
          </div>

          {/* EDIT — N/E/S/W ±1 ft + function / wet. Each proposes an AI impact; nothing commits until ACCEPT. */}
          <div className="rounded-lg border" style={{ borderColor: C.border, background: C.panel }}>
            <div className="border-b px-2 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: C.border, color: C.violet }}>Propose an edit</div>
            <div className="p-2">
              <div className="grid grid-cols-2 gap-1">
                {EDGES.map((edge) => (
                  <div key={edge} className="flex items-center justify-between gap-1 rounded border px-1.5 py-1 text-[10px]" style={{ borderColor: C.border }}>
                    <span style={{ color: C.dim }}>{edge[0]}{edge.slice(1).toLowerCase()}</span>
                    <span className="flex items-center gap-1">
                      <button data-arch-edge={`${edge}-shrink`} onClick={() => design.proposeEdge(edge, -1)} title={`${titleCase(edge)} −1 ft`} className="rounded border px-1.5" style={{ borderColor: C.border, color: C.text }}><ArrowDown className="h-2.5 w-2.5" /></button>
                      <button data-arch-edge={`${edge}-expand`} onClick={() => design.proposeEdge(edge, 1)} title={`${titleCase(edge)} +1 ft`} className="rounded border px-1.5" style={{ borderColor: C.border, color: C.text }}><ArrowUp className="h-2.5 w-2.5" /></button>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                <span style={{ color: C.dim }}>Function</span>
                <select data-arch-fn value={s.function} onChange={(e) => design.proposeFunction(e.target.value as typeof s.function)}
                  className="rounded border bg-transparent px-1 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>
                  {SPACE_FUNCTIONS.map((f) => <option key={f} value={f} style={{ background: C.panel2 }}>{titleCase(f)}</option>)}
                </select>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
                <span style={{ color: C.dim }}>Wet class</span>
                <select data-arch-wet value={s.wet_class} onChange={(e) => design.proposeWet(e.target.value as typeof s.wet_class)}
                  className="rounded border bg-transparent px-1 py-0.5 text-[10px]" style={{ borderColor: C.border, color: C.text }}>
                  {WET_CLASSES.map((w) => <option key={w} value={w} style={{ background: C.panel2 }}>{w}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* AI PROPOSED IMPACT — the consequence BEFORE any commit; BLOCKED reason in red (ACCEPT disabled). */}
          <div data-arch-impact data-testid="impact-preview" className="rounded-lg border" style={{ borderColor: proposed ? C.cyan : C.border, background: C.panel }}>
            <div className="flex items-center gap-1.5 border-b px-2 py-1 text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: C.border, color: C.cyan }}>
              AI Proposed Impact
              {preview?.status === "HELD" && <Pill label="HELD" color={C.amber} />}
            </div>
            <div className="px-2 py-1.5 text-[10px]">
              {design.blocked ? (
                <div data-arch-blocked style={{ color: C.red }}>{design.blocked}</div>
              ) : proposed ? (
                <>
                  {design.impact && (
                    <>
                      <Row label="Edit type" value={proposed.kind === "edge" ? (design.impact.interior ? "Interior edge (shared)" : "Exterior edge") : "Attribute"} />
                      {proposed.kind === "edge" && <Row label="Net program area" value={design.impact.areaDeltaSqft === 0 ? "UNCHANGED (conserved)" : `${design.impact.areaDeltaSqft > 0 ? "+" : ""}${design.impact.areaDeltaSqft} ft²`} />}
                    </>
                  )}
                  {proposed.kind === "attr" && <Row label="Change" value={proposed.function !== undefined ? `Function → ${titleCase(String(proposed.function))}` : `Wet → ${String(proposed.wet_class)}`} />}
                  <div className="mt-0.5 text-[9px]" style={{ color: C.dim }}>Nothing is committed yet — ACCEPT writes one canonical revision; HOLD keeps it; REJECT clears it.</div>
                </>
              ) : (
                <div style={{ color: C.dim }}>Propose an edge or attribute change to preview its consequence.</div>
              )}
            </div>
            <div className="flex gap-1 border-t p-1.5" style={{ borderColor: C.border }}>
              <button data-arch-accept data-testid="accept-proposal" disabled={!canAccept} onClick={design.accept}
                className="flex-1 rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: canAccept ? C.green : C.border, color: canAccept ? C.green : C.dim, opacity: canAccept ? 1 : 0.5 }}>ACCEPT</button>
              <button data-arch-hold data-testid="hold-proposal" disabled={!proposed} onClick={design.hold}
                className="flex-1 rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: proposed ? C.amber : C.border, color: proposed ? C.amber : C.dim, opacity: proposed ? 1 : 0.5 }}>HOLD</button>
              <button data-arch-reject data-testid="reject-proposal" disabled={!proposed} onClick={design.reject}
                className="flex-1 rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: proposed ? C.red : C.border, color: proposed ? C.red : C.dim, opacity: proposed ? 1 : 0.5 }}>REJECT</button>
            </div>
          </div>
        </>
      )}

      {/* R-CORE readout — the REAL verification state (never hardcoded). REVERSE is a pure verification. */}
      <div data-arch-rcore-readout className="rounded-lg border px-2 py-1.5 text-[10px]" style={{ borderColor: C.border, background: C.panel2 }}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span style={{ color: C.dim }}>R-CORE <span style={{ color: C.cyan }}>{design.head}</span></span>
          <span style={{ color: C.dim }}>SPIRAL <span style={{ color: design.spiralState === "PASS" ? C.green : design.spiralState === "FAIL" ? C.red : C.dim }}>{design.spiralState}</span></span>
          <span style={{ color: C.dim }}>SYNC <span style={{ color: design.sync === "SYNCED" ? C.green : C.amber }}>{design.sync}</span></span>
          {design.reverseInfo
            ? <span style={{ color: C.dim }}>REVERSE → <span style={{ color: C.cyan }}>{design.reverseInfo.parentRevision}</span> <span className="font-mono text-[9px]">#{design.reverseInfo.parentHash.slice(0, 8)}</span> <span style={{ color: C.green }}>verified</span></span>
            : <span style={{ color: C.dim }}>REVERSE <span style={{ color: C.dim }}>—</span></span>}
          <span style={{ color: C.dim }}>hash <span className="font-mono text-[9px]" style={{ color: C.text }}>#{hash8}</span></span>
        </div>
      </div>
    </div>
  );
}
