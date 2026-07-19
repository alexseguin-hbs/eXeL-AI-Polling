"use client";

/**
 * CELESTIAL-2525 · body-prose i18n scaffold (long-form content channel).
 * =================================================================================================
 * Long educational prose does NOT go through the lexicon t() key system (that is for UI chrome).
 * It follows the Divinity-Guide model: English is bundled as the base, and each other language is a
 * code-split JSON pack loaded on demand, keyed to the global `activeLocale`. Missing pack → English
 * fallback (never a blank). To add a language: drop `frontend/lib/celestial-guide-<code>.json`
 * (shape: { [bodyId]: { kids?, middle?, high?, adult? } }) and register it in LANG_LOADERS below.
 */
import { useEffect, useState } from "react";
import { CELESTIAL_BODIES, type CelestialEntry, type ReadingLevel } from "./celestial-guide-data";

type BodyText = Record<ReadingLevel, string>;
/** A per-language pack overrides body text by body id; any missing field falls back to English. */
export type CelestialLangPack = Record<string, Partial<BodyText>>;

// Code-split loaders — English is the bundled base (not listed). Register new languages here as
// their JSON packs land; until then every non-English locale falls back to English, by design.
const LANG_LOADERS: Record<string, () => Promise<{ default: CelestialLangPack }>> = {
  ar: () => import("./celestial-guide-ar.json") as Promise<{ default: CelestialLangPack }>,
  bn: () => import("./celestial-guide-bn.json") as Promise<{ default: CelestialLangPack }>,
  da: () => import("./celestial-guide-da.json") as Promise<{ default: CelestialLangPack }>,
  de: () => import("./celestial-guide-de.json") as Promise<{ default: CelestialLangPack }>,
  el: () => import("./celestial-guide-el.json") as Promise<{ default: CelestialLangPack }>,
  es: () => import("./celestial-guide-es.json") as Promise<{ default: CelestialLangPack }>,
  fi: () => import("./celestial-guide-fi.json") as Promise<{ default: CelestialLangPack }>,
  fr: () => import("./celestial-guide-fr.json") as Promise<{ default: CelestialLangPack }>,
  he: () => import("./celestial-guide-he.json") as Promise<{ default: CelestialLangPack }>,
  hi: () => import("./celestial-guide-hi.json") as Promise<{ default: CelestialLangPack }>,
  it: () => import("./celestial-guide-it.json") as Promise<{ default: CelestialLangPack }>,
  ja: () => import("./celestial-guide-ja.json") as Promise<{ default: CelestialLangPack }>,
  ne: () => import("./celestial-guide-ne.json") as Promise<{ default: CelestialLangPack }>,
  no: () => import("./celestial-guide-no.json") as Promise<{ default: CelestialLangPack }>,
  pa: () => import("./celestial-guide-pa.json") as Promise<{ default: CelestialLangPack }>,
  pl: () => import("./celestial-guide-pl.json") as Promise<{ default: CelestialLangPack }>,
  pt: () => import("./celestial-guide-pt.json") as Promise<{ default: CelestialLangPack }>,
  ru: () => import("./celestial-guide-ru.json") as Promise<{ default: CelestialLangPack }>,
  sv: () => import("./celestial-guide-sv.json") as Promise<{ default: CelestialLangPack }>,
  sw: () => import("./celestial-guide-sw.json") as Promise<{ default: CelestialLangPack }>,
  th: () => import("./celestial-guide-th.json") as Promise<{ default: CelestialLangPack }>,
  tl: () => import("./celestial-guide-tl.json") as Promise<{ default: CelestialLangPack }>,
  tr: () => import("./celestial-guide-tr.json") as Promise<{ default: CelestialLangPack }>,
  uk: () => import("./celestial-guide-uk.json") as Promise<{ default: CelestialLangPack }>,
  vi: () => import("./celestial-guide-vi.json") as Promise<{ default: CelestialLangPack }>,
  zh: () => import("./celestial-guide-zh.json") as Promise<{ default: CelestialLangPack }>,
};

/** Locales that have (or will have) a code-split prose pack. English is always available. */
export const CELESTIAL_CONTENT_LOCALES: string[] = ["en", ...Object.keys(LANG_LOADERS)];

function mergePack(pack: CelestialLangPack): CelestialEntry[] {
  return CELESTIAL_BODIES.map((b) => ({
    ...b,
    text: {
      kids: pack[b.id]?.kids ?? b.text.kids,
      middle: pack[b.id]?.middle ?? b.text.middle,
      high: pack[b.id]?.high ?? b.text.high,
      adult: pack[b.id]?.adult ?? b.text.adult,
    },
  }));
}

/**
 * Returns the 12 celestial bodies with prose in `locale`, falling back to bundled English for any
 * locale (or body/level) without a translated pack. English resolves synchronously; other packs
 * lazy-load and swap in (cancelled-flag guards the async race, mirroring Divinity's useDivinityPages).
 */
export function useCelestialContent(locale: string): CelestialEntry[] {
  const [bodies, setBodies] = useState<CelestialEntry[]>(CELESTIAL_BODIES);
  useEffect(() => {
    let cancelled = false;
    const loader = LANG_LOADERS[locale];
    if (!loader) {
      setBodies(CELESTIAL_BODIES); // English base (or untranslated locale → English fallback)
      return;
    }
    loader()
      .then((mod) => { if (!cancelled) setBodies(mergePack(mod.default)); })
      .catch(() => { if (!cancelled) setBodies(CELESTIAL_BODIES); });
    return () => { cancelled = true; };
  }, [locale]);
  return bodies;
}
