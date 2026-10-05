"use client";

/** FITNESS-2525 · Command UX 1 — AI COACH panel (Worker /api/ai task=draft). */
import type { CSSProperties } from "react";
import { C } from "./ux-helpers";
import { Panel } from "./ux-widgets";

export function CoachPanel({
  coachDraft, setCoachDraft, coachBusy, coachErr, aiReady, runCoach, saveCoach, inputStyle, btnPrimary, btnGhost,
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
}) {
  return (
    <Panel title="AI COACH · /api/ai draft" accent={C.amber}>
      <>
        <textarea
          value={coachDraft}
          onChange={(e) => setCoachDraft(e.target.value)}
          rows={8}
          placeholder={aiReady ? "AI coach note appears here — edit, then SAVE TO LOG." : "AI not configured on Worker. You can still type a note."}
          style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" style={btnPrimary} disabled={coachBusy} onClick={() => runCoach("both")}>{coachBusy ? "REQUESTING…" : "REQUEST AI"}</button>
          <button type="button" style={btnGhost} onClick={saveCoach} disabled={!coachDraft.trim()}>SAVE TO LOG</button>
        </div>
        {coachErr && <p className="mt-2 text-[10px]" style={{ color: C.red }}>{coachErr}</p>}
      </>
    </Panel>
  );
}
