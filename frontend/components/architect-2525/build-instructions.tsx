"use client";

/**
 * ARCHITECT-2525 · SIMULATE — BUILD INSTRUCTIONS (operator 2026-10-28). Two surfaces a builder / architect / foreman uses
 * to instruct a local team (friends, family, paid help — Vision-2525):
 *   • BuildInstructionsPanel — the SIX build phases for one form + option, each a step card with the key MEASUREMENT,
 *     a crew-day chip, and a "verify local code" flag. Updates live with the card's method / material / frame / roof.
 *   • BuildTimelineCompare   — the project TIMELINE across the four build paths the operator named (Cube 3×3 · Tiny Home ·
 *     Eco-Sphere hex-panel · Eco-Sphere 3D-print cement): crew-days per phase as a stacked bar + total weeks, side by side.
 * Pure presentation over the gated data model (lib/architect-build-instructions.ts). Honest: everything is a PLANNING
 * ESTIMATE; the measurements are rules of thumb and each carries where its buildable value really comes from.
 */
import { useState } from "react";
import { buildInstructions, compareTimeline, BUILD_ORDER, type InstructionStep } from "@/lib/architect-build-instructions";
import type { BuildOption, ElementName } from "@/lib/architect-sim-options";
import { modelById, DEFAULT_COST, costBreakdown, type CostParams } from "@/lib/architect-sim-options";
import { buildSchedule } from "@/lib/architect-stage-plan";
import { projectVendorSavings } from "@/lib/architect-vendors";
import { loadBearing, headerFor } from "@/lib/architect-load-bearing";
import { laborHoursFor, proLaborRateFor } from "@/lib/architect-sim-options";
import { deriveM, recognitionU, settlementComparison, LOCAL_WAGES } from "@/lib/architect-labor";
import type { FormId } from "@/lib/architect-sim-environment";
import { rainbow } from "@/lib/architect-rainbow";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", measure: "#9fb3c8", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", ground: "#070b12" };
// RED → VIOLET across the build order (operator 2026-11-01: "color order of visuals should be RED—> Violet · pick 6 colors
// where red is first and violet is last"). Foundation = red … HVAC = violet, from the one rainbow() source.
const _RB = rainbow(BUILD_ORDER.length);
const ELEMENT_COLOR = Object.fromEntries(BUILD_ORDER.map((el, i) => [el, _RB[i]])) as Record<ElementName, string>;

function StepRow({ step, color }: { step: InstructionStep; color: string }) {
  // R-TO1 (operator 2026-11-01): each step is a modular take-off — bullet the Equipment, sub-bullet its Dimensions,
  // and count out the Number / Length — so an H.I. reader knows exactly what to buy and how much.
  return (
    <div className="flex gap-1.5 py-0.5">
      <span className="flex-shrink-0 rounded px-1 text-[9px] font-bold" style={{ background: C.ground, color, minWidth: 14, textAlign: "center" }}>{step.n}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold" style={{ color: C.text }}>{step.title} <span className="font-normal" style={{ color }}>· {step.crewDays} crew-day{step.crewDays === 1 ? "" : "s"} of work</span></div>
        <ul className="mt-0.5 space-y-0.5">
          {step.items.map((it, i) => (
            <li key={i} className="text-[10px] leading-snug">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0" style={{ color: C.text }}>• {it.equipment}</span>
                <span className="flex-shrink-0 font-semibold tabular-nums" style={{ color }}>{it.count}</span>
              </div>
              <div className="pl-2" style={{ color: C.dim }}>↳ {it.dimensions}</div>
            </li>
          ))}
        </ul>
        {step.codeFlag && <div className="mt-0.5 text-[9px]" style={{ color: C.amber }}>⚑ verify local code · {step.codeFlag}</div>}
      </div>
    </div>
  );
}

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** The STAGED SCHEDULE for one form + option — what is built each phase, IN BUILD ORDER, with its cost, its calendar
 *  days, and how far ahead its modules must be ordered so everything is staged before building (operator 2026-11-01:
 *  "all work and modules are staged before building with set timeline and schedule per phase"). ONE truth: the per-phase
 *  cost reconciles EXACTLY to the card headline (lib/architect-stage-plan). */
