"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type LexiconLanguage,
  type LanguageTranslations,
  ADMIN_EMAIL,
  INITIAL_LANGUAGES,
  DEFAULT_ENGLISH_TRANSLATIONS,
  ALL_KEYS,
  CUBE_GROUPS,
} from "@/lib/lexicon-data";
import { SEEDED_TRANSLATIONS } from "@/lib/lexicon-translations";
import { PINYIN_MAP } from "@/lib/pinyin-data";

// ─── Storage keys ────────────────────────────────────────────────

const LANGUAGES_KEY = "exel-lexicon-languages";
const TRANSLATIONS_KEY = "exel-lexicon-translations";
const LOCALE_KEY = "exel-active-locale";

// ─── Completeness helper ─────────────────────────────────────────

export interface CompletenessInfo {
  filled: number;
  total: number;
  percent: number;
}

function calcCompleteness(
  translations: LanguageTranslations,
  langCode: string,
  cubeId?: number
): CompletenessInfo {
  const keys =
    cubeId !== undefined
      ? CUBE_GROUPS.find((g) => g.cubeId === cubeId)?.keys.map((k) => k.key) ??
        []
      : ALL_KEYS;
  const total = keys.length;
  if (total === 0) return { filled: 0, total: 0, percent: 100 };
  const langMap = translations[langCode] ?? {};
  const filled = keys.filter((k) => !!langMap[k]?.trim()).length;
  return { filled, total, percent: Math.round((filled / total) * 100) };
}

// ─── Context type ────────────────────────────────────────────────

interface LexiconContextValue {
  // Active interface locale — drives t() translations
  activeLocale: string;
  setActiveLocale: (code: string) => void;
  /** Translate a key using the active locale (falls back to English) */
  t: (key: string) => string;
  /** Pinyin toggle — only relevant when activeLocale === "zh" */
  pinyinEnabled: boolean;
  setPinyinEnabled: (enabled: boolean) => void;
  /** Get pinyin for a key (returns empty string if not available or not zh) */
  pinyin: (key: string) => string;

  // Read
  languages: LexiconLanguage[];
  translations: LanguageTranslations;
  getTranslation: (key: string, langCode: string) => string;
  getLanguageCompleteness: (langCode: string, cubeId?: number) => CompletenessInfo;
  getPendingLanguages: () => LexiconLanguage[];

  // Write
  updateTranslation: (langCode: string, key: string, text: string) => void;
  bulkUpdateTranslations: (langCode: string, entries: Record<string, string>) => void;
  proposeLanguage: (
    code: string,
    nameEn: string,
    nameNative: string,
    dir: "ltr" | "rtl",
    proposerEmail: string
  ) => void;
  approveLanguage: (code: string, approverEmail: string) => void;
  rejectLanguage: (code: string) => void;

  // Nav state (Lexicon editor)
  selectedLanguage: string | null;
  selectedCube: number | null;
  setSelectedLanguage: (code: string | null) => void;
  setSelectedCube: (cubeId: number | null) => void;

  // Auth
  isAdmin: (email?: string) => boolean;
}

const LexiconContext = createContext<LexiconContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────

