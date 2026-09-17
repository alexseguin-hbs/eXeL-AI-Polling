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
import { metricsOf, replayHash, feedLine, sidecarOf, type Ledger } from "@/lib/drone-2525/decisions";
import { MONO, HUD, btn } from "./ui";
import { semanticHex as hexOf } from "@/lib/wire-core/palette";

export function RoundStatus({ note, crew, approval, game, tMs, roundMs, ledger, seed }: {
  note: string;
  crew: Crew;
  approval: ApprovalState;
  game: GameState;
  tMs: number;
  roundMs: number;
  /** The decision record — READ here (metrics, replay hash, feed, SAVE), not a write-only sink. */
  ledger: Ledger;
  seed: number;
}) {
  const { t } = useLexicon();
  const s = score(game);
  // THE LEDGER, READ. metricsOf/replayHash/feedLine/sidecarOf were exported and never called (Gate 4, the
  // 48-agent fleet): the round wrote decisions nobody could see. Now the record shows its own working, and
  // SAVE / EXPORT write the sidecar BESIDE the immutable AsM Cup fixture (never over it).
  const m = metricsOf(ledger);
  const save = () => { try { localStorage.setItem(`drone2525.sidecar.${seed}`, JSON.stringify(sidecarOf(ledger, seed))); } catch { /* no storage */ } };
  const exportSidecar = () => {
    try {
      const blob = new Blob([JSON.stringify(sidecarOf(ledger, seed), null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `drone2525-sidecar-${seed}.json`; a.click(); URL.revokeObjectURL(a.href);
    } catch { /* no download */ }
  };
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

      {/* THE RECORD, READ: designations, holds, refusals, handoffs, approvals, and the replay hash the
          same seed must reproduce — the sidecar's own headline, on the glass. */}
      <div data-drone-metrics style={{ ...MONO, color: hexOf("frustum"), opacity: 0.8, marginTop: 6 }}>
        {t("drone.rec.designations")} {m.designations} · {t("drone.rec.holds")} {m.hiHolds} · {t("drone.rec.refusals")} {m.authFailures} · {t("drone.rec.handoffs")} {m.handoffs} · {t("drone.rec.approvals")} {m.approvals} ({m.twoPersonApprovals} {t("drone.rec.two_person")})
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
        <span data-drone-replayhash style={{ ...MONO, color: hexOf("ray"), opacity: 0.75 }}>{t("drone.rec.hash")} {m.replayHash}</span>
        {ledger.events.length ? <span data-drone-feed style={{ ...MONO, color: HUD, opacity: 0.6 }}>{feedLine(ledger.events[ledger.events.length - 1])}</span> : null}
        <button data-drone-save onClick={save} style={btn({ hex: hexOf("tree") })}>{t("drone.rec.save")}</button>
        <button data-drone-export onClick={exportSidecar} style={btn({ hex: hexOf("frustum") })}>{t("drone.rec.export")}</button>
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
