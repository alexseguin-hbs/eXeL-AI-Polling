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
import { PLATFORMS, DEFAULT_PLATFORM, type PlatformId } from "@/lib/drone-2525/platform";
import { CHALLENGES_ALL, DIFFICULTIES, chName, DEFAULT_CHALLENGE, DEFAULT_DIFF, type Challenge, type Difficulty } from "@/lib/drone-2525/challenge";
import { loadProgression, saveProgression, advance, unlocked, startingMode, startingChallenge, type Progression } from "@/lib/drone-2525/progression";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";
import { versionStamp } from "@/lib/2525-core/version-stamp";
import { semanticHex } from "@/lib/wire-core/palette";
import { MONO, btn } from "./ui";
import { VECTOR_LAW } from "@/lib/wire-core/vector-law";
import { MOT_LEVELS, motSpec, type MotLevel } from "@/lib/wire-core/mot-ladder";
import { HAL_ORDER, HAL_PROFILES, type HalChoice } from "@/lib/wire-core/hal";
import { DRONE_DOMAIN } from "@/lib/drone-2525/domain.gen";
import { Round, type RoundMode } from "./round";
import { SelfCalPanel } from "./self-cal-panel";
import { DroneIntro } from "./intro";
import { StageStrip } from "./stage-strip";
import { resolveBegin, introSeen, markIntroSeen, type BeginChoice } from "@/lib/drone-2525/guided-start";

const SRC = DRONE_DOMAIN;

/** All four of the operator's modes are now built: two stationary, two flying. */
const SHIPPED = new Set(["turrets", "capital", "drone", "multi"]);

