"use client";

/**
 * DRONE-2525 · Command UX1 — Version 00.00 · revision 0.001 (operator 2026-09-15, 1st Pass).
 * =========================================================================================
 * Level-3 Domain Play sibling of SECURITY-2525 and ARCHITECT-2525's command shells, built on
 * WIREFRAME-CORE (docs/2525-core/WIREFRAME-CORE.md). What is different here is the GROUND: this
 * surface obeys the VECTOR LAW (lib/wire-core/vector-law.ts) — black ground, edges only, one
 * saturated stroke per object from the 13, HUD drawn in the same stroke language as the world.
 *
 * Pass 1 ships the two STATIONARY modes (operator's items 1 and 2): Security Turrets and Security
 * Capital. The two flying modes are listed and visibly dated, never hidden — a mode the operator
 * asked for that is not built yet is a promise on screen, not a silence.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";
import { versionStamp } from "@/lib/2525-core/version-stamp";
import { semanticHex } from "@/lib/wire-core/palette";
import { VECTOR_LAW } from "@/lib/wire-core/vector-law";
import { MOT_LEVELS, motSpec, type MotLevel } from "@/lib/wire-core/mot-ladder";
import { HAL_ORDER, HAL_PROFILES, type HalChoice } from "@/lib/wire-core/hal";
import { DRONE_DOMAIN } from "@/lib/drone-2525/domain.gen";
import { ArenaView } from "./arena-view";
import { TurretGame } from "./turret-game";
import { SelfCalPanel } from "./self-cal-panel";

const SRC = DRONE_DOMAIN;

/** Pass 1 builds these; the rest are declared with the pass that will build them. */
const SHIPPED = new Set(["turrets", "capital"]);

export function DroneCommandUX1() {
  const { t } = useLexicon();
  const router = useRouter();
  const [mode, setMode] = useState("turrets");
  const [level, setLevel] = useState<MotLevel>("1.1");
  const [hal, setHal] = useState<HalChoice>("auto");
  const stamp = useMemo(() => versionStamp(`v${SRC.project.revision}`), []);
  const label = semanticHex("hud");
  const dim = { color: label, opacity: 0.55 };

  // Mobile-first: the controls shrink with the viewport so four modes and four detail steps still fit on a
  // phone without pushing the arena itself below the fold.
  const btn = (on: boolean, hex: string) => ({
    background: "transparent", border: `1px solid ${on ? hex : "#2a2a2a"}`, color: on ? hex : "#6b6b6b",
    padding: "5px clamp(7px, 2vw, 12px)", fontFamily: "ui-monospace, monospace",
    fontSize: "clamp(9px, 2.4vw, 11px)", letterSpacing: "0.06em",
    textTransform: "uppercase" as const, cursor: "pointer", borderRadius: 2,
  });

  return (
    <div data-drone-ux1 style={{ minHeight: "100vh", background: VECTOR_LAW.ground, color: label, fontFamily: "ui-monospace, monospace" }}>
      {/* Top bar — strokes, not chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px", borderBottom: `1px solid ${semanticHex("contour")}` }}>
        <button onClick={() => router.push("/")} aria-label={t("drone.back")} style={{ ...btn(false, label), display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={13} /> {t("drone.back")}
        </button>
        <span style={{ fontSize: 13, letterSpacing: "0.18em", color: semanticHex("mount") }}>DRONE · 2525</span>
        <span style={{ ...dim, fontSize: 11 }}>{t("drone.subtitle")}</span>
        <span style={{ marginLeft: "auto", fontSize: "clamp(8px, 2.1vw, 10px)", ...dim }}>
          {t("drone.version")} {SRC.project.version} · {t("drone.revision")} {SRC.project.revision} · {stamp}
        </span>
      </div>

      {/* Mode row — the operator's four items, two live, two dated */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "10px 14px" }}>
        {SRC.modes.map((m) => {
          const live = SHIPPED.has(m.id);
          const on = live && mode === m.id;
          return (
            <button key={m.id} data-drone-mode={m.id} disabled={!live} onClick={() => live && setMode(m.id)}
                    style={{ ...btn(on, semanticHex("door")), cursor: live ? "pointer" : "not-allowed", opacity: live ? 1 : 0.45 }}>
              {t(`drone.mode.${m.id}`)}{live ? "" : ` · ${t("drone.mode.pass")} ${m.pass}`}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {/* THE LADDER — 5 compute bands × 5 resolution steps. 1.1 is the arcade rung and the fastest. */}
          <span style={{ ...dim, fontSize: 10 }}>{t("drone.mot")}</span>
          <select data-drone-mot value={level} onChange={(e) => setLevel(e.target.value as MotLevel)}
                  style={{ ...btn(true, semanticHex("mount")), minWidth: 116 }}>
            {MOT_LEVELS.map((l) => {
              const s = motSpec(l);
              return <option key={l} value={l}>{`${l} ${s.bandName} · ${s.sensors.length}s`}</option>;
            })}
          </select>
          <span style={{ ...dim, fontSize: 10 }}>{t("drone.hal")}</span>
          <select data-drone-hal value={hal} onChange={(e) => setHal(e.target.value as HalChoice)}
                  style={{ ...btn(true, semanticHex("frustum")), minWidth: 104 }}>
            <option value="auto">{t("drone.hal_auto")}</option>
            {HAL_ORDER.map((h) => <option key={h} value={h}>{HAL_PROFILES[h].label}</option>)}
          </select>
        </div>
      </div>

      {/* The arena, and the round played on it */}
      <div style={{ padding: "0 14px 14px" }}>
        {mode === "turrets" || mode === "capital"
          ? <TurretGame mode={mode as "turrets" | "capital"} level={level} hal={hal} />
          : <ArenaView source={SRC} level={level} hal={hal} />}
      </div>

      <SelfCalPanel level={level} hal={hal} />

      {/* What this is and is not — said once, in plain words, on every run */}
      <div style={{ padding: "0 14px 24px", maxWidth: 820 }}>
        <p style={{ fontSize: 11, lineHeight: 1.7, ...dim }}>{t("drone.disclaimer")}</p>
        <p style={{ fontSize: 11, lineHeight: 1.7, ...dim }}>{t("drone.mode_note")}</p>
      </div>
    </div>
  );
}
