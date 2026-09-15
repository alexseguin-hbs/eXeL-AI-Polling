"use client";

// WHAT JUST HAPPENED, WHO IS IN WHICH SEAT, AND THE ROUND'S OWN WORKING.
//
// The three things a person reads after acting, lifted out of the round so the round reads as a round.
// Nothing here decides anything: it is the record, and the record is what makes a score arguable
// afterwards rather than something the screen asserts.
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { shotNeedsApproval, type Crew, type ApprovalState } from "@/lib/drone-2525/ai-crew";
import { score, transcript, type GameState } from "@/lib/drone-2525/game";
import { MONO, HUD } from "./ui";

export function RoundStatus({ note, crew, approval, game, tMs, roundMs }: {
  note: string;
  crew: Crew;
  approval: ApprovalState;
  game: GameState;
  tMs: number;
  roundMs: number;
}) {
  const { t } = useLexicon();
  const s = score(game);
  const who = (w: "HI" | "AI") => (w === "HI" ? t("drone.crew.person") : t("drone.crew.machine"));
  return (
    <>
      {/* Never a silent press: whatever happened last is here, in words. */}
      <div style={{ ...MONO, color: HUD, opacity: 0.8, minHeight: 18 }} data-drone-note>{note}</div>

      <div data-drone-crewline style={{ ...MONO, color: semanticHex("pending"), opacity: 0.85, marginTop: 4 }}>
        {t("drone.crew.seats")} {who(crew.pilot)} {t("drone.crew.flies")} · {who(crew.targeteer)} {t("drone.crew.aims")}
        {shotNeedsApproval(crew) ? ` · ${t("drone.crew.gate_on")}` : ""}
        {approval.decisions.length ? ` · ${approval.approved} ${t("drone.crew.approved")}, ${approval.held} ${t("drone.crew.held")}` : ""}
      </div>

      <div style={{ ...MONO, color: HUD, opacity: 0.5, marginTop: 4 }}>
        {t("drone.game.accuracy")} {(s.accuracy * 100).toFixed(0)}% · {t("drone.game.clock")} {(tMs / 1000).toFixed(0)}s / {(roundMs / 1000).toFixed(0)}s
      </div>

      {/* The score showing its working — one line per thing that happened, refusals included. */}
      {game.events.length > 1 ? (
        <details style={{ marginTop: 10 }}>
          <summary style={{ ...MONO, color: HUD, opacity: 0.7, cursor: "pointer" }}>{t("drone.game.log")}</summary>
          <pre style={{ ...MONO, color: HUD, opacity: 0.65, whiteSpace: "pre-wrap", margin: "6px 0 0" }}>
            {transcript(game).slice(-12).join("\n")}
          </pre>
        </details>
      ) : null}
    </>
  );
}
