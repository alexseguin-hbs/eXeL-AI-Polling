"use client";

/** FITNESS-2525 · AI COACH — provider picker + per-request cost (Settings-style). Keys stay on the Worker. */
import type { CSSProperties } from "react";
import {
  FIT_COACH_COST_USD, FIT_COACH_MODEL, FIT_PROVIDER_ORDER, formatCoachCost, type AiProvider,
} from "@/lib/fitness-2525/ai";
import { C } from "./ux-helpers";
import { Panel } from "./ux-widgets";

type Have = { openai?: boolean; gemini?: boolean; grok?: boolean; claude?: boolean } | null;

export function CoachPanel({
  coachDraft, setCoachDraft, coachBusy, coachErr, aiReady, runCoach, saveCoach,
  inputStyle, btnPrimary, btnGhost, aiProvider, setAiProvider, haveKeys, lastCost,
}: {
  coachDraft: string;
  setCoachDraft: (s: string) => void;
  coachBusy: boolean;
  coachErr: string;
  aiReady: boolean;
  runCoach: (focus: "workout" | "nutrition" | "both") => void;
  saveCoach: () => void;
  inputStyle: CSSProperties;
  btnPrimary: CSSProperties;
  btnGhost: CSSProperties;
  aiProvider: AiProvider;
  setAiProvider: (p: AiProvider) => void;
  haveKeys: Have;
  lastCost: { provider: string; model: string; costUsd: number | null } | null;
}) {
  const ready = (p: Exclude<AiProvider, "auto">) => !!(haveKeys && haveKeys[p]);
  const estAuto = FIT_PROVIDER_ORDER.filter(ready).map((p) => FIT_COACH_COST_USD[p])[0] ?? null;
  const est = aiProvider === "auto" ? estAuto : FIT_COACH_COST_USD[aiProvider];

  return (
    <Panel title="AI COACH · /api/ai draft" accent={C.amber}>
      <div className="mb-2" data-fit-ai-provider>
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>
          Provider · auto = cheapest configured (flash/mini)
        </div>
        <div className="flex flex-wrap gap-1">
          {(["auto", ...FIT_PROVIDER_ORDER] as AiProvider[]).map((p) => {
            const on = aiProvider === p;
            const ok = p === "auto" ? aiReady : ready(p);
            return (
              <button
                key={p}
                type="button"
                disabled={!ok}
                onClick={() => setAiProvider(p)}
                data-fit-ai-provider-btn={p}
                className="rounded border px-2 py-1 text-[9px] font-semibold uppercase"
                style={{
                  borderColor: on ? C.cyan : C.border,
                  color: on ? C.cyan : ok ? C.text : C.dim,
                  background: on ? "#152238" : "transparent",
                  opacity: ok ? 1 : 0.4,
                }}
                title={p === "auto" ? "Cheapest key present on the Worker" : `${FIT_COACH_MODEL[p]} · est ${formatCoachCost(FIT_COACH_COST_USD[p])}/request`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-2 overflow-hidden rounded border text-[9px]" style={{ borderColor: C.border }} data-fit-ai-cost>
        <div className="grid grid-cols-3 gap-0 border-b px-2 py-1 font-semibold uppercase tracking-wider" style={{ borderColor: C.border, background: "#0b1119", color: C.dim }}>
          <span>Provider</span><span className="text-right">Model</span><span className="text-right">Est / request</span>
        </div>
        {FIT_PROVIDER_ORDER.map((p) => (
          <div key={p} className="grid grid-cols-3 gap-0 border-b px-2 py-1 last:border-b-0" style={{ borderColor: `${C.border}88`, opacity: ready(p) ? 1 : 0.45 }}>
            <span style={{ color: C.text }}>{p}{!ready(p) ? " · no key" : ""}</span>
            <span className="text-right font-mono" style={{ color: C.dim }}>{FIT_COACH_MODEL[p]}</span>
            <span className="text-right font-mono" style={{ color: C.gold }}>{formatCoachCost(FIT_COACH_COST_USD[p])}</span>
          </div>
        ))}
        <div className="px-2 py-1" style={{ background: "#0b1119", color: C.dim }}>
          This request estimate: <span className="font-mono" style={{ color: C.cyan }}>{formatCoachCost(est)}</span>
          {aiProvider === "auto" ? " (auto → cheapest key)" : ""} · keys never leave the Worker
        </div>
        {lastCost && (
          <div className="border-t px-2 py-1 font-mono" style={{ borderColor: C.border, color: C.green }} data-fit-ai-last-cost>
            Last reply: {lastCost.provider}/{lastCost.model || "—"} · {formatCoachCost(lastCost.costUsd)}
          </div>
        )}
      </div>

      <textarea
        value={coachDraft}
        onChange={(e) => setCoachDraft(e.target.value)}
        rows={8}
        placeholder={aiReady ? "AI coach note appears here — edit, then SAVE TO LOG." : "AI not configured on Worker. You can still type a note."}
        style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" style={btnPrimary} disabled={coachBusy || !aiReady} onClick={() => runCoach("both")}>{coachBusy ? "REQUESTING…" : "REQUEST AI"}</button>
        <button type="button" style={btnGhost} onClick={saveCoach} disabled={!coachDraft.trim()}>SAVE TO LOG</button>
      </div>
      {coachErr && <p className="mt-2 text-[10px]" style={{ color: C.red }}>{coachErr}</p>}
    </Panel>
  );
}
