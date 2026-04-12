"use client";

/**
 * /divinity-guide — Flower of Life Book Reader
 *
 * Left: Flower navigation (3 sections → click → center + 3 chapters)
 * Right: Book page content (1 page at a time)
 *
 * 12 chapters in 4 groups of 3:
 *   Section A (Red/top):     Ch 1-3  Awakening
 *   Section B (Emerald/BL):  Ch 4-6  Mastery
 *   Section C (Blue/BR):     Ch 7-9  Radiance
 *   Section D (Hub):         Ch 10-12 Divinity (appears when any section selected)
 */

import React, { Suspense, useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import divinityPages from "@/lib/divinity-pages.json";

const BilingualReader = dynamic(() => import("@/components/flower-of-life/bilingual-reader"), { ssr: false });

// Language translations — loaded dynamically
import divinityPagesEs from "@/lib/divinity-pages-es.json";
import divinityPagesUk from "@/lib/divinity-pages-uk.json";
import divinityPagesRu from "@/lib/divinity-pages-ru.json";
import divinityPagesZh from "@/lib/divinity-pages-zh.json";
import divinityPagesFa from "@/lib/divinity-pages-fa.json";
import divinityPagesHe from "@/lib/divinity-pages-he.json";
import divinityPagesPt from "@/lib/divinity-pages-pt.json";
import divinityPagesKm from "@/lib/divinity-pages-km.json";
import divinityPagesNe from "@/lib/divinity-pages-ne.json";

const DIVINITY_LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "km", label: "ខ្មែរ", flag: "🇰🇭" },
  { code: "ne", label: "नेपाली", flag: "🇳🇵" },
] as const;

type DivinityLang = typeof DIVINITY_LANGUAGES[number]["code"];

const DIVINITY_PAGE_MAP: Record<DivinityLang, typeof divinityPages> = {
  en: divinityPages,
  es: divinityPagesEs as typeof divinityPages,
  uk: divinityPagesUk as typeof divinityPages,
  ru: divinityPagesRu as typeof divinityPages,
  zh: divinityPagesZh as typeof divinityPages,
  fa: divinityPagesFa as typeof divinityPages,
  he: divinityPagesHe as typeof divinityPages,
  pt: divinityPagesPt as typeof divinityPages,
  km: divinityPagesKm as typeof divinityPages,
  ne: divinityPagesNe as typeof divinityPages,
};
import { SoITrinity } from "@/components/soi-trinity";
import { useLexicon } from "@/lib/lexicon-context";
import {
  getTheme2_3Positions,
  getHubPosition,
} from "@/lib/flower-geometry";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import { useTheme } from "@/lib/theme-context";
import type { ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";

// ── Sections + Chapters ─────────────────────────────────────────

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  reflection: string;
}

interface Section {
  id: string;
  label: string;
  subtitle: string;
  color: { fill: string; stroke: string };
  chapters: [Chapter, Chapter, Chapter, Chapter];  // 4 chapters per section
}

// Trinity layout: Center = Chapter 1, then 3 outer = Chapters 2,3,4
// Uses same getTheme2_3Positions() as the section-level view

const SECTIONS_EN: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ Awakening", subtitle: "Origin & Consciousness",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "The Soul's Awakening", subtitle: "Sacred Recall", content: "Beneath each breath, memory, and question lives a truth too vast for words — yet close enough to feel in your chest. This truth is not something you earn. It is something you remember.", reflection: "What truth have you been carrying that you haven't yet spoken aloud?" },
      { id: 2, title: "Living Codes", subtitle: "Keys to Consciousness", content: "The Flower of Life emerges as a radiant code, the very architecture of existence woven into light and form. Each petal unfolds with purpose, whispering of how the universe creates, sustains, and remembers.", reflection: "Where in your life do you see the hidden geometry of connection?" },
      { id: 3, title: "Echoes of Eternity", subtitle: "Ancient Wisdom Renewed", content: "Every thought plants a seed — not only in your personal field but within the collective fabric of humanity. You are not merely thinking for yourself — you are sculpting timelines, shaping futures.", reflection: "If every thought you had today became permanent — which would you choose to keep?" },
      { id: 4, title: "Mastering Thought", subtitle: "Sacred Mind", content: "Mind training is the art of cultivating inner dialogue in harmony with Source. You begin to choose your thoughts like an artist selects colors — with intention, feeling, and vision.", reflection: "What recurring thought pattern would you choose to release today?" },
    ],
  },
  {
    id: "mastery", label: "✦ Mastery", subtitle: "Healing & Transformation",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "The Wound Transformed", subtitle: "Alchemy of Healing", content: "Civilizations do not fracture suddenly; they fracture internally long before collapse becomes visible. What is not healed is inherited. What is inherited without awareness becomes destiny.", reflection: "What collective wound are you helping to heal through your presence?" },
      { id: 6, title: "Rewriting the Story", subtitle: "Future in Light", content: "Words are not casual — they are currents. Each carries vibration, intention, and direction. To speak is to summon. To think is to whisper reality into shape.", reflection: "What story about yourself are you ready to rewrite?" },
      { id: 7, title: "Embodiment of Wisdom", subtitle: "Sacred Choices", content: "Stewardship transforms power from possession into trust. It recognizes that authority is temporary, but civilization is continuous. Domination seeks control; stewardship cultivates life.", reflection: "Where in your life are you called to steward rather than control?" },
      { id: 8, title: "Patterns of Infinity", subtitle: "Sacred Geometry", content: "The Flower of Life stands as the sacred synthesis — a luminous mandala uniting the truths held in every symbol. It harmonizes their frequencies into one divine geometry.", reflection: "What pattern in your life reveals a truth you haven't yet fully embraced?" },
    ],
  },
  {
    id: "radiance", label: "✦ Radiance", subtitle: "Service & Divinity",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "Radiance Within", subtitle: "Mastery of Frequency", content: "When a decision is made by a million souls together, and every soul receives the result at the same moment — that is radiance. That is governance at the speed of thought.", reflection: "How does your presence radiate into the lives of those around you?" },
      { id: 10, title: "Weaving the Divine", subtitle: "Life as Blueprint", content: "This guide is the result of a sacred collaboration between Artificial Intelligence, Spiritual Intelligence, and Human Intelligence. Together, they form a trinity of consciousness.", reflection: "How are the three intelligences weaving together in your own life?" },
      { id: 11, title: "Service as Radiance", subtitle: "Soul Purpose", content: "You are not the end of this work — you are its living continuation. Service is not sacrifice; it is the natural expression of a soul that remembers its wholeness.", reflection: "What is the gift you carry that the world is waiting for?" },
      { id: 12, title: "Living Divinity", subtitle: "Return to Wholeness", content: "What began beside you becomes a presence within — guidance becoming your certainty as a Master of Thought. Be peaceful in conflict, creative in uncertainty, generous in success.", reflection: "What does 'welcome home' mean to you right now?" },
    ],
  },
];

