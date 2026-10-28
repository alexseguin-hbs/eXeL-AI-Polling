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
import type { FormId } from "@/lib/architect-sim-environment";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", measure: "#9fb3c8", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", ground: "#070b12" };
const ELEMENT_COLOR: Record<ElementName, string> = {
  Foundation: "#9ca3af", Framing: "#c084fc", Roofing: "#f59e0b", Plumbing: "#19c8cf", Electrical: "#ffd400", HVAC: "#22c55e",
};

function StepRow({ step, color }: { step: InstructionStep; color: string }) {
  return (
    <div className="flex gap-1.5 py-0.5">
      <span className="flex-shrink-0 rounded px-1 text-[9px] font-bold" style={{ background: C.ground, color, minWidth: 14, textAlign: "center" }}>{step.n}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold" style={{ color: C.text }}>{step.title} <span className="font-normal" style={{ color }}>· {step.crewDays} crew-day{step.crewDays === 1 ? "" : "s"} labor</span></div>
        <div className="text-[10px] leading-snug" style={{ color: C.measure }}>{step.measure}</div>
        {step.codeFlag && <div className="text-[9px]" style={{ color: C.amber }}>⚑ verify local code · {step.codeFlag}</div>}
      </div>
    </div>
  );
}

/** The six-phase build plan for one form + option (used inside each simulate card). */
export function BuildInstructionsPanel({ formId, option }: { formId: FormId; option: BuildOption }) {
  const bi = buildInstructions(formId, option);
  return (
    <div data-arch-build-instructions={formId} className="rounded border p-1.5" style={{ borderColor: C.border, background: C.ground }}>
      <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>
        <span>Build instructions · by phase</span>
        <span style={{ color: C.cyan }}>{bi.totalCrewDays} crew-days labor · ~{bi.weeks} crew-wk</span>
      </div>
      <div className="space-y-1">
        {bi.phases.map((ph) => (
          <div key={ph.element} className="rounded border px-1.5 py-1" style={{ borderColor: "#0f1724" }}>
            <div className="flex items-center justify-between text-[9px] font-bold">
              <span style={{ color: ELEMENT_COLOR[ph.element] }}>{ph.label}</span>
              <span style={{ color: C.dim }}>{ph.crewDays} cd</span>
            </div>
            <div className="mt-0.5">
              {ph.steps.map((s) => <StepRow key={s.n} step={s} color={ELEMENT_COLOR[ph.element]} />)}
            </div>
          </div>
        ))}
      </div>
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
        <span className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>BUILD INSTRUCTIONS · PROJECT TIMELINE — 4 WAYS</span>
        <span className="text-[9px]" style={{ color: C.dim }}>· hands-on LABOR crew-days per phase (4-person crew; not calendar time) · tap a path for the measured steps</span>
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
                <span style={{ color: C.cyan }}>{p.totalCrewDays} crew-days labor · ~{p.weeks} crew-wk</span>
              </div>
              {/* stacked crew-day bar */}
              <div className="mt-0.5 flex h-3 w-full overflow-hidden rounded-sm" style={{ background: C.ground, width: `${Math.max(20, (p.totalCrewDays / maxCd) * 100)}%` }}>
                {p.perPhase.map((ph) => (
                  <span key={ph.element} title={`${ph.element} · ${ph.crewDays} cd`} style={{ background: ELEMENT_COLOR[ph.element], width: `${(ph.crewDays / p.totalCrewDays) * 100}%`, opacity: 0.9 }} />
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
      <div className="mt-1.5 text-[9px]" style={{ color: C.amber }}>⚠ Planning estimate — these are hands-on LABOR crew-days (rules of thumb at a 4-person crew), NOT calendar time. The 3D-printed shell is the fewest crew-days (printing is machine time — the crew sets up and finishes); the hex-panel shell assembles dry in about the same few days. A tiny home is shortest overall because it is the smallest; MEP + finish dominate the rest. Calendar time (with the 28-day slab cure + inspections) is the months shown on each card's "Time to build".</div>
    </div>
  );
}
