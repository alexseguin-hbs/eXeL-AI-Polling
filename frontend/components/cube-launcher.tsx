"use client";

/**
 * CubeLauncher — shared intermittent "cube grid" gateway
 * ======================================================
 * One look & feel for every X-2525 / product launcher screen. Used by:
 *   • Vision 2525 launcher (Easter-egg → SIM / Security / Architect / Manta / Drone)
 *   • Home interstitial     (login → eXeL AI Polling / Innovation / Brainstorm)
 *
 * Unlocked cubes are clickable; locked cubes carry a lock icon (same gating
 * pattern as donation-locked results). Keep both callers using THIS component so
 * they stay visually identical.
 */
import { Lock, X } from "lucide-react";

export type CubeDomain = {
  id: string;
  code: string;        // e.g. "SIM-2525" or "POLLING"
  name: string;        // e.g. "SIMULATION"
  tagline: string;
  color: string;       // hex accent
  unlocked: boolean;
  onEnter?: () => void;
};

/** Stylized isometric cube glyph in the domain's color. */
export function CubeGlyph({ color, dim }: { color: string; dim?: boolean }) {
  const o = dim ? 0.28 : 1;
  return (
    <svg width="56" height="60" viewBox="0 0 56 60" className="shrink-0" style={{ opacity: o }}>
      <polygon points="28,4 52,17 28,30 4,17" fill={color} fillOpacity="0.85" />
      <polygon points="4,17 28,30 28,56 4,43" fill={color} fillOpacity="0.45" />
      <polygon points="52,17 28,30 28,56 52,43" fill={color} fillOpacity="0.65" />
      <g stroke={color} strokeOpacity="0.9" strokeWidth="1" fill="none">
        <polygon points="28,4 52,17 28,30 4,17" />
        <polyline points="4,17 28,30 28,56" />
        <polyline points="52,17 28,30" />
        <polyline points="28,30 28,56" />
      </g>
    </svg>
  );
}

export function CubeLauncher({
  title,
  subtitle,
  footer,
  domains,
  onExit,
  exitLabel = "Exit",
}: {
  title: string;
  subtitle?: string;
  footer?: string;
  domains: CubeDomain[];
  onExit?: () => void;
  exitLabel?: string;
}) {
  // Column count adapts to how many cubes (2 → 2-up, else up to 3-up)
  const cols = domains.length <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background/97 backdrop-blur-md pointer-events-auto overflow-y-auto">
      {onExit && (
        <button
          onClick={onExit}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors"
          title={exitLabel}
          aria-label={exitLabel}
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      )}

      <div className="text-center mb-8 px-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] text-primary">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-xs md:text-sm text-muted-foreground tracking-widest uppercase">{subtitle}</p>
        )}
      </div>

      <div className={`grid grid-cols-1 ${cols} gap-4 px-6 max-w-4xl w-full`}>
        {domains.map((d) => {
          const clickable = d.unlocked && !!d.onEnter;
          return (
            <button
              key={d.id}
              disabled={!clickable}
              onClick={() => clickable && d.onEnter!()}
              className={`group relative flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-all ${
                clickable ? "cursor-pointer hover:scale-[1.03] hover:bg-accent/20" : "cursor-not-allowed opacity-70"
              }`}
              style={{
                borderColor: d.unlocked ? `${d.color}66` : "hsl(215 15% 25%)",
                boxShadow: clickable ? `0 0 24px ${d.color}22` : "none",
              }}
            >
              {!d.unlocked && (
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}

              <CubeGlyph color={d.color} dim={!d.unlocked} />

              <div className="text-sm font-bold tracking-wide" style={{ color: d.unlocked ? d.color : "hsl(215 12% 55%)" }}>
                {d.name}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground/70">{d.code}</div>
              <div className="text-[11px] text-muted-foreground leading-tight min-h-[28px]">{d.tagline}</div>

              <span
                className="mt-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: clickable ? d.color : undefined }}
              >
                {clickable ? "Enter →" : "Locked"}
              </span>
            </button>
          );
        })}
      </div>

      {footer && (
        <p className="mt-8 text-[10px] text-muted-foreground/40 tracking-widest text-center px-6">{footer}</p>
      )}
    </div>
  );
}
