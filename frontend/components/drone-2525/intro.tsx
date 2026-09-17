"use client";

/**
 * DRONE-2525 · INTRO — the r.066 on-ramp, in our React + t() + 13-colour idiom.
 * ============================================================================
 * A stranger on a phone should understand, in ~60 s, WHY this game teams a pilot with a targeteer and how
 * to play it. The operator's r.066 deck answers that with a cinematic (the CIN, eleven beats, his own voice)
 * and three selection screens (CITY → CRAFT → RANGE) that end on BEGIN REHEARSAL. This is that on-ramp,
 * rebuilt on the VECTOR LAW: black ground, edge strokes, every word a t() key so all 33 languages read it.
 *
 * It teaches, it does not gate: BEGIN hands the shell a craft and a range; the shell applies them within
 * whatever the guided ladder has unlocked (a first-timer still lands on the turret at CH0). SKIP jumps
 * straight to the selection. The whole overlay is dark by construction — the ground rule, no flash.
 */
import { useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { VECTOR_LAW } from "@/lib/wire-core/vector-law";
import { chName } from "@/lib/drone-2525/challenge";
import { CRAFT_IDS, type CraftId, type BeginChoice } from "@/lib/drone-2525/guided-start";
import { btn } from "./ui";

/** The eleven CIN beats, as lexicon keys — the story the cinematic tells, one tap at a time. */
export const CIN_KEYS = Array.from({ length: 11 }, (_, i) => `drone.cin.${i}`);
/** Cities: only the Capital plays now; the others are on the record, dated (the maps registry). */
const CITIES = [
  { id: "capital", here: true },
  { id: "austin", here: false },
  { id: "atlantis", here: false },
] as const;
/** The four rungs the on-ramp offers, in the operator's SELECT RANGE. */
const RANGES = [0, 1, 3, 5] as const;

type Phase = "cin" | "city" | "craft" | "range";

export function DroneIntro({ onBegin, onSkip }: { onBegin: (c: BeginChoice) => void; onSkip: () => void }) {
  const { t } = useLexicon();
  const [phase, setPhase] = useState<Phase>("cin");
  const [beat, setBeat] = useState(0);
  const [craft, setCraft] = useState<CraftId>("turret");
  const [challenge, setChallenge] = useState<number>(0);

  // Defined above return() so the `<` here is not in the JSX body the i18n gate scans for stray text.
  const advanceCin = () => (beat + 1 >= CIN_KEYS.length ? setPhase("city") : setBeat(beat + 1));
  const mount = semanticHex("mount");
  const door = semanticHex("door");
  const hud = semanticHex("hud");
  const dim = { color: hud, opacity: 0.6 };

  const shell: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 50, background: VECTOR_LAW.ground, color: hud,
    fontFamily: "ui-monospace, monospace", display: "flex", flexDirection: "column",
    padding: "max(20px, env(safe-area-inset-top)) 16px 20px", overflowY: "auto",
  };
  const heading: React.CSSProperties = { fontSize: 12, letterSpacing: "0.2em", color: mount, marginBottom: 14 };
  const optRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 };

  return (
    <div data-drone-intro={phase} style={shell}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, letterSpacing: "0.18em", color: mount }}>DRONE · 2525</span>
        <button data-drone-intro-skip onClick={onSkip} style={{ ...btn({ hex: hud }), marginLeft: "auto" }}>
          {t("drone.intro.skip")}
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 640, margin: "0 auto", width: "100%" }}>
        {phase === "cin" && (
          <div data-drone-cin={beat}>
            <div style={{ ...dim, fontSize: 10, letterSpacing: "0.16em" }}>{beat + 1} / {CIN_KEYS.length}</div>
            <p style={{ fontSize: "clamp(16px, 4.6vw, 22px)", lineHeight: 1.5, color: hud, textWrap: "balance", minHeight: "4.5em" }}>
              {t(CIN_KEYS[beat])}
            </p>
            <div style={optRow}>
              <button data-drone-cin-next onClick={advanceCin}
                      style={btn({ on: true, hex: door })}>
                {t("drone.intro.continue")}
              </button>
            </div>
          </div>
        )}

        {phase === "city" && (
          <div>
            <div style={heading}>{t("drone.intro.city")}</div>
            <div style={optRow}>
              {CITIES.map((c) => (
                <button key={c.id} data-drone-city={c.id} disabled={!c.here}
                        onClick={() => c.here && setPhase("craft")}
                        style={{ ...btn({ on: c.here, hex: door, enabled: c.here }), opacity: c.here ? 1 : 0.45 }}>
                  {t(`drone.city.${c.id}`)}
                </button>
              ))}
            </div>
            <p style={{ ...dim, fontSize: 11, marginTop: 12 }}>{t("drone.intro.loop")}</p>
          </div>
        )}

        {phase === "craft" && (
          <div>
            <div style={heading}>{t("drone.intro.craft")}</div>
            <div style={optRow}>
              {CRAFT_IDS.map((id) => (
                <button key={id} data-drone-craft={id} onClick={() => { setCraft(id); setPhase("range"); }}
                        style={btn({ on: craft === id, hex: door })}>
                  {t(`drone.craft.${id}`)}
                </button>
              ))}
            </div>
            <p style={{ ...dim, fontSize: 11, marginTop: 12 }}>{t("drone.intro.loop")}</p>
          </div>
        )}

        {phase === "range" && (
          <div>
            <div style={heading}>{t("drone.intro.range")}</div>
            <div style={optRow}>
              {RANGES.map((r) => (
                <button key={r} data-drone-range={r} onClick={() => setChallenge(r)}
                        style={btn({ on: challenge === r, hex: door })}>
                  {`CH${r} ${chName(r)}`}
                </button>
              ))}
            </div>
            <div style={{ ...optRow, marginTop: 20 }}>
              <button data-drone-begin onClick={() => onBegin({ craft, challenge })}
                      style={{ ...btn({ on: true, hex: mount }), fontSize: 14, padding: "10px 18px" }}>
                {t("drone.intro.begin")}
              </button>
            </div>
            <p style={{ ...dim, fontSize: 11, marginTop: 12 }}>{t("drone.intro.loop")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
