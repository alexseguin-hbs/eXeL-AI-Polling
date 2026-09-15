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
import { QRCodeSVG } from "qrcode.react";
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { SEATS, otherSeat, type Seat } from "@/lib/drone-2525/link";

/** Short, no look-alikes — the same alphabet the rest of this repository uses for a code people type. */
const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const codeFrom = (n: number): string => {
  let h = (n ^ 0x9e3779b9) >>> 0, out = "";
  for (let i = 0; i < 6; i++) { h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; h ^= h >>> 16; out += A[h % A.length]; }
  return out;
};

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
    setCode(code || codeFrom(Date.now()));
    setMySeat(seat);
    setShowQr(true);
  }, [code, setCode, setMySeat]);

  const leave = useCallback(() => { setMySeat(null); setShowQr(false); }, [setMySeat]);

  const mono = { fontFamily: "ui-monospace, monospace", fontSize: "clamp(9px, 2.3vw, 11px)", letterSpacing: "0.05em" };
  const hud = semanticHex("hud");
  const btn = (on: boolean, hex: string) => ({
    background: "transparent", border: `1px solid ${on ? hex : "#2a2a2a"}`, color: on ? hex : "#8a8a8a",
    padding: "6px clamp(9px, 2.4vw, 13px)", ...mono, textTransform: "uppercase" as const,
    cursor: "pointer", borderRadius: 2, minHeight: 34,
  });

  return (
    <section data-drone-crew-panel style={{ padding: "0 14px 18px", maxWidth: 900 }}>
      <div style={{ ...mono, color: semanticHex("mount"), marginBottom: 6 }}>{t("crew.title")}</div>

      {!mySeat ? (
        <>
          <p style={{ ...mono, color: hud, opacity: 0.65, lineHeight: 1.7, margin: "0 0 8px", maxWidth: "62ch" }}>
            {t("crew.lead")}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SEATS.map((s) => (
              <button key={s} data-crew-take={s} onClick={() => start(s)} style={btn(false, semanticHex(s === "pilot" ? "mount" : "frustum"))}>
                {t(`crew.take.${s}`)}
              </button>
            ))}
          </div>
          <p style={{ ...mono, color: hud, opacity: 0.45, marginTop: 8 }}>{t("crew.solo")}</p>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <span data-crew-seat style={{ ...mono, color: semanticHex(mySeat === "pilot" ? "mount" : "frustum"), fontSize: "clamp(11px, 3vw, 14px)" }}>
              {t(`crew.you_are.${mySeat}`)}
            </span>
            <span data-crew-code style={{ ...mono, color: semanticHex("tagged"), letterSpacing: "0.3em", fontSize: "clamp(12px, 3.4vw, 16px)" }}>{code}</span>
            <span data-crew-link style={{ ...mono, color: up ? semanticHex("tree") : semanticHex("pending") }}>{line}</span>
            <button data-crew-leave onClick={leave} style={btn(false, semanticHex("contour"))}>{t("crew.leave")}</button>
          </div>

          <div style={{ ...mono, color: hud, opacity: 0.6, marginBottom: 8, maxWidth: "62ch", lineHeight: 1.7 }}>
            {mySeat === "pilot" ? t("crew.pilot_does") : t("crew.targeteer_does")}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <span style={{ ...mono, color: hud, opacity: 0.6 }}>{t("crew.send_other")} {t(`crew.seat.${otherSeat(mySeat)}`)}</span>
            <button data-crew-qr onClick={() => setShowQr((v) => !v)} style={btn(showQr, semanticHex("door"))}>
              {showQr ? t("crew.hide") : t("crew.show")}
            </button>
            <button data-crew-copy onClick={() => { void navigator.clipboard?.writeText(urlFor(otherSeat(mySeat))); }}
                    style={btn(false, semanticHex("contour"))}>{t("crew.copy")}</button>
          </div>

          {showQr ? (
            <div style={{ marginBottom: 8 }}>
              {/* A scannable code is filled squares by definition; it lives in this panel, never in the arena. */}
              <div style={{ background: "#FFFFFF", padding: 12, display: "inline-block" }}>
                <QRCodeSVG value={urlFor(otherSeat(mySeat))} size={156} level="M" />
              </div>
              <div style={{ ...mono, color: hud, opacity: 0.55, marginTop: 6, wordBreak: "break-all", maxWidth: 420 }}>
                {urlFor(otherSeat(mySeat))}
              </div>
            </div>
          ) : null}

          {/* Three paths carry every word. Which ones are live is shown, not assumed. */}
          <div data-crew-paths style={{ ...mono, color: hud, opacity: 0.5 }}>
            {t("crew.paths")} {paths.cloud ? t("crew.path.cloud") : `${t("crew.path.cloud")} ✕`} ·
            {" "}{paths.channel ? t("crew.path.tab") : `${t("crew.path.tab")} ✕`} ·
            {" "}{paths.storage ? t("crew.path.store") : `${t("crew.path.store")} ✕`}
          </div>
          {!up ? <div style={{ ...mono, color: semanticHex("pending"), marginTop: 6 }}>{t("crew.waiting")}</div> : null}
        </>
      )}
    </section>
  );
}
