"use client";

// YOU ARE HERE — one plain sentence per stage, so a stranger knows what the current mode teaches (r.066).
// Its own component so the command shell stays under the 300-line rule (drone-size).
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { stageIndex } from "@/lib/drone-2525/progression";

export function StageStrip({ mode }: { mode: string }) {
  const { t } = useLexicon();
  const i = stageIndex(mode);
  return (
    <div data-drone-stage={mode} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "0 14px 8px", flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, letterSpacing: "0.14em", color: semanticHex("mount") }}>
        {t("drone.stage.here")} {i >= 0 ? `${i + 1}/4` : ""}
      </span>
      <span style={{ fontSize: 11, color: semanticHex("hud"), opacity: 0.55 }}>{t(`drone.stage.${mode}`)}</span>
    </div>
  );
}
