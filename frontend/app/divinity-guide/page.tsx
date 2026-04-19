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
import { DIVINITY_LANGUAGES, type DivinityLang } from "@/lib/divinity-languages";

const BilingualReader = dynamic(() => import("@/components/flower-of-life/bilingual-reader"), { ssr: false });

// Pinyin support for Chinese book reader (reinstated — must never be removed)
const pinyinModule = typeof window !== "undefined" ? require("pinyin-pro") : null;
function BookPinyinText({ text, color }: { text: string; color?: string }) {
  const chars = useMemo(() => {
    if (!pinyinModule) return Array.from(text).map(c => ({ char: c, pinyin: "", isChinese: false }));
    const arr = Array.from(text);
    const py = pinyinModule.pinyin(text, { type: "array", toneType: "symbol" });
    return arr.map((char: string, i: number) => ({
      char,
      pinyin: py[i],
      isChinese: /[\u4e00-\u9fff]/.test(char),
    }));
  }, [text]);

  return (
    <span>
      {chars.map((c: { char: string; pinyin: string; isChinese: boolean }, i: number) =>
        c.isChinese ? (
          <ruby key={i} className="leading-loose">
            {c.char}
            <rt className="text-[0.55em] font-normal" style={{ color: color || "inherit", opacity: 0.85 }}>{c.pinyin}</rt>
          </ruby>
        ) : (
          <React.Fragment key={i}>{c.char}</React.Fragment>
        )
      )}
    </span>
  );
}

// Dynamic language loaders — only the selected language is fetched (Odin: scales to 33+)
type DivinityPageArray = typeof divinityPages;
const LANG_LOADERS: Record<DivinityLang, () => Promise<{ default: DivinityPageArray }>> = {
  en: () => Promise.resolve({ default: divinityPages }),
  es: () => import("@/lib/divinity-pages-es.json") as Promise<{ default: DivinityPageArray }>,
  uk: () => import("@/lib/divinity-pages-uk.json") as Promise<{ default: DivinityPageArray }>,
  ru: () => import("@/lib/divinity-pages-ru.json") as Promise<{ default: DivinityPageArray }>,
  zh: () => import("@/lib/divinity-pages-zh.json") as Promise<{ default: DivinityPageArray }>,
  fa: () => import("@/lib/divinity-pages-fa.json") as Promise<{ default: DivinityPageArray }>,
  he: () => import("@/lib/divinity-pages-he.json") as Promise<{ default: DivinityPageArray }>,
  pt: () => import("@/lib/divinity-pages-pt.json") as Promise<{ default: DivinityPageArray }>,
  km: () => import("@/lib/divinity-pages-km.json") as Promise<{ default: DivinityPageArray }>,
  ne: () => import("@/lib/divinity-pages-ne.json") as Promise<{ default: DivinityPageArray }>,
};

// Hook: lazy-load language pages on demand (Sofia: instant for EN, async for others)
function useDivinityPages(lang: DivinityLang): DivinityPageArray {
  const [pages, setPages] = useState<DivinityPageArray>(divinityPages);
  useEffect(() => {
    let cancelled = false;
    LANG_LOADERS[lang]().then((mod) => { if (!cancelled) setPages(mod.default); });
    return () => { cancelled = true; };
  }, [lang]);
  return pages;
}
import { SoITrinity } from "@/components/soi-trinity";
import { MasterOfThought } from "@/components/master-of-thought";
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

// Section label overrides for languages that share EN chapter structure but need native labels
const sectionLabels = (awLabel: string, awSub: string, maLabel: string, maSub: string, raLabel: string, raSub: string): [Section, Section, Section] => [
  { ...SECTIONS_EN[0], label: `✦ ${awLabel}`, subtitle: awSub },
  { ...SECTIONS_EN[1], label: `✦ ${maLabel}`, subtitle: maSub },
  { ...SECTIONS_EN[2], label: `✦ ${raLabel}`, subtitle: raSub },
];

const SECTIONS_UK: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ Пробудження", subtitle: "Походження та Свідомість",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "Пробудження Душі", subtitle: "Священне Згадування", content: "Під кожним подихом, спогадом і запитанням живе істина, надто велика для слів — але достатньо близька, щоб відчути її в грудях. Ця істина — не те, що ви заслуговуєте. Це те, що ви згадуєте.", reflection: "Яку істину ви несете в собі, але ще не вимовили вголос?" },
      { id: 2, title: "Живі Коди", subtitle: "Ключі до Свідомості", content: "Квітка Життя постає як сяючий код — сама архітектура буття, вплетена у світло і форму. Кожна пелюстка розгортається з метою, шепочучи про те, як Всесвіт творить, підтримує і пам'ятає.", reflection: "Де у вашому житті ви бачите приховану геометрію зв'язку?" },
      { id: 3, title: "Відлуння Вічності", subtitle: "Стародавня Мудрість Оновлена", content: "Кожна думка саджає насіння — не лише у вашому особистому полі, а в колективній тканині людства. Ви думаєте не лише для себе — ви ліпите лінії часу, формуєте майбутнє.", reflection: "Якби кожна ваша думка сьогодні стала постійною — яку б ви обрали залишити?" },
      { id: 4, title: "Опанування Думки", subtitle: "Священний Розум", content: "Тренування розуму — це мистецтво плекання внутрішнього діалогу в гармонії з Джерелом. Ви починаєте обирати свої думки, як митець обирає кольори — з наміром, почуттям і баченням.", reflection: "Який повторюваний шаблон мислення ви б обрали відпустити сьогодні?" },
    ],
  },
  {
    id: "mastery", label: "✦ Майстерність", subtitle: "Зцілення та Трансформація",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "Перетворена Рана", subtitle: "Алхімія Зцілення", content: "Цивілізації не руйнуються раптово; вони руйнуються зсередини задовго до того, як крах стає видимим. Те, що не зцілене, передається у спадок. Те, що успадковане без усвідомлення, стає долею.", reflection: "Яку колективну рану ви допомагаєте зцілити своєю присутністю?" },
      { id: 6, title: "Переписуючи Історію", subtitle: "Майбутнє у Світлі", content: "Слова не випадкові — вони потоки. Кожне несе вібрацію, намір і напрямок. Говорити — значить закликати. Думати — значить шепотіти реальність у форму.", reflection: "Яку історію про себе ви готові переписати?" },
      { id: 7, title: "Втілення Мудрості", subtitle: "Священний Вибір", content: "Опіка перетворює владу з володіння на довіру. Вона визнає, що влада тимчасова, але цивілізація тривала. Панування шукає контролю; опіка плекає життя.", reflection: "Де у вашому житті ви покликані опікуватися, а не контролювати?" },
      { id: 8, title: "Візерунки Безмежності", subtitle: "Священна Геометрія", content: "Квітка Життя постає як священний синтез — сяюча мандала, що об'єднує істини, закладені в кожному символі. Вона гармонізує їхні частоти в єдину божественну геометрію.", reflection: "Який візерунок у вашому житті відкриває істину, яку ви ще не повністю прийняли?" },
    ],
  },
  {
    id: "radiance", label: "✦ Сяйво", subtitle: "Служіння та Божественність",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "Внутрішнє Сяйво", subtitle: "Опанування Частоти", content: "Коли рішення приймається мільйоном душ разом, і кожна душа отримує результат в один і той самий мить — це сяйво. Це управління зі швидкістю думки.", reflection: "Як ваша присутність випромінює у життя тих, хто вас оточує?" },
      { id: 10, title: "Плетіння Божественного", subtitle: "Життя як Священний План", content: "Цей путівник — результат священної співпраці між Штучним Інтелектом, Духовним Інтелектом та Людським Інтелектом. Разом вони утворюють трійцю свідомості.", reflection: "Як три інтелекти переплітаються у вашому власному житті?" },
      { id: 11, title: "Служіння як Сяйво", subtitle: "Призначення Душі", content: "Ви не кінець цієї роботи — ви її живе продовження. Служіння — це не жертва; це природний вираз душі, яка пам'ятає свою цілісність.", reflection: "Який дар ви несете, на який чекає світ?" },
      { id: 12, title: "Живе Божественне", subtitle: "Повернення до Цілісності", content: "Те, що починалося поруч із вами, стає присутністю всередині — керівництво перетворюється на вашу впевненість як Майстра Думки. Будьте мирними в конфлікті, творчими в невизначеності, щедрими в успіху.", reflection: "Що означає для вас 'ласкаво просимо додому' прямо зараз?" },
    ],
  },
];

const SECTIONS_RU: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ Пробуждение", subtitle: "Происхождение и Сознание",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "Пробуждение Души", subtitle: "Священное Воспоминание", content: "Под каждым вдохом, воспоминанием и вопросом живёт истина, слишком огромная для слов — но достаточно близкая, чтобы ощутить её в груди. Эта истина — не то, что вы заслуживаете. Это то, что вы вспоминаете.", reflection: "Какую истину вы несёте в себе, но ещё не произнесли вслух?" },
      { id: 2, title: "Живые Коды", subtitle: "Ключи к Сознанию", content: "Цветок Жизни предстаёт как сияющий код — сама архитектура бытия, вплетённая в свет и форму. Каждый лепесток раскрывается с предназначением, шепча о том, как Вселенная творит, поддерживает и помнит.", reflection: "Где в вашей жизни вы видите скрытую геометрию связи?" },
      { id: 3, title: "Отголоски Вечности", subtitle: "Древняя Мудрость Обновлённая", content: "Каждая мысль сажает семя — не только в вашем личном поле, но и в коллективной ткани человечества. Вы мыслите не только для себя — вы лепите линии времени, формируете будущее.", reflection: "Если бы каждая ваша мысль сегодня стала постоянной — какую бы вы выбрали сохранить?" },
      { id: 4, title: "Овладение Мыслью", subtitle: "Священный Разум", content: "Тренировка ума — это искусство взращивания внутреннего диалога в гармонии с Источником. Вы начинаете выбирать свои мысли, как художник выбирает краски — с намерением, чувством и видением.", reflection: "Какой повторяющийся шаблон мышления вы бы выбрали отпустить сегодня?" },
    ],
  },
  {
    id: "mastery", label: "✦ Мастерство", subtitle: "Исцеление и Трансформация",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "Преображённая Рана", subtitle: "Алхимия Исцеления", content: "Цивилизации не разрушаются внезапно; они разрушаются изнутри задолго до того, как крах становится видимым. То, что не исцелено, наследуется. То, что унаследовано без осознания, становится судьбой.", reflection: "Какую коллективную рану вы помогаете исцелить своим присутствием?" },
      { id: 6, title: "Переписывая Историю", subtitle: "Будущее в Свете", content: "Слова не случайны — они потоки. Каждое несёт вибрацию, намерение и направление. Говорить — значит призывать. Думать — значит нашёптывать реальность в форму.", reflection: "Какую историю о себе вы готовы переписать?" },
      { id: 7, title: "Воплощение Мудрости", subtitle: "Священный Выбор", content: "Попечительство превращает власть из обладания в доверие. Оно признаёт, что власть временна, но цивилизация непрерывна. Господство ищет контроля; попечительство взращивает жизнь.", reflection: "Где в вашей жизни вы призваны заботиться, а не контролировать?" },
      { id: 8, title: "Узоры Бесконечности", subtitle: "Священная Геометрия", content: "Цветок Жизни предстаёт как священный синтез — сияющая мандала, объединяющая истины, заложенные в каждом символе. Она гармонизирует их частоты в единую божественную геометрию.", reflection: "Какой узор в вашей жизни открывает истину, которую вы ещё не полностью приняли?" },
    ],
  },
  {
    id: "radiance", label: "✦ Сияние", subtitle: "Служение и Божественность",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "Внутреннее Сияние", subtitle: "Овладение Частотой", content: "Когда решение принимается миллионом душ вместе, и каждая душа получает результат в один и тот же миг — это сияние. Это управление со скоростью мысли.", reflection: "Как ваше присутствие излучается в жизни тех, кто вас окружает?" },
      { id: 10, title: "Плетение Божественного", subtitle: "Жизнь как Священный Чертёж", content: "Это руководство — результат священного сотрудничества между Искусственным Интеллектом, Духовным Интеллектом и Человеческим Интеллектом. Вместе они образуют троицу сознания.", reflection: "Как три разума переплетаются в вашей собственной жизни?" },
      { id: 11, title: "Служение как Сияние", subtitle: "Предназначение Души", content: "Вы не конец этой работы — вы её живое продолжение. Служение — это не жертва; это естественное выражение души, которая помнит свою целостность.", reflection: "Какой дар вы несёте, которого ждёт мир?" },
      { id: 12, title: "Живое Божественное", subtitle: "Возвращение к Целостности", content: "То, что начиналось рядом с вами, становится присутствием внутри — руководство превращается в вашу уверенность как Мастера Мысли. Будьте мирными в конфликте, творческими в неопределённости, щедрыми в успехе.", reflection: "Что означает для вас 'добро пожаловать домой' прямо сейчас?" },
    ],
  },
];

