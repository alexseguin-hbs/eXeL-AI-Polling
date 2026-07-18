"use client";

/**
 * CELESTIAL-2525 · family/education reader (Vision 2525).
 * =================================================================================================
 * Standalone /main/Celestial-2525 — nieces & nephews learn the solar system. Laid out like the
 * Divinity Guide / Atlantis Accord (reused, not recreated): LEFT = the VISUAL SELECTOR (the full
 * celestial map + a 3-circle group navigator that expands to all 12 bodies, the operator's "3 → all");
 * RIGHT = the READING PAGE (a reading-level picker + the selected body's page). Each body is authored
 * by one of the 12 Ascended Masters. Content is bundled-static + deterministic.
 */
import { useState } from "react";
import { ArchitectCelestial } from "@/components/architect-2525/architect-celestial";
import { CELESTIAL_BODIES, CELESTIAL_GROUPS, READING_LEVELS, type ReadingLevel } from "@/lib/celestial-guide-data";

const C = { bg: "#070b12", panel: "#0c1420", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400" };

export function CelestialReader() {
  const [level, setLevel] = useState<ReadingLevel>("middle");
  const [bodyId, setBodyId] = useState("earth");
  const [openGroup, setOpenGroup] = useState<string | null>("sun-rocky");
  const body = CELESTIAL_BODIES.find((b) => b.id === bodyId) ?? CELESTIAL_BODIES[0];
  const levelMeta = READING_LEVELS.find((l) => l.id === level)!;

  return (
    <div data-celestial-reader className="flex min-h-screen flex-col" style={{ background: C.bg, color: C.text }}>
      {/* header */}
      <div className="flex items-center gap-3 border-b px-4 py-2" style={{ borderColor: C.border }}>
        <a href="/" className="text-[12px] font-bold" style={{ color: C.cyan }}>eXeL <span style={{ color: C.dim }}>AI</span></a>
        <span className="text-[13px] font-bold tracking-wider" style={{ color: C.violet }}>Celestial-2525</span>
        <span className="hidden text-[10px] sm:inline" style={{ color: C.dim }}>The Sky, for Family & Friends · Vision 2525</span>
        <span className="ml-auto text-[10px] font-semibold" style={{ color: "#22c55e" }}>LINK: SECURE</span>
      </div>

      {/* split: LEFT visual selector · RIGHT reading page (Divinity-Guide model) — stacks on phones */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* LEFT — the visual selector: full celestial map + 3-circle → all body navigator */}
        <div data-cel-visual className="flex w-full flex-col gap-2 border-b p-2 lg:w-[52%] lg:border-b-0 lg:border-r" style={{ borderColor: C.border }}>
          <div data-cel-map className="min-h-[36vh] flex-1">
            <ArchitectCelestial minimal />
          </div>
          <div>
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Tap a circle to open its worlds, then pick one to read</div>
            <div className="flex flex-col gap-1.5">
              {CELESTIAL_GROUPS.map((g) => {
                const open = openGroup === g.id;
                const members = CELESTIAL_BODIES.filter((b) => b.group === g.id);
                return (
                  <div key={g.id}>
                    <button data-cel-group={g.id} onClick={() => setOpenGroup(open ? null : g.id)}
                      className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-[12px] font-semibold"
                      style={{ borderColor: g.stroke, background: open ? `${g.stroke}22` : "transparent", color: g.stroke }}>
                      <span className="inline-block h-4 w-4 rounded-full" style={{ background: g.stroke }} />
                      {g.label} <span style={{ color: C.dim, fontWeight: 400 }}>· {members.length}</span>
                    </button>
                    {open && (
                      <div className="mt-1 flex flex-wrap gap-1 pl-4">
                        {members.map((b) => {
                          const sel = bodyId === b.id;
                          return (
                            <button key={b.id} data-cel-body={b.id} onClick={() => setBodyId(b.id)}
                              className="rounded-full border px-2 py-0.5 text-[12px]"
                              style={{ borderColor: sel ? C.gold : C.border, background: sel ? `${C.gold}22` : "transparent", color: sel ? C.gold : C.text }}>
                              {b.emoji} {b.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — the reading page for the selected body */}
        <div data-cel-page className="flex w-full flex-col gap-3 overflow-y-auto p-4 lg:flex-1">
          {/* reading-level picker (kids · middle · high · adult) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Reading level:</span>
            {READING_LEVELS.map((l) => {
              const active = level === l.id;
              return (
                <button key={l.id} data-cel-level={l.id} onClick={() => setLevel(l.id)}
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"
                  style={{ borderColor: l.stroke, background: active ? l.stroke : "transparent", color: active ? "#05070d" : l.stroke }}>
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: active ? "#05070d" : l.stroke }} />
                  {l.label}
                </button>
              );
            })}
          </div>

          {/* the page */}
          <div className="flex items-center gap-3">
            <span className="text-[34px]">{body.emoji}</span>
            <div>
              <div className="text-[20px] font-bold" style={{ color: C.violet }}>{body.name}</div>
              <div data-cel-master className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>
                Guided by Ascended Master {body.master}
              </div>
            </div>
            <span className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: levelMeta.stroke, color: levelMeta.stroke }}>{levelMeta.label}</span>
          </div>
          <div data-cel-content className="whitespace-pre-line text-[13px] leading-relaxed" style={{ color: C.text }}>
            {body.text[level]}
          </div>

          <div className="mt-auto border-t pt-2 text-[9px] leading-relaxed" style={{ borderColor: C.border, color: C.dim }}>
            {"12 worlds · 4 reading levels · authored by the 12 Ascended Masters. Facts from NASA fact sheets. Use the ⭐ feedback button to tell us what to add."}
          </div>
        </div>
      </div>
    </div>
  );
}