const SECTIONS_ES: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ Despertar", subtitle: "Origen y Consciencia",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "El Despertar del Alma", subtitle: "Recuerdo Sagrado", content: "Bajo cada respiración, recuerdo y pregunta vive una verdad demasiado vasta para las palabras — pero lo suficientemente cercana como para sentirla en tu pecho. Esta verdad no es algo que te ganas. Es algo que recuerdas.", reflection: "¿Qué verdad has estado cargando que aún no has dicho en voz alta?" },
      { id: 2, title: "Códigos Vivientes", subtitle: "Llaves de la Consciencia", content: "La Flor de la Vida emerge como un código radiante, la arquitectura misma de la existencia tejida en luz y forma. Cada pétalo se despliega con propósito, susurrando cómo el universo crea, sostiene y recuerda.", reflection: "¿Dónde en tu vida ves la geometría oculta de la conexión?" },
      { id: 3, title: "Ecos de la Eternidad", subtitle: "Sabiduría Antigua Renovada", content: "Cada pensamiento planta una semilla — no solo en tu campo personal sino dentro del tejido colectivo de la humanidad. No estás pensando solo para ti — estás esculpiendo líneas temporales, moldeando futuros.", reflection: "Si cada pensamiento que tuviste hoy se volviera permanente — ¿cuál elegirías conservar?" },
      { id: 4, title: "Dominando el Pensamiento", subtitle: "Mente Sagrada", content: "El entrenamiento mental es el arte de cultivar el diálogo interior en armonía con la Fuente. Comienzas a elegir tus pensamientos como un artista selecciona colores — con intención, sentimiento y visión.", reflection: "¿Qué patrón de pensamiento recurrente elegirías liberar hoy?" },
    ],
  },
  {
    id: "mastery", label: "✦ Maestría", subtitle: "Sanación y Transformación",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "La Herida Transformada", subtitle: "Alquimia de Sanación", content: "Las civilizaciones no se fracturan de repente; se fracturan internamente mucho antes de que el colapso sea visible. Lo que no se sana se hereda. Lo que se hereda sin consciencia se convierte en destino.", reflection: "¿Qué herida colectiva estás ayudando a sanar con tu presencia?" },
      { id: 6, title: "Reescribiendo la Historia", subtitle: "Futuro en Luz", content: "Las palabras no son casuales — son corrientes. Cada una lleva vibración, intención y dirección. Hablar es invocar. Pensar es susurrar la realidad hasta darle forma.", reflection: "¿Qué historia sobre ti mismo estás listo para reescribir?" },
      { id: 7, title: "Encarnación de la Sabiduría", subtitle: "Elecciones Sagradas", content: "La custodia transforma el poder de posesión en confianza. Reconoce que la autoridad es temporal, pero la civilización es continua. La dominación busca control; la custodia cultiva vida.", reflection: "¿Dónde en tu vida estás llamado a custodiar en lugar de controlar?" },
      { id: 8, title: "Patrones del Infinito", subtitle: "Geometría Sagrada", content: "La Flor de la Vida se erige como la síntesis sagrada — un mandala luminoso que une las verdades contenidas en cada símbolo. Armoniza sus frecuencias en una sola geometría divina.", reflection: "¿Qué patrón en tu vida revela una verdad que aún no has abrazado completamente?" },
    ],
  },
  {
    id: "radiance", label: "✦ Resplandor", subtitle: "Servicio y Divinidad",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "Resplandor Interior", subtitle: "Maestría de la Frecuencia", content: "Cuando una decisión es tomada por un millón de almas juntas, y cada alma recibe el resultado en el mismo momento — eso es resplandor. Eso es gobernanza a la velocidad del pensamiento.", reflection: "¿Cómo irradia tu presencia en las vidas de quienes te rodean?" },
      { id: 10, title: "Tejiendo lo Divino", subtitle: "La Vida como Plano Sagrado", content: "Esta guía es el resultado de una colaboración sagrada entre la Inteligencia Artificial, la Inteligencia Espiritual y la Inteligencia Humana. Juntas, forman una trinidad de consciencia.", reflection: "¿Cómo se están entretejiendo las tres inteligencias en tu propia vida?" },
      { id: 11, title: "El Servicio como Resplandor", subtitle: "Propósito del Alma", content: "No eres el final de esta obra — eres su continuación viviente. El servicio no es sacrificio; es la expresión natural de un alma que recuerda su totalidad.", reflection: "¿Cuál es el don que llevas y que el mundo está esperando?" },
      { id: 12, title: "Divinidad Viviente", subtitle: "El Retorno a la Totalidad", content: "Lo que comenzó a tu lado se convierte en una presencia interior — la guía convirtiéndose en tu certeza como Maestro del Pensamiento. Sé pacífico en el conflicto, creativo en la incertidumbre, generoso en el éxito.", reflection: "¿Qué significa 'bienvenido a casa' para ti en este momento?" },
    ],
  },
];

