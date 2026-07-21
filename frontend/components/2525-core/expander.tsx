"use client";

/**
 * 2525-CORE · Expander — the shared "start minimized, expand on demand" primitive (Sprint 7 extraction).
 * ====================================================================================================
 * A flush collapsible (toggle header + lazy children) with per-section persisted open state. Theme-agnostic
 * (colours via props) so every Vision-2525 domain — Architect, Security, Health, Education, Manta, Drone —
 * uses ONE expander instead of duplicating it. First extracted from Architect-2525's OVERVIEW cleanup.
 */
import { useState, useEffect, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface ExpanderColors { border: string; panel: string; accent: string; dim: string; }
const DEFAULT_COLORS: ExpanderColors = { border: "#1e2b3a", panel: "#111826", accent: "#c084fc", dim: "#5f7186" };

export function Expander({
  id, title, sub, defaultOpen = false, colors = DEFAULT_COLORS, storagePrefix = "2525.exp", dots = false, children,
}: {
  id: string; title: string; sub?: string; defaultOpen?: boolean;
  colors?: ExpanderColors; storagePrefix?: string; dots?: boolean; children: ReactNode;
}) {
  const key = `${storagePrefix}.${id}`;
  const [open, setOpen] = useState(() => { try { const v = localStorage.getItem(key); return v === null ? defaultOpen : v === "1"; } catch { return defaultOpen; } });
  useEffect(() => { try { localStorage.setItem(key, open ? "1" : "0"); } catch {} }, [key, open]);
  return (
    <div data-arch-exp={id}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="relative flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-white/5"
        style={{ borderColor: colors.border, background: colors.panel }}>
        {/* When dotted, PIN the ••• to a FIXED LEFT inset (left-3) — a stable column that lines up with every other
            ••• (bottom panels + collapsed rails) in BOTH phone-portrait and landscape, since it no longer depends on
            viewport width (operator IMG_7613/7614). Title reads to its right (pl-6). The right chevron is dropped in
            dotted mode — the ••• is the sole affordance (operator: "same function as •••"). Non-dotted headers keep
            the left title + right chevron. */}
        {dots ? (
          <>
            <span data-exp-dots className="absolute left-3 top-1/2 flex shrink-0 -translate-y-1/2 flex-col items-center gap-[3px]">
              {[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 rounded-full" style={{ background: colors.accent }} />)}
            </span>
            <span className="pl-6 text-[11px] font-bold tracking-wider" style={{ color: colors.accent }}>
              {title}{sub && <span className="ml-2 font-normal" style={{ color: colors.dim }}>· {sub}</span>}
            </span>
          </>
        ) : (
          <span className="text-[11px] font-bold tracking-wider" style={{ color: colors.accent }}>
            {title}{sub && <span className="ml-2 font-normal" style={{ color: colors.dim }}>· {sub}</span>}
          </span>
        )}
        {/* Dotted mode: the ••• IS the sole expand/collapse affordance — no right chevron (operator IMG_7614:
            "remove Advanced Design dropdown on right, same function as •••"). Non-dotted keeps the right chevron. */}
        {!dots && <ChevronDown className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform" style={{ color: colors.dim, transform: open ? "rotate(180deg)" : "none" }} />}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
