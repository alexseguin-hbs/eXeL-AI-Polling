"use client";

// THE DECK ON THE GLASS — r.050's operator deck as a component: twin labelled sticks, the turn / climb
// buttons the R stick used to carry, the T1 T2 T3 slot cluster, the voice toggle, the stick settings
// (L SENS · R SENS · DEAD · trims · ZERO · SET FROM STICK · RESET SETS) and a keyboard map that prints on
// one page. It owns no game state: every press calls back into the round, and every axis writes the same
// refs the flight loop and the controls hook already read.
//
// Extracted from round.tsx, which had grown to 658 lines against this repository's 300-line rule.
import { useRef, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { KEY_TO_ACTION } from "@/lib/2525-core/controls";
import { applySets, setSets, setFromStick, zeroTrims, resetSets, setsLine, DEFAULT_SETS, type StickSets } from "@/lib/2525-core/stick-sets";
import { SLOT_NS, type Slots, type SlotN } from "@/lib/drone-2525/slots";
import { MONO, btn } from "./ui";
import { Stick, HoldButton } from "./stick";

export interface DeckVoice { supported: boolean; listening: boolean; toggle: () => void; heard: string }

/** "KeyW" → "W", "ArrowUp" → "↑", "Digit1" → "1". Symbols, not words — nothing here needs translating. */
export const keyGlyph = (code: string): string =>
  code.replace(/^Key/, "").replace(/^Digit/, "").replace("ArrowUp", "↑").replace("ArrowDown", "↓").replace("ArrowLeft", "←").replace("ArrowRight", "→");

export function ControlDeck({ humanPilot, iAim, stick, headStick, sets, slots, doorLabel, onSlot, voice }: {
  humanPilot: boolean;
  iAim: boolean;
  stick: React.MutableRefObject<{ fwd: number; lat: number; climb: number; yaw: number }>;
  headStick: React.MutableRefObject<{ x: number; y: number }>;
  sets: StickSets;
  slots: Slots;
  doorLabel: (id: string) => string;
  onSlot: (n: SlotN) => void;
  voice: DeckVoice;
}) {
  const { t } = useLexicon();
  // The last RAW reading of each stick, for SET FROM STICK: the trim is the negative of where the thumb rests.
  const rawL = useRef({ x: 0, y: 0 }), rawR = useRef({ x: 0, y: 0 });
  const [open, setOpen] = useState<"none" | "sets" | "keys">("none");
  const mount = semanticHex("mount"), frustum = semanticHex("frustum"), hud = semanticHex("hud");
  const label = { ...MONO, color: mount, opacity: 0.8, fontSize: 10, letterSpacing: "0.08em", gridColumn: "1 / -1", textAlign: "center" as const };
  const step = (k: "l" | "r" | "dead", d: number) => setSets({ [k]: Math.round(((sets[k] ?? DEFAULT_SETS[k]) + d) * 100) / 100 });
  const keys = Object.entries(KEY_TO_ACTION).filter(([code]) => !code.startsWith("Numpad"));

  return (
    <div data-drone-deck style={{ display: "flex", flexDirection: "column", gap: 8, margin: "8px 0" }}>
      {/* THE STICKS: L is the BODY, R is the HEAD. The body stick and the turn / climb buttons exist only
          for a person in the pilot's seat; the head stick for whoever aims — one centred look-stick in the
          turret modes (r.048). Every reading passes through the saved calibration. */}
      {humanPilot || iAim ? (
        <div data-drone-sticks data-drone-sticks-layout={humanPilot ? "crew" : "look"}
             style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: humanPilot ? "flex-start" : "center" }}>
          {humanPilot ? (
            <Stick label={t("drone.fly.body")} hex={mount}
                   onMove={(x, y) => { rawL.current = { x, y }; const v = applySets({ x, y }, "L", sets); stick.current.lat = v.x; stick.current.fwd = -v.y; }} />
          ) : null}
          {humanPilot ? (
            <div data-drone-yaw-climb style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, alignItems: "center" }}>
              <HoldButton id="yaw.left" label="◄" hex={mount} onHold={(d) => { stick.current.yaw = d ? -1 : 0; }} />
              <HoldButton id="yaw.right" label="►" hex={mount} onHold={(d) => { stick.current.yaw = d ? 1 : 0; }} />
              <div style={label}>{t("drone.fly.yaw")}</div>
              <HoldButton id="climb.up" label="▲" hex={mount} onHold={(d) => { stick.current.climb = d ? 1 : 0; }} />
              <HoldButton id="climb.down" label="▼" hex={mount} onHold={(d) => { stick.current.climb = d ? -1 : 0; }} />
              <div style={label}>{t("drone.fly.climb")}</div>
            </div>
          ) : null}
          {iAim ? (
            <Stick label={t("drone.fly.head")} hex={frustum}
                   onMove={(x, y) => { rawR.current = { x, y }; headStick.current = applySets({ x, y }, "R", sets); }} />
          ) : null}
          {humanPilot ? (
            <div style={{ ...MONO, color: hud, opacity: 0.6, alignSelf: "center", maxWidth: 260, lineHeight: 1.6 }}>{t("drone.fly.help")}</div>
          ) : null}
        </div>
      ) : null}

      {/* T1 T2 T3 and VOICE — the face cluster. A slot button reads its box's colour: amber, red, or empty. */}
      {iAim ? (
        <div data-drone-face style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ ...MONO, color: hud, opacity: 0.7 }}>{t("drone.deck.slots")}</span>
          {SLOT_NS.map((n) => {
            const d = slots.s[n];
            const hex = semanticHex(d ? (d.phase === "red" ? "ray" : "pending") : "hud");
            return (
              <button key={n} data-drone-slot-btn={n} onClick={() => onSlot(n)} style={btn({ on: slots.current === n, hex })}
                      title={d ? doorLabel(d.doorId) : t("drone.deck.slot_empty")}>
                T{n}{d ? ` · ${doorLabel(d.doorId)}` : ""}
              </button>
            );
          })}
          <button data-drone-voice onClick={voice.toggle} disabled={!voice.supported}
                  style={btn({ on: voice.listening, hex: semanticHex("tree"), enabled: voice.supported })}>
            {voice.listening ? t("drone.deck.voice_on") : t("drone.deck.voice_off")}
          </button>
          <span data-drone-heard style={{ ...MONO, color: hud, opacity: 0.7 }}>
            {voice.supported ? (voice.heard ? `${t("drone.deck.heard")}: ${voice.heard}` : t("drone.deck.voice_help")) : t("drone.deck.no_mic")}
          </span>
        </div>
      ) : null}
      {iAim ? <div style={{ ...MONO, color: hud, opacity: 0.6, lineHeight: 1.6 }}>{t("drone.deck.tap_help")}</div> : null}

      {/* SETTINGS and the KEYBOARD MAP fold away; the deck itself never does (keep CONTROLS unburied). */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button data-drone-deck-sets onClick={() => setOpen(open === "sets" ? "none" : "sets")} style={btn({ on: open === "sets", hex: frustum })}>{t("drone.deck.settings")}</button>
        <button data-drone-deck-keys onClick={() => setOpen(open === "keys" ? "none" : "keys")} style={btn({ on: open === "keys", hex: frustum })}>{t("drone.deck.keymap")}</button>
      </div>
      {open === "sets" ? (
        <div data-drone-sets style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ ...MONO, color: frustum }} data-drone-sets-line>{setsLine(sets)}</span>
          <span style={{ ...MONO, color: hud, opacity: 0.7 }}>{t("drone.deck.sens_l")}</span>
          <button data-drone-set="l-" onClick={() => step("l", -0.25)} style={btn({ hex: frustum })}>−</button>
          <button data-drone-set="l+" onClick={() => step("l", 0.25)} style={btn({ hex: frustum })}>+</button>
          <span style={{ ...MONO, color: hud, opacity: 0.7 }}>{t("drone.deck.sens_r")}</span>
          <button data-drone-set="r-" onClick={() => step("r", -0.25)} style={btn({ hex: frustum })}>−</button>
          <button data-drone-set="r+" onClick={() => step("r", 0.25)} style={btn({ hex: frustum })}>+</button>
          <span style={{ ...MONO, color: hud, opacity: 0.7 }}>{t("drone.deck.dead")}</span>
          <button data-drone-set="dead-" onClick={() => step("dead", -0.02)} style={btn({ hex: frustum })}>−</button>
          <button data-drone-set="dead+" onClick={() => step("dead", 0.02)} style={btn({ hex: frustum })}>+</button>
          <button data-drone-set="zero" onClick={() => setSets(zeroTrims(sets))} style={btn({ hex: frustum })}>{t("drone.deck.zero")}</button>
          <button data-drone-set="from-stick" onClick={() => setSets(setFromStick(setFromStick(sets, "L", rawL.current), "R", rawR.current))} style={btn({ hex: frustum })}>{t("drone.deck.from_stick")}</button>
          <button data-drone-set="reset" onClick={() => setSets(resetSets())} style={btn({ hex: semanticHex("contour") })}>{t("drone.deck.reset")}</button>
        </div>
      ) : null}
      {open === "keys" ? (
        <div data-drone-keymap style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <style>{`@media print { body * { visibility: hidden; } [data-drone-keymap], [data-drone-keymap] * { visibility: visible; } [data-drone-keymap] { position: absolute; left: 0; top: 0; width: 100%; color: #000; } [data-drone-keymap] button { display: none; } }`}</style>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "4px 12px" }}>
            {keys.map(([code, action]) => (
              <div key={code} style={{ ...MONO, display: "flex", gap: 8, alignItems: "baseline" }}>
                <span style={{ color: frustum, minWidth: 18, border: `1px solid ${frustum}`, textAlign: "center", padding: "0 4px" }}>{keyGlyph(code)}</span>
                <span style={{ color: hud }}>{t(`drone.deck.act.${action}`)}</span>
              </div>
            ))}
          </div>
          <button data-drone-print onClick={() => window.print()} style={{ ...btn({ hex: frustum }), alignSelf: "flex-start" }}>{t("drone.deck.print")}</button>
        </div>
      ) : null}
    </div>
  );
}
