"use client";

// THE ENGAGEMENT HUD — LOCK, ARMED, and the amber/red legend, in words, beside the arena. Its own component
// so round.tsx stays under its ceiling. LOCK is AIM (never red); ARMED is the fire state (red). The legend
// says, in language, what the T-box shapes mean — the one thing the demo has to teach, told twice: by the
// shape on the box (single vs double bracket) and by these words.
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { MONO } from "./ui";

export function EngagementHud({ framed, armed }: { framed: { label: string; rangeM: number } | null; armed: boolean }) {
  const { t } = useLexicon();
  return (
    <>
      <span style={{ ...MONO, color: semanticHex("frustum") }} data-drone-lock-line>
        {framed ? `${t("drone.hud.lock")} ${framed.label} ${framed.rangeM}M` : t("drone.hud.no_lock")}
      </span>
      {armed ? <span style={{ ...MONO, color: semanticHex("ray") }} data-drone-armed>{t("drone.hud.armed")}</span> : null}
      <span style={{ ...MONO, color: semanticHex("hud"), opacity: 0.5 }} data-drone-legend>{t("drone.hud.legend")}</span>
    </>
  );
}
