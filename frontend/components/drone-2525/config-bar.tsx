"use client";

// THE CONFIG BAR — the level / HAL / platform / challenge / difficulty dropdowns, folded behind the top-bar
// CONFIG toggle so the play screen stays the arena + controls (operator 2026-09-19: "this is way too busy").
// The guided start and the r.066 intro set these; a returning player opens CONFIG to change them. Extracted
// from command-ux1 so that shell stays under its line ceiling (drone-size).
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { btn } from "./ui";
import { MOT_LEVELS, motSpec, type MotLevel } from "@/lib/wire-core/mot-ladder";
import { HAL_ORDER, HAL_PROFILES, type HalChoice } from "@/lib/wire-core/hal";
import { PLATFORMS, type PlatformId } from "@/lib/drone-2525/platform";
import { CHALLENGES_ALL, DIFFICULTIES, chName, type Challenge, type Difficulty } from "@/lib/drone-2525/challenge";

export function ConfigBar({ level, setLevel, hal, setHal, platform, setPlatform, challenge, setChallenge, diff, setDiff }: {
  level: MotLevel; setLevel: (l: MotLevel) => void;
  hal: HalChoice; setHal: (h: HalChoice) => void;
  platform: PlatformId; setPlatform: (p: PlatformId) => void;
  challenge: Challenge; setChallenge: (c: Challenge) => void;
  diff: Difficulty; setDiff: (d: Difficulty) => void;
}) {
  const { t } = useLexicon();
  const dim = { color: semanticHex("hud"), opacity: 0.55 };
  return (
    <div data-drone-config-bar style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", flexBasis: "100%", marginTop: 8 }}>
      <span style={{ ...dim, fontSize: 10 }}>{t("drone.mot")}</span>
      <select data-drone-mot value={level} onChange={(e) => setLevel(e.target.value as MotLevel)}
              style={{ ...btn({ on: true, hex: semanticHex("mount") }), minWidth: 116 }}>
        {MOT_LEVELS.map((l) => { const s = motSpec(l); return <option key={l} value={l}>{`${l} ${s.bandName} · ${s.sensors.length}s`}</option>; })}
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
  );
}