export function LexiconProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<LexiconLanguage[]>(INITIAL_LANGUAGES);
  const [translations, setTranslations] = useState<LanguageTranslations>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedCube, setSelectedCube] = useState<number | null>(null);
  const [activeLocale, setActiveLocaleState] = useState<string>("en");
  const [pinyinEnabled, setPinyinEnabled] = useState<boolean>(false);

  // Hydrate from localStorage on mount, merging seeded translations as base
  useEffect(() => {
    try {
      const storedLangs = localStorage.getItem(LANGUAGES_KEY);
      if (storedLangs) {
        const parsed = JSON.parse(storedLangs) as LexiconLanguage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLanguages(parsed);
        }
      }
    } catch {
      // corrupt data — use defaults
    }

    // Hydrate active locale
    try {
      const storedLocale = localStorage.getItem(LOCALE_KEY);
      if (storedLocale) {
        setActiveLocaleState(storedLocale);
      }
    } catch {
      // corrupt data — use "en"
    }

    try {
      // Start with seeded translations as base
      const merged: LanguageTranslations = {};
      for (const [lang, entries] of Object.entries(SEEDED_TRANSLATIONS)) {
        merged[lang] = { ...entries };
      }
      // Overlay localStorage translations (user edits take priority)
      const storedTrans = localStorage.getItem(TRANSLATIONS_KEY);
      if (storedTrans) {
        const parsed = JSON.parse(storedTrans) as LanguageTranslations;
        if (parsed && typeof parsed === "object") {
          for (const [lang, entries] of Object.entries(parsed)) {
            merged[lang] = { ...(merged[lang] ?? {}), ...entries };
          }
        }
      }
      setTranslations(merged);
    } catch {
      // corrupt data — use seeded only
      setTranslations({ ...SEEDED_TRANSLATIONS });
    }
  }, []);

  // Persist languages to localStorage
  const persistLanguages = useCallback((langs: LexiconLanguage[]) => {
    setLanguages(langs);
    localStorage.setItem(LANGUAGES_KEY, JSON.stringify(langs));
  }, []);

  // Persist translations to localStorage
  const persistTranslations = useCallback((trans: LanguageTranslations) => {
    setTranslations(trans);
    localStorage.setItem(TRANSLATIONS_KEY, JSON.stringify(trans));
  }, []);

  // ── Read ──────────────────────────────────────────────────────

  const getTranslation = useCallback(
    (key: string, langCode: string): string => {
      const val = translations[langCode]?.[key];
      if (val?.trim()) return val;
      // Fallback to English default
      return DEFAULT_ENGLISH_TRANSLATIONS[key]?.englishDefault ?? key;
    },
    [translations]
  );

  const getLanguageCompleteness = useCallback(
    (langCode: string, cubeId?: number): CompletenessInfo =>
      calcCompleteness(translations, langCode, cubeId),
    [translations]
  );

  const getPendingLanguages = useCallback(
    (): LexiconLanguage[] => languages.filter((l) => l.status === "pending"),
    [languages]
  );

  // ── Write ─────────────────────────────────────────────────────

  const updateTranslation = useCallback(
    (langCode: string, key: string, text: string) => {
      setTranslations((prev) => {
        const next = {
          ...prev,
          [langCode]: { ...(prev[langCode] ?? {}), [key]: text },
        };
        localStorage.setItem(TRANSLATIONS_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const bulkUpdateTranslations = useCallback(
    (langCode: string, entries: Record<string, string>) => {
      setTranslations((prev) => {
        const next = {
          ...prev,
          [langCode]: { ...(prev[langCode] ?? {}), ...entries },
        };
        localStorage.setItem(TRANSLATIONS_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const proposeLanguage = useCallback(
    (
      code: string,
      nameEn: string,
      nameNative: string,
      dir: "ltr" | "rtl",
      proposerEmail: string
    ) => {
      const exists = languages.find((l) => l.code === code);
      if (exists) return; // already exists
      const newLang: LexiconLanguage = {
        code,
        nameEn,
        nameNative,
        direction: dir,
        status: "pending",
        proposerEmail,
        proposedAt: new Date().toISOString(),
      };
      persistLanguages([...languages, newLang]);
    },
    [languages, persistLanguages]
  );

  const approveLanguage = useCallback(
    (code: string, approverEmail: string) => {
      persistLanguages(
        languages.map((l) =>
          l.code === code
            ? {
                ...l,
                status: "approved" as const,
                approvedBy: approverEmail,
                approvedAt: new Date().toISOString(),
              }
            : l
        )
      );
    },
    [languages, persistLanguages]
  );

  const rejectLanguage = useCallback(
    (code: string) => {
      persistLanguages(
        languages.map((l) =>
          l.code === code ? { ...l, status: "rejected" as const } : l
        )
      );
    },
    [languages, persistLanguages]
  );

  // ── Active locale ────────────────────────────────────────────

  const setActiveLocale = useCallback((code: string) => {
    setActiveLocaleState(code);
    localStorage.setItem(LOCALE_KEY, code);
  }, []);

  const t = useCallback(
    (key: string): string => getTranslation(key, activeLocale),
    [getTranslation, activeLocale]
  );

  const pinyin = useCallback(
    (key: string): string => {
      if (activeLocale !== "zh" || !pinyinEnabled) return "";
      return PINYIN_MAP[key] ?? "";
    },
    [activeLocale, pinyinEnabled]
  );

  // ── Auth ──────────────────────────────────────────────────────

  const isAdmin = useCallback(
    (email?: string): boolean =>
      !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
    []
  );

  return (
    <LexiconContext.Provider
      value={{
        activeLocale,
        setActiveLocale,
        t,
        pinyinEnabled,
        setPinyinEnabled,
        pinyin,
        languages,
        translations,
        getTranslation,
        getLanguageCompleteness,
        getPendingLanguages,
        updateTranslation,
        bulkUpdateTranslations,
        proposeLanguage,
        approveLanguage,
        rejectLanguage,
        selectedLanguage,
        selectedCube,
        setSelectedLanguage,
        setSelectedCube,
        isAdmin,
      }}
    >
      {children}
    </LexiconContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────

export function useLexicon() {
  const ctx = useContext(LexiconContext);
  if (!ctx) {
    throw new Error("useLexicon must be used within a LexiconProvider");
  }
  return ctx;
}