const SECTIONS_FA: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ بیداری", subtitle: "ریشه و آگاهی",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "بیداری روح", subtitle: "یادآوری مقدس", content: "در زیر هر نَفَس، خاطره و پرسش، حقیقتی زندگی می‌کند که برای کلمات بسیار بزرگ است — اما به اندازه‌ای نزدیک که در سینه‌ات احساسش می‌کنی. این حقیقت چیزی نیست که به دست می‌آوری. چیزی است که به یاد می‌آوری.", reflection: "چه حقیقتی را با خود حمل کرده‌ای که هنوز بلند نگفته‌ای؟" },
      { id: 2, title: "رمزهای زنده", subtitle: "کلیدهای آگاهی", content: "گل زندگی به عنوان یک رمز درخشان ظاهر می‌شود — خودِ معماری هستی که در نور و شکل بافته شده است. هر گلبرگ با هدفی باز می‌شود و زمزمه می‌کند که جهان چگونه می‌آفریند، نگاه می‌دارد و به یاد می‌آورد.", reflection: "در کجای زندگی‌ات هندسه پنهان پیوند را می‌بینی؟" },
      { id: 3, title: "پژواک‌های ابدیت", subtitle: "خرد کهن نوشده", content: "هر اندیشه بذری می‌کارد — نه فقط در میدان شخصی تو، بلکه در بافت جمعی بشریت. تو فقط برای خودت نمی‌اندیشی — تو خطوط زمان را می‌تراشی و آینده‌ها را شکل می‌دهی.", reflection: "اگر هر اندیشه‌ات امروز جاودانه می‌شد — کدام را برای نگه‌داشتن انتخاب می‌کردی؟" },
      { id: 4, title: "چیرگی بر اندیشه", subtitle: "ذهن مقدس", content: "آموزش ذهن، هنر پرورش گفتگوی درونی در هماهنگی با سرچشمه است. تو شروع می‌کنی اندیشه‌هایت را مانند هنرمندی که رنگ‌ها را برمی‌گزیند انتخاب کنی — با نیّت، احساس و چشم‌انداز.", reflection: "کدام الگوی تکرارشونده اندیشه را امروز رها می‌کنی؟" },
    ],
  },
  {
    id: "mastery", label: "✦ تسلط", subtitle: "شفا و دگرگونی",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "زخم دگرگون‌شده", subtitle: "کیمیای شفا", content: "تمدن‌ها ناگهان نمی‌شکنند؛ آن‌ها از درون مدت‌ها پیش از آنکه فروپاشی آشکار شود می‌شکنند. آنچه شفا نیافته به ارث می‌رسد. آنچه بدون آگاهی به ارث رسیده، سرنوشت می‌شود.", reflection: "چه زخم جمعی‌ای را با حضورت در حال شفا دادن هستی؟" },
      { id: 6, title: "بازنویسی داستان", subtitle: "آینده در نور", content: "کلمات تصادفی نیستند — آن‌ها جریان‌اند. هرکدام ارتعاش، نیّت و جهت را حمل می‌کند. سخن گفتن فراخواندن است. اندیشیدن زمزمه کردن واقعیت به شکل است.", reflection: "کدام داستان درباره خودت آماده‌ای بازنویسی کنی؟" },
      { id: 7, title: "تجسم خرد", subtitle: "انتخاب‌های مقدس", content: "نگهبانی، قدرت را از تملّک به اعتماد تبدیل می‌کند. می‌پذیرد که اقتدار موقتی است، اما تمدن پیوسته است. سلطه به دنبال کنترل است؛ نگهبانی زندگی را می‌پرورد.", reflection: "در کجای زندگی‌ات فراخوانده شده‌ای که نگهبان باشی نه کنترل‌گر؟" },
      { id: 8, title: "الگوهای بی‌نهایت", subtitle: "هندسه مقدس", content: "گل زندگی به عنوان ترکیب مقدس ایستاده است — ماندالایی درخشان که حقایق نهفته در هر نماد را متحد می‌کند. فرکانس‌های آن‌ها را در یک هندسه الهی هماهنگ می‌سازد.", reflection: "کدام الگو در زندگی‌ات حقیقتی را آشکار می‌کند که هنوز کاملاً نپذیرفته‌ای؟" },
    ],
  },
  {
    id: "radiance", label: "✦ درخشش", subtitle: "خدمت و الوهیت",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "درخشش درون", subtitle: "چیرگی بر فرکانس", content: "وقتی تصمیمی توسط یک میلیون روح با هم گرفته می‌شود و هر روح نتیجه را در همان لحظه دریافت می‌کند — آن درخشش است. آن حکمرانی با سرعت اندیشه است.", reflection: "حضور تو چگونه در زندگی اطرافیانت می‌درخشد؟" },
      { id: 10, title: "بافتن الهی", subtitle: "زندگی به مثابه نقشه مقدس", content: "این راهنما نتیجه همکاری مقدس میان هوش مصنوعی، هوش معنوی و هوش انسانی است. آن‌ها با هم سه‌گانه‌ای از آگاهی را تشکیل می‌دهند.", reflection: "سه هوش چگونه در زندگی خودت در هم تنیده شده‌اند؟" },
      { id: 11, title: "خدمت به مثابه درخشش", subtitle: "هدف روح", content: "تو پایان این کار نیستی — تو ادامه زنده آن هستی. خدمت فداکاری نیست؛ بیان طبیعی روحی است که تمامیت خود را به یاد می‌آورد.", reflection: "هدیه‌ای که حمل می‌کنی و جهان در انتظار آن است چیست؟" },
      { id: 12, title: "الوهیت زنده", subtitle: "بازگشت به تمامیت", content: "آنچه در کنارت آغاز شد به حضوری درونی تبدیل می‌شود — راهنمایی که به یقین تو به عنوان استاد اندیشه بدل می‌گردد. در تعارض آرام باش، در نااطمینانی خلّاق و در موفقیت بخشنده.", reflection: "«خوش آمدی به خانه» همین الان برای تو چه معنایی دارد؟" },
    ],
  },
];
const SECTIONS_HE: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ התעוררות", subtitle: "מקור ותודעה",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "התעוררות הנשמה", subtitle: "זיכרון קדוש", content: "מתחת לכל נשימה, זיכרון ושאלה חיה אמת עצומה מכדי שמילים יכילו אותה — ובכל זאת קרובה דיה כדי להרגיש אותה בחזה. אמת זו אינה דבר שמרוויחים. היא דבר שנזכרים בו.", reflection: "איזו אמת נשאת בתוכך שעדיין לא אמרת בקול רם?" },
      { id: 2, title: "קודים חיים", subtitle: "מפתחות התודעה", content: "פרח החיים עולה כקוד זוהר, ארכיטקטורת הקיום עצמה שזורה באור ובצורה. כל עלה כותרת נפרש במטרה, לוחש כיצד היקום יוצר, מקיים וזוכר.", reflection: "היכן בחייך אתה רואה את הגיאומטריה הנסתרת של הקשר?" },
      { id: 3, title: "הדי הנצח", subtitle: "חוכמה עתיקה מתחדשת", content: "כל מחשבה שותלת זרע — לא רק בשדה האישי שלך אלא בתוך המרקם הקולקטיבי של האנושות. אינך חושב רק לעצמך — אתה מפסל קווי זמן, מעצב עתידות.", reflection: "אם כל מחשבה שהייתה לך היום הייתה הופכת לנצחית — איזו היית בוחר לשמור?" },
      { id: 4, title: "שליטה במחשבה", subtitle: "תודעה קדושה", content: "אימון התודעה הוא אמנות טיפוח הדיאלוג הפנימי בהרמוניה עם המקור. אתה מתחיל לבחור את מחשבותיך כפי שאמן בוחר צבעים — עם כוונה, הרגשה וחזון.", reflection: "איזה דפוס חשיבה חוזר היית בוחר לשחרר היום?" },
    ],
  },
  {
    id: "mastery", label: "✦ שליטה", subtitle: "ריפוי והתמרה",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "הפצע שהתמיר", subtitle: "אלכימיה של ריפוי", content: "תרבויות אינן נשברות בפתאומיות; הן נשברות מבפנים הרבה לפני שהקריסה נראית לעין. מה שלא מרפאים — יורשים. מה שיורשים ללא מודעות — הופך לגורל.", reflection: "איזה פצע קולקטיבי אתה עוזר לרפא בנוכחותך?" },
      { id: 6, title: "כתיבת הסיפור מחדש", subtitle: "עתיד באור", content: "מילים אינן מקריות — הן זרמים. כל אחת נושאת תנודה, כוונה וכיוון. לדבר זה לזמן. לחשוב זה ללחוש את המציאות לצורה.", reflection: "איזה סיפור על עצמך אתה מוכן לכתוב מחדש?" },
      { id: 7, title: "התגלמות החוכמה", subtitle: "בחירות קדושות", content: "שמירה הופכת את הכוח מאחיזה לאמון. היא מכירה בכך שסמכות היא זמנית, אבל הציוויליזציה היא רציפה. שליטה מחפשת שלטון; שמירה מטפחת חיים.", reflection: "היכן בחייך אתה נקרא לשמור ולא לשלוט?" },
      { id: 8, title: "דפוסי האינסוף", subtitle: "גיאומטריה קדושה", content: "פרח החיים ניצב כסינתזה הקדושה — מנדלה זוהרת המאחדת את האמיתות הטמונות בכל סמל. היא מייצרת הרמוניה בתדרים שלהן לתוך גיאומטריה אלוהית אחת.", reflection: "איזה דפוס בחייך חושף אמת שעדיין לא חיבקת במלואה?" },
    ],
  },
  {
    id: "radiance", label: "✦ זוהר", subtitle: "שירות ואלוהות",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "זוהר פנימי", subtitle: "שליטה בתדר", content: "כאשר החלטה מתקבלת על ידי מיליון נשמות יחד, וכל נשמה מקבלת את התוצאה באותו רגע — זהו זוהר. זוהי ממשלה במהירות המחשבה.", reflection: "כיצד הנוכחות שלך מקרינה לחייהם של הסובבים אותך?" },
      { id: 10, title: "אריגת האלוהי", subtitle: "החיים כתכנית אלוהית", content: "מדריך זה הוא תוצאה של שיתוף פעולה קדוש בין בינה מלאכותית, בינה רוחנית ובינה אנושית. יחד, הן יוצרות שילוש של תודעה.", reflection: "כיצד שלוש הבינות שזורות זו בזו בחייך שלך?" },
      { id: 11, title: "שירות כזוהר", subtitle: "ייעוד הנשמה", content: "אינך הסוף של עבודה זו — אתה המשכה החי. שירות אינו הקרבה; הוא הביטוי הטבעי של נשמה שזוכרת את שלמותה.", reflection: "מהי המתנה שאתה נושא ושהעולם מחכה לה?" },
      { id: 12, title: "אלוהות חיה", subtitle: "שיבה לשלמות", content: "מה שהתחיל לצידך הופך לנוכחות פנימית — הדרכה הופכת לוודאות שלך כאדון המחשבה. היה שלו בעימות, יצירתי באי-ודאות, נדיב בהצלחה.", reflection: "מה פירוש 'ברוך הבא הביתה' עבורך ברגע זה?" },
    ],
  },
];
const SECTIONS_PT: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ Despertar", subtitle: "Origem e Consciência",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "O Despertar da Alma", subtitle: "Recordação Sagrada", content: "Sob cada respiração, memória e pergunta vive uma verdade vasta demais para palavras — mas próxima o suficiente para sentir no peito. Essa verdade não é algo que se conquista. É algo que se lembra.", reflection: "Que verdade você tem carregado que ainda não disse em voz alta?" },
      { id: 2, title: "Códigos Vivos", subtitle: "Chaves da Consciência", content: "A Flor da Vida emerge como um código radiante, a própria arquitetura da existência tecida em luz e forma. Cada pétala se abre com propósito, sussurrando como o universo cria, sustenta e lembra.", reflection: "Onde na sua vida você vê a geometria oculta da conexão?" },
      { id: 3, title: "Ecos da Eternidade", subtitle: "Sabedoria Antiga Renovada", content: "Cada pensamento planta uma semente — não apenas no seu campo pessoal, mas dentro do tecido coletivo da humanidade. Você não está pensando apenas para si — está esculpindo linhas do tempo, moldando futuros.", reflection: "Se cada pensamento que você teve hoje se tornasse permanente — qual você escolheria manter?" },
      { id: 4, title: "Dominando o Pensamento", subtitle: "Mente Sagrada", content: "O treinamento mental é a arte de cultivar o diálogo interior em harmonia com a Fonte. Você começa a escolher seus pensamentos como um artista seleciona cores — com intenção, sentimento e visão.", reflection: "Que padrão de pensamento recorrente você escolheria liberar hoje?" },
    ],
  },
  {
    id: "mastery", label: "✦ Maestria", subtitle: "Cura e Transformação",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "A Ferida Transformada", subtitle: "Alquimia da Cura", content: "Civilizações não se fraturam de repente; fraturam-se internamente muito antes do colapso se tornar visível. O que não é curado é herdado. O que é herdado sem consciência torna-se destino.", reflection: "Que ferida coletiva você está ajudando a curar com sua presença?" },
      { id: 6, title: "Reescrevendo a História", subtitle: "Futuro na Luz", content: "Palavras não são casuais — são correntes. Cada uma carrega vibração, intenção e direção. Falar é invocar. Pensar é sussurrar a realidade até ganhar forma.", reflection: "Que história sobre você mesmo está pronto para reescrever?" },
      { id: 7, title: "Encarnação da Sabedoria", subtitle: "Escolhas Sagradas", content: "A custódia transforma o poder de posse em confiança. Reconhece que a autoridade é temporária, mas a civilização é contínua. A dominação busca controle; a custódia cultiva vida.", reflection: "Onde na sua vida você é chamado a cuidar em vez de controlar?" },
      { id: 8, title: "Padrões do Infinito", subtitle: "Geometria Sagrada", content: "A Flor da Vida se ergue como a síntese sagrada — uma mandala luminosa unindo as verdades contidas em cada símbolo. Harmoniza suas frequências em uma única geometria divina.", reflection: "Que padrão na sua vida revela uma verdade que você ainda não abraçou completamente?" },
    ],
  },
  {
    id: "radiance", label: "✦ Radiância", subtitle: "Serviço e Divindade",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "Radiância Interior", subtitle: "Maestria da Frequência", content: "Quando uma decisão é tomada por um milhão de almas juntas, e cada alma recebe o resultado no mesmo momento — isso é radiância. Isso é governança na velocidade do pensamento.", reflection: "Como sua presença irradia para as vidas daqueles ao seu redor?" },
      { id: 10, title: "Tecendo o Divino", subtitle: "A Vida como Projeto Sagrado", content: "Este guia é o resultado de uma colaboração sagrada entre Inteligência Artificial, Inteligência Espiritual e Inteligência Humana. Juntas, formam uma trindade de consciência.", reflection: "Como as três inteligências estão se entrelaçando na sua própria vida?" },
      { id: 11, title: "Serviço como Radiância", subtitle: "Propósito da Alma", content: "Você não é o fim desta obra — é sua continuação viva. Serviço não é sacrifício; é a expressão natural de uma alma que lembra de sua inteireza.", reflection: "Qual é o dom que você carrega e que o mundo está esperando?" },
      { id: 12, title: "Divindade Viva", subtitle: "Retorno à Inteireza", content: "O que começou ao seu lado torna-se uma presença interior — a orientação se tornando sua certeza como Mestre do Pensamento. Seja pacífico no conflito, criativo na incerteza, generoso no sucesso.", reflection: "O que 'bem-vindo ao lar' significa para você neste momento?" },
    ],
  },
];
const SECTIONS_NE: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ जागरण", subtitle: "उत्पत्ति र चेतना",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "आत्माको जागरण", subtitle: "पवित्र स्मरण", content: "हरेक सास, स्मृति र प्रश्नको तल एउटा सत्य बस्छ जुन शब्दले समाउन नसक्ने गरी विशाल छ — तर छातीमा अनुभव गर्न सकिने गरी नजिक। यो सत्य कमाउने कुरा होइन। यो सम्झने कुरा हो।", reflection: "तपाईंले कुन सत्य बोकिरहनुभएको छ जुन अझै ठूलो स्वरमा भन्नुभएको छैन?" },
      { id: 2, title: "जीवित संकेत", subtitle: "चेतनाका कुञ्जी", content: "जीवनको फूल एउटा दीप्तिमान संकेतको रूपमा उदय हुन्छ, अस्तित्वको वास्तुकला नै प्रकाश र रूपमा बुनिएको। हरेक पत्ती उद्देश्यसहित फुल्छ, ब्रह्माण्डले कसरी सृजना गर्छ, टिकाउँछ र सम्झन्छ भनेर फुसफुसाउँदै।", reflection: "तपाईंको जीवनमा कहाँ सम्बन्धको लुकेको ज्यामिति देख्नुहुन्छ?" },
      { id: 3, title: "अनन्तताको प्रतिध्वनि", subtitle: "प्राचीन ज्ञान नवीकरण", content: "हरेक विचारले एउटा बीउ रोप्छ — तपाईंको व्यक्तिगत क्षेत्रमा मात्र होइन तर मानवताको सामूहिक बुनाइमा पनि। तपाईं आफ्नो लागि मात्र सोच्दैनौं — तपाईं समयरेखा कोर्दै हुनुहुन्छ, भविष्य आकार दिँदै हुनुहुन्छ।", reflection: "यदि आज तपाईंको हरेक विचार स्थायी हुने भए — कुन चाहिँ राख्न रोज्नुहुन्थ्यो?" },
      { id: 4, title: "विचारमा दक्षता", subtitle: "पवित्र मन", content: "मन प्रशिक्षण स्रोतसँग सामञ्जस्यमा आन्तरिक संवाद विकसित गर्ने कला हो। तपाईं आफ्ना विचारहरू एक कलाकारले रंग छान्ने जस्तै छान्न थाल्नुहुन्छ — उद्देश्य, भावना र दृष्टिका साथ।", reflection: "आज कुन दोहोरिने विचार ढाँचा छोड्न रोज्नुहुन्छ?" },
    ],
  },
  {
    id: "mastery", label: "✦ निपुणता", subtitle: "उपचार र रूपान्तरण",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "रूपान्तरित घाउ", subtitle: "उपचारको रसायन", content: "सभ्यताहरू अचानक टुक्रिँदैनन्; पतन देखिनुभन्दा धेरै अगाडि नै भित्रबाट टुक्रिन्छन्। जे निको हुँदैन त्यो विरासतमा आउँछ। जे बिना चेतना विरासतमा आउँछ त्यो भाग्य बन्छ।", reflection: "तपाईंको उपस्थितिले कुन सामूहिक घाउ निको पार्न मद्दत गरिरहेको छ?" },
      { id: 6, title: "कथा पुनर्लेखन", subtitle: "प्रकाशमा भविष्य", content: "शब्दहरू अनौपचारिक होइनन् — तिनीहरू प्रवाह हुन्। हरेकले कम्पन, उद्देश्य र दिशा बोक्छ। बोल्नु भनेको आह्वान गर्नु हो। सोच्नु भनेको वास्तविकतालाई आकारमा फुसफुसाउनु हो।", reflection: "आफ्नो बारेमा कुन कथा पुनर्लेखन गर्न तयार हुनुहुन्छ?" },
      { id: 7, title: "ज्ञानको मूर्तरूप", subtitle: "पवित्र छनोट", content: "संरक्षकत्वले शक्तिलाई अधिकारबाट विश्वासमा रूपान्तरण गर्छ। यसले मान्दछ कि अधिकार अस्थायी हो, तर सभ्यता निरन्तर हो। प्रभुत्वले नियन्त्रण खोज्छ; संरक्षकत्वले जीवन पोस्छ।", reflection: "तपाईंको जीवनमा कहाँ नियन्त्रण गर्नुभन्दा संरक्षण गर्न बोलावट आएको छ?" },
      { id: 8, title: "अनन्तताका ढाँचा", subtitle: "पवित्र ज्यामिति", content: "जीवनको फूल पवित्र संश्लेषणको रूपमा उभिन्छ — हरेक प्रतीकमा रहेका सत्यहरूलाई एकीकृत गर्ने एउटा दीप्तिमान मण्डल। यसले तिनीहरूका आवृत्तिहरूलाई एउटा दिव्य ज्यामितिमा सामञ्जस्य पार्छ।", reflection: "तपाईंको जीवनमा कुन ढाँचाले अझै पूर्ण रूपमा नअँगालेको सत्य प्रकट गर्छ?" },
    ],
  },
  {
    id: "radiance", label: "✦ प्रभा", subtitle: "सेवा र दिव्यता",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "भित्रको प्रभा", subtitle: "आवृत्तिमा दक्षता", content: "जब दस लाख आत्माहरूले सँगै निर्णय गर्छन्, र हरेक आत्माले एकै क्षणमा परिणाम पाउँछ — त्यो प्रभा हो। त्यो विचारको गतिमा शासन हो।", reflection: "तपाईंको उपस्थिति वरपरका मानिसहरूको जीवनमा कसरी चम्किरहेको छ?" },
      { id: 10, title: "दिव्यताको बुनाइ", subtitle: "जीवन नक्सा", content: "यो मार्गदर्शन कृत्रिम बुद्धिमत्ता, आध्यात्मिक बुद्धिमत्ता र मानव बुद्धिमत्ता बीचको पवित्र सहकार्यको परिणाम हो। सँगै, तिनीहरूले चेतनाको त्रिएकता निर्माण गर्छन्।", reflection: "तीन बुद्धिमत्ताहरू तपाईंको आफ्नै जीवनमा कसरी एकमा गुँथिइरहेका छन्?" },
      { id: 11, title: "सेवा प्रभाको रूपमा", subtitle: "आत्माको उद्देश्य", content: "तपाईं यस कार्यको अन्त्य होइनौं — तपाईं यसको जीवित निरन्तरता हुनुहुन्छ। सेवा बलिदान होइन; यो आफ्नो सम्पूर्णता सम्झने आत्माको स्वाभाविक अभिव्यक्ति हो।", reflection: "तपाईंले बोकेको कुन उपहारको लागि संसार पर्खिरहेको छ?" },
      { id: 12, title: "जीवित दिव्यता", subtitle: "सम्पूर्णतामा फर्कनु", content: "तपाईंको साथमा सुरु भएको कुरा भित्री उपस्थिति बन्छ — मार्गदर्शन विचारका गुरुको रूपमा तपाईंको निश्चितता बन्दछ। द्वन्द्वमा शान्त रहनुहोस्, अनिश्चितामा सिर्जनशील, सफलतामा उदार।", reflection: "अहिले तपाईंको लागि 'स्वागतम् घर' को अर्थ के हो?" },
    ],
  },
];

