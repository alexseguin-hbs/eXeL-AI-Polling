"use client";

/**
 * The pod's phase rail — seven chips, one lit, counts on the ones that gate (joined / agreed /
 * started / witnessed), and under the lit chip the one thing this phase earns. RailChip pattern
 * from Security-2525: state in form and colour, readable in one look on a 375-px phone.
 */
import { useLexicon } from "@/lib/lexicon-context";
import { POD_PHASES, type PodPhaseDef } from "@/lib/pod-phases";
import { useThemeHue } from "@/lib/theme-hue";

export interface PodCounts { joined: number; agreed: number; started: number; witnessed: number; size: number }

/**
 * `phases` / `countFor` are ADDITIVE (max R-CORE reuse, operator 2026-09-30): the pod passes nothing and gets its seven
 * phases with the joined / started / witnessed counts as before; Financial-2525 passes its own five phases and its own
 * count text. One rail, every surface.
 */
export function PodPhaseRail({ phase, counts, phases = POD_PHASES, countFor: countForProp }: { phase: string; counts?: PodCounts; phases?: PodPhaseDef[]; countFor?: (key: string) => string | null }) {
  const { t } = useLexicon();
  const hue = useThemeHue();
  const cur = phases.findIndex((p) => p.key === phase);
  const countFor = countForProp ?? ((k: string): string | null => {
    if (!counts) return null;
    switch (k) {
      case "invite": return `${Math.min(counts.joined, counts.agreed)}/${counts.size}`;
      case "sync": return `${counts.started}/${counts.size}`;
      case "audit": return `${counts.witnessed}/${counts.size}`;
      default: return null;
    }
  });
  return (
    <div className="mb-3" data-testid="phase-rail">
      {cur >= 0 && <p className="mb-1 text-xs font-medium" data-testid="phase-step"><span style={{ color: hue.bright }}>{t("soi.pod.guide.step").replace("{n}", String(cur + 1)).replace("{m}", String(phases.length))}</span> · {t(phases[cur].labelKey)}</p>}
      <ol className="flex flex-wrap gap-1" aria-label={t("soi.pod.rail.aria")}>
        {phases.map((p, i) => {
          const on = i === cur, past = i < cur, c = countFor(p.key);
          return (
            <li key={p.key} className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
              style={{ borderColor: on ? hue.bright : past ? hue.dim : "var(--border)", color: on ? hue.bright : past ? hue.mid : "var(--muted-foreground)", background: on ? hue.faint : undefined, fontWeight: on ? 600 : 400 }}
              aria-current={on ? "step" : undefined}>
              <span aria-hidden="true">{p.glyph} </span>{t(p.labelKey)}{c ? ` ${c}` : ""}{past ? " ✓" : ""}
            </li>
          );
        })}
      </ol>
      {cur >= 0 && <p className="mt-1 text-xs" data-testid="phase-earns"><span aria-hidden="true" style={{ color: hue.bright }}>{phases[cur].glyph}</span> <span className="text-muted-foreground">{t(phases[cur].earnsKey)}</span></p>}
    </div>
  );
}