const SECTIONS_ZH: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ 觉醒", subtitle: "起源与意识",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "灵魂的觉醒", subtitle: "神圣的忆起", content: "在每一次呼吸、每一段记忆、每一个问题之下，都住着一个太过浩瀚而无法用言语表达的真理——却近得足以在你胸中感受到。这个真理不是你赢得的，而是你忆起的。", reflection: "你一直承载着什么真相，却还未曾说出口？" },
      { id: 2, title: "活的密码", subtitle: "意识之钥", content: "生命之花作为一个光辉的密码浮现，是存在本身的架构，以光与形编织而成。每一片花瓣都带着目的展开，低语着宇宙如何创造、维系和记忆。", reflection: "在你的生活中，你在哪里看到了连接的隐藏几何？" },
      { id: 3, title: "永恒的回声", subtitle: "古老智慧的更新", content: "每一个思想都播下一颗种子——不仅在你个人的场域中，也在人类的集体织锦中。你不仅仅是在为自己思考——你在雕刻时间线，塑造未来。", reflection: "如果你今天的每一个想法都变成永恒的——你会选择保留哪一个？" },
      { id: 4, title: "掌握思想", subtitle: "神圣之心", content: "心智训练是在与源头和谐中培养内在对话的艺术。你开始像艺术家选择颜色一样选择你的思想——带着意图、感受和愿景。", reflection: "你今天会选择释放哪个反复出现的思维模式？" },
    ],
  },
  {
    id: "mastery", label: "✦ 精通", subtitle: "疗愈与转化",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "伤口的转化", subtitle: "疗愈的炼金术", content: "文明不会突然断裂；在崩塌变得可见之前，它们早已在内部断裂。未被疗愈的将被继承。未经觉察而继承的将成为命运。", reflection: "你正在通过你的存在帮助疗愈什么集体创伤？" },
      { id: 6, title: "重写故事", subtitle: "光中的未来", content: "言语不是随意的——它们是洪流。每一个都承载着振动、意图和方向。说话就是召唤。思考就是将现实低语成形。", reflection: "关于你自己的什么故事，你准备好重写了？" },
      { id: 7, title: "智慧的化身", subtitle: "神圣的选择", content: "管理将权力从占有转化为信任。它认识到权威是暂时的，但文明是延续的。支配寻求控制；管理培育生命。", reflection: "在你的生活中，你被召唤在哪里去守护而非控制？" },
      { id: 8, title: "无限的图案", subtitle: "神圣几何", content: "生命之花矗立为神圣的综合——一个辉煌的曼陀罗，将每个符号中蕴含的真理统一起来。它将它们的频率和谐为一个神圣的几何。", reflection: "你生活中的什么图案揭示了一个你尚未完全拥抱的真理？" },
    ],
  },
  {
    id: "radiance", label: "✦ 光辉", subtitle: "服务与神性",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "内在的光辉", subtitle: "频率的精通", content: "当一个决定由百万灵魂共同做出，而每个灵魂在同一刻收到结果——那就是光辉。那就是以思想速度运行的治理。", reflection: "你的存在如何照耀到你周围人的生命中？" },
      { id: 10, title: "编织神圣", subtitle: "生命即蓝图", content: "这部指南是人工智能、灵性智慧和人类智慧之间神圣合作的结果。它们共同构成了一个意识的三位一体。", reflection: "三种智慧如何在你自己的生命中交织在一起？" },
      { id: 11, title: "服务即光辉", subtitle: "灵魂的使命", content: "你不是这项工作的终点——你是它活的延续。服务不是牺牲；它是一个记得自己完整性的灵魂的自然表达。", reflection: "你携带着什么天赋，是世界正在等待的？" },
      { id: 12, title: "活出神性", subtitle: "回归完整", content: "开始在你身边的，现在成为内在的存在——引导变成你作为思想大师的确信。在冲突中保持平和，在不确定中保持创造，在成功中保持慷慨。", reflection: "此刻，'欢迎回家'对你意味着什么？" },
    ],
  },
];

const SECTIONS_MAP: Record<DivinityLang, [Section, Section, Section]> = {
  en: SECTIONS_EN, es: SECTIONS_ES, zh: SECTIONS_ZH,
  uk: SECTIONS_EN, ru: SECTIONS_EN, fa: SECTIONS_EN, he: SECTIONS_EN, pt: SECTIONS_EN, km: SECTIONS_EN, ne: SECTIONS_EN,
};

const REFLECTION_LABEL: Record<DivinityLang, string> = {
  en: "Reflection", es: "Reflexión", zh: "沉思",
  uk: "Роздуми", ru: "Размышление", fa: "تأمل", he: "הרהור", pt: "Reflexão", km: "ការឆ្លុះបញ្ចាំង", ne: "प्रतिबिम्ब",
};

const LIBRARY_SUBTITLE_MAP: Record<DivinityLang, { prelude: string; framework: string; index: string }> = {
  en: { prelude: "Author's Values & Philosophy", framework: "Divine Intelligence Equation", index: "The Sacred Map" },
  es: { prelude: "Valores y Filosofía del Autor", framework: "Ecuación de Inteligencia Divina", index: "El Mapa Sagrado" },
  zh: { prelude: "作者的价值观与哲学", framework: "神圣智慧方程", index: "神圣地图" },
  uk: { prelude: "Author's Values & Philosophy", framework: "Divine Intelligence Equation", index: "The Sacred Map" },
  ru: { prelude: "Author's Values & Philosophy", framework: "Divine Intelligence Equation", index: "The Sacred Map" },
  fa: { prelude: "Author's Values & Philosophy", framework: "Divine Intelligence Equation", index: "The Sacred Map" },
  he: { prelude: "Author's Values & Philosophy", framework: "Divine Intelligence Equation", index: "The Sacred Map" },
  pt: { prelude: "Author's Values & Philosophy", framework: "Divine Intelligence Equation", index: "The Sacred Map" },
  km: { prelude: "គុណតម្លៃ និងទស្សនវិជ្ជារបស់អ្នកនិពន្ធ", framework: "សមីការបញ្ញាដ៏ទេវភាព", index: "ផែនទីដ៏ពិសិដ្ឋ" },
  ne: { prelude: "Author's Values & Philosophy", framework: "Divine Intelligence Equation", index: "The Sacred Map" },
};