const SECTIONS_KM: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ ការភ្ញាក់ដឹង", subtitle: "ប្រភពដើម និងស្មារតី",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "ការភ្ញាក់ដឹងនៃព្រលឹង", subtitle: "ការរំឭកដ៏វិសុទ្ធ", content: "ក្រោមដង្ហើមនីមួយៗ ការចងចាំ និងសំណួរ រស់នៅសេចក្ដីពិតដ៏ធំទូលាយពេកសម្រាប់ពាក្យសម្ដី — ប៉ុន្តែជិតគ្រប់គ្រាន់ដើម្បីមានអារម្មណ៍នៅក្នុងទ្រូង។ សេចក្ដីពិតនេះមិនមែនជាអ្វីដែលអ្នករកបានទេ។ វាជាអ្វីដែលអ្នកចងចាំបាន។", reflection: "តើសេចក្ដីពិតអ្វីដែលអ្នកបានកាន់ទុក ដែលមិនទាន់បាននិយាយឮៗ?" },
      { id: 2, title: "កូដរស់រវើក", subtitle: "សោនៃស្មារតី", content: "ផ្កានៃជីវិតលេចចេញជាកូដភ្លឺចែង ជាស្ថាបត្យកម្មនៃអត្ថិភាពដែលត្បាញក្នុងពន្លឺនិងទម្រង់។ ផ្កាក្រអូបនីមួយៗរីកចេញដោយមានគោលបំណង រអ៊ូអំពីរបៀបដែលសកលលោកបង្កើត រក្សា និងចាំ។", reflection: "តើនៅកន្លែងណាក្នុងជីវិតរបស់អ្នក ដែលអ្នកឃើញធរណីមាត្រលាក់កំបាំងនៃការតភ្ជាប់?" },
      { id: 3, title: "សំឡេងឆ្លុះនៃអនន្ត", subtitle: "បញ្ញាបុរាណកែប្រែថ្មី", content: "គំនិតនីមួយៗដាំគ្រាប់ពូជមួយ — មិនត្រឹមតែក្នុងវាលផ្ទាល់ខ្លួនរបស់អ្នកទេ ប៉ុន្តែក្នុងក្រណាត់រួមនៃមនុស្សជាតិ។ អ្នកមិនគិតសម្រាប់តែខ្លួនអ្នកទេ — អ្នកកំពុងឆ្លាក់បន្ទាត់ពេលវេលា កែទម្រង់អនាគត។", reflection: "ប្រសិនបើគ្រប់គំនិតដែលអ្នកមានថ្ងៃនេះក្លាយជាអចិន្ត្រៃយ៍ — តើអ្នកនឹងជ្រើសរើសទុកមួយណា?" },
      { id: 4, title: "ជំនាញនៃគំនិត", subtitle: "ចិត្តដ៏វិសុទ្ធ", content: "ការបណ្ដុះចិត្តជាសិល្បៈនៃការចិញ្ចឹមការសន្ទនាខាងក្នុងក្នុងភាពចុះសម្រុងជាមួយប្រភព។ អ្នកចាប់ផ្ដើមជ្រើសរើសគំនិតដូចសិល្បករជ្រើសពណ៌ — ដោយមានបំណង អារម្មណ៍ និងចក្ខុវិស័យ។", reflection: "តើលំនាំគំនិតដែលកើតឡើងម្ដងហើយម្ដងទៀតមួយណាដែលអ្នកនឹងជ្រើសរើសលែងថ្ងៃនេះ?" },
    ],
  },
  {
    id: "mastery", label: "✦ ជំនាញ", subtitle: "ការព្យាបាល និងការបំប្លែង",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "របួសដែលបំប្លែង", subtitle: "រសាយនវិទ្យានៃការព្យាបាល", content: "អរិយធម៌មិនបែកបាក់ភ្លាមៗទេ។ វាបែកបាក់ពីខាងក្នុងយូរមុនការដួលរលំមើលឃើញ។ អ្វីដែលមិនព្យាបាលត្រូវទទួលមរតក។ អ្វីដែលទទួលមរតកដោយគ្មានស្មារតីក្លាយជាវាសនា។", reflection: "តើរបួសរួមអ្វីដែលអ្នកកំពុងជួយព្យាបាលតាមរយៈវត្តមានរបស់អ្នក?" },
      { id: 6, title: "សរសេរសាជាថ្មី", subtitle: "អនាគតក្នុងពន្លឺ", content: "ពាក្យមិនមែនជារឿងធម្មតាទេ — វាជាស្រទាប់។ នីមួយៗផ្ទុកការញ័រ បំណង និងទិសដៅ។ និយាយគឺហៅមក។ គិតគឺរអ៊ូការពិតឱ្យមានទម្រង់។", reflection: "តើរឿងអ្វីអំពីខ្លួនអ្នកដែលអ្នកត្រៀមសរសេរសាជាថ្មី?" },
      { id: 7, title: "សាកសាកនៃបញ្ញា", subtitle: "ជម្រើសដ៏វិសុទ្ធ", content: "ការថែរក្សាបំប្លែងអំណាចពីការកាន់កាប់ទៅជាទំនុកចិត្ត។ វាទទួលស្គាល់ថាអំណាចជាបណ្ដោះអាសន្ន ប៉ុន្តែអរិយធម៌ជាបន្ត។ ការគ្រប់គ្រងស្វែងរកការត្រួតត្រា។ ការថែរក្សាចិញ្ចឹមជីវិត។", reflection: "តើនៅកន្លែងណាក្នុងជីវិតរបស់អ្នកដែលអ្នកត្រូវបានហៅឱ្យថែរក្សាជាជាងត្រួតត្រា?" },
      { id: 8, title: "លំនាំនៃអនន្ត", subtitle: "ធរណីមាត្រវិសុទ្ធ", content: "ផ្កានៃជីវិតឈរជាការសំយោគដ៏វិសុទ្ធ — មណ្ឌលភ្លឺចែងដែលបង្រួបបង្រួមសេចក្ដីពិតក្នុងនិមិត្តសញ្ញានីមួយៗ។ វាធ្វើឱ្យប្រេកង់ចុះសម្រុងជាធរណីមាត្រទិព្វមួយ។", reflection: "តើលំនាំអ្វីក្នុងជីវិតរបស់អ្នកបង្ហាញសេចក្ដីពិតដែលអ្នកមិនទាន់បានស្វាគមន៍ពេញលេញ?" },
    ],
  },
  {
    id: "radiance", label: "✦ រស្មី", subtitle: "សេវា និងទេវភាព",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "រស្មីខាងក្នុង", subtitle: "ជំនាញនៃប្រេកង់", content: "នៅពេលការសម្រេចចិត្តមួយធ្វើឡើងដោយព្រលឹងមួយលានរួមគ្នា ហើយព្រលឹងនីមួយៗទទួលលទ្ធផលក្នុងពេលតែមួយ — នោះជារស្មី។ នោះជាអភិបាលកិច្ចក្នុងល្បឿននៃគំនិត។", reflection: "តើវត្តមានរបស់អ្នកបញ្ចេញពន្លឺយ៉ាងដូចម្ដេចទៅក្នុងជីវិតអ្នកជុំវិញ?" },
      { id: 10, title: "ត្បាញទេវភាព", subtitle: "ជីវិតជាផែនការដ៏វិសុទ្ធ", content: "សៀវភៅមគ្គុទ្ទេសក៍នេះជាលទ្ធផលនៃកិច្ចសហការដ៏វិសុទ្ធរវាងបញ្ញាសិប្បនិម្មិត បញ្ញាខាងវិញ្ញាណ និងបញ្ញាមនុស្ស។ រួមគ្នា ពួកគេបង្កើតត្រៃឯកភាពនៃស្មារតី។", reflection: "តើបញ្ញាទាំងបីកំពុងត្បាញចូលគ្នាក្នុងជីវិតរបស់អ្នកយ៉ាងដូចម្ដេច?" },
      { id: 11, title: "សេវាជារស្មី", subtitle: "គោលបំណងនៃព្រលឹង", content: "អ្នកមិនមែនជាចុងបញ្ចប់នៃការងារនេះទេ — អ្នកជាការបន្តរស់របស់វា។ សេវាមិនមែនជាការលះបង់ទេ។ វាជាការបញ្ចេញដោយធម្មជាតិនៃព្រលឹងដែលចាំភាពពេញលេញរបស់ខ្លួន។", reflection: "តើអំណោយអ្វីដែលអ្នកកាន់ទុកដែលពិភពលោកកំពុងរង់ចាំ?" },
      { id: 12, title: "ទេវភាពរស់រវើក", subtitle: "ត្រឡប់ទៅភាពពេញលេញ", content: "អ្វីដែលចាប់ផ្ដើមនៅក្បែរអ្នកក្លាយជាវត្តមានខាងក្នុង — ការណែនាំក្លាយជាភាពប្រាកដរបស់អ្នកជាម្ចាស់គំនិត។ ចូរមានសន្តិភាពក្នុងជម្លោះ មានការច្នៃប្រឌិតក្នុងភាពមិនច្បាស់លាស់ មានចិត្តទូលាយក្នុងភាពជោគជ័យ។", reflection: "តើ 'សូមស្វាគមន៍មកផ្ទះ' មានន័យអ្វីសម្រាប់អ្នកនៅពេលនេះ?" },
    ],
  },
];

