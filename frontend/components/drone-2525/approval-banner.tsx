"use client";

// THE QUESTION A MACHINE IS ASKING — the only thing that matters on the screen while it is up.
//
// Lifted out of the round so the round can be read. What it is for has not changed: when a machine wants to
// shoot, this sits directly under the arena, impossible to miss, and NOTHING FIRES while it is open. The
// key group's reading appears beside it as advice; the two buttons are the only things that decide.
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { approvalPrompt, type ShotRequest } from "@/lib/drone-2525/ai-crew";
import { MONO, HUD, btn } from "./ui";

export function ApprovalBanner({ pending, advice, onDecide }: {
  pending: ShotRequest;
  /** What the key group is saying so far, if Shared Intent is on. Advice — never a decision. */
  advice: string | null;
  onDecide: (verdict: "approved" | "held") => void;
}) {
  const { t } = useLexicon();
  return (
    <div data-drone-approval style={{ border: `2px solid ${semanticHex("pending")}`, padding: 12, margin: "10px 0" }}>
      <div style={{ ...MONO, color: semanticHex("pending"), marginBottom: 8, fontSize: "clamp(11px, 3vw, 13px)" }}>
        {approvalPrompt(pending)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button data-drone-approve onClick={() => onDecide("approved")} style={btn({ on: true, hex: semanticHex("tree") })}>
          {t("drone.crew.approve")}
        </button>
        <button data-drone-hold onClick={() => onDecide("held")} style={btn({ on: true, hex: semanticHex("ray") })}>
          {t("drone.crew.hold")}
        </button>
      </div>
      {advice ? (
        <div data-si-advice style={{ ...MONO, color: semanticHex("tagged"), marginTop: 8 }}>
          {t("si.advice")} {advice}
        </div>
      ) : null}
      <div style={{ ...MONO, color: HUD, opacity: 0.6, marginTop: 6 }}>{t("drone.crew.gate_note")}</div>
    </div>
  );
}
