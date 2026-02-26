/**
 * SIM Data: Poll 3 — AI Governance (Live Interactive)
 * Per-cube I/O for Moderator and User simulation roles.
 *
 * Cube 4: Web_Results format with native_language per response
 * Cube 6: Phase A (333/111/33 summaries) + Phase B (Theme01 → Theme2_9/6/3)
 *
 * SCALED TO 5000 RESPONSES for large-scale simulation testing.
 */

import type { ThemeLevels } from "./index";

export const POLL_3 = {
  sessionId: "c3d4e5f6-a7b8-9012-cdef-333333333333",
  title: "Collaborative Thoughts on AI Governance",
  pollingMode: "live_interactive" as const,
  questions: [
    {
      text: "How should AI shape collective decision-making?",
      id: "q1-333333",
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
      joinCode: "PAST0001",
      tokensOnJoin: { si: 1, ai: 5, hi: 0 },
    },
  },

  cube2: {
    aiResponses: [
      {
        user: "AI User 1",
        text: "AI can democratize decision-making by processing millions of voices simultaneously, something human-only systems can't achieve at scale.",
        delayMs: 2000,
        theme: "opportunity",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 2",
        text: "Meine gr\u00f6\u00dfte Sorge ist algorithmische Voreingenommenheit in der KI-Governance. Wenn die Trainingsdaten historische Vorurteile widerspiegeln, wird die KI Ungleichheit verewigen.",
        delayMs: 4500,
        theme: "concern",
        languageCode: "de",
        nativeLanguage: "German",
      },
      {
        user: "AI User 3",
        text: "We should consider a hybrid approach \u2014 AI processes data and identifies patterns, but humans make final governance decisions.",
        delayMs: 7000,
        theme: "balanced",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 4",
        text: "El potencial para la adaptaci\u00f3n de gobernanza en tiempo real es enorme. Las pol\u00edticas pueden responder a los comentarios de los ciudadanos en horas en lugar de a\u00f1os.",
        delayMs: 9500,
        theme: "opportunity",
        languageCode: "es",
        nativeLanguage: "Spanish",
      },
      {
        user: "AI User 5",
        text: "Data privacy is non-negotiable. Any AI governance system accessing citizen data needs iron-clad privacy protections and transparency.",
        delayMs: 12000,
        theme: "concern",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 6",
        text: "AI-assisted polling could bridge the gap between representative and direct democracy by making large-scale participation feasible.",
        delayMs: 14500,
        theme: "opportunity",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 7",
        text: "Historische Pr\u00e4zedenzf\u00e4lle zeigen, dass die Einf\u00fchrung von Technologie in der Governance einen schrittweisen Vertrauensaufbau erfordert. Beginnen Sie mit Entscheidungen mit geringem Risiko.",
        delayMs: 17000,
        theme: "balanced",
        languageCode: "de",
        nativeLanguage: "German",
      },
    ],
  },

  cube3: {
    voiceTranscript: {
      text: "I think AI governance should focus on transparency and explainability so citizens can understand and trust the decision-making process.",
      confidence: 0.91,
      provider: "whisper" as const,
    },
  },

  // ── Cube 4: Web_Results format (collected responses) ─────────
  cube4: {
    collectedResponses: [
      {
        q_number: "Q-0001",
        question: "How should AI shape collective decision-making?",
        user: "AI User 1",
        detailed_results: "AI can democratize decision-making by processing millions of voices simultaneously, something human-only systems can't achieve at scale.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "How should AI shape collective decision-making?",
        user: "AI User 2",
        detailed_results: "Meine gr\u00f6\u00dfte Sorge ist algorithmische Voreingenommenheit in der KI-Governance. Wenn die Trainingsdaten historische Vorurteile widerspiegeln, wird die KI Ungleichheit verewigen.",
        response_language: "German",
        native_language: "de",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "How should AI shape collective decision-making?",
        user: "AI User 3",
        detailed_results: "We should consider a hybrid approach \u2014 AI processes data and identifies patterns, but humans make final governance decisions.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "How should AI shape collective decision-making?",
        user: "AI User 4",
        detailed_results: "El potencial para la adaptaci\u00f3n de gobernanza en tiempo real es enorme. Las pol\u00edticas pueden responder a los comentarios de los ciudadanos en horas en lugar de a\u00f1os.",
        response_language: "Spanish",
        native_language: "es",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "How should AI shape collective decision-making?",
        user: "AI User 5",
        detailed_results: "Data privacy is non-negotiable. Any AI governance system accessing citizen data needs iron-clad privacy protections and transparency.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "How should AI shape collective decision-making?",
        user: "AI User 6",
        detailed_results: "AI-assisted polling could bridge the gap between representative and direct democracy by making large-scale participation feasible.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "How should AI shape collective decision-making?",
        user: "AI User 7",
        detailed_results: "Historische Pr\u00e4zedenzf\u00e4lle zeigen, dass die Einf\u00fchrung von Technologie in der Governance einen schrittweisen Vertrauensaufbau erfordert. Beginnen Sie mit Entscheidungen mit geringem Risiko.",
        response_language: "German",
        native_language: "de",
        source: "text",
      },
    ],
    responseCount: { total: 5000, text_count: 4850, voice_count: 150 },
    languageBreakdown: [
      { language_code: "en", count: 2800 },
      { language_code: "de", count: 900 },
      { language_code: "es", count: 750 },
      { language_code: "fr", count: 350 },
      { language_code: "other", count: 200 },
    ],
  },

  // ── Cube 6: AI Theme Pipeline Output ─────────────────────────
  cube6: {
    // Phase A: Live per-response summaries (333/111/33 words)
    summaries: [
      {
        user: "AI User 1",
        summary_333: "AI can democratize decision-making by processing millions of voices simultaneously, something human-only systems can't achieve at scale.",
        summary_111: "AI democratizes decision-making by processing millions of voices simultaneously, beyond human system capacity.",
        summary_33: "AI democratizes decisions by processing millions of voices at scale.",
      },
      {
        user: "AI User 2",
        summary_333: "The biggest concern is algorithmic bias in AI governance. If training data reflects historical biases, AI systems will perpetuate and amplify existing societal inequality.",
        summary_111: "Algorithmic bias is the biggest AI governance concern. Biased training data perpetuates societal inequality.",
        summary_33: "Algorithmic bias perpetuates inequality through biased training data.",
      },
      {
        user: "AI User 3",
        summary_333: "A hybrid approach is recommended where AI processes data and identifies patterns while humans retain final authority over governance decisions ensuring accountability.",
        summary_111: "Hybrid approach recommended: AI processes data and identifies patterns, humans make final governance decisions.",
        summary_33: "Hybrid approach: AI processes data, humans make final decisions.",
      },
      {
        user: "AI User 4",
        summary_333: "The potential for real-time governance adaptation is enormous. Policies could respond to citizen feedback within hours rather than the years required by traditional legislative processes.",
        summary_111: "Real-time governance adaptation potential is enormous. Policies respond to citizen feedback in hours, not years.",
        summary_33: "Real-time governance: policies respond to citizens in hours, not years.",
      },
      {
        user: "AI User 5",
        summary_333: "Data privacy is non-negotiable for AI governance. Any system accessing citizen data must have iron-clad privacy protections, full transparency, and citizen oversight mechanisms.",
        summary_111: "Data privacy is non-negotiable. AI governance systems need iron-clad protections and full transparency.",
        summary_33: "Data privacy non-negotiable. AI governance needs iron-clad protections.",
      },
      {
        user: "AI User 6",
        summary_333: "AI-assisted polling could bridge the gap between representative and direct democracy by making large-scale citizen participation feasible and meaningful for policy decisions.",
        summary_111: "AI polling bridges representative and direct democracy through large-scale feasible participation.",
        summary_33: "AI polling bridges representative and direct democracy at scale.",
      },
      {
        user: "AI User 7",
        summary_333: "Historical precedent demonstrates that technology adoption in governance requires gradual trust-building with citizens. The approach should begin with low-stakes decisions before scaling.",
        summary_111: "History shows governance tech needs gradual trust-building. Start with low-stakes decisions first.",
        summary_33: "Governance tech needs gradual trust. Start with low-stakes decisions.",
      },
    ],
    // Phase B: Theme01 classification
    theme01Classification: [
      { user: "AI User 1", theme01: "Supporting Comments", theme01_confidence: 92 },
      { user: "AI User 2", theme01: "Risk & Concerns", theme01_confidence: 90 },
      { user: "AI User 3", theme01: "Neutral Comments", theme01_confidence: 85 },
      { user: "AI User 4", theme01: "Supporting Comments", theme01_confidence: 89 },
      { user: "AI User 5", theme01: "Risk & Concerns", theme01_confidence: 88 },
      { user: "AI User 6", theme01: "Supporting Comments", theme01_confidence: 91 },
      { user: "AI User 7", theme01: "Neutral Comments", theme01_confidence: 80 },
    ],
    theme01Partitions: {
      "Supporting Comments": 1950,
      "Risk & Concerns": 1660,
      "Neutral Comments": 1390,
    },
    marbleGroups: [
      { groupIndex: 0, size: 500, seed: 42 },
      { groupIndex: 1, size: 500, seed: 43 },
      { groupIndex: 2, size: 500, seed: 44 },
      { groupIndex: 3, size: 500, seed: 45 },
      { groupIndex: 4, size: 500, seed: 46 },
      { groupIndex: 5, size: 500, seed: 47 },
      { groupIndex: 6, size: 500, seed: 48 },
      { groupIndex: 7, size: 500, seed: 49 },
      { groupIndex: 8, size: 500, seed: 50 },
      { groupIndex: 9, size: 500, seed: 51 },
    ],
    theme2Hierarchy: {
      theme2_9: [
        { label: "Democratic Scale Innovation", confidence: 0.92, partition: "Supporting Comments" },
        { label: "Real-Time Policy Adaptation", confidence: 0.89, partition: "Supporting Comments" },
        { label: "Participatory Democracy Bridge", confidence: 0.88, partition: "Supporting Comments" },
        { label: "Algorithmic Bias Risks", confidence: 0.90, partition: "Risk & Concerns" },
        { label: "Privacy Protection Imperatives", confidence: 0.87, partition: "Risk & Concerns" },
        { label: "Transparency & Explainability", confidence: 0.86, partition: "Supporting Comments" },
        { label: "Hybrid Governance Models", confidence: 0.85, partition: "Neutral Comments" },
        { label: "Regulatory Framework Needs", confidence: 0.84, partition: "Risk & Concerns" },
        { label: "Incremental Trust Building", confidence: 0.80, partition: "Neutral Comments" },
      ],
      theme2_6: [
        { label: "AI Democratization Potential", confidence: 0.91, partition: "Supporting Comments" },
        { label: "Real-Time Governance", confidence: 0.89, partition: "Supporting Comments" },
        { label: "Algorithmic Bias & Privacy", confidence: 0.89, partition: "Risk & Concerns" },
        { label: "Data Protection Standards", confidence: 0.87, partition: "Risk & Concerns" },
        { label: "Human-AI Collaboration", confidence: 0.85, partition: "Neutral Comments" },
        { label: "Gradual Adoption Strategy", confidence: 0.80, partition: "Neutral Comments" },
      ],
      theme2_3: [
        { label: "Opportunity & Innovation", confidence: 0.92, partition: "Supporting Comments" },
        { label: "Risk & Concerns", confidence: 0.88, partition: "Risk & Concerns" },
        { label: "Balanced / Hybrid Approach", confidence: 0.85, partition: "Neutral Comments" },
      ],
    },
    themeAssignments: [
      { user: "AI User 1", theme2_9: "Democratic Scale Innovation", theme2_9_confidence: 93, theme2_6: "AI Democratization Potential", theme2_6_confidence: 91, theme2_3: "Opportunity & Innovation", theme2_3_confidence: 92 },
      { user: "AI User 2", theme2_9: "Algorithmic Bias Risks", theme2_9_confidence: 91, theme2_6: "Algorithmic Bias & Privacy", theme2_6_confidence: 90, theme2_3: "Risk & Concerns", theme2_3_confidence: 90 },
      { user: "AI User 3", theme2_9: "Hybrid Governance Models", theme2_9_confidence: 86, theme2_6: "Human-AI Collaboration", theme2_6_confidence: 85, theme2_3: "Balanced / Hybrid Approach", theme2_3_confidence: 87 },
      { user: "AI User 4", theme2_9: "Real-Time Policy Adaptation", theme2_9_confidence: 90, theme2_6: "Real-Time Governance", theme2_6_confidence: 89, theme2_3: "Opportunity & Innovation", theme2_3_confidence: 91 },
      { user: "AI User 5", theme2_9: "Privacy Protection Imperatives", theme2_9_confidence: 88, theme2_6: "Data Protection Standards", theme2_6_confidence: 87, theme2_3: "Risk & Concerns", theme2_3_confidence: 89 },
      { user: "AI User 6", theme2_9: "Participatory Democracy Bridge", theme2_9_confidence: 89, theme2_6: "AI Democratization Potential", theme2_6_confidence: 88, theme2_3: "Opportunity & Innovation", theme2_3_confidence: 90 },
      { user: "AI User 7", theme2_9: "Incremental Trust Building", theme2_9_confidence: 81, theme2_6: "Gradual Adoption Strategy", theme2_6_confidence: 80, theme2_3: "Balanced / Hybrid Approach", theme2_3_confidence: 82 },
    ],
  },

  // ── Theme Levels (dynamic voting: 3/6/9 themes) ────────────
  themeLevels: {
    theme2_9: [
      { id: "t1", name: "Democratic Scale Innovation", confidence: 0.92, count: 750, color: "#22C55E", partition: "Supporting Comments" },
      { id: "t2", name: "Real-Time Policy Adaptation", confidence: 0.89, count: 620, color: "#16A34A", partition: "Supporting Comments" },
      { id: "t3", name: "Participatory Democracy Bridge", confidence: 0.88, count: 580, color: "#15803D", partition: "Supporting Comments" },
      { id: "t4", name: "Algorithmic Bias Risks", confidence: 0.90, count: 680, color: "#EF4444", partition: "Risk & Concerns" },
      { id: "t5", name: "Privacy Protection Imperatives", confidence: 0.87, count: 610, color: "#DC2626", partition: "Risk & Concerns" },
      { id: "t6", name: "Transparency & Explainability", confidence: 0.86, count: 370, color: "#4ADE80", partition: "Supporting Comments" },
      { id: "t7", name: "Hybrid Governance Models", confidence: 0.85, count: 530, color: "#3B82F6", partition: "Neutral Comments" },
      { id: "t8", name: "Regulatory Framework Needs", confidence: 0.84, count: 440, color: "#B91C1C", partition: "Risk & Concerns" },
      { id: "t9", name: "Incremental Trust Building", confidence: 0.80, count: 420, color: "#2563EB", partition: "Neutral Comments" },
    ],
    theme2_6: [
      { id: "t1", name: "AI Democratization Potential", confidence: 0.91, count: 1100, color: "#22C55E", partition: "Supporting Comments" },
      { id: "t2", name: "Real-Time Governance", confidence: 0.89, count: 850, color: "#16A34A", partition: "Supporting Comments" },
      { id: "t3", name: "Algorithmic Bias & Privacy", confidence: 0.89, count: 940, color: "#EF4444", partition: "Risk & Concerns" },
      { id: "t4", name: "Data Protection Standards", confidence: 0.87, count: 720, color: "#DC2626", partition: "Risk & Concerns" },
      { id: "t5", name: "Human-AI Collaboration", confidence: 0.85, count: 810, color: "#3B82F6", partition: "Neutral Comments" },
      { id: "t6", name: "Gradual Adoption Strategy", confidence: 0.80, count: 580, color: "#2563EB", partition: "Neutral Comments" },
    ],
    theme2_3: [
      { id: "t1", name: "Opportunity & Innovation", confidence: 0.92, count: 1950, color: "#22C55E", partition: "Supporting Comments" },
      { id: "t2", name: "Risk & Concerns", confidence: 0.88, count: 1660, color: "#EF4444", partition: "Risk & Concerns" },
      { id: "t3", name: "Balanced / Hybrid Approach", confidence: 0.85, count: 1390, color: "#3B82F6", partition: "Neutral Comments" },
    ],
  } satisfies ThemeLevels,

  // ── Legacy themes (backward compat — Theme2_3 level) ────────
  themes: [
    {
      id: "t1",
      name: "Opportunity & Innovation",
      confidence: 0.92,
      count: 1950,
      color: "#22C55E",
    },
    {
      id: "t2",
      name: "Risk & Concerns",
      confidence: 0.88,
      count: 1660,
      color: "#EF4444",
    },
    {
      id: "t3",
      name: "Balanced / Hybrid Approach",
      confidence: 0.85,
      count: 1390,
      color: "#3B82F6",
    },
  ],
} as const;
