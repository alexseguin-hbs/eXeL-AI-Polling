"use client";

// THE CREW — two people, two devices, one aircraft.
//
// Operator 2026-09-15: "Ensure 2x people on drone has one on control as PILOT and another on phone or PC on
// gimbal as Targeteer." What this panel is for is the handover: taking a seat, sending the other one to the
// second person's own device, and then saying plainly whether they are actually there.
//
// It never hides the state of the link. A crew that thinks it is connected and is not is worse than a crew
// that knows it is alone, so the line says which, the three paths are shown, and a device holding both
// seats is told it is holding both seats rather than being allowed to believe it has a partner.
import { useCallback, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { SEATS, otherSeat, type Seat } from "@/lib/drone-2525/link";
import { inviteCode } from "@/lib/drone-2525/si-pod";
import { MONO, HUD, btn, heading, prose, quiet } from "./ui";
import { QrBlock } from "./qr-block";


export function CrewSeatPanel({ mySeat, setMySeat, code, setCode, line, up, paths, urlFor }: {
  mySeat: Seat | null;
  setMySeat: (s: Seat | null) => void;
  code: string;
  setCode: (c: string) => void;
  line: string;
  up: boolean;
  paths: { channel: boolean; cloud: boolean; storage: boolean };
  urlFor: (seat: Seat) => string;
}) {
  const { t } = useLexicon();
  const [showQr, setShowQr] = useState(false);

  const start = useCallback((seat: Seat) => {
    // The repository already owns this: one generator, one alphabet, and seeded so a replay repeats.
    setCode(code || inviteCode(`crew:${seat}:${SEATS.length}`));
    setMySeat(seat);
    setShowQr(true);
  }, [code, setCode, setMySeat]);

  const leave = useCallback(() => { setMySeat(null); setShowQr(false); }, [setMySeat]);


  return (
    <section data-drone-crew-panel style={{ padding: "0 14px 18px", maxWidth: 900 }}>
      <div style={{ ...MONO, color: semanticHex("mount"), marginBottom: 6 }}>{t("crew.title")}</div>

      {!mySeat ? (
        <>
          <p style={{ ...MONO, color: HUD, opacity: 0.65, lineHeight: 1.7, margin: "0 0 8px", maxWidth: "62ch" }}>
            {t("crew.lead")}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SEATS.map((s) => (
              <button key={s} data-crew-take={s} onClick={() => start(s)} style={btn({ hex: semanticHex(s === "pilot" ? "mount" : "frustum") })}>
                {t(`crew.take.${s}`)}
              </button>
            ))}
          </div>
          <p style={{ ...MONO, color: HUD, opacity: 0.45, marginTop: 8 }}>{t("crew.solo")}</p>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <span data-crew-seat style={{ ...MONO, color: semanticHex(mySeat === "pilot" ? "mount" : "frustum"), fontSize: "clamp(11px, 3vw, 14px)" }}>
              {t(`crew.you_are.${mySeat}`)}
            </span>
            <span data-crew-code style={{ ...MONO, color: semanticHex("tagged"), letterSpacing: "0.3em", fontSize: "clamp(12px, 3.4vw, 16px)" }}>{code}</span>
            <span data-crew-link style={{ ...MONO, color: up ? semanticHex("tree") : semanticHex("pending") }}>{line}</span>
            <button data-crew-leave onClick={leave} style={btn({ hex: semanticHex("contour") })}>{t("crew.leave")}</button>
          </div>

          <div style={{ ...MONO, color: HUD, opacity: 0.6, marginBottom: 8, maxWidth: "62ch", lineHeight: 1.7 }}>
            {mySeat === "pilot" ? t("crew.pilot_does") : t("crew.targeteer_does")}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <span style={{ ...MONO, color: HUD, opacity: 0.6 }}>{t("crew.send_other")} {t(`crew.seat.${otherSeat(mySeat)}`)}</span>
            <button data-crew-qr onClick={() => setShowQr((v) => !v)} style={btn({ on: showQr, hex: semanticHex("door") })}>
              {showQr ? t("crew.hide") : t("crew.show")}
            </button>
            <button data-crew-copy onClick={() => { void navigator.clipboard?.writeText(urlFor(otherSeat(mySeat))); }}
                    style={btn({ hex: semanticHex("contour") })}>{t("crew.copy")}</button>
          </div>

          {showQr ? <QrBlock url={urlFor(otherSeat(mySeat))} size={156} /> : null}

          {/* Three paths carry every word. Which ones are live is shown, not assumed. */}
          <div data-crew-paths style={{ ...MONO, color: HUD, opacity: 0.5 }}>
            {t("crew.paths")} {paths.cloud ? t("crew.path.cloud") : `${t("crew.path.cloud")} ✕`} ·
            {" "}{paths.channel ? t("crew.path.tab") : `${t("crew.path.tab")} ✕`} ·
            {" "}{paths.storage ? t("crew.path.store") : `${t("crew.path.store")} ✕`}
          </div>
          {!up ? <div style={{ ...MONO, color: semanticHex("pending"), marginTop: 6 }}>{t("crew.waiting")}</div> : null}
        </>
      )}
    </section>
  );
}
