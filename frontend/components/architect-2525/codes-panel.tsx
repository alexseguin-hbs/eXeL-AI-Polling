"use client";

/**
 * ARCHITECT-2525 · CODES / APPROVALS PANEL — B2 bottom expandable (V4).
 * =================================================================================================
 * Multi-select the building standards to design to (USA/IRC · Texas · Tiny-Home Appendix Q ·
 * Sustainable). One or more may be chosen; each shows its headline requirements + citation. Data is
 * bundled-static (lib/building-codes.ts) per the Vision-2525 no-runtime-fetch rule. Choice persists
 * (arch2525.codes + snapshot + Replay). A planning aid, not a permit — verify with the local AHJ.
 */
import { Check, ShieldCheck } from "lucide-react";
import { STANDARDS, requirementsFor, CODES_DISCLAIMER, type StandardScope } from "@/lib/building-codes";
import { type LayerState } from "./use-layer-state";

const C = { border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e", gold: "#ffd400" };
const SCOPE_COLOR: Record<StandardScope, string> = { usa: C.cyan, texas: C.gold, tiny: C.green, sustainable: C.violet };

export function CodesPanel({ state }: { state?: LayerState }) {
  const chosen = state?.codes ?? new Set<string>();
  const reqs = requirementsFor(Array.from(chosen));
  return (
    <div data-arch-codes className="flex flex-col gap-2 text-[10px]">
      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
        <ShieldCheck className="h-3 w-3" /> Design to standards <span style={{ color: C.dim }}>· choose one or more</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {STANDARDS.map((s) => {
          const on = chosen.has(s.id); const col = SCOPE_COLOR[s.scope];
          return (
            <button key={s.id} data-code-toggle={s.id} onClick={() => state?.toggleCode(s.id)}
              className="flex items-center gap-1 rounded border px-2 py-1 text-[9px] font-semibold hover:bg-white/5"
              style={{ borderColor: on ? col : C.border, color: on ? col : C.dim, background: on ? "#0c1420" : "transparent" }}>
              {on && <Check className="h-3 w-3" />} {s.name}
            </button>
          );
        })}
      </div>
      {reqs.length === 0 ? (
        <div className="text-[9px]" style={{ color: C.dim }}>No standard selected — pick a jurisdiction/standard to see its headline requirements.</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {reqs.map((s) => {
            const col = SCOPE_COLOR[s.scope];
            return (
              <div key={s.id} data-code-detail={s.id} className="rounded border p-1.5" style={{ borderColor: C.border }}>
                <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-wider" style={{ color: col }}>
                  <span>{s.name}</span><span className="normal-case" style={{ color: C.dim }}>{s.authority}</span>
                </div>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {s.requirements.map((r, i) => <li key={i} className="flex gap-1 text-[9px]" style={{ color: C.text }}><span style={{ color: col }}>•</span><span>{r}</span></li>)}
                </ul>
                <div className="mt-1 text-[8px]" style={{ color: C.dim }}>Source: {s.citation}</div>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-[8px] leading-relaxed" style={{ color: C.gold }}>⚠ {CODES_DISCLAIMER}</div>
    </div>
  );
}