export function DroneCommandUX1() {
  const { t } = useLexicon();
  const router = useRouter();
  const [mode, setMode] = useState("turrets");
  const [level, setLevel] = useState<MotLevel>("1.1");
  const [hal, setHal] = useState<HalChoice>("auto");
  // CH1–CH5 × DIFF 1–5 (operator deck r.036 → r.050). Dropdowns, not a chip wall — his r.044 rule.
  const [challenge, setChallenge] = useState<Challenge>(DEFAULT_CHALLENGE);
  const [diff, setDiff] = useState<Difficulty>(DEFAULT_DIFF);
  // PLATFORM (r.050 units table, as data). The four on this arena are live; the rest are dated, not hidden.
  const [platform, setPlatform] = useState<PlatformId>(DEFAULT_PLATFORM);
  // THE GUIDED START — defaults render first (no hydration mismatch); the effect reads the ladder and, on a first visit, drops the trainee onto the turret at CH0.
  const [prog, setProg] = useState<Progression>({ reached: 0, firstVisit: false });
  const [isJoiner, setIsJoiner] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    const joiner = typeof window !== "undefined" && /[?&]crew=/.test(window.location.search);
    setIsJoiner(joiner);
    const p = loadProgression();
    setProg(p);
    if (!joiner) { setMode(startingMode()); setChallenge(startingChallenge(p) as Challenge); }
    setShowIntro(!joiner && p.firstVisit && !introSeen());   // the on-ramp shows once, on a true first visit
  }, []);

  // BEGIN REHEARSAL — resolve the intro's choice within the unlocked ladder (a first-timer still lands on the turret at CH0).
  const applyBegin = (c: BeginChoice) => {
    const r = resolveBegin(prog, isJoiner, c);
    setMode(r.mode); setPlatform(r.platform); setChallenge(r.challenge as Challenge);
    markIntroSeen(); setShowIntro(false);
  };
  const stamp = useMemo(() => versionStamp(`v${SRC.project.revision}`), []);
  const label = semanticHex("hud");
  const dim = { color: label, opacity: 0.55 };


  return (
    <div data-drone-ux1 style={{ minHeight: "100vh", background: VECTOR_LAW.ground, color: label, fontFamily: "ui-monospace, monospace" }}>
      {showIntro && <DroneIntro onBegin={applyBegin} onSkip={() => { markIntroSeen(); setShowIntro(false); }} />}
      {/* Top bar — strokes, not chrome */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px", borderBottom: `1px solid ${semanticHex("contour")}` }}>
        <button onClick={() => router.push("/")} aria-label={t("drone.back")} style={{ ...btn({ hex: label }), display: "flex", alignItems: "center", gap: 6 }}>
          <ArrowLeft size={13} /> {t("drone.back")}
        </button>
        <span style={{ fontSize: 13, letterSpacing: "0.18em", color: semanticHex("mount") }}>DRONE · 2525</span>
        <span style={{ ...dim, fontSize: 11 }}>{t("drone.subtitle")}</span>
        <button data-drone-replay-intro onClick={() => setShowIntro(true)} style={{ ...btn({ hex: label }), fontSize: 10 }}>{t("drone.intro.replay")}</button>
        <span style={{ marginLeft: "auto", fontSize: "clamp(8px, 2.1vw, 10px)", ...dim }}>
          {t("drone.version")} {SRC.project.version} · {t("drone.revision")} {SRC.project.revision} · {stamp}
        </span>
      </div>

      {/* Mode row — the operator's four items, all four live (turret · capital · 2-HI drone · mixed crew) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "10px 14px" }}>
        {SRC.modes.map((m) => {
          const built = SHIPPED.has(m.id);
          const open = built && unlocked(prog, m.id, isJoiner);   // built AND reached on the ladder (joiner always)
          const on = open && mode === m.id;
          const suffix = !built ? ` · ${t("drone.platform.dated")}` : open ? "" : ` · ${t("drone.stage.locked")}`;
          return (
            <button key={m.id} data-drone-mode={m.id} data-locked={built && !open ? "1" : undefined} disabled={!open} onClick={() => open && setMode(m.id)}
                    style={{ ...btn({ on, hex: semanticHex("door"), enabled: open }), opacity: open ? 1 : 0.45 }}>
              {t(`drone.mode.${m.id}`)}{suffix}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {/* THE LADDER — 5 compute bands × 5 resolution steps. 1.1 is the arcade rung and the fastest. */}
          <span style={{ ...dim, fontSize: 10 }}>{t("drone.mot")}</span>
          <select data-drone-mot value={level} onChange={(e) => setLevel(e.target.value as MotLevel)}
                  style={{ ...btn({ on: true, hex: semanticHex("mount") }), minWidth: 116 }}>
            {MOT_LEVELS.map((l) => {
              const s = motSpec(l);
              return <option key={l} value={l}>{`${l} ${s.bandName} · ${s.sensors.length}s`}</option>;
            })}
          </select>
          <span style={{ ...dim, fontSize: 10 }}>{t("drone.hal")}</span>
          <select data-drone-hal value={hal} onChange={(e) => setHal(e.target.value as HalChoice)}
                  style={{ ...btn({ on: true, hex: semanticHex("frustum") }), minWidth: 104 }}>
            <option value="auto">{t("drone.hal_auto")}</option>
            {HAL_ORDER.map((h) => <option key={h} value={h}>{HAL_PROFILES[h].label}</option>)}
          </select>
          <span style={{ ...dim, fontSize: 10 }}>{t("drone.platform")}</span>
          <select data-drone-platform value={platform} onChange={(e) => setPlatform(e.target.value as PlatformId)}
                  style={{ ...btn({ on: true, hex: semanticHex("mount") }), minWidth: 118, maxWidth: 150 }}>
            {PLATFORMS.map((p) => <option key={p.id} value={p.id} disabled={!p.here}>{p.here ? p.label : `${p.label} · ${t("drone.platform.dated")}`}</option>)}
          </select>
          <span style={{ ...dim, fontSize: 10 }}>{t("drone.ch")}</span>
          <select data-drone-ch value={challenge} onChange={(e) => setChallenge(Number(e.target.value) as Challenge)}
                  style={{ ...btn({ on: true, hex: semanticHex("door") }), minWidth: 96 }}>
            {CHALLENGES_ALL.map((c) => <option key={c} value={c}>{`CH${c} ${chName(c)}`}</option>)}
          </select>
          <span style={{ ...dim, fontSize: 10 }}>{t("drone.diff")}</span>
          <select data-drone-diff value={diff} onChange={(e) => setDiff(Number(e.target.value) as Difficulty)}
                  style={{ ...btn({ on: true, hex: semanticHex("door") }), minWidth: 56 }}>
            {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* YOU ARE HERE — one plain sentence per stage (its own component, keeps this shell small) */}
      <StageStrip mode={mode} />

      {/* The arena, and the round played on it */}
      <div style={{ padding: "0 14px 14px" }}>
        <Round mode={mode as RoundMode} level={level} hal={hal} challenge={challenge} diff={diff} platform={platform}
               onRoundEnd={(r) => setProg((p) => { const np = advance(p, r); if (np !== p) saveProgression(np); return np; })} />
      </div>

      <SelfCalPanel level={level} hal={hal} />

      {/* What this is and is not — said once, in plain words, on every run */}
      <div style={{ padding: "0 14px 24px", maxWidth: 820 }}>
        <p style={{ fontSize: 11, lineHeight: 1.7, ...dim }}>{t("drone.disclaimer")}</p>
        {challenge === 0 && (
          <p data-drone-training style={{ fontSize: 11, lineHeight: 1.7, color: semanticHex("mount") }}>{t("drone.ch.training_line")}</p>
        )}
        <p style={{ fontSize: 11, lineHeight: 1.7, ...dim }}>{t("drone.mode_note")}</p>
      </div>
    </div>
  );
}