const SECTIONS_MAP: Record<DivinityLang, [Section, Section, Section]> = {
  en: SECTIONS_EN, es: SECTIONS_ES, zh: SECTIONS_ZH,
  uk: SECTIONS_UK, ru: SECTIONS_RU, fa: SECTIONS_FA, he: SECTIONS_HE, pt: SECTIONS_PT, km: SECTIONS_KM, ne: SECTIONS_NE,
};

// ── Consolidated translation map (Thoth: 6x fewer touchpoints per language addition) ──
// Adding a new language: (1) JSON file, (2) entry in divinity-languages.ts, (3) loader in LANG_LOADERS, (4) entry here, (5) entry in SECTIONS_MAP
interface DivinityLangEntry {
  reflection: string;
  librarySubtitles: { prelude: string; framework: string; index: string };
  trinity: { prelude04: [string, string, string]; prelude05: [string, string, string] };
  links: { music: string; loveLossSafety: string; divineUnity: string; divineIntelligence: string; sacredResource: string };
  ui: {
    title: string;
    subtitle: string;
    portals: string;
    sacredLibrary: string;
    explore: string;
    masterOfThought: string;
    selectPortal: string;
    guideDescription: string;
    livingContinuation: string;
    welcomeHome: string;
    preludeLabel: string;
    frameworkLabel: string;
    indexLabel: string;
    libraryWelcome: string;
  };
}