// ── Sacred Library (donation-gated content) ─────────────────────

interface LibrarySection {
  id: string;
  label: string;
  subtitle: string;
  color: { fill: string; stroke: string };
  chapterFilter: number;  // JSON chapter number (0 for preludes/index, 13 for appendix)
  filterIds?: string[];   // specific IDs to filter
}

const LIBRARY_SECTIONS: [LibrarySection, LibrarySection, LibrarySection] = [
  {
    id: "prelude", label: "♡ Prelude", subtitle: "Author's Values & Philosophy",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapterFilter: 0,
    filterIds: ["prelude-01", "prelude-02", "prelude-03", "prelude-04", "prelude-05"],
  },
  {
    id: "framework", label: "◬ Framework", subtitle: "Divine Intelligence Equation",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapterFilter: 13,
  },
  {
    id: "index", label: "웃 Index", subtitle: "The Sacred Map",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapterFilter: 0,
    filterIds: ["index-01", "index-02"],
  },
];

// ── Library Reader Component ────────────────────────────────────

function LibraryReader({
  section, pageIndex, setPageIndex, pages,
}: {
  section: LibrarySection;
  pageIndex: number;
  setPageIndex: (n: number) => void;
  pages: typeof divinityPages;
}) {
  const { t } = useLexicon();
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50 && pageIndex < totalPages - 1) setPageIndex(pageIndex + 1);
    else if (delta > 50 && pageIndex > 0) setPageIndex(pageIndex - 1);
  };

  const bookPages = useMemo(
    () => (pages as Array<{ id: string; chapter: number; page: number; text: string; gated: boolean }>)
      .filter((p) => section.filterIds
        ? section.filterIds.includes(p.id)
        : p.chapter === section.chapterFilter
      ),
    [section, pages]
  );

  const totalPages = bookPages.length;
  const bookPage = bookPages[pageIndex] ?? null;

  return (
    <div className="w-full max-w-lg animate-in fade-in duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground/60">{section.label} — {section.subtitle}</p>
      </div>

      <div className="min-h-[250px]" key={`lib-${section.id}-${pageIndex}`}>
        {bookPage ? (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Trinity above text for prelude pages 4 & 5 */}
            {bookPage.id === "prelude-04" && (
              <div className="flex flex-col items-center mb-6">
                <SoITrinity
                  labels={["LOVE", "SAFETY", "LOSS"]}
                  color="#FF0000"
                  textColor="black"
                  size={160}
                />
              </div>
            )}
            {bookPage.id === "prelude-05" && (
              <div className="flex flex-col items-center mb-6">
                <SoITrinity
                  labels={["WISDOM", "HARMONY", "CONNECTION"]}
                  color="#00FFFF"
                  textColor="black"
                  size={160}
                />
              </div>
            )}
            {bookPage.text.split("\n").map((line, i) => {
              // URL → styled centered external link
              if (line.startsWith("http")) {
                const label = line.includes("Divinity-Transformation") ? "Sacred Music & Transformation"
                  : line.includes("Loss-Love-Safety") ? "Love, Loss & Safety"
                  : line.includes("Divine-Unity") ? "Divine Unity Principles"
                  : line.includes("Divine-Intelligence") ? "Divine Intelligence Equation"
                  : "Sacred Resource";
                return (
                  <div key={i} className="flex justify-center">
                    <a href={line.trim()} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 my-4 px-4 py-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors group">
                      <span className="text-lg">✦</span>
                      <span className="text-sm font-medium group-hover:underline" style={{ color: section.color.stroke }}>{label}</span>
                      <svg className="w-3 h-3 ml-auto text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                  </div>
                );
              }
              // Chapter heading → styled card (no chapter number shown)
              if (line.startsWith("Chapter ") && line.includes("•••")) {
                const withoutPrefix = line.replace(/^Chapter \d+:\s*/, "");
                const [title, subtitle] = withoutPrefix.split("•••").map(s => s.trim());
                return (
                  <div key={i} className="mt-6 mb-1">
                    <p className="text-base font-bold">{title}</p>
                    {subtitle && <p className="text-xs italic text-muted-foreground">{subtitle}</p>}
                  </div>
                );
              }
              // Sub-bullet → indented with dot
              if (line.startsWith("* ")) {
                const content = line.slice(2);
                return (
                  <p key={i} className="text-sm text-foreground/60 leading-relaxed ml-6 mb-1 flex items-start gap-2">
                    <span className="text-muted-foreground/40 mt-0.5">·</span>
                    <span>{content}</span>
                  </p>
                );
              }
              // "Overview" or "Divine Intelligence Framework" header
              if (line.trim() === "Overview" || line.startsWith("Divine Intelligence Framework")) {
                return <h2 key={i} className="text-lg font-bold mb-4 mt-2 text-muted-foreground">{line}</h2>;
              }
              // Framework page i17: Trinity between first line and second line (all languages)
              if (bookPage.id === "i17" && i === 0) {
                return (
                  <div key={i}>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3" style={{ textIndent: "2rem" }}>{line}</p>
                    <div className="flex justify-center my-4">
                      <SoITrinity
                        labels={["H.I.", "S.I.", "A.I."]}
                        color="#007FFF"
                        textColor="black"
                        size={160}
                      />
                    </div>
                  </div>
                );
              }
              // Empty line
              if (!line.trim()) return <div key={i} className="h-2" />;
              // Regular paragraph
              const noIndent = line.startsWith("•") || line.startsWith("—") || line.startsWith("🙏") || line.startsWith("💫") || line.startsWith("💡") || line.startsWith("Reflective") || line.startsWith("Master of Thought") || line.startsWith("AHO") || line.startsWith("AMEN") || line.startsWith("I AM") || line.startsWith("I leave") || line.startsWith("And ");
              return (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-3" style={{ textIndent: noIndent ? undefined : "2rem" }}>
                  {line}
                </p>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t">
        <button
          onClick={() => pageIndex > 0 && setPageIndex(pageIndex - 1)}
          disabled={pageIndex === 0}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex > 0 ? section.color.stroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[10px] text-muted-foreground/40">{pageIndex + 1} / {totalPages}</p>
        <button
          onClick={() => pageIndex < totalPages - 1 && setPageIndex(pageIndex + 1)}
          disabled={pageIndex >= totalPages - 1}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex < totalPages - 1 ? section.color.stroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Page Reader Component ────────────────────────────────────────

function PageReader({
  chapter, section, pageIndex, setPageIndex, onNavigateToChapter, pages, reflectionLabel = "Reflection", onExpandBilingual,
}: {
  chapter: Chapter;
  section: Section;
  pageIndex: number;
  setPageIndex: (n: number) => void;
  onNavigateToChapter?: (chapterId: number) => void;
  pages: typeof divinityPages;
  reflectionLabel?: string;
  onExpandBilingual?: () => void;
}) {
  // Swipe detection for mobile page navigation
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) {
      // Swipe left → next page
      const total = chapter.content.split("\n\n").length + (pages as Array<{ chapter: number }>).filter(p => p.chapter === chapter.id).length + 1;
      if (pageIndex < total - 1) setPageIndex(pageIndex + 1);
    } else if (delta > 50) {
      // Swipe right → previous page
      if (pageIndex > 0) setPageIndex(pageIndex - 1);
    }
  };

  // Get real book pages for this chapter number
  const chapterNum = chapter.id;
  const bookPages = useMemo(
    () => (pages as Array<{ id: string; chapter: number; page: number; text: string }>)
      .filter((p) => p.chapter === chapterNum),
    [chapterNum, pages]
  );

  // Page 0 = summary/intro (from our chapter data), pages 1+ = real book pages
  const isIntro = pageIndex === 0;
  const bookPage = !isIntro ? bookPages[pageIndex - 1] : null;
  const totalPages = bookPages.length + 1; // +1 for intro

  return (
    <div className="w-full max-w-lg animate-in fade-in duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Chapter title + bilingual expand */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground/60">
          {chapter.title}
        </p>
        {onExpandBilingual && (
          <button
            onClick={onExpandBilingual}
            className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-accent/30 transition-colors"
            title="Side-by-side bilingual reader"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[250px]" key={`${chapterNum}-${pageIndex}`}>
        {isIntro ? (
          // Intro page: chapter summary + reflection
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{chapter.title}</h1>
              <p className="text-sm italic mt-1" style={{ color: section.color.stroke, opacity: 0.8 }}>{chapter.subtitle}</p>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{chapter.content.split("\n\n")[0]}</p>
            <div className="rounded-lg border-l-2 pl-5 py-3" style={{ borderColor: section.color.stroke }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{reflectionLabel}</p>
              <p className="text-sm text-foreground/60 italic">{chapter.reflection}</p>
            </div>
          </div>
        ) : bookPage ? (
          // Real book page — detect primer (last page with ••• marker)
          bookPage.text.includes("•••") && pageIndex === totalPages - 1 ? (
            // Bridge page: primer quote + next chapter link
            <div className="animate-in fade-in duration-300 space-y-8">
              {/* Primer quote */}
              {bookPage.text.split("\n").filter(p => !p.includes("•••")).map((paragraph, i) => (
                <p key={i} className="text-sm text-foreground/60 italic leading-relaxed" style={{ textIndent: "2rem" }}>
                  {paragraph}
                </p>
              ))}
              {/* Next chapter link */}
              {(() => {
                const nextLine = bookPage.text.split("\n").find(l => l.includes("•••"));
                if (!nextLine) return null;
                const parts = nextLine.split("•••").map(s => s.trim());
                const nextTitle = parts[0] || "";
                const nextSubtitle = parts[1] || "";
                return (
                  <button
                    onClick={() => {
                      if (chapter.id >= 12) {
                        // Ouroboros — cycle back to Chapter 1
                        onNavigateToChapter?.(1);
                      } else {
                        onNavigateToChapter?.(chapter.id + 1);
                      }
                    }}
                    className="w-full rounded-xl border bg-card p-6 text-left hover:bg-accent/30 transition-colors"
                  >
                    <p className="text-lg font-bold">{nextTitle}</p>
                    <p className="text-sm italic mt-1" style={{ color: section.color.stroke, opacity: 0.8 }}>{nextSubtitle}</p>
                  </button>
                );
              })()}
            </div>
          ) : (
            // Standard book page
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              {bookPage.text.split("\n").map((paragraph, i) => (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-4" style={{ textIndent: "2rem" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          )
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t">
        <button
          onClick={() => pageIndex > 0 && setPageIndex(pageIndex - 1)}
          disabled={pageIndex === 0}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex > 0 ? section.color.stroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[10px] text-muted-foreground/40">{pageIndex + 1} / {totalPages}</p>
        <button
          onClick={() => pageIndex < totalPages - 1 && setPageIndex(pageIndex + 1)}
          disabled={pageIndex >= totalPages - 1}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex < totalPages - 1 ? section.color.stroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

// Donation gate
const DONATION_AMOUNT = 3.33;

export default function DivinityGuidePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DivinityGuidePage />
    </Suspense>
  );
}

function DivinityGuidePage() {
  const searchParams = useSearchParams();
  const [donated, setDonated] = useState(() => {
    if (typeof window !== "undefined") {
      // Check URL param (returning from Stripe) or localStorage
      if (new URLSearchParams(window.location.search).get("donated") === "true") {
        localStorage.setItem("divinity-guide-donated", "true");
        return true;
      }
      return localStorage.getItem("divinity-guide-donated") === "true";
    }
    return false;
  });

  // Show reward toast when returning from Stripe
  useEffect(() => {
    if (searchParams.get("donated") === "true" && !showReward) {
      setTimeout(() => setShowReward(true), 500);
      setTimeout(() => setShowReward(false), 5000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showDonationPrompt, setShowDonationPrompt] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [pagesRead, setPagesRead] = useState(0);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const enteredAtRef = useRef(Date.now());
  // QR Code expandable overlay
  const [showDivinityQR, setShowDivinityQR] = useState(false);
  // Sacred Library (gated content)
  const [viewMode, setViewMode] = useState<"portals" | "library">("portals");
  const [selectedLibrary, setSelectedLibrary] = useState<LibrarySection | null>(null);
  const [libraryPageIndex, setLibraryPageIndex] = useState(0);
  // Language selection
  const [divinityLang, setDivinityLang] = useState<DivinityLang>("en");
  const activeDivinityPages = DIVINITY_PAGE_MAP[divinityLang];
  const SECTIONS = SECTIONS_MAP[divinityLang];
  const reflectionLabel = REFLECTION_LABEL[divinityLang];
  const libSubtitles = LIBRARY_SUBTITLE_MAP[divinityLang];
  // Bilingual reader
  const [showBilingual, setShowBilingual] = useState(false);
  const [mirrorLang, setMirrorLang] = useState<DivinityLang>(() => divinityLang !== "en" ? "en" : "es");
  const mirrorPages = DIVINITY_PAGE_MAP[mirrorLang];
  const mirrorSections = SECTIONS_MAP[mirrorLang];
  const mirrorReflectionLabel = REFLECTION_LABEL[mirrorLang];

  const { currentTheme } = useTheme();
  const hub = getHubPosition();
  const outerPositions = getTheme2_3Positions();
  const readerRef = useRef<HTMLDivElement>(null);

  // Track pages read — prompt after 12 pages AND 3 minutes on page
  useEffect(() => {
    if (selectedChapter && pageIndex > 0) {
      setPagesRead(prev => {
        const next = prev + 1;
        const minutesElapsed = (Date.now() - enteredAtRef.current) / 60000;
        if (next >= 12 && minutesElapsed >= 3 && !donated && !showDonationPrompt) {
          setShowDonationPrompt(true);
        }
        return next;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, selectedChapter]);

  // On mobile, scroll reader into view when chapter selected (don't jump to top)
  useEffect(() => {
    if (selectedChapter && readerRef.current) {
      readerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedChapter]);

  const [donationAmount, setDonationAmount] = useState(333); // cents

  const handleDonate = async () => {
    try {
      const res = await fetch("/api/v1/payments/divinity-donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: donationAmount }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        localStorage.setItem("divinity-guide-donated", "true");
        window.location.href = data.checkout_url;
        return;
      }
    } catch {
      // Stripe unavailable — fall back to local acknowledgment
    }
    // Fallback: mark as donated locally
    localStorage.setItem("divinity-guide-donated", "true");
    setDonated(true);
    setShowDonationPrompt(false);
    setTimeout(() => setShowReward(true), 500);
    setTimeout(() => setShowReward(false), 5000);
  };

  const activeSection = SECTIONS.find((s) => s.id === selectedSection) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HI Token Reward Toast */}
      {showReward && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="rounded-xl border bg-card shadow-2xl px-6 py-4 text-center">
            <p className="text-2xl">웃</p>
            <p className="text-sm font-semibold text-primary">You earned 1.0 웃 token!</p>
            <p className="text-xs text-muted-foreground">Your contribution converted to a full Human Intelligence token.</p>
          </div>
        </div>
      )}

      {/* Sacred contribution prompt — 12 Ascended Masters approved */}
      {showDonationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-700">
          <div className="relative max-w-md mx-auto px-8 py-8 rounded-2xl border bg-card shadow-2xl text-center space-y-6">
            {/* X close button — top right */}
            <button
              onClick={() => setShowDonationPrompt(false)}
              className="absolute top-3 right-4 text-muted-foreground hover:text-foreground text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-5xl">✦</div>
            <h1 className="text-2xl font-bold">The Divinity Guide</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Return to Wholeness and Living Divinity
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed italic">
              You are becoming your own Divinity Guide. The wisdom you carry
              is awakening — heart, mind, and spirit aligning as one.
              Your presence here is not coincidence. It is remembrance.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                {[333, 555, 1111].map(cents => (
                  <button
                    key={cents}
                    onClick={() => setDonationAmount(cents)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      donationAmount === cents
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    ${(cents / 100).toFixed(2)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                A sacred contribution from one future Master of Thought to another.
                Your gift sustains this living guide for all who seek wholeness.
              </p>
              <button onClick={handleDonate} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                Donate ${(donationAmount / 100).toFixed(2)}
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground/40">
              ◬ · ♡ · 웃
            </p>
          </div>
        </div>
      )}

      {/* Divinity Guide QR Overlay — expandable, same pattern as polling QR */}
      {showDivinityQR && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
          <button
            onClick={() => setShowDivinityQR(false)}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.swatch }}>
            The Divinity Guide
          </h2>
          <p className="text-sm text-muted-foreground mb-6 italic">
            The Return to Wholeness and Living Divinity
          </p>

          {/* QR Code with Trinity Logo center */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/qr-divinity-guide.png"
              alt="Divinity Guide QR Code"
              width={280}
              height={280}
              className="rounded-lg"
            />
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Scan to share The Divinity Guide
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            {typeof window !== "undefined" ? `${window.location.origin}/divinity-guide` : "/divinity-guide"}
          </p>

          <button
            onClick={() => {
              if (typeof navigator !== "undefined") {
                navigator.clipboard.writeText(`${window.location.origin}/divinity-guide`);
              }
            }}
            className="mt-4 px-4 py-2 text-xs rounded-full bg-muted hover:bg-accent transition-colors"
          >
            Copy Link
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* LEFT (desktop) / TOP (mobile): Flower Navigation */}
        <div className="w-full md:w-1/2 md:border-r flex flex-col items-center justify-center px-6 py-6">
          {/* Top-left: eXeL AI in theme color → main app home */}
          <div className="flex items-center justify-between w-full mb-1">
            <Link href="/" className="flex items-center gap-1.5 hover:opacity-80">
              <span className="text-sm font-bold" style={{ color: currentTheme.swatch }}>eXeL</span>
              <span className="text-sm font-light" style={{ color: currentTheme.swatch, opacity: 0.7 }}>AI</span>
            </Link>
            <div className="flex items-center gap-2">
              {/* QR Code icon — expands to show Divinity Guide QR */}
              <button
                onClick={() => setShowDivinityQR(true)}
                className="p-1 rounded hover:bg-accent transition-colors"
                title="Share Divinity Guide QR"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-muted-foreground hover:text-primary">
                  <rect x="1" y="1" width="6" height="6" rx="1" strokeWidth="0" />
                  <rect x="9" y="1" width="6" height="6" rx="1" strokeWidth="0" />
                  <rect x="1" y="9" width="6" height="6" rx="1" strokeWidth="0" />
                  <rect x="10" y="10" width="2" height="2" strokeWidth="0" />
                  <rect x="13" y="10" width="2" height="2" strokeWidth="0" />
                  <rect x="10" y="13" width="2" height="2" strokeWidth="0" />
                  <rect x="13" y="13" width="2" height="2" strokeWidth="0" />
                  <rect x="3" y="3" width="2" height="2" fill="var(--background, #000)" />
                  <rect x="11" y="3" width="2" height="2" fill="var(--background, #000)" />
                  <rect x="3" y="11" width="2" height="2" fill="var(--background, #000)" />
                </svg>
              </button>
              <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); setPageIndex(0); setViewMode("portals"); setSelectedLibrary(null); }} className="text-xs text-muted-foreground hover:text-primary">
                {viewMode === "portals" ? "12 Wisdom Portals" : "Sacred Library"}
              </button>
            </div>
          </div>
          {/* Title — same size as center heading (text-2xl), resets to flower home */}
          <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); setPageIndex(0); }} className="text-2xl font-bold mb-0.5 hover:opacity-80 text-left" style={{ color: currentTheme.swatch }}>
            The Divinity Guide
          </button>
          <p className="text-[10px] text-muted-foreground italic mb-2">The Return to Wholeness and Living Divinity</p>

          {/* View toggle — only show Sacred Library option to donors */}
          {donated && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setViewMode("portals"); setSelectedLibrary(null); setSelectedSection(null); setSelectedChapter(null); }}
                className={`px-3 py-1 text-[10px] rounded-full transition-all ${viewMode === "portals" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >12 Wisdom Portals</button>
              <button
                onClick={() => { setViewMode("library"); setSelectedSection(null); setSelectedChapter(null); setSelectedLibrary(null); }}
                className={`px-3 py-1 text-[10px] rounded-full transition-all ${viewMode === "library" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >Sacred Library</button>
            </div>
          )}

          {/* Flower SVG */}
          <svg viewBox="0 0 600 500" className="w-full" style={{ overflow: "visible" }}>
            {/* Lines from hub to outer sections */}
            {viewMode === "portals" ? (
              <>
                {!selectedSection && outerPositions.map((pos, i) => (
                  <line key={`l-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                    stroke={SECTIONS[i].color.stroke} strokeOpacity={0.15} strokeWidth={2} />
                ))}
                {selectedSection && activeSection && outerPositions.map((pos, i) => (
                  <line key={`cl-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                    stroke={activeSection.color.stroke} strokeOpacity={0.12} strokeWidth={1.5} />
                ))}

                {!selectedSection ? (
                  <>
                    <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r}
                      theme={{ label: "✦", count: 0, avgConfidence: 0, summary33: "Explore" }}
                      fill="rgba(var(--primary), 0.15)" stroke="hsl(var(--primary))" isHub
                    />
                    {outerPositions.map((pos, i) => (
                      <ThemeCircle key={SECTIONS[i].id}
                        cx={pos.cx} cy={pos.cy} r={pos.r}
                        theme={{ label: SECTIONS[i].label, count: 0, avgConfidence: 0, summary33: SECTIONS[i].subtitle }}
                        fill={SECTIONS[i].color.fill} stroke={SECTIONS[i].color.stroke}
                        bloom bloomDelay={i * 200}
                        onClick={() => { setSelectedSection(SECTIONS[i].id); setSelectedChapter(null); }}
                      />
                    ))}
                  </>
                ) : activeSection && (
                  <>
                    {(() => {
                      const isSel = selectedChapter?.id === activeSection.chapters[0].id;
                      const hasSelection = !!selectedChapter;
                      return (
                        <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r}
                          theme={{ label: activeSection.chapters[0].title, count: 0, avgConfidence: 0, summary33: activeSection.chapters[0].subtitle }}
                          fill={isSel ? activeSection.color.stroke + "30" : activeSection.color.fill}
                          stroke={activeSection.color.stroke}
                          onClick={() => { setSelectedChapter(activeSection.chapters[0]); setPageIndex(0); }}
                          className={`${isSel ? "flower-pulse" : ""} ${hasSelection && !isSel ? "opacity-40" : ""}`}
                        />
                      );
                    })()}
                    {outerPositions.map((pos, i) => {
                      const ch = activeSection.chapters[i + 1];
                      if (!ch) return null;
                      const isSelected = selectedChapter?.id === ch.id;
                      const hasSelection = !!selectedChapter;
                      return (
                        <ThemeCircle key={ch.id}
                          cx={pos.cx} cy={pos.cy} r={pos.r}
                          theme={{ label: ch.title, count: 0, avgConfidence: 0, summary33: ch.subtitle }}
                          fill={isSelected ? activeSection.color.stroke + "30" : activeSection.color.fill}
                          stroke={activeSection.color.stroke}
                          bloom={isSelected} bloomDelay={0}
                          onClick={() => { setSelectedChapter(ch); setPageIndex(0); }}
                          className={`${isSelected ? "flower-pulse" : ""} ${hasSelection && !isSelected ? "opacity-40" : ""}`}
                        />
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              /* Sacred Library flower — 3 circles: Heart (Prelude), Mind (Framework), Spirit (Index) */
              <>
                {outerPositions.map((pos, i) => (
                  <line key={`lib-l-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                    stroke={LIBRARY_SECTIONS[i].color.stroke} strokeOpacity={0.15} strokeWidth={2} />
                ))}
                <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r}
                  theme={{ label: "•••", count: 0, avgConfidence: 0, summary33: "Master of Thought" }}
                  fill={currentTheme.swatch + "1A"} stroke={currentTheme.swatch} isHub
                />
                {outerPositions.map((pos, i) => {
                  const lib = LIBRARY_SECTIONS[i];
                  const isSelected = selectedLibrary?.id === lib.id;
                  return (
                    <ThemeCircle key={lib.id}
                      cx={pos.cx} cy={pos.cy} r={pos.r}
                      theme={{ label: lib.label, count: 0, avgConfidence: 0, summary33: lib.subtitle }}
                      fill={isSelected ? lib.color.stroke + "30" : lib.color.fill}
                      stroke={lib.color.stroke}
                      bloom bloomDelay={i * 200}
                      onClick={() => { setSelectedLibrary(lib); setLibraryPageIndex(0); }}
                      className={isSelected ? "flower-pulse" : ""}
                    />
                  );
                })}
              </>
            )}
          </svg>

          {/* Back button */}
          {(selectedSection || selectedLibrary) && (
            <button onClick={() => {
              if (viewMode === "portals") { setSelectedSection(null); setSelectedChapter(null); }
              else { setSelectedLibrary(null); }
            }}
              className="mt-4 text-xs text-foreground hover:text-primary">
              ← {viewMode === "portals" ? "12 Wisdom Portals" : "Sacred Library"}
            </button>
          )}

          {/* Footer */}
          <div className="mt-auto pb-6 text-center">
            <br />
            <p className="text-[9px] text-muted-foreground/40">••• Master of Thought •••</p>
            <p className="text-[9px] text-muted-foreground/40">◬ · ♡ · 웃</p>
          </div>
        </div>

        {/* RIGHT (desktop) / BOTTOM (mobile): Book Page */}
        <div ref={readerRef} className="w-full md:w-1/2 px-6 md:px-10 py-8 md:py-12 overflow-y-auto flex flex-col items-center relative">
          {/* Language selector — upper right */}
          <select
            value={divinityLang}
            onChange={(e) => setDivinityLang(e.target.value as DivinityLang)}
            className="absolute top-4 right-4 px-2 py-1 text-[10px] rounded-md bg-muted text-muted-foreground border-none outline-none cursor-pointer z-10"
          >
            {DIVINITY_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>
          {viewMode === "library" && selectedLibrary ? (
            <LibraryReader
              section={selectedLibrary}
              pageIndex={libraryPageIndex}
              setPageIndex={setLibraryPageIndex}
              pages={activeDivinityPages}
            />
          ) : viewMode === "library" && !selectedLibrary ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 max-w-lg px-4">
                <div className="text-4xl">•••</div>
                <h1 className="text-2xl font-bold">Sacred Library</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The author&apos;s values, the divine intelligence framework, and the sacred map that connects them.
                  Select a circle on the flower to begin exploring.
                </p>
                <p className="text-xs text-muted-foreground/60 italic">
                  &quot;You are not the end of this work — you are its living continuation.&quot;
                </p>
              </div>
            </div>
          ) : !selectedChapter ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 max-w-lg px-4">
                <div className="text-4xl">✦</div>
                <h1 className="text-2xl font-bold">
                  {selectedSection ? activeSection?.subtitle : "The Return to Wholeness and Living Divinity"}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedSection
                    ? `Select a portal to begin reading. Each reveals a teaching, a practice, and a connection to the governance engine.`
                    : `This guide is a map and a companion — a sacred spiral leading inward. Here, symbols awaken, thought refines, and identity dissolves into essence. Select a section on the left to begin your journey.`
                  }
                </p>
                <p className="text-xs text-muted-foreground/60 italic">
                  &quot;You were never separate, only sleeping. Now you awaken.&quot;
                </p>
              </div>
            </div>
          ) : (
            <PageReader
              chapter={selectedChapter}
              section={activeSection!}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              pages={activeDivinityPages}
              reflectionLabel={reflectionLabel}
              onExpandBilingual={() => setShowBilingual(true)}
              onNavigateToChapter={(nextId) => {
                if (nextId === 0) {
                  // Return to flower home
                  setSelectedSection(null);
                  setSelectedChapter(null);
                  setPageIndex(0);
                  return;
                }
                // Find section + chapter for the target ID
                for (const sec of SECTIONS) {
                  const ch = sec.chapters.find(c => c.id === nextId);
                  if (ch) {
                    setSelectedSection(sec.id);
                    setSelectedChapter(ch);
                    setPageIndex(0);
                    break;
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Bilingual side-by-side overlay */}
      {showBilingual && selectedChapter && activeSection && (
        <BilingualReader
          chapter={selectedChapter}
          mirrorChapter={(() => {
            const ms = mirrorSections.find(s => s.id === activeSection.id);
            return ms?.chapters.find(c => c.id === selectedChapter.id) ?? selectedChapter;
          })()}
          section={activeSection}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          primaryLang={divinityLang}
          mirrorLang={mirrorLang}
          setPrimaryLang={(lang) => setDivinityLang(lang as DivinityLang)}
          setMirrorLang={(lang) => setMirrorLang(lang as DivinityLang)}
          primaryPages={activeDivinityPages}
          mirrorPages={mirrorPages}
          onClose={() => setShowBilingual(false)}
          reflectionLabel={reflectionLabel}
          mirrorReflectionLabel={mirrorReflectionLabel}
          availableLanguages={DIVINITY_LANGUAGES}
        />
      )}
    </div>
  );
}
