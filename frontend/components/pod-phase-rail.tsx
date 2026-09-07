"use client";

/**
 * The pod's phase rail — seven chips, one lit, counts on the ones that gate (joined / agreed /
 * started / witnessed), and under the lit chip the one thing this phase earns. RailChip pattern
 * from Security-2525: state in form and colour, readable in one look on a 375-px phone.
 */
import { useLexicon } from "@/lib/lexicon-context";
import { POD_PHASES, phaseIndex } from "@/lib/pod-phases";

export interface PodCounts { joined: number; agreed: number; started: number; witnessed: number; size: number }

export function PodPhaseRail({ phase, counts }: { phase: string; counts: PodCounts }) {
  const { t } = useLexicon();
  const cur = phaseIndex(phase);
  const countFor = (k: string): string | null => {
    switch (k) {
      case "invite": return `${Math.min(counts.joined, counts.agreed)}/${counts.size}`;
      case "sync": return `${counts.started}/${counts.size}`;
      case "audit": return `${counts.witnessed}/${counts.size}`;
      default: return null;
    }
  };
  return (
    <div className="mb-3" data-testid="phase-rail">
      <ol className="flex flex-wrap gap-1" aria-label={t("soi.pod.rail.aria")}>
        {POD_PHASES.map((p, i) => {
          const on = i === cur, past = i < cur, c = countFor(p.key);
          return (
            <li key={p.key} className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide"
              style={{ borderColor: on || past ? p.color : "var(--border)", color: on ? p.color : past ? p.color : "var(--muted-foreground)", opacity: on ? 1 : past ? 0.75 : 0.6, fontWeight: on ? 600 : 400 }}
              aria-current={on ? "step" : undefined}>
              {t(p.labelKey)}{c ? ` ${c}` : ""}{past ? " ✓" : ""}
            </li>
          );
        })}
      </ol>
      {cur >= 0 && <p className="mt-1 text-[11px] text-muted-foreground" data-testid="phase-earns">{t(POD_PHASES[cur].earnsKey)}</p>}
    </div>
  );
}
