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
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArchitectCelestial } from "@/components/architect-2525/architect-celestial";
import { CELESTIAL_BODIES, CELESTIAL_GROUPS, READING_LEVELS, type ReadingLevel } from "@/lib/celestial-guide-data";
import { useLexicon } from "@/lib/lexicon-context";
import { useCelestialContent } from "@/lib/use-celestial-content";
import { AlignedBilingual } from "@/components/celestial-2525/aligned-bilingual";

const C = { bg: "#070b12", panel: "#0c1420", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400" };

export function CelestialReader() {
  const { t, activeLocale, languages } = useLexicon();
  const bodies = useCelestialContent(activeLocale);
  // Language list = the SAME set as Settings / the Language Lexicon (approved languages only).
  const langOptions = languages.filter((l) => l.status === "approved");
  const isRTL = (loc: string) => languages.find((l) => l.code === loc)?.direction === "rtl";
  const rtl = isRTL(activeLocale);
  const [level, setLevel] = useState<ReadingLevel>("middle");
  const [bodyId, setBodyId] = useState("earth");
  const [openGroup, setOpenGroup] = useState<string | null>("sun-rocky");
  const body = bodies.find((b) => b.id === bodyId) ?? bodies[0];
  const levelMeta = READING_LEVELS.find((l) => l.id === level)!;
  const [full, setFull] = useState(false);          // full-screen (portal over the nav, like the map maximize)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Dual-language 50/50 (Divinity bilingual-reader parity) — primary + mirror columns, English-fallback
  // per column until per-language prose packs land. Independent scroll + per-column RTL.
  const [primaryLoc, setPrimaryLoc] = useState(activeLocale);
  const [mirrorLoc, setMirrorLoc] = useState(activeLocale === "es" ? "en" : "es");
  const bodyP = useCelestialContent(primaryLoc).find((b) => b.id === bodyId) ?? bodies[0];
  const bodyM = useCelestialContent(mirrorLoc).find((b) => b.id === bodyId) ?? bodies[0];

  // Bidirectional link: picking a planet (flower row OR any path) selects the body, opens its flower group
  // so it stays highlighted "above", and scrolls the reading page into view. The map (ArchitectCelestial)
  // receives bodyId as its controlled selection and resets orbit-play to 1× on every change.
  const selectBody = (id: string) => {
    setBodyId(id);
    const g = bodies.find((b) => b.id === id)?.group;
    if (g) setOpenGroup(g);
    if (typeof requestAnimationFrame !== "undefined") requestAnimationFrame(() => {
      try { document.querySelector("[data-cel-page]")?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
    });
  };

  const reader = (
    <div data-celestial-reader className={full ? "fixed inset-0 z-[120] flex flex-col overflow-auto" : "flex min-h-screen flex-col"} style={{ background: C.bg, color: C.text }}>
      {/* header */}
      <div className="flex items-center gap-3 border-b px-4 py-2" style={{ borderColor: C.border }}>
        <a href="/" className="text-[12px] font-bold" style={{ color: C.cyan }}>eXeL <span style={{ color: C.dim }}>AI</span></a>
        <span className="text-[13px] font-bold tracking-wider" style={{ color: C.violet }}>{t("celestial.product")}</span>
        <span className="hidden text-[10px] sm:inline" style={{ color: C.dim }}>{t("celestial.tagline")}</span>
        <span className="ml-auto text-[10px] font-semibold" style={{ color: "#22c55e" }}>{t("celestial.linkSecure")}</span>
        <button data-cel-full onClick={() => setFull((f) => !f)} title={full ? "Exit full screen" : "Full screen"}
          className="rounded border px-2 py-0.5 text-[11px] font-bold" style={{ borderColor: C.cyan, color: C.cyan }}>{full ? "▣ Min" : "⛶ Full"}</button>
      </div>

      {/* split: LEFT visual selector · RIGHT reading page (Divinity-Guide model) — stacks on phones */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* LEFT — the visual selector: full celestial map + 3-circle → all body navigator */}
        <div data-cel-visual className="flex w-full flex-col gap-2 border-b p-2 lg:w-[52%] lg:border-b-0 lg:border-r" style={{ borderColor: C.border }}>
          <div data-cel-map className="min-h-[36vh] flex-1">
            <ArchitectCelestial minimal externalSelId={bodyId} />
          </div>
          {/* flower-of-life selector (Divinity model) — 3 overlapping group circles → drill to the 12 bodies */}
          <div data-cel-selector>
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>{t("celestial.tapHint")}</div>
            {/* Vision-2525 emblem: white unity ring + 3 equilateral Trinity circles, 120° apart around the
                centroid (100,84) at radius 27 → symmetric "trinity-logo" overlap. Circle COLOR follows the
                emblem POSITION (violet top · cyan bottom-left · sunset-gold bottom-right — operator IMG_6294),
                overriding group.stroke; the group label text is kept. */}
            <svg data-cel-flower viewBox="0 0 200 150" className="mx-auto block w-full max-w-[300px]">
              {CELESTIAL_GROUPS.map((g, i) => {
                const p = [{ cx: 100, cy: 52 }, { cx: 72.3, cy: 100 }, { cx: 127.7, cy: 100 }][i] ?? { cx: 100, cy: 84 };
                // Label sits in the circle's CLEAR crescent (away from the centre overlap): top→crown, BL→lower-left, BR→lower-right.
                const tp = [{ x: 100, y: 44 }, { x: 60, y: 100 }, { x: 140, y: 100 }][i] ?? p;
                const col = [C.violet, C.cyan, C.gold][i] ?? g.stroke; // emblem position color (top·BL·BR)
                const open = openGroup === g.id;
                const words = t("celestial.group." + g.id).split(" ");
                const mid = Math.ceil(words.length / 2);
                const l1 = words.slice(0, mid).join(" "), l2 = words.slice(mid).join(" ");
                return (
                  <g key={g.id} data-cel-group={g.id} onClick={() => setOpenGroup(open ? null : g.id)} style={{ cursor: "pointer" }}>
                    <circle cx={p.cx} cy={p.cy} r="41" fill={open ? `${col}33` : `${col}14`} stroke={col} strokeWidth={open ? 2.4 : 1.4} />
                    <text x={tp.x} y={l2 ? tp.y - 4 : tp.y + 3} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={col}>{l1}</text>
                    {l2 && <text x={tp.x} y={tp.y + 6} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={col}>{l2}</text>}
                  </g>
                );
              })}
              <circle cx="100" cy="84" r="4" fill="none" stroke="#e8eef7" strokeWidth="1" opacity="0.7" />
            </svg>
            {openGroup && (
              <div className="mt-1 flex flex-wrap justify-center gap-1.5">
                {bodies.filter((b) => b.group === openGroup).map((b) => {
                  const sel = bodyId === b.id;
                  return (
                    <button key={b.id} data-cel-body={b.id} onClick={() => selectBody(b.id)}
                      className="flex flex-col items-center rounded-lg border px-2 py-1 text-[11px]"
                      style={{ borderColor: sel ? C.gold : C.border, background: sel ? `${C.gold}22` : "transparent", color: sel ? C.gold : C.text }}>
                      <span className="text-[16px] leading-none">{b.emoji}</span>
                      <span className="mt-0.5">{t("celestial.body." + b.id)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — the reading page for the selected body */}
        <div data-cel-page dir={rtl ? "rtl" : "ltr"} className="flex w-full flex-col gap-3 overflow-y-auto p-4 lg:flex-1">
          {/* reading-level picker — DROPDOWN on phone (one line, no wrap), pills on ≥sm */}
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>{t("celestial.readingLevel")}</span>
            {/* mobile: single-line dropdown with all 4 options */}
            <select data-cel-level-select value={level} onChange={(e) => setLevel(e.target.value as ReadingLevel)}
              className="rounded-lg border px-2 py-1 text-[12px] font-semibold sm:hidden"
              style={{ borderColor: levelMeta.stroke, background: C.panel, color: levelMeta.stroke }}>
              {READING_LEVELS.map((l) => (
                <option key={l.id} value={l.id} style={{ background: C.panel, color: C.text }}>{t("celestial.level." + l.id)}</option>
              ))}
            </select>
            {/* ≥sm: the pill row */}
            <div className="hidden flex-wrap items-center gap-2 sm:flex">
              {READING_LEVELS.map((l) => {
                const active = level === l.id;
                return (
                  <button key={l.id} data-cel-level={l.id} onClick={() => setLevel(l.id)}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"
                    style={{ borderColor: l.stroke, background: active ? l.stroke : "transparent", color: active ? "#05070d" : l.stroke }}>
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: active ? "#05070d" : l.stroke }} />
                    {t("celestial.level." + l.id)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* the page */}
          <div className="flex items-center gap-3">
            <span className="text-[34px]">{body.emoji}</span>
            <div>
              <div className="text-[20px] font-bold" style={{ color: C.violet }}>{t("celestial.body." + body.id)}</div>
              <div data-cel-master className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>
                {t("celestial.guidedBy").replace("{master}", body.master)}
              </div>
            </div>
            <span className="ml-auto rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: levelMeta.stroke, color: levelMeta.stroke }}>{t("celestial.level." + level)}</span>
          </div>
          {/* 50/50 DUAL-LANGUAGE (Divinity bilingual-reader) — hover/tap a word → its sentence highlights on
              BOTH columns + the translated equivalent word brightens on the mirror side. */}
          <AlignedBilingual
            primary={{ key: "primary", loc: primaryLoc, text: bodyP.text[level], rtl: isRTL(primaryLoc), setLoc: setPrimaryLoc }}
            mirror={{ key: "mirror", loc: mirrorLoc, text: bodyM.text[level], rtl: isRTL(mirrorLoc), setLoc: setMirrorLoc }}
            langOptions={langOptions.map((l) => ({ code: l.code, nameNative: l.nameNative }))}
          />

          <div className="mt-auto border-t pt-2 text-[9px] leading-relaxed" style={{ borderColor: C.border, color: C.dim }}>
            {"12 worlds · 4 reading levels · authored by the 12 Ascended Masters. Facts from NASA fact sheets. Use the ⭐ feedback button to tell us what to add."}
          </div>
        </div>
      </div>
    </div>
  );
  // Full-screen → portal over the app nav (mini-panel maximize pattern); else render in place.
  return full && mounted ? createPortal(reader, document.body) : reader;
}