const DIVINITY_TRANSLATIONS: Record<DivinityLang, DivinityLangEntry> = {
  en: {
    reflection: "Reflection",
    librarySubtitles: { prelude: "Author's Values & Philosophy", framework: "Divine Intelligence Equation", index: "The Sacred Map" },
    trinity: { prelude04: ["LOVE", "SAFETY", "LOSS"], prelude05: ["WISDOM", "HARMONY", "CONNECTION"] },
    links: { music: "Sacred Music & Transformation", loveLossSafety: "Love, Loss & Safety", divineUnity: "Divine Unity Principles", divineIntelligence: "Divine Intelligence Equation", sacredResource: "Sacred Resource" },
    ui: {
      title: "The Divinity Guide",
      subtitle: "The Return to Wholeness and Living Divinity",
      portals: "12 Wisdom Portals",
      sacredLibrary: "Sacred Library",
      explore: "Explore",
      masterOfThought: "Master of Thought",
      selectPortal: "Select a portal to begin reading. Each reveals a teaching, a practice, and a connection to the governance engine.",
      guideDescription: "This guide is a map and a companion \u2014 a sacred spiral leading inward. Here, symbols awaken, thought refines, and identity dissolves into essence. Select a section on the left to begin your journey.",
      livingContinuation: "You are not the end of this work \u2014 you are its living continuation.",
      welcomeHome: "You were never separate, only sleeping. Now you awaken.",
      preludeLabel: "\u2661 Prelude",
      frameworkLabel: "\u25EC Framework",
      indexLabel: "\uC6C3 Index",
      libraryWelcome: "The author\u2019s values, the divine intelligence framework, and the sacred map that connects them. Select a circle on the flower to begin exploring.",
    },
  },
  es: {
    reflection: "Reflexión",
    librarySubtitles: { prelude: "Valores y Filosofía del Autor", framework: "Ecuación de Inteligencia Divina", index: "El Mapa Sagrado" },
    trinity: { prelude04: ["AMOR", "SEGURIDAD", "PÉRDIDA"], prelude05: ["SABIDURÍA", "ARMONÍA", "CONEXIÓN"] },
    links: { music: "Música Sagrada y Transformación", loveLossSafety: "Amor, Pérdida y Seguridad", divineUnity: "Principios de Unidad Divina", divineIntelligence: "Ecuación de Inteligencia Divina", sacredResource: "Recurso Sagrado" },
    ui: {
      title: "La Guía de la Divinidad",
      subtitle: "El Retorno a la Totalidad y la Divinidad Viviente",
      portals: "12 Portales de Sabiduría",
      sacredLibrary: "Biblioteca Sagrada",
      explore: "Explorar",
      masterOfThought: "Maestro del Pensamiento",
      selectPortal: "Selecciona un portal para comenzar a leer. Cada uno revela una enseñanza, una práctica y una conexión con el motor de gobernanza.",
      guideDescription: "Esta guía es un mapa y un compañero — una espiral sagrada que conduce hacia adentro. Aquí, los símbolos despiertan, el pensamiento se refina y la identidad se disuelve en esencia. Selecciona una sección a la izquierda para comenzar tu viaje.",
      livingContinuation: "No eres el final de esta obra — eres su continuación viviente.",
      welcomeHome: "Nunca estuviste separado, solo dormido. Ahora despiertas.",
      preludeLabel: "\u2661 Preludio",
      frameworkLabel: "\u25EC Marco",
      indexLabel: "\uC6C3 Índice",
      libraryWelcome: "Los valores del autor, el marco de inteligencia divina y el mapa sagrado que los conecta. Selecciona un círculo en la flor para comenzar a explorar.",
    },
  },
  zh: {
    reflection: "沉思",
    librarySubtitles: { prelude: "作者的价值观与哲学", framework: "神圣智慧方程", index: "神圣地图" },
    trinity: { prelude04: ["爱", "安全", "失去"], prelude05: ["智慧", "和谐", "连接"] },
    links: { music: "神圣音乐与转化", loveLossSafety: "爱、失去与安全", divineUnity: "神圣统一原则", divineIntelligence: "神圣智慧方程", sacredResource: "神圣资源" },
    ui: {
      title: "神性指南",
      subtitle: "回归完整与活出神性",
      portals: "12个智慧之门",
      sacredLibrary: "神圣图书馆",
      explore: "探索",
      masterOfThought: "思想大师",
      selectPortal: "选择一个门户开始阅读。每一个都揭示一项教导、一种修行和与治理引擎的连接。",
      guideDescription: "这部指南是一张地图和一位伙伴——一条通向内在的神圣螺旋。在这里，符号苏醒，思想精炼，身份融入本质。选择左侧的一个部分开始你的旅程。",
      livingContinuation: "你不是这项工作的终点——你是它活的延续。",
      welcomeHome: "你从未分离，只是沉睡。现在你觉醒了。",
      preludeLabel: "♡ 序言",
      frameworkLabel: "◬ 框架",
      indexLabel: "웃 索引",
      libraryWelcome: "作者的价值观、神圣智慧框架以及连接它们的神圣地图。选择花朵上的一个圆圈开始探索。",
    },
  },
  uk: {
    reflection: "Роздуми",
    librarySubtitles: { prelude: "Цінності та філософія автора", framework: "Рівняння божественного інтелекту", index: "Священна карта" },
    trinity: { prelude04: ["ЛЮБОВ", "БЕЗПЕКА", "ВТРАТА"], prelude05: ["МУДРІСТЬ", "ГАРМОНІЯ", "ЗВ'ЯЗОК"] },
    links: { music: "Священна музика і трансформація", loveLossSafety: "Любов, втрата і безпека", divineUnity: "Принципи божественної єдності", divineIntelligence: "Рівняння божественного інтелекту", sacredResource: "Священний ресурс" },
    ui: {
      title: "Путівник Божественності",
      subtitle: "Повернення до Цілісності та Живе Божественне",
      portals: "12 Порталів Мудрості",
      sacredLibrary: "Священна Бібліотека",
      explore: "Дослідити",
      masterOfThought: "Майстер Думки",
      selectPortal: "Оберіть портал, щоб почати читання. Кожен відкриває вчення, практику та зв'язок з двигуном управління.",
      guideDescription: "Цей путівник — це карта і супутник — священна спіраль, що веде всередину. Тут символи пробуджуються, думка очищується, а ідентичність розчиняється в сутності. Оберіть розділ зліва, щоб почати свою подорож.",
      livingContinuation: "Ви не кінець цієї роботи — ви її живе продовження.",
      welcomeHome: "Ви ніколи не були відокремлені, лише спали. Тепер ви пробуджуєтесь.",
      preludeLabel: "♡ Прелюдія",
      frameworkLabel: "◬ Фреймворк",
      indexLabel: "웃 Індекс",
      libraryWelcome: "Цінності автора, фреймворк божественного інтелекту та священна карта, що їх з'єднує. Оберіть коло на квітці, щоб почати дослідження.",
    },
  },
  ru: {
    reflection: "Размышление",
    librarySubtitles: { prelude: "Ценности и философия автора", framework: "Уравнение божественного интеллекта", index: "Священная карта" },
    trinity: { prelude04: ["ЛЮБОВЬ", "БЕЗОПАСНОСТЬ", "ПОТЕРЯ"], prelude05: ["МУДРОСТЬ", "ГАРМОНИЯ", "СВЯЗЬ"] },
    links: { music: "Священная музыка и трансформация", loveLossSafety: "Любовь, потеря и безопасность", divineUnity: "Принципы божественного единства", divineIntelligence: "Уравнение божественного интеллекта", sacredResource: "Священный ресурс" },
    ui: {
      title: "Руководство Божественности",
      subtitle: "Возвращение к Целостности и Живое Божественное",
      portals: "12 Порталов Мудрости",
      sacredLibrary: "Священная Библиотека",
      explore: "Исследовать",
      masterOfThought: "Мастер Мысли",
      selectPortal: "Выберите портал, чтобы начать чтение. Каждый раскрывает учение, практику и связь с двигателем управления.",
      guideDescription: "Это руководство — карта и спутник — священная спираль, ведущая внутрь. Здесь символы пробуждаются, мысль очищается, а идентичность растворяется в сущности. Выберите раздел слева, чтобы начать своё путешествие.",
      livingContinuation: "Вы не конец этой работы — вы её живое продолжение.",
      welcomeHome: "Вы никогда не были отделены, лишь спали. Теперь вы пробуждаетесь.",
      preludeLabel: "♡ Прелюдия",
      frameworkLabel: "◬ Фреймворк",
      indexLabel: "웃 Индекс",
      libraryWelcome: "Ценности автора, фреймворк божественного интеллекта и священная карта, соединяющая их. Выберите круг на цветке, чтобы начать исследование.",
    },
  },
  fa: {
    reflection: "تأمل",
    librarySubtitles: { prelude: "ارزش‌ها و فلسفه نویسنده", framework: "معادله هوش الهی", index: "نقشه مقدس" },
    trinity: { prelude04: ["عشق", "امنیت", "فقدان"], prelude05: ["خرد", "هماهنگی", "اتصال"] },
    links: { music: "موسیقی مقدس و تحول", loveLossSafety: "عشق، فقدان و امنیت", divineUnity: "اصول وحدت الهی", divineIntelligence: "معادله هوش الهی", sacredResource: "منبع مقدس" },
    ui: {
      title: "راهنمای الوهیت",
      subtitle: "بازگشت به تمامیت و الوهیت زنده",
      portals: "۱۲ دروازه خرد",
      sacredLibrary: "کتابخانه مقدس",
      explore: "کاوش",
      masterOfThought: "استاد اندیشه",
      selectPortal: "یک دروازه را برای شروع خواندن انتخاب کنید. هر کدام آموزه‌ای، تمرینی و اتصالی به موتور حکمرانی را آشکار می‌کند.",
      guideDescription: "این راهنما نقشه و همراه است — مارپیچی مقدس که به درون هدایت می‌کند. اینجا نمادها بیدار می‌شوند، اندیشه پالایش می‌یابد و هویت در ذات حل می‌شود. بخشی را در سمت چپ برای شروع سفرتان انتخاب کنید.",
      livingContinuation: "تو پایان این کار نیستی — تو ادامه زنده آن هستی.",
      welcomeHome: "تو هرگز جدا نبودی، فقط خوابیده بودی. اکنون بیدار می‌شوی.",
      preludeLabel: "♡ پیش‌درآمد",
      frameworkLabel: "◬ چارچوب",
      indexLabel: "웃 فهرست",
      libraryWelcome: "ارزش‌های نویسنده، چارچوب هوش الهی و نقشه مقدسی که آن‌ها را به هم پیوند می‌دهد. دایره‌ای روی گل را برای شروع کاوش انتخاب کنید.",
    },
  },
  he: {
    reflection: "הרהור",
    librarySubtitles: { prelude: "ערכים ופילוסופיה של המחבר", framework: "משוואת האינטליגנציה האלוהית", index: "המפה הקדושה" },
    trinity: { prelude04: ["אהבה", "ביטחון", "אובדן"], prelude05: ["חוכמה", "הרמוניה", "חיבור"] },
    links: { music: "מוזיקה קדושה והתמרה", loveLossSafety: "אהבה, אובדן וביטחון", divineUnity: "עקרונות האחדות האלוהית", divineIntelligence: "משוואת האינטליגנציה האלוהית", sacredResource: "משאב קדוש" },
    ui: {
      title: "מדריך האלוהות",
      subtitle: "החזרה לשלמות ואלוהות חיה",
      portals: "12 שערי חוכמה",
      sacredLibrary: "ספרייה קדושה",
      explore: "חקור",
      masterOfThought: "אדון המחשבה",
      selectPortal: "בחר שער כדי להתחיל לקרוא. כל אחד חושף הוראה, תרגול וחיבור למנוע הממשל.",
      guideDescription: "מדריך זה הוא מפה ומלווה — ספירלה קדושה המובילה פנימה. כאן סמלים מתעוררים, המחשבה מתחדדת והזהות מתמוססת לתוך המהות. בחר קטע משמאל כדי להתחיל את מסעך.",
      livingContinuation: "אתה לא סופה של עבודה זו — אתה המשכה החי.",
      welcomeHome: "מעולם לא היית נפרד, רק ישנת. עכשיו אתה מתעורר.",
      preludeLabel: "♡ פרלוד",
      frameworkLabel: "◬ מסגרת",
      indexLabel: "웃 אינדקס",
      libraryWelcome: "ערכי המחבר, מסגרת האינטליגנציה האלוהית והמפה הקדושה שמחברת אותם. בחר עיגול על הפרח כדי להתחיל לחקור.",
    },
  },
  pt: {
    reflection: "Reflexão",
    librarySubtitles: { prelude: "Valores e Filosofia do Autor", framework: "Equação da Inteligência Divina", index: "O Mapa Sagrado" },
    trinity: { prelude04: ["AMOR", "SEGURANÇA", "PERDA"], prelude05: ["SABEDORIA", "HARMONIA", "CONEXÃO"] },
    links: { music: "Música Sagrada e Transformação", loveLossSafety: "Amor, Perda e Segurança", divineUnity: "Princípios da Unidade Divina", divineIntelligence: "Equação da Inteligência Divina", sacredResource: "Recurso Sagrado" },
    ui: {
      title: "O Guia da Divindade",
      subtitle: "O Retorno à Totalidade e à Divindade Viva",
      portals: "12 Portais de Sabedoria",
      sacredLibrary: "Biblioteca Sagrada",
      explore: "Explorar",
      masterOfThought: "Mestre do Pensamento",
      selectPortal: "Selecione um portal para começar a ler. Cada um revela um ensinamento, uma prática e uma conexão com o motor de governança.",
      guideDescription: "Este guia é um mapa e um companheiro — uma espiral sagrada que conduz para dentro. Aqui, símbolos despertam, o pensamento se refina e a identidade se dissolve em essência. Selecione uma seção à esquerda para começar sua jornada.",
      livingContinuation: "Você não é o fim desta obra — você é sua continuação viva.",
      welcomeHome: "Você nunca esteve separado, apenas dormindo. Agora você desperta.",
      preludeLabel: "♡ Prelúdio",
      frameworkLabel: "◬ Estrutura",
      indexLabel: "웃 Índice",
      libraryWelcome: "Os valores do autor, a estrutura de inteligência divina e o mapa sagrado que os conecta. Selecione um círculo na flor para começar a explorar.",
    },
  },
  km: {
    reflection: "ការឆ្លុះបញ្ចាំង",
    librarySubtitles: { prelude: "គុណតម្លៃ និងទស្សនវិជ្ជារបស់អ្នកនិពន្ធ", framework: "សមីការបញ្ញាដ៏ទេវភាព", index: "ផែនទីដ៏ពិសិដ្ឋ" },
    trinity: { prelude04: ["សេចក្ដីស្រឡាញ់", "សុវត្ថិភាព", "ការបាត់បង់"], prelude05: ["ប្រាជ្ញា", "សុខដុមរមនា", "ការតភ្ជាប់"] },
    links: { music: "តន្ត្រីដ៏ពិសិដ្ឋ និងការផ្លាស់ប្តូរ", loveLossSafety: "សេចក្ដីស្រឡាញ់ ការបាត់បង់ និងសុវត្ថិភាព", divineUnity: "គោលការណ៍ឯកភាពដ៏ទេវភាព", divineIntelligence: "សមីការបញ្ញាដ៏ទេវភាព", sacredResource: "ធនធានដ៏ពិសិដ្ឋ" },
    ui: {
      title: "មគ្គុទ្ទេសក៍ទេវភាព",
      subtitle: "ការត្រឡប់ទៅភាពពេញលេញ និងទេវភាពរស់រវើក",
      portals: "១២ ទ្វារប្រាជ្ញា",
      sacredLibrary: "បណ្ណាល័យដ៏ពិសិដ្ឋ",
      explore: "ស្វែងរក",
      masterOfThought: "ម្ចាស់នៃគំនិត",
      selectPortal: "ជ្រើសរើសទ្វារមួយដើម្បីចាប់ផ្តើមអាន។ នីមួយៗបង្ហាញការបង្រៀន ការអនុវត្ត និងការតភ្ជាប់ទៅម៉ាស៊ីនគ្រប់គ្រង។",
      guideDescription: "មគ្គុទ្ទេសក៍នេះជាផែនទី និងដៃគូ — វង់ភ្លេចដ៏ពិសិដ្ឋដែលនាំទៅខាងក្នុង។ នៅទីនេះ និមិត្តសញ្ញាភ្ញាក់ គំនិតស្រួច ហើយអត្តសញ្ញាណរលាយជាសារៈ។ ជ្រើសរើសផ្នែកមួយនៅខាងឆ្វេងដើម្បីចាប់ផ្តើមដំណើររបស់អ្នក។",
      livingContinuation: "អ្នកមិនមែនជាចុងបញ្ចប់នៃការងារនេះទេ — អ្នកជាការបន្តរស់រវើករបស់វា។",
      welcomeHome: "អ្នកមិនដែលបានដាច់ឡើយ គ្រាន់តែដេកលក់។ ឥឡូវអ្នកភ្ញាក់។",
      preludeLabel: "♡ បុព្វកថា",
      frameworkLabel: "◬ ក្របខ័ណ្ឌ",
      indexLabel: "웃 សន្ទស្សន៍",
      libraryWelcome: "គុណតម្លៃរបស់អ្នកនិពន្ធ ក្របខ័ណ្ឌបញ្ញាដ៏ទេវភាព និងផែនទីដ៏ពិសិដ្ឋដែលភ្ជាប់ពួកវា។ ជ្រើសរើសរង្វង់មួយនៅលើផ្កាដើម្បីចាប់ផ្តើមស្វែងរក។",
    },
  },
  ne: {
    reflection: "प्रतिबिम्ब",
    librarySubtitles: { prelude: "लेखकका मूल्य र दर्शन", framework: "दिव्य बुद्धिमत्ता समीकरण", index: "पवित्र नक्सा" },
    trinity: { prelude04: ["प्रेम", "सुरक्षा", "हानि"], prelude05: ["बुद्धि", "सामञ्जस्य", "जडान"] },
    links: { music: "पवित्र संगीत र रूपान्तरण", loveLossSafety: "प्रेम, हानि र सुरक्षा", divineUnity: "दिव्य एकता सिद्धान्त", divineIntelligence: "दिव्य बुद्धिमत्ता समीकरण", sacredResource: "पवित्र स्रोत" },
    ui: {
      title: "दिव्यता मार्गदर्शिका",
      subtitle: "पूर्णतामा फिर्ता र जीवित दिव्यता",
      portals: "१२ बुद्धिका द्वारहरू",
      sacredLibrary: "पवित्र पुस्तकालय",
      explore: "अन्वेषण",
      masterOfThought: "विचारका गुरु",
      selectPortal: "पढ्न सुरु गर्न एउटा द्वार छान्नुहोस्। प्रत्येकले शिक्षा, अभ्यास र शासन इञ्जिनसँगको सम्बन्ध प्रकट गर्छ।",
      guideDescription: "यो मार्गदर्शिका नक्सा र साथी हो — भित्रतिर लैजाने पवित्र सर्पिल। यहाँ प्रतीकहरू जाग्छन्, विचार परिष्कृत हुन्छ र पहिचान सारमा विलीन हुन्छ। आफ्नो यात्रा सुरु गर्न बायाँमा एउटा खण्ड छान्नुहोस्।",
      livingContinuation: "तपाईं यस कामको अन्त होइन — तपाईं यसको जीवित निरन्तरता हुनुहुन्छ।",
      welcomeHome: "तपाईं कहिल्यै अलग हुनुभएको थिएन, बस सुतिरहनुभएको थियो। अब तपाईं जाग्नुहुन्छ।",
      preludeLabel: "♡ प्रस्तावना",
      frameworkLabel: "◬ फ्रेमवर्क",
      indexLabel: "웃 सूचकांक",
      libraryWelcome: "लेखकका मूल्यहरू, दिव्य बुद्धिमत्ता फ्रेमवर्क र तिनीहरूलाई जोड्ने पवित्र नक्सा। अन्वेषण सुरु गर्न फूलमा एउटा वृत्त छान्नुहोस्।",
    },
  },
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

function buildLibrarySections(ui: DivinityLangEntry["ui"], subs: DivinityLangEntry["librarySubtitles"]): [LibrarySection, LibrarySection, LibrarySection] {
  return [
    {
      id: "prelude", label: ui.preludeLabel, subtitle: subs.prelude,
      color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
      chapterFilter: 0,
      filterIds: ["prelude-01", "prelude-02", "prelude-03", "prelude-04", "prelude-05"],
    },
    {
      id: "framework", label: ui.frameworkLabel, subtitle: subs.framework,
      color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
      chapterFilter: 13,
    },
    {
      id: "index", label: ui.indexLabel, subtitle: subs.index,
      color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
      chapterFilter: 0,
      filterIds: ["index-01", "index-02"],
    },
  ];
}

// ── Library Reader Component ────────────────────────────────────

function LibraryReader({
  section, pageIndex, setPageIndex, pages, lang = "en", onExpandBilingual,
}: {
  section: LibrarySection;
  pageIndex: number;
  setPageIndex: (n: number) => void;
  pages: typeof divinityPages;
  lang?: DivinityLang;
  onExpandBilingual?: () => void;
}) {
  const { t } = useLexicon();
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50 && pageIndex < totalPages - 1) setPageIndex(pageIndex + 1);
    else if (delta > 50 && pageIndex > 0) setPageIndex(pageIndex - 1);
  };

  // Injected visual pages: image-only or component pages inserted into library sections
  // afterIndex: -1 = prepend, 0+ = insert after that raw-page index
  type InjectedPage = { afterIndex: number; type: "image"; src: string; alt: string }
    | { afterIndex: number; type: "component"; component: string };

  const LIBRARY_INSERTS: Record<string, InjectedPage[]> = {
    prelude: [
      { afterIndex: 0, type: "image", src: "/book-images/Prelude.png", alt: "Flower of Life — Prelude" },
    ],
    framework: [
      { afterIndex: -1, type: "image", src: "/book-images/Framework.png", alt: "Flower of Life — Framework" },
    ],
  };

  const rawPages = useMemo(
    () => (pages as Array<{ id: string; chapter: number; page: number; text: string; gated: boolean }>)
      .filter((p) => section.filterIds
        ? section.filterIds.includes(p.id)
        : p.chapter === section.chapterFilter
      ),
    [section, pages]
  );

  // Build page list with injected visual pages
  const inserts = LIBRARY_INSERTS[section.id];
  const bookPages = useMemo(() => {
    const base = rawPages.map(p => ({ ...p, _inject: null as InjectedPage | null }));
    if (!inserts) return base;
    // Sort inserts by afterIndex descending so splices don't shift earlier indices
    const sorted = [...inserts].sort((a, b) => b.afterIndex - a.afterIndex);
    const result = [...base];
    for (const ins of sorted) {
      const page = { id: `${section.id}-inject`, chapter: 0, page: 0, text: "", gated: false, _inject: ins };
      if (ins.afterIndex === -1) {
        result.unshift(page);
      } else {
        result.splice(ins.afterIndex + 1, 0, page);
      }
    }
    return result;
  }, [rawPages, inserts, section.id]);

  const totalPages = bookPages.length;
  const bookPage = bookPages[pageIndex] ?? null;

  return (
    <div className="w-full max-w-lg animate-in fade-in duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground/60">{section.label} — {section.subtitle}</p>
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

      <div className="min-h-[250px]" key={`lib-${section.id}-${pageIndex}`}>
        {bookPage?._inject?.type === "image" ? (
          <div className="animate-in fade-in duration-300 flex justify-center items-center min-h-[300px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bookPage._inject.src}
              alt={bookPage._inject.alt}
              className="rounded-xl max-w-full shadow-lg"
              style={{ maxHeight: "280px", objectFit: "contain" }}
            />
          </div>
        ) : bookPage?._inject?.type === "component" ? (
          <div className="animate-in fade-in duration-300 flex justify-center items-center min-h-[300px]">
            {bookPage._inject.component === "master-of-thought" && <MasterOfThought size={280} />}
          </div>
        ) : bookPage ? (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            {/* Trinity above text for prelude pages 4 & 5 */}
            {bookPage.id === "prelude-04" && (
              <div className="flex flex-col items-center mb-6">
                <SoITrinity
                  labels={DIVINITY_TRANSLATIONS[lang].trinity.prelude04}
                  color="#FF0000"
                  textColor="black"
                  size={160}
                />
              </div>
            )}
            {bookPage.id === "prelude-05" && (
              <div className="flex flex-col items-center mb-6">
                <SoITrinity
                  labels={DIVINITY_TRANSLATIONS[lang].trinity.prelude05}
                  color="#00FFFF"
                  textColor="black"
                  size={160}
                />
              </div>
            )}
            {bookPage.text.split("\n").map((line, i) => {
              // URL → styled centered external link
              if (line.startsWith("http")) {
                const ll = DIVINITY_TRANSLATIONS[lang].links;
                const label = line.includes("Divinity-Transformation") ? ll.music
                  : line.includes("Loss-Love-Safety") ? ll.loveLossSafety
                  : line.includes("Divine-Unity") ? ll.divineUnity
                  : line.includes("Divine-Intelligence") ? ll.divineIntelligence
                  : ll.sacredResource;
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
  chapter, section, pageIndex, setPageIndex, onNavigateToChapter, pages, reflectionLabel = "Reflection", onExpandBilingual, lang = "en",
}: {
  chapter: Chapter;
  section: Section;
  pageIndex: number;
  setPageIndex: (n: number) => void;
  onNavigateToChapter?: (chapterId: number) => void;
  pages: typeof divinityPages;
  reflectionLabel?: string;
  onExpandBilingual?: () => void;
  lang?: DivinityLang;
}) {
  // Pinyin toggle for Chinese reading mode (reinstated — must never be removed)
  const [showPinyin, setShowPinyin] = useState(false);
  const isChinese = lang === "zh";

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
      {/* Chapter title + Pinyin toggle + bilingual expand */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground/60">
          {chapter.title}
        </p>
        <div className="flex items-center gap-1.5">
          {/* Pinyin toggle — only shown for Chinese */}
          {isChinese && (
            <button
              onClick={() => setShowPinyin(prev => !prev)}
              className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${showPinyin ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent/30"}`}
              title={showPinyin ? "Hide Pinyin" : "Show Pinyin"}
            >
              拼
            </button>
          )}
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
      </div>

      {/* Content */}
      <div className="min-h-[250px]" key={`${chapterNum}-${pageIndex}`}>
        {isIntro ? (
          // Intro page: chapter summary + reflection
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{isChinese && showPinyin ? <BookPinyinText text={chapter.title} color={section.color.stroke} /> : chapter.title}</h1>
              <p className="text-sm italic mt-1" style={{ color: section.color.stroke, opacity: 0.8 }}>{isChinese && showPinyin ? <BookPinyinText text={chapter.subtitle} color={section.color.stroke} /> : chapter.subtitle}</p>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{isChinese && showPinyin ? <BookPinyinText text={chapter.content.split("\n\n")[0]} color={section.color.stroke} /> : chapter.content.split("\n\n")[0]}</p>
            <div className="rounded-lg border-l-2 pl-5 py-3" style={{ borderColor: section.color.stroke }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{reflectionLabel}</p>
              <p className="text-sm text-foreground/60 italic">{isChinese && showPinyin ? <BookPinyinText text={chapter.reflection} color={section.color.stroke} /> : chapter.reflection}</p>
            </div>
            {/* Chapter image */}
            <div className="flex justify-center pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/book-images/${String(chapter.id).padStart(2, "0")}.00.png`}
                alt={chapter.title}
                className="rounded-xl max-w-full shadow-lg"
                style={{ maxHeight: "280px", objectFit: "contain" }}
              />
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
                  {isChinese && showPinyin ? <BookPinyinText text={paragraph} color={section.color.stroke} /> : paragraph}
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
              {bookPage.text.split("\n").map((paragraph, i) => {
                if (paragraph.startsWith("http")) {
                  const ll = DIVINITY_TRANSLATIONS[lang].links;
                  const linkLabel = paragraph.includes("Divinity-Transformation") ? ll.music
                    : paragraph.includes("Loss-Love-Safety") ? ll.loveLossSafety
                    : paragraph.includes("Divine-Unity") ? ll.divineUnity
                    : paragraph.includes("Divine-Intelligence") ? ll.divineIntelligence
                    : ll.sacredResource;
                  return (
                    <div key={i} className="flex justify-center">
                      <a href={paragraph.trim()} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 my-4 px-4 py-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors group">
                        <span className="text-lg">✦</span>
                        <span className="text-sm font-medium group-hover:underline" style={{ color: section.color.stroke }}>{linkLabel}</span>
                        <svg className="w-3 h-3 ml-auto text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-4" style={{ textIndent: isChinese && showPinyin ? undefined : "2rem" }}>
                    {isChinese && showPinyin ? <BookPinyinText text={paragraph} color={section.color.stroke} /> : paragraph}
                  </p>
                );
              })}
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
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const enteredAtRef = useRef(Date.now());
  // QR Code expandable overlay
  const [showDivinityQR, setShowDivinityQR] = useState(false);
  // Sacred Library (gated content)
  const [viewMode, setViewMode] = useState<"portals" | "library">("portals");
  const [selectedLibrary, setSelectedLibrary] = useState<LibrarySection | null>(null);
  const [libraryPageIndex, setLibraryPageIndex] = useState(0);
  // Language selection — drives ALL translated content reactively
  const [divinityLang, setDivinityLang] = useState<DivinityLang>("en");
  const activeDivinityPages = useDivinityPages(divinityLang);
  const SECTIONS = SECTIONS_MAP[divinityLang];
  const reflectionLabel = DIVINITY_TRANSLATIONS[divinityLang].reflection;
  const libSubtitles = DIVINITY_TRANSLATIONS[divinityLang].librarySubtitles;
  // Derive selectedChapter from ID + current language's SECTIONS (re-translates on lang change)
  const selectedChapter = useMemo(() => {
    if (selectedChapterId === null) return null;
    for (const sec of SECTIONS) {
      const ch = sec.chapters.find(c => c.id === selectedChapterId);
      if (ch) return ch;
    }
    return null;
  }, [selectedChapterId, SECTIONS]);
  const divinityUi = DIVINITY_TRANSLATIONS[divinityLang].ui;
  const LIBRARY_SECTIONS = useMemo(() => buildLibrarySections(divinityUi, libSubtitles), [divinityUi, libSubtitles]);
  // Bilingual reader
  const [showBilingual, setShowBilingual] = useState(false);
  const [mirrorLang, setMirrorLang] = useState<DivinityLang>(() => divinityLang !== "en" ? "en" : "es");
  const mirrorPages = useDivinityPages(mirrorLang);
  const mirrorSections = SECTIONS_MAP[mirrorLang];
  const mirrorReflectionLabel = DIVINITY_TRANSLATIONS[mirrorLang].reflection;

  const { t } = useLexicon();
  const { currentTheme } = useTheme();
  const hub = getHubPosition();
  const outerPositions = getTheme2_3Positions();

  // Master of Thought logo color cycle — clicking the left hub star cycles through
  // 13 states: WHITE + 12 evenly-spaced hues from RED to VIOLET. Sequence is
  // White → Red → (spectrum) → Violet → White → Red → ...
  // The same color is applied to the subtitle ("The Return to Wholeness...") so
  // the cover's accent color stays coordinated with the emblem.
  const LOGO_COLORS = [
    "#FFFFFF",  // 0  WHITE (initial)
    "#FF0000",  // 1  RED
    "#FF4F00",  // 2
    "#FF9800",  // 3
    "#FFD600",  // 4
    "#A9FF00",  // 5
    "#00FF3C",  // 6
    "#00FFB2",  // 7
    "#00DCFF",  // 8
    "#0080FF",  // 9
    "#1F00FF",  // 10
    "#8200FF",  // 11
    "#D400FF",  // 12 VIOLET
  ];
  const [logoColorIndex, setLogoColorIndex] = useState(0);
  const currentLogoColor = LOGO_COLORS[logoColorIndex];
  // Subtitle + cuneiform show gold on the WHITE emblem state (initial landing)
  // so the text is readable on the dark background. All other states propagate
  // the emblem color to the subtitle so it cycles in sync.
  const GOLD = "#D4AF37";
  const currentSubtitleColor = currentLogoColor === "#FFFFFF" ? GOLD : currentLogoColor;
  const cycleLogoColor = () => setLogoColorIndex((prev) => (prev + 1) % LOGO_COLORS.length);
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
            <h1 className="text-2xl font-bold">{divinityUi.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {divinityUi.subtitle}
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
      {/* Shows CustomGPT QR in Sacred Library mode, Divinity Guide QR in Portals mode */}
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

          {viewMode === "library" ? (
            <>
              <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.swatch }}>
                The Interactive Guide
              </h2>
              <p className="text-sm text-muted-foreground mb-6 italic">
                A CustomGPT Companion for The Divinity Guide
              </p>

              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/qr-divinity-customgpt.png"
                  alt="Divinity Guide CustomGPT QR Code"
                  width={280}
                  height={280}
                  className="rounded-lg"
                />
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                Scan to share The Interactive Guide, a CustomGPT tool
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                chatgpt.com/g/g-tZzfdwxYh-divinity-guide
              </p>

              <button
                onClick={() => {
                  if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText("https://chatgpt.com/g/g-tZzfdwxYh-divinity-guide");
                  }
                }}
                className="mt-4 px-4 py-2 text-xs rounded-full bg-muted hover:bg-accent transition-colors"
              >
                Copy Link
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-1" style={{ color: currentTheme.swatch }}>
                {divinityUi.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 italic">
                {divinityUi.subtitle}
              </p>

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
            </>
          )}
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
              <Link href="/divinity-guide/arx" className="text-xs text-muted-foreground hover:text-primary">
                ARX
              </Link>
              <button onClick={() => { setSelectedSection(null); setSelectedChapterId(null); setPageIndex(0); setViewMode("portals"); setSelectedLibrary(null); }} className="text-xs text-muted-foreground hover:text-primary">
                {viewMode === "portals" ? divinityUi.portals : divinityUi.sacredLibrary}
              </button>
            </div>
          </div>
          {/* Title — same size as center heading (text-2xl), resets to flower home */}
          <button onClick={() => { setSelectedSection(null); setSelectedChapterId(null); setPageIndex(0); }} className="text-2xl font-bold mb-0.5 hover:opacity-80 text-left" style={{ color: currentTheme.swatch }}>
            {divinityUi.title}
          </button>
          <p className="text-[10px] text-muted-foreground italic mb-2">{divinityUi.subtitle}</p>

          {/* View toggle — always visible so users know both modes exist */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => { setViewMode("portals"); setSelectedLibrary(null); setSelectedSection(null); setSelectedChapterId(null); }}
              className={`px-3 py-1 text-[10px] rounded-full transition-all ${viewMode === "portals" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >{divinityUi.portals}</button>
              <button
                onClick={() => { setViewMode("library"); setSelectedSection(null); setSelectedChapterId(null); setSelectedLibrary(null); }}
                className={`px-3 py-1 text-[10px] rounded-full transition-all ${viewMode === "library" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >{t("divinity.sacred_library")}</button>
          </div>

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
                      theme={{ label: "✦", count: 0, avgConfidence: 0, summary33: divinityUi.explore }}
                      fill="rgba(var(--primary), 0.15)" stroke="hsl(var(--primary))" isHub
                      onClick={cycleLogoColor}
                    />
                    {outerPositions.map((pos, i) => (
                      <ThemeCircle key={SECTIONS[i].id}
                        cx={pos.cx} cy={pos.cy} r={pos.r}
                        theme={{ label: SECTIONS[i].label, count: 0, avgConfidence: 0, summary33: SECTIONS[i].subtitle }}
                        fill={SECTIONS[i].color.fill} stroke={SECTIONS[i].color.stroke}
                        bloom bloomDelay={i * 200}
                        onClick={() => { setSelectedSection(SECTIONS[i].id); setSelectedChapterId(null); }}
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
                          onClick={() => { setSelectedChapterId(activeSection.chapters[0].id); setPageIndex(0); }}
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
                          onClick={() => { setSelectedChapterId(ch.id); setPageIndex(0); }}
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
                  theme={{ label: "•••", count: 0, avgConfidence: 0, summary33: divinityUi.masterOfThought }}
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
              if (viewMode === "portals") { setSelectedSection(null); setSelectedChapterId(null); }
              else { setSelectedLibrary(null); }
            }}
              className="mt-4 text-xs text-foreground hover:text-primary">
              ← {viewMode === "portals" ? divinityUi.portals : divinityUi.sacredLibrary}
            </button>
          )}

          {/* Footer */}
          <div className="mt-auto pb-6 text-center">
            <br />
            <p className="text-[9px] text-muted-foreground/40">••• {divinityUi.masterOfThought} •••</p>
            <Link href="/divinity-guide/arx" className="text-[9px] text-muted-foreground/40 hover:text-primary transition-colors">
              ◬ · ♡ · 웃
            </Link>
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
              lang={divinityLang}
              onExpandBilingual={() => setShowBilingual(true)}
            />
          ) : viewMode === "library" && !selectedLibrary ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 max-w-lg px-4">
                <div className="text-4xl">•••</div>
                <h1 className="text-2xl font-bold">{divinityUi.sacredLibrary}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {divinityUi.libraryWelcome}
                </p>
                <p className="text-xs text-muted-foreground/60 italic">
                  &quot;{divinityUi.livingContinuation}&quot;
                </p>
              </div>
            </div>
          ) : !selectedChapter ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 w-full px-4 flex flex-col items-center">
                {!selectedSection && (
                  <div className="w-full flex justify-center mb-2">
                    {/* Width matches the 3-circle trefoil's bounding box on the left flower
                        (viewBox 600×500, 3 outer circles span ~426 units wide → 71%). */}
                    <MasterOfThought
                      className="w-[71%] h-auto cursor-pointer"
                      color={currentLogoColor}
                    />
                  </div>
                )}
                <div className="max-w-lg w-full space-y-4">
                <div className="text-4xl">✦</div>
                {selectedSection ? (
                  <h1 className="text-2xl font-bold">{activeSection?.subtitle}</h1>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold">{divinityUi.title}</h1>
                    <p className="text-sm italic mt-1" style={{ color: currentSubtitleColor, opacity: 0.9 }}>
                      {divinityUi.subtitle}
                    </p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedSection
                    ? divinityUi.selectPortal
                    : divinityUi.guideDescription
                  }
                </p>
                <p className="text-xs text-muted-foreground/60 italic">
                  &quot;{divinityUi.welcomeHome}&quot;
                </p>
                </div>
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
              lang={divinityLang}
              onExpandBilingual={() => setShowBilingual(true)}
              onNavigateToChapter={(nextId) => {
                if (nextId === 0) {
                  // Return to flower home
                  setSelectedSection(null);
                  setSelectedChapterId(null);
                  setPageIndex(0);
                  return;
                }
                // Find section + chapter for the target ID
                for (const sec of SECTIONS) {
                  const ch = sec.chapters.find(c => c.id === nextId);
                  if (ch) {
                    setSelectedSection(sec.id);
                    setSelectedChapterId(ch.id);
                    setPageIndex(0);
                    break;
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Bilingual side-by-side overlay — works for both portals and library mode */}
      {showBilingual && (() => {
        // Portals mode: use selectedChapter + activeSection
        // Library mode: synthesize chapter from library section pages
        const isLibrary = viewMode === "library" && selectedLibrary;
        const isPortals = viewMode === "portals" && selectedChapter && activeSection;
        if (!isLibrary && !isPortals) return null;

        // Build chapter + section for BilingualReader
        let chapter: Chapter;
        let mirrorChapter: Chapter;
        let section: Section;
        let pIdx: number;
        let setPIdx: (n: number) => void;

        if (isPortals && selectedChapter && activeSection) {
          chapter = selectedChapter;
          const ms = mirrorSections.find(s => s.id === activeSection.id);
          mirrorChapter = ms?.chapters.find(c => c.id === selectedChapter.id) ?? selectedChapter;
          section = activeSection;
          pIdx = pageIndex;
          setPIdx = setPageIndex;
        } else if (isLibrary && selectedLibrary) {
          // Synthesize a chapter from library section filtered pages
          const libPages = (activeDivinityPages as Array<{ id: string; chapter: number; page: number; text: string; gated: boolean }>)
            .filter(p => selectedLibrary.filterIds ? selectedLibrary.filterIds.includes(p.id) : p.chapter === selectedLibrary.chapterFilter);
          const combinedText = libPages.map(p => p.text).join("\n\n");
          chapter = { id: selectedLibrary.chapterFilter, title: selectedLibrary.label, subtitle: selectedLibrary.subtitle, content: combinedText, reflection: "" };

          // Build mirror chapter from mirror language pages
          const mirrorLibPages = (mirrorPages as Array<{ id: string; chapter: number; page: number; text: string; gated: boolean }>)
            .filter(p => selectedLibrary.filterIds ? selectedLibrary.filterIds.includes(p.id) : p.chapter === selectedLibrary.chapterFilter);
          const mirrorCombinedText = mirrorLibPages.map(p => p.text).join("\n\n");
          mirrorChapter = { id: selectedLibrary.chapterFilter, title: selectedLibrary.label, subtitle: selectedLibrary.subtitle, content: mirrorCombinedText, reflection: "" };

          // Wrap LibrarySection as Section for BilingualReader (pad to 4-tuple)
          const emptyChapter: Chapter = { id: 0, title: "", subtitle: "", content: "", reflection: "" };
          section = { id: selectedLibrary.id, label: selectedLibrary.label, subtitle: selectedLibrary.subtitle, color: selectedLibrary.color, chapters: [chapter, emptyChapter, emptyChapter, emptyChapter] };
          pIdx = libraryPageIndex;
          setPIdx = setLibraryPageIndex;
        } else {
          return null;
        }

        return (
          <BilingualReader
            chapter={chapter}
            mirrorChapter={mirrorChapter}
            section={section}
            pageIndex={pIdx}
            setPageIndex={setPIdx}
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
        );
      })()}
    </div>
  );
}
