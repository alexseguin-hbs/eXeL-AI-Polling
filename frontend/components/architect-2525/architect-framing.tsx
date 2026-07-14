"use client";

/**
 * ARCHITECT-2525 · FRAMING PLAN (Build → Framing) — draws every member placement (2×4 studs, plates, joists,
 * rafters, LVL/steel beams) for a rectangular structure, with per-placement time + cost, an ordered build
 * sequence (a printable instruction sheet), and a 24/7 humanoid-robotics scenario (repetitive placements run
 * around the clock → days saved). Powered by lib/architect-framing (pure). The granular tier under the
 * WorkSection estimate engine: a homeowner sees exactly where the labour is and where robots can supplement.
 */
import { useMemo, useState } from "react";
import { generateFraming, fmtHrs, fmtUsd, type MemberType } from "@/lib/architect-framing";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b" };
const TYPE_COLOR: Record<MemberType, string> = { stud: "#c084fc", plate: "#19c8cf", topplate: "#19c8cf", joist: "#22c55e", rafter: "#f59e0b", header: "#ef4444", beam: "#ffd400", column: "#94a3b8" };

export function ArchitectFraming() {
  const [W, setW] = useState(24);
  const [L, setL] = useState(40);
  const [H, setH] = useState(9);
  const [spacing, setSpacing] = useState(16);
  const [crew, setCrew] = useState(4);
  const plan = useMemo(() => generateFraming({ widthFt: W, lengthFt: L, heightFt: H, studSpacingIn: spacing, crew, laborRate: 55 }), [W, L, H, spacing, crew]);
  const r = plan.rollup;

  // plan drawing scale (W horizontal · L vertical) into a 200×150 viewBox
  const PW = 200, PH = 150, pad = 16;
  const sc = Math.min((PW - pad * 2) / W, (PH - pad * 2) / L);
  const ox = (PW - W * sc) / 2, oy = (PH - L * sc) / 2;
  const joistYs = Array.from({ length: Math.floor((L * 12) / spacing) + 1 }, (_, i) => Math.min(L, (i * spacing) / 12));
  const studN = Math.floor((L * 12) / spacing) + 1, studNW = Math.floor((W * 12) / spacing) + 1;

  return (
    <div data-arch-framing className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>FRAMING PLAN · MEMBER-BY-MEMBER BUILD SEQUENCE</span>
        <div className="flex flex-wrap items-center gap-2 text-[9px]" style={{ color: C.dim }}>
          {([["W ft", W, setW, 8, 60], ["L ft", L, setL, 8, 80], ["H ft", H, setH, 8, 14], ["OC in", spacing, setSpacing, 12, 24], ["Crew", crew, setCrew, 1, 12]] as const).map(([lab, val, set, mn, mx]) => (
            <label key={lab} className="flex items-center gap-1">{lab}
              <input type="number" min={mn} max={mx} value={val} onChange={(e) => set(Math.max(mn, Math.min(mx, +e.target.value || mn)))} data-framing-input={lab} className="w-12 rounded border bg-transparent px-1 text-right" style={{ borderColor: C.border, color: C.text }} />
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        {/* PLAN DRAWING — footprint · floor joists · perimeter studs · ridge beam · columns */}
        <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
          <svg data-framing-plan viewBox="0 0 200 150" className="w-full rounded" style={{ background: "#0a0f16", aspectRatio: "4 / 3" }}>
            {/* floor joists (span W) */}
            {joistYs.map((y, i) => <line key={`j${i}`} x1={ox} y1={oy + y * sc} x2={ox + W * sc} y2={oy + y * sc} stroke={TYPE_COLOR.joist} strokeWidth="0.4" opacity="0.55" />)}
            {/* ridge beam down the length */}
            <line x1={ox + (W * sc) / 2} y1={oy} x2={ox + (W * sc) / 2} y2={oy + L * sc} stroke={TYPE_COLOR.beam} strokeWidth="1" strokeDasharray="2 1.4" />
            {/* footprint / plates */}
            <rect x={ox} y={oy} width={W * sc} height={L * sc} fill="none" stroke={TYPE_COLOR.plate} strokeWidth="1" />
            {/* perimeter studs as ticks (front/back = studN along W edges; left/right = studNW along L edges) */}
            {Array.from({ length: studNW }, (_, i) => Math.min(W, (i * spacing) / 12)).map((x, i) => (
              <g key={`sx${i}`}><line x1={ox + x * sc} y1={oy} x2={ox + x * sc} y2={oy + 2.2} stroke={TYPE_COLOR.stud} strokeWidth="0.5" /><line x1={ox + x * sc} y1={oy + L * sc - 2.2} x2={ox + x * sc} y2={oy + L * sc} stroke={TYPE_COLOR.stud} strokeWidth="0.5" /></g>
            ))}
            {Array.from({ length: studN }, (_, i) => Math.min(L, (i * spacing) / 12)).map((y, i) => (
              <g key={`sy${i}`}><line x1={ox} y1={oy + y * sc} x2={ox + 2.2} y2={oy + y * sc} stroke={TYPE_COLOR.stud} strokeWidth="0.5" /><line x1={ox + W * sc - 2.2} y1={oy + y * sc} x2={ox + W * sc} y2={oy + y * sc} stroke={TYPE_COLOR.stud} strokeWidth="0.5" /></g>
            ))}
            {/* steel columns carrying the ridge */}
            <circle cx={ox + (W * sc) / 2} cy={oy + 4} r="1.6" fill={TYPE_COLOR.column} /><circle cx={ox + (W * sc) / 2} cy={oy + L * sc - 4} r="1.6" fill={TYPE_COLOR.column} />
            <text x={ox} y={oy - 4} fontSize="5" fill={C.dim} style={{ fontFamily: "monospace" }}>{W}′ × {L}′ · {spacing}″ OC</text>
          </svg>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[8px]" style={{ fontFamily: "monospace" }}>
            {(Object.keys(TYPE_COLOR) as MemberType[]).map((t) => <span key={t} style={{ color: TYPE_COLOR[t] }}>▪ {t}</span>)}
          </div>
        </div>

        {/* ROLLUP + ROBOTICS SCENARIO */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {([["Members", String(r.count), C.cyan], ["Install time", fmtHrs(r.totalMin), C.gold], ["Total cost", fmtUsd(r.totalCostUsd), C.green], ["Crew days", `${r.crewDays} d`, C.text]] as const).map(([lab, val, col]) => (
              <div key={lab} className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
                <div className="text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>{lab}</div>
                <div data-framing-stat={lab} className="text-[13px] font-bold tabular-nums" style={{ color: col }}>{val}</div>
              </div>
            ))}
          </div>
          <div data-framing-robotics className="rounded-lg border p-2" style={{ borderColor: C.violet, background: "#180f24" }}>
            <div className="text-[9px] font-bold tracking-wider" style={{ color: C.violet }}>🤖 HUMANOID ROBOTICS · 24/7</div>
            <div className="mt-1 text-[10px]" style={{ color: C.text }}>
              <span style={{ color: C.green }}>{r.autoPct}%</span> of placements ({r.autoCount}/{r.count}) are repetitive → robot-suitable.
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1 text-center text-[9px]">
              <div><div style={{ color: C.dim }}>Crew (8h)</div><div className="font-bold" style={{ color: C.text }}>{r.crewDays} d</div></div>
              <div><div style={{ color: C.dim }}>+Robots 24/7</div><div className="font-bold" style={{ color: C.cyan }}>{r.robotDays} d</div></div>
              <div><div style={{ color: C.dim }}>Saved</div><div className="font-bold" style={{ color: C.green }}>{r.daysSaved} d</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE BUILD SEQUENCE — ordered phases, each member with time + cost + robot flag */}
      <div className="rounded-lg border" style={{ borderColor: C.border, background: C.panel }}>
        <div className="flex items-center justify-between border-b px-3 py-1.5" style={{ borderColor: C.border }}>
          <span className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>BUILD SEQUENCE · PRINTABLE INSTRUCTIONS</span>
          <span className="text-[8px]" style={{ color: C.dim }}>🤖 = robot-automatable placement</span>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto p-3">
          {plan.sequence.map((step, si) => (
            <div key={step.phase} data-framing-step>
              <div className="flex items-center justify-between text-[10px] font-bold" style={{ color: C.cyan }}>
                <span>{si + 1}. {step.phase} <span style={{ color: C.dim }}>· {step.members.length} pcs</span></span>
                <span className="tabular-nums" style={{ color: C.dim }}>{fmtHrs(step.min)} · {fmtUsd(step.cost)} · {step.automatable}/{step.members.length} 🤖</span>
              </div>
              <div className="mt-0.5 grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                {step.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-[8.5px]" style={{ fontFamily: "monospace" }}>
                    <span style={{ color: TYPE_COLOR[m.type] }}>{m.automatable ? "🤖" : "·"} {m.label}</span>
                    <span className="tabular-nums" style={{ color: C.dim }}>{m.lengthFt}′ · {m.placeMin}m · {fmtUsd(m.costUsd)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
