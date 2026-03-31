/**
 * SIM Data: Poll 2 — Q1 Strategy Alignment (Live Interactive)
 * Per-cube I/O for Moderator and User simulation roles.
 *
 * Cube 4: Web_Results format with native_language per response
 * Cube 6: Phase A (333/111/33 summaries) + Phase B (Theme01 → Theme2_9/6/3)
 *
 * SCALED TO 33 RESPONSES.
 */

import type { ThemeLevels } from "./index";

export const POLL_2 = {
  sessionId: "a1b2c3d4-e5f6-7890-abcd-111111111111",
  title: "eXeL AI Polling - Strategy Alignment",
  pollingMode: "live_interactive" as const,
  questions: [
    {
      text: "What should be our top strategic priority for Q1?",
      id: "q1-222222",
    },
  ],

  cube1: {
    moderator: {
      stateFlow: [
        "draft",
        "open",
        "polling",
        "closed",
        "theming",
        "visuals",
        "ranking",
        "archived",
      ] as const,
    },
    user: {
      joinCode: "DEMO2026",
      tokensOnJoin: { si: 1, ai: 5, hi: 0 },
    },
  },

  cube2: {
    aiResponses: [
      {
        user: "AI User 1",
        text: "Revenue growth should be priority #1. We need to close enterprise deals and expand our ARR by at least 40% this quarter.",
        delayMs: 2000,
        theme: "growth",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 2",
        text: "La retenci\u00f3n de clientes es m\u00e1s importante que la adquisici\u00f3n. Nuestra tasa de abandono es del 8% mensual \u2014 arreglar eso duplica el LTV sin nuevo gasto.",
        delayMs: 4500,
        theme: "retention",
        languageCode: "es",
        nativeLanguage: "Spanish",
      },
      {
        user: "AI User 3",
        text: "We should invest in team building and culture. Burnout is high after the product push. Sustainable pace means sustainable growth.",
        delayMs: 7000,
        theme: "culture",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 4",
        text: "Die Marktexpansion nach Lateinamerika und Europa sollte der Fokus sein. Unser Produkt ist reif genug \u2014 wir brauchen neue Geographien f\u00fcr Wachstum.",
        delayMs: 9500,
        theme: "growth",
        languageCode: "de",
        nativeLanguage: "German",
      },
      {
        user: "AI User 5",
        text: "Technical debt is slowing us down. Every new feature takes 2x longer because of shortcuts from last year. Q1 should be cleanup.",
        delayMs: 12000,
        theme: "culture",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 6",
        text: "Las alianzas estrat\u00e9gicas con productos complementarios acelerar\u00edan el crecimiento sin aumentar proporcionalmente la plantilla.",
        delayMs: 14500,
        theme: "growth",
        languageCode: "es",
        nativeLanguage: "Spanish",
      },
      {
        user: "AI User 7",
        text: "Customer success and support need investment. Happy customers expand their usage \u2014 that's the most efficient growth lever.",
        delayMs: 17000,
        theme: "retention",
        languageCode: "en",
        nativeLanguage: "English",
      },
    ],
  },

  cube3: {
    voiceTranscript: {
      text: "I believe our top priority should be reducing customer churn because retaining existing customers is more cost-effective than acquiring new ones.",
      confidence: 0.92,
      provider: "whisper" as const,
    },
  },

  // ── Cube 4: Web_Results format (collected responses) ─────────
  cube4: {
    collectedResponses: [
      {
        q_number: "Q-0001",
        question: "What should be our top strategic priority for Q1?",
        user: "AI User 1",
        detailed_results: "Revenue growth should be priority #1. We need to close enterprise deals and expand our ARR by at least 40% this quarter.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What should be our top strategic priority for Q1?",
        user: "AI User 2",
        detailed_results: "La retenci\u00f3n de clientes es m\u00e1s importante que la adquisici\u00f3n. Nuestra tasa de abandono es del 8% mensual \u2014 arreglar eso duplica el LTV sin nuevo gasto.",
        response_language: "Spanish",
        native_language: "es",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What should be our top strategic priority for Q1?",
        user: "AI User 3",
        detailed_results: "We should invest in team building and culture. Burnout is high after the product push. Sustainable pace means sustainable growth.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What should be our top strategic priority for Q1?",
        user: "AI User 4",
        detailed_results: "Die Marktexpansion nach Lateinamerika und Europa sollte der Fokus sein. Unser Produkt ist reif genug \u2014 wir brauchen neue Geographien f\u00fcr Wachstum.",
        response_language: "German",
        native_language: "de",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What should be our top strategic priority for Q1?",
        user: "AI User 5",
        detailed_results: "Technical debt is slowing us down. Every new feature takes 2x longer because of shortcuts from last year. Q1 should be cleanup.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What should be our top strategic priority for Q1?",
        user: "AI User 6",
        detailed_results: "Las alianzas estrat\u00e9gicas con productos complementarios acelerar\u00edan el crecimiento sin aumentar proporcionalmente la plantilla.",
        response_language: "Spanish",
        native_language: "es",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What should be our top strategic priority for Q1?",
        user: "AI User 7",
        detailed_results: "Customer success and support need investment. Happy customers expand their usage \u2014 that's the most efficient growth lever.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
    ],
    responseCount: { total: 33, text_count: 31, voice_count: 2 },
    languageBreakdown: [
      { language_code: "en", count: 18 },
      { language_code: "es", count: 9 },
      { language_code: "de", count: 6 },
    ],
  },

  // ── Cube 6: AI Theme Pipeline Output ─────────────────────────
  cube6: {
    // Phase A: Live per-response summaries (333/111/33 words)
    summaries: [
      {
        user: "AI User 1",
        summary_333: "Revenue growth should be priority number one. The focus should be on closing enterprise deals and expanding annual recurring revenue by at least 40% this quarter.",
        summary_111: "Revenue growth is the top priority. Close enterprise deals and grow ARR by 40% this quarter.",
        summary_33: "Revenue growth priority. Close enterprise deals, expand ARR by 40%.",
      },
      {
        user: "AI User 2",
        summary_333: "Customer retention matters more than acquisition. With an 8% monthly churn rate, fixing retention would double lifetime value without requiring new customer acquisition spending.",
        summary_111: "Customer retention is more important than acquisition. Fixing 8% monthly churn doubles LTV without new spend.",
        summary_33: "Retention over acquisition. Fix 8% churn to double LTV.",
      },
      {
        user: "AI User 3",
        summary_333: "Investment in team building and culture is essential. Burnout levels are high following the recent product push. Sustainable pace leads to sustainable growth over time.",
        summary_111: "Team building and culture investment needed. Burnout is high post-product push. Sustainable pace enables sustainable growth.",
        summary_33: "Team culture investment needed. Burnout high. Sustainable pace enables growth.",
      },
      {
        user: "AI User 4",
        summary_333: "Market expansion into Latin America and Europe should be the strategic focus. The product is mature enough for international markets and new geographies are essential for continued growth.",
        summary_111: "Market expansion into LATAM and Europe should be the focus. Product maturity supports new geographic growth.",
        summary_33: "LATAM/Europe expansion focus. Product mature enough for new geographies.",
      },
      {
        user: "AI User 5",
        summary_333: "Technical debt is the primary bottleneck. Every new feature takes twice as long due to accumulated shortcuts from the previous year. Q1 should prioritize codebase cleanup.",
        summary_111: "Technical debt slows progress. Features take 2x longer due to past shortcuts. Q1 should focus on cleanup.",
        summary_33: "Technical debt slows progress. Q1 should be codebase cleanup.",
      },
      {
        user: "AI User 6",
        summary_333: "Strategic partnerships with complementary products would accelerate growth significantly without requiring a proportional increase in headcount or operational costs.",
        summary_111: "Strategic partnerships with complementary products accelerate growth without proportional headcount increase.",
        summary_33: "Strategic partnerships accelerate growth without headcount increase.",
      },
      {
        user: "AI User 7",
        summary_333: "Customer success and support require investment. Happy customers naturally expand their usage, making retention the most efficient and cost-effective growth lever available.",
        summary_111: "Customer success needs investment. Happy customers expand usage \u2014 the most efficient growth lever.",
        summary_33: "Customer success investment needed. Happy customers are best growth lever.",
      },
    ],
    // Phase B: Theme01 classification
    theme01Classification: [
      { user: "AI User 1", theme01: "Supporting Comments", theme01_confidence: 92 },
      { user: "AI User 2", theme01: "Risk & Concerns", theme01_confidence: 86 },
      { user: "AI User 3", theme01: "Neutral Comments", theme01_confidence: 70 },
      { user: "AI User 4", theme01: "Supporting Comments", theme01_confidence: 88 },
      { user: "AI User 5", theme01: "Risk & Concerns", theme01_confidence: 83 },
      { user: "AI User 6", theme01: "Supporting Comments", theme01_confidence: 90 },
      { user: "AI User 7", theme01: "Supporting Comments", theme01_confidence: 85 },
    ],
    theme01Partitions: {
      "Supporting Comments": 16,
      "Risk & Concerns": 10,
      "Neutral Comments": 7,
    },
    marbleGroups: [
      { groupIndex: 0, size: 10, seed: 42 },
      { groupIndex: 1, size: 10, seed: 43 },
      { groupIndex: 2, size: 10, seed: 44 },
      { groupIndex: 3, size: 3, seed: 45 },
    ],
    theme2Hierarchy: {
      theme2_9: [
        { label: "Revenue Growth Strategy", confidence: 0.93, partition: "Supporting Comments" },
        { label: "Geographic Expansion", confidence: 0.88, partition: "Supporting Comments" },
        { label: "Strategic Partnerships", confidence: 0.86, partition: "Supporting Comments" },
        { label: "Customer Success Investment", confidence: 0.85, partition: "Supporting Comments" },
        { label: "Churn Reduction Urgency", confidence: 0.87, partition: "Risk & Concerns" },
        { label: "Technical Debt Burden", confidence: 0.83, partition: "Risk & Concerns" },
        { label: "Product Innovation", confidence: 0.81, partition: "Supporting Comments" },
        { label: "Market Competition Risk", confidence: 0.79, partition: "Risk & Concerns" },
        { label: "Team Wellbeing Culture", confidence: 0.78, partition: "Neutral Comments" },
      ],
      theme2_6: [
        { label: "Revenue & Market Growth", confidence: 0.92, partition: "Supporting Comments" },
        { label: "Partnerships & Expansion", confidence: 0.87, partition: "Supporting Comments" },
        { label: "Customer Retention Focus", confidence: 0.86, partition: "Risk & Concerns" },
        { label: "Technical Sustainability", confidence: 0.83, partition: "Risk & Concerns" },
        { label: "Customer Success", confidence: 0.85, partition: "Supporting Comments" },
        { label: "Team & Culture Health", confidence: 0.78, partition: "Neutral Comments" },
      ],
      theme2_3: [
        { label: "Revenue & Growth", confidence: 0.93, partition: "Supporting Comments" },
        { label: "Customer Retention", confidence: 0.89, partition: "Risk & Concerns" },
        { label: "Team & Technical Health", confidence: 0.86, partition: "Neutral Comments" },
      ],
    },
    themeAssignments: [
      { user: "AI User 1", theme2_9: "Revenue Growth Strategy", theme2_9_confidence: 93, theme2_6: "Revenue & Market Growth", theme2_6_confidence: 92, theme2_3: "Revenue & Growth", theme2_3_confidence: 94 },
      { user: "AI User 2", theme2_9: "Churn Reduction Urgency", theme2_9_confidence: 87, theme2_6: "Customer Retention Focus", theme2_6_confidence: 86, theme2_3: "Customer Retention", theme2_3_confidence: 89 },
      { user: "AI User 3", theme2_9: "Team Wellbeing Culture", theme2_9_confidence: 78, theme2_6: "Team & Culture Health", theme2_6_confidence: 77, theme2_3: "Team & Technical Health", theme2_3_confidence: 80 },
      { user: "AI User 4", theme2_9: "Geographic Expansion", theme2_9_confidence: 89, theme2_6: "Partnerships & Expansion", theme2_6_confidence: 88, theme2_3: "Revenue & Growth", theme2_3_confidence: 90 },
      { user: "AI User 5", theme2_9: "Technical Debt Burden", theme2_9_confidence: 84, theme2_6: "Technical Sustainability", theme2_6_confidence: 83, theme2_3: "Team & Technical Health", theme2_3_confidence: 86 },
      { user: "AI User 6", theme2_9: "Strategic Partnerships", theme2_9_confidence: 87, theme2_6: "Partnerships & Expansion", theme2_6_confidence: 86, theme2_3: "Revenue & Growth", theme2_3_confidence: 88 },
      { user: "AI User 7", theme2_9: "Customer Success Investment", theme2_9_confidence: 86, theme2_6: "Customer Success", theme2_6_confidence: 85, theme2_3: "Customer Retention", theme2_3_confidence: 87 },
    ],
  },

  // ── Theme Levels (dynamic voting: 3/6/9 themes) ────────────
  themeLevels: {
    theme2_9: [
      { id: "t1", name: "Revenue Growth Strategy", confidence: 0.93, count: 6, color: "#22C55E", partition: "Supporting Comments" },
      { id: "t2", name: "Geographic Expansion", confidence: 0.88, count: 4, color: "#16A34A", partition: "Supporting Comments" },
      { id: "t3", name: "Strategic Partnerships", confidence: 0.86, count: 3, color: "#15803D", partition: "Supporting Comments" },
      { id: "t4", name: "Customer Success Investment", confidence: 0.85, count: 3, color: "#4ADE80", partition: "Supporting Comments" },
      { id: "t5", name: "Churn Reduction Urgency", confidence: 0.87, count: 4, color: "#EF4444", partition: "Risk & Concerns" },
      { id: "t6", name: "Technical Debt Burden", confidence: 0.83, count: 3, color: "#DC2626", partition: "Risk & Concerns" },
      { id: "t7", name: "Product Innovation", confidence: 0.81, count: 3, color: "#4ADE80", partition: "Supporting Comments" },
      { id: "t8", name: "Market Competition Risk", confidence: 0.79, count: 3, color: "#B91C1C", partition: "Risk & Concerns" },
      { id: "t9", name: "Team Wellbeing Culture", confidence: 0.78, count: 4, color: "#3B82F6", partition: "Neutral Comments" },
    ],
    theme2_6: [
      { id: "t1", name: "Revenue & Market Growth", confidence: 0.92, count: 8, color: "#22C55E", partition: "Supporting Comments" },
      { id: "t2", name: "Partnerships & Expansion", confidence: 0.87, count: 6, color: "#16A34A", partition: "Supporting Comments" },
      { id: "t3", name: "Customer Retention Focus", confidence: 0.86, count: 5, color: "#EF4444", partition: "Risk & Concerns" },
      { id: "t4", name: "Technical Sustainability", confidence: 0.83, count: 5, color: "#DC2626", partition: "Risk & Concerns" },
      { id: "t5", name: "Customer Success", confidence: 0.85, count: 5, color: "#15803D", partition: "Supporting Comments" },
      { id: "t6", name: "Team & Culture Health", confidence: 0.78, count: 4, color: "#3B82F6", partition: "Neutral Comments" },
    ],
    theme2_3: [
      { id: "t1", name: "Revenue & Growth", confidence: 0.93, count: 16, color: "#22C55E", partition: "Supporting Comments" },
      { id: "t2", name: "Customer Retention", confidence: 0.89, count: 10, color: "#EF4444", partition: "Risk & Concerns" },
      { id: "t3", name: "Team & Technical Health", confidence: 0.86, count: 7, color: "#3B82F6", partition: "Neutral Comments" },
    ],
  } satisfies ThemeLevels,

  // ── Legacy themes (backward compat — Theme2_3 level) ────────
  themes: [
    {
      id: "t1",
      name: "Revenue & Growth",
      confidence: 0.93,
      count: 16,
      color: "#22C55E",
    },
    {
      id: "t2",
      name: "Customer Retention",
      confidence: 0.89,
      count: 10,
      color: "#EF4444",
    },
    {
      id: "t3",
      name: "Team & Technical Health",
      confidence: 0.86,
      count: 7,
      color: "#3B82F6",
    },
  ],
} as const;