export function BuildSchedulePanel({ formId, option, cost = DEFAULT_COST }: { formId: FormId; option: BuildOption; cost?: CostParams }) {
  const m = modelById(formId);
  if (!m) return null;
  const S = buildSchedule(m, option, cost);
  const vs = projectVendorSavings(costBreakdown(m, option, cost).total.material);
  const color = (el: string) => (el in ELEMENT_COLOR ? ELEMENT_COLOR[el as ElementName] : C.cyan);
  return (
    <div data-arch-build-schedule={formId} className="mt-1 rounded border p-1.5" style={{ borderColor: C.border, background: C.ground }}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-1 text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>
        <span>Build schedule · staged per phase</span>
        <span style={{ color: C.cyan }}>{S.totalWeeks} weeks · {usd(S.totalCost)}</span>
      </div>
      <div className="space-y-0.5">
        {S.phases.map((p) => (
          <div key={p.order} data-arch-sched-phase={p.element} className="flex items-baseline gap-1.5 text-[10px]">
            <span className="flex-shrink-0 rounded px-1 text-[9px] font-bold" style={{ background: C.panel, color: color(p.element), minWidth: 14, textAlign: "center" }}>{p.order}</span>
            <span className="min-w-0 flex-1 truncate" style={{ color: C.text }}>{p.label} <span style={{ color: C.dim }}>· {p.moduleCount} module{p.moduleCount === 1 ? "" : "s"}</span></span>
            <span className="flex-shrink-0 tabular-nums" style={{ color: C.dim }}>{p.calDays}d</span>
            <span className="flex-shrink-0 tabular-nums font-semibold" style={{ color: color(p.element) }}>{usd(p.cost)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 text-[9px] leading-snug" style={{ color: C.dim }}>
        Order materials <span style={{ color: C.gold }}>{S.leadInDays} days</span> before ground-break so every module is staged before its phase. Longest phase: <span style={{ color: C.text }}>{S.criticalPhase}</span>. Every dollar here adds up to the {usd(S.totalCost)} estimate.
      </div>
      <div data-arch-vendor-sourcing className="mt-1 text-[9px] leading-snug" style={{ color: C.dim }}>
        <span className="font-bold" style={{ color: C.cyan }}>3-vendor sourcing</span> · the {usd(vs.materialUsd)} material budget is the average of 3 quotes per item. Buying each at the lowest of three could save <span style={{ color: C.green }}>≈ {usd(vs.savingsUsd)} ({vs.savingsPct}%)</span>. <span style={{ color: "#4b5a6e" }}>Planning figure — enter real quotes to lock it.</span>
      </div>
    </div>
  );
}

const COMPARE_JDS = ["US-AUSTIN", "NG", "MX", "CO", "BR"];
const JD_LABEL: Record<string, string> = { "US-AUSTIN": "Austin, US", NG: "Nigeria", MX: "Mexico", CO: "Colombia", BR: "Brazil" };

/** §14 ASSEMBLY COMPARE (the FINAL 웃 / labor / project-cost contract) — TIME · 웃 RECOGNITION · LOCAL SETTLEMENT · PROJECT
 *  COST side by side so they never impersonate one another. THE FIREWALL: switching the comparison region changes ONLY the
 *  settlement reference — the project labor cost (from the project region's rate) never moves. All from lib/architect-labor. */
export function LaborRecognitionPanel({ formId, option }: { formId: FormId; option: BuildOption }) {
  const m = modelById(formId);
  const [jd, setJd] = useState<string>("NG");
  if (!m) return null;
  const totalHours = laborHoursFor(m, option);
  const carpHours = Math.round(totalHours * 0.4);         // modeled: ~40% of hands-on hours are carpentry
  const M = deriveM("carpenter");
  const u = M ? recognitionU(carpHours, M.M) : null;
  const projRate = Math.round(proLaborRateFor(m, option)); // the PROJECT region's labor basis ($/hr · REFERENCE)
  const projLabor = Math.round(carpHours * projRate);
  const cmp = M ? settlementComparison(carpHours, M, [jd])[0] : null;
  return (
    <div data-arch-labor-compare className="mt-1 rounded border p-1.5 text-[9px] leading-snug" style={{ borderColor: C.border, background: C.ground, color: C.dim }}>
      <div className="mb-1 text-[8px] uppercase tracking-wider" style={{ color: C.violet }}>Recognition vs project cost — they never swap</div>
      <div>⏱ Time · <span style={{ color: C.text }}>{carpHours} h</span> carpentry (≈40% of hands-on hours)</div>
      {M && <div>♡ Recognition · <span style={{ color: C.gold }}>{u} 웃</span> <span style={{ color: "#4b5a6e" }}>(trade value {M.M}× minimum wage · {M.statistic} ${M.usRefRateUsdHr}/hr ÷ ${M.usMinWageUsdHr})</span></div>}
      <div>🏗 Project labor · <span style={{ color: C.text }}>{usd(projLabor)}</span> at {usd(projRate)}/hr · project region · REFERENCE</div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <span>🌍 Settlement reference:</span>
        {COMPARE_JDS.map((id) => (
          <button key={id} data-arch-settle={id} onClick={() => setJd(id)} className="rounded border px-1" style={{ borderColor: id === jd ? C.cyan : C.border, color: id === jd ? C.cyan : C.dim }}>{JD_LABEL[id]}</button>
        ))}
      </div>
      {cmp && <div>Same <span style={{ color: C.gold }}>{u} 웃</span> settles locally at <span style={{ color: C.text }}>{cmp.native_currency} {cmp.localSettlementNative?.toLocaleString("en-US")}</span>{cmp.usdInformational != null ? ` (≈ ${usd(cmp.usdInformational)} informational)` : ""}.</div>}
      <div className="mt-1" style={{ color: "#4b5a6e" }}>Switch the region — only the settlement reference moves. The {usd(projLabor)} project cost holds (recognition is global, settlement is local, project cost stays project cost).</div>
    </div>
  );
}

/** The six-phase build plan for one form + option (used inside each simulate card). */
export function BuildInstructionsPanel({ formId, option }: { formId: FormId; option: BuildOption }) {
  const bi = buildInstructions(formId, option);
  const mdl = modelById(formId);
  // R-LOAD1 — the load-bearing screen for the stud wall (operator 2026-11-01: "load bearing calcs must also be done in
  // structural/framing elements"). A 2×6 gravity check + the header for a 6-ft opening, shown in the Framing phase.
  const lb = mdl ? loadBearing(mdl, "2x6", 1) : null;
  const hdr = headerFor(6);
  return (
    <div data-arch-build-instructions={formId} className="rounded border p-1.5" style={{ borderColor: C.border, background: C.ground }}>
      <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>
        <span>Build steps · by phase</span>
        <span style={{ color: C.cyan }}>{bi.totalCrewDays} crew-days of work · about {bi.weeks} week{bi.weeks === 1 ? "" : "s"}</span>
      </div>
      <div className="space-y-1">
        {bi.phases.map((ph) => (
          <div key={ph.element} className="rounded border px-1.5 py-1" style={{ borderColor: "#0f1724" }}>
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span style={{ color: ELEMENT_COLOR[ph.element] }}>{ph.label}</span>
              <span style={{ color: C.dim }}>{ph.crewDays} day{ph.crewDays === 1 ? "" : "s"}</span>
            </div>
            <div className="mt-0.5">
              {ph.steps.map((s) => <StepRow key={s.n} step={s} color={ELEMENT_COLOR[ph.element]} />)}
            </div>
            {ph.element === "Wall System" && lb && (
              <div data-arch-load-bearing className="mt-1 rounded border px-1.5 py-1 text-[9px] leading-snug" style={{ borderColor: "#0f1724", color: C.dim }}>
                <span className="font-bold" style={{ color: ELEMENT_COLOR["Wall System"] }}>Framing load-bearing check (2×6 stud @ 16″ o.c.)</span>
                <div>Each stud carries ≈ <span style={{ color: C.text }}>{usd(lb.demandLb).replace("$", "")} lb</span> (roof {usd(lb.roofLoadLb).replace("$", "")} + wall {usd(lb.wallLoadLb).replace("$", "")}); it can hold {usd(lb.capacityLb).replace("$", "")} lb — <span style={{ color: lb.pass ? C.green : C.amber }}>{lb.pass ? `holds, ${lb.marginPct}% to spare` : "needs a bigger member"}</span> (demand ÷ capacity {lb.dcr}).</div>
                <div>Over a {hdr.spanFt}-ft opening use a <span style={{ color: C.text }}>{hdr.header}</span> header.</div>
                <div style={{ color: "#4b5a6e" }}>Screening check · {lb.source} · {hdr.source} — a licensed engineer + your local code sign the final design.</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <BuildSchedulePanel formId={formId} option={option} />
      <LaborRecognitionPanel formId={formId} option={option} />
      <div className="mt-1 text-[8px] leading-snug" style={{ color: C.dim }}>{bi.note}</div>
    </div>
  );
}

/** The project-timeline comparison across the four build paths (always visible — the operator's headline compare). */
export function BuildTimelineCompare() {
  const paths = compareTimeline();
  const [openId, setOpenId] = useState<string | null>(null);
  const maxCd = Math.max(1, ...paths.map((p) => p.totalCrewDays));
  return (
    <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }} data-arch-build-timeline>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>HOW MUCH WORK TO BUILD · FOUR WAYS</span>
        <span className="text-[9px]" style={{ color: C.dim }}>· hands-on work for a 4-person crew — not calendar time · tap a way for the steps</span>
      </div>
      {/* phase legend */}
      <div className="mb-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[8px]">
        {BUILD_ORDER.map((el) => (
          <span key={el}><span style={{ color: ELEMENT_COLOR[el] }}>■</span> <span style={{ color: C.dim }}>{el}</span></span>
        ))}
      </div>
      <div className="space-y-1.5">
        {paths.map((p) => (
          <div key={p.id}>
            <button onClick={() => setOpenId(openId === p.id ? null : p.id)} className="w-full text-left" data-arch-timeline-path={p.id}>
              <div className="flex items-center justify-between text-[10px]">
                <span style={{ color: C.text, fontWeight: 600 }}>{openId === p.id ? "▾ " : "▸ "}{p.label}</span>
                <span style={{ color: C.cyan }}>{p.totalCrewDays} crew-days of work · about {p.weeks} week{p.weeks === 1 ? "" : "s"}</span>
              </div>
              {/* stacked crew-day bar */}
              <div className="mt-0.5 flex h-3 w-full overflow-hidden rounded-sm" style={{ background: C.ground, width: `${Math.max(20, (p.totalCrewDays / maxCd) * 100)}%` }}>
                {p.perPhase.map((ph) => (
                  <span key={ph.element} title={`${ph.element} · ${ph.crewDays} crew-days`} style={{ background: ELEMENT_COLOR[ph.element], width: `${(ph.crewDays / p.totalCrewDays) * 100}%`, opacity: 0.9 }} />
                ))}
              </div>
            </button>
            {openId === p.id && (
              <div className="mt-1 pl-2">
                <BuildInstructionsPanel formId={p.formId as FormId} option={p.option} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 text-[9px]" style={{ color: C.amber }}>⚠ A planning estimate — this is hands-on work for a 4-person crew, not calendar time. The 3D-printed shell needs the fewest days (the machine prints the walls; the crew sets up and finishes), and the hex-panel shell goes together dry in about the same. A tiny home is shortest because it is the smallest; wiring, plumbing and finish take most of the rest. The real calendar time — including the 28-day concrete cure and inspections — is the &quot;Time to build&quot; months on each card.</div>
    </div>
  );
}
